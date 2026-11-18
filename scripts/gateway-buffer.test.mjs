import test from 'node:test';
import assert from 'node:assert/strict';
import { createGateway, hash } from '../integration/gateway/core.mjs';
import { providerAdapters } from '../integration/gateway/providers.mjs';

const copy='Approved fixture — exact copy.\n\nhttps://www.theglobalanalyst.com/newsletters';
const channels={twitter:'sahel-x',linkedin:'sahel-linkedin'};

async function fixture({createTimeout=false,readbackMismatch=false,disconnected=false}={}) {
  const client='test-client', token='fixture-token';
  const rows=new Map([
    ['access:'+await hash(token),{value:{client,scope:'tga:read tga:drafts',aud:'https://gateway/mcp'}}],
    ['client:'+client,{value:{client_id:client}}],
    ['config:buffer:channels',{value:channels}],
  ]);
  const store={
    provider:async name=>name==='buffer'?'fixture-buffer-key':null,
    get:async key=>rows.get(key),
    insert:async row=>{if(rows.has(row.key))return false;rows.set(row.key,row);return true;},
    replace:async (key,value)=>rows.set(key,{...rows.get(key),value}),
  };
  const created=[], reads=[], posts=new Map();
  const providers=providerAdapters(store,async(url,{body})=>{
    assert.equal(url,'https://api.buffer.com');
    const {query,variables}=JSON.parse(body);
    if(query.includes('channel(input:')){
      const id=variables.id;
      return Response.json({data:{channel:{id,service:Object.keys(channels).find(s=>channels[s]===id),isDisconnected:disconnected,isLocked:false}}});
    }
    if(query.includes('createPost(')){
      const input=variables.input;
      assert.deepEqual(input,{channelId:input.channelId,text:copy,schedulingType:'automatic',mode:'addToQueue',saveToDraft:true});
      created.push(input);
      const id='draft-'+created.length;
      posts.set(id,{id,text:input.text,status:'draft',channelId:input.channelId,channelService:Object.keys(channels).find(s=>channels[s]===input.channelId)});
      if(createTimeout)throw new Error('timeout after Buffer received the mutation');
      return Response.json({data:{createPost:{post:{id}}}});
    }
    assert.match(query,/post\(input: \{ id: \$id \}\) \{ id text status channelId channelService \}/);
    reads.push(variables.id);
    const post=posts.get(variables.id);
    return Response.json({data:{post:readbackMismatch?{...post,status:'scheduled'}:post}});
  });
  const handle=createGateway({store,providers,base:'https://gateway'});
  async function call(operation,idempotency_key,payload){
    const response=await handle(new Request('https://gateway/v1/operations',{
      method:'POST',headers:{authorization:'Bearer '+token},
      body:JSON.stringify({operation,idempotency_key,payload}),
    }));
    return {status:response.status,body:await response.json()};
  }
  const draft=(key,service='twitter',extra={})=>call('social.draft',key,{channel_id:channels[service],service,text:copy,eic_approved:true,...extra});
  const receipt=key=>call('receipt.get',key);
  return {created,reads,draft,receipt,call,rows};
}

test('approved copy is read back exactly as a private draft on each channel; retries and concurrent aliases deduplicate',async()=>{
  const {created,reads,draft,receipt}=await fixture();
  const requests=await Promise.all([draft('x-draft-primary'),draft('x-draft-secondary'),draft('x-draft-primary')]);
  assert.equal(requests.some(x=>x.body.status==='private_draft'),true);
  const x=await draft('x-draft-secondary');
  const linkedin=await draft('li-draft-primary','linkedin');
  assert.equal(created.length,2);
  assert.deepEqual(reads,['draft-1','draft-2']);
  for(const result of [x,linkedin]){
    assert.equal(result.body.status,'private_draft');
    assert.equal(result.body.readback_verified,true);
    assert.equal(result.body.posted,false);
    assert.equal(result.body.scheduled,false);
  }
  assert.deepEqual(await receipt('x-draft-primary'),x);
  assert.deepEqual(await receipt('x-draft-secondary'),x);
  assert.equal((await draft('x-draft-primary','twitter',{text:copy+' changed'})).status,409);
});

test('unapproved copy, swapped channels, disconnected channels, and scheduling fail before mutation',async()=>{
  const {created,draft,call}=await fixture();
  assert.equal((await draft('x-unapproved','twitter',{eic_approved:false})).status,403);
  assert.equal((await draft('x-swapped-id','twitter',{channel_id:channels.linkedin})).status,403);
  assert.equal((await call('social.schedule','x-schedule',{})).status,403);
  assert.equal(created.length,0);
  const disconnected=await fixture({disconnected:true});
  assert.equal((await disconnected.draft('x-disconnect')).status,403);
  assert.equal(disconnected.created.length,0);
});

test('a timeout or unsafe readback preserves one attempt and blocks a second mutation',async()=>{
  for(const scenario of [{createTimeout:true},{readbackMismatch:true}]){
    const {created,draft,receipt}=await fixture(scenario);
    const first=await draft('uncertain-first');
    assert.equal(first.body.status,'outcome_unknown');
    assert.equal(first.body.automatic_retry,false);
    assert.equal(first.body.provider_id,scenario.readbackMismatch?'draft-1':undefined);
    assert.deepEqual(await receipt('uncertain-first'),first);
    assert.deepEqual(await draft('uncertain-new-key'),first);
    assert.equal(created.length,1);
  }
});

test('the cached tool schema can use a preapproved key for the exact platform and copy only',async()=>{
  const {draft,rows,created}=await fixture();
  const key='x-preapproved';
  const payload={channel_id:channels.twitter,service:'twitter',text:copy};
  rows.set('buffer-approval:'+key,{value:{digest:await hash({name:'social.draft',payload})}});
  assert.equal((await draft(key,'twitter',{eic_approved:undefined,text:copy+' changed'})).status,403);
  assert.equal((await draft(key,'linkedin',{eic_approved:undefined})).status,403);
  assert.equal((await draft(key,'twitter',{eic_approved:undefined})).body.status,'private_draft');
  assert.equal((await draft(key,'twitter',{eic_approved:undefined})).body.status,'private_draft');
  assert.equal(created.length,1);
});

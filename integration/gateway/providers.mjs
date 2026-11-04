import {Failure,hash} from './core.mjs';
import {OWNER} from './publishing.mjs';
export function providerAdapters(store,fetcher=fetch) {
  async function key(name){const k=await store.provider(name);if(!k)throw new Failure(name+'_not_configured',424);return k;}
  async function external(url,token,body,method='POST'){
    const r=await fetcher(url,{method,headers:{Authorization:(url.includes('buttondown')?'Token ':'Bearer ')+token,'Content-Type':'application/json'},body:body===undefined?undefined:JSON.stringify(body),signal:AbortSignal.timeout(20000),redirect:'error'});
    const raw=await r.text();if(raw.length>1000000)throw new Failure('provider_response_too_large',502);
    if(method==='POST'&&url.endsWith('/send-draft')){if(!r.ok)throw new Failure('buttondown_owner_send_rejected',502);return {http_status:r.status};}
    let result;try{result=JSON.parse(raw);}catch{throw new Failure('provider_response_invalid',502);}
    if(!r.ok||result.errors?.length)throw new Failure('provider_request_rejected',502);return result;
  }
  async function graph(query,variables={}){return (await external('https://api.buffer.com',await key('buffer'),{query,variables})).data;}
  async function channel(id){const data=await graph('query($id: ChannelId!) { channel(input: { id: $id }) { id name service } }',{id});return data.channel;}
  const readerBody=s=>(s||'').replace(/^<!-- buttondown-editor-mode: fancy -->\r?\n?/,'').replace(/[\r\n]+$/,'');
  return {
    async status(){return {buttondown:!!(await store.provider('buttondown')),buffer:!!(await store.provider('buffer')),buffer_channel_allowlist:!!(await store.get('config:buffer:channels')),github:!!(await store.provider('github')),gitlab:!!(await store.provider('gitlab')),vercel:!!(await store.provider('vercel'))};},
    async configure(provider,apiKey,channels){
      if(provider==='buttondown')await external('https://api.buttondown.com/v1/emails?page_size=1',apiKey,undefined,'GET');
      else {
        const account=await external('https://api.buffer.com',apiKey,{query:'query { account { organizations { id name } } }'});
        if(!Array.isArray(account.data?.account?.organizations))throw new Failure('buffer_account_readback',502);
        if(channels){
          if(typeof channels!=='object'||Array.isArray(channels)||!Object.keys(channels).length||Object.keys(channels).some(k=>!['twitter','linkedin'].includes(k)))throw new Failure('channel_allowlist');
          for(const [service,id] of Object.entries(channels)){
            const result=await external('https://api.buffer.com',apiKey,{query:'query($id: ChannelId!) { channel(input: { id: $id }) { id service } }',variables:{id}});
            if(result.data?.channel?.id!==id||result.data.channel.service!==service)throw new Failure('buffer_channel_mismatch',403);
          }
        }
      }
      await store.provider(provider,apiKey);
      if(provider==='buffer'&&channels)await store.config('config:buffer:channels',channels);
    },
    async channels(){
      const orgs=(await graph('query { account { organizations { id name } } }'))?.account?.organizations;
      if(!Array.isArray(orgs))throw new Failure('buffer_account_readback',502);
      const channels=[];
      for(const org of orgs.slice(0,5)){
        const result=await graph('query($id: OrganizationId!) { channels(input: { organizationId: $id }) { id name service } }',{id:org.id});
        for(const c of (result.channels||[]).slice(0,40))if(['twitter','linkedin'].includes(c.service))channels.push({...c,organization:org.name});
      }
      return {channels,publication_enabled:false};
    },
    async preflight(name,payload){
      if(['newsletter.draft','newsletter.send_owner'].includes(name)){
        await external('https://api.buttondown.com/v1/emails?page_size=1',await key('buttondown'),undefined,'GET');return;
      }
      await key('buffer');const row=await store.get('config:buffer:channels');
      if(row?.value?.[payload.service]!==payload.channel_id)throw new Failure('buffer_channel_not_allowlisted',403);
      const c=await channel(payload.channel_id);if(c?.id!==payload.channel_id||c.service!==payload.service)throw new Failure('buffer_channel_mismatch',403);
    },
    async sendOwner(payload){
      const draft=await this.draft('newsletter.draft',payload);
      const token=await key('buttondown');
      const saved=await external('https://api.buttondown.com/v1/emails/'+encodeURIComponent(draft.provider_id),token,undefined,'GET');
      if(saved.status!=='draft'||saved.archival_mode!=='disabled'||saved.publish_date!==null||saved.subject!==payload.subject||readerBody(saved.body)!==readerBody(payload.body_html)||saved.metadata?.delivery_mode!=='tga_gateway_private_draft')throw new Failure('owner_draft_readback_mismatch',502);
      const acceptance=await external('https://api.buttondown.com/v1/emails/'+encodeURIComponent(draft.provider_id)+'/send-draft',token,{recipients:[OWNER]});
      return {...draft,status:'owner_send_accepted',recipient:OWNER,recipient_count:1,sent:true,provider_http_status:acceptance.http_status,inbox_delivery_verified:false,subscriber_send:false};
    },
    async draft(name,payload){
      if(name==='newsletter.draft'){
        const token=await key('buttondown');
        const sent={subject:payload.subject,body:'<!-- buttondown-editor-mode: fancy -->\n'+payload.body_html,status:'draft',archival_mode:'disabled',publish_date:null,should_trigger_pay_per_email_billing:false,metadata:{delivery_mode:'tga_gateway_private_draft',content_sha256:await hash(payload)}};
        const created=await external('https://api.buttondown.com/v1/emails',token,sent);
        if(typeof created.id!=='string'||!created.id)throw new Failure('buttondown_identity_missing',502);
        const read=await external('https://api.buttondown.com/v1/emails/'+encodeURIComponent(created.id),token,undefined,'GET');
        if(read.id!==created.id||read.status!=='draft'||read.archival_mode!=='disabled'||read.publish_date!==null||read.subject!==payload.subject||readerBody(read.body)!==readerBody(payload.body_html))throw new Failure('buttondown_readback_mismatch',502);
        return {status:'private_draft',provider:'buttondown',provider_id:created.id,content_sha256:await hash(payload),sent:false,archival_mode:'disabled',readback_verified:true};
      }
      const data=await graph('mutation($input: CreatePostInput!) { createPost(input: $input) { ... on PostActionSuccess { post { id text status } } ... on MutationError { message } } }',
        {input:{channelId:payload.channel_id,text:payload.text,schedulingType:'automatic',mode:'addToQueue',saveToDraft:true}});
      const post=data?.createPost?.post;
      if(!post?.id||post.text!==payload.text||post.status!=='draft')throw new Failure('buffer_draft_readback_mismatch',502);
      return {status:'private_draft',provider:'buffer',provider_id:post.id,service:payload.service,channel_id:payload.channel_id,content_sha256:await hash(payload),posted:false,scheduled:false,saveToDraft:true,readback_verified:true};
    },
  };
}



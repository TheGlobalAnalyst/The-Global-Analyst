import test from 'node:test';
import assert from 'node:assert/strict';
import { parseFragment } from 'parse5';
import { createGateway, edition, hash } from '../integration/gateway/core.mjs';
import { OWNER, ownerNewsletter } from '../integration/gateway/publishing.mjs';
import { providerAdapters } from '../integration/gateway/providers.mjs';
import { approvedHARows } from '../lib/ha-publications.mjs';
import { storyLabel } from '../lib/story-presentation.mjs';

const source = {url:'https://example.org/report', publisher:'Example'};
const article = (headline, role, topic_label) => ({
  headline, role, topic_label, body_markdown:'Approved body', teaser:'Approved teaser', sources:[source],
});
const payload = {
  title:'Sahel Brief', edition_date:'2026-11-17', window_start:'2026-11-16T06:00:00Z', window_end:'2026-11-17T06:00:00Z',
  articles:[
    article('Mali adds Russian aircraft to military airlift','lead','News · Mali'),
    article('Why JNIM sometimes holds back','analysis','Analysis · Sahel and Gulf of Guinea'),
    article('Feature: Money that costs money','analysis','Feature · Sudan / Chad'),
    article('Ordinary news','also','News · Chad'),
  ],
};
const receipt = {status:'hidden_ready',articles:payload.articles.map((_,i)=>({
  article_url:'https://www.theglobalanalyst.com/challenger/v0-'+String(i).repeat(24),
}))};
const hidden={payload,receipt};
const tree=node=>[node,...(node.childNodes||[]).flatMap(tree)];
const titles=(html,tag)=>tree(parseFragment(html)).filter(n=>n.tagName===tag).map(n=>n.childNodes[0].value);

test('owner email uses the lead subject, a masthead and date, and approved genre only in MORE',()=>{
  const before=structuredClone(hidden);
  const mail=ownerNewsletter(hidden);
  assert.equal(mail.subject,payload.articles[0].headline);
  assert.equal(mail.template,'naked');
  assert.deepEqual(titles(mail.body_html,'h1'),['The Sahel Brief']);
  assert.match(mail.body_html,/17 November 2026/);
  assert.deepEqual(titles(mail.body_html,'h2'),['TOP STORIES','MORE','ALSO IMPORTANT']);
  assert.deepEqual(titles(mail.body_html,'h3'),[mail.subject,'Analysis: Why JNIM sometimes holds back','Feature: Money that costs money','Ordinary news']);
  assert.deepEqual(hidden,before);
  assert.equal(ownerNewsletter({...hidden,payload:{...payload,articles:[payload.articles[0],{...payload.articles[2],headline:'Feature: Analysis: & More',genre:'analysis'}] },receipt:{...receipt,articles:receipt.articles.slice(0,2)}}).body_html.includes('Analysis: &amp; More'),true);
});

test('Buttondown confirms the per-draft template before sending to the fixed address only',async()=>{
  let stored;
  const requests=[];
  const mail=ownerNewsletter(hidden);
  const adapters=providerAdapters({provider:async()=> 'fixture-token'},async(url,options)=>{
    const data=options.body&&JSON.parse(options.body);
    requests.push({url,data,method:options.method});
    if(url.endsWith('/send-draft'))return new Response('{}');
    if(options.method==='POST')stored={id:'em_fixture',...data};
    return Response.json(stored);
  });
  const result=await adapters.sendOwner(mail);
  assert.equal(stored.template,'naked');
  assert.equal(stored.subject,mail.subject);
  assert.equal(stored.status,'draft');
  assert.equal(stored.archival_mode,'disabled');
  assert.deepEqual(requests.filter(r=>r.url.endsWith('/send-draft')).map(r=>r.data),[{recipients:[OWNER]}]);
  assert.equal(result.subscriber_send,false);
  assert.equal(result.inbox_delivery_verified,false);
  assert.equal((await adapters.draft('newsletter.draft',{subject:'Unrelated draft',body_html:'<p>Draft</p>'})).sent,false);
  assert.equal(Object.hasOwn(stored,'template'),false);
  const mismatched=providerAdapters({provider:async()=> 'fixture-token'},async(url,options)=>{
    assert.ok(!url.endsWith('/send-draft'));
    if(options.method==='POST')stored={id:'em_fixture',...JSON.parse(options.body)};
    return Response.json({...stored,template:'modern'});
  });
  await assert.rejects(()=>mismatched.sendOwner(mail),/buttondown_readback_mismatch/);
});

test('replay of a stored pre-change owner receipt does not call Buttondown',async()=>{
  const who={client:'test-client',scope:'tga:owner-send',aud:'https://gateway/mcp'};
  const hiddenKey='hidden-123', key='send-1234';
  const oldIdentity={...ownerNewsletter(hidden,{legacy:true}),hidden_key:hiddenKey};
  const previous={status:'owner_send_accepted',recipient_count:1,subscriber_send:false};
  const values=new Map([
    ['access:'+await hash('test-token'),{value:who}],
    ['client:test-client',{value:{client_id:who.client}}],
    ['hidden:op:test-client:'+hiddenKey,{value:{...hidden,client:who.client}}],
    ['op:test-client:'+key,{value:{hash:await hash({name:'newsletter.send_owner',payload:oldIdentity}),receipt:previous}}],
  ]);
  const handle=createGateway({store:{get:async k=>values.get(k)},providers:{},base:'https://gateway'});
  const response=await handle(new Request('https://gateway/v1/operations',{method:'POST',headers:{authorization:'Bearer test-token'},body:JSON.stringify({
    operation:'newsletter.send_owner',idempotency_key:key,payload:{hidden_key:hiddenKey},
  })}));
  assert.equal(response.status,200);
  assert.deepEqual(await response.json(),previous);
});

test('approved editorial labels are optional and do not replace structured geography',()=>{
  const label='Conflict economies';
  const supplied={...payload,articles:[{...payload.articles[0],editorial_topic_label:label,genre:'news'},...payload.articles.slice(1)]};
  assert.equal(edition(supplied),supplied);
  assert.equal(edition(payload),payload);
  assert.throws(()=>edition({...supplied,articles:[{...supplied.articles[0],editorial_topic_label:' '.repeat(81)}]}),/text_contract/);
  const submitted=supplied.articles[0];
  const raw={...submitted,origin:'tga_gateway',visibility:'public',feed_visible:true,verification_state:'source_reviewed',
    eic_approved:true,authorship_evidence:'Approved author',author_role_slug:'news-editor',author_role:'News Editor',
    author_agent_id:'cmvi8b3640lro06adw73784fk',editorial_role:'lead',geography_label:'Sudan · Chad'};
  const row={publication_approved:true,slug:'v0-'+'a'.repeat(24),content_sha256:'a'.repeat(64),published_at:'2026-11-17T06:21:00Z'};
  const [labeled]=approvedHARows([{...row,article:raw}]);
  const [legacy]=approvedHARows([{...row,article:{...raw,editorial_topic_label:undefined}}]);
  assert.deepEqual(labeled.countries,['Sudan · Chad']);
  assert.equal(storyLabel(labeled),label);
  assert.equal(storyLabel(legacy),'Sudan · Chad');
  assert.deepEqual({...labeled,editorial_topic_label:''},legacy);
});

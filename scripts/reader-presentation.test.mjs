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
  const rendered=tree(parseFragment(mail.body_html));
  const logo=rendered.find(node=>node.tagName==='img');
  const attribute=(node,name)=>node.attrs.find(a=>a.name===name)?.value;
  assert.equal(attribute(logo,'src'),'https://www.theglobalanalyst.com/logo.png');
  assert.equal(attribute(logo,'alt'),'The Global Analyst');
  assert.equal(attribute(logo.parentNode,'style'),'text-align:center');
  assert.deepEqual(logo.parentNode.childNodes.map(node=>node.tagName),['img','h1','p']);
  assert.equal(logo.parentNode.childNodes[2].childNodes[0].value,'17 November 2026');
  const links=rendered.filter(node=>node.tagName==='a');
  assert.deepEqual(links.map(link=>attribute(link,'href')),receipt.articles.map(article=>article.article_url));
  assert.ok(links.every(link=>attribute(link,'style')==='color:#d90000;text-decoration:underline'));
  assert.doesNotMatch(ownerNewsletter(hidden,{legacy:true}).body_html,/<img|#d90000/);
  assert.deepEqual(titles(mail.body_html,'h2'),['TOP STORIES','MORE','ALSO IMPORTANT']);
  assert.deepEqual(titles(mail.body_html,'h3'),payload.articles.map(a=>a.headline));
  assert.deepEqual(hidden,before);
  assert.equal(ownerNewsletter({...hidden,payload:{...payload,articles:[payload.articles[0],{...payload.articles[2],headline:'Feature: Analysis: & More',genre:'analysis'}] },receipt:{...receipt,articles:receipt.articles.slice(0,2)}}).body_html.includes('>Feature: Analysis: &amp; More</h3>'),true);
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

const premium = genre => ({...article('A headline & its punctuation', 'more', 'Chad'), genre});
const withMore = (...genres) => ({...payload, articles:[payload.articles[0], ...genres.map(premium), payload.articles.at(-1)]});
const receiptFor = p => ({status:'hidden_ready',articles:p.articles.map((_,i)=>({
  article_url:'https://www.theglobalanalyst.com/challenger/v0-'+String(i).padStart(24,'0'),
}))});

for (const genres of [[],['analysis'],['feature'],['background'],['analysis','feature'],['analysis','background'],['feature','background'],['background','feature']]) {
  test('edition and owner email preserve approved order and genre: '+(genres.join(', ') || 'news only'),()=>{
    const p=withMore(...genres);
    assert.equal(edition(p),p);
    const html=ownerNewsletter({payload:p,receipt:receiptFor(p)}).body_html;
    assert.deepEqual(titles(html,'h2'),['TOP STORIES',...(genres.length?['MORE']:[]),'ALSO IMPORTANT']);
    assert.deepEqual(titles(html,'h3'),p.articles.map(a=>a.headline));
    const labels=tree(parseFragment(html)).filter(n=>n.attrs?.some(a=>a.value==='articleGenre'));
    assert.deepEqual(labels.map(n=>n.childNodes[0].value.toLowerCase()),genres);
  });
}
test('submission rejects invalid placement, genre, order, size and repeats',()=>{
  for (const genre of ['analysis','feature','background']) assert.throws(()=>edition(withMore(genre,genre)),/duplicate_more_genre/);
  assert.throws(()=>edition(withMore('analysis','feature','background')),/more_article_limit/);
  for(const a of [{...premium('news')},{...premium('feature'),role:'top'},premium(undefined),premium('commentary'),{...premium('analysis'),role:'feature'}])
    assert.throws(()=>edition({...payload,articles:[payload.articles[0],a]}));
  assert.throws(()=>edition({...payload,articles:[payload.articles[0],payload.articles.at(-1),premium('analysis')]}),/hierarchy/);
  assert.equal(edition({...payload,articles:[premium('background')]},true).articles[0].genre,'background');
  assert.throws(()=>edition({...payload,articles:[premium('background')]}),/lead/);
  assert.throws(()=>edition({...payload,articles:[payload.articles[0],payload.articles[2],premium('feature')]}),/duplicate_more_genre/);
});

test('a historical edition that predates MORE limits replays its exact receipt only',async()=>{
  const old={...payload,articles:[...payload.articles.slice(0,3),payload.articles[1]]};
  const previous={status:'private_draft',articles:[{role:'analysis'}]};
  const value=new Map([
    ['access:'+await hash('fixture-token'),{client:'fixture',scope:'tga:drafts',aud:'https://gateway/mcp'}],
    ['client:fixture',{client_id:'fixture'}],
    ['op:fixture:original-key',{client:'fixture',hash:await hash({name:'edition.submit',payload:old}),receipt:previous}],
  ]);
  const handle=createGateway({base:'https://gateway',providers:{},store:{get:async k=>({value:value.get(k)})}});
  const call=p=>handle(new Request('https://gateway/v1/operations',{method:'POST',headers:{authorization:'Bearer fixture-token'},
    body:JSON.stringify({operation:'edition.submit',idempotency_key:'original-key',payload:p})}));
  assert.deepEqual(await (await call(old)).json(),previous);
  assert.equal((await call({...old,title:'Changed'})).status,409);
});

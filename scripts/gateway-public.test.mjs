import test from 'node:test';
import assert from 'node:assert/strict';
import {createGateway,hash} from '../integration/gateway/core.mjs';
const who={client:'test-client',scope:'tga:read tga:drafts tga:hidden',aud:'https://gateway/mcp'};
const author={author_role_slug:'news-editor',author_role:'News Editor',author_agent_id:'cmvi8b3640lro06adw73784fk',authorship_evidence:'Writer original doc/approved revision',article_slug:'v0-'+'a'.repeat(24)};
async function fixture(enabled=true){
 const values=new Map([['access:'+await hash('test-token'),{value:who}],['client:test-client',{value:{client_id:'test-client'}}],['public-client:test-client',{value:{enabled,live:enabled}}],['hidden:op:test-client:hidden-123',{value:{client:'test-client',payload:{articles:[{headline:'Test',body_markdown:'News\n\nExact copy'}]},receipt:{status:'hidden_ready',articles:[{slug:'v0-'+'a'.repeat(24)}]}}}]]);
 let writes=0,verified=0;
 const store={get:async k=>values.get(k),publishPublic:async()=>{writes++;return {status:'public_ready'};}};
 const handle=createGateway({store,providers:{},base:'https://gateway',verifyWebsite:async()=>{verified++;return {status:'hidden_content_verified'};}});
 const call=async payload=>{const r=await handle(new Request('https://gateway/v1/operations',{method:'POST',headers:{authorization:'Bearer test-token'},body:JSON.stringify({operation:'website.public',idempotency_key:'public-123',payload})}));return {status:r.status,body:await r.json()};};
 return {call,counts:()=>({writes,verified})};
}
const input=()=>({hidden_key:'hidden-123',eic_approved:true,authors:[author],geography_labels:['Sudan']});
test('unenabled clients cannot gain public publication from existing hidden consent',async()=>{const f=await fixture(false);assert.equal((await f.call(input())).status,403);assert.equal(f.counts().writes,0);});
test('explicit EIC approval is mandatory',async()=>{const f=await fixture();assert.equal((await f.call({...input(),eic_approved:false})).status,403);assert.equal(f.counts().writes,0);});
test('author identity cannot be inferred or mismatched',async()=>{const f=await fixture();const a=input();a.authors=[{...author,author_agent_id:'other'}];assert.equal((await f.call(a)).body.error,'author_identity');assert.equal(f.counts().writes,0);});
test('dry-run verifies hidden edition but never promotes',async()=>{const f=await fixture();assert.equal((await f.call({...input(),dry_run:true})).body.status,'public_promotion_validated');assert.deepEqual(f.counts(),{writes:0,verified:1});});
test('promotion follows hidden verification and dispatches atomic store method',async()=>{const f=await fixture();assert.equal((await f.call(input())).body.status,'public_ready');assert.deepEqual(f.counts(),{writes:1,verified:1});});
import {verifyHidden,verifyPublic} from '../integration/gateway/publishing.mjs';
test('hidden verification checks complete visible body even when its hash marker is correct',async()=>{
 const body='News\n\nExact approved copy.',slug='v0-'+'b'.repeat(24),digest=await hash(body);
 const hidden={payload:{articles:[{headline:'Sudan report',teaser:'Approved teaser',body_markdown:body,sources:[{url:'https://example.org/source'}]}]},receipt:{articles:[{slug,article_url:'https://www.theglobalanalyst.com/challenger/'+slug,content_sha256:digest}]}};
 const html=text=>`<meta name="robots" content="noindex"><article data-content-sha256="${digest}"><h1>Sudan report</h1><p class="standfirst">Approved teaser</p><div class="articleBody"><p>${text}</p></div><a href="https://example.org/source">Source</a></article>`;
 assert.equal((await verifyHidden(hidden,async()=>new Response(html('Exact approved copy.')))).status,'hidden_content_verified');
 await assert.rejects(()=>verifyHidden(hidden,async()=>new Response(html('Altered copy.'))),/hidden_article_readback_mismatch/);
});
test('public verification rejects a page with correct hash marker but altered body',async()=>{
 const body='News\n\nExact approved copy with [evidence](https://example.org/source).';
 const slug='v0-'+'a'.repeat(24),digest=await hash(body);
 const saved={payload:{articles:[{headline:'Sudan report',teaser:'Approved teaser',body_markdown:body,sources:[{url:'https://example.org/source'}]}]},receipt:{status:'public_ready',articles:[{slug,article_url:'https://www.theglobalanalyst.com/articles/'+slug,content_sha256:digest,author_role_slug:'news-editor'}]}};
 const html=text=>`<article data-content-sha256="${digest}"><h1>Sudan report</h1><p class="standfirst">Approved teaser</p><a href="/authors/news-editor">News Editor</a><div class="articleBody"><p>${text} with <a href="https://example.org/source">evidence</a>.</p></div><div>Produced by The Global Analyst’s AI-powered newsroom.</div></article>`;
 assert.equal((await verifyPublic(saved,async()=>new Response(html('Exact approved copy')))).status,'public_content_verified');
 await assert.rejects(()=>verifyPublic(saved,async()=>new Response(html('Altered text'))),/public_body_mismatch/);
});

import {Failure,hash} from './core.mjs';
import {parse} from 'parse5';
import {marked} from 'marked';

export const OWNER='benjaminmoscovici@gmail.com';
export const WEBSITE='https://www.theglobalanalyst.com';
const escape=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));

// Derive email from the exact stored hidden edition. The client cannot supply
// recipients, provider draft IDs, alternate destinations, or replacement copy.
export function ownerNewsletter(hidden) {
  const {payload,receipt}=hidden;
  if(!payload?.articles?.length||receipt?.status!=='hidden_ready'||receipt.articles?.length!==payload.articles.length)throw new Failure('hidden_edition_required',409);
  // The sender already identifies the publication. Put the actual lead in the
  // subject and its approved teaser in the inbox preview, rather than repeating
  // the edition name/date or exposing internal delivery labels to the reader.
  const lead=payload.articles[0];
  if(/[\r\n]/.test(lead.headline))throw new Failure('newsletter_subject',409);
  const html=['<div hidden aria-hidden="true" style="display:none!important;visibility:hidden;mso-hide:all;max-height:0;max-width:0;opacity:0;overflow:hidden">'+escape(lead.teaser)+'</div>'];
  let section='';
  for(const [index,a] of payload.articles.entries()){
    const url=receipt.articles[index].article_url;
    if(!/^https:\/\/www\.theglobalanalyst\.com\/challenger\/v0-[a-f0-9]{24}$/.test(url))throw new Failure('hidden_article_url',409);
    const heading=a.role==='analysis'?'MORE':a.role==='also'?'ALSO IMPORTANT':'TOP STORIES';
    if(heading!==section){html.push('<h2 style="color:#000">'+heading+'</h2>');section=heading;}
    html.push('<h3 style="color:#000">'+escape(a.headline)+'</h3><p>'+escape(a.teaser)+'</p><p><a href="'+url+'">Read the full report</a></p>');
  }
  return {subject:lead.headline,body_html:html.join('')};
}

// HTML parsing decodes entities once; do not erase punctuation, accents or
// Unicode spacing. Only collapse HTML ASCII whitespace used for layout.
const normalizeText=s=>s.replace(/[\t\n\f\r ]+/g,' ').replace(/^ +| +$/g,'');
const attr=(node,name)=>node.attrs?.find(a=>a.name===name)?.value;
const nodes=node=>[node,...(node.childNodes||[]).flatMap(nodes)];
const visibleText=node=>['script','style','template'].includes(node.tagName)||attr(node,'hidden')!==undefined?'':
  node.nodeName==='#text'?node.value:node.tagName==='br'?' ':(node.childNodes||[]).map(visibleText).join('');
const hasClass=(node,name)=>(attr(node,'class')||'').split(/\s+/).includes(name);

export async function verifyHidden(hidden,fetcher=fetch){
  if(!hidden?.receipt?.articles?.length||hidden.receipt.articles.length!==hidden.payload?.articles?.length)throw new Failure('hidden_article_readback_mismatch',424);
  for(const [i,a] of hidden.receipt.articles.entries()){
    if(a.article_url!==WEBSITE+'/challenger/'+a.slug||!/^v0-[a-f0-9]{24}$/.test(a.slug))throw new Failure('hidden_article_url',409);
    const r=await fetcher(a.article_url,{redirect:'error',signal:AbortSignal.timeout(20000)});
    if(!r.ok)throw new Failure('hidden_article_unavailable',424);
    const raw=await r.text();
    if(raw.length>2000000)throw new Failure('hidden_article_readback_mismatch',424);
    const expected=hidden.payload.articles[i], document=nodes(parse(raw));
    const articles=document.filter(n=>n.tagName==='article');
    const article=articles[0], content=article?nodes(article):[];
    const headings=content.filter(n=>n.tagName==='h1');
    const standfirsts=content.filter(n=>hasClass(n,'standfirst'));
    const bodies=content.filter(n=>hasClass(n,'articleBody'));
    const links=new Set(content.filter(n=>n.tagName==='a').map(n=>attr(n,'href')));
    const noindex=document.some(n=>n.tagName==='meta'&&attr(n,'name')?.toLowerCase()==='robots'&&
      (attr(n,'content')||'').toLowerCase().split(/[\s,]+/).includes('noindex'));
    const expectedBodies=[expected.body_markdown,expected.body_markdown.replace(/^(?:News|Analysis|Feature|Explainer)\s*\n+/,'')]
      .map(markdown=>normalizeText(visibleText(parse(marked.parse(markdown)))));
    if(articles.length!==1||attr(article,'data-content-sha256')!==a.content_sha256||
      await hash(expected.body_markdown)!==a.content_sha256||
      headings.length!==1||normalizeText(visibleText(headings[0]))!==normalizeText(expected.headline)||
      standfirsts.length!==1||normalizeText(visibleText(standfirsts[0]))!==normalizeText(expected.teaser)||
      bodies.length!==1||!expectedBodies.includes(normalizeText(visibleText(bodies[0])))||
      !expected.sources.every(source=>links.has(source.url))||!noindex)throw new Failure('hidden_article_readback_mismatch',424);
  }
  return {status:'hidden_content_verified',article_count:hidden.receipt.articles.length};
}


// Public readback verifies the exact retained body hash, headline, teaser,
// recorded author link, disclosure and indexability. Never sends anything.
export async function verifyPublic(saved,fetcher=fetch){
  const {payload,receipt}=saved;
  if(receipt?.status!=='public_ready'||payload?.articles?.length!==receipt.articles?.length)throw new Failure('public_edition_required',409);
  for(const [i,a] of receipt.articles.entries()){
    if(a.article_url!==WEBSITE+'/articles/'+a.slug||!/^v0-[a-f0-9]{24}$/.test(a.slug))throw new Failure('public_article_url',409);
    const r=await fetcher(a.article_url,{redirect:'error',signal:AbortSignal.timeout(20000)});
    if(!r.ok)throw new Failure('public_article_unavailable',424);
    const raw=await r.text();if(raw.length>2000000)throw new Failure('public_readback_mismatch',424);
    const doc=nodes(parse(raw)), article=doc.find(n=>n.tagName==='article'), content=article?nodes(article):[];
    const expected=payload.articles[i], headline=content.find(n=>n.tagName==='h1'), teaser=content.find(n=>hasClass(n,'standfirst'));
    const links=new Set(content.filter(n=>n.tagName==='a').map(n=>attr(n,'href')));
    const body=content.find(n=>hasClass(n,'articleBody'));
    const expectedBody=expected.body_markdown.replace(/^(?:News|Analysis|Feature|Explainer)\s*\n+/,'');
    const expectedText=normalizeText(visibleText(parse(marked.parse(expectedBody))));
    if(normalizeText(visibleText(body||{}))!==expectedText)throw new Failure('public_body_mismatch',424);
    if(attr(article||{},'data-content-sha256')!==a.content_sha256||await hash(expected.body_markdown)!==a.content_sha256||
      normalizeText(visibleText(headline||{}))!==normalizeText(expected.headline)||
      normalizeText(visibleText(teaser||{}))!==normalizeText(expected.teaser)||
      !links.has('/authors/'+a.author_role_slug)||!expected.sources.every(s=>links.has(s.url))||
      !normalizeText(visibleText(article||{})).includes('Produced by The Global Analyst’s AI-powered newsroom.')||
      doc.some(n=>n.tagName==='meta'&&attr(n,'name')==='robots'&&/noindex/i.test(attr(n,'content')||'')))throw new Failure('public_readback_mismatch',424);
  }
  return {status:'public_content_verified',article_count:receipt.articles.length};
}

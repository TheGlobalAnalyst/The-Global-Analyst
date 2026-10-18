const START=Date.parse('2026-10-19T05:30:00Z');
const safeSource=s=>{try{const u=new URL(s.url);return u.protocol==='https:'&&!u.username&&!u.password;}catch{return false;}};
const plain=s=>s.replace(/\[([^\]]+)\]\(https:\/\/[^\s)]+\)/g,'$1').replace(/\*\*/g,'');
export function publicationOrder(a,b) {
 const time=Date.parse(b.edition_cutoff||b.published_at)-Date.parse(a.edition_cutoff||a.published_at);
 return time || (a.editorial_order||0)-(b.editorial_order||0);
}
export function approvedV0Rows(rows) {
 return rows.filter(r=>{
  const a=r.article;
  return r.publication_approved===true && a?.feed_visible===true && a.feed_origin==='scheduled_v0' &&
   a.version==='v0.0.1' && /^v0-[a-f0-9]{24}$/.test(r.slug||'') && /^[a-f0-9]{64}$/.test(r.content_sha256||'') &&
   /^story-[1-9][0-9]*$/.test(a.id||'') && typeof a.headline==='string' && a.headline && typeof a.teaser==='string' && a.teaser &&
   typeof a.body_markdown==='string' && a.body_markdown && Date.parse(a.window_end)>=START && Number.isFinite(Date.parse(r.published_at)) &&
   Array.isArray(a.sources) && a.sources.length>0 && a.sources.every(safeSource);
 }).map(r=>{
  const a=r.article;const rank=Number(a.id.slice(6));
  return {canonical_key:'v0-public-'+r.slug,slug:r.slug,headline:a.headline,teaser:plain(a.teaser),summary:plain(a.teaser),
   body_markdown:a.body_markdown,content_sha256:r.content_sha256,countries:['Sahel'],topics:[],citations:a.sources,
   published_at:r.published_at,edition_cutoff:a.window_end,editorial_order:rank,website_section:'News',featured:rank===1,
   author_role:'The Global Analyst — News Editor',author_role_slug:'general-analyst',
   reading_time_minutes:Math.max(1,Math.ceil(a.body_markdown.split(/\s+/).length/220)),related_content:[],
   newsletter_product:'The Sahel Brief',publication_status:'published',publication_approved:true,approved_at:r.published_at,
   verification_state:'web_researched',source:'v0',
   ai_disclosure:'Produced by The Global Analyst’s AI newsroom from linked public reporting. Not independently fact-checked.'};
 }).sort(publicationOrder);
}

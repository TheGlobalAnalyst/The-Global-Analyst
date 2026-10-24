import {publicationOrder} from './v0-publications.mjs';
export function withoutInlineSources(text) {
 return text.replace(/[ \t]*\((?:\[[^\]\n]+\]\(https?:\/\/[^\s)]+\)[\s,;]*)+\)/g,'')
  .replace(/\[([^\]\n]+)\]\(https?:\/\/[^\s)]+\)/g,'$1')
  .replace(/<?https?:\/\/[^\s<>]+>?/g,'').replace(/[ \t]+\n/g,'\n').trim();
}
export function approvedV2Rows(rows) {
 return rows.filter(r=>{
  const a=r.article;
  return r.publication_approved===true&&a?.feed_visible===true&&['scheduled_v2','owner_approved_v2'].includes(a.feed_origin)&&
   /^v2-story-[1-9][0-9]*$/.test(a.id||'')&&['lead','top','also'].includes(a.editorial_role)&&
   Number.isInteger(a.editorial_order)&&a.editorial_order>=1&&a.editorial_order<=18&&
   (a.editorial_role==='lead'?a.editorial_order===1:a.editorial_order>1)&&
   (a.editorial_role==='also'?a.section==='also':a.section==='top')&&
   typeof a.topic_label==='string'&&a.topic_label.length>0&&a.topic_label.length<=80&&
   a.version==='v0.0.1'&&/^v0-[a-f0-9]{24}$/.test(r.slug||'')&&/^[a-f0-9]{64}$/.test(r.content_sha256||'')&&
   ['headline','teaser','body_markdown'].every(k=>typeof a[k]==='string'&&a[k])&&
   Number.isFinite(Date.parse(a.window_end))&&Number.isFinite(Date.parse(r.published_at))&&
   Array.isArray(a.sources)&&a.sources.length>0&&a.sources.every(s=>{try{const u=new URL(s.url);return u.protocol==='https:'&&!u.username&&!u.password;}catch{return false;}});
 }).map(r=>{
  const a=r.article;
  return {canonical_key:'v2-public-'+r.slug,slug:r.slug,headline:a.headline,teaser:withoutInlineSources(a.teaser),
   body_markdown:withoutInlineSources(a.body_markdown),content_sha256:r.content_sha256,countries:['Sahel'],topics:[a.topic_label],citations:a.sources,
   published_at:r.published_at,edition_cutoff:a.window_end,editorial_order:a.editorial_order,website_section:'News',
   featured:a.editorial_role==='lead',lead_label:a.editorial_role==='lead'?"Today's lead":null,
   author_role:'The Global Analyst — News Editor',author_role_slug:'general-analyst',reading_time_minutes:Math.max(1,Math.ceil(a.body_markdown.split(/\s+/).length/220)),
   related_content:[],newsletter_product:'The Sahel Brief',publication_status:'published',publication_approved:true,approved_at:r.published_at,
   verification_state:'web_researched',source:'v2',ai_disclosure:'Produced by The Global Analyst’s AI newsroom from linked public reporting. Not independently fact-checked.'};
 }).sort(publicationOrder);
}
export function preferV2Editions(rows) {
 // V0 remains a comparison workflow, never a website-feed fallback.
 return rows.filter(a=>a.source!=='v0');
}

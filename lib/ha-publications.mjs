import {storyLabel, AI_DISCLOSURE} from './story-presentation.mjs';

const roles = new Set(['lead','top','analysis','also']);
const agentIds={'news-editor':'cmvi8b3640lro06adw73784fk','economic-analyst':'cmvp4t6020xx007ad3b2vawcf','political-analyst':'cmvp4tb730xap07ad39kxoawc','security-analyst':'cmvp4t10x0xtj07adookwv14t'};
const authors = {
  'news-editor':'News Editor',
  'political-analyst':'Politics & Diplomacy Analyst',
  'security-analyst':'Security & Conflict Analyst',
  'economic-analyst':'Economics & Livelihoods Analyst',
};
export function approvedHARows(rows) {
  return rows.filter(r=>{
    const a=r?.article;
    return r.publication_approved===true && /^v0-[a-f0-9]{24}$/.test(r.slug||'') &&
      /^[a-f0-9]{64}$/.test(r.content_sha256||'') &&
      a?.origin==='tga_gateway' && a.visibility==='public' && a.feed_visible===true &&
      a.verification_state==='source_reviewed' && a.eic_approved===true &&
      typeof a.authorship_evidence==='string' && a.authorship_evidence.trim() &&
      agentIds[a.author_role_slug]===a.author_agent_id && roles.has(a.editorial_role) &&
      typeof a.headline==='string' && a.headline.trim() &&
      typeof a.teaser==='string' && a.teaser.trim() &&
      typeof a.body_markdown==='string' && a.body_markdown.trim() &&
      Array.isArray(a.sources) && a.sources.length>0 &&
      a.sources.every(s=>{try{const u=new URL(s.url);return u.protocol==='https:'&&!u.username&&!u.password;}catch{return false;}}) &&
      Number.isFinite(Date.parse(r.published_at)) &&
      authors[a.author_role_slug] && a.author_role===authors[a.author_role_slug];
  }).map(r=>{
    const a=r.article;
    const topic = a.topic_label;
    const isAnalysis=a.editorial_role==='analysis';
    const label=storyLabel(a);
    return {
      canonical_key:'hyperagent-'+r.slug,slug:r.slug,headline:a.headline,teaser:a.teaser,
      body_markdown:a.body_markdown.replace(/^(?:News|Analysis|Feature|Explainer)\s*\n+/,''),content_sha256:r.content_sha256,
      countries:[label],topics:[topic],citations:a.sources,
      author_role:a.author_role,author_role_slug:a.author_role_slug,
      reading_time_minutes:Math.max(1,Math.ceil(a.body_markdown.split(/\s+/).length/220)),
      published_at:r.published_at,edition_cutoff:a.window_end,editorial_order:a.editorial_order||0,
      website_section:isAnalysis?'Analysis':'News',featured:a.editorial_role==='lead',
      lead_label:label,newsletter_product:'The Sahel Brief',publication_status:'published',
      publication_approved:true,approved_at:r.published_at,
      verification_state:'source_reviewed',source:'hyperagent',ai_disclosure:AI_DISCLOSURE,
      related_content:[],
    };
  }).sort((a,b)=>String(b.edition_cutoff||b.published_at).localeCompare(String(a.edition_cutoff||a.published_at)) ||
    (a.editorial_order||0)-(b.editorial_order||0));
}

export function approvedPythonRows(rows) {
  return rows.filter(({article:a,content_sha256:hash})=>
    a && a.publication_status==='published' && a.publication_approved===true &&
    a.verification_state==='source_reviewed' && /^python-sahel-[a-f0-9]{64}$/.test(a.canonical_key || '') &&
    /^sahel-[a-f0-9]{20}$/.test(a.slug || '') && a.headline && a.teaser && a.body_markdown &&
    a.published_at && /^[a-f0-9]{64}$/.test(hash || '') && Array.isArray(a.citations) && a.citations.length>0 &&
    a.citations.every(c=>{try {const u=new URL(c.url);return ['https:','http:'].includes(u.protocol)&&!u.username&&!u.password;}catch{return false;}})
  ).map(row=>({...row.article,content_sha256:row.content_sha256}));
}

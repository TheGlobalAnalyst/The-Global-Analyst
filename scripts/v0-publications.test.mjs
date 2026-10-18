import assert from 'node:assert/strict';
import {approvedV0Rows,publicationOrder} from '../lib/v0-publications.mjs';
const row={slug:'v0-'+'a'.repeat(24),content_sha256:'b'.repeat(64),publication_approved:true,published_at:'2026-10-19T05:35:00Z',
 article:{id:'story-1',version:'v0.0.1',headline:'A consequential development',teaser:'Context from [Source](https://example.org/report).',body_markdown:'Complete source-backed report.',sources:[{url:'https://example.org/report',publisher:'Source'}],window_end:'2026-10-19T05:30:00Z',feed_visible:true,feed_origin:'scheduled_v0'}};
assert.equal(approvedV0Rows([row])[0].featured,true);
assert.equal(approvedV0Rows([row])[0].teaser,'Context from Source.');
assert.equal(approvedV0Rows([row])[0].verification_state,'web_researched');
for(const change of [{feed_visible:false},{feed_visible:'true'},{feed_origin:'manual'},{window_end:'2026-10-18T19:43:31Z'},{id:'daily-briefing'},{sources:[{url:'javascript:alert(1)'}]}])
 assert.equal(approvedV0Rows([{...row,article:{...row.article,...change}}]).length,0,'trial/unqualified records excluded');
assert.equal(approvedV0Rows([{...row,publication_approved:false}]).length,0);
const second={...row,slug:'v0-'+'c'.repeat(24),published_at:'2026-10-19T05:36:00Z',article:{...row.article,id:'story-2'}};
const ordered=approvedV0Rows([second,row]);
assert.deepEqual(ordered.map(x=>x.editorial_order),[1,2],'lead keeps editorial rank despite later story insert times');
const old={published_at:'2026-10-18T05:35:00Z'};
assert.equal([old,...ordered].sort(publicationOrder)[0].slug,row.slug);
console.log('Public V0 feed: scheduled approvals only, trials excluded, source links safe, editorial ranking preserved.');

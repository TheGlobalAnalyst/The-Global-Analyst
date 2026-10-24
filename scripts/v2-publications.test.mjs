import test from 'node:test';
import assert from 'node:assert/strict';
import {approvedV2Rows,preferV2Editions} from '../lib/v2-publications.mjs';
const row=()=>({slug:'v0-'+'a'.repeat(24),content_sha256:'b'.repeat(64),publication_approved:true,published_at:'2026-10-25T07:00:00Z',article:{id:'v2-story-1',version:'v0.0.1',feed_visible:true,feed_origin:'scheduled_v2',editorial_role:'lead',editorial_order:1,section:'top',topic_label:'Mali politics',headline:'A consequential change',teaser:'A readable teaser. ([Source](https://example.org/report))',body_markdown:'Useful article. ([Source](https://example.org/report))',window_end:'2026-10-25T06:30:00Z',sources:[{url:'https://example.org/report',publisher:'Original source'}]}});
test('only scheduled approved V2 hierarchy articles qualify; citations stay at bottom',()=>{
 const source=row();const out=approvedV2Rows([source]);assert.equal(out.length,1);assert.equal(out[0].lead_label,"Today's lead");assert.equal(out[0].featured,true);assert.equal(out[0].teaser,'A readable teaser.');assert.equal(out[0].body_markdown,'Useful article.');assert.equal(out[0].citations.length,1);
 for(const mutation of [{feed_origin:'scheduled_v0'},{feed_visible:false},{editorial_order:2},{editorial_role:'unknown'},{id:'v1-story-1'}]){const bad=row();Object.assign(bad.article,mutation);assert.equal(approvedV2Rows([bad]).length,0);}
});
test('V2 replaces same-window V0 in feeds while retaining older editions as fallback',()=>{
 const lead=approvedV2Rows([row()])[0];const current={source:'v0',edition_cutoff:lead.edition_cutoff};const older={source:'v0',edition_cutoff:'2026-10-24T05:30:00Z'};
 assert.deepEqual(preferV2Editions([current,older]),[current,older]);assert.deepEqual(preferV2Editions([current,older,lead]),[older,lead]);
});

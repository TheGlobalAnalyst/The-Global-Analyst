import test from 'node:test';
import assert from 'node:assert/strict';
import {approvedHARows} from '../lib/ha-publications.mjs';
import {storyLabel,AI_DISCLOSURE} from '../lib/story-presentation.mjs';
const row=()=>({slug:'v0-'+'a'.repeat(24),content_sha256:'b'.repeat(64),publication_approved:true,published_at:'2026-11-04T06:24:00Z',article:{origin:'tga_gateway',visibility:'public',feed_visible:true,verification_state:'source_reviewed',editorial_role:'lead',editorial_order:1,headline:'Fuel shortage strands Sudan’s aid trucks',teaser:'Aid trucks cannot move.',body_markdown:'A complete, sourced report.',sources:[{url:'https://example.org/news',publisher:'Source'}],topic_label:'News',author_role:'News Editor',author_role_slug:'news-editor',window_end:'2026-11-04T06:00:00Z'}});
test('only expressly promoted, approved, credited Hyperagent rows appear',()=>{
  const good=row();const a=approvedHARows([good]);assert.equal(a.length,1);assert.equal(a[0].lead_label,'Sudan');assert.equal(a[0].author_role,'News Editor');assert.equal(a[0].ai_disclosure,AI_DISCLOSURE);
  for(const [key,value] of [['feed_visible',false],['visibility','unlisted'],['verification_state','unverified'],['author_role_slug','general-analyst'],['origin','scheduled_v2']]){const r=row();r.article[key]=value;assert.equal(approvedHARows([r]).length,0,key);}
});
test('story label avoids generic News/Analysis labels',()=>{assert.equal(storyLabel({headline:'Fuel shortage strands Sudan’s aid trucks',topic_label:'News'}),'Sudan');assert.equal(storyLabel({headline:'Aid faces delays',topic_label:'News'}),'Sahel');});

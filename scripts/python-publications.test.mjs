import {test} from 'node:test';
import assert from 'node:assert/strict';
import {approvedPythonRows} from '../lib/python-publications.mjs';
const good={content_sha256:'a'.repeat(64),article:{canonical_key:'python-sahel-'+'a'.repeat(64),slug:'sahel-'+'a'.repeat(20),headline:'Source-reviewed report',teaser:'A changed fact',body_markdown:'A sourced body',published_at:'2026-10-18T08:00:00Z',citations:[{url:'https://example.org/source'}],verification_state:'source_reviewed',publication_status:'published',publication_approved:true}};
test('Only explicitly published source-reviewed Python articles reach the website',()=>{
 assert.equal(approvedPythonRows([good]).length,1);
 for (const change of [{publication_status:'draft'},{publication_approved:false},{verification_state:'unreviewed'},{canonical_key:'legacy-article'},{citations:[{url:'javascript:alert(1)'}]}]) {
   assert.equal(approvedPythonRows([{...good,article:{...good.article,...change}}]).length,0);
 }
 assert.equal(approvedPythonRows([{...good,content_sha256:'wrong'}]).length,0);
 assert.equal(approvedPythonRows([good])[0].verification_state,'source_reviewed');
});

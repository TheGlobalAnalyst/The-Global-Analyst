import test from 'node:test';
import assert from 'node:assert/strict';
import {hyperagentFeed,homepageNewsroom} from '../lib/newsroom-feed.mjs';

test('later baseline reporting windows never displace Hyperagent or feed fresh legacy copy',()=>{
  const ha={slug:'approved-ha',source:'hyperagent',published_at:'2026-11-04T06:20:00Z',edition_cutoff:'2026-11-04T06:00:00Z'};
  const old={slug:'historic-v2',source:'v2',published_at:'2026-11-04T06:42:00Z',edition_cutoff:'2026-11-04T06:35:00Z'};
  const fresh={slug:'next-v2',source:'v2',published_at:'2026-11-05T06:42:00Z'};
  const feed=hyperagentFeed([ha],[old,fresh],'2026-11-04T20:30:00Z');
  assert.deepEqual(feed.map(a=>a.slug),['approved-ha','historic-v2']);
  assert.deepEqual(homepageNewsroom(feed),[ha]);
  assert.deepEqual(homepageNewsroom([old]),[old]);
  assert.throws(()=>hyperagentFeed([ha],[old],'invalid'),/cutoff/);
});

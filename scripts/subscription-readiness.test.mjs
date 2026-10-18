import {test} from 'node:test';
import assert from 'node:assert/strict';
import {subscriptionReadiness} from '../lib/subscription-readiness.mjs';
test('Readiness uses GET only, drops subscriber body and caches authentication', async()=>{
 let calls=0, cancelled=0;
 const options={apiKey:'test-only',now:1000,fetcher:async(url,opts)=>{
  calls++; assert.equal(opts.method,undefined);assert.match(url,/subscribers\\?limit=1$/);
  assert.equal(opts.redirect,'error');
  return {ok:true,body:{cancel:async()=>{cancelled++;}}};
 }};
 assert.equal(await subscriptionReadiness(options),true);
 assert.equal(await subscriptionReadiness({...options,now:2000}),true);
 assert.equal(calls,1);assert.equal(cancelled,1);
 assert.equal(await subscriptionReadiness({}),false);
 assert.equal(await subscriptionReadiness({apiKey:'invalid',now:1000,fetcher:async()=>({ok:false})}),false);
});

import {test} from 'node:test';
import assert from 'node:assert/strict';
import {subscribe} from '../lib/subscribe.mjs';
const url='https://www.theglobalanalyst.com/api/subscribe';
const request=(data={email:'reader@example.org'},origin='https://www.theglobalanalyst.com')=>new Request(url,{
  method:'POST',headers:{origin,'Content-Type':'application/json'},body:JSON.stringify(data)});

test('Signup stays first-party and only requests confirmation; client cannot activate subscribers',async()=>{
 let calls=0;
 const r=await subscribe(request({email:'reader@example.org',type:'regular',tags:['unexpected']}),{apiKey:'test-secret',fetcher:async(endpoint,options)=>{
   calls++;assert.equal(endpoint,'https://api.buttondown.com/v1/subscribers');
   assert.equal(options.redirect,'error');
   assert.equal(options.headers['X-Buttondown-Collision-Behavior'],'no_op');
   assert.deepEqual(JSON.parse(options.body),{email_address:'reader@example.org',type:'unactivated',referring_site:'https://www.theglobalanalyst.com/newsletters'});
   return new Response('{}',{status:201});
 }});
 assert.equal(calls,1);assert.equal(r.status,200);
 assert.deepEqual(await r.json(),{status:'confirmation_requested'});
 assert.equal(r.headers.get('Location'),null);
});

test('Invalid/cross-origin/honeypot submissions do not reach provider',async()=>{
 for(const req of [request({},'https://attacker.example'),request({email:'invalid'}),request({email:'reader@example.org',website:'spam'})]){
  const r=await subscribe(req,{apiKey:'test-secret',fetcher:()=>assert.fail('No provider call')});assert.ok(r.status>=400);
 }
});

test('Missing secret fails safely without provider request',async()=>{
 const r=await subscribe(request(),{fetcher:()=>assert.fail()});assert.equal(r.status,503);
});

test('Errors are truthful, do not expose provider data, and never retry',async()=>{
 for(const status of [400,401,403,409,422,429,500]){
  let calls=0;
  const r=await subscribe(request(),{apiKey:'test-secret',fetcher:async()=>{calls++;return new Response('test-secret private subscriber data',{status});}});
  assert.equal(calls,1);assert.ok(r.status>=400);assert.doesNotMatch(await r.text(),/test-secret|private subscriber data/);
 }
 let calls=0;
 const r=await subscribe(request(),{apiKey:'test-secret',fetcher:async()=>{calls++;throw new Error('test-secret');}});
 assert.equal(calls,1);assert.match((await r.json()).error,/check your inbox/);
});

// Fixed TGA gateway transport. No provider secrets, cookies, arbitrary URLs or newsroom code.
export const dynamic='force-dynamic';
export const maxDuration=60;
const upstream='https://yugoifzlhfubxefawqqs.supabase.co/functions/v1/tga-integration-gateway/mcp';
const metadata='https://www.theglobalanalyst.com/.well-known/oauth-protected-resource/mcp';
const allowedOrigins=new Set(['https://www.theglobalanalyst.com','https://theglobalanalyst.com','https://hyperagent.com','https://www.hyperagent.com']);
async function forward(request){
 const origin=request.headers.get('origin');
 if(origin&&!allowedOrigins.has(origin))return Response.json({error:'origin_not_allowed'},{status:403});
 const headers=new Headers();
 for(const name of ['authorization','accept','content-type','mcp-protocol-version','mcp-session-id']){const value=request.headers.get(name);if(value)headers.set(name,value);}
 try{
  const body=request.method==='POST'?await request.text():undefined;
  if(body&&new TextEncoder().encode(body).length>1100000)return Response.json({error:'request_too_large'},{status:413});
  const result=await fetch(upstream,{method:request.method,headers,body,redirect:'error',cache:'no-store',signal:AbortSignal.timeout(55000)});
  const responseHeaders=new Headers({'Cache-Control':'no-store'});
  for(const name of ['content-type','www-authenticate','allow','mcp-session-id','mcp-protocol-version']){const value=result.headers.get(name);if(value)responseHeaders.set(name,value);}
  if(result.status===401)responseHeaders.set('WWW-Authenticate','Bearer resource_metadata="'+metadata+'"');
  return new Response(result.body,{status:result.status,headers:responseHeaders});
 }catch{return Response.json({error:'gateway_upstream_unavailable'},{status:502,headers:{'Cache-Control':'no-store'}});}
}
export const GET=forward;
export const POST=forward;
export const HEAD=forward;
export const DELETE=forward;

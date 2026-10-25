// Render only the trusted TGA gateway consent document at the TGA origin.
// Supabase's shared host otherwise forces text/plain + sandbox for HTML.
export const dynamic='force-dynamic';
const upstream='https://yugoifzlhfubxefawqqs.supabase.co/functions/v1/tga-integration-gateway/oauth/authorize';
export async function GET(request){
 const query=new URL(request.url).search;
 if(query.length>8000)return Response.json({error:'request_too_large'},{status:413});
 try{
  const response=await fetch(upstream+query,{headers:{Accept:'text/html'},redirect:'error',cache:'no-store',signal:AbortSignal.timeout(20000)});
  const body=await response.text();
  if(!response.ok)return Response.json({error:'gateway_authorization_failed'},{status:response.status,headers:{'Cache-Control':'no-store'}});
  if(body.length>100000||!body.startsWith('<!doctype html>')||!body.includes('name="owner_key"'))return Response.json({error:'authorization_document_mismatch'},{status:502});
  const callback=new URL(request.url).searchParams.get('redirect_uri');
  let callbackOrigin='';
  if(callback){const target=new URL(callback);if(target.protocol!=='https:'||target.username||target.password)return Response.json({error:'authorization_callback_mismatch'},{status:502});callbackOrigin=' '+target.origin;}
  // The upstream has validated this exact registered callback. Chrome/Safari
  // apply form-action to the post-approval redirect as well as the initial POST.
  return new Response(body,{headers:{
   'Content-Type':'text/html; charset=utf-8','Cache-Control':'no-store',
   'Content-Security-Policy':"default-src 'none'; style-src 'unsafe-inline'; form-action https://yugoifzlhfubxefawqqs.supabase.co"+callbackOrigin+"; frame-ancestors 'none'; base-uri 'none'",
   'Referrer-Policy':'no-referrer','X-Content-Type-Options':'nosniff'
  }});
 }catch{return Response.json({error:'gateway_authorization_unavailable'},{status:502,headers:{'Cache-Control':'no-store'}});}
}

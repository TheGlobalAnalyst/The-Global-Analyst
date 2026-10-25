// Public OAuth metadata only. No credentials, proxy, newsroom or publication code.
export const dynamic='force-static';
export function GET(){
 const base='https://yugoifzlhfubxefawqqs.supabase.co/functions/v1/tga-integration-gateway';
 return Response.json({
  issuer:'https://www.theglobalanalyst.com',
  authorization_endpoint:'https://www.theglobalanalyst.com/gateway/authorize',
  token_endpoint:base+'/oauth/token',
  registration_endpoint:base+'/oauth/register',
  revocation_endpoint:base+'/oauth/revoke',
  response_types_supported:['code'],
  grant_types_supported:['authorization_code','refresh_token'],
  token_endpoint_auth_methods_supported:['none'],
  code_challenge_methods_supported:['S256'],
  scopes_supported:['tga:read','tga:drafts','tga:hidden','tga:owner-send','tga:files']
 },{headers:{'Cache-Control':'public, max-age=300','X-Content-Type-Options':'nosniff'}});
}

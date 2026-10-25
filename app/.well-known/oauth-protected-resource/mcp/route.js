// Public RFC 9728 metadata. Actual tools require gateway OAuth.
export const dynamic='force-static';
export function GET(){
 return Response.json({
  resource:'https://www.theglobalanalyst.com/mcp',
  authorization_servers:['https://www.theglobalanalyst.com'],
  scopes_supported:['tga:read','tga:drafts','tga:hidden','tga:owner-send','tga:files'],
  bearer_methods_supported:['header']
 },{headers:{'Cache-Control':'public, max-age=300','Access-Control-Allow-Origin':'*','X-Content-Type-Options':'nosniff'}});
}

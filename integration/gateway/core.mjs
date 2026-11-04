// Portable Fetch API handler. No model calls, scheduler or public delivery code.
import {ownerNewsletter,verifyHidden,verifyPublic} from './publishing.mjs';
export const VERSION = '0.3.0';
export const LEGACY_SCOPES = 'tga:read tga:drafts';
export const SCOPES = LEGACY_SCOPES+' tga:hidden tga:owner-send tga:files';
export class Failure extends Error {
  constructor(code, status=400) { super(code); this.code=code; this.status=status; }
}
const must=(yes, code='invalid_request', status=400)=>{if(!yes)throw new Failure(code,status);};
export const stable=o=>Array.isArray(o)?o.map(stable):o&&typeof o==='object'?Object.fromEntries(Object.keys(o).sort().map(k=>[k,stable(o[k])])):o;
export const hash=async value=>Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(typeof value==='string'?value:JSON.stringify(stable(value)))))).map(x=>x.toString(16).padStart(2,'0')).join('');
export const random=()=>Array.from(crypto.getRandomValues(new Uint8Array(32))).map(x=>x.toString(16).padStart(2,'0')).join('');
export const challenge=async s=>btoa(String.fromCharCode(...new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(s))))).replaceAll('+','-').replaceAll('/','_').replaceAll('=','');
const escape=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const keyPattern=/^[A-Za-z0-9_-]{8,100}$/;
function exact(o,fields){must(o&&typeof o==='object'&&!Array.isArray(o));must(Object.keys(o).every(k=>fields.includes(k)),'unknown_field');}
function text(s,max){must(typeof s==='string'&&s.trim()&&s.length<=max,'text_contract');return s;}
function source(s){exact(s,['url','publisher']);text(s.publisher,120);let u;try{u=new URL(s.url);}catch{throw new Failure('source_url');}must(u.protocol==='https:'&&!u.username&&!u.password,'source_url');return s;}
export function edition(payload,standalone=false) {
  exact(payload,['edition_date','title','window_start','window_end','articles']);
  must(/^\d{4}-\d{2}-\d{2}$/.test(payload.edition_date),'edition_date');text(payload.title,200);
  must(Number.isFinite(Date.parse(payload.window_start))&&Number.isFinite(Date.parse(payload.window_end))&&Date.parse(payload.window_start)<Date.parse(payload.window_end),'reporting_window');
  must(Array.isArray(payload.articles)&&payload.articles.length>=1&&payload.articles.length<=15,'articles');
  must(!standalone||payload.articles.length===1,'standalone_article_count');
  for(const a of payload.articles){
    exact(a,['headline','teaser','body_markdown','sources','role','topic_label']);
    text(a.headline,240);text(a.teaser,1500);text(a.body_markdown,65000);text(a.topic_label,80);
    must(['lead','top','analysis','also'].includes(a.role),'role');
    must(Array.isArray(a.sources)&&a.sources.length>=1&&a.sources.length<=12,'sources');a.sources.forEach(source);
  }
  must(standalone&&payload.articles.length===1||payload.articles[0].role==='lead'&&payload.articles.filter(a=>a.role==='lead').length===1,'lead');
  const order={lead:0,top:1,analysis:2,also:3};
  must(payload.articles.every((a,i)=>i===0||order[a.role]>=order[payload.articles[i-1].role]),'hierarchy');
  return payload;
}
export const CONTRACT={version:VERSION,mode:'approved_public_and_owner_only',sections:['lead','top','analysis','also'],
  website:{draft_table:'public_articles',hidden_table:'challenger_v0_articles',hidden_feed_visible:false,hidden_access:'unlisted_not_access_controlled',public_publication:true},
  email:{provider:'Buttondown',archival_mode:'disabled',owner_only_sending:true,recipient:'benjaminmoscovici@gmail.com',subscriber_sending:false},
  social:{provider:'Buffer',services:['twitter','linkedin'],saveToDraft:true,posting:false},
  data:{allowed:['recent_published_articles','publication_contract'],arbitrary_sql:false},
  blocked:['website.publish','newsletter.send','newsletter.send_test','social.publish','social.schedule'],
  qualification:'Structural validation and storage do not establish editorial or factual quality.'};
const articleSchema={type:'object',additionalProperties:false,required:['headline','teaser','body_markdown','sources','role','topic_label'],properties:{
  headline:{type:'string',maxLength:240},teaser:{type:'string',maxLength:1500},body_markdown:{type:'string',maxLength:65000},
  sources:{type:'array',minItems:1,maxItems:12,items:{type:'object',additionalProperties:false,required:['url','publisher'],properties:{url:{type:'string'},publisher:{type:'string'}}}},
  role:{enum:['lead','top','analysis','also']},topic_label:{type:'string',maxLength:80}}};
const payloadSchema={type:'object',additionalProperties:false,required:['edition_date','title','window_start','window_end','articles'],properties:{edition_date:{type:'string'},title:{type:'string'},window_start:{type:'string'},window_end:{type:'string'},articles:{type:'array',minItems:1,maxItems:15,items:articleSchema}}};
const obj=(properties={},required=Object.keys(properties))=>({type:'object',additionalProperties:false,properties,required});
const str={type:'string'};
const authorSchema=obj({article_slug:{type:'string',pattern:'^v0-[a-f0-9]{24}$'},author_role_slug:{enum:['news-editor','economic-analyst','political-analyst','security-analyst']},author_role:str,author_agent_id:str,authorship_evidence:{type:'string',minLength:1,maxLength:2000}});
export const TOOLS=[
  ['tga_status','Read gateway capabilities and whether provider credentials are configured. No credentials returned.',obj()],
  ['tga_submit_edition','Stage a private edition and its articles using the existing TGA publication contract. Never publishes.',obj({idempotency_key:str,payload:payloadSchema})],
  ['tga_submit_article','Stage one private standalone article in the existing TGA article contract. Never publishes.',obj({idempotency_key:str,payload:obj({...payloadSchema.properties,articles:{type:'array',minItems:1,maxItems:1,items:articleSchema}})})],
  ['tga_get_draft','Read a private edition belonging to this integration.',obj({idempotency_key:str})],
  ['tga_read_articles','Read at most 20 approved published TGA articles. No SQL or private checkpoints.',obj({limit:{type:'integer',minimum:1,maximum:20}},[])],
  ['tga_list_social_channels','Read connected Buffer X and LinkedIn channel IDs. This does not authorize their use.',obj()],
  ['tga_create_newsletter_draft','Create a non-archived Buttondown draft. Never sends to anyone.',obj({idempotency_key:str,payload:obj({subject:str,body_html:str})})],
  ['tga_create_social_draft','Create a Buffer draft for an allowed X or LinkedIn channel. Never queues, schedules or posts.',obj({idempotency_key:str,payload:obj({channel_id:str,service:{enum:['twitter','linkedin']},text:str})})],
  ['tga_publish_hidden_edition','Make your stored edition readable at unlisted TGA article URLs. Requires tga:hidden. Not access-controlled; never enters public feeds.',obj({idempotency_key:str,payload:obj({draft_key:str})})],
  ['tga_publish_public_edition','Promote an EIC-approved, verified hidden edition with explicit writing-agent provenance. Only operator-enabled clients. dry_run validates without publication.',obj({idempotency_key:str,payload:obj({hidden_key:str,eic_approved:{type:'boolean',const:true},authors:{type:'array',minItems:1,maxItems:15,items:authorSchema},geography_labels:{type:'array',minItems:1,maxItems:15,items:{type:'string',minLength:1,maxLength:80}},dry_run:{type:'boolean'}},['hidden_key','eic_approved','authors','geography_labels'])})],
  ['tga_verify_public_edition','Verify promoted public article content, authorship and disclosure.',obj({idempotency_key:str})],
  ['tga_verify_hidden_edition','Check live website hashes and headlines for your stored hidden edition.',obj({idempotency_key:str})],
  ['tga_send_owner_newsletter','Send the exact stored hidden edition through Buttondown ONLY to the fixed TGA owner. Requires tga:owner-send. No recipient or provider ID override.',obj({idempotency_key:str,payload:obj({hidden_key:str})})],
  ['tga_inspect_infrastructure','Read bounded GitHub/GitLab/Vercel service metadata; never credentials, source files or deployment mutation.',obj({payload:obj({provider:{enum:['github','gitlab','vercel']}})})],
  ['tga_read_workspace_file','Read your own exported file in a separate TGA newsroom workspace repository. Requires tga:files.',obj({payload:obj({provider:{enum:['github','gitlab']},path:str})})],
  ['tga_export_workspace_file','Create an immutable file only in your client namespace in a separate newsroom workspace repository. Never modifies Python or website repositories. Requires tga:files.',obj({idempotency_key:str,payload:obj({provider:{enum:['github','gitlab']},path:str,content:str})})],
  ['tga_get_receipt','Read the immutable outcome for this integration and idempotency key.',obj({idempotency_key:str})],
].map(([name,description,inputSchema])=>({name,description,inputSchema,annotations:{readOnlyHint:['tga_status','tga_get_draft','tga_read_articles','tga_get_receipt','tga_list_social_channels','tga_verify_hidden_edition','tga_verify_public_edition','tga_read_workspace_file','tga_inspect_infrastructure'].includes(name),destructiveHint:false,idempotentHint:true,openWorldHint:name.includes('newsletter')||name.includes('social')||name.includes('hidden')}}));

export function createGateway({store,providers,base,issuer=base,authorizationEndpoint=base+'/oauth/authorize',resourceAliases=[],verifyCI=async()=>false,verifyWebsite=verifyHidden,infra,now=()=>Date.now()}) {
  const audiences=[base+'/mcp',...resourceAliases];
  const expiry=seconds=>new Date(now()+seconds*1000).toISOString();
  const json=(o,status=200,extra={})=>Response.json(o,{status,headers:{'Cache-Control':'no-store',...extra}});
  const html=body=>new Response('<!doctype html><html><meta charset="utf-8"><title>TGA Gateway authorization</title><meta name="viewport" content="width=device-width"><body style="font:18px system-ui;max-width:650px;margin:60px auto;padding:20px">'+body+'</body></html>',{headers:{'Content-Type':'text/html; charset=utf-8','Cache-Control':'no-store','Content-Security-Policy':"default-src 'none'; style-src 'unsafe-inline'; form-action 'self'; frame-ancestors 'none'; base-uri 'none'",'Referrer-Policy':'no-referrer','X-Content-Type-Options':'nosniff'}});
  const read=async req=>{const raw=await req.text();must(new TextEncoder().encode(raw).length<=1100000,'request_too_large',413);try{return JSON.parse(raw);}catch{throw new Failure('invalid_json');}};
  const fresh=async key=>{const row=await store.get(key);if(!row||row.expires_at&&Date.parse(row.expires_at)<=now())return null;return row.value;};
  const put=(key,kind,value,seconds)=>store.insert({key,kind,value,expires_at:seconds?expiry(seconds):null});
  const requireOperator=async token=>{const op=await fresh('operator:owner');must(op&&op.hash===await hash(token||''),'operator_authentication_required',401);};
  const identity=async req=>{
    const header=req.headers.get('authorization')||'';must(header.startsWith('Bearer '),'unauthorized',401);
    const token=await fresh('access:'+await hash(header.slice(7)));must(token&&audiences.includes(token.aud),'unauthorized',401);
    const client=await fresh('client:'+token.client);must(client&&!client.revoked,'unauthorized',401);return token;
  };
  const issue=async (client,scope=LEGACY_SCOPES,aud=base+'/mcp')=>{
    const access=random(),refresh=random();
    await put('access:'+await hash(access),'access',{client,aud,scope},3600);
    await put('refresh:'+await hash(refresh),'refresh',{client,aud,scope},2592000);
    return {access_token:access,refresh_token:refresh,token_type:'Bearer',expires_in:3600,scope};
  };
  const toolScope={tga_publish_public_edition:'tga:hidden',tga_verify_public_edition:'tga:hidden',tga_publish_hidden_edition:'tga:hidden',tga_verify_hidden_edition:'tga:hidden',tga_send_owner_newsletter:'tga:owner-send',tga_inspect_infrastructure:'tga:files',tga_read_workspace_file:'tga:files',tga_export_workspace_file:'tga:files'};
  const visibleTools=who=>TOOLS.filter(t=>!toolScope[t.name]||(who.scope||LEGACY_SCOPES).split(' ').includes(toolScope[t.name]));
  const operationKey=(client,id)=>{must(keyPattern.test(id||''),'idempotency_key');return 'op:'+client+':'+id;};
  async function operation(name,args,who) {
    if(CONTRACT.blocked.includes(name))throw new Failure('operation_not_authorized',403);
    const requireScope=scope=>must((who.scope||LEGACY_SCOPES).split(' ').includes(scope),'insufficient_scope',403);
    if(['status','articles.read','social.channels','draft.get','receipt.get'].includes(name))requireScope('tga:read');
    if(['edition.submit','article.submit','newsletter.draft','social.draft'].includes(name))requireScope('tga:drafts');
    if(name==='status')return {...CONTRACT,providers:await providers.status()};
    if(name==='articles.read')return store.articles(Math.max(1,Math.min(20,Number.isInteger(args.limit)?args.limit:10)));
    if(name==='social.channels')return providers.channels();
    if(name==='website.hidden'||name==='website.verify_hidden')requireScope('tga:hidden');
    if(name==='newsletter.send_owner')requireScope('tga:owner-send');
    if(['infrastructure.inspect','workspace.read','workspace.export'].includes(name)){
      requireScope('tga:files');must(infra,'infrastructure_not_configured',424);
      if(name==='infrastructure.inspect'){exact(args.payload,['provider']);return infra.inspect(args.payload.provider);}
      if(name==='workspace.read'){exact(args.payload,['provider','path']);return infra.read(args.payload.provider,who.client,args.payload.path);}
    }
    const key=operationKey(who.client,args.idempotency_key);
    if(name==='draft.get'){const x=await fresh('edition:'+key);must(x&&x.client===who.client,'not_found',404);return x;}
    if(name==='receipt.get'){const x=await fresh(key);must(x&&x.client===who.client,'not_found',404);return x.receipt||{status:'outcome_unknown',automatic_retry:false};}
    if(name==='edition.submit'||name==='article.submit')return store.submit(key,who.client,await hash({name,payload:edition(args.payload,name==='article.submit')}),args.payload);
    if(name==='website.public'||name==='website.verify_public'){
      requireScope('tga:hidden');
      const enabled=await fresh('public-client:'+who.client);
      must(enabled?.enabled===true,'public_publication_not_enabled',403);
      if(name==='website.verify_public'){
        const saved=await fresh('public:'+key);must(saved?.client===who.client,'not_found',404);
        return verifyPublic(saved);
      }
      exact(args.payload,['hidden_key','eic_approved','authors','geography_labels','dry_run']);
      must(args.payload.eic_approved===true,'eic_approval_required',403);
      must(args.payload.dry_run===true||enabled.live===true,'public_cutover_not_enabled',403);
      const hiddenKey=operationKey(who.client,args.payload.hidden_key);
      const hidden=await fresh('hidden:'+hiddenKey);must(hidden?.client===who.client,'not_found',404);
      const authors=args.payload.authors, labels=args.payload.geography_labels;
      must(Array.isArray(authors)&&authors.length===hidden.payload.articles.length,'authorship_required');
      must(Array.isArray(labels)&&labels.length===authors.length,'geography_labels_required');
      const roster={
        'news-editor':['News Editor','cmvi8b3640lro06adw73784fk'],
        'economic-analyst':['Economics & Livelihoods Analyst','cmvp4t6020xx007ad3b2vawcf'],
        'political-analyst':['Politics & Diplomacy Analyst','cmvp4tb730xap07ad39kxoawc'],
        'security-analyst':['Security & Conflict Analyst','cmvp4t10x0xtj07adookwv14t']};
      authors.forEach((a,i)=>{must(a.article_slug===hidden.receipt.articles[i].slug,'author_article_binding');exact(a,['author_role_slug','author_role','author_agent_id','authorship_evidence','article_slug']);const r=roster[a.author_role_slug];must(r&&r[0]===a.author_role&&r[1]===a.author_agent_id,'author_identity');text(a.authorship_evidence,2000);});
      labels.forEach(l=>{text(l,80);must(!/^(news|analysis|feature|today.s lead)$/i.test(l),'geography_label');});
      await verifyWebsite(hidden);
      if(args.payload.dry_run===true)return {status:'public_promotion_validated',published:false,article_count:authors.length};
      return store.publishPublic(key,who.client,await hash({hidden_key:hiddenKey,authors,labels}),hiddenKey,authors,labels);
    }
    if(name==='website.hidden'){
      exact(args.payload,['draft_key']);
      const original=await fresh('edition:'+operationKey(who.client,args.payload.draft_key));
      must(original?.client===who.client,'not_found',404);
      return store.hidden(key,who.client,await hash({name,payload:original.payload}),original.payload);
    }
    if(name==='website.verify_hidden'){
      const hidden=await fresh('hidden:'+key);must(hidden?.client===who.client,'not_found',404);
      return verifyWebsite(hidden);
    }
    must(['newsletter.draft','social.draft','newsletter.send_owner','workspace.export'].includes(name),'unknown_operation',404);
    let input=args.payload;
    let hidden,deliveryKey;
    if(name==='newsletter.send_owner'){
      exact(input,['hidden_key']);
      hidden=await fresh('hidden:'+operationKey(who.client,input.hidden_key));
      must(hidden?.client===who.client,'not_found',404);
      input={...ownerNewsletter(hidden),hidden_key:input.hidden_key};
      deliveryKey='delivery:'+who.client+':'+await hash(input.hidden_key);
    }
    else if(name==='workspace.export'){exact(input,['provider','path','content']);text(input.path,180);text(input.content,200000);}
    else if(name==='newsletter.draft'){exact(input,['subject','body_html']);text(input.subject,240);text(input.body_html,300000);}
    else {exact(input,['channel_id','service','text']);text(input.channel_id,100);text(input.text,input.service==='twitter'?280:3000);must(['twitter','linkedin'].includes(input.service),'service');}
    const digest=await hash({name,payload:input});
    const previous=await fresh(key);
    if(previous){must(previous.hash===digest,'idempotency_conflict',409);return previous.receipt||{status:'outcome_unknown',automatic_retry:false};}
    // Check credentials and channel ownership before reserving a non-retryable external action.
    if(hidden){
      const delivery=await fresh(deliveryKey);
      if(delivery){const prior=await fresh(delivery.operation_key);return prior?.receipt||{status:'outcome_unknown',automatic_retry:false};}
      await verifyWebsite(hidden);
    }
    if(name==='workspace.export')await infra.preflight(input.provider);else await providers.preflight(name,input);
    const inserted=await put(key,'operation',{client:who.client,hash:digest,status:'pending'});
    if(!inserted){const concurrent=await fresh(key);must(concurrent?.hash===digest,'idempotency_conflict',409);return concurrent.receipt||{status:'outcome_unknown',automatic_retry:false};}
    if(deliveryKey&&!await put(deliveryKey,'operation',{client:who.client,operation_key:key})){
      const delivery=await fresh(deliveryKey);const prior=await fresh(delivery.operation_key);
      const receipt=prior?.receipt||{status:'outcome_unknown',automatic_retry:false};
      await store.replace(key,{client:who.client,hash:digest,receipt});return receipt;
    }
    let receipt;
    try{receipt=name==='newsletter.send_owner'?await providers.sendOwner(input):name==='workspace.export'?await infra.export(input.provider,who.client,input.path,input.content):await providers.draft(name,input);}
    catch(e){receipt={status:'outcome_unknown',automatic_retry:false,error:e instanceof Failure?e.code:'provider_request_failed'};}
    await store.replace(key,{client:who.client,hash:digest,receipt});return receipt;
  }
  return async function handle(req) {
    const url=new URL(req.url);
    // Supabase's trusted proxy can pass an internal origin and a shortened path.
    // Redirects and OAuth audiences always use the fixed configured public base.
    const marker='/tga-integration-gateway';const at=url.pathname.indexOf(marker);
    const path=(at>=0?url.pathname.slice(at+marker.length):url.pathname)||'/';
    try {
      if(path==='/health'&&req.method==='GET')return json({service:'TGA Integration Gateway',version:VERSION,mode:'approved_public_and_owner_only'});
      const metadata={issuer,authorization_endpoint:authorizationEndpoint,token_endpoint:base+'/oauth/token',registration_endpoint:base+'/oauth/register',revocation_endpoint:base+'/oauth/revoke',response_types_supported:['code'],grant_types_supported:['authorization_code','refresh_token'],token_endpoint_auth_methods_supported:['none'],code_challenge_methods_supported:['S256'],scopes_supported:SCOPES.split(' ')};
      if(path==='/.well-known/oauth-authorization-server'||path==='/.well-known/openid-configuration')return json(metadata);
      if(path==='/.well-known/oauth-protected-resource')return json({resource:base+'/mcp',authorization_servers:[issuer],scopes_supported:SCOPES.split(' '),bearer_methods_supported:['header']});
      if(path==='/oauth/register'&&req.method==='POST'){
        const data=await read(req);must(Array.isArray(data.redirect_uris)&&data.redirect_uris.length>=1&&data.redirect_uris.length<=4,'redirect_uris');
        for(const uri of data.redirect_uris){let u;try{u=new URL(uri);}catch{throw new Failure('redirect_uri');}must(u.protocol==='https:'&&!u.username&&!u.password&&!u.hash&&u.hostname.includes('.')&&!/^[\d.]+$/.test(u.hostname),'redirect_uri');}
        must(!data.token_endpoint_auth_method||data.token_endpoint_auth_method==='none','public_client_only');
        must(data.scope===undefined||typeof data.scope==='string'&&data.scope.split(' ').every(s=>SCOPES.split(' ').includes(s)),'invalid_scope');
        const client='tga_'+random().slice(0,32);const value={client_id:client,client_name:String(data.client_name||'MCP client').slice(0,100),redirect_uris:data.redirect_uris,token_endpoint_auth_method:'none',grant_types:['authorization_code','refresh_token'],response_types:['code'],scope:data.scope||SCOPES};
        must(await store.capacity('client',64),'registration_limit',429);await put('client:'+client,'client',value);return json(value,201);
      }
      if(path==='/oauth/authorize'&&req.method==='GET'){
        const q=Object.fromEntries(url.searchParams);const c=await fresh('client:'+q.client_id);
        must(c&&!c.revoked&&c.redirect_uris.includes(q.redirect_uri),'invalid_client');
        must(q.response_type==='code'&&q.code_challenge_method==='S256'&&/^[A-Za-z0-9_-]{43}$/.test(q.code_challenge||''),'pkce_required');
        must(!q.scope||q.scope.split(' ').every(s=>SCOPES.split(' ').includes(s)),'invalid_scope');
        must(!q.resource||audiences.includes(q.resource),'invalid_target');
        must(await store.capacity('flow',64),'authorization_limit',429);
        const flow=random();await put('flow:'+flow,'flow',{client:q.client_id,redirect_uri:q.redirect_uri,challenge:q.code_challenge,state:q.state||'',scope:q.scope||c.scope||LEGACY_SCOPES,resource:q.resource||base+'/mcp'},600);
        return html('<h1>Authorize TGA Gateway</h1><p>Client: <strong>'+escape(c.client_name)+'</strong></p><p>Return address: '+escape(q.redirect_uri)+'</p><p>Requested scopes: '+escape(q.scope||c.scope||LEGACY_SCOPES)+'</p><p>tga:hidden permits unlisted article pages. tga:files permits separate repository exports and bounded infrastructure metadata. tga:owner-send permits Buttondown delivery only to benjaminmoscovici@gmail.com. Public promotion is restricted to operator-enabled clients and EIC-approved verified editions. No subscriber sends or social posts.</p><form method="post" action="'+base+'/oauth/approve"><input type="hidden" name="flow" value="'+flow+'"><label>TGA owner authorization key<br><input name="owner_key" type="password" required autocomplete="off" style="width:100%;font-size:18px"></label><p><button type="submit">Authorize private access</button></p></form>');
      }
      if(path==='/oauth/approve'&&req.method==='POST'){
        const raw=await req.text();must(raw.length<=8000,'request_too_large',413);const q=Object.fromEntries(new URLSearchParams(raw));
        await requireOperator(q.owner_key);
        const receiptKey='consent:'+await hash(q.flow||'');
        const completed=await fresh(receiptKey);
        if(completed)return json({status:'authorization_already_completed',message:'Die Freigabe wurde bereits erteilt. Bitte zu Hyperagent zurueckkehren und dort die Integration pruefen. Dieses Formular stellt keinen weiteren Zugang aus.'});
        const flow=await fresh('flow:'+q.flow);
        must(flow,'authorization_not_pending',409);
        must(await store.take('flow:'+q.flow),'authorization_already_submitted',409);
        const code=random();await put('code:'+await hash(code),'code',flow,300);
        // A repeat must never issue another code or token, but can report that
        // the original approval completed. No raw key, code or token is retained.
        await put(receiptKey,'operation',{client:flow.client,status:'authorized'},600);
        const target=new URL(flow.redirect_uri);target.searchParams.set('code',code);if(flow.state)target.searchParams.set('state',flow.state);
        return new Response(null,{status:303,headers:{Location:target.href,'Cache-Control':'no-store','Referrer-Policy':'no-referrer'}});
      }
      if(path==='/oauth/token'&&req.method==='POST'){
        const raw=await req.text();must(raw.length<=8000,'invalid_request');const q=Object.fromEntries(new URLSearchParams(raw));const c=await fresh('client:'+q.client_id);must(c&&!c.revoked,'invalid_client',401);
        if(q.grant_type==='authorization_code'){
          const key='code:'+await hash(q.code||'');const code=await fresh(key);
          must(code&&code.client===q.client_id&&code.redirect_uri===q.redirect_uri&&/^[A-Za-z0-9._~-]{43,128}$/.test(q.code_verifier||'')&&code.challenge===await challenge(q.code_verifier),'invalid_grant');
          must(await store.take(key),'invalid_grant');return json(await issue(q.client_id,code.scope||LEGACY_SCOPES,code.resource||base+'/mcp'));
        }
        if(q.grant_type==='refresh_token'){
          const key='refresh:'+await hash(q.refresh_token||'');const token=await fresh(key);must(token&&token.client===q.client_id,'invalid_grant');must(await store.take(key),'invalid_grant');return json(await issue(q.client_id,token.scope||LEGACY_SCOPES,token.aud||base+'/mcp'));
        }
        throw new Failure('unsupported_grant_type');
      }
      if(path==='/oauth/revoke'&&req.method==='POST'){
        const raw=await req.text();must(raw.length<=8000,'invalid_request');const q=Object.fromEntries(new URLSearchParams(raw));
        for(const kind of ['access','refresh']){const key=kind+':'+await hash(q.token||'');const t=await fresh(key);if(t&&t.client===q.client_id)await store.take(key);}return json({revoked:true});
      }
      if(path==='/admin/providers'&&req.method==='POST'){
        const auth=req.headers.get('authorization')||'';must(await verifyCI(auth),'protected_ci_required',403);
        const data=await read(req);exact(data,['provider','api_key','channels']);must(['buttondown','buffer','github','gitlab','vercel'].includes(data.provider),'provider');
        if(['github','gitlab','vercel'].includes(data.provider)){must(!data.channels,'unknown_field');await infra.configure(data.provider,text(data.api_key,2000));}
        else await providers.configure(data.provider,text(data.api_key,2000),data.channels);return json({provider:data.provider,status:'configured'});
      }
      const who=await identity(req);
      if(path==='/v1/contracts'&&req.method==='GET')return json(CONTRACT);
      if(path==='/v1/operations'&&req.method==='POST'){const data=await read(req);exact(data,['operation','idempotency_key','payload','limit']);return json(await operation(data.operation,data,who));}
      if(path==='/mcp'){
        if(req.method!=='POST')return json({error:'method_not_allowed'},405,{Allow:'POST'});
        const data=await read(req);must(data.jsonrpc==='2.0','invalid_jsonrpc');
        if(data.method==='notifications/initialized')return new Response(null,{status:202});
        let result;
        if(data.method==='initialize')result={protocolVersion:['2025-03-26','2025-06-18','2025-11-25'].includes(data.params?.protocolVersion)?data.params.protocolVersion:'2025-03-26',capabilities:{tools:{listChanged:false}},serverInfo:{name:'tga-integration-gateway',version:VERSION},instructions:'Independent gateway. Private drafts; separately consented hidden publication and fixed-owner email. Public promotion is restricted to operator-enabled clients and EIC-approved verified editions. No subscriber sends or social posts. Underlying credentials never leave TGA.'};
        else if(data.method==='ping')result={};
        else if(data.method==='tools/list')result={tools:visibleTools(who)};
        else if(data.method==='tools/call'){
          const names={tga_status:'status',tga_submit_edition:'edition.submit',tga_submit_article:'article.submit',tga_get_draft:'draft.get',tga_read_articles:'articles.read',tga_list_social_channels:'social.channels',tga_create_newsletter_draft:'newsletter.draft',tga_create_social_draft:'social.draft',tga_get_receipt:'receipt.get',tga_publish_public_edition:'website.public',tga_verify_public_edition:'website.verify_public',tga_publish_hidden_edition:'website.hidden',tga_verify_hidden_edition:'website.verify_hidden',tga_send_owner_newsletter:'newsletter.send_owner',tga_inspect_infrastructure:'infrastructure.inspect',tga_read_workspace_file:'workspace.read',tga_export_workspace_file:'workspace.export'};
          try{must(names[data.params?.name],'unknown_tool',404);const out=await operation(names[data.params.name],data.params.arguments||{},who);result={content:[{type:'text',text:JSON.stringify(out)}],isError:false};}
          catch(e){result={content:[{type:'text',text:JSON.stringify({error:e instanceof Failure?e.code:'operation_failed'})}],isError:true};}
        } else return json({jsonrpc:'2.0',id:data.id??null,error:{code:-32601,message:'Method not found'}});
        return json({jsonrpc:'2.0',id:data.id??null,result});
      }
      throw new Failure('not_found',404);
    } catch(e) {
      const status=e instanceof Failure?e.status:503;const code=e instanceof Failure?e.code:'gateway_unavailable';
      return json({error:code,...(code==='authorization_not_pending'?{message:'Diese Freigabeanfrage ist nicht mehr offen: Sie wurde bereits genutzt oder ist abgelaufen. Bitte zuerst die Integration in Hyperagent pruefen.'}:{}),...(code==='authorization_already_submitted'?{message:'Diese Freigabe wird bereits verarbeitet. Bitte die Integration in Hyperagent pruefen.'}:{})},status,status===401?{'WWW-Authenticate':'Bearer resource_metadata="'+base+'/.well-known/oauth-protected-resource"'}:{});
    }
  };
}


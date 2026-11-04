import {createRemoteJWKSet,jwtVerify} from 'npm:jose@6.1.0';
import {createGateway} from './core.mjs';
import {supabaseStore} from './store.mjs';
import {infrastructure} from './infrastructure.mjs';
import {providerAdapters} from './providers.mjs';
const url=Deno.env.get('SUPABASE_URL')!;
const store=supabaseStore(url,Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);
const base='https://yugoifzlhfubxefawqqs.supabase.co/functions/v1/tga-integration-gateway';
const jwks=createRemoteJWKSet(new URL('https://gitlab.com/oauth/discovery/keys'));
const verifyCI=async(header:string)=>{
  if(!header.startsWith('Bearer '))return false;
  try{
    const {payload:p}=await jwtVerify(header.slice(7),jwks,{issuer:'https://gitlab.com',audience:base,algorithms:['RS256']});
    return String(p.job_project_id||p.project_id)==='87570708'&&p.project_path==='TheGlobalAnalyst/tga-intelligence-engine'&&p.ref==='main'&&String(p.ref_protected)==='true'&&p.ref_type==='branch'&&p.pipeline_source==='api';
  }catch{return false;}
};
Deno.serve(createGateway({store,providers:providerAdapters(store),base,issuer:'https://www.theglobalanalyst.com',authorizationEndpoint:'https://www.theglobalanalyst.com/gateway/authorize',resourceAliases:['https://www.theglobalanalyst.com/mcp'],verifyCI,infra:infrastructure(store)}));



import {Failure} from './core.mjs';

export function supabaseStore(url,key,fetcher=fetch) {
  async function rest(path,method='GET',body,extra={}) {
    const r=await fetcher(url+'/rest/v1/'+path,{method,headers:{apikey:key,Authorization:'Bearer '+key,'Content-Type':'application/json',...extra},body:body===undefined?undefined:JSON.stringify(body),signal:AbortSignal.timeout(20000)});
    const text=await r.text();let data;try{data=text?JSON.parse(text):null;}catch{throw new Failure('database_response',503);}
    if(!r.ok){if(r.status===409||data?.code==='23505')throw new Failure('idempotency_conflict',409);throw new Failure('database_request_failed',503);}return data;
  }
  return {
    async get(key){return (await rest('tga_gateway_state?key=eq.'+encodeURIComponent(key)+'&select=value,expires_at&limit=1'))[0]||null;},
    async insert(row){try{await rest('tga_gateway_state','POST',row);return true;}catch(e){if(e.status===409)return false;throw e;}},
    async replace(key,value){await rest('tga_gateway_state?key=eq.'+encodeURIComponent(key),'PATCH',{value});},
    async take(key){return (await rest('tga_gateway_state?key=eq.'+encodeURIComponent(key),'DELETE',undefined,{Prefer:'return=representation'})).length===1;},
    async capacity(kind,max){const rows=await rest('tga_gateway_state?kind=eq.'+kind+'&or=(expires_at.is.null,expires_at.gt.'+encodeURIComponent(new Date().toISOString())+')&select=key&limit='+(max+1));return rows.length<max;},
    async submit(key,client,hash,payload){return rest('rpc/tga_gateway_submit_draft','POST',{p_key:key,p_client:client,p_hash:hash,p_payload:payload});},
    async hidden(key,client,hash,payload){return rest('rpc/tga_gateway_publish_hidden','POST',{p_key:key,p_client:client,p_hash:hash,p_payload:payload});},
    async articles(limit){return rest('challenger_v0_articles?publication_approved=eq.true&article->>feed_visible=eq.true&select=slug,content_sha256,article,published_at&order=published_at.desc&limit='+limit);},
    async provider(provider,value){return rest('rpc/tga_gateway_provider','POST',{p_provider:provider,...(value===undefined?{}:{p_value:value})});},
    async config(key,value){await rest('tga_gateway_state?on_conflict=key','POST',{key,kind:'config',value},{Prefer:'resolution=merge-duplicates'});},
  };
}



import {Failure} from './core.mjs';

export function supabaseStore(url,key,fetcher=fetch) {
  async function rest(path,method='GET',body,extra={}) {
    const r=await fetcher(url+'/rest/v1/'+path,{method,headers:{apikey:key,Authorization:'Bearer '+key,'Content-Type':'application/json',...extra},body:body===undefined?undefined:JSON.stringify(body),signal:AbortSignal.timeout(20000)});
    const text=await r.text();let data;try{data=text?JSON.parse(text):null;}catch{throw new Failure('database_response',503);}
    if(!r.ok){
      if(r.status===409||data?.code==='23505')throw new Failure('idempotency_conflict',409);
      const lifecycleErrors=['edition_source_required','edition_not_active','edition_source_mismatch','edition_source_ambiguous','edition_not_found','edition_deleted','article_not_in_edition','article_ownership_mismatch','stored_content_mismatch','delivery_in_progress','deletion_revision_mismatch','withdrawn_content_changed','lifecycle_target_too_large','operation_binding','lifecycle_contract'];
      if(lifecycleErrors.includes(data?.message))throw new Failure(data.message,data.code==='P0002'?404:409);
      throw new Failure('database_request_failed',503);
    }return data;
  }
  return {
    async get(key){return (await rest('tga_gateway_state?key=eq.'+encodeURIComponent(key)+'&select=value,expires_at&limit=1'))[0]||null;},
    async insert(row){try{await rest('tga_gateway_state','POST',row);return true;}catch(e){if(e.status===409)return false;throw e;}},
    async replace(key,value){await rest('tga_gateway_state?key=eq.'+encodeURIComponent(key),'PATCH',{value});},
    async take(key){return (await rest('tga_gateway_state?key=eq.'+encodeURIComponent(key),'DELETE',undefined,{Prefer:'return=representation'})).length===1;},
    async capacity(kind,max){const rows=await rest('tga_gateway_state?kind=eq.'+kind+'&or=(expires_at.is.null,expires_at.gt.'+encodeURIComponent(new Date().toISOString())+')&select=key&limit='+(max+1));return rows.length<max;},
    async submit(key,client,hash,payload){return rest('rpc/tga_gateway_submit_draft','POST',{p_key:key,p_client:client,p_hash:hash,p_payload:payload});},
    async hidden(key,client,hash,payload,sourceKey){return rest('rpc/tga_gateway_publish_hidden_bound','POST',{p_key:key,p_client:client,p_hash:hash,p_payload:payload,p_source_key:sourceKey});},
    async reserveOwnerSend(key,client,hash,hiddenKey,deliveryKey){return rest('rpc/tga_gateway_reserve_owner_send','POST',{p_key:key,p_client:client,p_hash:hash,p_hidden_key:hiddenKey,p_delivery_key:deliveryKey});},
    async depublication({key,client,hash,hiddenKey,action,slug,draftKey,dryRun,revision}){
      return rest('rpc/tga_gateway_depublication','POST',{p_key:key,p_client:client,p_hash:hash,p_hidden_key:hiddenKey,p_action:action,p_slug:slug,p_draft_key:draftKey,p_dry_run:dryRun,p_revision:revision});
    },
    async publishPublic(key,client,hash,hiddenKey,authors,labels){return rest('rpc/tga_gateway_publish_public','POST',{p_key:key,p_client:client,p_hash:hash,p_hidden_key:hiddenKey,p_authors:authors,p_labels:labels});},
    async articles(limit){return rest('challenger_v0_articles?publication_approved=eq.true&article->>feed_visible=eq.true&select=slug,content_sha256,article,published_at&order=published_at.desc&limit='+limit);},
    async provider(provider,value){return rest('rpc/tga_gateway_provider','POST',{p_provider:provider,...(value===undefined?{}:{p_value:value})});},
    async config(key,value){await rest('tga_gateway_state?on_conflict=key','POST',{key,kind:'config',value},{Prefer:'resolution=merge-duplicates'});},
  };
}

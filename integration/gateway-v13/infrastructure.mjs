import {Failure,hash} from './core.mjs';

// Operator-owned targets. Clients cannot choose a repository, project, branch,
// API URL or credential. Editorial files never enter Python/website source repos.
const GITHUB='TheGlobalAnalyst/tga-newsroom-workspaces';
const GITLAB='TheGlobalAnalyst/tga-newsroom-workspaces';
const VERCEL_PROJECT='prj_SBeR69eagRNAR41v9A2F2GhC5egp';
const VERCEL_TEAM='team_XF4TSvuYbiB13D3swnL5SqMz';
export function workspacePath(client,path){
  if(!/^tga_[a-f0-9]{32}$/.test(client)||typeof path!=='string'||path.length>180||!path.split('/').every(x=>/^[A-Za-z0-9][A-Za-z0-9_-]*(?:\.[A-Za-z0-9_-]+)*$/.test(x))||!/\.(md|json|txt|html|csv)$/.test(path))throw new Failure('workspace_path');
  return 'clients/'+client+'/'+path;
}
const b64=s=>{const bytes=new TextEncoder().encode(s);let raw='';for(let i=0;i<bytes.length;i+=8192)raw+=String.fromCharCode(...bytes.subarray(i,i+8192));return btoa(raw);};
const unb64=s=>new TextDecoder().decode(Uint8Array.from(atob(s.replace(/\s/g,'')),c=>c.charCodeAt(0)));
export function infrastructure(store,fetcher=fetch){
  async function request(provider,url,{method='GET',body,optional=false,credential}={}){
    const key=credential||await store.provider(provider);
    if(!key&&!optional)throw new Failure(provider+'_not_configured',424);
    const headers={'Content-Type':'application/json','Accept':'application/json',...(provider==='github'?{'X-GitHub-Api-Version':'2022-11-28','User-Agent':'TGA-Integration-Gateway'}:{})};
    if(key)headers[provider==='gitlab'?'PRIVATE-TOKEN':'Authorization']=provider==='gitlab'?key:'Bearer '+key;
    const r=await fetcher(url,{method,headers,body:body===undefined?undefined:JSON.stringify(body),redirect:'error',signal:AbortSignal.timeout(20000)});
    if(r.status===404)throw new Failure('workspace_or_file_not_found',404);
    if(!r.ok)throw new Failure(provider+'_request_rejected',502);
    const raw=await r.text();if(raw.length>1000000)throw new Failure('provider_response_too_large',502);
    try{return JSON.parse(raw);}catch{throw new Failure('provider_response_invalid',502);}
  }
  function target(provider){
    if(!['github','gitlab'].includes(provider))throw new Failure('repository_provider');
    return provider==='github'?'https://api.github.com/repos/'+GITHUB:'https://gitlab.com/api/v4/projects/'+encodeURIComponent(GITLAB);
  }
  async function read(provider,client,path){
    const full=workspacePath(client,path),base=target(provider);
    const url=provider==='github'?base+'/contents/'+full+'?ref=main':base+'/repository/files/'+encodeURIComponent(full)+'?ref=main';
    const file=await request(provider,url);if(file.encoding!=='base64'||typeof file.content!=='string')throw new Failure('workspace_file_contract',502);
    const content=unb64(file.content);if(content.length>200000)throw new Failure('workspace_file_bound',502);
    return {provider,path,content,content_sha256:await hash(content)};
  }
  return {
    async configure(provider,key){
      const url=provider==='github'?'https://api.github.com/user':provider==='gitlab'?'https://gitlab.com/api/v4/user':'https://api.vercel.com/v9/projects/'+VERCEL_PROJECT+'?teamId='+VERCEL_TEAM;
      const r=await request(provider,url,{credential:key});if(!r.id)throw new Failure('provider_identity_readback',502);
      await store.provider(provider,key);
    },
    async inspect(provider){
      if(provider==='github'){
        const r=await request(provider,'https://api.github.com/repos/TheGlobalAnalyst/The-Global-Analyst',{optional:true});
        return {provider,repository:r.full_name,default_branch:r.default_branch,source_access:false,workspace_repository:GITHUB,workspace_credentials_configured:!!(await store.provider(provider))};
      }
      if(provider==='gitlab'){
        const r=await request(provider,target(provider));
        return {provider,project_id:r.id,path:r.path_with_namespace,workspace_repository:GITLAB,source_access:false};
      }
      if(provider==='vercel'){
        const r=await request(provider,'https://api.vercel.com/v9/projects/'+VERCEL_PROJECT+'?teamId='+VERCEL_TEAM);
        return {provider,project_id:r.id,name:r.name,deployment_state:r.targets?.production?.readyState||null,deployment_mutations:false};
      }
      throw new Failure('infrastructure_provider');
    },
    async preflight(provider){await request(provider,target(provider));},
    read,
    async export(provider,client,path,content){
      if(typeof content!=='string'||!content||content.length>200000)throw new Failure('workspace_file_bound');
      const full=workspacePath(client,path),base=target(provider),digest=await hash(content);
      // Immutable exports: no overwrites, deletes, merge, pipeline or deploy API.
      try{const old=await read(provider,client,path);if(old.content_sha256!==digest)throw new Failure('workspace_file_conflict',409);return {...old,status:'existing',content:undefined};}catch(e){if(e.code!=='workspace_or_file_not_found')throw e;}
      const url=provider==='github'?base+'/contents/'+full:base+'/repository/files/'+encodeURIComponent(full);
      const body=provider==='github'?{message:'TGA independent newsroom export [skip ci]',branch:'main',content:b64(content)}:{branch:'main',commit_message:'TGA independent newsroom export [skip ci]',content,encoding:'text'};
      await request(provider,url,{method:provider==='github'?'PUT':'POST',body});
      const saved=await read(provider,client,path);if(saved.content_sha256!==digest)throw new Failure('workspace_readback_mismatch',502);
      return {status:'exported',provider,path,content_sha256:digest,source_repositories_modified:false};
    }
  };
}



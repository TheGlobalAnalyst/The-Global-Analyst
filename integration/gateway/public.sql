-- Service-only atomic promotion. Originals and unlisted receipts are retained.
create or replace function public.tga_gateway_publish_public(p_key text,p_client text,p_hash text,p_hidden_key text,p_authors jsonb,p_labels jsonb) returns jsonb language plpgsql set search_path='' as $$
declare previous jsonb; hidden jsonb; item jsonb; credit jsonb; rec jsonb; ids jsonb:='[]'; oldrows jsonb:='[]'; i integer:=0; s text; expected text;
begin
 perform pg_advisory_xact_lock(hashtextextended(p_hidden_key,0));
 select value into previous from public.tga_gateway_state where key=p_key;
 if found then
   if previous->>'client' is distinct from p_client or previous->>'hash' is distinct from p_hash then raise exception 'idempotency_conflict' using errcode='23505'; end if;
   return previous->'receipt';
 end if;
 if not exists(select 1 from public.tga_gateway_state where key='public-client:'||p_client and value->>'enabled'='true' and value->>'live'='true') then raise exception 'public_client_not_enabled'; end if;
 select value into hidden from public.tga_gateway_state where key='hidden:'||p_hidden_key;
 if hidden is null or hidden->>'client' is distinct from p_client or hidden->'receipt'->>'status'<>'hidden_ready' then raise exception 'hidden_edition_required'; end if;
 if jsonb_array_length(p_authors)<>jsonb_array_length(hidden->'payload'->'articles') or jsonb_array_length(p_labels)<>jsonb_array_length(p_authors) then raise exception 'metadata_count'; end if;
 if exists(select 1 from public.tga_gateway_state where kind='public_edition' and value->>'hidden_key'=p_hidden_key) then raise exception 'edition_already_promoted' using errcode='23505'; end if;
 for item in select value from jsonb_array_elements(hidden->'payload'->'articles') loop
   credit:=p_authors->i; s:=hidden->'receipt'->'articles'->i->>'slug';
   if credit->>'author_role_slug' not in ('news-editor','economic-analyst','political-analyst','security-analyst') or coalesce(length(credit->>'authorship_evidence'),0)=0 or coalesce(length(p_labels->>i),0)=0 then raise exception 'authorship_required'; end if;
   expected:=encode(sha256(convert_to(item->>'body_markdown','UTF8')),'hex');
   select to_jsonb(a) into rec from public.challenger_v0_articles a where slug=s for update;
   if rec is null or rec->>'content_sha256'<>expected or rec->'article'->>'origin'<>'tga_gateway' or rec->'article'->>'body_markdown' is distinct from item->>'body_markdown' or rec->'article'->>'headline' is distinct from item->>'headline' or rec->'article'->>'teaser' is distinct from item->>'teaser' or rec->'article'->'sources' is distinct from item->'sources' then raise exception 'stored_content_mismatch'; end if;
   oldrows:=oldrows||jsonb_build_array(rec);
   update public.challenger_v0_articles set article=article||credit||jsonb_build_object('geography_label',p_labels->>i,'visibility','public','feed_visible',true,'verification_state','source_reviewed','eic_approved',true,'public_operation_key',p_key,'public_promoted_at',now()),publication_approved=true where slug=s;
   ids:=ids||jsonb_build_array(jsonb_build_object('slug',s,'content_sha256',expected,'author_role_slug',credit->>'author_role_slug','article_url','https://www.theglobalanalyst.com/articles/'||s));
   i:=i+1;
 end loop;
 rec:=jsonb_build_object('status','public_ready','id',p_key,'articles',ids,'eic_approved',true,'public_feed_visible',true,'content_sha256',p_hash);
 insert into public.tga_gateway_state(key,kind,value) values(p_key,'operation',jsonb_build_object('client',p_client,'hash',p_hash,'receipt',rec)),('public:'||p_key,'public_edition',jsonb_build_object('client',p_client,'hidden_key',p_hidden_key,'payload',hidden->'payload','receipt',rec,'rollback_rows',oldrows));
 return rec;
end $$;
revoke all on function public.tga_gateway_publish_public(text,text,text,text,jsonb,jsonb) from public,anon,authenticated;
grant execute on function public.tga_gateway_publish_public(text,text,text,text,jsonb,jsonb) to service_role;

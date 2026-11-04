-- Operator-only example. Replace the exact operation key before executing.
-- Run in a transaction; compare current rows with rollback before-images first.
begin;
do $$
declare k text:='REPLACE_WITH_EXACT_PUBLIC_OPERATION_KEY'; saved jsonb; oldrow jsonb;
begin
 perform pg_advisory_xact_lock(hashtextextended(k,0));
 select value into saved from public.tga_gateway_state where key='public:'||k;
 if saved is null then raise exception 'public_receipt_not_found'; end if;
 perform pg_advisory_xact_lock(hashtextextended(saved->>'hidden_key',0));
 for oldrow in select value from jsonb_array_elements(saved->'rollback_rows') loop
  if not exists(select 1 from public.challenger_v0_articles where slug=oldrow->>'slug' and article->>'public_operation_key'=k) then raise exception 'concurrent_change_or_already_rolled_back'; end if;
 end loop;
 for oldrow in select value from jsonb_array_elements(saved->'rollback_rows') loop
  update public.challenger_v0_articles set article=oldrow->'article',publication_approved=(oldrow->>'publication_approved')::boolean where slug=oldrow->>'slug';
 end loop;
 insert into public.tga_gateway_state(key,kind,value) values('rollback:'||k,'operation',jsonb_build_object('status','rolled_back','original_operation',k,'at',now()));
end $$;
commit;

CREATE OR REPLACE FUNCTION public.tga_gateway_publish_hidden(p_key text, p_client text, p_hash text, p_payload jsonb)
 RETURNS jsonb
 LANGUAGE plpgsql
 SET search_path TO ''
AS $function$
declare old jsonb; item jsonb; a jsonb; ids jsonb:='[]'; result jsonb; s text; body_hash text; idx integer:=0;
begin
  perform pg_advisory_xact_lock(hashtextextended(p_key,0));
  select value into old from public.tga_gateway_state where key=p_key;
  if found then
    if old->>'hash'<>p_hash then raise exception 'idempotency_conflict' using errcode='23505'; end if;
    return old->'receipt';
  end if;
  if jsonb_typeof(p_payload->'articles')<>'array' or jsonb_array_length(p_payload->'articles') not between 1 and 15 then raise exception 'article_contract'; end if;
  for item in select value from jsonb_array_elements(p_payload->'articles') loop
    idx:=idx+1;
    -- Existing route requires the v0 slug format; article IDs identify this
    -- gateway, not a Python V0/V2 run. Random URLs are unlisted, not private ACLs.
    s:='v0-'||substr(replace(gen_random_uuid()::text,'-',''),1,24);
    body_hash:=encode(sha256(convert_to(item->>'body_markdown','UTF8')),'hex');
    a:=jsonb_build_object('id','gateway-'||s,'headline',item->>'headline','teaser',item->>'teaser',
      'body_markdown',item->>'body_markdown','sources',item->'sources',
      'section',case when item->>'role'='also' then 'also' else 'top' end,
      'editorial_role',item->>'role','editorial_order',idx,'topic_label',item->>'topic_label',
      'window_start',p_payload->>'window_start','window_end',p_payload->>'window_end',
      'edition_date',p_payload->>'edition_date','origin','tga_gateway','feed_visible',false,
      'visibility','unlisted','verification_state','unverified','version','gateway.0.2');
    if item ? 'editorial_topic_label' then
      a:=a||jsonb_build_object('editorial_topic_label',item->>'editorial_topic_label');
    end if;
    insert into public.challenger_v0_articles(slug,content_sha256,article,publication_approved)
      values(s,body_hash,a,true);
    ids:=ids||jsonb_build_array(jsonb_build_object('slug',s,'role',item->>'role','content_sha256',body_hash,
      'article_url','https://www.theglobalanalyst.com/challenger/'||s));
  end loop;
  result:=jsonb_build_object('status','hidden_ready','id',p_key,'content_sha256',p_hash,'articles',ids,
    'public_feed_visible',false,'access_controlled',false,'verification_state','unverified');
  insert into public.tga_gateway_state(key,kind,value) values
    (p_key,'operation',jsonb_build_object('client',p_client,'hash',p_hash,'receipt',result)),
    ('hidden:'||p_key,'edition',jsonb_build_object('client',p_client,'payload',p_payload,'receipt',result));
  return result;
end $function$
;

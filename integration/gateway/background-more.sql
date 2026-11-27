-- This migration changes definitions only. Preserve package JSON and receipts.
set local lock_timeout = '5s';
alter table public.public_articles
  drop constraint public_articles_website_section_check,
  add constraint public_articles_website_section_check
    check (website_section in ('News','Analysis','Feature','Background')) not valid;
alter table public.public_articles validate constraint public_articles_website_section_check;

create or replace function public.tga_gateway_article_genre(item jsonb) returns text
language plpgsql immutable set search_path='' as $$
declare role text := item->>'role'; genre text := item->>'genre';
begin
  if not (item ? 'genre') then
    if role='analysis' then
      genre := coalesce(lower((regexp_match(item->>'topic_label',
        '^(analysis|feature|background)([[:space:]]*[·:|—–-]|[[:space:]]*$)', 'i'))[1]),'analysis');
    elsif role in ('lead','top','also') then
      genre := 'news';
    end if;
  end if;
  if role in ('analysis','more') and genre in ('analysis','feature','background') then return genre; end if;
  if role in ('lead','top','also') and genre='news' then return genre; end if;
  raise exception 'article_genre';
end $$;
revoke all on function public.tga_gateway_article_genre(jsonb) from public, anon, authenticated;
grant execute on function public.tga_gateway_article_genre(jsonb) to service_role;

CREATE OR REPLACE FUNCTION public.tga_gateway_submit_draft(p_key text, p_client text, p_hash text, p_payload jsonb)
 RETURNS jsonb
 LANGUAGE plpgsql
 SET search_path TO ''
AS $function$
declare genre text; more_genres text[] := '{}'; old jsonb; item jsonb; aid uuid; ids jsonb := '[]'; result jsonb; slug text; idx integer := 0;
begin
  perform pg_advisory_xact_lock(hashtextextended(p_key, 0));
  select value into old from public.tga_gateway_state where key = p_key;
  if found then
    if old->>'hash' <> p_hash then raise exception 'idempotency_conflict' using errcode = '23505'; end if;
    return old->'receipt';
  end if;
  if jsonb_typeof(p_payload->'articles') <> 'array' or jsonb_array_length(p_payload->'articles') not between 1 and 15 then
    raise exception 'article_contract';
  end if;
  for item in select value from jsonb_array_elements(p_payload->'articles') loop
    genre := public.tga_gateway_article_genre(item);
    if genre <> 'news' then
      if cardinality(more_genres) >= 2 then raise exception 'more_article_limit'; end if;
      if genre = any(more_genres) then raise exception 'duplicate_more_genre'; end if;
      more_genres := array_append(more_genres, genre);
    end if;
    idx := idx + 1;
    slug := 'gateway-' || substr(md5(p_key), 1, 20) || '-' || idx;
    insert into public.public_articles
      (canonical_key, slug, headline, teaser, body_markdown, citations,
       author_role, author_role_slug, reading_time_minutes, website_section,
       verification_state, ai_disclosure, publication_status, publication_approved)
    values
      (p_key || ':' || idx, slug, item->>'headline', item->>'teaser', item->>'body_markdown', item->'sources',
       'Pending attribution', 'pending-attribution',
       greatest(1, least(120, ceil(length(item->>'body_markdown') / 1200.0)::integer)),
       initcap(genre),
       'unverified', 'Submitted through the TGA Integration Gateway for private review', 'shadow_ready', false)
    returning id into aid;
    ids := ids || jsonb_build_array(jsonb_build_object('id', aid, 'slug', slug, 'role', case when item->>'role'='analysis' then 'more' else item->>'role' end));
  end loop;
  result := jsonb_build_object('status','private_draft','id',p_key,'content_sha256',p_hash,
    'articles',ids,'published',false,'publication_approved',false);
  insert into public.tga_gateway_state(key,kind,value) values
    (p_key,'operation',jsonb_build_object('client',p_client,'hash',p_hash,'receipt',result)),
    ('edition:' || p_key,'edition',jsonb_build_object('client',p_client,'payload',p_payload,'receipt',result));
  return result;
end $function$;

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
      'editorial_role',case when item->>'role'='analysis' then 'more' else item->>'role' end,'editorial_order',idx,'topic_label',item->>'topic_label',
      'window_start',p_payload->>'window_start','window_end',p_payload->>'window_end',
      'edition_date',p_payload->>'edition_date','origin','tga_gateway','feed_visible',false,
      'visibility','unlisted','verification_state','unverified','version','gateway.0.2');
    if item ? 'editorial_topic_label' then
      a:=a||jsonb_build_object('editorial_topic_label',item->>'editorial_topic_label');
    end if;
    a:=a||jsonb_build_object('genre',public.tga_gateway_article_genre(item));
    insert into public.challenger_v0_articles(slug,content_sha256,article,publication_approved)
      values(s,body_hash,a,true);
    ids:=ids||jsonb_build_array(jsonb_build_object('slug',s,'role',case when item->>'role'='analysis' then 'more' else item->>'role' end,'content_sha256',body_hash,
      'article_url','https://www.theglobalanalyst.com/challenger/'||s));
  end loop;
  result:=jsonb_build_object('status','hidden_ready','id',p_key,'content_sha256',p_hash,'articles',ids,
    'public_feed_visible',false,'access_controlled',false,'verification_state','unverified');
  insert into public.tga_gateway_state(key,kind,value) values
    (p_key,'operation',jsonb_build_object('client',p_client,'hash',p_hash,'receipt',result)),
    ('hidden:'||p_key,'edition',jsonb_build_object('client',p_client,'payload',p_payload,'receipt',result));
  return result;
end $function$;

create or replace view public.tga_public_challenger_listings with (security_invoker = true) as
select slug, content_sha256, publication_approved, published_at,
       (select jsonb_object_agg(key, value)
        from jsonb_each(article) where key in (
          'origin', 'visibility', 'feed_visible', 'verification_state', 'eic_approved',
          'authorship_evidence', 'author_role_slug', 'author_agent_id', 'editorial_role', 'genre',
          'headline', 'teaser', 'sources', 'author_role', 'topic_label', 'geography_label',
          'countries', 'topics',
          'editorial_topic_label', 'window_end', 'editorial_order', 'feed_origin', 'id',
          'section', 'version'
        )) as article,
       case when article->>'origin' = 'tga_gateway'
         then jsonb_typeof(article->'body_markdown') = 'string' and length(btrim(article->>'body_markdown', E' \t\n\r\v\f')) > 0
         else jsonb_typeof(article->'body_markdown') = 'string' and coalesce(article->>'body_markdown', '') <> '' end as body_present,
       cardinality(regexp_split_to_array(article->>'body_markdown', '[[:space:]]+')) as body_words
from public.challenger_v0_articles
where publication_approved and article->>'feed_visible' = 'true'
  and ((article->>'origin' = 'tga_gateway' and article->>'visibility' = 'public')
    or article->>'feed_origin' in ('scheduled_v2', 'owner_approved_v2'));

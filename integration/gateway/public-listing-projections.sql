-- Additive views. The request role still needs to pass the base tables' RLS.
create view public.tga_public_challenger_listings with (security_invoker = true) as
select slug, content_sha256, publication_approved, published_at,
       (select jsonb_object_agg(key, value)
        from jsonb_each(article) where key in (
          'origin', 'visibility', 'feed_visible', 'verification_state', 'eic_approved',
          'authorship_evidence', 'author_role_slug', 'author_agent_id', 'editorial_role',
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

create view public.tga_public_python_listings with (security_invoker = true) as
select slug, content_sha256, published_at,
       (select jsonb_object_agg(key, value)
        from jsonb_each(article) where key in (
          'id', 'canonical_key', 'slug', 'headline', 'teaser', 'countries',
          'lead_label', 'geography_label', 'topics', 'editorial_topic_label', 'author_role', 'author_role_slug',
          'published_at', 'edition_cutoff', 'editorial_order', 'website_section',
          'featured', 'reading_time_minutes', 'source', 'citations',
          'publication_status', 'publication_approved', 'verification_state'
        )) as article,
       coalesce(article->>'body_markdown', '') <> '' as body_present
from public.python_public_articles
where publication_status = 'published' and publication_approved and verification_state = 'source_reviewed';

revoke all on public.tga_public_challenger_listings, public.tga_public_python_listings from public, anon, authenticated;
grant select on public.tga_public_challenger_listings, public.tga_public_python_listings to anon, authenticated;

# TGA website publication contract

The frontend should consume **publication-ready canonical stories only**.

Required fields:
- canonical_key
- slug
- headline
- teaser
- body_markdown
- countries[]
- topics[]
- citations[]
- author_role
- author_role_slug
- reading_time_minutes
- published_at
- website_section: News | Analysis | Background
- newsletter_product
- newsletter_cta
- ai_disclosure
- publication_status
- featured

Optional:
- summary
- related_content[]
- confidence
- verification_state

## Hard publication rule
The public frontend only reads records where:

`publication_status = 'published'`

Internal newsroom candidates, dossiers, claims, shadow editions and `shadow_draft` records are **not** public website objects.

## Idempotency
`canonical_key` must remain stable. Republishing the same story updates the existing article instead of generating a duplicate.

## Website / newsletter relationship
For stories selected for the website:
1. Full article lives on TheGlobalAnalyst.com.
2. Newsletter receives a concise representation of the same canonical story.
3. Newsletter CTA links to the website article.
4. Social representation points to the same article.
5. No separate research process is created for newsletter or social.

## Python newsroom publication projection
The publisher authorized website articles plus owner-only Buttondown draft tests on18October2026. Python output uses a separate public.python_public_articles projection with source_reviewed state and explicit AI/source-review disclosure; it does not relabel those articles as independently verified or change legacy publication policies. Only published, approved rows are anonymously readable; write access is denied to anon/authenticated roles. The frontend preserves its existing design and combines approved legacy stories with these explicitly source-reviewed articles. No subscriber delivery or social publication is enabled.

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

## Gateway 0.5 and the EIC submission contract

The MCP endpoint is `https://www.theglobalanalyst.com/mcp`. Refresh tool discovery on the existing OAuth connection. Check `tga_status`, `tga_submit_edition` and `tga_submit_article`. The status contract lists placements in order and exposes the MORE limits. The standalone tool takes the same envelope with exactly one article, which may be in any valid placement.

| Placement (`role`) | Editorial format (`genre`) |
| --- | --- |
| `lead`, `top`, `also` | `news` (default if omitted) |
| `more` | `analysis`, `feature`, or `background` (explicit) |

An edition has 1–15 articles and exactly one lead, first. Submit any top news next, then zero, one or two MORE articles, then any also-important news. Each MORE genre may appear once. Either order within a pair is valid. Omit MORE by supplying no articles with that placement. For a single premium slot choose any of the three genres. The two-slot combinations are Analysis + Feature, Analysis + Background, and Feature + Background.

Example arguments for private edition submission, shown for reference only:

```json
{
  "idempotency_key": "example-edition-v1",
  "payload": {
    "edition_date": "2026-11-27",
    "title": "The Sahel Brief",
    "window_start": "2026-11-26T06:00:00Z",
    "window_end": "2026-11-27T06:00:00Z",
    "articles": [
      {
        "role": "lead", "genre": "news", "topic_label": "Chad",
        "headline": "Approved lead headline", "teaser": "Approved lead teaser.",
        "body_markdown": "Approved lead body.",
        "sources": [{"url":"https://example.org/report","publisher":"Example source"}]
      },
      {
        "role": "more", "genre": "background", "topic_label": "Chad",
        "editorial_topic_label": "Trade",
        "headline": "Approved background headline", "teaser": "Approved background teaser.",
        "body_markdown": "Approved background body.",
        "sources": [{"url":"https://example.org/context","publisher":"Example source"}]
      }
    ]
  }
}
```

For news only, omit the second article. For standalone Background, use only the second article in the envelope and a separate key. Send headlines and copy verbatim. Supply the actual writing agent, evidence and matching hidden slug in promotion order, plus the approved geography for each article. The optional editorial topic label and geography are independent of genre. New private shadow rows carry pending attribution until the actual byline is bound at promotion.

**Compatibility.** New clients emit `more`. The server accepts `analysis` as a legacy placement alias. Explicit genre takes precedence. On older premium packages without genre, a leading format in the topic label identifies the genre, otherwise the historical default is Analysis. News placements default to News. The Gateway retains the exact submitted package for hash binding. Replaying the original operation, key and payload returns its original receipt, including historical role spellings. A changed payload conflicts. Existing staged packages can advance by their original keys. Avoid changing an approved package or replaying a send to migrate it.

**Verification and release.** Test every combination with isolated storage and provider fixtures. Verify hidden and public pages against the exact headline, visible genre and existing readback checks. Promotions still require the operator-enabled client, EIC approval, slug-bound author provenance, geography and successful hidden verification. Owner-only Buttondown delivery retains the existing delivery lock, recipient restriction and receipt identity. Commissioning and schedule changes require separate owner approval.

**Rollback.** Hold new submissions on the existing client and restore the previous Edge Function bundle from website commit `2ed454308e4439918ceec9d79034b5ff10486ef0` (Gateway deployment v22), retaining its existing JWT setting and import map. Refresh MCP discovery again. Keep the backward-compatible database definitions. Keep the 0.5 reader available for any canonical MORE rows already staged or promoted. If none exist, the previous Vercel deployment is `dpl_CkmsPSLyHaRn1ugAuosnTXRPw46W`. Retain receipts, payloads and send locks throughout rollback.

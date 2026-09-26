# The Global Analyst — website ready for newsroom integration

This is the product-complete frontend to hand to Work after V1/Tier 1 is stable.

## Current state
- Next.js frontend
- New The Global Analyst logo
- Homepage with Today's Original, Latest News, newsletter promotion and Analysis
- Dynamic full article pages
- Role-only analyst pages
- Newsletters, Regions and About pages
- Visible source links
- Explicit AI disclosure
- Related-story support
- SEO metadata, robots and sitemap
- Demo content included so the site can be reviewed before integration

## Integration seam
All content access is isolated in:

`lib/publication-source.js`

Today it falls back to demo data. If Supabase environment variables are present it reads `public_articles`.

WORK may keep that table, replace it with a view/RPC/API, or adapt this single data-access file to the final V1 publication schema.

## Important
Do not redesign the site while integrating the newsroom. The product/UI is intentionally fixed so the integration can follow the final V1 data architecture rather than the other way around.

See:
- `integration/PUBLICATION_CONTRACT.md`
- `integration/WORK_HANDOFF.md`
Website repository connected to Vercel.

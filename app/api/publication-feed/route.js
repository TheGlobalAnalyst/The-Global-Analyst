import { getPublishedArticles } from '../../../lib/publication-source';

export const dynamic = 'force-dynamic';

const allowedVerification = new Set(['verified', 'verified_corrected', 'corrected']);

export async function GET() {
  // This feed exists only on Preview. Supabase RLS is the first publication gate;
  // the explicit checks here keep the export limited to public article fields.
  if (process.env.VERCEL_ENV !== 'preview') {
    return new Response('Not found', { status: 404 });
  }

  try {
    const rows = await getPublishedArticles();
    const seenKeys = new Set();
    const seenSlugs = new Set();
    const articles = rows.filter((article) => {
      if (article.publication_status !== 'published' ||
          article.publication_approved !== true ||
          !allowedVerification.has(article.verification_state) ||
          !article.canonical_key || !article.slug ||
          !article.headline || !article.body_markdown ||
          !article.published_at || !article.approved_at ||
          !Array.isArray(article.citations) || article.citations.length < 2 ||
          seenKeys.has(article.canonical_key) || seenSlugs.has(article.slug)) return false;
      seenKeys.add(article.canonical_key);
      seenSlugs.add(article.slug);
      return true;
    }).map((article) => ({
      canonical_key: article.canonical_key,
      slug: article.slug,
      headline: article.headline,
      teaser: article.teaser,
      summary: article.summary,
      body_markdown: article.body_markdown,
      countries: article.countries,
      topics: article.topics,
      citations: article.citations,
      author_role: article.author_role,
      author_role_slug: article.author_role_slug,
      reading_time_minutes: article.reading_time_minutes,
      published_at: article.published_at,
      website_section: article.website_section,
      related_content: article.related_content,
      newsletter_product: article.newsletter_product,
      newsletter_cta: article.newsletter_cta,
      ai_disclosure: article.ai_disclosure,
      confidence: article.confidence,
      verification_state: article.verification_state,
      featured: article.featured,
      approved_at: article.approved_at,
      publication_approved: true,
      publication_status: 'published',
    }));
    return Response.json({ articles }, { headers: { 'Cache-Control': 'no-store' } });
  } catch (error) {
    return Response.json({ error: 'Publication feed unavailable' }, { status: 503, headers: { 'Cache-Control': 'no-store' } });
  }
}

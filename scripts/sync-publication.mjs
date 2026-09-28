import { readFile, writeFile, rename } from 'node:fs/promises';
import { dirname, join } from 'node:path';

const source = process.env.TGA_PUBLICATION_FEED_URL;
const target = process.env.TGA_PUBLICATION_MANIFEST || 'content/published-articles.json';
if (!source) throw new Error('TGA_PUBLICATION_FEED_URL is required');
const parsedSource = new URL(source);
const devRestSource = parsedSource.hostname === 'yugoifzlhfubxefawqqs.supabase.co' && parsedSource.pathname === '/rest/v1/public_articles';
if (parsedSource.protocol !== 'https:' || !devRestSource) {
  throw new Error('Expected the exact HTTPS TGA DEV public_articles REST URL');
}
if (devRestSource && !process.env.TGA_DEV_SUPABASE_PUBLISHABLE_KEY) {
  throw new Error('TGA_DEV_SUPABASE_PUBLISHABLE_KEY is required for DEV REST source');
}
const headers = { accept: 'application/json' };
if (devRestSource) {
  headers.apikey = process.env.TGA_DEV_SUPABASE_PUBLISHABLE_KEY;
  headers.Authorization = 'Bearer ' + process.env.TGA_DEV_SUPABASE_PUBLISHABLE_KEY;
  parsedSource.searchParams.set('select', 'canonical_key,slug,headline,teaser,summary,body_markdown,countries,topics,citations,author_role,author_role_slug,reading_time_minutes,published_at,approved_at,website_section,related_content,newsletter_product,newsletter_cta,ai_disclosure,confidence,verification_state,featured,publication_approved,publication_status');
  parsedSource.searchParams.set('publication_status', 'eq.published');
  parsedSource.searchParams.set('publication_approved', 'eq.true');
}
const response = await fetch(parsedSource, { headers, cache: 'no-store' });
if (!response.ok) throw new Error('Publication feed failed: HTTP ' + response.status);
const payload = await response.json();
const sourceArticles = payload;
if (!Array.isArray(sourceArticles)) throw new Error('Publication feed has no articles array');

const seenKeys = new Set();
const seenSlugs = new Set();
const articles = sourceArticles.map((article) => {
  if (article.publication_status !== 'published' || article.publication_approved !== true ||
      !['verified', 'verified_corrected', 'corrected'].includes(article.verification_state) ||
      !article.canonical_key || !article.slug || !article.headline || !article.body_markdown ||
      !article.published_at || !article.approved_at || !Array.isArray(article.citations) ||
      article.citations.length < 2 || article.citations.some(c =>
        !c || typeof c.url !== 'string' || !/^https?:\/\//i.test(c.url))) {
    throw new Error('Feed contains an unapproved or incomplete article');
  }
  if (seenKeys.has(article.canonical_key) || seenSlugs.has(article.slug)) {
    throw new Error('Feed contains duplicate canonical keys or slugs');
  }
  seenKeys.add(article.canonical_key);
  seenSlugs.add(article.slug);
  return article;
}).sort((a, b) => a.canonical_key.localeCompare(b.canonical_key));

const previous = JSON.parse(await readFile(target, 'utf8'));
if (!Array.isArray(previous)) throw new Error('Existing publication manifest is malformed');
if (previous.length && !articles.length) {
  throw new Error('Refusing to replace a populated manifest with an empty feed');
}
const next = JSON.stringify(articles, null, 2) + '\n';
if (next === JSON.stringify(previous, null, 2) + '\n') {
  console.log('No publication changes (' + articles.length + ' articles)');
} else {
  const temp = join(dirname(target), '.published-articles-' + process.pid + '.tmp');
  await writeFile(temp, next, { flag: 'wx' });
  await rename(temp, target);
  console.log('Manifest updated (' + articles.length + ' approved articles)');
}

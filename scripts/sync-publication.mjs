import { readFile, writeFile, rename } from 'node:fs/promises';
import { dirname, join } from 'node:path';

const source = process.env.TGA_PUBLICATION_FEED_URL;
const target = process.env.TGA_PUBLICATION_MANIFEST || 'content/published-articles.json';
if (!source) throw new Error('TGA_PUBLICATION_FEED_URL is required');
const parsedSource = new URL(source);
if (parsedSource.protocol !== 'https:' || !parsedSource.pathname.endsWith('/api/publication-feed')) {
  throw new Error('Expected an HTTPS Preview publication feed URL');
}

const response = await fetch(source, { headers: { accept: 'application/json' }, cache: 'no-store' });
if (!response.ok) throw new Error('Publication feed failed: HTTP ' + response.status);
const payload = await response.json();
if (!Array.isArray(payload.articles)) throw new Error('Publication feed has no articles array');

const seenKeys = new Set();
const seenSlugs = new Set();
const articles = payload.articles.map((article) => {
  if (article.publication_status !== 'published' || article.publication_approved !== true ||
      !['verified', 'verified_corrected', 'corrected'].includes(article.verification_state) ||
      !article.canonical_key || !article.slug || !article.headline || !article.body_markdown ||
      !article.published_at || !article.approved_at || !Array.isArray(article.citations) ||
      article.citations.length < 2) throw new Error('Feed contains an unapproved or incomplete article');
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

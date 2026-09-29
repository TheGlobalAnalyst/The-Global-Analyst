import { createClient } from '@supabase/supabase-js';
import { demoArticles } from './demo-data';
import publicationManifest from '../content/published-articles.json';

const allowedVerification = new Set(['verified', 'corrected', 'verified_with_corrections', 'verified_corrected']);

function approvedManifestArticles() {
  const keys = new Set();
  const slugs = new Set();
  return publicationManifest.filter(article => {
    if (article.publication_status !== 'published' || article.publication_approved !== true ||
        !allowedVerification.has(article.verification_state) || !article.canonical_key ||
        !article.slug || !article.headline || !article.body_markdown ||
        !Array.isArray(article.citations) || article.citations.length < 2 ||
        article.citations.some(c => !c || typeof c.url !== 'string' || !/^https?:\/\//i.test(c.url)) ||
        !article.approved_at || !article.published_at ||
        keys.has(article.canonical_key) || slugs.has(article.slug)) return false;
    keys.add(article.canonical_key);
    slugs.add(article.slug);
    return true;
  }).sort((a, b) => String(b.published_at || '').localeCompare(String(a.published_at || '')));
}

function supabaseClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return null;
  return createClient(url, key, { auth: { persistSession: false } });
}

export async function getPublishedArticles() {
  const supabase = supabaseClient();
  if (!supabase) {
    if (process.env.VERCEL_ENV === 'preview') throw new Error('Preview Supabase configuration missing');
    const published = approvedManifestArticles();
    return published.length ? published : demoArticles;
  }

  // The database policy exposes only approved, published newsroom objects.
  // Both Preview and Production may therefore use the same canonical public
  // feed without exposing drafts or internal newsroom records. The checked-in
  // manifest remains a safe continuity fallback when no environment is set.
  const { data, error } = await supabase
    .from('public_articles')
    .select('*')
    .eq('publication_status', 'published')
    .eq('publication_approved', true)
    .in('verification_state', [...allowedVerification])
    .order('published_at', { ascending: false });

  if (error) throw error;
  return data || [];
}

export async function getArticleBySlug(slug) {
  const all = await getPublishedArticles();
  return all.find(a => a.slug === slug) || null;
}

export async function getArticlesByAuthor(roleSlug) {
  const all = await getPublishedArticles();
  return all.filter(a => a.author_role_slug === roleSlug);
}

export async function getHomepageData() {
  const all = await getPublishedArticles();
  const featured = all.find(a => a.featured) || all[0] || null;
  const latestNews = all.filter(a => a.website_section === 'News' && a.slug !== featured?.slug).slice(0, 6);
  const analysis = all.filter(a => ['Analysis','Background'].includes(a.website_section) && a.slug !== featured?.slug).slice(0, 3);
  return { featured, latestNews, analysis };
}

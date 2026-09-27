import { createClient } from '@supabase/supabase-js';
import { demoArticles } from './demo-data';

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
    return demoArticles;
  }

  const { data, error } = await supabase
    .from('public_articles')
    .select('*')
    .eq('publication_status', 'published')
    .eq('publication_approved', true)
    .eq('verification_state', 'verified')
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

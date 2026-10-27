export const editorialTeam = [
  {
    slug: 'editor-in-chief',
    role: 'Editor in Chief',
    image: 'editor-in-chief',
    description: "Sets editorial priorities, commissions reporting and challenges evidence. Decides what deserves your attention — and what doesn't.",
    authorSlugs: ['editor-in-chief'],
    bylines: ['editor in chief', 'editor-in-chief'],
  },
  {
    slug: 'news-scanner',
    role: 'News Scanner',
    image: 'news-scanner',
    description: 'Monitors sources across languages and borders, follows developing stories and spots important changes others might miss.',
    authorSlugs: ['news-scanner'],
    bylines: ['news scanner'],
  },
  {
    slug: 'news-editor',
    role: 'News Editor',
    image: 'news-editor',
    description: 'Turns complex research into clear, accurate and engaging journalism. Strong headlines, essential context, no unnecessary noise.',
    authorSlugs: ['news-editor', 'the-global-analyst-news-editor'],
    bylines: ['news editor', 'the global analyst news editor'],
  },
  {
    slug: 'political-analyst',
    role: 'Politics & Diplomacy Analyst',
    image: 'politics-diplomacy-analyst',
    description: 'Investigates political dynamics, institutions, alliances and diplomacy — looking beyond official statements to understand what is changing.',
    authorSlugs: ['political-analyst', 'politics-diplomacy-analyst'],
    bylines: ['political analyst', 'politics & diplomacy analyst', 'politics and diplomacy analyst'],
  },
  {
    slug: 'security-analyst',
    role: 'Security & Conflict Analyst',
    image: 'security-conflict-analyst',
    description: 'Examines conflicts, security dynamics and their consequences for civilians, connecting individual events to larger patterns.',
    authorSlugs: ['security-analyst', 'security-conflict-analyst'],
    bylines: ['security analyst', 'security & conflict analyst', 'security and conflict analyst'],
  },
  {
    slug: 'economic-analyst',
    role: 'Economics Analyst',
    image: 'economics-analyst',
    description: 'Explores the economic forces shaping markets, governments and everyday lives — from trade and resources to jobs and public services.',
    authorSlugs: ['economic-analyst', 'economics-analyst'],
    bylines: ['economic analyst', 'economics analyst'],
  },
];

const generalAnalyst = {
  slug: 'general-analyst',
  role: 'General Analyst',
  description: 'The essential developments across the region, with the context and evidence needed to understand their significance.',
  authorSlugs: ['general-analyst'],
  bylines: ['general analyst'],
};

const normalizedByline = (value) => typeof value === 'string'
  ? value.toLowerCase().replace(/[—–]/g, ' ').replace(/\s+/g, ' ').trim()
  : '';

export function getEditorialProfile(slug) {
  return editorialTeam.find((member) => member.authorSlugs.includes(slug))
    || (slug === generalAnalyst.slug ? generalAnalyst : null);
}

export function articleProfileSlug(article) {
  const slug = article.author_role_slug;
  const direct = editorialTeam.find((member) => member.authorSlugs.includes(slug));
  if (direct) return direct.slug;
  // V2 uses the legacy general-analyst URL with an explicit News Editor byline.
  // Match that recorded credit; never infer authorship from topics or countries.
  if (slug && slug !== 'general-analyst') return null;
  const name = normalizedByline(article.author_role);
  const named = editorialTeam.find((member) => member.bylines.includes(name));
  if (named) return named.slug;
  return slug === generalAnalyst.slug || generalAnalyst.bylines.includes(name)
    ? generalAnalyst.slug : null;
}

export function articlesForProfile(articles, profile) {
  return articles.filter((article) => articleProfileSlug(article) === profile.slug)
    .sort((a, b) => String(b.published_at || '').localeCompare(String(a.published_at || '')));
}

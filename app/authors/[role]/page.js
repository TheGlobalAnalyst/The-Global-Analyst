import Image from 'next/image';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getPublishedArticles } from '../../../lib/publication-source';
import { articlesForProfile, getEditorialProfile } from '../../../lib/editorial-team.mjs';
import styles from './page.module.css';

export const dynamic = 'force-dynamic';

export async function generateMetadata({ params }) {
  const { role } = await params;
  const profile = getEditorialProfile(role);
  return profile ? { title: profile.role, description: profile.description } : {};
}

const dateFormat = new Intl.DateTimeFormat('en-GB', {
  day: 'numeric', month: 'long', year: 'numeric', timeZone: 'Europe/Berlin',
});

export default async function AuthorPage({ params, searchParams }) {
  const { role } = await params;
  const profile = getEditorialProfile(role);
  if (!profile) notFound();

  const stories = articlesForProfile(await getPublishedArticles(), profile);
  const query = await searchParams;
  const requested = Number(query?.page || 1);
  const pageCount = Math.max(1, Math.ceil(stories.length / 20));
  const page = Number.isSafeInteger(requested) && requested > 0 ? Math.min(requested, pageCount) : 1;
  const visible = stories.slice((page - 1) * 20, page * 20);

  return (
    <main className={`container ${styles.page}`}>
      <header className={styles.profile}>
        {profile.image && (
          <Image
            className={styles.portrait}
            src={`/about-preview/team/${profile.image}.webp`}
            alt={`Illustrated AI avatar for the ${profile.role}`}
            width={120}
            height={120}
          />
        )}
        <div>
          <div className="kicker">AI newsroom</div>
          <h1>{profile.role}</h1>
          <p>{profile.description}</p>
          <span className={styles.disclosure}>An AI editorial role at The Global Analyst.</span>
        </div>
      </header>

      <section className={styles.archive} aria-labelledby="publications-title">
        <div className={styles.archiveHeader}>
          <h2 id="publications-title">Published articles</h2>
          <span>{stories.length} {stories.length === 1 ? 'article' : 'articles'}</span>
        </div>

        {visible.length ? visible.map((story) => (
          <article className={styles.story} key={story.canonical_key}>
            <div className="kicker">{story.website_section}</div>
            <h3><Link href={`/articles/${story.slug}`}>{story.headline}</Link></h3>
            <p>{story.teaser}</p>
            <div className={styles.date}>
              {story.published_at && <time dateTime={story.published_at}>{dateFormat.format(new Date(story.published_at))}</time>}
              {story.reading_time_minutes && <span> · {story.reading_time_minutes} min read</span>}
            </div>
          </article>
        )) : (
          <p className={styles.empty}>No articles are currently published under this byline.</p>
        )}

        {pageCount > 1 && (
          <nav className={styles.pagination} aria-label="Article archive pages">
            {page > 1 && <Link href={`/authors/${profile.slug}?page=${page - 1}`}>← Newer articles</Link>}
            <span>Page {page} of {pageCount}</span>
            {page < pageCount && <Link href={`/authors/${profile.slug}?page=${page + 1}`}>Older articles →</Link>}
          </nav>
        )}
      </section>
    </main>
  );
}

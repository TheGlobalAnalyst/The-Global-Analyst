import Link from 'next/link';
import StoryMeta from '../../components/StoryMeta';
import { getNewsArchive } from '../../lib/publication-source';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'News archive', description: 'The Global Analyst’s published reporting from across the Sahel.' };

export default async function NewsArchive({ searchParams }) {
  const query = await searchParams;
  const requested = Number(query?.page || 1);
  const page = Number.isSafeInteger(requested) && requested > 0 ? requested : 1;
  const pageSize = 24;
  const { articles, total } = await getNewsArchive(page, pageSize);
  const lastPage = Math.max(1, Math.ceil(total / pageSize));

  return (
    <main className="container">
      <section className="pageHero">
        <div className="kicker">Published reporting</div>
        <h1>News</h1>
        <p>Follow our latest reporting and browse earlier stories from the Sahel.</p>
      </section>
      <section className="section">
        {articles.length === 0 ? <p>No stories on this page.</p> : (
          <div className="storyGrid">
            {articles.map(story => (
              <article className="storyCard" key={story.id || story.canonical_key}>
                <div className="kicker">{story.countries?.[0] || 'News'}</div>
                <h2><Link href={`/articles/${story.slug}`}>{story.headline}</Link></h2>
                <p>{story.teaser}</p>
                <StoryMeta story={story}/>
              </article>
            ))}
          </div>
        )}
        {lastPage > 1 && (
          <nav aria-label="News archive pages" style={{display:'flex',gap:'24px',margin:'32px 0'}}>
            {page > 1 && <Link href={page === 2 ? '/news' : `/news?page=${page - 1}`}>← Newer stories</Link>}
            <span>Page {page} of {lastPage}</span>
            {page < lastPage && <Link href={`/news?page=${page + 1}`}>Older stories →</Link>}
          </nav>
        )}
      </section>
    </main>
  );
}

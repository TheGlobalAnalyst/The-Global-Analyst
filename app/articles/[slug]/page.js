import { notFound } from 'next/navigation';
import Link from 'next/link';
import ReactMarkdown from 'react-markdown';
import StoryMeta from '../../../components/StoryMeta';
import { getArticleBySlug, getPublishedArticles } from '../../../lib/publication-source';

export const dynamic = 'force-dynamic';

export async function generateMetadata({params}){
  const {slug} = await params;
  const story = await getArticleBySlug(slug);
  if (!story) return {};
  return {
    title: story.headline,
    description: story.teaser,
    openGraph: {title: story.headline, description: story.teaser, type:'article'}
  };
}

export default async function ArticlePage({params}){
  const {slug} = await params;
  const story = await getArticleBySlug(slug);
  if(!story) notFound();

  const all = await getPublishedArticles();
  const related = (story.related_content || [])
    .map(s => all.find(a => a.slug === s || a.canonical_key === s))
    .filter(Boolean)
    .slice(0,3);

  return (
    <main className="container">
      <article className="article" data-content-sha256={story.content_sha256 || undefined}>
        <div className="kicker">{story.lead_label || story.website_section}</div>
        <h1>{story.headline}</h1>
        <p className="standfirst">{story.teaser}</p>
        <div className="articleMeta"><StoryMeta story={story}/></div>

        <div className="articleBody"><ReactMarkdown>{story.body_markdown}</ReactMarkdown></div>

        {story.citations?.length > 0 && (
          <section className="sources">
            <div className="kicker">Sources</div>
            <ul>
              {story.citations.map((c,i) => (
                <li key={i}><a href={c.url} target="_blank" rel="noreferrer">{c.publisher || c.url}</a></li>
              ))}
            </ul>
          </section>
        )}

        <div className="disclosure"><strong>AI disclosure:</strong> {story.ai_disclosure}</div>

        <section className="signupBox">
          <div className="kicker">The Sahel Brief</div>
          <h2 style={{fontFamily:"Georgia,serif",fontSize:"30px",margin:"5px 0 8px"}}>Get the daily briefing</h2>
          <p>{story.newsletter_cta || 'Follow the most important developments across the Sahel each morning.'}</p>
          <Link className="button" href="/newsletters">Subscribe</Link>
        </section>

        {related.length > 0 && (
          <section className="related">
            <div className="kicker">Related</div>
            {related.map(r => (
              <div key={r.canonical_key} style={{padding:"10px 0"}}>
                <Link href={`/articles/${r.slug}`}><strong>{r.headline}</strong></Link>
              </div>
            ))}
          </section>
        )}
      </article>
    </main>
  );
}

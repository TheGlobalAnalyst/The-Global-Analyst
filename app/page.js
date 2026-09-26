import Link from 'next/link';
import StoryMeta from '../components/StoryMeta';
import { getHomepageData } from '../lib/publication-source';

export const dynamic = 'force-dynamic';

export default async function Home(){
  const {featured, latestNews, analysis} = await getHomepageData();

  return (
    <main>
      {featured && (
        <section className="hero">
          <div className="container">
            <div className="kicker">Today's original</div>
            <h1 className="heroTitle"><Link href={`/articles/${featured.slug}`}>{featured.headline}</Link></h1>
            <p className="heroDeck">{featured.teaser}</p>
            <StoryMeta story={featured}/>
          </div>
        </section>
      )}

      <section className="section" id="news">
        <div className="container">
          <div className="sectionHeader"><h2 className="sectionTitle">Latest News</h2></div>
          <div className="storyGrid">
            {latestNews.map(story => (
              <article className="storyCard" key={story.canonical_key}>
                <div className="kicker">{story.countries?.[0] || 'News'}</div>
                <h3><Link href={`/articles/${story.slug}`}>{story.headline}</Link></h3>
                <p>{story.teaser}</p>
                <StoryMeta story={story}/>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="newsletterBand">
        <div className="container newsletterInner">
          <div>
            <div className="kicker" style={{color:'white'}}>Daily newsletter</div>
            <h2>The Sahel Brief</h2>
            <p>The essential daily briefing on Mali, Niger, Burkina Faso, Mauritania, Chad and the wider Sahel — with links to our strongest original reporting and analysis.</p>
          </div>
          <Link href="/newsletters" className="newsletterButton">Explore newsletters →</Link>
        </div>
      </section>

      <section className="section" id="analysis">
        <div className="container">
          <div className="sectionHeader"><h2 className="sectionTitle">Analysis</h2></div>
          <div className="analysisGrid">
            {analysis.map(story => (
              <article className="analysisCard" key={story.canonical_key}>
                <div className="kicker">{story.website_section}</div>
                <h3><Link href={`/articles/${story.slug}`}>{story.headline}</Link></h3>
                <p>{story.teaser}</p>
                <StoryMeta story={story}/>
              </article>
            ))}
          </div>
        </div>
      </section>

      <div className="aiBand">
        <div className="container"><strong>AI-powered news and analysis.</strong> The Global Analyst uses an AI-powered newsroom to discover, research, verify and edit large volumes of information every day.</div>
      </div>
    </main>
  );
}

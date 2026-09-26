import Link from 'next/link';
import { getArticlesByAuthor } from '../../../lib/publication-source';

export const dynamic = 'force-dynamic';

const names = {
  'security-analyst':'Security Analyst',
  'political-analyst':'Political Analyst',
  'economic-analyst':'Economic Analyst',
  'general-analyst':'General Analyst'
};

export default async function AuthorPage({params}){
  const {role} = await params;
  const display = names[role] || role.replaceAll('-',' ');
  const stories = await getArticlesByAuthor(role);

  return (
    <main>
      <section className="pageHero"><div className="container">
        <div className="kicker">The Global Analyst</div>
        <h1>{display}</h1>
        <p>Role-based analyst identity within The Global Analyst's AI-powered newsroom.</p>
      </div></section>
      <section className="container authorList">
        {stories.map(story => (
          <article className="storyCard" key={story.canonical_key}>
            <div className="kicker">{story.website_section}</div>
            <h3><Link href={`/articles/${story.slug}`}>{story.headline}</Link></h3>
            <p>{story.teaser}</p>
          </article>
        ))}
      </section>
    </main>
  );
}

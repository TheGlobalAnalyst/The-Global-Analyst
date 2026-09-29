import Link from 'next/link';
import { getArticlesByAuthor } from '../../../lib/publication-source';

export const dynamic = 'force-dynamic';

const descriptions = {
  'security-analyst':'Conflict, armed groups and security policy: what changed on the ground, what is confirmed and what remains uncertain.',
  'political-analyst':'Governments, diplomacy and institutions: who gains influence, what changes in policy and what has moved beyond rhetoric.',
  'economic-analyst':'Trade, mining, energy and public finance: who pays, who benefits and what changes in practice.',
  'general-analyst':'The essential developments across the region, with the context and evidence needed to understand their significance.'
};

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
        <p>{descriptions[role] || 'Reporting and analysis from The Global Analyst.'}</p>
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

import Link from 'next/link';
import { articleProfileSlug } from '../lib/editorial-team.mjs';

export default function StoryMeta({story}){
  const date = story.published_at
    ? new Intl.DateTimeFormat('en-GB',{day:'numeric',month:'short',year:'numeric'}).format(new Date(story.published_at))
    : '';
  return (
    <div className="meta">
      <Link href={`/authors/${articleProfileSlug(story) || story.author_role_slug || 'general-analyst'}`}><strong>{story.author_role}</strong></Link>
      <span> · {story.reading_time_minutes || 4} min read</span>
      {date && <span> · {date}</span>}
    </div>
  );
}

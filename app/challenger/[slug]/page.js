import {notFound} from 'next/navigation';
import {createClient} from '@supabase/supabase-js';
import ReactMarkdown from 'react-markdown';
export const dynamic='force-dynamic';
export const metadata={title:'Sahel Brief — V0 challenger',robots:{index:false,follow:false}};
function withoutInlineSources(text) {
 return text
  .replace(/[ \t]*\((?:\[[^\]\n]+\]\(https?:\/\/[^\s)]+\)[\s,;]*)+\)/g,'')
  .replace(/\[([^\]\n]+)\]\(https?:\/\/[^\s)]+\)/g,'$1')
  .replace(/<?https?:\/\/[^\s<>]+>?/g,'')
  .replace(/[ \t]+\n/g,'\n').trim();
}
export default async function ChallengerArticle({params}) {
 const {slug}=await params;
 if(!/^v0-[a-f0-9]{24}$/.test(slug))notFound();
 const db=createClient(process.env.NEXT_PUBLIC_SUPABASE_URL,process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,{auth:{persistSession:false}});
 const {data,error}=await db.from('challenger_v0_articles').select('article,content_sha256').eq('slug',slug).eq('publication_approved',true).maybeSingle();
 if(error)throw new Error('Challenger publication unavailable');
 if(!data)notFound();
 const a=data.article;
 const v1=/^v[12]-/.test(a.id||'');
 const teaser=v1?withoutInlineSources(a.teaser):a.teaser;
 const body=v1?withoutInlineSources(a.body_markdown):a.body_markdown;
 return <main className="container"><article className="article" data-content-sha256={data.content_sha256}>
  <div className="kicker">The Sahel Brief · Challenger V0</div>
  <h1>{a.headline}</h1><div className="standfirst"><ReactMarkdown>{teaser}</ReactMarkdown></div>
  <p className="articleMeta">Edition: {a.window_end.slice(0,10)} · {a.section==='ongoing'?'Ongoing development':'Reported development'}</p>
  <div className="articleBody"><ReactMarkdown>{body}</ReactMarkdown></div>
  <section className="sources"><h2>Sources</h2><ul>{a.sources.map((s,i)=><li key={i}><a href={s.url} rel="noreferrer" target="_blank">{s.publisher}</a></li>)}</ul></section>
  <p className="disclosure">Produced by The Global Analyst’s experimental AI newsroom from linked public reporting. Source checks are not independent fact verification.</p>
 </article></main>;
}

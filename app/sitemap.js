import { getPublishedArticles } from '../lib/publication-source';

export const dynamic='force-dynamic';

export default async function sitemap(){
  const articles = await getPublishedArticles();
  return [
    {url:'https://www.theglobalanalyst.com',lastModified:new Date()},
    {url:'https://www.theglobalanalyst.com/newsletters',lastModified:new Date()},
    {url:'https://www.theglobalanalyst.com/about',lastModified:new Date()},
    ...articles.map(a => ({
      url:`https://www.theglobalanalyst.com/articles/${a.slug}`,
      lastModified:a.published_at ? new Date(a.published_at) : new Date()
    }))
  ];
}

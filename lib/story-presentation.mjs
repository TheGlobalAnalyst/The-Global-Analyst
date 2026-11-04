const places = ['Burkina Faso','Mauritania','Sudan','Mali','Niger','Chad','West Africa','Western Sahara','Sahel','Senegal'];
export const AI_DISCLOSURE = 'Produced by The Global Analyst’s AI-powered newsroom.';
export function storyLabel(story) {
  const explicit = [story.geography_label, ...(Array.isArray(story.countries)?story.countries:[])].find(s=>typeof s==='string'&&s.trim()&&s!=='Sahel');
  if (explicit) return explicit.trim();
  const headline=String(story.headline||'');
  for (const place of places) if (headline.toLocaleLowerCase('en').includes(place.toLocaleLowerCase('en'))) return place;
  const topic=Array.isArray(story.topics)?story.topics[0]:story.topic_label;
  if (topic && !/^(news|analysis|feature|also important|today.s lead)$/i.test(topic)) return topic;
  return 'Sahel';
}

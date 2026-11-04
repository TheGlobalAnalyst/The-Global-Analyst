import {publicationOrder} from './v0-publications.mjs';

export function hyperagentFeed(live, history, cutoff) {
  if (!Number.isFinite(Date.parse(cutoff))) throw new Error('Invalid legacy publication cutoff');
  // A baseline's later reporting-window clock must not displace the champion.
  return [...live].sort(publicationOrder).concat(
    history.filter(a=>Date.parse(a.published_at)<Date.parse(cutoff)).sort(publicationOrder)
  );
}

export function homepageNewsroom(articles) {
  const live=articles.filter(a=>a.source==='hyperagent');
  return live.length ? live : articles;
}

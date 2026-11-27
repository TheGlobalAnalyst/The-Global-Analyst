export const placements = ['lead', 'top', 'more', 'also'];
export const premiumGenres = ['analysis', 'feature', 'background'];
export const genres = ['news', ...premiumGenres];
export const genreLabels = {news:'News', analysis:'Analysis', feature:'Feature', background:'Background'};

export const placement = role => role === 'analysis' ? 'more' : role;

// Older packages sometimes encoded the format in the topic label. Retain the
// historical Analysis default when the label only identifies a geography.
export function articleGenre(article) {
  if (article.genre !== undefined) return article.genre;
  if ((article.role ?? article.editorial_role) !== 'analysis') return 'news';
  return /^(analysis|feature|background)(?:\s*[·:|—–-]|\s*$)/i.exec(article.topic_label || '')?.[1].toLowerCase() || 'analysis';
}

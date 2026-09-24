import { upsertArticles } from '../articleRepo.js';
import { readNotionSnapshot } from './notionSnapshot.js';

// Stable IDs preserve saved references; startup never overwrites newer DB content.
export async function importNotionSnapshot(onlyMissing = true) {
  const articles = await readNotionSnapshot();
  await upsertArticles(articles, onlyMissing);
  return articles.length;
}

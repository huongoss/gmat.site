import { BlogPost } from '../types/blog';
import buildEffectiveGmatDailyRoutine from './posts/build-effective-gmat-daily-routine';
import enjoyTheProcessConsistentGmatGrowth from './posts/enjoy-the-process-consistent-gmat-growth';

// Aggregate all posts here for now (explicit import keeps tree-shaking predictable)
export const posts: BlogPost[] = [
  buildEffectiveGmatDailyRoutine,
  enjoyTheProcessConsistentGmatGrowth
];

export function getPostBySlug(slug: string) {
  return posts.find(p => p.slug === slug);
}

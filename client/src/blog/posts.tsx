import { BlogPost } from '../types/blog';
import buildEffectiveGmatDailyRoutine from './posts/build-effective-gmat-daily-routine';
import enjoyTheProcessConsistentGmatGrowth from './posts/enjoy-the-process-consistent-gmat-growth';
import masterTheGmatStrategicGuideToReasoning from './posts/master-the-gmat-strategic-guide-to-reasoning';
import deepDiveGmatVerbalReasoning from './posts/deep-dive-gmat-verbal-reasoning';

// Aggregate all posts here for now (explicit import keeps tree-shaking predictable)
export const posts: BlogPost[] = [
  deepDiveGmatVerbalReasoning,
  masterTheGmatStrategicGuideToReasoning,
  buildEffectiveGmatDailyRoutine,
  enjoyTheProcessConsistentGmatGrowth
];

export function getPostBySlug(slug: string) {
  return posts.find(p => p.slug === slug);
}

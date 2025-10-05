export interface BlogPostMeta {
  slug: string;
  title: string;
  date: string; // ISO yyyy-mm-dd
  readingMinutes: number;
  excerpt: string;
  tags?: string[];
}

export interface BlogPost extends BlogPostMeta {
  render: () => JSX.Element;
}

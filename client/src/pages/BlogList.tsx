import React from 'react';
import { Link } from 'react-router-dom';
import { posts } from '../blog/posts';
import '../styles/blog.css';
import SEO from '../components/SEO';

const BlogList: React.FC = () => {
  const sorted = [...posts].sort((a,b) => b.date.localeCompare(a.date));
  const blogLd = {
    '@context': 'https://schema.org',
    '@type': 'Blog',
    name: 'GMAT.site Blog',
    url: 'https://gmat.site/blog',
    description: 'Strategies and systems for efficient GMAT preparation.'
  };
  return (
    <div className="blog-container">
      <SEO
        title="Blog"
        description="GMAT preparation articles: study routines, timing strategy, error analysis, and consistency systems."
        canonical="https://gmat.site/blog"
        jsonLd={blogLd}
      />
      <h1 className="blog-title">GMAT.site Blog</h1>
      <p className="blog-sub">Evidence‑based strategies & practice systems for efficient GMAT prep.</p>
      <div className="blog-grid">
        {sorted.map(p => (
          <Link to={`/blog/${p.slug}`} key={p.slug} className="blog-card">
            <div className="blog-card-body">
              <h2>{p.title}</h2>
              <p className="meta">{p.date} · {p.readingMinutes} min read</p>
              <p className="excerpt">{p.excerpt}</p>
              {p.tags && <div className="tags">{p.tags.map(t => <span key={t} className="tag">{t}</span>)}</div>}
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
};

export default BlogList;

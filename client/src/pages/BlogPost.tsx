import React, { useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { getPostBySlug } from '../blog/posts';
import '../styles/blog.css';
import SEO from '../components/SEO';

const BlogPost: React.FC = () => {
  const { slug } = useParams();
  const post = slug ? getPostBySlug(slug) : null;

  useEffect(() => {
    if (post) document.title = `${post.title} – GMAT.site Blog`;
    return () => { document.title = 'GMAT.site'; };
  }, [post]);

  if (!post) {
    return (
      <div className="blog-container">
        <p>Post not found.</p>
      </div>
    );
  }

  const url = `https://gmat.site/blog/${post.slug}`;
  const articleLd = {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    headline: post.title,
    datePublished: post.date,
    dateModified: post.date,
    author: { '@type': 'Organization', name: 'GMAT.site' },
    publisher: { '@type': 'Organization', name: 'GMAT.site', logo: { '@type': 'ImageObject', url: 'https://gmat.site/favicon.jpg' } },
    description: post.excerpt,
    mainEntityOfPage: url,
    url
  };
  return (
    <div className="blog-container single">
      <SEO
        title={post.title}
        description={post.excerpt}
        canonical={url}
        jsonLd={articleLd}
      />
      {post.render()}
    </div>
  );
};

export default BlogPost;

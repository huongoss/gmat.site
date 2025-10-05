import React from 'react';
import { Helmet } from 'react-helmet-async';

interface SEOProps {
  title?: string;
  description?: string;
  canonical?: string;
  noIndex?: boolean;
  jsonLd?: Record<string, any> | Record<string, any>[];
  openGraphImage?: string;
}

const SITE = 'https://gmat.site';

export const SEO: React.FC<SEOProps> = ({
  title,
  description,
  canonical,
  noIndex,
  jsonLd,
  openGraphImage
}) => {
  const fullTitle = title ? `${title} | GMAT.site` : 'GMAT.site – Smart Daily GMAT Practice';
  const ogImage = openGraphImage || `${SITE}/favicon.svg`;
  return (
    <Helmet>
      <title>{fullTitle}</title>
      {description && <meta name="description" content={description} />}
      {canonical && <link rel="canonical" href={canonical} />}
      {noIndex && <meta name="robots" content="noindex,nofollow" />}
      {/* Basic OG/Twitter */}
      <meta property="og:title" content={fullTitle} />
      {description && <meta property="og:description" content={description} />}
      <meta property="og:type" content="website" />
      <meta property="og:url" content={canonical || SITE} />
      <meta property="og:image" content={ogImage} />
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={fullTitle} />
      {description && <meta name="twitter:description" content={description} />}
      <meta name="twitter:image" content={ogImage} />
      {Array.isArray(jsonLd) && jsonLd.map((obj, i) => (
        <script key={i} type="application/ld+json">{JSON.stringify(obj)}</script>
      ))}
      {!Array.isArray(jsonLd) && jsonLd && (
        <script type="application/ld+json">{JSON.stringify(jsonLd)}</script>
      )}
    </Helmet>
  );
};

export default SEO;
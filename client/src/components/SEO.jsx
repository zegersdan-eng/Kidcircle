/**
 * SEO — Dynamic meta tags for social sharing and search engines.
 * Uses react-helmet-async for per-page title, description, OG, and Twitter card tags.
 */
import { Helmet } from 'react-helmet-async';

const SITE_URL = typeof window !== 'undefined'
  ? window.location.origin
  : 'https://kidcircle.app';
const DEFAULT_TITLE = 'KidCircle — Trusted Recommendations for Austin Family Services';
const DEFAULT_DESC = 'Find trusted tutors, camps, and enrichment programs recommended by Austin parents. AI-powered discovery, verified providers, and last-minute class swaps.';
const DEFAULT_IMAGE = `${SITE_URL}/og-image.png`;

export default function SEO({
  title,
  description,
  image = DEFAULT_IMAGE,
  url,
  type = 'website',
  publishedTime,
  author,
  keywords,
}) {
  const pageTitle = title ? `${title} | KidCircle` : DEFAULT_TITLE;
  const pageDesc = description || DEFAULT_DESC;
  const pageUrl = url ? `${SITE_URL}${url}` : SITE_URL;

  return (
    <Helmet>
      <title>{pageTitle}</title>
      <meta name="title" content={pageTitle} />
      <meta name="description" content={pageDesc} />
      {keywords && <meta name="keywords" content={keywords} />}
      <link rel="canonical" href={pageUrl} />

      {/* Open Graph */}
      <meta property="og:type" content={type} />
      <meta property="og:url" content={pageUrl} />
      <meta property="og:title" content={pageTitle} />
      <meta property="og:description" content={pageDesc} />
      <meta property="og:image" content={image} />
      <meta property="og:image:width" content="1200" />
      <meta property="og:image:height" content="630" />
      <meta property="og:locale" content="en_US" />
      <meta property="og:site_name" content="KidCircle" />

      {/* Twitter */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:url" content={pageUrl} />
      <meta name="twitter:title" content={pageTitle} />
      <meta name="twitter:description" content={pageDesc} />
      <meta name="twitter:image" content={image} />

      {/* Article-specific */}
      {publishedTime && (
        <meta property="article:published_time" content={publishedTime} />
      )}
      {author && <meta name="author" content={author} />}
    </Helmet>
  );
}
import { Helmet } from 'react-helmet-async';

interface JsonLdProps {
  data: Record<string, any>;
}

export function JsonLd({ data }: JsonLdProps) {
  return (
    <Helmet>
      <script type="application/ld+json">
        {JSON.stringify(data)}
      </script>
    </Helmet>
  );
}

export function buildDreamSchema(dream: {
  title: string;
  content: string;
  slug: string;
  category_name?: string;
  created_at: string;
  updated_at: string;
  view_count?: number;
  like_count?: number;
  islamic_interpretation?: string;
  psychological_interpretation?: string;
}) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: dream.title,
    description: dream.content.slice(0, 160),
    url: `https://ruyatabirleri.com/ruya/${dream.slug}`,
    datePublished: dream.created_at,
    dateModified: dream.updated_at,
    author: {
      '@type': 'Organization',
      name: 'Rüya Tabirleri',
      url: 'https://ruyatabirleri.com',
    },
    publisher: {
      '@type': 'Organization',
      name: 'Rüya Tabirleri',
      url: 'https://ruyatabirleri.com',
      logo: {
        '@type': 'ImageObject',
        url: 'https://ruyatabirleri.com/logo.png',
      },
    },
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': `https://ruyatabirleri.com/ruya/${dream.slug}`,
    },
    articleSection: dream.category_name || 'Rüya Tabiri',
    keywords: dream.category_name,
    interactionStatistic: [
      {
        '@type': 'InteractionCounter',
        interactionType: 'https://schema.org/ViewAction',
        userInteractionCount: dream.view_count || 0,
      },
      {
        '@type': 'InteractionCounter',
        interactionType: 'https://schema.org/LikeAction',
        userInteractionCount: dream.like_count || 0,
      },
    ],
    about: [
      dream.islamic_interpretation && {
        '@type': 'Thing',
        name: 'İslami Rüya Yorumu',
      },
      dream.psychological_interpretation && {
        '@type': 'Thing',
        name: 'Psikolojik Rüya Yorumu',
      },
    ].filter(Boolean),
  };
}

export function buildCategorySchema(category: {
  name: string;
  slug: string;
  description?: string;
  dream_count?: number;
}) {
  return {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: category.name,
    description: category.description || `${category.name} kategorisindeki rüya tabirleri`,
    url: `https://ruyatabirleri.com/kategori/${category.slug}`,
    numberOfItems: category.dream_count || 0,
    publisher: {
      '@type': 'Organization',
      name: 'Rüya Tabirleri',
      url: 'https://ruyatabirleri.com',
    },
  };
}

export function buildWebsiteSchema() {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: 'Rüya Tabirleri',
    url: 'https://ruyatabirleri.com',
    description: 'Binlerce rüya tabiri arasında arama yapın. İslami ve psikolojik yorumlarla rüyalarınızın anlamını keşfedin.',
    inLanguage: 'tr',
    potentialAction: {
      '@type': 'SearchAction',
      target: {
        '@type': 'EntryPoint',
        urlTemplate: 'https://ruyatabirleri.com/ara?q={search_term_string}',
      },
      'query-input': 'required name=search_term_string',
    },
    publisher: {
      '@type': 'Organization',
      name: 'Rüya Tabirleri',
      url: 'https://ruyatabirleri.com',
      logo: {
        '@type': 'ImageObject',
        url: 'https://ruyatabirleri.com/logo.png',
      },
    },
  };
}

export function buildFAQSchema(faqs: { question: string; answer: string }[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqs.map(faq => ({
      '@type': 'Question',
      name: faq.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: faq.answer,
      },
    })),
  };
}

export function buildBreadcrumbSchema(items: { name: string; url: string }[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: item.url,
    })),
  };
}

export function buildBlogPostSchema(post: {
  title: string;
  slug: string;
  excerpt?: string;
  content: string;
  created_at: string;
  updated_at: string;
  author_name?: string;
  featured_image?: string;
}) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    headline: post.title,
    description: post.excerpt || post.content.slice(0, 160),
    url: `https://ruyatabirleri.com/blog/${post.slug}`,
    datePublished: post.created_at,
    dateModified: post.updated_at,
    author: {
      '@type': 'Person',
      name: post.author_name || 'Rüya Tabirleri',
    },
    publisher: {
      '@type': 'Organization',
      name: 'Rüya Tabirleri',
      url: 'https://ruyatabirleri.com',
    },
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': `https://ruyatabirleri.com/blog/${post.slug}`,
    },
    image: post.featured_image || 'https://ruyatabirleri.com/og-default.png',
  };
}

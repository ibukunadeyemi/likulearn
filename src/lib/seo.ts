/** Schema.org (JSON-LD) objects for BaseLayout's `schema` prop. */
import { home, type Faq, type Post } from '../data/content';

export const SITE_URL = 'https://likulearn.com';
const abs = (path: string) => new URL(path, SITE_URL).href;

const ORG_ID = abs('/#organization');

export const organization = () => ({
  '@type': 'EducationalOrganization',
  '@id': ORG_ID,
  name: 'Likulearn',
  url: abs('/'),
  logo: abs('/logo-512.png'),
  description: home.footer_about,
  email: home.contact_email,
});

export const website = () => ({
  '@type': 'WebSite',
  '@id': abs('/#website'),
  name: 'Likulearn',
  url: abs('/'),
  inLanguage: 'en',
  publisher: { '@id': ORG_ID },
});

export const breadcrumbs = (items: { name: string; path: string }[]) => ({
  '@type': 'BreadcrumbList',
  itemListElement: items.map((item, i) => ({
    '@type': 'ListItem',
    position: i + 1,
    name: item.name,
    item: abs(item.path),
  })),
});

export const blogPosting = (post: Post) => ({
  '@type': 'BlogPosting',
  headline: post.title,
  description: post.excerpt,
  image: post.cover.src,
  datePublished: post.date,
  url: abs(`/blog/${post.slug}`),
  mainEntityOfPage: abs(`/blog/${post.slug}`),
  inLanguage: 'en',
  author: { '@id': ORG_ID },
  publisher: organization(),
});

export const faqPage = (faqs: Faq[]) => ({
  '@type': 'FAQPage',
  mainEntity: faqs.map((f) => ({
    '@type': 'Question',
    name: f.q,
    acceptedAnswer: { '@type': 'Answer', text: f.a },
  })),
});

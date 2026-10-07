/**
 * All site copy. Edit here and redeploy; the site is static.
 *
 * Section headings: wrap a word in *asterisks* to colour it; "\n" starts a new line.
 */

export interface Img {
  src: string;
  alt: string;
  width: number;
  height: number;
}

export const home = {
  hero_badge: 'Free trial class for every new learner',
  hero_title: "Unlock Your Child's Potential with",
  hero_highlight: 'Expert Teachers!',
  hero_lead: 'Live online classes for ages 3–18 across Science, Commercial and Arts subjects. Register your children in minutes, and we’ll match each one with a vetted teacher.',
  hero_primary_label: 'Book a free trial',
  hero_secondary_label: 'How it works',
  proof_text: 'Loved by parents worldwide',
  hero_image: {
    src: 'https://images.unsplash.com/photo-1623076189461-f7706b741c04?auto=format&fit=crop&w=1600&q=70',
    alt: 'A child in an online class wearing headphones',
    width: 1600,
    height: 1067,
  } satisfies Img,
  hero_image_credit: 'Photo by Thomas Park on Unsplash',
  hero_image_credit_url: 'https://unsplash.com/@thomascpark',

  steps_title: 'Start *Learning* in 3 Simple Steps',
  steps: [
    { title: 'Register Your Child', text: 'Fill one form for all your children: subjects, ages and the times that suit your family.' },
    { title: 'We Match a Teacher', text: 'Our team reviews each request and assigns a qualified teacher for every subject.' },
    { title: 'Start Learning', text: 'Join a free trial class live online, then choose the plan that fits.' },
  ],

  benefits_title: 'Our Benefits',
  benefits_intro: 'Experienced educators, live classrooms and a curriculum built around each child, so they build a strong foundation for the future.',
  // icon: a key of BENEFIT_ICONS; color: a key of BENEFIT_COLORS (src/lib/ui.ts)
  benefits: [
    { title: 'Holistic Learning', text: 'Lessons that build understanding, confidence and study habits, not just test scores.', icon: 'graduation', color: 'orange' },
    { title: 'Experienced Educators', text: 'Every teacher is vetted for subject expertise and experience teaching children online.', icon: 'award', color: 'amber' },
    { title: 'Safe, Nurturing Classes', text: 'Supervised virtual classrooms with clear safeguarding standards for every session.', icon: 'shield', color: 'blue' },
    { title: 'Science, Commercial & Arts', text: 'From early phonics to exam-level Physics, Accounting and Literature.', icon: 'flask', color: 'green' },
    { title: 'Individual Attention', text: '1-on-1 or small groups, paced to each child and adjusted as they grow.', icon: 'person', color: 'lime' },
    { title: 'Parent Involvement', text: 'Regular progress updates and a direct line to your child’s teacher.', icon: 'family', color: 'red' },
  ],

  enrol_title: 'Register Your Child for a *Free Trial*',
  enrol_intro: "One form for the whole family. We'll review it and assign a teacher within 48 hours.",

  teach_title: 'Share Your *Knowledge*\nWith Learners Worldwide',
  teach_text: 'Are you a qualified teacher in a Science, Commercial or Arts subject? Join Likulearn to teach live online classes. We handle enrolment, matching and scheduling so you can focus on teaching.',
  teach_perks: ['Global reach', 'Flexible schedule', 'Ready-made enrolments', 'Fair, on-time pay'],
  teach_cta_label: 'Apply to teach',
  teach_cta_url: 'mailto:hello@likulearn.com?subject=Teaching%20at%20Likulearn',
  teach_badge_title: 'Teach from anywhere',
  teach_badge_text: 'Flexible hours',
  teach_image: {
    src: 'https://images.unsplash.com/photo-1758685848142-06e158cf64bc?auto=format&fit=crop&w=1200&q=70',
    alt: 'A teacher on a video call',
    width: 1200,
    height: 1200,
  } satisfies Img,
  teach_image_credit: 'Photo by Vitaly Gariev on Unsplash',
  teach_image_credit_url: 'https://unsplash.com/@silverkblack',

  testimonials_title: 'What Parents Say About\n*Their Results*',
  testimonials_intro: 'Families across time zones use Likulearn for steady, personal teaching.',
  blog_title: 'Explore *Insights* &\nParenting Tips',

  footer_title: "Let's Connect There",
  footer_about: 'Live online classes for children aged 3–18, taught by vetted teachers in Science, Commercial and Arts subjects.',
  contact_email: 'hello@likulearn.com',
  /** With country code, e.g. "+234 801 234 5678". Leave empty to hide the link. */
  whatsapp_number: '',
};

export type Home = typeof home;

export const testimonials = [
  { name: 'Parent name', role: 'Mother of two', quote: 'Both my kids are in different time zones from their old school, but Likulearn found teachers that fit our week perfectly.' },
  { name: 'Parent name', role: 'Father, Year 10 student', quote: 'My son’s Chemistry grade went up a full band in one term. The teacher sends notes after every lesson.' },
  { name: 'Parent name', role: 'Mother, age 6', quote: 'The phonics classes are playful and short enough to hold her attention. She asks when the next one is.' },
];

export interface Post {
  slug: string;
  title: string;
  excerpt: string;
  /** ISO date, newest first on the site. */
  date: string;
  cover: Img;
  cover_credit?: string;
  cover_credit_url?: string;
  /** Paragraphs of the article. */
  body: string[];
}

export const posts: Post[] = [
  {
    slug: 'learning-with-games',
    title: 'Learning with Games: Why It Works',
    excerpt: 'How play-based lessons keep younger children focused online.',
    date: '2026-10-06',
    cover: { src: 'https://images.unsplash.com/photo-1603205431143-ce58f21799a4?auto=format&fit=crop&w=1200&q=70', alt: 'Colourful game pieces on a table', width: 1200, height: 800 },
    cover_credit: 'Photo by Brett Jordan on Unsplash',
    cover_credit_url: 'https://unsplash.com/@brett_jordan',
    body: [
      'Young children learn best when they are active. Short games (matching sounds to letters, racing to solve a sum, building a word from scrambled tiles) turn practice into something they want to repeat.',
      'In our online classes, teachers mix quick games with explanation and calm practice, so attention stays high without lessons becoming chaotic.',
      'At home, you can do the same: keep activities short, celebrate effort, and stop while your child is still enjoying it.',
    ],
  },
  {
    slug: 'choosing-science-commercial-arts',
    title: 'Choosing Between Science, Commercial & Arts',
    excerpt: 'A parent’s guide to subject choices before exam years.',
    date: '2026-10-05',
    cover: { src: 'https://images.unsplash.com/photo-1758685733907-42e9651721f5?auto=format&fit=crop&w=1200&q=70', alt: 'A student studying with a laptop', width: 1200, height: 800 },
    cover_credit: 'Photo by Vitaly Gariev on Unsplash',
    cover_credit_url: 'https://unsplash.com/@silverkblack',
    body: [
      'Choosing a subject track is a big decision, but it doesn’t have to be a stressful one. Start with what your child enjoys and where they are already strong.',
      'Talk through the careers and courses each track leads to, and remember that many paths stay open whichever track they choose.',
      'If your child is unsure, a few trial classes in different subjects can make the choice much clearer.',
    ],
  },
  {
    slug: 'home-learning-space',
    title: 'Setting Up a Home Learning Space',
    excerpt: 'Simple changes that make virtual classes easier for kids.',
    date: '2026-10-04',
    cover: { src: 'https://images.unsplash.com/photo-1674049406486-4b1f6e1845fd?auto=format&fit=crop&w=1200&q=70', alt: 'A tidy desk set up for studying at home', width: 1200, height: 800 },
    cover_credit: 'Photo by Bermix Studio on Unsplash',
    cover_credit_url: 'https://unsplash.com/@bermixstudio',
    body: [
      'A good learning space doesn’t need to be big. A steady table, a comfortable chair, good light and a quiet background make the biggest difference.',
      'Headphones with a microphone help your child hear the teacher clearly and keep household noise out of the lesson.',
      'Keep the space tidy and ready, so joining class takes seconds rather than a search for chargers and pencils.',
    ],
  },
];

/** Newest first. */
export const sortedPosts = [...posts].sort((a, b) => b.date.localeCompare(a.date));

/* ---------- registration form ---------- */

export interface Plan { id: string; title: string; desc: string; price: string }
export interface SubjectGroup { label: string; items: string[] }

export const plans: Plan[] = [
  { id: 'trial', title: 'Free trial only', desc: 'One 45-minute class per child. Decide on a plan afterwards.', price: 'Free' },
  { id: 'payg', title: 'Pay as you go', desc: 'Book and pay per lesson. No commitment.', price: 'from $15 / lesson' },
  { id: 'monthly', title: 'Monthly plan', desc: '8 lessons a month per subject, with progress reports.', price: 'from $99 / month' },
];

export const subjects: SubjectGroup[] = [
  { label: 'Foundation', items: ['Phonics & Reading', 'Early Numeracy', 'Handwriting'] },
  { label: 'Science', items: ['Mathematics', 'Further Maths', 'Physics', 'Chemistry', 'Biology', 'Computer Science'] },
  { label: 'Commercial', items: ['Accounting', 'Commerce', 'Economics', 'Business Studies'] },
  { label: 'Arts', items: ['English Language', 'Literature', 'History', 'Government', 'Fine Art', 'French'] },
];

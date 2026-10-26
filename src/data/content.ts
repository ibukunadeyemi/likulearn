/**
 * All site copy. Edit here and redeploy; the site is static.
 *
 * Section headings: wrap a word in *asterisks* to colour it; "\n" starts a new line.
 */
import { MAX_CHILDREN } from './form-options';

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
    src: '/images/hero-online-class.webp',
    alt: 'A smiling girl takes notes at her desk during a live online maths lesson with her teacher',
    width: 1536,
    height: 1024,
  } satisfies Img,
  hero_image_credit: '',
  hero_image_credit_url: '',

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
};

export type Home = typeof home;

export const testimonials = [
  { name: 'Femi Otitoju', role: null, quote: 'Likulearn makes learning feel personal. The teachers are patient, organised and genuinely care about progress.' },
  { name: 'Gabriel Oduboye', role: null, quote: 'Booking lessons around our schedule is easy, and the communication after each class is clear and helpful.' },
  { name: 'Seyi Akande', role: null, quote: 'A well thought out platform. You can tell it was built with families and students in mind.' },
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
  { id: 'payg', title: 'Pay as you go', desc: 'Book and pay per lesson. No commitment.', price: 'from ₦20,000 / lesson' },
  { id: 'monthly', title: 'Monthly plan', desc: '8 lessons a month per subject, with progress reports.', price: 'from ₦132,000 / month' },
];

export const subjects: SubjectGroup[] = [
  { label: 'Foundation', items: ['Phonics & Reading', 'Early Numeracy', 'Handwriting'] },
  { label: 'Science', items: ['Mathematics', 'Further Maths', 'Physics', 'Chemistry', 'Biology', 'Computer Science'] },
  { label: 'Commercial', items: ['Accounting', 'Commerce', 'Economics', 'Business Studies'] },
  { label: 'Arts', items: ['English Language', 'Literature', 'History', 'Government', 'Fine Art', 'French'] },
];

/* ---------- FAQ ---------- */

export interface Faq {
  q: string;
  a: string;
  /** Optional link shown after the answer. */
  link?: { label: string; href: string };
}

const paidPlans = plans.filter((p) => p.id !== 'trial').map((p) => p.title + ' is ' + p.price + '. ' + p.desc).join(' ');

export const faq_title = 'Frequently Asked *Questions*';
export const faq_intro = 'Everything parents usually ask before booking a free trial. Can’t find your answer? Email us any time.';

export const faqs: Faq[] = [
  {
    q: 'What ages and subjects do you teach?',
    a: 'We teach children aged 3 to 18. Younger learners start with phonics, reading, early numeracy and handwriting. Older students can take Science subjects (including Mathematics, Physics, Chemistry and Biology), Commercial subjects (such as Accounting and Economics) and Arts subjects (such as English, Literature and French), right up to exam level.',
  },
  {
    q: 'How does the free trial work?',
    a: 'Every new learner gets one free 45-minute class, and no card is needed. Register your children with the form, and within 48 hours our team will match each child with a teacher and email you to arrange a time. There is no obligation to continue afterwards.',
    link: { label: 'Book a free trial', href: '/enrol' },
  },
  {
    q: 'How much do classes cost?',
    a: paidPlans + ' We confirm the exact price for your child’s subjects in writing before you pay anything.',
  },
  {
    q: 'Are classes 1-on-1 or in groups?',
    a: 'Both. You choose for each child: 1-on-1 lessons paced entirely around them, or small groups with children at a similar level.',
  },
  {
    q: 'Who are the teachers, and are classes safe?',
    a: 'Every teacher is vetted for subject expertise and experience teaching children online. Classes run in supervised virtual classrooms with clear safeguarding standards, and we recommend an adult stays nearby during lessons for younger children.',
  },
  {
    q: 'What does my child need to join a class?',
    a: 'A laptop or tablet with a camera and microphone, a stable internet connection and a quiet place to sit. Headphones help a lot. We send everything else you need before the first class.',
    link: { label: 'Tips for a home learning space', href: '/blog/home-learning-space' },
  },
  {
    q: 'We live outside Nigeria. Can we still join?',
    a: 'Yes. Families join from many time zones. Tell us your time zone and the days and times that suit you, and we match your child with a teacher who can teach then.',
  },
  {
    q: 'Can I register more than one child?',
    a: 'Yes. One form covers the whole family, with up to ' + MAX_CHILDREN + ' children. Each child gets their own subjects, schedule and teacher.',
  },
  {
    q: 'How will I know how my child is doing?',
    a: 'You get regular progress updates and a direct line to your child’s teacher. Monthly plans also include written progress reports.',
  },
  {
    q: 'Can I change or cancel a plan?',
    a: 'After the free trial you are under no obligation. For paid plans, the rescheduling and cancellation terms are set out in the written confirmation you receive before paying.',
    link: { label: 'Read our terms', href: '/terms' },
  },
  {
    q: 'I’m a teacher. How can I join Likulearn?',
    a: 'We are always looking for qualified Science, Commercial and Arts teachers. Email us with your subjects and experience, and we’ll be in touch.',
    link: { label: 'Apply to teach', href: '/teach' },
  },
];

// SKILLCLUB Mock Data — Phase 1 MVP

export type Category =
  | 'music' | 'languages' | 'technology' | 'cooking' | 'art'
  | 'fitness' | 'crafts' | 'writing' | 'photography' | 'business';

export type Format = 'online' | 'in-person' | 'both';

export type TrustTier = 0 | 1 | 2 | 3 | 4;

export interface Member {
  id: string;
  firstName: string;
  lastName: string;
  avatar: string;
  bio: string;
  location: string;
  city: string;
  trust_tier: TrustTier;
  trust_score: number;
  archetype: 'giver' | 'seeker' | 'connector' | 'mixed';
  what_i_teach: string[];
  what_i_learn: string[];
  languages: string[];
  sessions_completed: number;
  reviews_count: number;
  joined_at: string;
}

export interface Skill {
  id: string;
  slug: string;
  teacher_id: string;
  teacher: Member;
  title: string;
  category: Category;
  description: string;
  philosophy: string;
  who_for: string;
  what_session_looks_like: string;
  price_per_hour: number;
  currency: string;
  format: Format;
  location?: string;
  languages: string[];
  level: 'all levels' | 'beginner' | 'intermediate' | 'advanced';
  avg_rating: number;
  reviews_count: number;
  status: 'active' | 'paused';
  created_at: string;
  tags: string[];
  cover_gradient: string;
}

export interface Review {
  id: string;
  skill_id: string;
  reviewer: Member;
  rating: number;
  content: string;
  tags: string[];
  created_at: string;
}

export interface Conversation {
  id: string;
  other_member: Member;
  skill?: Skill;
  last_message: string;
  last_message_at: string;
  unread_count: number;
  messages: Message[];
}

export interface Message {
  id: string;
  sender_id: string;
  content: string;
  created_at: string;
}

export interface FeedItem {
  id: string;
  type: 'new_teacher' | 'skill_match' | 'free_session' | 'trending';
  title: string;
  subtitle: string;
  member?: Member;
  skill?: Skill;
  created_at: string;
  cta_label: string;
}

// ── Members ─────────────────────────────────────────────────────────────────

export const members: Member[] = [
  {
    id: 'member-1',
    firstName: 'Yasmine',
    lastName: 'Benali',
    avatar: 'https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=200&h=200&fit=crop&crop=face',
    bio: 'Musician, language enthusiast, and lifelong learner. I teach classical piano and help people fall in love with French.',
    location: 'Guéliz, Marrakesh',
    city: 'Marrakesh',
    trust_tier: 3,
    trust_score: 4.8,
    archetype: 'mixed',
    what_i_teach: ['Classical Piano', 'French Conversation', 'Music Theory'],
    what_i_learn: ['Watercolor Painting', 'Arabic Calligraphy'],
    languages: ['Arabic', 'French', 'English'],
    sessions_completed: 34,
    reviews_count: 28,
    joined_at: '2025-11-15T10:00:00Z',
  },
  {
    id: 'member-2',
    firstName: 'Karim',
    lastName: 'Ouazzani',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&h=200&fit=crop&crop=face',
    bio: 'Software engineer by day, passionate home cook by night. Originally from Fès, living in Marrakesh for 5 years. I teach Python and Moroccan cuisine.',
    location: 'Hivernage, Marrakesh',
    city: 'Marrakesh',
    trust_tier: 3,
    trust_score: 4.9,
    archetype: 'giver',
    what_i_teach: ['Python Programming', 'Moroccan Cooking', 'Data Analysis'],
    what_i_learn: ['Guitar', 'Spanish'],
    languages: ['Arabic', 'French', 'English'],
    sessions_completed: 67,
    reviews_count: 52,
    joined_at: '2025-10-01T10:00:00Z',
  },
  {
    id: 'member-3',
    firstName: 'Layla',
    lastName: 'Tachfine',
    avatar: 'https://images.unsplash.com/photo-1494790108755-2616b332c24c?w=200&h=200&fit=crop&crop=face',
    bio: 'Yoga instructor and mindfulness teacher. I believe in growing through movement and stillness alike.',
    location: 'Palmeraie, Marrakesh',
    city: 'Marrakesh',
    trust_tier: 4,
    trust_score: 4.95,
    archetype: 'connector',
    what_i_teach: ['Vinyasa Yoga', 'Meditation', 'Breathwork'],
    what_i_learn: ['Piano', 'Aquarelle Painting'],
    languages: ['Arabic', 'French', 'English', 'Tamasheq'],
    sessions_completed: 112,
    reviews_count: 89,
    joined_at: '2025-09-20T10:00:00Z',
  },
  {
    id: 'member-4',
    firstName: 'Omar',
    lastName: 'Chraibi',
    avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=200&h=200&fit=crop&crop=face',
    bio: 'Retired architecture professor turned amateur chef. Spent 30 years teaching space — now teaching bread.',
    location: 'Medina, Marrakesh',
    city: 'Marrakesh',
    trust_tier: 3,
    trust_score: 4.7,
    archetype: 'giver',
    what_i_teach: ['Artisan Bread Making', 'Traditional Moroccan Pastry', 'Architecture Drawing'],
    what_i_learn: ['Photography', 'Modern Painting'],
    languages: ['Arabic', 'French'],
    sessions_completed: 22,
    reviews_count: 19,
    joined_at: '2025-12-01T10:00:00Z',
  },
  {
    id: 'member-5',
    firstName: 'Sofia',
    lastName: 'Ramos',
    avatar: 'https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?w=200&h=200&fit=crop&crop=face',
    bio: 'Spanish expat, passionate about flamenco guitar and bringing people together. I organize weekly music nights at Café Atlas.',
    location: 'Guéliz, Marrakesh',
    city: 'Marrakesh',
    trust_tier: 4,
    trust_score: 4.85,
    archetype: 'connector',
    what_i_teach: ['Flamenco Guitar', 'Spanish Language'],
    what_i_learn: ['Oud', 'Darija (Moroccan Arabic)'],
    languages: ['Spanish', 'French', 'English'],
    sessions_completed: 48,
    reviews_count: 41,
    joined_at: '2025-10-15T10:00:00Z',
  },
  {
    id: 'member-6',
    firstName: 'Adam',
    lastName: 'El Fassi',
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200&h=200&fit=crop&crop=face',
    bio: 'Photographer with a 35mm heart. I teach street photography and the art of seeing light. All sessions happen outside.',
    location: 'Mellah, Marrakesh',
    city: 'Marrakesh',
    trust_tier: 3,
    trust_score: 4.6,
    archetype: 'giver',
    what_i_teach: ['Film Photography', 'Street Photography', 'Darkroom Development'],
    what_i_learn: ['Bookbinding', 'Screenprinting'],
    languages: ['Arabic', 'French', 'English'],
    sessions_completed: 29,
    reviews_count: 24,
    joined_at: '2026-01-10T10:00:00Z',
  },
  {
    id: 'member-7',
    firstName: 'Inès',
    lastName: 'Morel',
    avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=200&h=200&fit=crop&crop=face',
    bio: 'French illustrator and watercolor artist living in Marrakesh. I teach drawing as a form of meditation.',
    location: 'Kasbah, Marrakesh',
    city: 'Marrakesh',
    trust_tier: 3,
    trust_score: 4.75,
    archetype: 'giver',
    what_i_teach: ['Watercolor Painting', 'Urban Sketching', 'Botanical Illustration'],
    what_i_learn: ['Portuguese', 'Ceramics'],
    languages: ['French', 'English'],
    sessions_completed: 41,
    reviews_count: 35,
    joined_at: '2025-11-28T10:00:00Z',
  },
  {
    id: 'member-8',
    firstName: 'Hassan',
    lastName: 'Aouzal',
    avatar: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=200&h=200&fit=crop&crop=face',
    bio: 'Competitive chess player, Oud musician, and new member of SKILLCLUB. Excited to share what I know.',
    location: 'Gueliz, Marrakesh',
    city: 'Marrakesh',
    trust_tier: 1,
    trust_score: 0,
    archetype: 'seeker',
    what_i_teach: ['Chess Strategy', 'Oud Fundamentals'],
    what_i_learn: ['Python', 'Photography', 'Bread Making'],
    languages: ['Arabic', 'French'],
    sessions_completed: 0,
    reviews_count: 0,
    joined_at: '2026-03-10T10:00:00Z',
  },
];

// ── Skills ───────────────────────────────────────────────────────────────────

export const skills: Skill[] = [
  {
    id: 'skill-1',
    slug: 'classical-piano-yasmine-benali',
    teacher_id: 'member-1',
    teacher: members[0],
    title: 'Classical Piano',
    category: 'music',
    description: 'Piano is not just about playing notes — it is about learning to listen. In our sessions together, you will discover the emotional language of music through the classical repertoire: Bach, Chopin, Debussy. Whether you have never touched a piano or you played as a child and want to return, this is for you.',
    philosophy: 'I believe that technique exists to serve feeling. Before we work on scales, we work on listening. I want you to hear music differently after our first session.',
    who_for: 'Perfect for beginners and intermediate students who want to reconnect with music. Also wonderful for adults who are learning for the first time at any age.',
    what_session_looks_like: 'We start with 10 minutes of active listening — I play something, you describe what you hear and feel. Then 30–40 minutes of technique and pieces. We end with you playing something complete, no matter how simple.',
    price_per_hour: 250,
    currency: 'MAD',
    format: 'both',
    location: 'Guéliz, Marrakesh (my studio)',
    languages: ['French', 'English', 'Arabic'],
    level: 'all levels',
    avg_rating: 4.9,
    reviews_count: 18,
    status: 'active',
    created_at: '2025-11-20T10:00:00Z',
    tags: ['beginner-friendly', 'patient teacher', 'adults welcome', 'emotional approach'],
    cover_gradient: 'from-plum-pale to-purple-100',
  },
  {
    id: 'skill-2',
    slug: 'python-programming-karim-ouazzani',
    teacher_id: 'member-2',
    teacher: members[1],
    title: 'Python Programming',
    category: 'technology',
    description: 'I teach Python the way I wish someone had taught me — by building things you actually care about. Forget boring exercises. We will build a tool that automates something annoying in your life within the first two sessions.',
    philosophy: 'Code should solve real problems. Every skill I teach, you will use the next week.',
    who_for: 'Complete beginners who have been wanting to learn but felt overwhelmed. Also professionals in non-tech fields (accountants, doctors, teachers) who want to use data better.',
    what_session_looks_like: 'First session: we understand your goal. What do you want to build? Then we start immediately. No theory without application.',
    price_per_hour: 300,
    currency: 'MAD',
    format: 'both',
    location: 'Hivernage, Marrakesh / Online',
    languages: ['French', 'English', 'Arabic'],
    level: 'beginner',
    avg_rating: 4.9,
    reviews_count: 31,
    status: 'active',
    created_at: '2025-10-05T10:00:00Z',
    tags: ['project-based', 'beginner-friendly', 'practical', 'flexible schedule'],
    cover_gradient: 'from-blue-50 to-indigo-100',
  },
  {
    id: 'skill-3',
    slug: 'moroccan-cooking-karim-ouazzani',
    teacher_id: 'member-2',
    teacher: members[1],
    title: 'Moroccan Home Cooking',
    category: 'cooking',
    description: 'The real Moroccan kitchen is not a restaurant kitchen — it is slower, more generous, full of stories. I teach you to cook the way my mother taught me: without a written recipe, by smell and touch and taste. Tagines, couscous, pastilla, harira.',
    philosophy: 'A recipe is just a memory. Once you understand why each spice goes in and when, you can cook anything.',
    who_for: 'Anyone who loves food. Especially good for expats living in Morocco who want to cook locally, and for Moroccan diaspora who want to reconnect with home flavors.',
    what_session_looks_like: 'We shop together at the souk or I bring ingredients. We cook together for 2 hours. We eat what we make. We talk.',
    price_per_hour: 200,
    currency: 'MAD',
    format: 'in-person',
    location: 'Hivernage, Marrakesh',
    languages: ['Arabic', 'French', 'English'],
    level: 'all levels',
    avg_rating: 4.95,
    reviews_count: 15,
    status: 'active',
    created_at: '2025-10-10T10:00:00Z',
    tags: ['hands-on', 'cultural experience', 'market visit', 'group sessions available'],
    cover_gradient: 'from-amber-50 to-orange-100',
  },
  {
    id: 'skill-4',
    slug: 'vinyasa-yoga-layla-tachfine',
    teacher_id: 'member-3',
    teacher: members[2],
    title: 'Vinyasa Yoga & Meditation',
    category: 'fitness',
    description: 'Not just a workout — a practice for living. My sessions combine movement, breath, and stillness to help you feel more present in your body and life. We meet in the palm garden or on rooftop terraces.',
    philosophy: 'The body knows what the mind has forgotten. I help you listen again.',
    who_for: 'All bodies and fitness levels. Especially transformative for people going through a transition — new to the city, changing careers, new parents.',
    what_session_looks_like: '75 minutes: 10 min centering, 50 min moving practice, 15 min meditation and integration. Always outside when weather permits.',
    price_per_hour: 180,
    currency: 'MAD',
    format: 'in-person',
    location: 'Palmeraie, Marrakesh (outdoor)',
    languages: ['English', 'French', 'Arabic'],
    level: 'all levels',
    avg_rating: 4.95,
    reviews_count: 47,
    status: 'active',
    created_at: '2025-09-25T10:00:00Z',
    tags: ['outdoor sessions', 'all levels', 'mindfulness', 'beginner-friendly'],
    cover_gradient: 'from-forest-pale to-green-50',
  },
  {
    id: 'skill-5',
    slug: 'artisan-bread-omar-chraibi',
    teacher_id: 'member-4',
    teacher: members[3],
    title: 'Artisan Bread Making',
    category: 'cooking',
    description: 'The oldest craft still practiced daily in medinas across Morocco. I teach you the science of fermentation, the art of shaping, and the patience of waiting. We make sourdough, khobz, msemen, and batbout.',
    philosophy: 'Bread is the most honest thing you can make. It tells you exactly what you gave it.',
    who_for: 'Anyone who has ever wanted to make bread from scratch. No experience necessary — only curiosity.',
    what_session_looks_like: 'Morning sessions (bread needs a whole morning). We begin at 8am, start the levain, shape, wait, bake, and eat together around noon.',
    price_per_hour: 150,
    currency: 'MAD',
    format: 'in-person',
    location: 'Medina, Marrakesh',
    languages: ['Arabic', 'French'],
    level: 'all levels',
    avg_rating: 4.7,
    reviews_count: 11,
    status: 'active',
    created_at: '2025-12-05T10:00:00Z',
    tags: ['morning sessions', 'hands-on', 'takes half a day', 'max 3 students'],
    cover_gradient: 'from-yellow-50 to-amber-100',
  },
  {
    id: 'skill-6',
    slug: 'flamenco-guitar-sofia-ramos',
    teacher_id: 'member-5',
    teacher: members[4],
    title: 'Flamenco Guitar',
    category: 'music',
    description: 'Flamenco is not learned — it is felt. I start with the rhythmic foundation (compás), because without rhythm guitar is just sound. But I promise you, within three sessions you will play something that makes your spine tingle.',
    philosophy: 'Duende — that electricity that makes your hair stand up. That is what we are chasing.',
    who_for: 'Guitar players with at least some basic knowledge. Also absolute beginners with a high tolerance for obsession.',
    what_session_looks_like: '30 min on compás exercises, 30 min learning a specific form (soleares, bulerías, rumba), 30 min play-together improvisation.',
    price_per_hour: 280,
    currency: 'MAD',
    format: 'both',
    location: 'Guéliz, Marrakesh',
    languages: ['Spanish', 'French', 'English'],
    level: 'beginner',
    avg_rating: 4.85,
    reviews_count: 22,
    status: 'active',
    created_at: '2025-10-20T10:00:00Z',
    tags: ['cultural immersion', 'rhythm-first', 'passionate teacher', 'small groups welcome'],
    cover_gradient: 'from-red-50 to-rose-100',
  },
  {
    id: 'skill-7',
    slug: 'film-photography-adam-el-fassi',
    teacher_id: 'member-6',
    teacher: members[5],
    title: 'Film Photography',
    category: 'photography',
    description: 'We slow down. We use a camera with 36 frames. We go out into the city and we learn to see. Film photography teaches you what digital cannot: patience, consequence, and the value of a single frame.',
    philosophy: 'Every photo you take costs something. That changes how you see.',
    who_for: 'People who love photography but feel their digital work is getting worse, not better. Also perfect beginners who want to start with purpose.',
    what_session_looks_like: 'We meet with a loaded camera. We walk the Medina or Mellah for 2 hours. I explain settings, light, composition in the moment — not in a classroom. We develop the film in my small darkroom.',
    price_per_hour: 200,
    currency: 'MAD',
    format: 'in-person',
    location: 'Medina / Mellah, Marrakesh',
    languages: ['Arabic', 'French', 'English'],
    level: 'all levels',
    avg_rating: 4.6,
    reviews_count: 14,
    status: 'active',
    created_at: '2026-01-15T10:00:00Z',
    tags: ['outdoor sessions', 'includes film cost', 'darkroom access', 'small groups'],
    cover_gradient: 'from-gray-100 to-slate-100',
  },
  {
    id: 'skill-8',
    slug: 'watercolor-painting-ines-morel',
    teacher_id: 'member-7',
    teacher: members[6],
    title: 'Watercolor Painting',
    category: 'art',
    description: 'Watercolor is the most forgiving medium and the most honest. It does what it wants. My sessions teach you to work with its nature, not against it — to embrace happy accidents and learn to see color as light.',
    philosophy: 'You cannot control watercolor. You can only learn to dance with it.',
    who_for: 'Absolute beginners are very welcome. Also for people who tried watercolor before and got frustrated — I specialise in rebuilding that relationship.',
    what_session_looks_like: '2-hour session: 20 min of warm-up exercises (color mixing, wet-on-wet), then 90 min working on a specific subject or technique. We often work from life — gardens, riads, markets.',
    price_per_hour: 220,
    currency: 'MAD',
    format: 'both',
    location: 'Kasbah, Marrakesh',
    languages: ['French', 'English'],
    level: 'beginner',
    avg_rating: 4.75,
    reviews_count: 19,
    status: 'active',
    created_at: '2025-12-01T10:00:00Z',
    tags: ['all materials provided', 'slow pace', 'therapeutic', 'small groups max 4'],
    cover_gradient: 'from-violet-50 to-purple-50',
  },
];

// ── Reviews ──────────────────────────────────────────────────────────────────

export const reviews: Review[] = [
  {
    id: 'review-1',
    skill_id: 'skill-1',
    reviewer: members[4],
    rating: 5,
    content: 'Yasmine does something I have never experienced with a music teacher — she makes you feel the music before she teaches you to play it. After one session I cried. Not from difficulty but from beauty. I understood for the first time what music is for.',
    tags: ['Emotionally intelligent', 'Patient', 'Changed my perspective'],
    created_at: '2025-12-15T14:00:00Z',
  },
  {
    id: 'review-2',
    skill_id: 'skill-1',
    reviewer: members[3],
    rating: 5,
    content: 'I am 67 years old. I always wanted to play piano and always thought I was too old. Yasmine proved me wrong in the first ten minutes. She is a gift.',
    tags: ['Adults welcome', 'Encouraging', 'Patient'],
    created_at: '2026-01-20T10:00:00Z',
  },
  {
    id: 'review-3',
    skill_id: 'skill-2',
    reviewer: members[6],
    rating: 5,
    content: 'Within 4 sessions with Karim I built a script that saves me 3 hours every week. He is a brilliant teacher because he cares deeply about what you actually need, not about impressing you with his own knowledge.',
    tags: ['Practical', 'Goal-oriented', 'Patient with beginners'],
    created_at: '2026-01-05T10:00:00Z',
  },
  {
    id: 'review-4',
    skill_id: 'skill-3',
    reviewer: members[0],
    rating: 5,
    content: 'I came to Marrakesh from Paris three years ago. I have been eating tagine in restaurants ever since. After one session with Karim, I made better tagine in my own kitchen than any I have eaten here. The souk visit alone was worth it.',
    tags: ['Cultural depth', 'Hands-on', 'Memorable experience'],
    created_at: '2026-02-10T09:00:00Z',
  },
  {
    id: 'review-5',
    skill_id: 'skill-4',
    reviewer: members[5],
    rating: 5,
    content: 'Layla is not just a yoga teacher — she is a presence. The session in the palm garden at sunrise was one of the most beautiful experiences I have had in Marrakesh. Do not miss this.',
    tags: ['Transcendent', 'Outdoor magic', 'All levels truly welcome'],
    created_at: '2025-12-20T07:00:00Z',
  },
];

// ── Conversations ─────────────────────────────────────────────────────────────

export const conversations: Conversation[] = [
  {
    id: 'conv-1',
    other_member: members[1],
    skill: skills[1],
    last_message: "That works perfectly for me. Shall we say Tuesday at 10am at your place?",
    last_message_at: '2026-03-11T18:30:00Z',
    unread_count: 1,
    messages: [
      { id: 'm1', sender_id: 'user-1', content: "Hi Karim! I came across your Python listing and I am really interested. I work in finance and want to automate some of my Excel work. Is that something you can help with?", created_at: '2026-03-11T16:00:00Z' },
      { id: 'm2', sender_id: 'member-2', content: "Hi Yasmine! Absolutely — this is one of my favourite use cases actually. Finance + Python is a very powerful combination. What kind of Excel work? Reports? Data cleaning? Modelling?", created_at: '2026-03-11T16:45:00Z' },
      { id: 'm3', sender_id: 'user-1', content: "Mainly monthly reports. I have to manually copy data from 4 different spreadsheets every month. It takes me a whole day and I hate it.", created_at: '2026-03-11T17:10:00Z' },
      { id: 'm4', sender_id: 'member-2', content: "By session 2 you will have automated exactly that. Guaranteed. When are you available? I have Tuesday morning and Thursday afternoon this week.", created_at: '2026-03-11T17:30:00Z' },
      { id: 'm5', sender_id: 'user-1', content: "That works perfectly for me. Shall we say Tuesday at 10am at your place?", created_at: '2026-03-11T18:30:00Z' },
    ],
  },
  {
    id: 'conv-2',
    other_member: members[2],
    skill: skills[3],
    last_message: "See you at the palm garden at 7am! ☀️",
    last_message_at: '2026-03-10T21:00:00Z',
    unread_count: 0,
    messages: [
      { id: 'm6', sender_id: 'member-3', content: "Hi Yasmine! Thank you for reaching out about yoga. What is your current practice like?", created_at: '2026-03-09T15:00:00Z' },
      { id: 'm7', sender_id: 'user-1', content: "I do yoga maybe once a week at home from YouTube videos, but I want something more intentional. I am going through a career change and feeling ungrounded.", created_at: '2026-03-09T15:30:00Z' },
      { id: 'm8', sender_id: 'member-3', content: "That is exactly the situation where this practice helps most. Let us start with a sunrise session in the palm garden. How does Wednesday at 7am feel?", created_at: '2026-03-09T16:00:00Z' },
      { id: 'm9', sender_id: 'user-1', content: "That sounds absolutely perfect.", created_at: '2026-03-09T16:15:00Z' },
      { id: 'm10', sender_id: 'member-3', content: "See you at the palm garden at 7am! ☀️", created_at: '2026-03-10T21:00:00Z' },
    ],
  },
  {
    id: 'conv-3',
    other_member: members[6],
    skill: skills[7],
    last_message: "Wonderful! I will bring all the materials. Just bring yourself and an open mind.",
    last_message_at: '2026-03-08T14:00:00Z',
    unread_count: 0,
    messages: [
      { id: 'm11', sender_id: 'user-1', content: "Inès, your watercolor account on Instagram is what brought me here. Your Marrakesh doors series is stunning. I tried watercolor once and gave up completely. Do you teach 'recovering failures'?", created_at: '2026-03-07T10:00:00Z' },
      { id: 'm12', sender_id: 'member-7', content: "Ha! This is my speciality actually. Every student who failed once succeeds with me because I teach watercolor completely differently. We start from understanding, not technique. Can you do Saturday morning?", created_at: '2026-03-07T11:00:00Z' },
      { id: 'm13', sender_id: 'user-1', content: "Saturday morning is perfect! Should I bring anything?", created_at: '2026-03-07T11:30:00Z' },
      { id: 'm14', sender_id: 'member-7', content: "Wonderful! I will bring all the materials. Just bring yourself and an open mind.", created_at: '2026-03-08T14:00:00Z' },
    ],
  },
];

// ── Feed Items ────────────────────────────────────────────────────────────────

export const feedItems: FeedItem[] = [
  {
    id: 'feed-1',
    type: 'new_teacher',
    title: 'Hassan just joined SKILLCLUB',
    subtitle: 'He teaches Chess Strategy and Oud. New to teaching — looking for his first students.',
    member: members[7],
    created_at: '2026-03-10T10:00:00Z',
    cta_label: 'Say hello',
  },
  {
    id: 'feed-2',
    type: 'skill_match',
    title: 'New watercolor classes available',
    subtitle: 'Inès Morel just opened 4 spots for her Saturday morning watercolor sessions — matches your learning interests.',
    skill: skills[7],
    member: members[6],
    created_at: '2026-03-09T14:00:00Z',
    cta_label: 'View skill',
  },
  {
    id: 'feed-3',
    type: 'free_session',
    title: 'Free Yoga — Sunrise at the Palmeraie',
    subtitle: 'Layla Tachfine is offering a free community yoga session this Friday at 7am. 8 spots remaining.',
    member: members[2],
    created_at: '2026-03-08T08:00:00Z',
    cta_label: 'Reserve a spot',
  },
  {
    id: 'feed-4',
    type: 'trending',
    title: 'Moroccan Cooking is trending in Marrakesh',
    subtitle: '6 people reached out to Karim this week. His tagine session has a 4-week wait.',
    skill: skills[2],
    created_at: '2026-03-07T10:00:00Z',
    cta_label: 'Join the waitlist',
  },
  {
    id: 'feed-5',
    type: 'new_teacher',
    title: 'Adam El Fassi joined last month',
    subtitle: 'Film photographer teaching street photography in the Medina and Mellah. 14 sessions completed.',
    member: members[5],
    skill: skills[6],
    created_at: '2026-03-06T10:00:00Z',
    cta_label: 'See his work',
  },
  {
    id: 'feed-6',
    type: 'skill_match',
    title: 'Omar teaches bread the old way',
    subtitle: 'Morning-only sessions in the Medina. Sourdough, msemen, khobz. Matches your cooking interests.',
    skill: skills[4],
    member: members[3],
    created_at: '2026-03-05T14:00:00Z',
    cta_label: 'Learn more',
  },
];

// ── Categories ────────────────────────────────────────────────────────────────

export const categories = [
  { id: 'music', label: 'Music', emoji: '🎵', count: 8 },
  { id: 'languages', label: 'Languages', emoji: '🌍', count: 5 },
  { id: 'technology', label: 'Technology', emoji: '💻', count: 6 },
  { id: 'cooking', label: 'Cooking', emoji: '🍳', count: 7 },
  { id: 'art', label: 'Art & Drawing', emoji: '🎨', count: 5 },
  { id: 'fitness', label: 'Movement', emoji: '🧘', count: 4 },
  { id: 'crafts', label: 'Crafts', emoji: '✂️', count: 3 },
  { id: 'writing', label: 'Writing', emoji: '✍️', count: 3 },
  { id: 'photography', label: 'Photography', emoji: '📷', count: 4 },
  { id: 'business', label: 'Business', emoji: '💼', count: 2 },
];

// ── Notifications (kept for layout compat) ─────────────────────────────────

export const notifications = [
  { id: 'n1', title: 'Karim replied to your message', message: 'Tuesday 10am sounds great!', isRead: false, created_at: '2026-03-11T18:30:00Z' },
  { id: 'n2', title: 'New free session available', message: 'Layla is offering sunrise yoga this Friday', isRead: false, created_at: '2026-03-08T09:00:00Z' },
  { id: 'n3', title: 'Your trust score updated', message: 'You received a new 5-star review from Omar', isRead: true, created_at: '2026-02-20T15:00:00Z' },
  { id: 'n4', title: 'Hassan joined SKILLCLUB', message: 'New member in Marrakesh — say hello!', isRead: true, created_at: '2026-03-10T10:00:00Z' },
];

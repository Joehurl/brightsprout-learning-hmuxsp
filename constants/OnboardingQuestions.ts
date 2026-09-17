export interface OnboardingOption {
  id: string;
  emoji: string;
  label: string;
}

export interface OnboardingQuestion {
  id: string;
  title: string;
  subtitle: string;
  options: OnboardingOption[];
}

export const onboardingQuestions: OnboardingQuestion[] = [
  {
    id: "child_age",
    title: "How old is your child?",
    subtitle: "We'll tailor activities to the right level",
    options: [
      { id: "age_2_3", emoji: "🐣", label: "2–3 years old" },
      { id: "age_4_5", emoji: "🌱", label: "4–5 years old" },
      { id: "age_6_7", emoji: "🌟", label: "6–7 years old" },
    ],
  },
  {
    id: "learning_focus",
    title: "What would you like to focus on?",
    subtitle: "Pick what matters most right now",
    options: [
      { id: "letters", emoji: "🔤", label: "Letters & Reading" },
      { id: "numbers", emoji: "🔢", label: "Numbers & Math" },
      { id: "creativity", emoji: "🎨", label: "Creativity & Drawing" },
      { id: "all", emoji: "🌈", label: "A bit of everything" },
    ],
  },
  {
    id: "experience",
    title: "Has your child used a learning app before?",
    subtitle: "This helps us set the right starting point",
    options: [
      { id: "first_time", emoji: "👶", label: "First time!" },
      { id: "some", emoji: "📖", label: "A little bit" },
      { id: "experienced", emoji: "🏆", label: "Yes, quite a bit" },
    ],
  },
  {
    id: "session_length",
    title: "How long are your learning sessions?",
    subtitle: "Short bursts or longer playtime — you decide",
    options: [
      { id: "short", emoji: "⚡", label: "5–10 minutes" },
      { id: "medium", emoji: "⏱️", label: "10–20 minutes" },
      { id: "long", emoji: "🕐", label: "20+ minutes" },
    ],
  },
  {
    id: "source",
    title: "How did you hear about BrightSprout?",
    subtitle: "We'd love to know what brought you here",
    options: [
      { id: "social", emoji: "📱", label: "Social media" },
      { id: "friend", emoji: "👫", label: "Friend or family" },
      { id: "appstore", emoji: "🏠", label: "App Store" },
      { id: "search", emoji: "🔍", label: "Online search" },
    ],
  },
];

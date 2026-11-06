export interface PresetScenario {
  id: string;
  category: string;
  title: string;
  options: string[];
  context: string;
  priorities: string[];
  advisorLens: string;
}

export const PRESET_SCENARIOS: PresetScenario[] = [
  {
    id: 'career-startup-vs-bigtech',
    category: 'Career',
    title: 'Should I accept an early-stage startup Head of Product role or stay as Senior PM at Big Tech?',
    options: ['Join Series A Startup as Head of Product', 'Stay at Big Tech as Senior PM'],
    context: 'Startup offers $160k salary + 1.2% equity with high autonomy and rapid growth potential, but 60hr weeks and 18-month runway. Big Tech pays $270k total comp, 38hr weeks, 401k match, but slow promotions and repetitive bureaucracy.',
    priorities: ['Accelerated Career Growth', 'Financial Upside vs Stability', 'Work-Life Balance', 'Creative Autonomy'],
    advisorLens: 'Pragmatic Strategist (Balanced, practical, high-ROI)',
  },
  {
    id: 'relocation-city-vs-suburbs',
    category: 'Lifestyle',
    title: 'Should we buy a spacious home in the suburbs or rent a walkable city center apartment?',
    options: ['Buy Suburb Home with Yard', 'Rent Downtown Luxury Apartment'],
    context: 'We have a 2-year-old toddler. Suburb house gives yard, top school district, quiet neighborhood, but requires 45min driving commute and high property taxes. Downtown gives 5min walk to cafes, culture, zero yard maintenance, but smaller space and higher rent increases.',
    priorities: ['Child Development & Schools', 'Daily Commute & Time', 'Quality of Life', 'Long-term Wealth Building'],
    advisorLens: 'Future-You in 5 Years (Focus on long-term happiness and regret minimization)',
  },
  {
    id: 'tech-custom-vs-saas',
    category: 'Business & Tech',
    title: 'Should our company build a custom internal CRM tool or buy Salesforce/HubSpot?',
    options: ['Build Custom In-House Tool', 'Subscribe to Established SaaS (HubSpot)'],
    context: 'We are a 45-person B2B logistics firm with highly specific workflow nuances. Custom tool takes 4 months of engineering time and ongoing maintenance. SaaS costs $35,000/year and requires altering our business processes to fit their mold.',
    priorities: ['Time to Deployment', 'Workflow Flexibility', 'Ongoing Engineering Maintenance', 'Total Cost of Ownership'],
    advisorLens: 'Risk Mitigator (Downside protection and execution feasibility)',
  },
  {
    id: 'purchase-ev-vs-hybrid',
    category: 'Finance',
    title: 'Should I buy a new Electric Vehicle (Tesla Model Y) or keep driving my paid-off 2017 Honda Civic?',
    options: ['Buy New Electric Vehicle', 'Keep Paid-Off Reliable Gas Car'],
    context: 'Honda Civic has 85k miles and runs great with $50/mo maintenance and $140/mo gas. EV costs $42,000 with $620/mo loan payment, but saves on gas, qualifies for tax credit, and has modern safety tech and comfort for my daily 30-mile commute.',
    priorities: ['Monthly Cash Flow', 'Environmental Impact', 'Vehicle Safety & Modern Tech', 'Reliability & Repair Costs'],
    advisorLens: 'Pragmatic Strategist (Balanced, practical, high-ROI)',
  },
  {
    id: 'education-bootcamp-vs-masters',
    category: 'Education',
    title: 'Should I do an intensive AI Engineering bootcamp or enroll in a Part-time Online Master in Computer Science?',
    options: ['16-Week Intensive AI Bootcamp', '2-Year Part-time Online MS in CS'],
    context: 'Bootcamp costs $14,000 and focuses on hands-on PyTorch, LLMs, agents, and portfolio projects to get hired immediately. MS in CS costs $10,000 total (Georgia Tech OMSCS), provides prestigious accredited credential, but takes 2.5 years of rigorous math and theory while working full-time.',
    priorities: ['Speed of Career Transition', 'Credential Prestige', 'Deep Theoretical Foundation', 'Cost vs Opportunity Cost'],
    advisorLens: 'Bold Visionary (High upside and frontier technology focus)',
  },
];

export const POPULAR_PRIORITIES = [
  'Financial Upside',
  'Peace of Mind & Low Stress',
  'Career Advancement',
  'Work-Life Balance',
  'Time to Results',
  'Autonomy & Freedom',
  'Family & Relationships',
  'Downside Risk Protection',
  'Personal Growth & Learning',
  'Long-term Scalability',
];

export const ADVISOR_LENSES = [
  {
    id: 'pragmatic',
    name: 'Pragmatic Strategist',
    icon: 'Target',
    tagline: 'Objective, ROI-focused, grounded in realistic probabilities.',
  },
  {
    id: 'visionary',
    name: 'Bold Visionary',
    icon: 'Rocket',
    tagline: 'Maximizes asymmetric upside, innovation, and long-term ambition.',
  },
  {
    id: 'risk_mitigator',
    name: 'Risk Mitigator',
    icon: 'ShieldCheck',
    tagline: 'Prioritizes downside protection, resilience, and reversibility.',
  },
  {
    id: 'devils_advocate',
    name: "Devil's Advocate",
    icon: 'Flame',
    tagline: 'Ruthlessly challenges your comfort zone and status quo biases.',
  },
  {
    id: 'minimalist',
    name: 'Zen Minimalist',
    icon: 'Feather',
    tagline: 'Favors simplicity, reduced cognitive load, and inner peace.',
  },
  {
    id: 'future_self',
    name: 'Future-Self (5 Years)',
    icon: 'Hourglass',
    tagline: 'Evaluates choices through the lens of regret minimization.',
  },
];

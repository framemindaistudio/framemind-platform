/**
 * The founders' personal-brand plans for Social Studio: what each profile is for, who reads it, what to post,
 * when, the lines to start a post from, and what never to post.
 * Source: OPERATIONS/08_SOCIAL_MEDIA (content strategy: LinkedIn at three posts a week in the founder voice, Sunday
 * planning, the honesty reminder) and 01_BRAND (voice and tone).
 *
 * The studio is young. No line here assumes a client, a result, a number or a quote that does not exist yet; the few
 * that need something to have happened first say so in `after`. Names and roles are read from site.founders.
 */

export type FounderId = "chinmay";
/** the "Posted from" value of the content plan for a founder's own profile */
export type FounderAccount = "Chinmay (personal)";

export interface Pillar {
  id: string;
  name: string;
  about: string;
  /** what to post under it */
  posts: string[];
}

export interface Slot {
  day: string;
  where: string;
  what: string;
}

export interface Prompt {
  /** a pillar id */
  pillar: string;
  /** the line a post starts from; the dots are where the founder carries on */
  text: string;
  /** set when the line may be used only once something has really happened */
  after?: string;
  /** a caution for this line */
  tip?: string;
}

export interface FounderPlan {
  id: FounderId;
  account: FounderAccount;
  /** what follows the role in the profile headline */
  headline: string;
  /** what the profile is for */
  purpose: string;
  readers: { who: string; wants: string }[];
  /** how it sounds */
  voice: string[];
  pillars: Pillar[];
  rhythm: Slot[];
  rhythmNote: string;
  prompts: Prompt[];
  /** what not to post */
  avoid: string[];
}

const chinmay: FounderPlan = {
  id: "chinmay",
  account: "Chinmay (personal)",
  headline: "Founder, FrameMind AI Studio · Websites, brands, software and automations for founders",
  purpose:
    "This is where a founder looks you up before trusting the studio with their product. It should show the person who leads every project: how you think about a brief, how you design and build, and that you tell the truth about what a studio this young has and has not done.",
  readers: [
    { who: "Founders and business owners", wants: "To see that you understand their problem, and that the work actually ships." },
    { who: "Designers and developers", wants: "How the studio works, and whether they would want to join it." },
    { who: "Learners and career-switchers", wants: "Practical AI and design they can use themselves." },
    { who: "Institutions", wants: "Proof that Vritta is built by people who understand how they run." },
  ],
  voice: [
    "First person, from the desk. Show the work, then say one thing about it.",
    "Precise about craft and proud of it, without superlatives.",
    "Exact with numbers, and only real ones. A plan is written as a plan.",
  ],
  pillars: [
    {
      id: "craft",
      name: "Design and build",
      about: "How a website, a brand or a piece of software is actually made.",
      posts: ["A screen before and after, and the reason for each change", "A design that was thrown away, and why", "A bug, and its fix", "The stack and why it was chosen"],
    },
    {
      id: "ai",
      name: "AI, used plainly",
      about: "What AI really does in the studio's work and in a client's business, named plainly.",
      posts: ["One automation and the hours it saves", "A prompt that works, and one that does not", "What AI should not be used for"],
    },
    {
      id: "process",
      name: "How we work",
      about: "Scoping, pricing and delivery, told in the open.",
      posts: ["Why the scope comes before the price", "How a project runs, week by week", "What a handover includes"],
    },
    {
      id: "studio",
      name: "Building the studio honestly",
      about: "Running a small studio from Gadag, told as it is.",
      posts: ["What you got wrong, and what you changed", "The tools on your desk this month", "A lesson from a project"],
    },
  ],
  rhythm: [
    { day: "Mon", where: "LinkedIn", what: "Founder post: craft. How something was designed or built." },
    { day: "Wed", where: "LinkedIn", what: "Founder post: AI used plainly, or how we work." },
    { day: "Fri", where: "LinkedIn", what: "Founder post: the week in the open. A lesson, a client question answered, a number that is real." },
    { day: "Thu", where: "Instagram", what: "One screen, frame or clip from this week's work, with one line on how it was made (client work only with approval)." },
    { day: "Daily", where: "All", what: "Ten minutes: answer every comment and message within 24 hours." },
    { day: "Sun", where: "HQ", what: "Choose next week's posts and put them in the plan." },
  ],
  rhythmNote: "LinkedIn carries three founder posts a week: Monday, Wednesday and Friday. The studio's own channels keep their own cadence in the Plan tab.",
  prompts: [
    { pillar: "craft", text: "Before and after. What changed, and why: ...", after: "Only with the client's approval to show their work." },
    { pillar: "craft", text: "A design I threw away this week, and why: ..." },
    { pillar: "craft", text: "A bug I chased this week: ..." },
    { pillar: "craft", text: "Why we build custom and not from templates: ..." },
    { pillar: "craft", text: "One rule in our design playbook I would not give up: ..." },
    { pillar: "ai", text: "One automation we set up this month, and what it replaced: ..." },
    { pillar: "ai", text: "A prompt that saves me ten minutes a day: ..." },
    { pillar: "ai", text: "Where I would not use AI, and why: ..." },
    { pillar: "ai", text: "What a learner built in week nine of AI coaching: ...", after: "Only with the learner's permission." },
    { pillar: "process", text: "Why we write the scope before the price: ..." },
    { pillar: "process", text: "What happens in our 20-minute discovery call: ..." },
    { pillar: "process", text: "What a client gets at handover, and why it matters: ..." },
    { pillar: "process", text: "A project we said no to, and why: ...", tip: "Never name the client or anything they told you." },
    { pillar: "studio", text: "What I got wrong this week: ..." },
    { pillar: "studio", text: "The tools on my desk this month, AI ones included: ..." },
    { pillar: "studio", text: "Why we are building a studio from Gadag: ..." },
    { pillar: "studio", text: "Our first project for a client outside Karnataka. What I learned: ...", after: "Only once the project has shipped." },
  ],
  avoid: [
    "A client's name, logo, screens or results before the client has approved it in writing.",
    "Client data of any kind: real dashboards, emails, phone numbers, revenue.",
    "A count of clients, projects or results before it is real. A plan is written as a plan.",
    "A testimonial, an award or press that does not exist.",
    "What things cost us, margins and planning numbers. They stay in HQ.",
    "Someone else's work as ours.",
    "A competitor's name, a comparison, or a superlative such as “best” or “number 1”.",
  ],
};

export const FOUNDER_PLANS: Record<FounderId, FounderPlan> = { chinmay };
export const FOUNDER_ORDER: FounderId[] = ["chinmay"];

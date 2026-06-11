type FocusCompanionCatalogReplica = {
  text: string;
  imagePath?: string;
};

type FocusCompanionCatalogItem = {
  name: string;
  role: string;
  description: string;
  tone: string;
  availability: "free" | "paid";
  avatarText: string;
  colorClass: string;
  defaultReplicaIndex: number;
  replicas: readonly [FocusCompanionCatalogReplica, ...FocusCompanionCatalogReplica[]];
};

export const FOCUS_COMPANION_CATALOG = {
  ceo: {
    name: "Alex",
    role: "Founder",
    description: "Tough and direct. Has no patience for procrastination.",
    tone: "Direct",
    availability: "free",
    avatarText: "A",
    colorClass: "violet",
    defaultReplicaIndex: 2,
    replicas: [
      {
        text: "Distraction detected. ROI on YouTube: negative. Reallocate.",
        imagePath: "images/ceo/ceo-s02p01-kpi-frown.png"
      },
      {
        text: "Twelve minutes of TikTok. That's a $40 mistake. Course-correct.",
        imagePath: "images/ceo/ceo-s02p02-phone-no.png"
      },
      {
        text: "Entertainment is not on the roadmap. Close the tab.",
        imagePath: "images/ceo/ceo-s02p03-watch-tap.png"
      },
      {
        text: "You're optimizing for dopamine, not impact. Switch.",
        imagePath: "images/ceo/ceo-s02p04-clipboard-flip.png"
      },
      {
        text: "Top performers don't scroll during sprint hours.",
        imagePath: "images/ceo/ceo-s02p05-pinch-bridge.png"
      },
      {
        text: "Quick audit: is this tab on your OKRs? No? Close it.",
        imagePath: "images/ceo/ceo-s02p06-meeting-call.png"
      },
      {
        text: "Reels won't appear in your performance review. Refocus.",
        imagePath: "images/ceo/ceo-s02p07-folded-arms.png"
      },
      {
        text: "Your competitors are shipping. You're watching. Adjust.",
        imagePath: "images/ceo/ceo-s02p08-redline-pen.png"
      },
      {
        text: "Calendar this for after-hours. Now back to the task.",
        imagePath: "images/ceo/ceo-s02p09-firm-stare.png"
      },
      {
        text: "Execution gap detected. Close it now.",
        imagePath: "images/ceo/ceo-s02p10-tap-table.png"
      }
    ]
  },
  cto: {
    name: "Max",
    role: "CTO",
    description: "Methodical engineer. Reminds you that focus is part of delivery.",
    tone: "Precise",
    availability: "paid",
    avatarText: "M",
    colorClass: "blue",
    defaultReplicaIndex: 0,
    replicas: [
      { text: "Context switch detected. Return to the critical path." },
      { text: "This tab is outside the sprint scope. Close it." },
      { text: "Reduce noise, keep the system stable, ship the next step." }
    ]
  },
  mentor: {
    name: "Nina",
    role: "Mentor",
    description: "Calm but persistent. Brings you back to the chosen task.",
    tone: "Calm",
    availability: "paid",
    avatarText: "N",
    colorClass: "emerald",
    defaultReplicaIndex: 0,
    replicas: [
      { text: "You chose focus for a reason. Come back to the task." },
      { text: "Pause the distraction. Your next small step is still waiting." },
      { text: "Close this tab gently and keep the promise you made to yourself." }
    ]
  },
  coach: {
    name: "Rita",
    role: "Coach",
    description: "Turns a work block into a short win with energy.",
    tone: "Energetic",
    availability: "paid",
    avatarText: "R",
    colorClass: "rose",
    defaultReplicaIndex: 0,
    replicas: [
      { text: "One focused move now beats ten distracted plans." },
      { text: "Close this and win the next five minutes." },
      { text: "Momentum is fragile. Protect it." }
    ]
  },
  stoic: {
    name: "Mark",
    role: "Stoic",
    description: "Calm and steady. Removes the extra without drama.",
    tone: "Stoic",
    availability: "paid",
    avatarText: "M",
    colorClass: "stone",
    defaultReplicaIndex: 0,
    replicas: [
      { text: "This is not within your control or your current work." },
      { text: "Attention is a choice. Choose the task." },
      { text: "Leave the distraction. Return to what matters." }
    ]
  },
  scientist: {
    name: "Ira",
    role: "Researcher",
    description: "Uses data to reduce impulsive switching.",
    tone: "Analytical",
    availability: "paid",
    avatarText: "I",
    colorClass: "cyan",
    defaultReplicaIndex: 0,
    replicas: [
      { text: "The data says this tab weakens the session. Close it." },
      { text: "Attention drift observed. Restore the experiment conditions." },
      { text: "Your focus sample is contaminated. Remove this variable." }
    ]
  },
  philosopher: {
    name: "Leo",
    role: "Philosopher",
    description: "Reminds you of the meaning of work without extra noise.",
    tone: "Reflective",
    availability: "paid",
    avatarText: "L",
    colorClass: "amber",
    defaultReplicaIndex: 0,
    replicas: [
      { text: "The life you want is built in moments like this." },
      { text: "A scattered mind cannot do deliberate work." },
      { text: "Close what is easy. Continue what is important." }
    ]
  },
  hacker: {
    name: "Cole",
    role: "Hacker",
    description: "Keeps it short: distraction found, needs a fix.",
    tone: "Terse",
    availability: "paid",
    avatarText: "K",
    colorClass: "green",
    defaultReplicaIndex: 0,
    replicas: [
      { text: "Bug found: distraction loop. Patch it by closing this tab." },
      { text: "Focus process interrupted. Kill this branch." },
      { text: "Noise source detected. Remove and resume." }
    ]
  },
  monk: {
    name: "Tikhon",
    role: "Monk",
    description: "Quietly brings attention back to the present moment.",
    tone: "Quiet",
    availability: "paid",
    avatarText: "T",
    colorClass: "indigo",
    defaultReplicaIndex: 0,
    replicas: [
      { text: "Breathe once. Then return to the work." },
      { text: "Let this tab pass without following it." },
      { text: "Stillness first. Then the next focused action." }
    ]
  },
  detective: {
    name: "Vera",
    role: "Detective",
    description: "Notices distraction patterns and returns you to the facts.",
    tone: "Observant",
    availability: "paid",
    avatarText: "V",
    colorClass: "gray",
    defaultReplicaIndex: 0,
    replicas: [
      { text: "Pattern matched: this tab usually steals the session." },
      { text: "The evidence points back to your task." },
      { text: "Case note: close the distraction before it escalates." }
    ]
  }
} as const satisfies Record<string, FocusCompanionCatalogItem>;

export const DEFAULT_FOCUS_COMPANION_ID = "ceo";

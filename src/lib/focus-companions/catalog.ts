type FocusCompanionCatalogItem = {
  name: string;
  role: string;
  description: string;
  tone: string;
  availability: "free" | "paid";
  avatarText: string;
  colorClass: string;
  imageSetId: "ceo" | null;
  copy: readonly string[];
};

const NO_IMAGE_SET: null = null;

export const FOCUS_COMPANION_CATALOG = {
  ceo: {
    name: "Алекс",
    role: "Основатель",
    description: "Жесткий и прямой. Не терпит прокрастинации.",
    tone: "Direct",
    availability: "free",
    avatarText: "A",
    colorClass: "violet",
    imageSetId: "ceo",
    copy: [
      "Distraction detected. ROI on this tab: negative. Reallocate.",
      "Entertainment is not on the roadmap. Close the tab.",
      "You're optimizing for dopamine, not impact. Switch."
    ]
  },
  cto: {
    name: "Макс",
    role: "CTO",
    description: "Методичный инженер. Напомнит, что фокус - это часть delivery.",
    tone: "Precise",
    availability: "paid",
    avatarText: "M",
    colorClass: "blue",
    imageSetId: NO_IMAGE_SET,
    copy: [
      "Context switch detected. Return to the critical path.",
      "This tab is outside the sprint scope. Close it.",
      "Reduce noise, keep the system stable, ship the next step."
    ]
  },
  mentor: {
    name: "Нина",
    role: "Ментор",
    description: "Мягко, но настойчиво возвращает к выбранной задаче.",
    tone: "Calm",
    availability: "paid",
    avatarText: "Н",
    colorClass: "emerald",
    imageSetId: NO_IMAGE_SET,
    copy: [
      "You chose focus for a reason. Come back to the task.",
      "Pause the distraction. Your next small step is still waiting.",
      "Close this tab gently and keep the promise you made to yourself."
    ]
  },
  coach: {
    name: "Рита",
    role: "Коуч",
    description: "Энергично превращает рабочий блок в короткую победу.",
    tone: "Energetic",
    availability: "paid",
    avatarText: "Р",
    colorClass: "rose",
    imageSetId: NO_IMAGE_SET,
    copy: [
      "One focused move now beats ten distracted plans.",
      "Close this and win the next five minutes.",
      "Momentum is fragile. Protect it."
    ]
  },
  stoic: {
    name: "Марк",
    role: "Стоик",
    description: "Спокойный и невозмутимый. Убирает лишнее без драмы.",
    tone: "Stoic",
    availability: "paid",
    avatarText: "М",
    colorClass: "stone",
    imageSetId: NO_IMAGE_SET,
    copy: [
      "This is not within your control or your current work.",
      "Attention is a choice. Choose the task.",
      "Leave the distraction. Return to what matters."
    ]
  },
  scientist: {
    name: "Ира",
    role: "Исследователь",
    description: "Апеллирует к данным и снижает импульсивные переключения.",
    tone: "Analytical",
    availability: "paid",
    avatarText: "И",
    colorClass: "cyan",
    imageSetId: NO_IMAGE_SET,
    copy: [
      "The data says this tab weakens the session. Close it.",
      "Attention drift observed. Restore the experiment conditions.",
      "Your focus sample is contaminated. Remove this variable."
    ]
  },
  philosopher: {
    name: "Лев",
    role: "Философ",
    description: "Напоминает о смысле работы без лишнего шума.",
    tone: "Reflective",
    availability: "paid",
    avatarText: "Л",
    colorClass: "amber",
    imageSetId: NO_IMAGE_SET,
    copy: [
      "The life you want is built in moments like this.",
      "A scattered mind cannot do deliberate work.",
      "Close what is easy. Continue what is important."
    ]
  },
  hacker: {
    name: "Кол",
    role: "Хакер",
    description: "Говорит коротко: distraction найден, надо исправить.",
    tone: "Terse",
    availability: "paid",
    avatarText: "K",
    colorClass: "green",
    imageSetId: NO_IMAGE_SET,
    copy: [
      "Bug found: distraction loop. Patch it by closing this tab.",
      "Focus process interrupted. Kill this branch.",
      "Noise source detected. Remove and resume."
    ]
  },
  monk: {
    name: "Тихон",
    role: "Монах",
    description: "Спокойно возвращает внимание к настоящему моменту.",
    tone: "Quiet",
    availability: "paid",
    avatarText: "Т",
    colorClass: "indigo",
    imageSetId: NO_IMAGE_SET,
    copy: [
      "Breathe once. Then return to the work.",
      "Let this tab pass without following it.",
      "Stillness first. Then the next focused action."
    ]
  },
  detective: {
    name: "Вера",
    role: "Детектив",
    description: "Замечает паттерны отвлечения и возвращает к фактам.",
    tone: "Observant",
    availability: "paid",
    avatarText: "В",
    colorClass: "gray",
    imageSetId: NO_IMAGE_SET,
    copy: [
      "Pattern matched: this tab usually steals the session.",
      "The evidence points back to your task.",
      "Case note: close the distraction before it escalates."
    ]
  }
} as const satisfies Record<string, FocusCompanionCatalogItem>;

export const DEFAULT_FOCUS_COMPANION_ID = "ceo";

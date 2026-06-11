import type { FocusCompanionId } from "./types.js";

export type FocusCompanion = {
  id: FocusCompanionId;
  name: string;
  role: string;
  description: string;
  tone: string;
  avatarText: string;
  colorClass: string;
  imageFileName: string | null;
  copy: readonly string[];
};

export const FOCUS_COMPANIONS: readonly FocusCompanion[] = [
  {
    id: "ceo",
    name: "Алекс",
    role: "Основатель",
    description: "Жесткий и прямой. Не терпит прокрастинации.",
    tone: "Direct",
    avatarText: "A",
    colorClass: "violet",
    imageFileName: "ceo-s02p03-watch-tap.png",
    copy: [
      "Distraction detected. ROI on this tab: negative. Reallocate.",
      "Entertainment is not on the roadmap. Close the tab.",
      "You're optimizing for dopamine, not impact. Switch."
    ]
  },
  {
    id: "cto",
    name: "Макс",
    role: "CTO",
    description: "Методичный инженер. Напомнит, что фокус - это часть delivery.",
    tone: "Precise",
    avatarText: "M",
    colorClass: "blue",
    imageFileName: null,
    copy: [
      "Context switch detected. Return to the critical path.",
      "This tab is outside the sprint scope. Close it.",
      "Reduce noise, keep the system stable, ship the next step."
    ]
  },
  {
    id: "mentor",
    name: "Нина",
    role: "Ментор",
    description: "Мягко, но настойчиво возвращает к выбранной задаче.",
    tone: "Calm",
    avatarText: "Н",
    colorClass: "emerald",
    imageFileName: null,
    copy: [
      "You chose focus for a reason. Come back to the task.",
      "Pause the distraction. Your next small step is still waiting.",
      "Close this tab gently and keep the promise you made to yourself."
    ]
  },
  {
    id: "coach",
    name: "Рита",
    role: "Коуч",
    description: "Энергично превращает рабочий блок в короткую победу.",
    tone: "Energetic",
    avatarText: "Р",
    colorClass: "rose",
    imageFileName: null,
    copy: [
      "One focused move now beats ten distracted plans.",
      "Close this and win the next five minutes.",
      "Momentum is fragile. Protect it."
    ]
  },
  {
    id: "stoic",
    name: "Марк",
    role: "Стоик",
    description: "Спокойный и невозмутимый. Убирает лишнее без драмы.",
    tone: "Stoic",
    avatarText: "М",
    colorClass: "stone",
    imageFileName: null,
    copy: [
      "This is not within your control or your current work.",
      "Attention is a choice. Choose the task.",
      "Leave the distraction. Return to what matters."
    ]
  },
  {
    id: "scientist",
    name: "Ира",
    role: "Исследователь",
    description: "Апеллирует к данным и снижает импульсивные переключения.",
    tone: "Analytical",
    avatarText: "И",
    colorClass: "cyan",
    imageFileName: null,
    copy: [
      "The data says this tab weakens the session. Close it.",
      "Attention drift observed. Restore the experiment conditions.",
      "Your focus sample is contaminated. Remove this variable."
    ]
  },
  {
    id: "philosopher",
    name: "Лев",
    role: "Философ",
    description: "Напоминает о смысле работы без лишнего шума.",
    tone: "Reflective",
    avatarText: "Л",
    colorClass: "amber",
    imageFileName: null,
    copy: [
      "The life you want is built in moments like this.",
      "A scattered mind cannot do deliberate work.",
      "Close what is easy. Continue what is important."
    ]
  },
  {
    id: "hacker",
    name: "Кол",
    role: "Хакер",
    description: "Говорит коротко: distraction найден, надо исправить.",
    tone: "Terse",
    avatarText: "K",
    colorClass: "green",
    imageFileName: null,
    copy: [
      "Bug found: distraction loop. Patch it by closing this tab.",
      "Focus process interrupted. Kill this branch.",
      "Noise source detected. Remove and resume."
    ]
  },
  {
    id: "monk",
    name: "Тихон",
    role: "Монах",
    description: "Спокойно возвращает внимание к настоящему моменту.",
    tone: "Quiet",
    avatarText: "Т",
    colorClass: "indigo",
    imageFileName: null,
    copy: [
      "Breathe once. Then return to the work.",
      "Let this tab pass without following it.",
      "Stillness first. Then the next focused action."
    ]
  },
  {
    id: "detective",
    name: "Вера",
    role: "Детектив",
    description: "Замечает паттерны отвлечения и возвращает к фактам.",
    tone: "Observant",
    avatarText: "В",
    colorClass: "gray",
    imageFileName: null,
    copy: [
      "Pattern matched: this tab usually steals the session.",
      "The evidence points back to your task.",
      "Case note: close the distraction before it escalates."
    ]
  }
] as const;

export function getFocusCompanion(id: string | null | undefined): FocusCompanion {
  return FOCUS_COMPANIONS.find((companion) => companion.id === id) || FOCUS_COMPANIONS[0];
}

export function isFocusCompanionId(value: unknown): value is FocusCompanionId {
  return typeof value === "string" && FOCUS_COMPANIONS.some((companion) => companion.id === value);
}

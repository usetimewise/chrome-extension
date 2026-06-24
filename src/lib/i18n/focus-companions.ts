import type { AppLanguage } from "./index.js";

type LocalizedText = {
    en: string;
    ru?: string;
};

type FocusCompanionCopy = {
    name: LocalizedText;
    role: LocalizedText;
    description: LocalizedText;
    avatarText: LocalizedText;
    replicas: readonly [LocalizedText, ...LocalizedText[]];
};

const FOCUS_COMPANION_TRANSLATIONS = {
    ceo: {
        name: { en: "Alex", ru: "Алекс" },
        role: { en: "Founder", ru: "Основатель" },
        description: {
            en: "Tough and direct. Has no patience for procrastination.",
            ru: "Жесткий и прямой. Не терпит прокрастинации.",
        },
        avatarText: { en: "A", ru: "A" },
        replicas: [
            {
                en: "Distraction detected. ROI on YouTube: negative. Reallocate.",
                ru: "Обнаружено отвлечение. ROI на YouTube отрицательный. Перераспредели внимание.",
            },
            {
                en: "Twelve minutes of TikTok. That's a $40 mistake. Course-correct.",
                ru: "Двенадцать минут TikTok. Это ошибка на $40. Исправь курс.",
            },
            {
                en: "Entertainment is not on the roadmap. Close the tab.",
                ru: "Развлечений нет в roadmap. Закрой вкладку.",
            },
            {
                en: "You're optimizing for dopamine, not impact. Switch.",
                ru: "Ты оптимизируешь дофамин, а не результат. Переключись.",
            },
            {
                en: "Top performers don't scroll during sprint hours.",
                ru: "Сильные исполнители не скроллят во время спринта.",
            },
            {
                en: "Quick audit: is this tab on your OKRs? No? Close it.",
                ru: "Быстрый аудит: эта вкладка есть в твоих OKR? Нет? Закрой.",
            },
            {
                en: "Reels won't appear in your performance review. Refocus.",
                ru: "Reels не попадут в performance review. Верни фокус.",
            },
            {
                en: "Your competitors are shipping. You're watching. Adjust.",
                ru: "Конкуренты shipping. Ты смотришь. Исправляйся.",
            },
            {
                en: "Calendar this for after-hours. Now back to the task.",
                ru: "Запланируй это на нерабочее время. Сейчас обратно к задаче.",
            },
            {
                en: "Execution gap detected. Close it now.",
                ru: "Обнаружен execution gap. Закрой его сейчас.",
            },
        ],
    },
    cto: {
        name: { en: "Max", ru: "Макс" },
        role: { en: "CTO", ru: "CTO" },
        description: {
            en: "Methodical engineer. Reminds you that focus is part of delivery.",
            ru: "Методичный инженер. Напомнит, что фокус - это часть delivery.",
        },
        avatarText: { en: "M", ru: "M" },
        replicas: [
            {
                en: "Context switch detected. Return to the critical path.",
                ru: "Обнаружен context switch. Вернись на critical path.",
            },
            {
                en: "This tab is outside the sprint scope. Close it.",
                ru: "Эта вкладка вне scope спринта. Закрой ее.",
            },
            {
                en: "Reduce noise, keep the system stable, ship the next step.",
                ru: "Уменьши шум, сохрани систему стабильной, ship следующий шаг.",
            },
        ],
    },
    mentor: {
        name: { en: "Nina", ru: "Нина" },
        role: { en: "Mentor", ru: "Ментор" },
        description: {
            en: "Calm but persistent. Brings you back to the chosen task.",
            ru: "Мягко, но настойчиво возвращает к выбранной задаче.",
        },
        avatarText: { en: "N", ru: "Н" },
        replicas: [
            {
                en: "You chose focus for a reason. Come back to the task.",
                ru: "Ты выбрал фокус не случайно. Вернись к задаче.",
            },
            {
                en: "Pause the distraction. Your next small step is still waiting.",
                ru: "Поставь отвлечение на паузу. Твой следующий маленький шаг все еще ждет.",
            },
            {
                en: "Close this tab gently and keep the promise you made to yourself.",
                ru: "Мягко закрой эту вкладку и сдержи обещание себе.",
            },
        ],
    },
    coach: {
        name: { en: "Rita", ru: "Рита" },
        role: { en: "Coach", ru: "Коуч" },
        description: {
            en: "Turns a work block into a short win with energy.",
            ru: "Энергично превращает рабочий блок в короткую победу.",
        },
        avatarText: { en: "R", ru: "Р" },
        replicas: [
            {
                en: "One focused move now beats ten distracted plans.",
                ru: "Один сфокусированный шаг лучше десяти рассеянных планов.",
            },
            {
                en: "Close this and win the next five minutes.",
                ru: "Закрой это и выиграй следующие пять минут.",
            },
            {
                en: "Momentum is fragile. Protect it.",
                ru: "Импульс хрупкий. Защити его.",
            },
        ],
    },
    stoic: {
        name: { en: "Mark", ru: "Марк" },
        role: { en: "Stoic", ru: "Стоик" },
        description: {
            en: "Calm and steady. Removes the extra without drama.",
            ru: "Спокойный и невозмутимый. Убирает лишнее без драмы.",
        },
        avatarText: { en: "M", ru: "М" },
        replicas: [
            {
                en: "This is not within your control or your current work.",
                ru: "Это не в зоне твоего контроля и не в текущей работе.",
            },
            {
                en: "Attention is a choice. Choose the task.",
                ru: "Внимание - это выбор. Выбери задачу.",
            },
            {
                en: "Leave the distraction. Return to what matters.",
                ru: "Оставь отвлечение. Вернись к важному.",
            },
        ],
    },
    scientist: {
        name: { en: "Ira", ru: "Ира" },
        role: { en: "Researcher", ru: "Исследователь" },
        description: {
            en: "Uses data to reduce impulsive switching.",
            ru: "Апеллирует к данным и снижает импульсивные переключения.",
        },
        avatarText: { en: "I", ru: "И" },
        replicas: [
            {
                en: "The data says this tab weakens the session. Close it.",
                ru: "Данные говорят: эта вкладка ослабляет сессию. Закрой ее.",
            },
            {
                en: "Attention drift observed. Restore the experiment conditions.",
                ru: "Замечен дрейф внимания. Восстанови условия эксперимента.",
            },
            {
                en: "Your focus sample is contaminated. Remove this variable.",
                ru: "Выборка фокуса загрязнена. Удали эту переменную.",
            },
        ],
    },
    philosopher: {
        name: { en: "Leo", ru: "Лев" },
        role: { en: "Philosopher", ru: "Философ" },
        description: {
            en: "Reminds you of the meaning of work without extra noise.",
            ru: "Напоминает о смысле работы без лишнего шума.",
        },
        avatarText: { en: "L", ru: "Л" },
        replicas: [
            {
                en: "The life you want is built in moments like this.",
                ru: "Жизнь, которую ты хочешь, строится в такие моменты.",
            },
            {
                en: "A scattered mind cannot do deliberate work.",
                ru: "Рассеянный ум не делает осознанную работу.",
            },
            {
                en: "Close what is easy. Continue what is important.",
                ru: "Закрой простое. Продолжай важное.",
            },
        ],
    },
    hacker: {
        name: { en: "Cole", ru: "Кол" },
        role: { en: "Hacker", ru: "Хакер" },
        description: {
            en: "Keeps it short: distraction found, needs a fix.",
            ru: "Говорит коротко: distraction найден, надо исправить.",
        },
        avatarText: { en: "K", ru: "K" },
        replicas: [
            {
                en: "Bug found: distraction loop. Patch it by closing this tab.",
                ru: "Bug найден: distraction loop. Почини, закрыв вкладку.",
            },
            {
                en: "Focus process interrupted. Kill this branch.",
                ru: "Focus process прерван. Убей эту branch.",
            },
            {
                en: "Noise source detected. Remove and resume.",
                ru: "Источник шума обнаружен. Удали и продолжай.",
            },
        ],
    },
    monk: {
        name: { en: "Tikhon", ru: "Тихон" },
        role: { en: "Monk", ru: "Монах" },
        description: {
            en: "Quietly brings attention back to the present moment.",
            ru: "Спокойно возвращает внимание к настоящему моменту.",
        },
        avatarText: { en: "T", ru: "Т" },
        replicas: [
            {
                en: "Breathe once. Then return to the work.",
                ru: "Сделай один вдох. Потом вернись к работе.",
            },
            {
                en: "Let this tab pass without following it.",
                ru: "Позволь этой вкладке пройти мимо, не следуя за ней.",
            },
            {
                en: "Stillness first. Then the next focused action.",
                ru: "Сначала тишина. Потом следующий сфокусированный шаг.",
            },
        ],
    },
    detective: {
        name: { en: "Vera", ru: "Вера" },
        role: { en: "Detective", ru: "Детектив" },
        description: {
            en: "Notices distraction patterns and returns you to the facts.",
            ru: "Замечает паттерны отвлечения и возвращает к фактам.",
        },
        avatarText: { en: "V", ru: "В" },
        replicas: [
            {
                en: "Pattern matched: this tab usually steals the session.",
                ru: "Паттерн совпал: эта вкладка обычно крадет сессию.",
            },
            {
                en: "The evidence points back to your task.",
                ru: "Улики ведут обратно к твоей задаче.",
            },
            {
                en: "Case note: close the distraction before it escalates.",
                ru: "Заметка по делу: закрой отвлечение, пока оно не разрослось.",
            },
        ],
    },
} as const satisfies Record<string, FocusCompanionCopy>;

export type FocusCompanionTranslationId =
    keyof typeof FOCUS_COMPANION_TRANSLATIONS;

export function getFocusCompanionText(
    id: FocusCompanionTranslationId,
    field: "name" | "role" | "description" | "avatarText",
    language: AppLanguage,
): string {
    return getLocalizedText(FOCUS_COMPANION_TRANSLATIONS[id][field], language);
}

export function getFocusCompanionReplicaText(
    id: FocusCompanionTranslationId,
    replicaIndex: number,
    language: AppLanguage,
): string {
    const companion = FOCUS_COMPANION_TRANSLATIONS[id];
    const replica = companion.replicas[replicaIndex] || companion.replicas[0];
    return getLocalizedText(replica, language);
}

function getLocalizedText(value: LocalizedText, language: AppLanguage): string {
    return value[language] || value.en;
}

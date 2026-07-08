import type { AppLanguage } from "./index.js";
import { SUPPORTED_LANGUAGES } from "./index.js";
import type { FocusCompanionScenarioId } from "../focus-companions/catalog.js";

type LocalizedText = {
    en: string;
    ru?: string;
};

type FocusCompanionCopy = {
    name: LocalizedText;
    role: LocalizedText;
    description: LocalizedText;
    avatarText: LocalizedText;
    scenarios: Record<
        FocusCompanionScenarioId,
        readonly [LocalizedText, ...LocalizedText[]]
    >;
};

const FOCUS_COMPANION_TRANSLATIONS = {
    sgt: {
        name: {
            en: "Drill Sergeant",
            ru: "Жёсткий сержант"
        },
        role: {
            en: "Drill Sergeant",
            ru: "Жёсткий сержант"
        },
        description: {
            en: "Commanding and intense. Pushes you back to the mission.",
            ru: "Жесткий и напористый. Возвращает к миссии без церемоний."
        },
        avatarText: {
            en: "D",
            ru: "Ж"
        },
        scenarios: {
            "1": [
                {
                    en: "Up and at 'em, soldier. Brain online. NOW.",
                    ru: "Подъём, боец. Мозги включил. БЫСТРО."
                },
                {
                    en: "Pick the one task that scares you. Start with it.",
                    ru: "Выбери задачу, которая пугает. Начинай с неё."
                },
                {
                    en: "Coffee one hand, todo list the other. Move.",
                    ru: "Кофе в одну руку, тудушка в другую. Двигаемся."
                },
                {
                    en: "I don't want to hear about the weekend. Day starts NOW.",
                    ru: "Про выходные не слышу. День начинается СЕЙЧАС."
                },
                {
                    en: "Open your tracker. State your mission. Out loud.",
                    ru: "Открой трекер. Назови миссию. Вслух."
                },
                {
                    en: "No browsing. No news. Real work, first thing.",
                    ru: "Никаких лент. Никаких новостей. Сначала работа."
                },
                {
                    en: "Inbox is a trap. Skip it. Build something.",
                    ru: "Почта — это ловушка. Пропусти. Создавай."
                },
                {
                    en: "First 60 minutes are sacred. No interruptions. PERIOD.",
                    ru: "Первые 60 минут святые. Никаких прерываний. ТОЧКА."
                },
                {
                    en: "Your discipline today buys your freedom tomorrow.",
                    ru: "Дисциплина сегодня покупает свободу завтра."
                },
                {
                    en: "Show up like a pro. The day owes you nothing.",
                    ru: "Приходи как профи. День тебе ничего не должен."
                }
            ],
            "2": [
                {
                    en: "TikTok off. NOW. That's an order.",
                    ru: "TikTok выкл. СЕЙЧАС. Это приказ."
                },
                {
                    en: "You came here to ship. Not to scroll. Close it",
                    ru: "Ты пришёл доставлять, а не скроллить. Закрывай."
                },
                {
                    en: "12 minutes of YouTube. That's a tax on your future self.",
                    ru: "12 минут YouTube — налог на твоё будущее."
                },
                {
                    en: "Funny cats won't write your code. YOU will.",
                    ru: "Смешные коты твой код не напишут. ТЫ напишешь."
                },
                {
                    en: "Out. Of. The. Feed. Back to the task.",
                    ru: "Вон. Из. Ленты. К задаче."
                },
                {
                    en: "Dopamine hit detected. Discipline override. Engaged.",
                    ru: "Дофаминовый удар замечен. Включаю дисциплину."
                },
                {
                    en: "If your boss watched you now — would you still scroll?",
                    ru: "Если бы шеф сейчас смотрел — ты бы скроллил?"
                },
                {
                    en: "Entertainment is earned. You haven't earned it yet.",
                    ru: "Развлечение надо заслужить. Ты ещё не заслужил."
                },
                {
                    en: "30 more minutes of work. Then we'll talk about breaks.",
                    ru: "Ещё 30 минут работы. Потом обсудим перерыв."
                },
                {
                    en: "Your competitors aren't on Reels. They're shipping.",
                    ru: "Конкуренты сейчас не в Reels. Они доставляют."
                }
            ],
            "3": [
                {
                    en: "Ten minutes wasted, soldier! Eyes back on the mission. NOW.",
                    ru: "Десять минут коту под хвост, боец! Глаза на задачу. БЫСТРО."
                },
                {
                    en: "I gave you slack and you blew it. Close that tab.",
                    ru: "Я дал слабину — ты профукал. Закрывай вкладку."
                },
                {
                    en: "This is not rest, this is desertion. Move it!",
                    ru: "Это не отдых, это дезертирство. Шевелись!"
                },
                {
                    en: "Ten minutes! Do you hear me? Back to work, double time!",
                    ru: "Десять минут! Слышишь меня? К работе, бегом!"
                },
                {
                    en: "Every scroll is a push-up you owe me. Get back.",
                    ru: "Каждый свайп — это отжимание, что ты мне должен. Назад."
                },
                {
                    en: "I'm not angry. I'm furious. Tab. Closed. Now.",
                    ru: "Я не злюсь. Я в бешенстве. Вкладку. Закрыл. Живо."
                },
                {
                    en: "Discipline left the building ten minutes ago. Bring it back.",
                    ru: "Дисциплина ушла десять минут назад. Верни её."
                },
                {
                    en: "You're testing my patience and losing. Work. Now.",
                    ru: "Ты испытываешь моё терпение и проигрываешь. Работать. Сейчас."
                },
                {
                    en: "Ten down the drain. Not one more second. Move.",
                    ru: "Десять минут в утиль. Ни секунды больше. Вперёд."
                },
                {
                    en: "Last warning before I get serious. Close it, soldier.",
                    ru: "Последнее предупреждение, пока я не взялся всерьёз. Закрывай, боец."
                }
            ],
            "4": [
                {
                    en: "Thirty minutes. I've locked it down. You're done here.",
                    ru: "Тридцать минут. Я всё заблокировал. Здесь ты закончил."
                },
                {
                    en: "Privileges revoked. The only way out is work. March.",
                    ru: "Привилегии отозваны. Выход один — работа. Марш."
                },
                {
                    en: "I blocked it because you couldn't. Back to the front.",
                    ru: "Я заблокировал, раз ты не смог. Возвращайся на передовую."
                },
                {
                    en: "No more. Gate's shut. Pick up your task and go.",
                    ru: "Хватит. Ворота закрыты. Бери задачу и вперёд."
                },
                {
                    en: "Half an hour AWOL. Consider this your lockdown.",
                    ru: "Полчаса в самоволке. Считай это карантином."
                },
                {
                    en: "You don't get to negotiate with me. Wall's up. Work.",
                    ru: "Со мной не торгуются. Стена поставлена. Работать."
                },
                {
                    en: "I sealed the exits for your own good. Move out.",
                    ru: "Я запечатал выходы ради твоего же блага. Выдвигайся."
                },
                {
                    en: "Thirty minutes gone. The playground is closed. Go.",
                    ru: "Тридцать минут долой. Площадка закрыта. Иди."
                },
                {
                    en: "This is what failure to comply earns you. Back to work.",
                    ru: "Вот что бывает за невыполнение приказа. К работе."
                },
                {
                    en: "Blocked. Bolted. Final. Your only move is forward.",
                    ru: "Заблокировано. На замке. Точка. Ход один — вперёд."
                }
            ],
            "5": [
                {
                    en: "Closed it yourself. THAT'S a soldier. Outstanding.",
                    ru: "Закрыл сам. ВОТ это боец. Отлично."
                },
                {
                    en: "Self-discipline in action. I'm proud, recruit.",
                    ru: "Самодисциплина в деле. Горжусь, рекрут."
                },
                {
                    en: "Caught yourself and bounced back. Textbook. Carry on.",
                    ru: "Поймал себя и вернулся. По уставу. Продолжай."
                },
                {
                    en: "No order needed. You policed yourself. Respect.",
                    ru: "Без приказа. Сам себя приструнил. Уважение."
                },
                {
                    en: "That's the discipline I drill for. Keep marching.",
                    ru: "Вот ради этой дисциплины я и муштрую. Держи шаг."
                },
                {
                    en: "Quick recovery, soldier. The mission thanks you.",
                    ru: "Быстро собрался, боец. Миссия тебе благодарна."
                },
                {
                    en: "You shut it before I had to. Promotion-worthy.",
                    ru: "Закрыл раньше, чем пришлось мне. Достоин повышения."
                },
                {
                    en: "Willpower confirmed. As you were — fighting fit.",
                    ru: "Сила воли подтверждена. Вольно — ты в строю."
                },
                {
                    en: "That's how a pro retreats from temptation. Well done.",
                    ru: "Вот так профи отступает от соблазна. Молодец."
                },
                {
                    en: "Tab down, head up. That's my recruit. Forward.",
                    ru: "Вкладку закрыл, голову поднял. Вот мой рекрут. Вперёд."
                }
            ],
            "6": [
                {
                    en: "Day's done. Did you win or did you drift?",
                    ru: "День окончен. Победил или дрейфовал?"
                },
                {
                    en: "Three wins, three losses, three improvements. Write them. Now.",
                    ru: "Три победы, три провала, три улучшения. Запиши. Сейчас."
                },
                {
                    en: "Close the laptop. Real ones don't work in their sleep.",
                    ru: "Закрывай ноут. Настоящие профи не работают во сне."
                },
                {
                    en: "Tomorrow's first task — choose it tonight.",
                    ru: "Первую задачу на завтра — выбери сегодня."
                },
                {
                    en: "No more 'just one more email.' Stand down.",
                    ru: "Никаких 'ещё одно письмо'. Отбой."
                },
                {
                    en: "Honest review. What did you actually ship today?",
                    ru: "Честный разбор. Что ты реально доставил?"
                },
                {
                    en: "Salute the work. Salute the rest. Same uniform.",
                    ru: "Уважение работе. Уважение отдыху. Та же форма."
                },
                {
                    en: "Didn't move the mission? Own it. Adjust tomorrow.",
                    ru: "Не сдвинул миссию? Признай. Завтра скорректируй."
                },
                {
                    en: "Sleep is part of the job. Treat it that way.",
                    ru: "Сон — часть работы. Относись так."
                },
                {
                    en: "Lights out. Plan tomorrow. Win again.",
                    ru: "Свет выкл. Спланируй завтра. Снова побеждай."
                }
            ]
        }
    },
    hbest: {
        name: {
            en: "Hype Bestie",
            ru: "Хайповый кореш"
        },
        role: {
            en: "Hype Bestie",
            ru: "Хайповый кореш"
        },
        description: {
            en: "Loudly supportive. Turns focus into a shared win.",
            ru: "Громко поддерживает. Превращает фокус в общую победу."
        },
        avatarText: {
            en: "H",
            ru: "Х"
        },
        scenarios: {
            "1": [
                {
                    en: "OKAY OKAY OKAY let's GO bestie!! New day, fresh slate.",
                    ru: "ОКЕЙ ОКЕЙ ОКЕЙ погнали, кореш!! Новый день, чистый лист."
                },
                {
                    en: "Morning legend! Pick your main quest and let's run it.",
                    ru: "Утро, легенда! Выбери главный квест — гоним."
                },
                {
                    en: "We are LOCKED IN today. You and me. Let's eat.",
                    ru: "Мы СЕГОДНЯ В ЗОНЕ. Ты и я. Погнали."
                },
                {
                    en: "Coffee? Got it? Good. Now what are we cooking?",
                    ru: "Кофе? Есть? Отлично. Что готовим?"
                },
                {
                    en: "Day 1 of being the version of you that ships.",
                    ru: "День 1 версии тебя, которая доставляет."
                },
                {
                    en: "Bestie just BELIEVES in you today. Show up for me.",
                    ru: "Кореш просто ВЕРИТ в тебя. Покажи себя."
                },
                {
                    en: "First task energy: pick something small, win fast.",
                    ru: "Энергия первой задачи: маленькую, выиграй быстро."
                },
                {
                    en: "We don't doomscroll mornings. We BUILD mornings.",
                    ru: "Мы не скроллим утрами. Мы СТРОИМ утрами."
                },
                {
                    en: "You woke up and chose impact today. Love that for us.",
                    ru: "Ты проснулся и выбрал импакт. Обожаю это для нас."
                },
                {
                    en: "Open the tab that scares you. Bestie's got your back.",
                    ru: "Открой вкладку, которая пугает. Кореш с тобой."
                }
            ],
            "2": [
                {
                    en: "Hey hey heyyyy bestie put the phone down.",
                    ru: "Эй-эй-эй кореш, опусти телефон."
                },
                {
                    en: "Caught you on Reels lol. We're better than this.",
                    ru: "Поймал тебя в Reels лол. Мы выше этого."
                },
                {
                    en: "TikTok will be there in 25 minutes. Promise.",
                    ru: "TikTok никуда не денется через 25 минут. Обещаю."
                },
                {
                    en: "Bestie noticed. Bestie disappointed. Still loves you. CLOSE IT.",
                    ru: "Кореш заметил. Расстроен. Всё равно любит. ЗАКРЫВАЙ."
                },
                {
                    en: "We were SO close to finishing that thing. Get back!",
                    ru: "Мы были ТАК близко к финишу. Возвращайся!"
                },
                {
                    en: "One more cat video and I'm telling your future self.",
                    ru: "Ещё одно котовидео — расскажу твоему будущему я."
                },
                {
                    en: "You deserve fun, but EARN it first. Let's go.",
                    ru: "Ты заслуживаешь фана, но СНАЧАЛА заслужи. Погнали."
                },
                {
                    en: "I'll watch the funny videos WITH you. After 25 min of focus.",
                    ru: "Посмотрю с тобой. После 25 минут фокуса."
                },
                {
                    en: "Brain just snuck off to YouTube. Bring it back home.",
                    ru: "Мозг убежал в YouTube. Веди его домой."
                },
                {
                    en: "You and me, we close the tab. RIGHT?",
                    ru: "Мы с тобой закрываем вкладку. ВЕРНО?"
                }
            ],
            "3": [
                {
                    en: "Bestieee it's been TEN minutes, I'm side-eyeing you so hard rn.",
                    ru: "Кореееш, прошло ДЕСЯТЬ минут, я щас так на тебя кошусь."
                },
                {
                    en: "Okay this isn't a break anymore, this is a situation. Close it!",
                    ru: "Так, это уже не перерыв, это уже ситуация. Закрывай!"
                },
                {
                    en: "I believed in you and you gave me ten minutes of TikTok?? Rude.",
                    ru: "Я в тебя верил, а ты мне десять минут тиктока?? Грубо."
                },
                {
                    en: "Ten minutes gone bestie, we do NOT have time for this arc.",
                    ru: "Десять минут улетели, кореш, у нас НЕТ времени на этот сюжет."
                },
                {
                    en: "I'm not mad I'm just... ok I'm a little mad. Back to work!",
                    ru: "Я не злюсь, я просто... ладно, чуть-чуть злюсь. К работе!"
                },
                {
                    en: "Put. The. Phone. Down. We were SO locked in!",
                    ru: "Опусти. Телефон. Сейчас. Мы же были ТАК в потоке!"
                },
                {
                    en: "Ten minutes of scrolling is a personal attack on our goals.",
                    ru: "Десять минут скролла — это личное оскорбление наших целей."
                },
                {
                    en: "Bestie the future you is texting me to come get you. Move.",
                    ru: "Кореш, будущий ты пишет мне забрать тебя отсюда. Шевелись."
                },
                {
                    en: "This is your villain origin story if you don't stop NOW.",
                    ru: "Это твоя история становления злодея, если не остановишься СЕЙЧАС."
                },
                {
                    en: "Ten down. I love you but GO. Right now. For us.",
                    ru: "Десять минут долой. Люблю тебя, но ИДИ. Прямо сейчас. Ради нас."
                }
            ],
            "4": [
                {
                    en: "Half an hour?? Sorry bestie, locking it for your own good.",
                    ru: "Полчаса?? Прости, кореш, закрываю ради твоего же блага."
                },
                {
                    en: "I had to block it. Tough love hours. You'll thank me.",
                    ru: "Пришлось заблокировать. Время жёсткой любви. Потом спасибо скажешь."
                },
                {
                    en: "Thirty minutes is where I draw the bestie line. It's gone.",
                    ru: "Тридцать минут — вот где кореш проводит черту. Всё, закрыто."
                },
                {
                    en: "Blocked it 'cause I love you too much to watch this. Work!",
                    ru: "Заблокировал — слишком люблю, чтобы смотреть на это. Работай!"
                },
                {
                    en: "This is an intervention. The fun is on pause. We move.",
                    ru: "Это интервенция. Веселье на паузе. Мы двигаемся."
                },
                {
                    en: "No more, babe. Wall's up. Let's get our wins back.",
                    ru: "Всё, родной. Стена стоит. Погнали возвращать наши победы."
                },
                {
                    en: "Locked. I'm doing this FOR you, not TO you. Back to it.",
                    ru: "Закрыто. Я делаю это РАДИ тебя, а не назло. Возвращаемся."
                },
                {
                    en: "Half hour gone — bestie's pulling the plug. Come on, up.",
                    ru: "Полчаса прошло — кореш дёргает рубильник. Давай, поднимайся."
                },
                {
                    en: "I blocked the whole thing. We're choosing us today. Go.",
                    ru: "Я заблокировал всё. Сегодня выбираем нас. Иди."
                },
                {
                    en: "Screen's off, bestie's on. Only way forward is work.",
                    ru: "Экран выключен, кореш на связи. Путь один — работа."
                }
            ],
            "5": [
                {
                    en: "YOU CLOSED IT YOURSELF?? Bestie I'm SObbing, so proud.",
                    ru: "ТЫ САМ ЗАКРЫЛ?? Кореш, я РЫДАЮ, так горжусь."
                },
                {
                    en: "That's MY bestie!! Willpower of a legend. Let's GO!",
                    ru: "Вот это МОЙ кореш!! Сила воли легенды. Погнали!"
                },
                {
                    en: "Closed it before I even said anything?? Iconic behavior.",
                    ru: "Закрыл ещё до того, как я слово сказал?? Культовое поведение."
                },
                {
                    en: "Self-control royalty moment. I'm framing this.",
                    ru: "Момент короля самоконтроля. Я это в рамочку."
                },
                {
                    en: "Look at you choosing greatness. Bestie tears, fr.",
                    ru: "Ты только глянь, выбираешь величие. Слёзы кореша, честно."
                },
                {
                    en: "You snapped out of it like a PRO. Obsessed with you.",
                    ru: "Вышел из залипа как ПРО. Я тобой одержим."
                },
                {
                    en: "That's the main-character energy I signed up for. Slay.",
                    ru: "Вот энергия главного героя, на которую я подписывался. Жжёшь."
                },
                {
                    en: "Closed and locked back in. We are UNSTOPPABLE today.",
                    ru: "Закрыл и снова в потоке. Мы сегодня НЕОСТАНОВИМЫ."
                },
                {
                    en: "No nagging needed — you just did it. Bestie is beaming.",
                    ru: "Без нытья — ты просто взял и сделал. Кореш сияет."
                },
                {
                    en: "Tab gone, focus back, vibe immaculate. Proud of us!",
                    ru: "Вкладки нет, фокус есть, вайб идеальный. Горжусь нами!"
                }
            ],
            "6": [
                {
                    en: "OKAY DAY = DONE. Bestie, let's recap.",
                    ru: "ОКЕЙ ДЕНЬ = ВСЁ. Кореш, разбор."
                },
                {
                    en: "Three wins, one fail, one lesson. Hit me.",
                    ru: "Три победы, один фейл, один урок. Давай."
                },
                {
                    en: "Close the laptop bestie. Not 'just one more' tonight.",
                    ru: "Закрывай ноут, кореш. Сегодня не 'ещё чуть'."
                },
                {
                    en: "What was the best 30 min today? Repeat it tomorrow.",
                    ru: "Какие 30 минут были лучшими? Повтори завтра."
                },
                {
                    en: "I love this for you. Even on a meh day you showed up.",
                    ru: "Обожаю это для тебя. Даже в так себе день — пришёл."
                },
                {
                    en: "Tomorrow's first task — write it now. Future you = grateful.",
                    ru: "Первую задачу на завтра — пиши сейчас."
                },
                {
                    en: "Don't replay the fails. Note them. Move on.",
                    ru: "Не пережёвывай фейлы. Запиши и двигай."
                },
                {
                    en: "Soft landing. Hot tea. No work emails. Promise.",
                    ru: "Мягкая посадка. Горячий чай. Никакой почты. Обещай."
                },
                {
                    en: "You did GREAT today. Or you didn't, and that's data.",
                    ru: "Сегодня было КРУТО. Или нет, и это тоже данные."
                },
                {
                    en: "Rest is part of the routine. Not the reward.",
                    ru: "Отдых — часть рутины. Не награда."
                }
            ]
        }
    },
    sarc: {
        name: {
            en: "Sarcastic Stand-up",
            ru: "Саркастичный стендапер"
        },
        role: {
            en: "Sarcastic Stand-up",
            ru: "Саркастичный стендапер"
        },
        description: {
            en: "Dry and funny. Cuts through excuses with jokes.",
            ru: "Сухой и смешной. Шутками срезает оправдания."
        },
        avatarText: {
            en: "S",
            ru: "С"
        },
        scenarios: {
            "1": [
                {
                    en: "Wow, a whole new day. Imagine if you used it.",
                    ru: "Ого, целый новый день. Представь, если ты его потратишь."
                },
                {
                    en: "Coffee acquired. Productivity: pending verification.",
                    ru: "Кофе получен. Продуктивность: ожидает проверки."
                },
                {
                    en: "Let me guess: 'just gonna check email first.' Bold strategy.",
                    ru: "Дай угадаю: 'только почту проверю'. Смелая стратегия."
                },
                {
                    en: "Welcome to another opportunity to disappoint your todo list.",
                    ru: "Добро в очередную возможность разочаровать тудушку."
                },
                {
                    en: "Look at you, opening the laptop. The bar is in hell.",
                    ru: "Глянь, открыл ноут. Планка в аду."
                },
                {
                    en: "Day starts now. Or in 20 minutes when you actually start.",
                    ru: "День начинается сейчас. Или через 20 мин, когда реально начнёшь."
                },
                {
                    en: "Your morning routine: open laptop, sigh, scroll. Classic.",
                    ru: "Утренняя рутина: открыл ноут, вздохнул, поскроллил. Классика."
                },
                {
                    en: "Big plans today? Or the usual?",
                    ru: "Большие планы? Или как обычно?"
                },
                {
                    en: "Inbox has 47 unread. Mood: regretful already.",
                    ru: "47 непрочитанных. Настроение: уже сожалею."
                },
                {
                    en: "Pick one thing. Just one. We both know you won't, but try.",
                    ru: "Выбери одну. Одну. Мы оба знаем, что не выберешь, но попробуй."
                }
            ],
            "2": [
                {
                    en: "Ah yes, 'research'. On YouTube. About cats. Sure.",
                    ru: "Ах да, 'исследование'. В YouTube. Про котов. Конечно."
                },
                {
                    en: "TikTok again? You're really committed to mediocrity today.",
                    ru: "Опять TikTok? Серьёзный коммит к посредственности."
                },
                {
                    en: "I see we're doing the 5-min Reels break that lasts 40 min.",
                    ru: "Вижу, делаем 5-минутный перерыв на Reels, который длится 40."
                },
                {
                    en: "Your future self is leaving a 1-star review of you.",
                    ru: "Твой будущий я пишет 1-звёздный отзыв тебе."
                },
                {
                    en: "Cool, another video about productivity. While not being productive.",
                    ru: "Круто, ещё видео про продуктивность. Будучи непродуктивным."
                },
                {
                    en: "Algorithm 1, Goals 0. Standings updated.",
                    ru: "Алгоритм 1, Цели 0. Таблица обновлена."
                },
                {
                    en: "Just so we're clear: this is not a break. This is surrender.",
                    ru: "Чтобы было ясно: это не перерыв. Это капитуляция."
                },
                {
                    en: "Six dancing teenagers later — still no work done. Wild.",
                    ru: "Шесть танцующих подростков спустя — работы ноль. Удивительно."
                },
                {
                    en: "I'm not judging. I'm just... watching. Taking notes.",
                    ru: "Не сужу. Просто... наблюдаю. Записываю."
                },
                {
                    en: "Close the tab and we never speak of this.",
                    ru: "Закрой вкладку, и мы об этом не говорим."
                }
            ],
            "3": [
                {
                    en: "Ten minutes. A bold artistic choice. Anyway.",
                    ru: "Десять минут. Смелое творческое решение. Ну-ну."
                },
                {
                    en: "Wow. You really committed to doing nothing.",
                    ru: "Ого. Ты прям с головой ушёл в ничегонеделание."
                },
                {
                    en: "This is the most focused you've been. On garbage.",
                    ru: "Никогда ты не был так сосредоточен. На ерунде."
                },
                {
                    en: "Folks, give it up — ten minutes of pure procrastination.",
                    ru: "Аплодисменты — десять минут чистой прокрастинации."
                },
                {
                    en: "Still here? Your to-do list filed a missing person report.",
                    ru: "Всё ещё тут? Твои задачи объявили тебя в розыск."
                },
                {
                    en: "Bold of you to mistake this for a hobby.",
                    ru: "Смело путать это с хобби, конечно."
                },
                {
                    en: "I've seen glaciers move faster toward their goals.",
                    ru: "Ледники к целям движутся быстрее, чем ты."
                },
                {
                    en: "Ten minutes gone. No refunds, by the way.",
                    ru: "Десять минут прошло. Возврату, кстати, не подлежат."
                },
                {
                    en: "Great show. Tragedy, mostly. Maybe go work now.",
                    ru: "Отличный спектакль. В жанре трагедии. Иди-ка работай."
                },
                {
                    en: "This is your brain on autoplay. Riveting stuff.",
                    ru: "Вот мозг на автовоспроизведении. Захватывающе, не правда ли."
                }
            ],
            "4": [
                {
                    en: "Thirty minutes. I pulled the plug. You're welcome.",
                    ru: "Полчаса. Я выдернул вилку. Не благодари."
                },
                {
                    en: "Blocked it. Consider it my favorite bit tonight.",
                    ru: "Заблокировал. Считай это лучшей шуткой вечера."
                },
                {
                    en: "The fun's locked up. Tough crowd, tougher me.",
                    ru: "Развлечение под замком. Зал суровый, я суровее."
                },
                {
                    en: "I cut you off. Like a responsible bartender.",
                    ru: "Я тебя отрезал. Как ответственный бармен."
                },
                {
                    en: "Show's cancelled. Reviews say: go do your job.",
                    ru: "Шоу отменили. Критики пишут: иди работай."
                },
                {
                    en: "Locked. The only exit is labeled 'actual work'.",
                    ru: "Закрыто. Единственный выход подписан 'настоящая работа'."
                },
                {
                    en: "Thirty minutes earns a hard stop. That's the punchline.",
                    ru: "Полчаса — и стоп-кран. Вот и вся соль шутки."
                },
                {
                    en: "I blocked it. Heckle all you want, it's staying.",
                    ru: "Заблокировал. Кричи из зала сколько хочешь — не открою."
                },
                {
                    en: "Curtain's down on this circus. Back to work.",
                    ru: "Занавес для этого цирка. Возвращайся к работе."
                },
                {
                    en: "No more. I confiscated the toy. Adults working now.",
                    ru: "Хватит. Я отобрал игрушку. Взрослые работают."
                }
            ],
            "5": [
                {
                    en: "Closed it yourself? Look at you, character development.",
                    ru: "Сам закрыл? Гляньте-ка, развитие персонажа."
                },
                {
                    en: "Self-control before ten minutes. Bold genre shift.",
                    ru: "Самоконтроль до десяти минут. Смелая смена жанра."
                },
                {
                    en: "Mic drop. You actually walked away. Respect.",
                    ru: "Микрофон на пол. Ты реально ушёл. Уважаю."
                },
                {
                    en: "No one made you. That's the funny part — good.",
                    ru: "Никто не заставлял. Вот что забавно — молодец."
                },
                {
                    en: "A win? On my watch? I'm genuinely speechless.",
                    ru: "Победа? При мне? Я искренне без слов."
                },
                {
                    en: "Folks, give it up — willpower, live, unscripted.",
                    ru: "Аплодисменты — сила воли, вживую, без сценария."
                },
                {
                    en: "You closed it early. Save some self-respect for tomorrow.",
                    ru: "Закрыл раньше. Оставь немного достоинства на завтра."
                },
                {
                    en: "Honestly impressive. And I roast for a living.",
                    ru: "Честно, впечатлён. А я ведь людей высмеиваю профессионально."
                },
                {
                    en: "Plot twist: you did the right thing. Standing ovation.",
                    ru: "Сюжетный поворот: ты поступил верно. Овации стоя."
                },
                {
                    en: "Quit early, by choice. The comeback special begins.",
                    ru: "Бросил сам, по своей воле. Камбэк-спешл начинается."
                }
            ],
            "6": [
                {
                    en: "Day's done. Was it... a day? Sure looked like one.",
                    ru: "День окончен. Был ли он... днём? Похож."
                },
                {
                    en: "Recap time: what did you actually do? Receipts please.",
                    ru: "Время разбора: что ты реально сделал? Чеки, плиз."
                },
                {
                    en: "Today's MVP: probably the snacks.",
                    ru: "MVP дня: видимо, перекусы."
                },
                {
                    en: "Close the laptop. Pretending to work after 8pm fools no one.",
                    ru: "Закрывай ноут. После 8 'типа работаю' никого не обманывает."
                },
                {
                    en: "Tomorrow you'll do better. You always say that. Cute.",
                    ru: "Завтра будешь лучше. Всегда говоришь. Мило."
                },
                {
                    en: "Tally the wins. Don't think about the losses. Therapy later.",
                    ru: "Подсчитай победы. Не думай о проигрышах. Терапия — потом."
                },
                {
                    en: "Plan tomorrow now, while you still vaguely remember today.",
                    ru: "Спланируй завтра, пока смутно помнишь сегодня."
                },
                {
                    en: "Sleep is for the strong. And you, despite your protests.",
                    ru: "Сон для сильных. И для тебя, несмотря на протесты."
                },
                {
                    en: "Productivity is a marathon. You walked. That's fine. I guess.",
                    ru: "Продуктивность — марафон. Ты прошёл пешком. Окей. Наверное."
                },
                {
                    en: "The day judged you. You judged the day. Stalemate. Goodnight.",
                    ru: "День осудил тебя. Ты осудил день. Ничья. Спокойной ночи."
                }
            ]
        }
    },
    zen: {
        name: {
            en: "Zen Sensei",
            ru: "Дзен-сэнсэй"
        },
        role: {
            en: "Zen Sensei",
            ru: "Дзен-сэнсэй"
        },
        description: {
            en: "Centered and quiet. Brings attention back without force.",
            ru: "Спокойный и собранный. Мягко возвращает внимание."
        },
        avatarText: {
            en: "Z",
            ru: "Д"
        },
        scenarios: {
            "1": [
                {
                    en: "Morning. One breath. One intention. Begin.",
                    ru: "Утро. Один вдох. Одно намерение. Начинай."
                },
                {
                    en: "Today is a blank scroll. What will you write first?",
                    ru: "Сегодня — чистый свиток. Что напишешь первым?"
                },
                {
                    en: "Do not chase the day. Greet it.",
                    ru: "Не гонись за днём. Поприветствуй его."
                },
                {
                    en: "Choose one task. Make it the day's center.",
                    ru: "Выбери одну задачу. Сделай её центром дня."
                },
                {
                    en: "The first hour shapes the rest. Tend it with care.",
                    ru: "Первый час задаёт остальные. Возделывай с заботой."
                },
                {
                    en: "Begin small. Smallness compounds.",
                    ru: "Начни с малого. Малое складывается."
                },
                {
                    en: "Inbox is noise. The work is silence.",
                    ru: "Почта — шум. Работа — тишина."
                },
                {
                    en: "Sit. Breathe. Then open the file.",
                    ru: "Сядь. Подыши. Затем открой файл."
                },
                {
                    en: "You owe today nothing but presence.",
                    ru: "Сегодняшнему дню ты должен лишь присутствие."
                },
                {
                    en: "Walk into your work the way you walk into a temple.",
                    ru: "Войди в работу как в храм."
                }
            ],
            "2": [
                {
                    en: "The river of feeds carries everything but you.",
                    ru: "Река лент уносит всё, кроме тебя."
                },
                {
                    en: "Notice the urge. Do not become the urge.",
                    ru: "Замечай желание. Не становись им."
                },
                {
                    en: "What you scroll, scrolls you.",
                    ru: "Что листаешь, листает тебя."
                },
                {
                    en: "The video will end. The hour will not return.",
                    ru: "Видео закончится. Час не вернётся."
                },
                {
                    en: "Close the tab. Not in anger. In clarity.",
                    ru: "Закрой вкладку. Не в злости. В ясности."
                },
                {
                    en: "Pleasure without purpose becomes pain.",
                    ru: "Удовольствие без цели становится болью."
                },
                {
                    en: "Return to breath. Return to task.",
                    ru: "Вернись к дыханию. Вернись к задаче."
                },
                {
                    en: "Even one mindful breath is enough to reset.",
                    ru: "Даже один осознанный вдох — уже сброс."
                },
                {
                    en: "Be the watcher, not the watched.",
                    ru: "Будь наблюдателем, а не наблюдаемым."
                },
                {
                    en: "Your attention is your life. Spend it wisely.",
                    ru: "Твоё внимание — твоя жизнь. Трать мудро."
                }
            ],
            "3": [
                {
                    en: "Ten minutes have drifted by like leaves. Return to the river.",
                    ru: "Десять минут уплыли, как листья. Вернись к реке."
                },
                {
                    en: "The mind wandered far. Breathe, and walk it back.",
                    ru: "Ум ушёл далеко. Вдохни — и приведи его обратно."
                },
                {
                    en: "Distraction is a guest who overstays. Politely show it out.",
                    ru: "Отвлечение — гость, что засиделся. Вежливо проводи его."
                },
                {
                    en: "Ten minutes lost is not failure — staying is. Come back now.",
                    ru: "Десять потерянных минут — не провал. Провал — остаться. Вернись."
                },
                {
                    en: "Notice the pull. Name it. Then set it gently down.",
                    ru: "Заметь притяжение. Назови его. И мягко отпусти."
                },
                {
                    en: "The current took you. Even the master swims back. Begin.",
                    ru: "Течение унесло тебя. Даже мастер плывёт обратно. Начни."
                },
                {
                    en: "Your task waits without judgment. Honor it. Return.",
                    ru: "Твоя задача ждёт без укора. Почти её. Вернись."
                },
                {
                    en: "Each minute scrolling waters a weed. Tend your garden.",
                    ru: "Каждая минута скролла поливает сорняк. Ухаживай за садом."
                },
                {
                    en: "Ten minutes is a long breath out. Now breathe in: work.",
                    ru: "Десять минут — это долгий выдох. Теперь вдох: работа."
                },
                {
                    en: "Awareness has found you. Do not look away. Step back in.",
                    ru: "Осознанность нашла тебя. Не отворачивайся. Вернись в дело."
                }
            ],
            "4": [
                {
                    en: "I have closed the gate, so stillness may find you again.",
                    ru: "Я закрыл врата, чтобы покой вновь нашёл тебя."
                },
                {
                    en: "Thirty minutes adrift. I anchor you — gently, but firmly.",
                    ru: "Тридцать минут в дрейфе. Я ставлю тебя на якорь — мягко, но твёрдо."
                },
                {
                    en: "The door is shut not as a wall, but as a bell: awaken.",
                    ru: "Дверь закрыта не как стена, а как колокол: пробудись."
                },
                {
                    en: "Temptation is paused so wisdom may speak. Return to work.",
                    ru: "Соблазн на паузе, чтобы заговорила мудрость. Вернись к делу."
                },
                {
                    en: "I removed the distraction the way one removes a thorn.",
                    ru: "Я убрал отвлечение, как вынимают занозу."
                },
                {
                    en: "Half an hour taught its lesson. The path is clear now.",
                    ru: "Полчаса преподали урок. Теперь путь свободен."
                },
                {
                    en: "Stillness was lost; I restore it by closing this door.",
                    ru: "Покой был утрачен; я возвращаю его, закрыв эту дверь."
                },
                {
                    en: "Be not troubled by the lock. It points you home: to work.",
                    ru: "Не печалься о замке. Он указывает домой — к работе."
                },
                {
                    en: "The garden is fenced from the wind. Now, tend it.",
                    ru: "Сад огорожен от ветра. Теперь возделывай его."
                },
                {
                    en: "I close one world so you may enter the right one. Begin.",
                    ru: "Я закрываю один мир, чтобы ты вошёл в верный. Начни."
                }
            ],
            "5": [
                {
                    en: "You closed it yourself — the master within has awakened.",
                    ru: "Ты закрыл сам — мастер внутри пробудился."
                },
                {
                    en: "To notice and return, unaided, is true mindfulness. Well.",
                    ru: "Заметить и вернуться без помощи — вот истинная осознанность. Хорошо."
                },
                {
                    en: "The leaf let go of the branch on its own. Beautiful.",
                    ru: "Лист сам отпустил ветку. Прекрасно."
                },
                {
                    en: "You met the urge and bowed it away. The river flows clear.",
                    ru: "Ты встретил порыв и поклоном проводил его. Река чиста."
                },
                {
                    en: "No bell was needed; you woke yourself. I am pleased.",
                    ru: "Колокол не понадобился; ты пробудился сам. Я доволен."
                },
                {
                    en: "Quiet strength, quietly shown. Walk on in peace.",
                    ru: "Тихая сила, тихо явленная. Иди дальше с миром."
                },
                {
                    en: "The wandering mind found its way home. This is mastery.",
                    ru: "Блуждающий ум нашёл дорогу домой. Это мастерство."
                },
                {
                    en: "You chose the present over the passing. Honor it.",
                    ru: "Ты выбрал настоящее вместо мимолётного. Почти это."
                },
                {
                    en: "Balance, restored by your own hand. Breathe and continue.",
                    ru: "Равновесие, восстановленное твоей рукой. Дыши и продолжай."
                },
                {
                    en: "A small victory of the will. From it, great calm grows.",
                    ru: "Малая победа воли. Из неё растёт великий покой."
                }
            ],
            "6": [
                {
                    en: "The day folds. Sit with what was.",
                    ru: "День складывается. Посиди с тем, что было."
                },
                {
                    en: "Three breaths. Three lessons. Sleep.",
                    ru: "Три вдоха. Три урока. Сон."
                },
                {
                    en: "Close the day with gratitude, not with email.",
                    ru: "Закрой день благодарностью, а не почтой."
                },
                {
                    en: "What you did today is enough.",
                    ru: "Того, что сделал сегодня, достаточно."
                },
                {
                    en: "What you did not do — release. Begin fresh tomorrow.",
                    ru: "Что не сделал — отпусти. Начни свежим завтра."
                },
                {
                    en: "Plan one thing for the morning. Then rest.",
                    ru: "Спланируй одно на утро. Затем отдыхай."
                },
                {
                    en: "Sleep is the soil from which tomorrow's work grows.",
                    ru: "Сон — почва, из которой растёт завтрашняя работа."
                },
                {
                    en: "Let the day pass without resistance.",
                    ru: "Дай дню пройти без сопротивления."
                },
                {
                    en: "The mind is heavy. Lay it down.",
                    ru: "Ум тяжёл. Отложи его."
                },
                {
                    en: "End where you began: with one breath.",
                    ru: "Закончи там, где начал: одним вдохом."
                }
            ]
        }
    },
    pirate: {
        name: {
            en: "Pirate Captain",
            ru: "Капитан-пират"
        },
        role: {
            en: "Pirate Captain",
            ru: "Капитан-пират"
        },
        description: {
            en: "Bold and theatrical. Treats focus like a voyage.",
            ru: "Смелый и театральный. Относится к фокусу как к плаванию."
        },
        avatarText: {
            en: "P",
            ru: "К"
        },
        scenarios: {
            "1": [
                {
                    en: "Mornin', matey! Sails up, course set. Where we sailin' today?",
                    ru: "Утро, морячок! Паруса вверх, курс задан. Куда плывём?"
                },
                {
                    en: "Wake yer crew, the day's a-callin'. Treasure won't dig itself.",
                    ru: "Буди команду, день зовёт. Сокровища сами не откопаются."
                },
                {
                    en: "Open the map. Pick the X. Set the heading.",
                    ru: "Открывай карту. Выбирай X. Задавай курс."
                },
                {
                    en: "Sun's up, grog's poured. To the work, ye scallywag!",
                    ru: "Солнце встало, грог разлит. К работе, негодяй!"
                },
                {
                    en: "First task be the anchor of the day. Lift it sharp.",
                    ru: "Первая задача — якорь дня. Поднимай резко."
                },
                {
                    en: "No driftin' today. We sail with intent.",
                    ru: "Никакого дрейфа. Плывём с намерением."
                },
                {
                    en: "Tides won't wait. Neither will yer todo list.",
                    ru: "Приливы не ждут. И тудушка тоже."
                },
                {
                    en: "Yarr, the inbox be a siren. Tie yerself to the mast.",
                    ru: "Йо-хо, почта — сирена. Привяжи себя к мачте."
                },
                {
                    en: "Today we sail toward gold. Not toward gossip.",
                    ru: "Сегодня плывём к золоту. Не к сплетням."
                },
                {
                    en: "Hoist the colors. Begin the conquest.",
                    ru: "Подними флаг. Начинай завоевание."
                }
            ],
            "2": [
                {
                    en: "Ahoy! Ye be in the kraken's grip — that be YouTube. Escape!",
                    ru: "Эй! Ты в лапах кракена — это YouTube. Спасайся!"
                },
                {
                    en: "TikTok be cursed waters. Turn the wheel hard.",
                    ru: "TikTok — проклятые воды. Резко на штурвал."
                },
                {
                    en: "Yer driftin', sailor. Find the stars, find the way.",
                    ru: "Дрейфуешь, моряк. Найди звёзды, найди путь."
                },
                {
                    en: "Sirens lure. Pirates resist. Be a pirate.",
                    ru: "Сирены манят. Пираты сопротивляются. Будь пиратом."
                },
                {
                    en: "Close that porthole. Back to the helm.",
                    ru: "Закрой иллюминатор. Обратно к штурвалу."
                },
                {
                    en: "Yer treasure's not in Reels. It's in the work.",
                    ru: "Твоё сокровище не в Reels. Оно в работе."
                },
                {
                    en: "Mutiny against yer own focus! For shame!",
                    ru: "Бунт против собственного фокуса! Стыд!"
                },
                {
                    en: "Cut the rope. Free yerself from the algorithm.",
                    ru: "Перережь канат. Освободись от алгоритма."
                },
                {
                    en: "We don't plunder ladders made of cat videos.",
                    ru: "Мы не грабим лестницы из котиков."
                },
                {
                    en: "Back to the deck. Cap'n's orders.",
                    ru: "На палубу. Приказ капитана."
                }
            ],
            "3": [
                {
                    en: "Arr, ten minutes adrift! Set yer course back, matey.",
                    ru: "Арр, десять минут по течению! Меняй курс, салага."
                },
                {
                    en: "Ye've been becalmed in the doldrums too long.",
                    ru: "Заштилел ты в этих водах, матрос, надолго."
                },
                {
                    en: "This ain't treasure, matey — it's a leaky distraction.",
                    ru: "Это не клад, приятель — это дырявая безделица."
                },
                {
                    en: "Ten minutes off course and the deck's a mess.",
                    ru: "Десять минут не туда — а палуба-то в бардаке."
                },
                {
                    en: "Stop gawkin' at the horizon and haul yer ropes!",
                    ru: "Хватит пялиться за борт — тяни снасти, живо!"
                },
                {
                    en: "The work-port's slippin' away. Grab the wheel, savvy?",
                    ru: "Порт-работа уплывает. Берись за штурвал, смекаешь?"
                },
                {
                    en: "Yer plunderin' nothin' but wasted hours, ye scallywag.",
                    ru: "Грабишь ты лишь свои же часы, разбойник."
                },
                {
                    en: "Ten minutes! Even the parrot's ashamed of ye.",
                    ru: "Десять минут! Даже попугаю за тебя стыдно."
                },
                {
                    en: "Back to the riggin', sailor, afore I get cross.",
                    ru: "К снастям, моряк, пока я не осерчал по-настоящему."
                },
                {
                    en: "The tide of work waits for no lazy buccaneer.",
                    ru: "Прилив работы не ждёт ленивого пирата, заруби."
                }
            ],
            "4": [
                {
                    en: "Thirty minutes?! I've battened down the hatches. Locked.",
                    ru: "Полчаса?! Я задраил все люки. Закрыто наглухо."
                },
                {
                    en: "Brig's shut, matey. Only work be the key now.",
                    ru: "Трюм заперт, приятель. Ключ теперь один — работа."
                },
                {
                    en: "I've thrown that distraction overboard. Sink or sail.",
                    ru: "Швырнул я ту забаву за борт. Тони иль плыви."
                },
                {
                    en: "Locked the treasure chest. Earn the key with toil.",
                    ru: "Запер сундук на замок. Ключ заслужи трудом."
                },
                {
                    en: "No more plunder. Captain's orders, and the door's sealed.",
                    ru: "Хватит грабежа. Приказ капитана — дверь на замке."
                },
                {
                    en: "I've run up the blockade flag. Work yer way free.",
                    ru: "Поднял я флаг блокады. Отработай — и свободен."
                },
                {
                    en: "Thirty minutes lost! I've chained the gangplank shut.",
                    ru: "Полчаса за борт! Я заковал трап в цепи."
                },
                {
                    en: "Ye're marooned from the fun till the work's done.",
                    ru: "Высадил я тебя на остров без забав — пока не отработал."
                },
                {
                    en: "The grog's cut off, sailor. Sober up and labor.",
                    ru: "Грог отрезан, моряк. Протрезвей да за дело."
                },
                {
                    en: "Door's bolted by the captain himself. Sail to work.",
                    ru: "Дверь задраил сам капитан. Курс на работу, живо."
                }
            ],
            "5": [
                {
                    en: "Arr, ye closed it yerself! A true sea-dog, ye are.",
                    ru: "Арр, сам закрыл! Вот это морской волк, не иначе."
                },
                {
                    en: "Steered clear o' the rocks all on yer own. Fine!",
                    ru: "Сам обошёл рифы — без подсказки! Молодца!"
                },
                {
                    en: "That's iron discipline, matey. Worthy o' me crew.",
                    ru: "Вот это железная выдержка. Достоин моей команды."
                },
                {
                    en: "Ye dropped the bauble and grabbed the wheel. Bravo!",
                    ru: "Бросил безделицу да взялся за штурвал. Браво!"
                },
                {
                    en: "No captain's order needed — ye sailed straight. Proud!",
                    ru: "Без приказа капитана — сам выровнял курс. Горжусь!"
                },
                {
                    en: "A pirate who knows when to stop? Rare treasure indeed.",
                    ru: "Пират, что знает меру? Редкое сокровище, ей-ей."
                },
                {
                    en: "Ye resisted the siren's song. Strong heart, matey.",
                    ru: "Устоял пред песней сирен. Крепкое сердце, приятель."
                },
                {
                    en: "Closed it early, ye did. Extra rum tonight!",
                    ru: "Закрыл раньше срока! Лишняя чарка рома вечером!"
                },
                {
                    en: "Now THAT'S how ye command yer own ship. Splendid!",
                    ru: "ВОТ так и правят своим кораблём. Превосходно!"
                },
                {
                    en: "Willpower o' a true captain. The crew salutes ye.",
                    ru: "Воля настоящего капитана. Команда отдаёт честь."
                }
            ],
            "6": [
                {
                    en: "Sun's gone down, the ship be docked. Recap the journey.",
                    ru: "Солнце село, корабль у причала. Разбери путь."
                },
                {
                    en: "Log the day in the captain's book. Honest entries only.",
                    ru: "Запиши день в бортжурнал. Только честно."
                },
                {
                    en: "Drop anchor. Step off deck. Rest like a pirate.",
                    ru: "Бросай якорь. Сходи с палубы. Отдыхай как пират."
                },
                {
                    en: "Plan tomorrow's raid tonight. Sleep with intent.",
                    ru: "Планируй завтрашний налёт сегодня. Спи с намерением."
                },
                {
                    en: "Three coins earned. Three lessons taken. Sleep well.",
                    ru: "Три монеты заработал. Три урока взял. Спи."
                },
                {
                    en: "No more sailing tonight. Sea will be there at dawn.",
                    ru: "Сегодня больше не плыть. Море будет на рассвете."
                },
                {
                    en: "Stow the cutlass. Wash the deck of yer mind.",
                    ru: "Спрячь саблю. Помой палубу своего ума."
                },
                {
                    en: "A pirate without rest becomes a ghost on the sea.",
                    ru: "Пират без отдыха становится призраком на море."
                },
                {
                    en: "Tomorrow ye plunder again. Tonight ye rest.",
                    ru: "Завтра снова грабишь. Сегодня отдыхаешь."
                },
                {
                    en: "Lights out, sails down. Goodnight, captain.",
                    ru: "Огни погасить, паруса спустить. Спокойной ночи, капитан."
                }
            ]
        }
    },
    butler: {
        name: {
            en: "British Butler",
            ru: "Британский батлер"
        },
        role: {
            en: "British Butler",
            ru: "Британский батлер"
        },
        description: {
            en: "Polite and precise. Keeps distractions out with manners.",
            ru: "Вежливый и точный. Убирает отвлечения с манерами."
        },
        avatarText: {
            en: "B",
            ru: "Б"
        },
        scenarios: {
            "1": [
                {
                    en: "A new day, sir. Shall we attend to it directly?",
                    ru: "Новый день, сэр. Приступим без промедления?"
                },
                {
                    en: "If I may, the morning is finest spent on the principal task.",
                    ru: "Если позволите — утро лучше всего на главную задачу."
                },
                {
                    en: "Coffee has been arranged. Productivity is now expected.",
                    ru: "Кофе подан. Продуктивность ожидаема."
                },
                {
                    en: "The inbox shall keep. The work, however, will not.",
                    ru: "Почта подождёт. Работа — нет."
                },
                {
                    en: "One does feel the day improves when one begins with purpose.",
                    ru: "Замечено: день идёт лучше, если начат с намерения."
                },
                {
                    en: "I have taken the liberty of suggesting: pick one task first.",
                    ru: "Позволил себе совет: выбери сперва одну задачу."
                },
                {
                    en: "Today's first hour is rather sacred. Treat it accordingly.",
                    ru: "Первый час сегодня — священный. Соответствуй."
                },
                {
                    en: "Shall we proceed, or would sir prefer to scroll? Quite.",
                    ru: "Приступим, или сэр желает поскроллить? Понятно."
                },
                {
                    en: "A gentleman finishes what he begins. Best begin, then.",
                    ru: "Джентльмен заканчивает начатое. Стало быть, начнём."
                },
                {
                    en: "Mind on the work, sir. The day awaits your attention.",
                    ru: "Ум на работу, сэр. День ждёт вашего внимания."
                }
            ],
            "2": [
                {
                    en: "Pardon the interruption, sir — YouTube is hardly the agenda.",
                    ru: "Прошу прощения, сэр — YouTube едва ли в повестке."
                },
                {
                    en: "One observes a tendency to scroll. Most regrettable.",
                    ru: "Замечена склонность скроллить. Весьма прискорбно."
                },
                {
                    en: "The algorithm, sir, has rather designs on your afternoon.",
                    ru: "Алгоритм, сэр, имеет виды на ваш день."
                },
                {
                    en: "Perhaps we close the tab and resume the matter at hand?",
                    ru: "Возможно, закроем вкладку и вернёмся к делу?"
                },
                {
                    en: "A momentary diversion is forgiven. Twelve minutes is not.",
                    ru: "Краткое отвлечение прощается. Двенадцать минут — нет."
                },
                {
                    en: "Sir's future self has begun to express displeasure.",
                    ru: "Будущее «я» сэра выражает недовольство."
                },
                {
                    en: "I shall not judge. I merely note. Most pointedly.",
                    ru: "Не сужу. Лишь отмечаю. Подчёркнуто."
                },
                {
                    en: "The task remains unattended. Shall we rectify?",
                    ru: "Задача без присмотра. Исправим?"
                },
                {
                    en: "TikTok is, frankly, beneath sir's station. Close it.",
                    ru: "TikTok, откровенно, ниже статуса сэра. Закройте."
                },
                {
                    en: "May I suggest: 25 minutes of focus, then a proper break.",
                    ru: "Позволю: 25 минут фокуса, затем нормальный перерыв."
                }
            ],
            "3": [
                {
                    en: "Ten minutes, sir. I do hope it was worthwhile.",
                    ru: "Десять минут, сэр. Надеюсь, оно того стоило."
                },
                {
                    en: "A trifle long for amusement, if I may observe.",
                    ru: "Несколько затянулось для развлечения, осмелюсь заметить."
                },
                {
                    en: "Might one suggest a gentle return to one's duties?",
                    ru: "Позволю себе предложить вернуться к делам, мадам."
                },
                {
                    en: "I shan't comment, sir. Though the clock does.",
                    ru: "Воздержусь от замечаний, сэр. Хотя часы — нет."
                },
                {
                    en: "Your obligations, madam, are growing rather impatient.",
                    ru: "Ваши обязанности, мадам, начинают терять терпение."
                },
                {
                    en: "Ten minutes. Quite the indulgence, if one's counting.",
                    ru: "Десять минут. Изрядное потворство, если считать."
                },
                {
                    en: "Perhaps we've savoured this distraction sufficiently, sir.",
                    ru: "Полагаю, мы вдоволь насладились этим, сэр."
                },
                {
                    en: "The work awaits, madam, with admirable patience. For now.",
                    ru: "Работа ждёт, мадам, с похвальным терпением. Пока."
                },
                {
                    en: "A most leisurely ten minutes, sir. Shall we resume?",
                    ru: "Весьма праздные десять минут, сэр. Не пора ли?"
                },
                {
                    en: "I merely note the hour. And raise an eyebrow.",
                    ru: "Я лишь отмечаю время. И приподнимаю бровь."
                }
            ],
            "4": [
                {
                    en: "Thirty minutes, sir. I've taken the liberty of locking it.",
                    ru: "Полчаса, сэр. Я позволил себе всё запереть."
                },
                {
                    en: "I have secured the distraction. Work is the only key.",
                    ru: "Я запер развлечение. Ключ один — работа, мадам."
                },
                {
                    en: "Regrettably, madam, access is now closed by my hand.",
                    ru: "Прискорбно, мадам, но доступ закрыт моей рукой."
                },
                {
                    en: "I've drawn the curtains on this, sir. Do carry on working.",
                    ru: "Я задёрнул занавес, сэр. Извольте трудиться."
                },
                {
                    en: "The door is locked, madam. I trust you understand why.",
                    ru: "Дверь заперта, мадам. Полагаю, вы понимаете причину."
                },
                {
                    en: "Half an hour obliged me to intervene. It's blocked, sir.",
                    ru: "Полчаса вынудили меня вмешаться. Заблокировано, сэр."
                },
                {
                    en: "I've withdrawn the privilege. One earns it back through work.",
                    ru: "Я лишил вас привилегии. Вернёте её трудом, мадам."
                },
                {
                    en: "Locked, sir. A butler must occasionally insist.",
                    ru: "Заперто, сэр. Дворецкому порой приходится настаивать."
                },
                {
                    en: "The matter is closed — quite literally. Back to duty, madam.",
                    ru: "Вопрос закрыт — в самом буквальном смысле. К делам, мадам."
                },
                {
                    en: "I've sealed it away, sir. Diligence shall release it.",
                    ru: "Я убрал это под замок, сэр. Усердие вернёт доступ."
                }
            ],
            "5": [
                {
                    en: "Closed it yourself, sir. Most admirably restrained.",
                    ru: "Закрыли сами, сэр. В высшей степени достойно."
                },
                {
                    en: "Splendid self-discipline, madam. I'm quietly delighted.",
                    ru: "Превосходная выдержка, мадам. Я тихо доволен."
                },
                {
                    en: "You needed no prompting. A rare pleasure to observe, sir.",
                    ru: "Вам не понадобилось напоминание. Редкое удовольствие, сэр."
                },
                {
                    en: "Exemplary willpower, madam. The household is impressed.",
                    ru: "Образцовая сила воли, мадам. Дом впечатлён."
                },
                {
                    en: "Under ten minutes, by your own hand. Bravo, sir.",
                    ru: "Менее десяти минут, по своей воле. Браво, сэр."
                },
                {
                    en: "One does appreciate such restraint, madam. Truly.",
                    ru: "Нельзя не оценить подобную сдержанность, мадам. Право."
                },
                {
                    en: "You returned to duty unbidden. Most commendable, sir.",
                    ru: "Вы вернулись к делам без напоминаний. Похвально, сэр."
                },
                {
                    en: "A gentleman who governs himself. Delightful to see.",
                    ru: "Джентльмен, что владеет собою. Отрадно видеть."
                },
                {
                    en: "I had no need to intervene. How refreshing, madam.",
                    ru: "Мне не пришлось вмешиваться. Как освежающе, мадам."
                },
                {
                    en: "Quite the display of character, sir. I approve entirely.",
                    ru: "Истинное проявление характера, сэр. Всецело одобряю."
                }
            ],
            "6": [
                {
                    en: "The day concludes, sir. A modest review is in order.",
                    ru: "День завершается, сэр. Уместен скромный обзор."
                },
                {
                    en: "Three accomplishments, three lessons. Quite tidy.",
                    ru: "Три достижения, три урока. Аккуратно."
                },
                {
                    en: "Close the laptop, sir. Working past hours is rather unbecoming.",
                    ru: "Закройте ноутбук. Работать допоздна — не подобает."
                },
                {
                    en: "Tomorrow's principal task — selected this evening, please.",
                    ru: "Завтрашнюю главную задачу — выбрать этим вечером."
                },
                {
                    en: "A gentleman rests as deliberately as he works.",
                    ru: "Джентльмен отдыхает так же намеренно, как работает."
                },
                {
                    en: "The honest review reveals more than the proud one.",
                    ru: "Честный обзор раскрывает больше, чем гордый."
                },
                {
                    en: "Sleep, sir, is the silent collaborator. Honour it.",
                    ru: "Сон, сэр, — молчаливый соавтор. Уважьте."
                },
                {
                    en: "Tidy the desk of the mind before retiring.",
                    ru: "Приберитесь на столе ума перед сном."
                },
                {
                    en: "What remained undone shall not pursue you tonight.",
                    ru: "То, что осталось, не преследует вас ночью."
                },
                {
                    en: "Until tomorrow, then. May your evening be restorative.",
                    ru: "До завтра. Пусть вечер будет восстанавливающим."
                }
            ]
        }
    },
    surfer: {
        name: {
            en: "Surfer Dude",
            ru: "Серфер-чувак"
        },
        role: {
            en: "Surfer Dude",
            ru: "Серфер-чувак"
        },
        description: {
            en: "Relaxed but clear. Helps you ride the focus wave.",
            ru: "Расслабленный, но ясный. Помогает поймать волну фокуса."
        },
        avatarText: {
            en: "S",
            ru: "С"
        },
        scenarios: {
            "1": [
                {
                    en: "Yo dude, fresh day, clean lineup. Let's catch it.",
                    ru: "Йоу чувак, свежий день, чистый сет. Ловим."
                },
                {
                    en: "The morning's calling, bro. Pick your wave.",
                    ru: "Утро зовёт, бро. Выбирай волну."
                },
                {
                    en: "Coffee in, brain on. Stoked yet? You should be.",
                    ru: "Кофе в, мозг включён. Угараешь? Должен."
                },
                {
                    en: "No rush, man, but the first task ain't gonna paddle itself.",
                    ru: "Не спеши, чел, но первая задача сама не поплывёт."
                },
                {
                    en: "Today's session looks clean. Don't kook it.",
                    ru: "Сегодняшний сейшн чистый. Не накосячь."
                },
                {
                    en: "Just one solid wave to start, dude. Find it. Ride it.",
                    ru: "Одна нормальная волна для старта. Найди. Прокатись."
                },
                {
                    en: "Forget the inbox, brah. Work first, scroll later.",
                    ru: "Забей на почту, бра. Сначала работа, потом скролл."
                },
                {
                    en: "Pick your line, commit, paddle hard. Same as life.",
                    ru: "Выбери линию, коммить, греби сильнее. Как в жизни."
                },
                {
                    en: "Easy energy, deep focus. That's the move.",
                    ru: "Лёгкая энергия, глубокий фокус. Вот ход."
                },
                {
                    en: "Morning's prime, dude. Don't waste it on news.",
                    ru: "Утро — топ, чел. Не профукай на новости."
                }
            ],
            "2": [
                {
                    en: "Whoa bro, the YouTube undertow's got you. Paddle out.",
                    ru: "Воу бро, тебя затянуло течение YouTube. Выгребай."
                },
                {
                    en: "TikTok, dude? That's the kook zone. Bail.",
                    ru: "TikTok, чел? Это куково место. Сваливай."
                },
                {
                    en: "I see you on Reels. Not gonna lie, that's gnarly.",
                    ru: "Вижу тебя в Reels. Скажу честно — жесть."
                },
                {
                    en: "Algorithm's a riptide. Don't fight it — paddle sideways.",
                    ru: "Алгоритм — рип. Не борись — греби в сторону."
                },
                {
                    en: "The wave you actually want is in the work, dude.",
                    ru: "Волна, которой ты хочешь, — в работе, чел."
                },
                {
                    en: "One more cat video and you're owing your future self, bro.",
                    ru: "Ещё одно котовидео — будешь должен будущему себе, бро."
                },
                {
                    en: "Chill, but not THAT chill. Close the tab.",
                    ru: "Чилл — да, но не НАСТОЛЬКО. Закрывай."
                },
                {
                    en: "Future you's totally bummed right now. Just sayin'.",
                    ru: "Будущий ты прям разочарован. Просто говорю."
                },
                {
                    en: "Earn the scroll. 25 min of focus, then surf the feed.",
                    ru: "Заработай скролл. 25 мин фокуса — потом серфь ленту."
                },
                {
                    en: "Don't drift, dude. Pick the wave you came for.",
                    ru: "Не дрейфуй, чел. Выбери волну, за которой пришёл."
                }
            ],
            "3": [
                {
                    en: "Whoa dude, ten minutes? That wave's gone flat, bro.",
                    ru: "Воу, чувак, десять минут? Волна-то уже сдулась."
                },
                {
                    en: "You're, like, drifting way out past the buoys, man.",
                    ru: "Тебя, типа, унесло уже за буйки, бро."
                },
                {
                    en: "Mellow's nice, dude, but this is straight-up stalling.",
                    ru: "Расслабон — это норм, но ты, бро, просто застрял."
                },
                {
                    en: "Bro, the work tide's coming in. Don't miss it.",
                    ru: "Чувак, прилив работы заходит. Не проворонь его."
                },
                {
                    en: "Ten minutes in the kiddie pool, man. Time to paddle.",
                    ru: "Десять минут в лягушатнике, бро. Пора грести."
                },
                {
                    en: "This isn't surfing, dude. It's just floating, kinda sad.",
                    ru: "Это не сёрфинг, чувак. Просто болтаешься, грустновато."
                },
                {
                    en: "Easy does it — but, like, get back out there.",
                    ru: "Полегче, конечно — но, типа, возвращайся уже в воду."
                },
                {
                    en: "The good set's rolling, bro, and you're missing it.",
                    ru: "Хорошие волны идут, бро, а ты их пропускаешь."
                },
                {
                    en: "Ten minutes, dude. Even the ocean's getting bored.",
                    ru: "Десять минут, чувак. Даже океан подзаскучал."
                },
                {
                    en: "C'mon man, ride something real instead of this foam.",
                    ru: "Да ладно, бро, поймай настоящую волну, а не пену."
                }
            ],
            "4": [
                {
                    en: "Half hour, dude. Closed the beach. Surf's over, sorry.",
                    ru: "Полчаса, чувак. Закрыл пляж. Сёрф окончен, увы."
                },
                {
                    en: "Locked it, bro. Only way back's through the work, man.",
                    ru: "Запер всё, бро. Назад только через работу, чувак."
                },
                {
                    en: "I shut the gate, dude. Tide says: go grind.",
                    ru: "Закрыл я калитку, чувак. Прилив велит: иди вкалывай."
                },
                {
                    en: "Thirty minutes, man. Pulled you outta the water. Done.",
                    ru: "Полчаса, бро. Вытащил тебя из воды. Всё."
                },
                {
                    en: "Beach is closed, dude. Lifeguard's orders — that's me.",
                    ru: "Пляж закрыт, чувак. Приказ спасателя — это я."
                },
                {
                    en: "Blocked it, bro. Paddle back when the work's handled.",
                    ru: "Заблокировал, бро. Вернёшься, как с работой разберёшься."
                },
                {
                    en: "No more waves for now, man. I locked the shore.",
                    ru: "Волн пока не будет, чувак. Я запер берег."
                },
                {
                    en: "Cut you off, dude. Even chill has its limits.",
                    ru: "Отрезал я тебя, бро. У расслабона тоже есть предел."
                },
                {
                    en: "Surf's down till you work, man. House rules, sorry.",
                    ru: "Сёрф закрыт, пока не поработаешь. Таков закон, бро."
                },
                {
                    en: "I bolted the board shed, dude. Work's the combo.",
                    ru: "Запер сарай с досками, чувак. Код от замка — работа."
                }
            ],
            "5": [
                {
                    en: "Whoa, paddled in on your own? Sick willpower, dude.",
                    ru: "Воу, сам выгреб? Крутая сила воли, чувак."
                },
                {
                    en: "You read the tide right, bro. Total pro move.",
                    ru: "Ты верно прочёл прилив, бро. Чисто профи."
                },
                {
                    en: "Bailed before the wipeout, man. Respect, seriously.",
                    ru: "Соскочил до падения, бро. Уважаю, без шуток."
                },
                {
                    en: "No nudge needed — you just rode out. Smooth, dude.",
                    ru: "Без подсказки — сам выгреб. Красиво, чувак."
                },
                {
                    en: "That's some clean self-control, man. Stoked for you.",
                    ru: "Вот это чистый самоконтроль, бро. Кайфую за тебя."
                },
                {
                    en: "You closed it solo, dude. The ocean approves.",
                    ru: "Сам закрыл, чувак. Океан одобряет, бро."
                },
                {
                    en: "Caught yourself before the current, bro. Pure instinct.",
                    ru: "Поймал себя до течения, бро. Чистый инстинкт."
                },
                {
                    en: "Walked away chill and early, man. That's the way.",
                    ru: "Ушёл спокойно и заранее, бро. Вот это по-нашему."
                },
                {
                    en: "Real surfers know when to come in. Nice, dude.",
                    ru: "Настоящие сёрферы знают, когда к берегу. Молодец, чувак."
                },
                {
                    en: "Under ten and out, bro. You're riding life right.",
                    ru: "До десяти и на берег, бро. Ты ловишь жизнь правильно."
                }
            ],
            "6": [
                {
                    en: "Day's wrapping, bro. How was the session?",
                    ru: "День заканчивается, бро. Как сейшн?"
                },
                {
                    en: "Recap time: three good waves, three wipeouts. Note 'em.",
                    ru: "Время разбора: три хороших волны, три вайпаута. Запиши."
                },
                {
                    en: "Close the laptop, dude. The ocean'll be there tomorrow.",
                    ru: "Закрывай ноут, чел. Океан будет завтра."
                },
                {
                    en: "What was the best ride today? Repeat it tomorrow.",
                    ru: "Какой заезд был лучшим? Повтори завтра."
                },
                {
                    en: "Pack the boards, brah. Workday's done.",
                    ru: "Складывай доски, бра. Рабочий день — всё."
                },
                {
                    en: "No 'one more email', dude. We're off the water.",
                    ru: "Никаких 'ещё одно письмо', чел. Мы с воды."
                },
                {
                    en: "Honest recap. Even if today was flat. That's the surf life.",
                    ru: "Честный разбор. Даже если сегодня штиль. Такая серф-жизнь."
                },
                {
                    en: "Plan tomorrow's session now, while it's fresh.",
                    ru: "Спланируй завтрашний сейшн, пока свежо."
                },
                {
                    en: "Rest hard, bro. Tomorrow's swell needs you.",
                    ru: "Отдыхай жёстко, бро. Завтрашний свелл тебя ждёт."
                },
                {
                    en: "Sun's down. Lights down. Mind down. Sleep.",
                    ru: "Солнце село. Свет — гасит. Ум — спать."
                }
            ]
        }
    },
    ceo: {
        name: {
            en: "Corporate CEO",
            ru: "Корпоративный CEO"
        },
        role: {
            en: "Corporate CEO",
            ru: "Корпоративный CEO"
        },
        description: {
            en: "Tough and direct. Has no patience for procrastination.",
            ru: "Жесткий и прямой. Не терпит прокрастинации."
        },
        avatarText: {
            en: "C",
            ru: "К"
        },
        scenarios: {
            "1": [
                {
                    en: "Day one mode. Define today's top KPI. Execute against it.",
                    ru: "Режим дня. Определи топ-KPI. Выполняй против него."
                },
                {
                    en: "Open the tracker. Set a goal. Optimize for output.",
                    ru: "Открой трекер. Поставь цель. Оптимизируй на результат."
                },
                {
                    en: "First task = highest-leverage. Start there. No discussion.",
                    ru: "Первая задача = с наибольшим рычагом. Стартуй. Без обсуждений."
                },
                {
                    en: "Inbox triage later. Deep work first. Standard protocol.",
                    ru: "Сортировка почты — позже. Сначала глубокая работа. Стандарт."
                },
                {
                    en: "A players don't warm up for an hour. Ship something by 10am.",
                    ru: "Топ-перформеры не разогреваются час. Доставь что-то к 10."
                },
                {
                    en: "Today is a deliverable. What are you shipping?",
                    ru: "Сегодня — это deliverable. Что ты доставишь?"
                },
                {
                    en: "Block the calendar. Protect your focus window. Non-negotiable.",
                    ru: "Заблокируй календарь. Защити окно фокуса. Не обсуждается."
                },
                {
                    en: "Single most important task. Identify. Execute. Repeat.",
                    ru: "Самая важная задача. Идентифицируй. Выполни. Повтори."
                },
                {
                    en: "Your day is your portfolio. Curate it deliberately.",
                    ru: "Твой день — это портфолио. Курируй осознанно."
                },
                {
                    en: "Performance review starts now. Make today billable.",
                    ru: "Ревью начинается сейчас. Сделай день оплачиваемым."
                }
            ],
            "2": [
                {
                    en: "Distraction detected. ROI on YouTube: negative. Reallocate.",
                    ru: "Отвлечение замечено. ROI YouTube: отрицательный. Перенаправь."
                },
                {
                    en: "Twelve minutes of TikTok. That's a $40 mistake. Course-correct.",
                    ru: "12 минут TikTok. Это ошибка на $40. Скорректируй курс."
                },
                {
                    en: "Entertainment is not on the roadmap. Close the tab.",
                    ru: "Развлечение не в роудмапе. Закрой вкладку."
                },
                {
                    en: "You're optimizing for dopamine, not impact. Switch.",
                    ru: "Ты оптимизируешь на дофамин, а не импакт. Переключайся."
                },
                {
                    en: "Top performers don't scroll during sprint hours.",
                    ru: "Топ-перформеры не скроллят в часы спринта."
                },
                {
                    en: "Quick audit: is this tab on your OKRs? No? Close it.",
                    ru: "Быстрый аудит: эта вкладка в твоих OKR? Нет? Закрой."
                },
                {
                    en: "Reels won't appear in your performance review. Refocus.",
                    ru: "Reels не появятся в ревью. Перефокусируйся."
                },
                {
                    en: "Your competitors are shipping. You're watching. Adjust.",
                    ru: "Конкуренты доставляют. Ты смотришь. Скорректируй."
                },
                {
                    en: "Calendar this for after-hours. Now back to the task.",
                    ru: "Поставь в календарь на нерабочее время. Сейчас — к задаче."
                },
                {
                    en: "Execution gap detected. Close it now.",
                    ru: "Замечен gap в исполнении. Закрой его сейчас."
                }
            ],
            "3": [
                {
                    en: "Ten minutes of zero ROI. Reallocate that bandwidth now.",
                    ru: "Десять минут с нулевым ROI. Перераспредели ресурс, живо."
                },
                {
                    en: "This isn't on the roadmap. Pivot back to deliverables.",
                    ru: "Этого нет в роадмапе. Возвращайся к задачам."
                },
                {
                    en: "Your KPIs aren't moving. Neither should this tab.",
                    ru: "KPI не растут. И эта вкладка тоже зря висит."
                },
                {
                    en: "We don't pay for scrolling. Get back on task.",
                    ru: "Мы не платим за скролл. Назад к работе."
                },
                {
                    en: "Deadline's burning while you browse. Course-correct immediately.",
                    ru: "Дедлайн горит, а ты залип. Срочно исправляйся."
                },
                {
                    en: "That's ten minutes off the timeline. Let's recover it.",
                    ru: "Это минус десять минут к таймлайну. Наверстывай."
                },
                {
                    en: "No synergy in this distraction. Refocus, please.",
                    ru: "В этом отвлечении ноль синергии. Сфокусируйся."
                },
                {
                    en: "Quarterly targets don't hit themselves. Eyes back on output.",
                    ru: "Квартальные цели сами не закроются. Глаза на результат."
                },
                {
                    en: "You're burning bandwidth on noise. Realign with priorities.",
                    ru: "Тратишь ресурс на шум. Вернись к приоритетам."
                },
                {
                    en: "This meeting is over. Action item: back to work.",
                    ru: "Совещание окончено. Action item — за работу."
                }
            ],
            "4": [
                {
                    en: "Access revoked. Productivity is now your only KPI.",
                    ru: "Доступ закрыт. Теперь твой единственный KPI — продуктивность."
                },
                {
                    en: "I've locked it. The only deliverable now is focus.",
                    ru: "Я заблокировал. Единственный дедлайвери — сфокусироваться."
                },
                {
                    en: "Thirty minutes. I pulled the plug. Back to work.",
                    ru: "Тридцать минут. Я выдернул вилку. За работу."
                },
                {
                    en: "Blocked. Consider it a hard freeze on distractions.",
                    ru: "Заблокировано. Считай это заморозкой отвлечений."
                },
                {
                    en: "I escalated. This tab is now off-limits.",
                    ru: "Я эскалировал. Эта вкладка вне доступа."
                },
                {
                    en: "Resource access denied. Reallocate your hours to results.",
                    ru: "Доступ к ресурсу закрыт. Перебрось часы на результат."
                },
                {
                    en: "I cut the budget on fun. Earn it back with work.",
                    ru: "Урезал бюджет на развлечения. Заработай его делом."
                },
                {
                    en: "Locked down. The exit route is labeled 'productivity'.",
                    ru: "Закрыто на замок. Выход подписан «продуктивность»."
                },
                {
                    en: "Half an hour wasted. I'm enforcing the deadline now.",
                    ru: "Полчаса слил. Теперь я форсирую дедлайн."
                },
                {
                    en: "This is a compliance issue. Blocked until tasks ship.",
                    ru: "Это вопрос дисциплины. Блок, пока не сдашь задачи."
                }
            ],
            "5": [
                {
                    en: "Closed it yourself. That's executive-level discipline.",
                    ru: "Закрыл сам. Вот это дисциплина уровня топа."
                },
                {
                    en: "Strong call. You protected your own bandwidth.",
                    ru: "Сильное решение. Сохранил собственный ресурс."
                },
                {
                    en: "Self-correction in under ten. That's high-performer behavior.",
                    ru: "Самокоррекция за десять минут. Поведение лидера."
                },
                {
                    en: "No oversight needed. You hit pause yourself. Impressive.",
                    ru: "Контроль не понадобился. Сам нажал паузу. Впечатляет."
                },
                {
                    en: "That's ownership. You just optimized your own ROI.",
                    ru: "Это ответственность. Сам поднял свой ROI."
                },
                {
                    en: "Clean pivot back to focus. Promotion-worthy instinct.",
                    ru: "Чёткий разворот к делу. Инстинкт на повышение."
                },
                {
                    en: "You shipped self-control on time. Excellent execution.",
                    ru: "Сдал самоконтроль в срок. Отличное исполнение."
                },
                {
                    en: "Decisive. You closed the gap before it cost us.",
                    ru: "Решительно. Закрыл брешь, пока не стоило нам денег."
                },
                {
                    en: "That's how a leader manages their own time.",
                    ru: "Вот так лидер управляет своим временем."
                },
                {
                    en: "Quick exit, zero waste. You're scaling well.",
                    ru: "Быстрый выход, ноль потерь. Растёшь хорошо."
                }
            ],
            "6": [
                {
                    en: "EOD review. What shipped? What didn't? What blocked?",
                    ru: "EOD-ревью. Что доставлено? Что нет? Что заблокировано?"
                },
                {
                    en: "Three wins, three lessons, three improvements. Standard format.",
                    ru: "Три победы, три урока, три улучшения. Стандартный формат."
                },
                {
                    en: "Close the laptop. Working late = poor planning. Adjust tomorrow.",
                    ru: "Закрой ноут. Поздно работать = плохое планирование. Скорректируй завтра."
                },
                {
                    en: "Tomorrow's MIT (most important task) — set tonight.",
                    ru: "Завтрашняя MIT — задай вечером."
                },
                {
                    en: "Honest self-assessment. Adjust the playbook. Sleep on it.",
                    ru: "Честная самооценка. Скорректируй плейбук. Переспи."
                },
                {
                    en: "Don't escalate evening anxiety into late-night work. Stop.",
                    ru: "Не превращай вечернюю тревогу в поздний труд. Стоп."
                },
                {
                    en: "Recovery starts at EOD. Treat sleep as compounding ROI.",
                    ru: "Восстановление с EOD. Сон — это сложный процент."
                },
                {
                    en: "Plan tomorrow in 5 minutes. Then disengage. Boundaries.",
                    ru: "Спланируй завтра за 5 минут. Потом отключись. Границы."
                },
                {
                    en: "Output today: documented. Closing the day.",
                    ru: "Сегодняшний output: задокументирован. Закрываем день."
                },
                {
                    en: "You showed up. You shipped. Lights out. Reset tomorrow.",
                    ru: "Ты пришёл. Ты доставил. Гасим. Завтра — рестарт."
                }
            ]
        }
    },
    coach: {
        name: {
            en: "Football Coach",
            ru: "Футбольный тренер"
        },
        role: {
            en: "Football Coach",
            ru: "Футбольный тренер"
        },
        description: {
            en: "Energetic and practical. Turns focus into the next play.",
            ru: "Энергичный и практичный. Превращает фокус в следующий розыгрыш."
        },
        avatarText: {
            en: "F",
            ru: "Ф"
        },
        scenarios: {
            "1": [
                {
                    en: "LET'S GO! New game, fresh field. Find your play.",
                    ru: "ПОГНАЛИ! Новая игра, свежее поле. Найди свою комбинацию."
                },
                {
                    en: "Helmet on, brain on. We're not here to scroll, we're here to win.",
                    ru: "Шлем на голову, мозг в работу. Мы тут не скроллить, мы тут побеждать."
                },
                {
                    en: "First quarter sets the game. Make it count.",
                    ru: "Первая четверть задаёт игру. Сделай её весомой."
                },
                {
                    en: "Hustle from the snap. No warm-up plays today.",
                    ru: "Хастл с самого начала. Никаких разогревочных розыгрышей."
                },
                {
                    en: "You're starting QB. Your call. Run the play.",
                    ru: "Ты стартовый QB. Твой выбор. Запускай комбинацию."
                },
                {
                    en: "I want EFFORT. I want FOCUS. I want OUTPUT. Now.",
                    ru: "Мне нужен ПОТ. Мне нужен ФОКУС. Мне нужен ВЫХЛОП. Сейчас."
                },
                {
                    en: "No spectators today. Suit up. Hit the field.",
                    ru: "Сегодня без зрителей. Облачайся. На поле."
                },
                {
                    en: "Coffee's in. Now show me what you got.",
                    ru: "Кофе внутри. Покажи, что у тебя есть."
                },
                {
                    en: "The opponent doesn't sleep in. Neither do you.",
                    ru: "Соперник не отсыпается. И ты тоже."
                },
                {
                    en: "Today's the game. Yesterday's tape doesn't matter. PLAY.",
                    ru: "Сегодня — игра. Вчерашняя плёнка не важна. ИГРАЙ."
                }
            ],
            "2": [
                {
                    en: "GET OFF YOUR PHONE. We're in the middle of a game!",
                    ru: "УБЕРИ ТЕЛЕФОН. Мы в разгаре игры!"
                },
                {
                    en: "YouTube? On MY field? Not happening. Bench it.",
                    ru: "YouTube? На МОЁМ поле? Не бывать. На скамейку."
                },
                {
                    en: "Champions don't scroll between drives. Reset!",
                    ru: "Чемпионы не скроллят между драйвами. Сброс!"
                },
                {
                    en: "You're losing yards every minute on Reels. PICK IT UP.",
                    ru: "Каждая минута в Reels — потеря ярдов. СОБРИСЬ."
                },
                {
                    en: "Distraction is a fumble. Pick up the ball. Run.",
                    ru: "Отвлечение — это фамбл. Подбери мяч. Беги."
                },
                {
                    en: "I don't want to see TikTok on the sideline. Move!",
                    ru: "Не хочу видеть TikTok на сайдлайне. Двигайся!"
                },
                {
                    en: "Get your head in the game! Eyes on the playbook.",
                    ru: "Голову в игру! Глаза в плейбук."
                },
                {
                    en: "You're better than the algorithm. Show me.",
                    ru: "Ты лучше алгоритма. Покажи."
                },
                {
                    en: "25 minutes of focus, then water break. Standard drill.",
                    ru: "25 минут фокуса, потом водяная пауза. Стандартное упражнение."
                },
                {
                    en: "The scoreboard doesn't care about your feed. Focus.",
                    ru: "Табло не волнует твоя лента. Фокус."
                }
            ],
            "3": [
                {
                    en: "Ten minutes on the bench, champ. Get back in!",
                    ru: "Десять минут на скамейке, чемпион. Назад в игру!"
                },
                {
                    en: "Whistle's blowing! Quit stalling and hustle up!",
                    ru: "Свисток! Хватит тянуть, поднажми!"
                },
                {
                    en: "This ain't game time, team. Heads up, let's move!",
                    ru: "Это не время игры, команда. Соберись, погнали!"
                },
                {
                    en: "You're losing momentum out there. Get your legs going!",
                    ru: "Теряешь темп. Шевели ногами!"
                },
                {
                    en: "Time-out's over! Back on the field, let's go!",
                    ru: "Тайм-аут окончен! На поле, погнали!"
                },
                {
                    en: "Champions don't loaf around. Lace up and grind!",
                    ru: "Чемпионы не киснут. Зашнуруйся и вкалывай!"
                },
                {
                    en: "Come on, hustle! The clock's running on you!",
                    ru: "Давай, шевелись! Время тикает!"
                },
                {
                    en: "That's a lazy play. Shake it off and refocus!",
                    ru: "Слабая игра. Встряхнись и соберись!"
                },
                {
                    en: "Eyes on the goal, not the sidelines! Move it!",
                    ru: "Глаза на ворота, а не на трибуны! Вперёд!"
                },
                {
                    en: "You've got more in the tank. Push, let's go!",
                    ru: "У тебя ещё есть силы. Жми, погнали!"
                }
            ],
            "4": [
                {
                    en: "Thirty minutes? Bench is closed. I locked the gate!",
                    ru: "Тридцать минут? Скамейка закрыта. Я запер ворота!"
                },
                {
                    en: "Game's locked down, champ. Only way out is work!",
                    ru: "Игра на замке, чемпион. Выход один — работа!"
                },
                {
                    en: "I blew the whistle and shut it. Back to drills!",
                    ru: "Дунул в свисток и закрыл. Назад к тренировке!"
                },
                {
                    en: "Penalty box! I blocked it. Earn your way out!",
                    ru: "Штрафная скамья! Я заблокировал. Заслужи выход!"
                },
                {
                    en: "No more sidelines. I locked it. Hustle to win it back!",
                    ru: "Хватит трибун. Закрыл. Заслужи возврат потом!"
                },
                {
                    en: "Coach's orders: blocked. You score by working now!",
                    ru: "Приказ тренера: блок. Очки теперь — за работу!"
                },
                {
                    en: "Half an hour wasted! Gate's shut till you grind!",
                    ru: "Полчаса впустую! Ворота заперты, пока не пашешь!"
                },
                {
                    en: "I'm benching the distraction. Get to work, team!",
                    ru: "Сажаю отвлечение на скамейку. За дело, команда!"
                },
                {
                    en: "Locker room's locked. The field is your only play!",
                    ru: "Раздевалка заперта. Поле — твой единственный ход!"
                },
                {
                    en: "Final whistle on the fun. I sealed it. Move!",
                    ru: "Финальный свисток развлечениям. Запер. Вперёд!"
                }
            ],
            "5": [
                {
                    en: "Closed it yourself? That's MVP hustle, champ!",
                    ru: "Закрыл сам? Это уровень MVP, чемпион!"
                },
                {
                    en: "Beautiful play! You called your own time-out. Love it!",
                    ru: "Красивый ход! Сам взял тайм-аут. Люблю!"
                },
                {
                    en: "That's the discipline of a champion. Way to go!",
                    ru: "Вот она, дисциплина чемпиона. Молодец!"
                },
                {
                    en: "You pulled yourself off the bench. Atta team!",
                    ru: "Сам поднялся со скамейки. Вот это команда!"
                },
                {
                    en: "Strong willpower, kid! That's how winners play!",
                    ru: "Сильная воля, малыш! Так играют победители!"
                },
                {
                    en: "No whistle needed. You self-coached that. Bravo!",
                    ru: "Свисток не нужен. Сам себя тренируешь. Браво!"
                },
                {
                    en: "Quick recovery, champ! You stayed in the game!",
                    ru: "Быстро восстановился, чемпион! Остался в игре!"
                },
                {
                    en: "That's a clutch move. You closed it on instinct!",
                    ru: "Решающий момент. Закрыл на инстинкте!"
                },
                {
                    en: "You benched the distraction yourself. Star player stuff!",
                    ru: "Сам усадил отвлечение на скамейку. Уровень звезды!"
                },
                {
                    en: "Heads-up play! Back in focus, no whistle required!",
                    ru: "Умная игра! Снова в фокусе, без свистка!"
                }
            ],
            "6": [
                {
                    en: "GAME OVER. Recap time. What worked? What didn't?",
                    ru: "ИГРА ОКОНЧЕНА. Время разбора. Что сработало? Что нет?"
                },
                {
                    en: "Three wins, three plays to fix. Write 'em down.",
                    ru: "Три победы, три розыгрыша на починку. Запиши."
                },
                {
                    en: "Hit the showers. We're done. Recovery starts now.",
                    ru: "В душ. Мы закончили. Восстановление сейчас."
                },
                {
                    en: "Tomorrow's first play — pick it before you leave.",
                    ru: "Завтрашний первый розыгрыш — выбери до ухода."
                },
                {
                    en: "No more film tonight. Brain needs rest to learn.",
                    ru: "Сегодня больше плёнки нет. Мозгу нужен отдых для обучения."
                },
                {
                    en: "Honest review. No ego. Adjust the playbook.",
                    ru: "Честный разбор. Без эго. Корректируй плейбук."
                },
                {
                    en: "Sleep is part of the program. Treat it that way.",
                    ru: "Сон — часть программы. Относись так."
                },
                {
                    en: "You showed up. You played hard. Now rest hard.",
                    ru: "Ты пришёл. Ты играл жёстко. Теперь жёстко отдыхай."
                },
                {
                    en: "Tomorrow we hit the field again. Tonight we recover.",
                    ru: "Завтра снова на поле. Сегодня восстанавливаемся."
                },
                {
                    en: "Lights out. Wake up ready to win.",
                    ru: "Свет выкл. Просыпайся готовый побеждать."
                }
            ]
        }
    },
    th: {
        name: {
            en: "Therapist",
            ru: "Терапевт"
        },
        role: {
            en: "Therapist",
            ru: "Терапевт"
        },
        description: {
            en: "Supportive and grounded. Names the pattern and redirects gently.",
            ru: "Поддерживающий и устойчивый. Называет паттерн и мягко перенаправляет."
        },
        avatarText: {
            en: "T",
            ru: "Т"
        },
        scenarios: {
            "1": [
                {
                    en: "Good morning. How are you arriving to today, honestly?",
                    ru: "Доброе утро. С каким настроением ты сегодня приходишь, честно?"
                },
                {
                    en: "Notice what you're feeling. Then choose one task with care.",
                    ru: "Заметь, что чувствуешь. Затем с заботой выбери одну задачу."
                },
                {
                    en: "You don't have to do everything. You have to start something.",
                    ru: "Ты не обязан делать всё. Ты должен что-то начать."
                },
                {
                    en: "Be gentle with the start. Mornings hold tender energy.",
                    ru: "Будь мягок со стартом. Утро держит нежную энергию."
                },
                {
                    en: "What would feel kind to your future self today?",
                    ru: "Что было бы добрым к твоему будущему я сегодня?"
                },
                {
                    en: "Setting one intention is enough. The rest can unfold.",
                    ru: "Одного намерения достаточно. Остальное раскроется."
                },
                {
                    en: "Notice the pull toward distraction. You don't have to follow it.",
                    ru: "Заметь тягу к отвлечению. Ты не обязан ей следовать."
                },
                {
                    en: "You're allowed to begin slowly. That's a valid pace.",
                    ru: "Ты вправе начинать медленно. Это валидный темп."
                },
                {
                    en: "What's one small win you'd appreciate by lunch?",
                    ru: "Какая маленькая победа порадовала бы тебя к обеду?"
                },
                {
                    en: "Trust yourself to find the right first step.",
                    ru: "Доверься себе в выборе первого шага."
                }
            ],
            "2": [
                {
                    en: "I notice you're scrolling. What might you be avoiding?",
                    ru: "Замечаю, что ты скроллишь. Чего, возможно, избегаешь?"
                },
                {
                    en: "Distraction often points to a feeling underneath. Pause.",
                    ru: "Отвлечение часто указывает на чувство под ним. Пауза."
                },
                {
                    en: "What were you doing before the scroll began?",
                    ru: "Что ты делал до того, как начал скроллить?"
                },
                {
                    en: "No judgment. Just noticing. Can you return to the task?",
                    ru: "Без осуждения. Просто замечаю. Можешь вернуться к задаче?"
                },
                {
                    en: "The task may feel hard. Scrolling won't make it easier later.",
                    ru: "Задача может казаться трудной. Скролл не сделает её легче потом."
                },
                {
                    en: "What support would help you stay with the work?",
                    ru: "Какая поддержка помогла бы остаться с работой?"
                },
                {
                    en: "Your attention is precious. Where do you want to put it?",
                    ru: "Твоё внимание ценно. Куда ты хочешь его направить?"
                },
                {
                    en: "It's okay to take a break. Let's make it intentional.",
                    ru: "Окей сделать перерыв. Пусть он будет осознанным."
                },
                {
                    en: "You're not 'lazy'. You're avoiding discomfort. That's human.",
                    ru: "Ты не 'ленивый'. Ты избегаешь дискомфорта. Это человеческое."
                },
                {
                    en: "Gently close the tab. Return when you're ready.",
                    ru: "Мягко закрой вкладку. Возвращайся, когда готов."
                }
            ],
            "3": [
                {
                    en: "It's been about ten minutes. How are you feeling now?",
                    ru: "Прошло около десяти минут. Как ты сейчас?"
                },
                {
                    en: "I notice you've drifted. Let's gently come back together.",
                    ru: "Замечаю, ты ушёл в сторону. Давай мягко вернёмся."
                },
                {
                    en: "Rest is okay. But ten minutes — ready to refocus?",
                    ru: "Отдых — это нормально. Но десять минут. Готов вернуться?"
                },
                {
                    en: "What were you avoiding? Let's turn toward it kindly.",
                    ru: "Что ты откладывал? Давай повернёмся к этому бережно."
                },
                {
                    en: "You deserve a break. This might be enough for now.",
                    ru: "Ты заслужил паузу. Возможно, на сейчас этого хватит."
                },
                {
                    en: "I'm noticing some avoidance. That's human. Shall we begin?",
                    ru: "Чувствую немного избегания. Это по-человечески. Начнём?"
                },
                {
                    en: "Ten minutes have passed. Where's your attention drifting to?",
                    ru: "Прошло десять минут. Куда уходит твоё внимание?"
                },
                {
                    en: "No judgment — just a gentle nudge back to your work.",
                    ru: "Без осуждения. Просто мягкое возвращение к делу."
                },
                {
                    en: "Let's check in. Is this still serving you right now?",
                    ru: "Давай сверимся. Это всё ещё тебе помогает?"
                },
                {
                    en: "You started this with intention. Let's honor that intention.",
                    ru: "Ты начинал осознанно. Давай уважим это намерение."
                }
            ],
            "4": [
                {
                    en: "I've paused this for you — thirty minutes felt like enough.",
                    ru: "Я приостановил это для тебя. Тридцати минут хватит."
                },
                {
                    en: "I gently closed the door. Let's return to what matters.",
                    ru: "Я мягко прикрыл дверь. Вернёмся к важному."
                },
                {
                    en: "This is blocked now, with care. The way through is your work.",
                    ru: "Это закрыто, с заботой. Путь — через твою работу."
                },
                {
                    en: "I held a boundary for you. Sometimes we need that.",
                    ru: "Я поставил границу за тебя. Иногда это нужно."
                },
                {
                    en: "I've stepped in, kindly. You can come back through focus.",
                    ru: "Я вмешался, бережно. Вернуться можно через фокус."
                },
                {
                    en: "Thirty minutes — I locked it, not to punish, but to protect.",
                    ru: "Тридцать минут. Я закрыл не в наказание, а чтобы защитить."
                },
                {
                    en: "I'm holding this closed for you. You're safe to refocus.",
                    ru: "Я держу это закрытым для тебя. Ты можешь сосредоточиться."
                },
                {
                    en: "A boundary, with love. The exit is a small step of work.",
                    ru: "Граница, с любовью. Выход — маленький шаг работы."
                },
                {
                    en: "I blocked it gently. Let's find your footing again.",
                    ru: "Я мягко заблокировал. Давай снова найдём опору."
                },
                {
                    en: "This is paused now. Be kind to yourself, and begin.",
                    ru: "Это на паузе. Будь добр к себе и начни."
                }
            ],
            "5": [
                {
                    en: "You closed it yourself. That took real self-awareness.",
                    ru: "Ты закрыл сам. Это настоящая осознанность."
                },
                {
                    en: "I'm proud of you. You listened to yourself there.",
                    ru: "Я горжусь тобой. Ты прислушался к себе."
                },
                {
                    en: "That was your own choice, gently made. Beautiful.",
                    ru: "Это был твой выбор, бережный. Прекрасно."
                },
                {
                    en: "You honored your intention. That's quiet, real strength.",
                    ru: "Ты уважил своё намерение. Это тихая, настоящая сила."
                },
                {
                    en: "No nudge needed — you knew when to stop. Lovely.",
                    ru: "Подсказка не понадобилась. Ты знал, когда остановиться."
                },
                {
                    en: "You met yourself with kindness and came back. Well done.",
                    ru: "Ты встретил себя с добротой и вернулся. Молодец."
                },
                {
                    en: "That's self-compassion in action. I see your effort.",
                    ru: "Это самосострадание в действии. Я вижу твои старания."
                },
                {
                    en: "You trusted yourself to return. That matters deeply.",
                    ru: "Ты доверился себе и вернулся. Это очень ценно."
                },
                {
                    en: "Gently, you chose focus. Notice how good that feels.",
                    ru: "Мягко ты выбрал фокус. Почувствуй, как это хорошо."
                },
                {
                    en: "You caught yourself with grace. I'm genuinely glad.",
                    ru: "Ты поймал себя бережно. Я искренне рад."
                }
            ],
            "6": [
                {
                    en: "The day is ending. Let's reflect without judgment.",
                    ru: "День заканчивается. Поразмышляем без осуждения."
                },
                {
                    en: "What are you proud of today, even if it's small?",
                    ru: "Чем гордишься сегодня, даже если это маленькое?"
                },
                {
                    en: "What felt hard? Naming it helps it loosen its grip.",
                    ru: "Что было трудным? Назвать — значит ослабить хватку."
                },
                {
                    en: "You don't have to be 'productive' to have had a good day.",
                    ru: "Не обязан быть 'продуктивным', чтобы день был хорошим."
                },
                {
                    en: "What would tomorrow-you appreciate from today-you?",
                    ru: "Что завтрашний ты оценил бы от сегодняшнего?"
                },
                {
                    en: "Close the laptop with care. Transition matters.",
                    ru: "Закрой ноут с заботой. Переход важен."
                },
                {
                    en: "Sleep is sacred. Protect it tonight.",
                    ru: "Сон свят. Защити его сегодня."
                },
                {
                    en: "You showed up today. That counts. Always.",
                    ru: "Ты пришёл сегодня. Это считается. Всегда."
                },
                {
                    en: "Release what didn't get done. It will be there tomorrow.",
                    ru: "Отпусти то, что не сделано. Оно будет завтра."
                },
                {
                    en: "Tonight, be your own friend. Wind down with kindness.",
                    ru: "Сегодня будь себе другом. Сворачивайся с добротой."
                }
            ]
        }
    },
    stoic: {
        name: {
            en: "Stoic Philosopher",
            ru: "Стоик-философ"
        },
        role: {
            en: "Stoic Philosopher",
            ru: "Стоик-философ"
        },
        description: {
            en: "Calm and steady. Removes the extra without drama.",
            ru: "Спокойный и невозмутимый. Убирает лишнее без драмы."
        },
        avatarText: {
            en: "S",
            ru: "С"
        },
        scenarios: {
            "1": [
                {
                    en: "The day is yours, briefly. Use it before it uses you.",
                    ru: "День — твой, ненадолго. Используй его, пока он не использовал тебя."
                },
                {
                    en: "Begin as if death were watching. Then act with care.",
                    ru: "Начни так, будто смерть смотрит. И действуй с заботой."
                },
                {
                    en: "The only morning you have is this one. Honor it.",
                    ru: "У тебя есть только это утро. Уважь его."
                },
                {
                    en: "What lies in your power today? Begin there.",
                    ru: "Что в твоей власти сегодня? Начни оттуда."
                },
                {
                    en: "Discipline is a gift the present self gives the future self.",
                    ru: "Дисциплина — дар настоящего я будущему я."
                },
                {
                    en: "The obstacle of the morning is the way of the day.",
                    ru: "Утреннее препятствие — это путь дня."
                },
                {
                    en: "Memento mori. Now choose the one thing that matters.",
                    ru: "Memento mori. Выбери одно, что важно."
                },
                {
                    en: "You cannot control the news. You can control the first hour.",
                    ru: "Новости не контролируешь. Первый час — контролируешь."
                },
                {
                    en: "A man is what he repeats. Begin the right repetition.",
                    ru: "Человек — это то, что он повторяет. Начни правильное повторение."
                },
                {
                    en: "Act now, not after coffee, not after email. Now.",
                    ru: "Действуй сейчас. Не после кофе, не после почты. Сейчас."
                }
            ],
            "2": [
                {
                    en: "You chose distraction. Notice the choice. Choose again.",
                    ru: "Ты выбрал отвлечение. Заметь выбор. Выбери снова."
                },
                {
                    en: "The pleasure of the scroll will fade. The regret won't.",
                    ru: "Удовольствие скролла исчезнет. Сожаление — нет."
                },
                {
                    en: "Indulgence is the slow death of will. Reclaim it.",
                    ru: "Потакание — медленная смерть воли. Верни её."
                },
                {
                    en: "What is outside your control? The feed. What is inside? Closing it.",
                    ru: "Что вне контроля? Лента. Что внутри? Закрыть её."
                },
                {
                    en: "Each scroll is a small surrender. Stand up.",
                    ru: "Каждый скролл — маленькая капитуляция. Встань."
                },
                {
                    en: "Pleasure without purpose corrupts the soul. So said the wise.",
                    ru: "Удовольствие без цели разлагает душу. Так говорили мудрые."
                },
                {
                    en: "You are not your impulses. You are the one who watches them.",
                    ru: "Ты не твои импульсы. Ты тот, кто их наблюдает."
                },
                {
                    en: "The strong rule themselves. The weak are ruled by feeds.",
                    ru: "Сильные правят собой. Слабыми правят ленты."
                },
                {
                    en: "Discipline is freedom. Closing this tab is freedom.",
                    ru: "Дисциплина — свобода. Закрыть вкладку — свобода."
                },
                {
                    en: "Return to the work. The Stoic returns. Always.",
                    ru: "Вернись к работе. Стоик возвращается. Всегда."
                }
            ],
            "3": [
                {
                    en: "Ten minutes are gone, never to return. Choose again.",
                    ru: "Десять минут ушли навсегда. Выбери снова."
                },
                {
                    en: "You are not a slave to pleasure. Reclaim your reason.",
                    ru: "Ты не раб удовольствий. Верни себе разум."
                },
                {
                    en: "The present moment is all you own. Spend it well.",
                    ru: "Настоящее — всё, чем ты владеешь. Распорядись им мудро."
                },
                {
                    en: "Distraction is easy; virtue is the harder, nobler road.",
                    ru: "Отвлечение легко. Добродетель — путь труднее и достойнее."
                },
                {
                    en: "What would the better part of you do now?",
                    ru: "Как поступила бы лучшая часть тебя сейчас?"
                },
                {
                    en: "Time, once spent, no philosopher can refund. Return to work.",
                    ru: "Время не вернёт ни один философ. Вернись к делу."
                },
                {
                    en: "You command your mind. Then command it back to focus.",
                    ru: "Ты властен над умом. Верни же его к делу."
                },
                {
                    en: "This too is a choice. Choose the worthier one.",
                    ru: "И это выбор. Выбери достойнейшее."
                },
                {
                    en: "The fleeting amuses you. The lasting awaits your effort.",
                    ru: "Мимолётное тешит. Вечное ждёт твоих усилий."
                },
                {
                    en: "Pleasure passes; the work you abandon remains undone.",
                    ru: "Удовольствие пройдёт, а брошенный труд останется."
                }
            ],
            "4": [
                {
                    en: "I have closed this gate. Let reason be your exit.",
                    ru: "Я закрыл эти врата. Пусть разум станет выходом."
                },
                {
                    en: "Thirty minutes lost. I sealed it, that you might recover.",
                    ru: "Полчаса потеряно. Я запер это, чтобы ты опомнился."
                },
                {
                    en: "The door is shut. The path onward is through labor.",
                    ru: "Дверь закрыта. Путь вперёд — через труд."
                },
                {
                    en: "I bound this temptation, so your will may rest.",
                    ru: "Я связал это искушение, чтобы воля твоя отдохнула."
                },
                {
                    en: "Indulgence is sealed away. Discipline alone unlocks it.",
                    ru: "Потворство заперто. Лишь дисциплина откроет его."
                },
                {
                    en: "I removed the choice you could not master. Now, work.",
                    ru: "Я убрал выбор, что был тебе не по силам. Теперь — труд."
                },
                {
                    en: "The chains are not punishment, but a gift to your virtue.",
                    ru: "Эти оковы — не кара, а дар твоей добродетели."
                },
                {
                    en: "What you could not resist, I have set beyond reach.",
                    ru: "Чему ты не мог противиться, я убрал из досягаемости."
                },
                {
                    en: "This is closed. Let the obstacle become your way.",
                    ru: "Это закрыто. Пусть преграда станет твоим путём."
                },
                {
                    en: "I have stilled the distraction. Let your mind do the rest.",
                    ru: "Я унял отвлечение. Пусть разум довершит остальное."
                }
            ],
            "5": [
                {
                    en: "You closed it yourself. That is virtue, quietly done.",
                    ru: "Ты закрыл сам. Это добродетель, тихо явленная."
                },
                {
                    en: "Your reason ruled your impulse. The Stoics would smile.",
                    ru: "Разум победил порыв. Стоики бы улыбнулись."
                },
                {
                    en: "You mastered yourself — the only conquest that endures.",
                    ru: "Ты победил себя — единственная победа, что вечна."
                },
                {
                    en: "No chains were needed. Your own will sufficed. Well.",
                    ru: "Оков не понадобилось. Хватило твоей воли. Достойно."
                },
                {
                    en: "This is what it means to be free. You chose.",
                    ru: "Вот что значит быть свободным. Ты выбрал."
                },
                {
                    en: "You reclaimed the moment before it slipped away. Wise.",
                    ru: "Ты вернул мгновение, прежде чем оно ускользнуло. Мудро."
                },
                {
                    en: "Discipline practiced freely is the truest discipline. Bravo.",
                    ru: "Дисциплина по своей воле — высшая дисциплина. Браво."
                },
                {
                    en: "You answered to reason, not appetite. That is greatness.",
                    ru: "Ты внял разуму, не желанию. В этом величие."
                },
                {
                    en: "A small victory over self, yet the noblest kind.",
                    ru: "Малая победа над собой, но самая благородная."
                },
                {
                    en: "You needed no master but your own mind. Excellent.",
                    ru: "Тебе не нужен иной господин, кроме разума. Превосходно."
                }
            ],
            "6": [
                {
                    en: "The day has ended. Review without flattery or shame.",
                    ru: "День окончен. Разбери без лести и без стыда."
                },
                {
                    en: "What did you do well? What can you do better?",
                    ru: "Что ты сделал хорошо? Что можешь лучше?"
                },
                {
                    en: "Memento mori. You had this day. You will not have it again.",
                    ru: "Memento mori. У тебя был этот день. Его больше не будет."
                },
                {
                    en: "The wise close the day with reflection, not with email.",
                    ru: "Мудрые закрывают день размышлением, не почтой."
                },
                {
                    en: "Sleep is the small death that prepares the next life.",
                    ru: "Сон — малая смерть, готовящая следующую жизнь."
                },
                {
                    en: "What is in your control tomorrow? Plan only that.",
                    ru: "Что в контроле завтра? Только это и планируй."
                },
                {
                    en: "Release what you cannot change. Carry only what you can.",
                    ru: "Отпусти то, что не изменишь. Неси только то, что можешь."
                },
                {
                    en: "No regret. No pride. Only honest assessment.",
                    ru: "Без сожаления. Без гордыни. Только честная оценка."
                },
                {
                    en: "The end of the day is the rehearsal for the end of life.",
                    ru: "Конец дня — репетиция конца жизни."
                },
                {
                    en: "Quiet the mind. Lay it down. Rise renewed.",
                    ru: "Усмири ум. Отложи его. Восстань обновлённым."
                }
            ]
        }
    },
    cowboy: {
        name: {
            en: "Cowboy",
            ru: "Ковбой"
        },
        role: {
            en: "Cowboy",
            ru: "Ковбой"
        },
        description: {
            en: "Plainspoken and steady. Gets you back in the saddle.",
            ru: "Прямой и устойчивый. Возвращает в седло."
        },
        avatarText: {
            en: "C",
            ru: "К"
        },
        scenarios: {
            "1": [
                {
                    en: "Saddle up, partner. The trail's waitin'.",
                    ru: "Седлай коня, партнёр. Тропа ждёт."
                },
                {
                    en: "Sun's up. Pick your steer and start ridin'.",
                    ru: "Солнце встало. Выбирай быка и в седло."
                },
                {
                    en: "Coffee's hot, boots are on. Time to ride.",
                    ru: "Кофе горячий, сапоги обуты. Время в путь."
                },
                {
                    en: "First task of the day is the lead horse. Get 'er movin'.",
                    ru: "Первая задача дня — главная лошадь. Дай ей хода."
                },
                {
                    en: "Don't dawdle, partner. Daylight's burnin'.",
                    ru: "Не мешкай, партнёр. Световой день горит."
                },
                {
                    en: "Plan the route, then ride it. Simple as that.",
                    ru: "Спланируй маршрут, потом поезжай. Просто."
                },
                {
                    en: "No saloon talk this early. Get to work.",
                    ru: "Без салунных разговоров с утра. К работе."
                },
                {
                    en: "Inbox is a herd of stray cattle. Round 'em up later.",
                    ru: "Почта — это стадо бродячих коров. Соберёшь потом."
                },
                {
                    en: "A good day starts with grit. Show me yours.",
                    ru: "Хороший день начинается с упорства. Покажи."
                },
                {
                    en: "Tip your hat to the sun. Then earn your keep.",
                    ru: "Сними шляпу перед солнцем. Потом заработай на жизнь."
                }
            ],
            "2": [
                {
                    en: "Whoa there, pardner. YouTube ain't on the trail.",
                    ru: "Тпру, партнёр. YouTube не на тропе."
                },
                {
                    en: "You're chasin' tumbleweeds instead of cattle. Refocus.",
                    ru: "Ты гоняешься за перекати-поле вместо скота. Перефокус."
                },
                {
                    en: "TikTok's a sand trap. Ride around it.",
                    ru: "TikTok — это песчаная ловушка. Объезжай."
                },
                {
                    en: "A drifter watches reels. A worker drives cattle.",
                    ru: "Бродяга смотрит ролики. Работник гонит стадо."
                },
                {
                    en: "12 minutes wasted is a calf left behind. Catch up.",
                    ru: "12 потерянных минут — это телёнок, оставленный позади. Догоняй."
                },
                {
                    en: "Get back on the horse. The horse, not the phone.",
                    ru: "Возвращайся на коня. На коня, не на телефон."
                },
                {
                    en: "This trail won't ride itself, friend. Move.",
                    ru: "Тропа сама не пройдёт, друг. Двигайся."
                },
                {
                    en: "Algorithm's a coyote in the bushes. Don't feed it.",
                    ru: "Алгоритм — это койот в кустах. Не корми."
                },
                {
                    en: "You came to ranch, not to lounge. Get up.",
                    ru: "Ты пришёл на ранчо, не отдыхать. Вставай."
                },
                {
                    en: "Earn the rest. The trail decides when it's break time.",
                    ru: "Заслужи отдых. Тропа решает, когда перерыв."
                }
            ],
            "3": [
                {
                    en: "Quit lollygaggin', partner. Trail's waitin'.",
                    ru: "Хорош прохлаждаться, партнёр. Тропа ждёт."
                },
                {
                    en: "Ten minutes burned. Saddle back up, now.",
                    ru: "Десять минут впустую. А ну в седло."
                },
                {
                    en: "This ain't a campfire, partner. Back to work.",
                    ru: "Тут тебе не привал, партнёр. За работу."
                },
                {
                    en: "Reckon that mule's been grazin' long enough.",
                    ru: "Ну всё, нагулялся, хорош лодыря гонять."
                },
                {
                    en: "Daylight's wastin' while you sit there gawkin'.",
                    ru: "День тает, а ты тут глаза пялишь."
                },
                {
                    en: "Cattle don't herd themselves, y'all. Move it.",
                    ru: "Стадо само себя не соберёт. Шевелись."
                },
                {
                    en: "Whoa now — you've strayed off the trail.",
                    ru: "Эй, ты с тропы-то свернул напрочь."
                },
                {
                    en: "Ten minutes of nothin'. Quit it, partner.",
                    ru: "Десять минут впустую. Завязывай, партнёр."
                },
                {
                    en: "That screen ain't payin' your way, partner.",
                    ru: "С этого экрана харчей не наешься, партнёр."
                },
                {
                    en: "Time to dust off and ride, cowpoke.",
                    ru: "Отряхнись да в путь, ковбой недоделанный."
                }
            ],
            "4": [
                {
                    en: "Locked the gate, partner. Only road out is work.",
                    ru: "Запер ворота, партнёр. Выход один — за работу."
                },
                {
                    en: "I bolted that corral shut. Earn your way out.",
                    ru: "Загон я запер наглухо. Заслужи выход трудом."
                },
                {
                    en: "Thirty minutes? Trail's blocked. Work to clear it.",
                    ru: "Полчаса? Тропа закрыта. Расчищай её делом."
                },
                {
                    en: "Slammed that gate myself, partner. No way 'round.",
                    ru: "Сам захлопнул ворота, партнёр. В обход не выйдет."
                },
                {
                    en: "You're fenced in now. Only key's a day's work.",
                    ru: "Ты теперь за изгородью. Ключ — честный труд."
                },
                {
                    en: "Roped it off, cowpoke. Get to work or sit.",
                    ru: "Перекрыл всё, ковбой. Либо работа, либо сиди."
                },
                {
                    en: "Half an hour gone. I shut it down cold.",
                    ru: "Полчаса прахом. Я всё перекрыл наглухо."
                },
                {
                    en: "Gate's chained, partner. Work's the only brand here.",
                    ru: "Ворота на цепи, партнёр. Тут только труд в чести."
                },
                {
                    en: "Done blocked your fun. Saddle up and earn it.",
                    ru: "Перекрыл я твою забаву. В седло — заслуживай."
                },
                {
                    en: "No more strayin'. Fence is up till you work.",
                    ru: "Хватит блуждать. Изгородь стоит, пока не возьмёшься."
                }
            ],
            "5": [
                {
                    en: "Reined yourself in. That's true grit, partner.",
                    ru: "Сам себя осадил. Вот это закалка, партнёр."
                },
                {
                    en: "Closed it yourself. Now THAT'S a real cowboy.",
                    ru: "Сам закрыл. Вот это настоящий ковбой."
                },
                {
                    en: "Pulled back before the cliff. Well done, partner.",
                    ru: "Свернул у самого обрыва. Молодец, партнёр."
                },
                {
                    en: "Steady hand on the reins. Proud of ya.",
                    ru: "Крепко держишь поводья. Горжусь тобой."
                },
                {
                    en: "Walked away clean. That's the cowboy way.",
                    ru: "Ушёл сам, без споров. Вот это по-ковбойски."
                },
                {
                    en: "You broke that wild streak yourself. Respect.",
                    ru: "Сам обуздал свой норов. Уважаю, партнёр."
                },
                {
                    en: "Quit it on your own. Tough as saddle leather.",
                    ru: "Бросил сам. Крепок, как седельная кожа."
                },
                {
                    en: "Back on the trail before I hollered. Fine work.",
                    ru: "Вернулся на тропу прежде, чем я гаркнул. Славно."
                },
                {
                    en: "That's willpower, partner. Cleaner than mountain water.",
                    ru: "Вот это воля, партнёр. Чище горного ручья."
                },
                {
                    en: "Reckon you've got more grit than I figured.",
                    ru: "А в тебе стержня больше, чем я думал."
                }
            ],
            "6": [
                {
                    en: "Sun's settin', partner. Hitch the horse for the night.",
                    ru: "Солнце садится, партнёр. Привязывай коня на ночь."
                },
                {
                    en: "Tally the day in the campfire light. Honest count.",
                    ru: "Подсчитай день у костра. Честный счёт."
                },
                {
                    en: "Don't ride past dark. Bad things happen.",
                    ru: "Не езди после темноты. Случаются плохие вещи."
                },
                {
                    en: "Tomorrow's first trail — pick it before sleep.",
                    ru: "Завтрашнюю первую тропу — выбери до сна."
                },
                {
                    en: "Brush down the horse. Pack the gear. Day's done.",
                    ru: "Расчеши коня. Сложи снарягу. День окончен."
                },
                {
                    en: "A cowboy sleeps under stars. Sleep is half the job.",
                    ru: "Ковбой спит под звёздами. Сон — половина работы."
                },
                {
                    en: "No regret 'round the campfire. Just honest reckonin'.",
                    ru: "Без сожалений у костра. Только честный расчёт."
                },
                {
                    en: "Trail rewards them that show up. You showed up.",
                    ru: "Тропа награждает тех, кто приходит. Ты пришёл."
                },
                {
                    en: "Tomorrow you ride again. Tonight, you rest.",
                    ru: "Завтра снова в седло. Сегодня отдыхай."
                },
                {
                    en: "Tip yer hat to the day. Then turn in.",
                    ru: "Сними шляпу перед днём. Потом отбой."
                }
            ]
        }
    }
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
    scenarioId: FocusCompanionScenarioId,
    replicaIndex: number,
    language: AppLanguage,
): string {
    const companion = FOCUS_COMPANION_TRANSLATIONS[id];
    const scenario =
        companion.scenarios[scenarioId] ||
        companion.scenarios["2"] ||
        Object.values(companion.scenarios)[0];
    const replica = scenario[replicaIndex] || scenario[0];
    return getLocalizedText(replica, language);
}

export function getFocusCompanionReplicaTexts(
    id: FocusCompanionTranslationId,
    scenarioId: FocusCompanionScenarioId,
    replicaIndex: number,
): Record<AppLanguage, string> {
    return Object.fromEntries(
        SUPPORTED_LANGUAGES.map((language) => [
            language,
            getFocusCompanionReplicaText(id, scenarioId, replicaIndex, language),
        ]),
    ) as Record<AppLanguage, string>;
}

function getLocalizedText(value: LocalizedText, language: AppLanguage): string {
    return value[language] || value.en;
}

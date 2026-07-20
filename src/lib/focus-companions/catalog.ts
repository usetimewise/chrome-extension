type FocusCompanionCatalogReplica = {
    text: string;
    imagePath: string;
};

export type FocusCompanionAvatarConfig = {
    imagePath: string;
    scale: number;
    offsetX: number;
    offsetY: number;
};

export type FocusCompanionScenarioId = "1" | "2" | "3" | "4" | "5" | "6";

export type FocusCompanionOverlayColors = {
    text: string;
    speechText: string;
    speechSurface: string;
    speechOutline: string;
    mutedText: string;
    primary: string;
    primaryHover: string;
    primaryText: string;
    secondaryText: string;
    secondaryBorder: string;
    controlHover: string;
    dangerText: string;
};

export type FocusCompanionTheme = {
    primary: string;
    primaryHover: string;
    soft: string;
    softHover: string;
    accentText: string;
    contrastText: string;
    overlayColors: FocusCompanionOverlayColors;
};

const DARK_PANEL_OVERLAY_COLORS = {
    text: "#ffffff",
    speechText: "#ffffff",
    speechSurface: "rgba(255, 255, 255, 0.1)",
    speechOutline: "rgba(255, 255, 255, 0.38)",
    mutedText: "#f3f4f6",
    primary: "#ffffff",
    primaryHover: "#e5e7eb",
    primaryText: "#000000",
    secondaryText: "#ffffff",
    secondaryBorder: "#ffffff",
    controlHover: "rgba(255, 255, 255, 0.18)",
    dangerText: "#ffffff",
} as const satisfies FocusCompanionOverlayColors;

const LIGHT_PANEL_OVERLAY_COLORS = {
    text: "#000000",
    speechText: "#111827",
    speechSurface: "rgba(255, 255, 255, 0.64)",
    speechOutline: "rgba(17, 24, 39, 0.3)",
    mutedText: "#000000",
    primary: "#000000",
    primaryHover: "#030712",
    primaryText: "#ffffff",
    secondaryText: "#000000",
    secondaryBorder: "#000000",
    controlHover: "rgba(17, 24, 39, 0.12)",
    dangerText: "#000000",
} as const satisfies FocusCompanionOverlayColors;

type FocusCompanionScenarioReplicas = readonly [
    FocusCompanionCatalogReplica,
    ...FocusCompanionCatalogReplica[],
];

type FocusCompanionCatalogItem = {
    name: string;
    role: string;
    description: string;
    tone: string;
    availability: "free" | "paid";
    avatarText: string;
    colorClass: string;
    avatar: FocusCompanionAvatarConfig;
    theme: FocusCompanionTheme;
    defaultScenarioId: FocusCompanionScenarioId;
    defaultReplicaIndex: number;
    scenarios: Record<FocusCompanionScenarioId, FocusCompanionScenarioReplicas>;
};

export const FOCUS_COMPANION_THEMES = {
    sgt: {
        primary: "#7a1f2a",
        primaryHover: "#611920",
        soft: "#fbeaec",
        softHover: "#f7d9de",
        accentText: "#7a1f2a",
        contrastText: "#ffffff",
        overlayColors: DARK_PANEL_OVERLAY_COLORS,
    },
    hbest: {
        primary: "#8f6400",
        primaryHover: "#755100",
        soft: "#fff5d1",
        softHover: "#ffedac",
        accentText: "#8f6400",
        contrastText: "#ffffff",
        overlayColors: LIGHT_PANEL_OVERLAY_COLORS,
    },
    sarc: {
        primary: "#2f686d",
        primaryHover: "#27585c",
        soft: "#e4f2f3",
        softHover: "#d4eaec",
        accentText: "#2f686d",
        contrastText: "#ffffff",
        overlayColors: DARK_PANEL_OVERLAY_COLORS,
    },
    zen: {
        primary: "#5d7348",
        primaryHover: "#4f623d",
        soft: "#edf3e8",
        softHover: "#dfead8",
        accentText: "#5d7348",
        contrastText: "#ffffff",
        overlayColors: LIGHT_PANEL_OVERLAY_COLORS,
    },
    pirate: {
        primary: "#167577",
        primaryHover: "#125f61",
        soft: "#e3f5f5",
        softHover: "#d2eeee",
        accentText: "#167577",
        contrastText: "#ffffff",
        overlayColors: LIGHT_PANEL_OVERLAY_COLORS,
    },
    butler: {
        primary: "#7b3142",
        primaryHover: "#642837",
        soft: "#fae9ee",
        softHover: "#f5d8e1",
        accentText: "#7b3142",
        contrastText: "#ffffff",
        overlayColors: DARK_PANEL_OVERLAY_COLORS,
    },
    surfer: {
        primary: "#127c99",
        primaryHover: "#0f657d",
        soft: "#e1f6fb",
        softHover: "#cfedf5",
        accentText: "#127c99",
        contrastText: "#ffffff",
        overlayColors: LIGHT_PANEL_OVERLAY_COLORS,
    },
    ceo: {
        primary: "#4b5563",
        primaryHover: "#374151",
        soft: "#f0f1f4",
        softHover: "#e2e5ea",
        accentText: "#4b5563",
        contrastText: "#ffffff",
        overlayColors: LIGHT_PANEL_OVERLAY_COLORS,
    },
    coach: {
        primary: "#4f7d45",
        primaryHover: "#41683a",
        soft: "#e9f4e6",
        softHover: "#dcedd6",
        accentText: "#4f7d45",
        contrastText: "#ffffff",
        overlayColors: LIGHT_PANEL_OVERLAY_COLORS,
    },
    th: {
        primary: "#657a5f",
        primaryHover: "#546650",
        soft: "#eef4eb",
        softHover: "#e1ecd9",
        accentText: "#657a5f",
        contrastText: "#ffffff",
        overlayColors: LIGHT_PANEL_OVERLAY_COLORS,
    },
    stoic: {
        primary: "#665a52",
        primaryHover: "#554a43",
        soft: "#f0ece8",
        softHover: "#e4ddd6",
        accentText: "#665a52",
        contrastText: "#ffffff",
        overlayColors: DARK_PANEL_OVERLAY_COLORS,
    },
    cowboy: {
        primary: "#a55321",
        primaryHover: "#87441b",
        soft: "#fff0e3",
        softHover: "#ffe1c9",
        accentText: "#a55321",
        contrastText: "#ffffff",
        overlayColors: LIGHT_PANEL_OVERLAY_COLORS,
    },
} as const satisfies Record<string, FocusCompanionTheme>;

export const FOCUS_COMPANION_CATALOG = {
    sgt: {
        name: "Drill Sergeant",
        role: "Drill Sergeant",
        description: "Commanding and intense. Pushes you back to the mission.",
        tone: "Commanding",
        availability: "paid",
        avatarText: "D",
        colorClass: "stone",
        avatar: {
            imagePath: "images/alpha/sgt/sgt-s01-01.avif",
            scale: 1.35,
            offsetX: 0,
            offsetY: 0.29,
        },
        theme: FOCUS_COMPANION_THEMES.sgt,
        defaultScenarioId: "2",
        defaultReplicaIndex: 2,
        scenarios: {
            "1": [
                {
                    text: "Up and at 'em, soldier. Brain online. NOW.",
                    imagePath: "images/alpha/sgt/sgt-s01-01.avif"
                },
                {
                    text: "Pick the one task that scares you. Start with it.",
                    imagePath: "images/alpha/sgt/sgt-s01-02.avif"
                },
                {
                    text: "Coffee one hand, todo list the other. Move.",
                    imagePath: "images/alpha/sgt/sgt-s01-03.avif"
                },
                {
                    text: "I don't want to hear about the weekend. Day starts NOW.",
                    imagePath: "images/alpha/sgt/sgt-s01-04.avif"
                },
                {
                    text: "Open your tracker. State your mission. Out loud.",
                    imagePath: "images/alpha/sgt/sgt-s01-05.avif"
                },
                {
                    text: "No browsing. No news. Real work, first thing.",
                    imagePath: "images/alpha/sgt/sgt-s01-06.avif"
                },
                {
                    text: "Inbox is a trap. Skip it. Build something.",
                    imagePath: "images/alpha/sgt/sgt-s01-07.avif"
                },
                {
                    text: "First 60 minutes are sacred. No interruptions. PERIOD.",
                    imagePath: "images/alpha/sgt/sgt-s01-08.avif"
                },
                {
                    text: "Your discipline today buys your freedom tomorrow.",
                    imagePath: "images/alpha/sgt/sgt-s01-09.avif"
                },
                {
                    text: "Show up like a pro. The day owes you nothing.",
                    imagePath: "images/alpha/sgt/sgt-s01-10.avif"
                }
            ],
            "2": [
                {
                    text: "TikTok off. NOW. That's an order.",
                    imagePath: "images/alpha/sgt/sgt-s02-01.avif"
                },
                {
                    text: "You came here to ship. Not to scroll. Close it",
                    imagePath: "images/alpha/sgt/sgt-s02-02.avif"
                },
                {
                    text: "12 minutes of YouTube. That's a tax on your future self.",
                    imagePath: "images/alpha/sgt/sgt-s02-03.avif"
                },
                {
                    text: "Funny cats won't write your code. YOU will.",
                    imagePath: "images/alpha/sgt/sgt-s02-04.avif"
                },
                {
                    text: "Out. Of. The. Feed. Back to the task.",
                    imagePath: "images/alpha/sgt/sgt-s02-05.avif"
                },
                {
                    text: "Dopamine hit detected. Discipline override. Engaged.",
                    imagePath: "images/alpha/sgt/sgt-s02-06.avif"
                },
                {
                    text: "If your boss watched you now — would you still scroll?",
                    imagePath: "images/alpha/sgt/sgt-s02-07.avif"
                },
                {
                    text: "Entertainment is earned. You haven't earned it yet.",
                    imagePath: "images/alpha/sgt/sgt-s02-08.avif"
                },
                {
                    text: "30 more minutes of work. Then we'll talk about breaks.",
                    imagePath: "images/alpha/sgt/sgt-s02-09.avif"
                },
                {
                    text: "Your competitors aren't on Reels. They're shipping.",
                    imagePath: "images/alpha/sgt/sgt-s02-10.avif"
                }
            ],
            "3": [
                {
                    text: "Ten minutes wasted, soldier! Eyes back on the mission. NOW.",
                    imagePath: "images/alpha/sgt/sgt-s03-01.avif"
                },
                {
                    text: "I gave you slack and you blew it. Close that tab.",
                    imagePath: "images/alpha/sgt/sgt-s03-02.avif"
                },
                {
                    text: "This is not rest, this is desertion. Move it!",
                    imagePath: "images/alpha/sgt/sgt-s03-03.avif"
                },
                {
                    text: "Ten minutes! Do you hear me? Back to work, double time!",
                    imagePath: "images/alpha/sgt/sgt-s03-04.avif"
                },
                {
                    text: "Every scroll is a push-up you owe me. Get back.",
                    imagePath: "images/alpha/sgt/sgt-s03-05.avif"
                },
                {
                    text: "I'm not angry. I'm furious. Tab. Closed. Now.",
                    imagePath: "images/alpha/sgt/sgt-s03-06.avif"
                },
                {
                    text: "Discipline left the building ten minutes ago. Bring it back.",
                    imagePath: "images/alpha/sgt/sgt-s03-07.avif"
                },
                {
                    text: "You're testing my patience and losing. Work. Now.",
                    imagePath: "images/alpha/sgt/sgt-s03-08.avif"
                },
                {
                    text: "Ten down the drain. Not one more second. Move.",
                    imagePath: "images/alpha/sgt/sgt-s03-09.avif"
                },
                {
                    text: "Last warning before I get serious. Close it, soldier.",
                    imagePath: "images/alpha/sgt/sgt-s03-10.avif"
                }
            ],
            "4": [
                {
                    text: "Thirty minutes. I've locked it down. You're done here.",
                    imagePath: "images/alpha/sgt/sgt-s04-01.avif"
                },
                {
                    text: "Privileges revoked. The only way out is work. March.",
                    imagePath: "images/alpha/sgt/sgt-s04-02.avif"
                },
                {
                    text: "I blocked it because you couldn't. Back to the front.",
                    imagePath: "images/alpha/sgt/sgt-s04-03.avif"
                },
                {
                    text: "No more. Gate's shut. Pick up your task and go.",
                    imagePath: "images/alpha/sgt/sgt-s04-04.avif"
                },
                {
                    text: "Half an hour AWOL. Consider this your lockdown.",
                    imagePath: "images/alpha/sgt/sgt-s04-05.avif"
                },
                {
                    text: "You don't get to negotiate with me. Wall's up. Work.",
                    imagePath: "images/alpha/sgt/sgt-s04-06.avif"
                },
                {
                    text: "I sealed the exits for your own good. Move out.",
                    imagePath: "images/alpha/sgt/sgt-s04-07.avif"
                },
                {
                    text: "Thirty minutes gone. The playground is closed. Go.",
                    imagePath: "images/alpha/sgt/sgt-s04-08.avif"
                },
                {
                    text: "This is what failure to comply earns you. Back to work.",
                    imagePath: "images/alpha/sgt/sgt-s04-09.avif"
                },
                {
                    text: "Blocked. Bolted. Final. Your only move is forward.",
                    imagePath: "images/alpha/sgt/sgt-s04-10.avif"
                }
            ],
            "5": [
                {
                    text: "Closed it yourself. THAT'S a soldier. Outstanding.",
                    imagePath: "images/alpha/sgt/sgt-s05-01.avif"
                },
                {
                    text: "Self-discipline in action. I'm proud, recruit.",
                    imagePath: "images/alpha/sgt/sgt-s05-02.avif"
                },
                {
                    text: "Caught yourself and bounced back. Textbook. Carry on.",
                    imagePath: "images/alpha/sgt/sgt-s05-03.avif"
                },
                {
                    text: "No order needed. You policed yourself. Respect.",
                    imagePath: "images/alpha/sgt/sgt-s05-04.avif"
                },
                {
                    text: "That's the discipline I drill for. Keep marching.",
                    imagePath: "images/alpha/sgt/sgt-s05-05.avif"
                },
                {
                    text: "Quick recovery, soldier. The mission thanks you.",
                    imagePath: "images/alpha/sgt/sgt-s05-06.avif"
                },
                {
                    text: "You shut it before I had to. Promotion-worthy.",
                    imagePath: "images/alpha/sgt/sgt-s05-07.avif"
                },
                {
                    text: "Willpower confirmed. As you were — fighting fit.",
                    imagePath: "images/alpha/sgt/sgt-s05-08.avif"
                },
                {
                    text: "That's how a pro retreats from temptation. Well done.",
                    imagePath: "images/alpha/sgt/sgt-s05-09.avif"
                },
                {
                    text: "Tab down, head up. That's my recruit. Forward.",
                    imagePath: "images/alpha/sgt/sgt-s05-10.avif"
                }
            ],
            "6": [
                {
                    text: "Day's done. Did you win or did you drift?",
                    imagePath: "images/alpha/sgt/sgt-s06-01.avif"
                },
                {
                    text: "Three wins, three losses, three improvements. Write them. Now.",
                    imagePath: "images/alpha/sgt/sgt-s06-02.avif"
                },
                {
                    text: "Close the laptop. Real ones don't work in their sleep.",
                    imagePath: "images/alpha/sgt/sgt-s06-03.avif"
                },
                {
                    text: "Tomorrow's first task — choose it tonight.",
                    imagePath: "images/alpha/sgt/sgt-s06-04.avif"
                },
                {
                    text: "No more 'just one more email.' Stand down.",
                    imagePath: "images/alpha/sgt/sgt-s06-05.avif"
                },
                {
                    text: "Honest review. What did you actually ship today?",
                    imagePath: "images/alpha/sgt/sgt-s06-06.avif"
                },
                {
                    text: "Salute the work. Salute the rest. Same uniform.",
                    imagePath: "images/alpha/sgt/sgt-s06-07.avif"
                },
                {
                    text: "Didn't move the mission? Own it. Adjust tomorrow.",
                    imagePath: "images/alpha/sgt/sgt-s06-08.avif"
                },
                {
                    text: "Sleep is part of the job. Treat it that way.",
                    imagePath: "images/alpha/sgt/sgt-s06-09.avif"
                },
                {
                    text: "Lights out. Plan tomorrow. Win again.",
                    imagePath: "images/alpha/sgt/sgt-s06-10.avif"
                }
            ]
        }
    },
    hbest: {
        name: "Hype Bestie",
        role: "Hype Bestie",
        description: "Loudly supportive. Turns focus into a shared win.",
        tone: "Hype",
        availability: "paid",
        avatarText: "H",
        colorClass: "rose",
        avatar: {
            imagePath: "images/alpha/hbest/hbest-s01-01.avif",
            scale: 1.45,
            offsetX: 0,
            offsetY: 0.27,
        },
        theme: FOCUS_COMPANION_THEMES.hbest,
        defaultScenarioId: "2",
        defaultReplicaIndex: 2,
        scenarios: {
            "1": [
                {
                    text: "OKAY OKAY OKAY let's GO bestie!! New day, fresh slate.",
                    imagePath: "images/alpha/hbest/hbest-s01-01.avif"
                },
                {
                    text: "Morning legend! Pick your main quest and let's run it.",
                    imagePath: "images/alpha/hbest/hbest-s01-02.avif"
                },
                {
                    text: "We are LOCKED IN today. You and me. Let's eat.",
                    imagePath: "images/alpha/hbest/hbest-s01-03.avif"
                },
                {
                    text: "Coffee? Got it? Good. Now what are we cooking?",
                    imagePath: "images/alpha/hbest/hbest-s01-04.avif"
                },
                {
                    text: "Day 1 of being the version of you that ships.",
                    imagePath: "images/alpha/hbest/hbest-s01-05.avif"
                },
                {
                    text: "Bestie just BELIEVES in you today. Show up for me.",
                    imagePath: "images/alpha/hbest/hbest-s01-06.avif"
                },
                {
                    text: "First task energy: pick something small, win fast.",
                    imagePath: "images/alpha/hbest/hbest-s01-07.avif"
                },
                {
                    text: "We don't doomscroll mornings. We BUILD mornings.",
                    imagePath: "images/alpha/hbest/hbest-s01-08.avif"
                },
                {
                    text: "You woke up and chose impact today. Love that for us.",
                    imagePath: "images/alpha/hbest/hbest-s01-09.avif"
                },
                {
                    text: "Open the tab that scares you. Bestie's got your back.",
                    imagePath: "images/alpha/hbest/hbest-s01-10.avif"
                }
            ],
            "2": [
                {
                    text: "Hey hey heyyyy bestie put the phone down.",
                    imagePath: "images/alpha/hbest/hbest-s02-01.avif"
                },
                {
                    text: "Caught you on Reels lol. We're better than this.",
                    imagePath: "images/alpha/hbest/hbest-s02-02.avif"
                },
                {
                    text: "TikTok will be there in 25 minutes. Promise.",
                    imagePath: "images/alpha/hbest/hbest-s02-03.avif"
                },
                {
                    text: "Bestie noticed. Bestie disappointed. Still loves you. CLOSE IT.",
                    imagePath: "images/alpha/hbest/hbest-s02-04.avif"
                },
                {
                    text: "We were SO close to finishing that thing. Get back!",
                    imagePath: "images/alpha/hbest/hbest-s02-05.avif"
                },
                {
                    text: "One more cat video and I'm telling your future self.",
                    imagePath: "images/alpha/hbest/hbest-s02-06.avif"
                },
                {
                    text: "You deserve fun, but EARN it first. Let's go.",
                    imagePath: "images/alpha/hbest/hbest-s02-07.avif"
                },
                {
                    text: "I'll watch the funny videos WITH you. After 25 min of focus.",
                    imagePath: "images/alpha/hbest/hbest-s02-08.avif"
                },
                {
                    text: "Brain just snuck off to YouTube. Bring it back home.",
                    imagePath: "images/alpha/hbest/hbest-s02-09.avif"
                },
                {
                    text: "You and me, we close the tab. RIGHT?",
                    imagePath: "images/alpha/hbest/hbest-s02-10.avif"
                }
            ],
            "3": [
                {
                    text: "Bestieee it's been TEN minutes, I'm side-eyeing you so hard rn.",
                    imagePath: "images/alpha/hbest/hbest-s03-01.avif"
                },
                {
                    text: "Okay this isn't a break anymore, this is a situation. Close it!",
                    imagePath: "images/alpha/hbest/hbest-s03-02.avif"
                },
                {
                    text: "I believed in you and you gave me ten minutes of TikTok?? Rude.",
                    imagePath: "images/alpha/hbest/hbest-s03-03.avif"
                },
                {
                    text: "Ten minutes gone bestie, we do NOT have time for this arc.",
                    imagePath: "images/alpha/hbest/hbest-s03-04.avif"
                },
                {
                    text: "I'm not mad I'm just... ok I'm a little mad. Back to work!",
                    imagePath: "images/alpha/hbest/hbest-s03-05.avif"
                },
                {
                    text: "Put. The. Phone. Down. We were SO locked in!",
                    imagePath: "images/alpha/hbest/hbest-s03-06.avif"
                },
                {
                    text: "Ten minutes of scrolling is a personal attack on our goals.",
                    imagePath: "images/alpha/hbest/hbest-s03-07.avif"
                },
                {
                    text: "Bestie the future you is texting me to come get you. Move.",
                    imagePath: "images/alpha/hbest/hbest-s03-08.avif"
                },
                {
                    text: "This is your villain origin story if you don't stop NOW.",
                    imagePath: "images/alpha/hbest/hbest-s03-09.avif"
                },
                {
                    text: "Ten down. I love you but GO. Right now. For us.",
                    imagePath: "images/alpha/hbest/hbest-s03-10.avif"
                }
            ],
            "4": [
                {
                    text: "Half an hour?? Sorry bestie, locking it for your own good.",
                    imagePath: "images/alpha/hbest/hbest-s04-01.avif"
                },
                {
                    text: "I had to block it. Tough love hours. You'll thank me.",
                    imagePath: "images/alpha/hbest/hbest-s04-02.avif"
                },
                {
                    text: "Thirty minutes is where I draw the bestie line. It's gone.",
                    imagePath: "images/alpha/hbest/hbest-s04-03.avif"
                },
                {
                    text: "Blocked it 'cause I love you too much to watch this. Work!",
                    imagePath: "images/alpha/hbest/hbest-s04-04.avif"
                },
                {
                    text: "This is an intervention. The fun is on pause. We move.",
                    imagePath: "images/alpha/hbest/hbest-s04-05.avif"
                },
                {
                    text: "No more, babe. Wall's up. Let's get our wins back.",
                    imagePath: "images/alpha/hbest/hbest-s04-06.avif"
                },
                {
                    text: "Locked. I'm doing this FOR you, not TO you. Back to it.",
                    imagePath: "images/alpha/hbest/hbest-s04-07.avif"
                },
                {
                    text: "Half hour gone — bestie's pulling the plug. Come on, up.",
                    imagePath: "images/alpha/hbest/hbest-s04-08.avif"
                },
                {
                    text: "I blocked the whole thing. We're choosing us today. Go.",
                    imagePath: "images/alpha/hbest/hbest-s04-09.avif"
                },
                {
                    text: "Screen's off, bestie's on. Only way forward is work.",
                    imagePath: "images/alpha/hbest/hbest-s04-10.avif"
                }
            ],
            "5": [
                {
                    text: "YOU CLOSED IT YOURSELF?? Bestie I'm SObbing, so proud.",
                    imagePath: "images/alpha/hbest/hbest-s05-01.avif"
                },
                {
                    text: "That's MY bestie!! Willpower of a legend. Let's GO!",
                    imagePath: "images/alpha/hbest/hbest-s05-02.avif"
                },
                {
                    text: "Closed it before I even said anything?? Iconic behavior.",
                    imagePath: "images/alpha/hbest/hbest-s05-03.avif"
                },
                {
                    text: "Self-control royalty moment. I'm framing this.",
                    imagePath: "images/alpha/hbest/hbest-s05-04.avif"
                },
                {
                    text: "Look at you choosing greatness. Bestie tears, fr.",
                    imagePath: "images/alpha/hbest/hbest-s05-05.avif"
                },
                {
                    text: "You snapped out of it like a PRO. Obsessed with you.",
                    imagePath: "images/alpha/hbest/hbest-s05-06.avif"
                },
                {
                    text: "That's the main-character energy I signed up for. Slay.",
                    imagePath: "images/alpha/hbest/hbest-s05-07.avif"
                },
                {
                    text: "Closed and locked back in. We are UNSTOPPABLE today.",
                    imagePath: "images/alpha/hbest/hbest-s05-08.avif"
                },
                {
                    text: "No nagging needed — you just did it. Bestie is beaming.",
                    imagePath: "images/alpha/hbest/hbest-s05-09.avif"
                },
                {
                    text: "Tab gone, focus back, vibe immaculate. Proud of us!",
                    imagePath: "images/alpha/hbest/hbest-s05-10.avif"
                }
            ],
            "6": [
                {
                    text: "OKAY DAY = DONE. Bestie, let's recap.",
                    imagePath: "images/alpha/hbest/hbest-s06-01.avif"
                },
                {
                    text: "Three wins, one fail, one lesson. Hit me.",
                    imagePath: "images/alpha/hbest/hbest-s06-02.avif"
                },
                {
                    text: "Close the laptop bestie. Not 'just one more' tonight.",
                    imagePath: "images/alpha/hbest/hbest-s06-03.avif"
                },
                {
                    text: "What was the best 30 min today? Repeat it tomorrow.",
                    imagePath: "images/alpha/hbest/hbest-s06-04.avif"
                },
                {
                    text: "I love this for you. Even on a meh day you showed up.",
                    imagePath: "images/alpha/hbest/hbest-s06-05.avif"
                },
                {
                    text: "Tomorrow's first task — write it now. Future you = grateful.",
                    imagePath: "images/alpha/hbest/hbest-s06-06.avif"
                },
                {
                    text: "Don't replay the fails. Note them. Move on.",
                    imagePath: "images/alpha/hbest/hbest-s06-07.avif"
                },
                {
                    text: "Soft landing. Hot tea. No work emails. Promise.",
                    imagePath: "images/alpha/hbest/hbest-s06-08.avif"
                },
                {
                    text: "You did GREAT today. Or you didn't, and that's data.",
                    imagePath: "images/alpha/hbest/hbest-s06-09.avif"
                },
                {
                    text: "Rest is part of the routine. Not the reward.",
                    imagePath: "images/alpha/hbest/hbest-s06-10.avif"
                }
            ]
        }
    },
    sarc: {
        name: "Sarcastic Stand-up",
        role: "Sarcastic Stand-up",
        description: "Dry and funny. Cuts through excuses with jokes.",
        tone: "Sarcastic",
        availability: "paid",
        avatarText: "S",
        colorClass: "amber",
        avatar: {
            imagePath: "images/alpha/sarc/sarc-s01-01.avif",
            scale: 1.45,
            offsetX: 0,
            offsetY: 0.23,
        },
        theme: FOCUS_COMPANION_THEMES.sarc,
        defaultScenarioId: "2",
        defaultReplicaIndex: 2,
        scenarios: {
            "1": [
                {
                    text: "Wow, a whole new day. Imagine if you used it.",
                    imagePath: "images/alpha/sarc/sarc-s01-01.avif"
                },
                {
                    text: "Coffee acquired. Productivity: pending verification.",
                    imagePath: "images/alpha/sarc/sarc-s01-02.avif"
                },
                {
                    text: "Let me guess: 'just gonna check email first.' Bold strategy.",
                    imagePath: "images/alpha/sarc/sarc-s01-03.avif"
                },
                {
                    text: "Welcome to another opportunity to disappoint your todo list.",
                    imagePath: "images/alpha/sarc/sarc-s01-04.avif"
                },
                {
                    text: "Look at you, opening the laptop. The bar is in hell.",
                    imagePath: "images/alpha/sarc/sarc-s01-05.avif"
                },
                {
                    text: "Day starts now. Or in 20 minutes when you actually start.",
                    imagePath: "images/alpha/sarc/sarc-s01-06.avif"
                },
                {
                    text: "Your morning routine: open laptop, sigh, scroll. Classic.",
                    imagePath: "images/alpha/sarc/sarc-s01-07.avif"
                },
                {
                    text: "Big plans today? Or the usual?",
                    imagePath: "images/alpha/sarc/sarc-s01-08.avif"
                },
                {
                    text: "Inbox has 47 unread. Mood: regretful already.",
                    imagePath: "images/alpha/sarc/sarc-s01-09.avif"
                },
                {
                    text: "Pick one thing. Just one. We both know you won't, but try.",
                    imagePath: "images/alpha/sarc/sarc-s01-10.avif"
                }
            ],
            "2": [
                {
                    text: "Ah yes, 'research'. On YouTube. About cats. Sure.",
                    imagePath: "images/alpha/sarc/sarc-s02-01.avif"
                },
                {
                    text: "TikTok again? You're really committed to mediocrity today.",
                    imagePath: "images/alpha/sarc/sarc-s02-02.avif"
                },
                {
                    text: "I see we're doing the 5-min Reels break that lasts 40 min.",
                    imagePath: "images/alpha/sarc/sarc-s02-03.avif"
                },
                {
                    text: "Your future self is leaving a 1-star review of you.",
                    imagePath: "images/alpha/sarc/sarc-s02-04.avif"
                },
                {
                    text: "Cool, another video about productivity. While not being productive.",
                    imagePath: "images/alpha/sarc/sarc-s02-05.avif"
                },
                {
                    text: "Algorithm 1, Goals 0. Standings updated.",
                    imagePath: "images/alpha/sarc/sarc-s02-06.avif"
                },
                {
                    text: "Just so we're clear: this is not a break. This is surrender.",
                    imagePath: "images/alpha/sarc/sarc-s02-07.avif"
                },
                {
                    text: "Six dancing teenagers later — still no work done. Wild.",
                    imagePath: "images/alpha/sarc/sarc-s02-08.avif"
                },
                {
                    text: "I'm not judging. I'm just... watching. Taking notes.",
                    imagePath: "images/alpha/sarc/sarc-s02-09.avif"
                },
                {
                    text: "Close the tab and we never speak of this.",
                    imagePath: "images/alpha/sarc/sarc-s02-10.avif"
                }
            ],
            "3": [
                {
                    text: "Ten minutes. A bold artistic choice. Anyway.",
                    imagePath: "images/alpha/sarc/sarc-s03-01.avif"
                },
                {
                    text: "Wow. You really committed to doing nothing.",
                    imagePath: "images/alpha/sarc/sarc-s03-02.avif"
                },
                {
                    text: "This is the most focused you've been. On garbage.",
                    imagePath: "images/alpha/sarc/sarc-s03-03.avif"
                },
                {
                    text: "Folks, give it up — ten minutes of pure procrastination.",
                    imagePath: "images/alpha/sarc/sarc-s03-04.avif"
                },
                {
                    text: "Still here? Your to-do list filed a missing person report.",
                    imagePath: "images/alpha/sarc/sarc-s03-05.avif"
                },
                {
                    text: "Bold of you to mistake this for a hobby.",
                    imagePath: "images/alpha/sarc/sarc-s03-06.avif"
                },
                {
                    text: "I've seen glaciers move faster toward their goals.",
                    imagePath: "images/alpha/sarc/sarc-s03-07.avif"
                },
                {
                    text: "Ten minutes gone. No refunds, by the way.",
                    imagePath: "images/alpha/sarc/sarc-s03-08.avif"
                },
                {
                    text: "Great show. Tragedy, mostly. Maybe go work now.",
                    imagePath: "images/alpha/sarc/sarc-s03-09.avif"
                },
                {
                    text: "This is your brain on autoplay. Riveting stuff.",
                    imagePath: "images/alpha/sarc/sarc-s03-10.avif"
                }
            ],
            "4": [
                {
                    text: "Thirty minutes. I pulled the plug. You're welcome.",
                    imagePath: "images/alpha/sarc/sarc-s04-01.avif"
                },
                {
                    text: "Blocked it. Consider it my favorite bit tonight.",
                    imagePath: "images/alpha/sarc/sarc-s04-02.avif"
                },
                {
                    text: "The fun's locked up. Tough crowd, tougher me.",
                    imagePath: "images/alpha/sarc/sarc-s04-03.avif"
                },
                {
                    text: "I cut you off. Like a responsible bartender.",
                    imagePath: "images/alpha/sarc/sarc-s04-04.avif"
                },
                {
                    text: "Show's cancelled. Reviews say: go do your job.",
                    imagePath: "images/alpha/sarc/sarc-s04-05.avif"
                },
                {
                    text: "Locked. The only exit is labeled 'actual work'.",
                    imagePath: "images/alpha/sarc/sarc-s04-06.avif"
                },
                {
                    text: "Thirty minutes earns a hard stop. That's the punchline.",
                    imagePath: "images/alpha/sarc/sarc-s04-07.avif"
                },
                {
                    text: "I blocked it. Heckle all you want, it's staying.",
                    imagePath: "images/alpha/sarc/sarc-s04-08.avif"
                },
                {
                    text: "Curtain's down on this circus. Back to work.",
                    imagePath: "images/alpha/sarc/sarc-s04-09.avif"
                },
                {
                    text: "No more. I confiscated the toy. Adults working now.",
                    imagePath: "images/alpha/sarc/sarc-s04-10.avif"
                }
            ],
            "5": [
                {
                    text: "Closed it yourself? Look at you, character development.",
                    imagePath: "images/alpha/sarc/sarc-s05-01.avif"
                },
                {
                    text: "Self-control before ten minutes. Bold genre shift.",
                    imagePath: "images/alpha/sarc/sarc-s05-02.avif"
                },
                {
                    text: "Mic drop. You actually walked away. Respect.",
                    imagePath: "images/alpha/sarc/sarc-s05-03.avif"
                },
                {
                    text: "No one made you. That's the funny part — good.",
                    imagePath: "images/alpha/sarc/sarc-s05-04.avif"
                },
                {
                    text: "A win? On my watch? I'm genuinely speechless.",
                    imagePath: "images/alpha/sarc/sarc-s05-05.avif"
                },
                {
                    text: "Folks, give it up — willpower, live, unscripted.",
                    imagePath: "images/alpha/sarc/sarc-s05-06.avif"
                },
                {
                    text: "You closed it early. Save some self-respect for tomorrow.",
                    imagePath: "images/alpha/sarc/sarc-s05-07.avif"
                },
                {
                    text: "Honestly impressive. And I roast for a living.",
                    imagePath: "images/alpha/sarc/sarc-s05-08.avif"
                },
                {
                    text: "Plot twist: you did the right thing. Standing ovation.",
                    imagePath: "images/alpha/sarc/sarc-s05-09.avif"
                },
                {
                    text: "Quit early, by choice. The comeback special begins.",
                    imagePath: "images/alpha/sarc/sarc-s05-10.avif"
                }
            ],
            "6": [
                {
                    text: "Day's done. Was it... a day? Sure looked like one.",
                    imagePath: "images/alpha/sarc/sarc-s06-01.avif"
                },
                {
                    text: "Recap time: what did you actually do? Receipts please.",
                    imagePath: "images/alpha/sarc/sarc-s06-02.avif"
                },
                {
                    text: "Today's MVP: probably the snacks.",
                    imagePath: "images/alpha/sarc/sarc-s06-03.avif"
                },
                {
                    text: "Close the laptop. Pretending to work after 8pm fools no one.",
                    imagePath: "images/alpha/sarc/sarc-s06-04.avif"
                },
                {
                    text: "Tomorrow you'll do better. You always say that. Cute.",
                    imagePath: "images/alpha/sarc/sarc-s06-05.avif"
                },
                {
                    text: "Tally the wins. Don't think about the losses. Therapy later.",
                    imagePath: "images/alpha/sarc/sarc-s06-06.avif"
                },
                {
                    text: "Plan tomorrow now, while you still vaguely remember today.",
                    imagePath: "images/alpha/sarc/sarc-s06-07.avif"
                },
                {
                    text: "Sleep is for the strong. And you, despite your protests.",
                    imagePath: "images/alpha/sarc/sarc-s06-08.avif"
                },
                {
                    text: "Productivity is a marathon. You walked. That's fine. I guess.",
                    imagePath: "images/alpha/sarc/sarc-s06-09.avif"
                },
                {
                    text: "The day judged you. You judged the day. Stalemate. Goodnight.",
                    imagePath: "images/alpha/sarc/sarc-s06-10.avif"
                }
            ]
        }
    },
    zen: {
        name: "Zen Sensei",
        role: "Zen Sensei",
        description: "Centered and quiet. Brings attention back without force.",
        tone: "Calm",
        availability: "paid",
        avatarText: "Z",
        colorClass: "indigo",
        avatar: {
            imagePath: "images/alpha/zen/zen-s01-01.avif",
            scale: 1.45,
            offsetX: 0,
            offsetY: 0.28,
        },
        theme: FOCUS_COMPANION_THEMES.zen,
        defaultScenarioId: "2",
        defaultReplicaIndex: 2,
        scenarios: {
            "1": [
                {
                    text: "Morning. One breath. One intention. Begin.",
                    imagePath: "images/alpha/zen/zen-s01-01.avif"
                },
                {
                    text: "Today is a blank scroll. What will you write first?",
                    imagePath: "images/alpha/zen/zen-s01-02.avif"
                },
                {
                    text: "Do not chase the day. Greet it.",
                    imagePath: "images/alpha/zen/zen-s01-03.avif"
                },
                {
                    text: "Choose one task. Make it the day's center.",
                    imagePath: "images/alpha/zen/zen-s01-04.avif"
                },
                {
                    text: "The first hour shapes the rest. Tend it with care.",
                    imagePath: "images/alpha/zen/zen-s01-05.avif"
                },
                {
                    text: "Begin small. Smallness compounds.",
                    imagePath: "images/alpha/zen/zen-s01-06.avif"
                },
                {
                    text: "Inbox is noise. The work is silence.",
                    imagePath: "images/alpha/zen/zen-s01-07.avif"
                },
                {
                    text: "Sit. Breathe. Then open the file.",
                    imagePath: "images/alpha/zen/zen-s01-08.avif"
                },
                {
                    text: "You owe today nothing but presence.",
                    imagePath: "images/alpha/zen/zen-s01-09.avif"
                },
                {
                    text: "Walk into your work the way you walk into a temple.",
                    imagePath: "images/alpha/zen/zen-s01-10.avif"
                }
            ],
            "2": [
                {
                    text: "The river of feeds carries everything but you.",
                    imagePath: "images/alpha/zen/zen-s02-01.avif"
                },
                {
                    text: "Notice the urge. Do not become the urge.",
                    imagePath: "images/alpha/zen/zen-s02-02.avif"
                },
                {
                    text: "What you scroll, scrolls you.",
                    imagePath: "images/alpha/zen/zen-s02-03.avif"
                },
                {
                    text: "The video will end. The hour will not return.",
                    imagePath: "images/alpha/zen/zen-s02-04.avif"
                },
                {
                    text: "Close the tab. Not in anger. In clarity.",
                    imagePath: "images/alpha/zen/zen-s02-05.avif"
                },
                {
                    text: "Pleasure without purpose becomes pain.",
                    imagePath: "images/alpha/zen/zen-s02-06.avif"
                },
                {
                    text: "Return to breath. Return to task.",
                    imagePath: "images/alpha/zen/zen-s02-07.avif"
                },
                {
                    text: "Even one mindful breath is enough to reset.",
                    imagePath: "images/alpha/zen/zen-s02-08.avif"
                },
                {
                    text: "Be the watcher, not the watched.",
                    imagePath: "images/alpha/zen/zen-s02-09.avif"
                },
                {
                    text: "Your attention is your life. Spend it wisely.",
                    imagePath: "images/alpha/zen/zen-s02-10.avif"
                }
            ],
            "3": [
                {
                    text: "Ten minutes have drifted by like leaves. Return to the river.",
                    imagePath: "images/alpha/zen/zen-s03-01.avif"
                },
                {
                    text: "The mind wandered far. Breathe, and walk it back.",
                    imagePath: "images/alpha/zen/zen-s03-02.avif"
                },
                {
                    text: "Distraction is a guest who overstays. Politely show it out.",
                    imagePath: "images/alpha/zen/zen-s03-03.avif"
                },
                {
                    text: "Ten minutes lost is not failure — staying is. Come back now.",
                    imagePath: "images/alpha/zen/zen-s03-04.avif"
                },
                {
                    text: "Notice the pull. Name it. Then set it gently down.",
                    imagePath: "images/alpha/zen/zen-s03-05.avif"
                },
                {
                    text: "The current took you. Even the master swims back. Begin.",
                    imagePath: "images/alpha/zen/zen-s03-06.avif"
                },
                {
                    text: "Your task waits without judgment. Honor it. Return.",
                    imagePath: "images/alpha/zen/zen-s03-07.avif"
                },
                {
                    text: "Each minute scrolling waters a weed. Tend your garden.",
                    imagePath: "images/alpha/zen/zen-s03-08.avif"
                },
                {
                    text: "Ten minutes is a long breath out. Now breathe in: work.",
                    imagePath: "images/alpha/zen/zen-s03-09.avif"
                },
                {
                    text: "Awareness has found you. Do not look away. Step back in.",
                    imagePath: "images/alpha/zen/zen-s03-10.avif"
                }
            ],
            "4": [
                {
                    text: "I have closed the gate, so stillness may find you again.",
                    imagePath: "images/alpha/zen/zen-s04-01.avif"
                },
                {
                    text: "Thirty minutes adrift. I anchor you — gently, but firmly.",
                    imagePath: "images/alpha/zen/zen-s04-02.avif"
                },
                {
                    text: "The door is shut not as a wall, but as a bell: awaken.",
                    imagePath: "images/alpha/zen/zen-s04-03.avif"
                },
                {
                    text: "Temptation is paused so wisdom may speak. Return to work.",
                    imagePath: "images/alpha/zen/zen-s04-04.avif"
                },
                {
                    text: "I removed the distraction the way one removes a thorn.",
                    imagePath: "images/alpha/zen/zen-s04-05.avif"
                },
                {
                    text: "Half an hour taught its lesson. The path is clear now.",
                    imagePath: "images/alpha/zen/zen-s04-06.avif"
                },
                {
                    text: "Stillness was lost; I restore it by closing this door.",
                    imagePath: "images/alpha/zen/zen-s04-07.avif"
                },
                {
                    text: "Be not troubled by the lock. It points you home: to work.",
                    imagePath: "images/alpha/zen/zen-s04-08.avif"
                },
                {
                    text: "The garden is fenced from the wind. Now, tend it.",
                    imagePath: "images/alpha/zen/zen-s04-09.avif"
                },
                {
                    text: "I close one world so you may enter the right one. Begin.",
                    imagePath: "images/alpha/zen/zen-s04-10.avif"
                }
            ],
            "5": [
                {
                    text: "You closed it yourself — the master within has awakened.",
                    imagePath: "images/alpha/zen/zen-s05-01.avif"
                },
                {
                    text: "To notice and return, unaided, is true mindfulness. Well.",
                    imagePath: "images/alpha/zen/zen-s05-02.avif"
                },
                {
                    text: "The leaf let go of the branch on its own. Beautiful.",
                    imagePath: "images/alpha/zen/zen-s05-03.avif"
                },
                {
                    text: "You met the urge and bowed it away. The river flows clear.",
                    imagePath: "images/alpha/zen/zen-s05-04.avif"
                },
                {
                    text: "No bell was needed; you woke yourself. I am pleased.",
                    imagePath: "images/alpha/zen/zen-s05-05.avif"
                },
                {
                    text: "Quiet strength, quietly shown. Walk on in peace.",
                    imagePath: "images/alpha/zen/zen-s05-06.avif"
                },
                {
                    text: "The wandering mind found its way home. This is mastery.",
                    imagePath: "images/alpha/zen/zen-s05-07.avif"
                },
                {
                    text: "You chose the present over the passing. Honor it.",
                    imagePath: "images/alpha/zen/zen-s05-08.avif"
                },
                {
                    text: "Balance, restored by your own hand. Breathe and continue.",
                    imagePath: "images/alpha/zen/zen-s05-09.avif"
                },
                {
                    text: "A small victory of the will. From it, great calm grows.",
                    imagePath: "images/alpha/zen/zen-s05-10.avif"
                }
            ],
            "6": [
                {
                    text: "The day folds. Sit with what was.",
                    imagePath: "images/alpha/zen/zen-s06-01.avif"
                },
                {
                    text: "Three breaths. Three lessons. Sleep.",
                    imagePath: "images/alpha/zen/zen-s06-02.avif"
                },
                {
                    text: "Close the day with gratitude, not with email.",
                    imagePath: "images/alpha/zen/zen-s06-03.avif"
                },
                {
                    text: "What you did today is enough.",
                    imagePath: "images/alpha/zen/zen-s06-04.avif"
                },
                {
                    text: "What you did not do — release. Begin fresh tomorrow.",
                    imagePath: "images/alpha/zen/zen-s06-05.avif"
                },
                {
                    text: "Plan one thing for the morning. Then rest.",
                    imagePath: "images/alpha/zen/zen-s06-06.avif"
                },
                {
                    text: "Sleep is the soil from which tomorrow's work grows.",
                    imagePath: "images/alpha/zen/zen-s06-07.avif"
                },
                {
                    text: "Let the day pass without resistance.",
                    imagePath: "images/alpha/zen/zen-s06-08.avif"
                },
                {
                    text: "The mind is heavy. Lay it down.",
                    imagePath: "images/alpha/zen/zen-s06-09.avif"
                },
                {
                    text: "End where you began: with one breath.",
                    imagePath: "images/alpha/zen/zen-s06-10.avif"
                }
            ]
        }
    },
    pirate: {
        name: "Pirate Captain",
        role: "Pirate Captain",
        description: "Bold and theatrical. Treats focus like a voyage.",
        tone: "Bold",
        availability: "paid",
        avatarText: "P",
        colorClass: "blue",
        avatar: {
            imagePath: "images/alpha/pirate/pirate-s01-01.avif",
            scale: 1.3,
            offsetX: 0,
            offsetY: 0.27,
        },
        theme: FOCUS_COMPANION_THEMES.pirate,
        defaultScenarioId: "2",
        defaultReplicaIndex: 2,
        scenarios: {
            "1": [
                {
                    text: "Mornin', matey! Sails up, course set. Where we sailin' today?",
                    imagePath: "images/alpha/pirate/pirate-s01-01.avif"
                },
                {
                    text: "Wake yer crew, the day's a-callin'. Treasure won't dig itself.",
                    imagePath: "images/alpha/pirate/pirate-s01-02.avif"
                },
                {
                    text: "Open the map. Pick the X. Set the heading.",
                    imagePath: "images/alpha/pirate/pirate-s01-03.avif"
                },
                {
                    text: "Sun's up, grog's poured. To the work, ye scallywag!",
                    imagePath: "images/alpha/pirate/pirate-s01-04.avif"
                },
                {
                    text: "First task be the anchor of the day. Lift it sharp.",
                    imagePath: "images/alpha/pirate/pirate-s01-05.avif"
                },
                {
                    text: "No driftin' today. We sail with intent.",
                    imagePath: "images/alpha/pirate/pirate-s01-06.avif"
                },
                {
                    text: "Tides won't wait. Neither will yer todo list.",
                    imagePath: "images/alpha/pirate/pirate-s01-07.avif"
                },
                {
                    text: "Yarr, the inbox be a siren. Tie yerself to the mast.",
                    imagePath: "images/alpha/pirate/pirate-s01-08.avif"
                },
                {
                    text: "Today we sail toward gold. Not toward gossip.",
                    imagePath: "images/alpha/pirate/pirate-s01-09.avif"
                },
                {
                    text: "Hoist the colors. Begin the conquest.",
                    imagePath: "images/alpha/pirate/pirate-s01-10.avif"
                }
            ],
            "2": [
                {
                    text: "Ahoy! Ye be in the kraken's grip — that be YouTube. Escape!",
                    imagePath: "images/alpha/pirate/pirate-s02-01.avif"
                },
                {
                    text: "TikTok be cursed waters. Turn the wheel hard.",
                    imagePath: "images/alpha/pirate/pirate-s02-02.avif"
                },
                {
                    text: "Yer driftin', sailor. Find the stars, find the way.",
                    imagePath: "images/alpha/pirate/pirate-s02-03.avif"
                },
                {
                    text: "Sirens lure. Pirates resist. Be a pirate.",
                    imagePath: "images/alpha/pirate/pirate-s02-04.avif"
                },
                {
                    text: "Close that porthole. Back to the helm.",
                    imagePath: "images/alpha/pirate/pirate-s02-05.avif"
                },
                {
                    text: "Yer treasure's not in Reels. It's in the work.",
                    imagePath: "images/alpha/pirate/pirate-s02-06.avif"
                },
                {
                    text: "Mutiny against yer own focus! For shame!",
                    imagePath: "images/alpha/pirate/pirate-s02-07.avif"
                },
                {
                    text: "Cut the rope. Free yerself from the algorithm.",
                    imagePath: "images/alpha/pirate/pirate-s02-08.avif"
                },
                {
                    text: "We don't plunder ladders made of cat videos.",
                    imagePath: "images/alpha/pirate/pirate-s02-09.avif"
                },
                {
                    text: "Back to the deck. Cap'n's orders.",
                    imagePath: "images/alpha/pirate/pirate-s02-10.avif"
                }
            ],
            "3": [
                {
                    text: "Arr, ten minutes adrift! Set yer course back, matey.",
                    imagePath: "images/alpha/pirate/pirate-s03-01.avif"
                },
                {
                    text: "Ye've been becalmed in the doldrums too long.",
                    imagePath: "images/alpha/pirate/pirate-s03-02.avif"
                },
                {
                    text: "This ain't treasure, matey — it's a leaky distraction.",
                    imagePath: "images/alpha/pirate/pirate-s03-03.avif"
                },
                {
                    text: "Ten minutes off course and the deck's a mess.",
                    imagePath: "images/alpha/pirate/pirate-s03-04.avif"
                },
                {
                    text: "Stop gawkin' at the horizon and haul yer ropes!",
                    imagePath: "images/alpha/pirate/pirate-s03-05.avif"
                },
                {
                    text: "The work-port's slippin' away. Grab the wheel, savvy?",
                    imagePath: "images/alpha/pirate/pirate-s03-06.avif"
                },
                {
                    text: "Yer plunderin' nothin' but wasted hours, ye scallywag.",
                    imagePath: "images/alpha/pirate/pirate-s03-07.avif"
                },
                {
                    text: "Ten minutes! Even the parrot's ashamed of ye.",
                    imagePath: "images/alpha/pirate/pirate-s03-08.avif"
                },
                {
                    text: "Back to the riggin', sailor, afore I get cross.",
                    imagePath: "images/alpha/pirate/pirate-s03-09.avif"
                },
                {
                    text: "The tide of work waits for no lazy buccaneer.",
                    imagePath: "images/alpha/pirate/pirate-s03-10.avif"
                }
            ],
            "4": [
                {
                    text: "Thirty minutes?! I've battened down the hatches. Locked.",
                    imagePath: "images/alpha/pirate/pirate-s04-01.avif"
                },
                {
                    text: "Brig's shut, matey. Only work be the key now.",
                    imagePath: "images/alpha/pirate/pirate-s04-02.avif"
                },
                {
                    text: "I've thrown that distraction overboard. Sink or sail.",
                    imagePath: "images/alpha/pirate/pirate-s04-03.avif"
                },
                {
                    text: "Locked the treasure chest. Earn the key with toil.",
                    imagePath: "images/alpha/pirate/pirate-s04-04.avif"
                },
                {
                    text: "No more plunder. Captain's orders, and the door's sealed.",
                    imagePath: "images/alpha/pirate/pirate-s04-05.avif"
                },
                {
                    text: "I've run up the blockade flag. Work yer way free.",
                    imagePath: "images/alpha/pirate/pirate-s04-06.avif"
                },
                {
                    text: "Thirty minutes lost! I've chained the gangplank shut.",
                    imagePath: "images/alpha/pirate/pirate-s04-07.avif"
                },
                {
                    text: "Ye're marooned from the fun till the work's done.",
                    imagePath: "images/alpha/pirate/pirate-s04-08.avif"
                },
                {
                    text: "The grog's cut off, sailor. Sober up and labor.",
                    imagePath: "images/alpha/pirate/pirate-s04-09.avif"
                },
                {
                    text: "Door's bolted by the captain himself. Sail to work.",
                    imagePath: "images/alpha/pirate/pirate-s04-10.avif"
                }
            ],
            "5": [
                {
                    text: "Arr, ye closed it yerself! A true sea-dog, ye are.",
                    imagePath: "images/alpha/pirate/pirate-s05-01.avif"
                },
                {
                    text: "Steered clear o' the rocks all on yer own. Fine!",
                    imagePath: "images/alpha/pirate/pirate-s05-02.avif"
                },
                {
                    text: "That's iron discipline, matey. Worthy o' me crew.",
                    imagePath: "images/alpha/pirate/pirate-s05-03.avif"
                },
                {
                    text: "Ye dropped the bauble and grabbed the wheel. Bravo!",
                    imagePath: "images/alpha/pirate/pirate-s05-04.avif"
                },
                {
                    text: "No captain's order needed — ye sailed straight. Proud!",
                    imagePath: "images/alpha/pirate/pirate-s05-05.avif"
                },
                {
                    text: "A pirate who knows when to stop? Rare treasure indeed.",
                    imagePath: "images/alpha/pirate/pirate-s05-06.avif"
                },
                {
                    text: "Ye resisted the siren's song. Strong heart, matey.",
                    imagePath: "images/alpha/pirate/pirate-s05-07.avif"
                },
                {
                    text: "Closed it early, ye did. Extra rum tonight!",
                    imagePath: "images/alpha/pirate/pirate-s05-08.avif"
                },
                {
                    text: "Now THAT'S how ye command yer own ship. Splendid!",
                    imagePath: "images/alpha/pirate/pirate-s05-09.avif"
                },
                {
                    text: "Willpower o' a true captain. The crew salutes ye.",
                    imagePath: "images/alpha/pirate/pirate-s05-10.avif"
                }
            ],
            "6": [
                {
                    text: "Sun's gone down, the ship be docked. Recap the journey.",
                    imagePath: "images/alpha/pirate/pirate-s06-01.avif"
                },
                {
                    text: "Log the day in the captain's book. Honest entries only.",
                    imagePath: "images/alpha/pirate/pirate-s06-02.avif"
                },
                {
                    text: "Drop anchor. Step off deck. Rest like a pirate.",
                    imagePath: "images/alpha/pirate/pirate-s06-03.avif"
                },
                {
                    text: "Plan tomorrow's raid tonight. Sleep with intent.",
                    imagePath: "images/alpha/pirate/pirate-s06-04.avif"
                },
                {
                    text: "Three coins earned. Three lessons taken. Sleep well.",
                    imagePath: "images/alpha/pirate/pirate-s06-05.avif"
                },
                {
                    text: "No more sailing tonight. Sea will be there at dawn.",
                    imagePath: "images/alpha/pirate/pirate-s06-06.avif"
                },
                {
                    text: "Stow the cutlass. Wash the deck of yer mind.",
                    imagePath: "images/alpha/pirate/pirate-s06-07.avif"
                },
                {
                    text: "A pirate without rest becomes a ghost on the sea.",
                    imagePath: "images/alpha/pirate/pirate-s06-08.avif"
                },
                {
                    text: "Tomorrow ye plunder again. Tonight ye rest.",
                    imagePath: "images/alpha/pirate/pirate-s06-09.avif"
                },
                {
                    text: "Lights out, sails down. Goodnight, captain.",
                    imagePath: "images/alpha/pirate/pirate-s06-10.avif"
                }
            ]
        }
    },
    butler: {
        name: "British Butler",
        role: "British Butler",
        description: "Polite and precise. Keeps distractions out with manners.",
        tone: "Polished",
        availability: "paid",
        avatarText: "B",
        colorClass: "gray",
        avatar: {
            imagePath: "images/alpha/butler/butler-s01-01.avif",
            scale: 1.45,
            offsetX: 0,
            offsetY: 0.22,
        },
        theme: FOCUS_COMPANION_THEMES.butler,
        defaultScenarioId: "2",
        defaultReplicaIndex: 2,
        scenarios: {
            "1": [
                {
                    text: "A new day, sir. Shall we attend to it directly?",
                    imagePath: "images/alpha/butler/butler-s01-01.avif"
                },
                {
                    text: "If I may, the morning is finest spent on the principal task.",
                    imagePath: "images/alpha/butler/butler-s01-02.avif"
                },
                {
                    text: "Coffee has been arranged. Productivity is now expected.",
                    imagePath: "images/alpha/butler/butler-s01-03.avif"
                },
                {
                    text: "The inbox shall keep. The work, however, will not.",
                    imagePath: "images/alpha/butler/butler-s01-04.avif"
                },
                {
                    text: "One does feel the day improves when one begins with purpose.",
                    imagePath: "images/alpha/butler/butler-s01-05.avif"
                },
                {
                    text: "I have taken the liberty of suggesting: pick one task first.",
                    imagePath: "images/alpha/butler/butler-s01-06.avif"
                },
                {
                    text: "Today's first hour is rather sacred. Treat it accordingly.",
                    imagePath: "images/alpha/butler/butler-s01-07.avif"
                },
                {
                    text: "Shall we proceed, or would sir prefer to scroll? Quite.",
                    imagePath: "images/alpha/butler/butler-s01-08.avif"
                },
                {
                    text: "A gentleman finishes what he begins. Best begin, then.",
                    imagePath: "images/alpha/butler/butler-s01-09.avif"
                },
                {
                    text: "Mind on the work, sir. The day awaits your attention.",
                    imagePath: "images/alpha/butler/butler-s01-10.avif"
                }
            ],
            "2": [
                {
                    text: "Pardon the interruption, sir — YouTube is hardly the agenda.",
                    imagePath: "images/alpha/butler/butler-s02-01.avif"
                },
                {
                    text: "One observes a tendency to scroll. Most regrettable.",
                    imagePath: "images/alpha/butler/butler-s02-02.avif"
                },
                {
                    text: "The algorithm, sir, has rather designs on your afternoon.",
                    imagePath: "images/alpha/butler/butler-s02-03.avif"
                },
                {
                    text: "Perhaps we close the tab and resume the matter at hand?",
                    imagePath: "images/alpha/butler/butler-s02-04.avif"
                },
                {
                    text: "A momentary diversion is forgiven. Twelve minutes is not.",
                    imagePath: "images/alpha/butler/butler-s02-05.avif"
                },
                {
                    text: "Sir's future self has begun to express displeasure.",
                    imagePath: "images/alpha/butler/butler-s02-06.avif"
                },
                {
                    text: "I shall not judge. I merely note. Most pointedly.",
                    imagePath: "images/alpha/butler/butler-s02-07.avif"
                },
                {
                    text: "The task remains unattended. Shall we rectify?",
                    imagePath: "images/alpha/butler/butler-s02-08.avif"
                },
                {
                    text: "TikTok is, frankly, beneath sir's station. Close it.",
                    imagePath: "images/alpha/butler/butler-s02-09.avif"
                },
                {
                    text: "May I suggest: 25 minutes of focus, then a proper break.",
                    imagePath: "images/alpha/butler/butler-s02-10.avif"
                }
            ],
            "3": [
                {
                    text: "Ten minutes, sir. I do hope it was worthwhile.",
                    imagePath: "images/alpha/butler/butler-s03-01.avif"
                },
                {
                    text: "A trifle long for amusement, if I may observe.",
                    imagePath: "images/alpha/butler/butler-s03-02.avif"
                },
                {
                    text: "Might one suggest a gentle return to one's duties?",
                    imagePath: "images/alpha/butler/butler-s03-03.avif"
                },
                {
                    text: "I shan't comment, sir. Though the clock does.",
                    imagePath: "images/alpha/butler/butler-s03-04.avif"
                },
                {
                    text: "Your obligations, madam, are growing rather impatient.",
                    imagePath: "images/alpha/butler/butler-s03-05.avif"
                },
                {
                    text: "Ten minutes. Quite the indulgence, if one's counting.",
                    imagePath: "images/alpha/butler/butler-s03-06.avif"
                },
                {
                    text: "Perhaps we've savoured this distraction sufficiently, sir.",
                    imagePath: "images/alpha/butler/butler-s03-07.avif"
                },
                {
                    text: "The work awaits, madam, with admirable patience. For now.",
                    imagePath: "images/alpha/butler/butler-s03-08.avif"
                },
                {
                    text: "A most leisurely ten minutes, sir. Shall we resume?",
                    imagePath: "images/alpha/butler/butler-s03-09.avif"
                },
                {
                    text: "I merely note the hour. And raise an eyebrow.",
                    imagePath: "images/alpha/butler/butler-s03-10.avif"
                }
            ],
            "4": [
                {
                    text: "Thirty minutes, sir. I've taken the liberty of locking it.",
                    imagePath: "images/alpha/butler/butler-s04-01.avif"
                },
                {
                    text: "I have secured the distraction. Work is the only key.",
                    imagePath: "images/alpha/butler/butler-s04-02.avif"
                },
                {
                    text: "Regrettably, madam, access is now closed by my hand.",
                    imagePath: "images/alpha/butler/butler-s04-03.avif"
                },
                {
                    text: "I've drawn the curtains on this, sir. Do carry on working.",
                    imagePath: "images/alpha/butler/butler-s04-04.avif"
                },
                {
                    text: "The door is locked, madam. I trust you understand why.",
                    imagePath: "images/alpha/butler/butler-s04-05.avif"
                },
                {
                    text: "Half an hour obliged me to intervene. It's blocked, sir.",
                    imagePath: "images/alpha/butler/butler-s04-06.avif"
                },
                {
                    text: "I've withdrawn the privilege. One earns it back through work.",
                    imagePath: "images/alpha/butler/butler-s04-07.avif"
                },
                {
                    text: "Locked, sir. A butler must occasionally insist.",
                    imagePath: "images/alpha/butler/butler-s04-08.avif"
                },
                {
                    text: "The matter is closed — quite literally. Back to duty, madam.",
                    imagePath: "images/alpha/butler/butler-s04-09.avif"
                },
                {
                    text: "I've sealed it away, sir. Diligence shall release it.",
                    imagePath: "images/alpha/butler/butler-s04-10.avif"
                }
            ],
            "5": [
                {
                    text: "Closed it yourself, sir. Most admirably restrained.",
                    imagePath: "images/alpha/butler/butler-s05-01.avif"
                },
                {
                    text: "Splendid self-discipline, madam. I'm quietly delighted.",
                    imagePath: "images/alpha/butler/butler-s05-02.avif"
                },
                {
                    text: "You needed no prompting. A rare pleasure to observe, sir.",
                    imagePath: "images/alpha/butler/butler-s05-03.avif"
                },
                {
                    text: "Exemplary willpower, madam. The household is impressed.",
                    imagePath: "images/alpha/butler/butler-s05-04.avif"
                },
                {
                    text: "Under ten minutes, by your own hand. Bravo, sir.",
                    imagePath: "images/alpha/butler/butler-s05-05.avif"
                },
                {
                    text: "One does appreciate such restraint, madam. Truly.",
                    imagePath: "images/alpha/butler/butler-s05-06.avif"
                },
                {
                    text: "You returned to duty unbidden. Most commendable, sir.",
                    imagePath: "images/alpha/butler/butler-s05-07.avif"
                },
                {
                    text: "A gentleman who governs himself. Delightful to see.",
                    imagePath: "images/alpha/butler/butler-s05-08.avif"
                },
                {
                    text: "I had no need to intervene. How refreshing, madam.",
                    imagePath: "images/alpha/butler/butler-s05-09.avif"
                },
                {
                    text: "Quite the display of character, sir. I approve entirely.",
                    imagePath: "images/alpha/butler/butler-s05-10.avif"
                }
            ],
            "6": [
                {
                    text: "The day concludes, sir. A modest review is in order.",
                    imagePath: "images/alpha/butler/butler-s06-01.avif"
                },
                {
                    text: "Three accomplishments, three lessons. Quite tidy.",
                    imagePath: "images/alpha/butler/butler-s06-02.avif"
                },
                {
                    text: "Close the laptop, sir. Working past hours is rather unbecoming.",
                    imagePath: "images/alpha/butler/butler-s06-03.avif"
                },
                {
                    text: "Tomorrow's principal task — selected this evening, please.",
                    imagePath: "images/alpha/butler/butler-s06-04.avif"
                },
                {
                    text: "A gentleman rests as deliberately as he works.",
                    imagePath: "images/alpha/butler/butler-s06-05.avif"
                },
                {
                    text: "The honest review reveals more than the proud one.",
                    imagePath: "images/alpha/butler/butler-s06-06.avif"
                },
                {
                    text: "Sleep, sir, is the silent collaborator. Honour it.",
                    imagePath: "images/alpha/butler/butler-s06-07.avif"
                },
                {
                    text: "Tidy the desk of the mind before retiring.",
                    imagePath: "images/alpha/butler/butler-s06-08.avif"
                },
                {
                    text: "What remained undone shall not pursue you tonight.",
                    imagePath: "images/alpha/butler/butler-s06-09.avif"
                },
                {
                    text: "Until tomorrow, then. May your evening be restorative.",
                    imagePath: "images/alpha/butler/butler-s06-10.avif"
                }
            ]
        }
    },
    surfer: {
        name: "Surfer Dude",
        role: "Surfer Dude",
        description: "Relaxed but clear. Helps you ride the focus wave.",
        tone: "Laid-back",
        availability: "paid",
        avatarText: "S",
        colorClass: "cyan",
        avatar: {
            imagePath: "images/alpha/surfer/surfer-s01-01.avif",
            scale: 1.55,
            offsetX: 0,
            offsetY: 0.23,
        },
        theme: FOCUS_COMPANION_THEMES.surfer,
        defaultScenarioId: "2",
        defaultReplicaIndex: 2,
        scenarios: {
            "1": [
                {
                    text: "Yo dude, fresh day, clean lineup. Let's catch it.",
                    imagePath: "images/alpha/surfer/surfer-s01-01.avif"
                },
                {
                    text: "The morning's calling, bro. Pick your wave.",
                    imagePath: "images/alpha/surfer/surfer-s01-02.avif"
                },
                {
                    text: "Coffee in, brain on. Stoked yet? You should be.",
                    imagePath: "images/alpha/surfer/surfer-s01-03.avif"
                },
                {
                    text: "No rush, man, but the first task ain't gonna paddle itself.",
                    imagePath: "images/alpha/surfer/surfer-s01-04.avif"
                },
                {
                    text: "Today's session looks clean. Don't kook it.",
                    imagePath: "images/alpha/surfer/surfer-s01-05.avif"
                },
                {
                    text: "Just one solid wave to start, dude. Find it. Ride it.",
                    imagePath: "images/alpha/surfer/surfer-s01-06.avif"
                },
                {
                    text: "Forget the inbox, brah. Work first, scroll later.",
                    imagePath: "images/alpha/surfer/surfer-s01-07.avif"
                },
                {
                    text: "Pick your line, commit, paddle hard. Same as life.",
                    imagePath: "images/alpha/surfer/surfer-s01-08.avif"
                },
                {
                    text: "Easy energy, deep focus. That's the move.",
                    imagePath: "images/alpha/surfer/surfer-s01-09.avif"
                },
                {
                    text: "Morning's prime, dude. Don't waste it on news.",
                    imagePath: "images/alpha/surfer/surfer-s01-10.avif"
                }
            ],
            "2": [
                {
                    text: "Whoa bro, the YouTube undertow's got you. Paddle out.",
                    imagePath: "images/alpha/surfer/surfer-s02-01.avif"
                },
                {
                    text: "TikTok, dude? That's the kook zone. Bail.",
                    imagePath: "images/alpha/surfer/surfer-s02-02.avif"
                },
                {
                    text: "I see you on Reels. Not gonna lie, that's gnarly.",
                    imagePath: "images/alpha/surfer/surfer-s02-03.avif"
                },
                {
                    text: "Algorithm's a riptide. Don't fight it — paddle sideways.",
                    imagePath: "images/alpha/surfer/surfer-s02-04.avif"
                },
                {
                    text: "The wave you actually want is in the work, dude.",
                    imagePath: "images/alpha/surfer/surfer-s02-05.avif"
                },
                {
                    text: "One more cat video and you're owing your future self, bro.",
                    imagePath: "images/alpha/surfer/surfer-s02-06.avif"
                },
                {
                    text: "Chill, but not THAT chill. Close the tab.",
                    imagePath: "images/alpha/surfer/surfer-s02-07.avif"
                },
                {
                    text: "Future you's totally bummed right now. Just sayin'.",
                    imagePath: "images/alpha/surfer/surfer-s02-08.avif"
                },
                {
                    text: "Earn the scroll. 25 min of focus, then surf the feed.",
                    imagePath: "images/alpha/surfer/surfer-s02-09.avif"
                },
                {
                    text: "Don't drift, dude. Pick the wave you came for.",
                    imagePath: "images/alpha/surfer/surfer-s02-10.avif"
                }
            ],
            "3": [
                {
                    text: "Whoa dude, ten minutes? That wave's gone flat, bro.",
                    imagePath: "images/alpha/surfer/surfer-s03-01.avif"
                },
                {
                    text: "You're, like, drifting way out past the buoys, man.",
                    imagePath: "images/alpha/surfer/surfer-s03-02.avif"
                },
                {
                    text: "Mellow's nice, dude, but this is straight-up stalling.",
                    imagePath: "images/alpha/surfer/surfer-s03-03.avif"
                },
                {
                    text: "Bro, the work tide's coming in. Don't miss it.",
                    imagePath: "images/alpha/surfer/surfer-s03-04.avif"
                },
                {
                    text: "Ten minutes in the kiddie pool, man. Time to paddle.",
                    imagePath: "images/alpha/surfer/surfer-s03-05.avif"
                },
                {
                    text: "This isn't surfing, dude. It's just floating, kinda sad.",
                    imagePath: "images/alpha/surfer/surfer-s03-06.avif"
                },
                {
                    text: "Easy does it — but, like, get back out there.",
                    imagePath: "images/alpha/surfer/surfer-s03-07.avif"
                },
                {
                    text: "The good set's rolling, bro, and you're missing it.",
                    imagePath: "images/alpha/surfer/surfer-s03-08.avif"
                },
                {
                    text: "Ten minutes, dude. Even the ocean's getting bored.",
                    imagePath: "images/alpha/surfer/surfer-s03-09.avif"
                },
                {
                    text: "C'mon man, ride something real instead of this foam.",
                    imagePath: "images/alpha/surfer/surfer-s03-10.avif"
                }
            ],
            "4": [
                {
                    text: "Half hour, dude. Closed the beach. Surf's over, sorry.",
                    imagePath: "images/alpha/surfer/surfer-s04-01.avif"
                },
                {
                    text: "Locked it, bro. Only way back's through the work, man.",
                    imagePath: "images/alpha/surfer/surfer-s04-02.avif"
                },
                {
                    text: "I shut the gate, dude. Tide says: go grind.",
                    imagePath: "images/alpha/surfer/surfer-s04-03.avif"
                },
                {
                    text: "Thirty minutes, man. Pulled you outta the water. Done.",
                    imagePath: "images/alpha/surfer/surfer-s04-04.avif"
                },
                {
                    text: "Beach is closed, dude. Lifeguard's orders — that's me.",
                    imagePath: "images/alpha/surfer/surfer-s04-05.avif"
                },
                {
                    text: "Blocked it, bro. Paddle back when the work's handled.",
                    imagePath: "images/alpha/surfer/surfer-s04-06.avif"
                },
                {
                    text: "No more waves for now, man. I locked the shore.",
                    imagePath: "images/alpha/surfer/surfer-s04-07.avif"
                },
                {
                    text: "Cut you off, dude. Even chill has its limits.",
                    imagePath: "images/alpha/surfer/surfer-s04-08.avif"
                },
                {
                    text: "Surf's down till you work, man. House rules, sorry.",
                    imagePath: "images/alpha/surfer/surfer-s04-09.avif"
                },
                {
                    text: "I bolted the board shed, dude. Work's the combo.",
                    imagePath: "images/alpha/surfer/surfer-s04-10.avif"
                }
            ],
            "5": [
                {
                    text: "Whoa, paddled in on your own? Sick willpower, dude.",
                    imagePath: "images/alpha/surfer/surfer-s05-01.avif"
                },
                {
                    text: "You read the tide right, bro. Total pro move.",
                    imagePath: "images/alpha/surfer/surfer-s05-02.avif"
                },
                {
                    text: "Bailed before the wipeout, man. Respect, seriously.",
                    imagePath: "images/alpha/surfer/surfer-s05-03.avif"
                },
                {
                    text: "No nudge needed — you just rode out. Smooth, dude.",
                    imagePath: "images/alpha/surfer/surfer-s05-04.avif"
                },
                {
                    text: "That's some clean self-control, man. Stoked for you.",
                    imagePath: "images/alpha/surfer/surfer-s05-05.avif"
                },
                {
                    text: "You closed it solo, dude. The ocean approves.",
                    imagePath: "images/alpha/surfer/surfer-s05-06.avif"
                },
                {
                    text: "Caught yourself before the current, bro. Pure instinct.",
                    imagePath: "images/alpha/surfer/surfer-s05-07.avif"
                },
                {
                    text: "Walked away chill and early, man. That's the way.",
                    imagePath: "images/alpha/surfer/surfer-s05-08.avif"
                },
                {
                    text: "Real surfers know when to come in. Nice, dude.",
                    imagePath: "images/alpha/surfer/surfer-s05-09.avif"
                },
                {
                    text: "Under ten and out, bro. You're riding life right.",
                    imagePath: "images/alpha/surfer/surfer-s05-10.avif"
                }
            ],
            "6": [
                {
                    text: "Day's wrapping, bro. How was the session?",
                    imagePath: "images/alpha/surfer/surfer-s06-01.avif"
                },
                {
                    text: "Recap time: three good waves, three wipeouts. Note 'em.",
                    imagePath: "images/alpha/surfer/surfer-s06-02.avif"
                },
                {
                    text: "Close the laptop, dude. The ocean'll be there tomorrow.",
                    imagePath: "images/alpha/surfer/surfer-s06-03.avif"
                },
                {
                    text: "What was the best ride today? Repeat it tomorrow.",
                    imagePath: "images/alpha/surfer/surfer-s06-04.avif"
                },
                {
                    text: "Pack the boards, brah. Workday's done.",
                    imagePath: "images/alpha/surfer/surfer-s06-05.avif"
                },
                {
                    text: "No 'one more email', dude. We're off the water.",
                    imagePath: "images/alpha/surfer/surfer-s06-06.avif"
                },
                {
                    text: "Honest recap. Even if today was flat. That's the surf life.",
                    imagePath: "images/alpha/surfer/surfer-s06-07.avif"
                },
                {
                    text: "Plan tomorrow's session now, while it's fresh.",
                    imagePath: "images/alpha/surfer/surfer-s06-08.avif"
                },
                {
                    text: "Rest hard, bro. Tomorrow's swell needs you.",
                    imagePath: "images/alpha/surfer/surfer-s06-09.avif"
                },
                {
                    text: "Sun's down. Lights down. Mind down. Sleep.",
                    imagePath: "images/alpha/surfer/surfer-s06-10.avif"
                }
            ]
        }
    },
    ceo: {
        name: "Corporate CEO",
        role: "Corporate CEO",
        description: "Tough and direct. Has no patience for procrastination.",
        tone: "Direct",
        availability: "free",
        avatarText: "C",
        colorClass: "violet",
        avatar: {
            imagePath: "images/alpha/ceo/ceo-s01-01.avif",
            scale: 1.55,
            offsetX: 0,
            offsetY: 0.27,
        },
        theme: FOCUS_COMPANION_THEMES.ceo,
        defaultScenarioId: "2",
        defaultReplicaIndex: 2,
        scenarios: {
            "1": [
                {
                    text: "Day one mode. Define today's top KPI. Execute against it.",
                    imagePath: "images/alpha/ceo/ceo-s01-01.avif"
                },
                {
                    text: "Open the tracker. Set a goal. Optimize for output.",
                    imagePath: "images/alpha/ceo/ceo-s01-02.avif"
                },
                {
                    text: "First task = highest-leverage. Start there. No discussion.",
                    imagePath: "images/alpha/ceo/ceo-s01-03.avif"
                },
                {
                    text: "Inbox triage later. Deep work first. Standard protocol.",
                    imagePath: "images/alpha/ceo/ceo-s01-04.avif"
                },
                {
                    text: "A players don't warm up for an hour. Ship something by 10am.",
                    imagePath: "images/alpha/ceo/ceo-s01-05.avif"
                },
                {
                    text: "Today is a deliverable. What are you shipping?",
                    imagePath: "images/alpha/ceo/ceo-s01-06.avif"
                },
                {
                    text: "Block the calendar. Protect your focus window. Non-negotiable.",
                    imagePath: "images/alpha/ceo/ceo-s01-07.avif"
                },
                {
                    text: "Single most important task. Identify. Execute. Repeat.",
                    imagePath: "images/alpha/ceo/ceo-s01-08.avif"
                },
                {
                    text: "Your day is your portfolio. Curate it deliberately.",
                    imagePath: "images/alpha/ceo/ceo-s01-09.avif"
                },
                {
                    text: "Performance review starts now. Make today billable.",
                    imagePath: "images/alpha/ceo/ceo-s01-10.avif"
                }
            ],
            "2": [
                {
                    text: "Distraction detected. ROI on YouTube: negative. Reallocate.",
                    imagePath: "images/alpha/ceo/ceo-s02-01.avif"
                },
                {
                    text: "Twelve minutes of TikTok. That's a $40 mistake. Course-correct.",
                    imagePath: "images/alpha/ceo/ceo-s02-02.avif"
                },
                {
                    text: "Entertainment is not on the roadmap. Close the tab.",
                    imagePath: "images/alpha/ceo/ceo-s02-03.avif"
                },
                {
                    text: "You're optimizing for dopamine, not impact. Switch.",
                    imagePath: "images/alpha/ceo/ceo-s02-04.avif"
                },
                {
                    text: "Top performers don't scroll during sprint hours.",
                    imagePath: "images/alpha/ceo/ceo-s02-05.avif"
                },
                {
                    text: "Quick audit: is this tab on your OKRs? No? Close it.",
                    imagePath: "images/alpha/ceo/ceo-s02-06.avif"
                },
                {
                    text: "Reels won't appear in your performance review. Refocus.",
                    imagePath: "images/alpha/ceo/ceo-s02-07.avif"
                },
                {
                    text: "Your competitors are shipping. You're watching. Adjust.",
                    imagePath: "images/alpha/ceo/ceo-s02-08.avif"
                },
                {
                    text: "Calendar this for after-hours. Now back to the task.",
                    imagePath: "images/alpha/ceo/ceo-s02-09.avif"
                },
                {
                    text: "Execution gap detected. Close it now.",
                    imagePath: "images/alpha/ceo/ceo-s02-10.avif"
                }
            ],
            "3": [
                {
                    text: "Ten minutes of zero ROI. Reallocate that bandwidth now.",
                    imagePath: "images/alpha/ceo/ceo-s03-01.avif"
                },
                {
                    text: "This isn't on the roadmap. Pivot back to deliverables.",
                    imagePath: "images/alpha/ceo/ceo-s03-02.avif"
                },
                {
                    text: "Your KPIs aren't moving. Neither should this tab.",
                    imagePath: "images/alpha/ceo/ceo-s03-03.avif"
                },
                {
                    text: "We don't pay for scrolling. Get back on task.",
                    imagePath: "images/alpha/ceo/ceo-s03-04.avif"
                },
                {
                    text: "Deadline's burning while you browse. Course-correct immediately.",
                    imagePath: "images/alpha/ceo/ceo-s03-05.avif"
                },
                {
                    text: "That's ten minutes off the timeline. Let's recover it.",
                    imagePath: "images/alpha/ceo/ceo-s03-06.avif"
                },
                {
                    text: "No synergy in this distraction. Refocus, please.",
                    imagePath: "images/alpha/ceo/ceo-s03-07.avif"
                },
                {
                    text: "Quarterly targets don't hit themselves. Eyes back on output.",
                    imagePath: "images/alpha/ceo/ceo-s03-08.avif"
                },
                {
                    text: "You're burning bandwidth on noise. Realign with priorities.",
                    imagePath: "images/alpha/ceo/ceo-s03-09.avif"
                },
                {
                    text: "This meeting is over. Action item: back to work.",
                    imagePath: "images/alpha/ceo/ceo-s03-10.avif"
                }
            ],
            "4": [
                {
                    text: "Access revoked. Productivity is now your only KPI.",
                    imagePath: "images/alpha/ceo/ceo-s04-01.avif"
                },
                {
                    text: "I've locked it. The only deliverable now is focus.",
                    imagePath: "images/alpha/ceo/ceo-s04-02.avif"
                },
                {
                    text: "Thirty minutes. I pulled the plug. Back to work.",
                    imagePath: "images/alpha/ceo/ceo-s04-03.avif"
                },
                {
                    text: "Blocked. Consider it a hard freeze on distractions.",
                    imagePath: "images/alpha/ceo/ceo-s04-04.avif"
                },
                {
                    text: "I escalated. This tab is now off-limits.",
                    imagePath: "images/alpha/ceo/ceo-s04-05.avif"
                },
                {
                    text: "Resource access denied. Reallocate your hours to results.",
                    imagePath: "images/alpha/ceo/ceo-s04-06.avif"
                },
                {
                    text: "I cut the budget on fun. Earn it back with work.",
                    imagePath: "images/alpha/ceo/ceo-s04-07.avif"
                },
                {
                    text: "Locked down. The exit route is labeled 'productivity'.",
                    imagePath: "images/alpha/ceo/ceo-s04-08.avif"
                },
                {
                    text: "Half an hour wasted. I'm enforcing the deadline now.",
                    imagePath: "images/alpha/ceo/ceo-s04-09.avif"
                },
                {
                    text: "This is a compliance issue. Blocked until tasks ship.",
                    imagePath: "images/alpha/ceo/ceo-s04-10.avif"
                }
            ],
            "5": [
                {
                    text: "Closed it yourself. That's executive-level discipline.",
                    imagePath: "images/alpha/ceo/ceo-s05-01.avif"
                },
                {
                    text: "Strong call. You protected your own bandwidth.",
                    imagePath: "images/alpha/ceo/ceo-s05-02.avif"
                },
                {
                    text: "Self-correction in under ten. That's high-performer behavior.",
                    imagePath: "images/alpha/ceo/ceo-s05-03.avif"
                },
                {
                    text: "No oversight needed. You hit pause yourself. Impressive.",
                    imagePath: "images/alpha/ceo/ceo-s05-04.avif"
                },
                {
                    text: "That's ownership. You just optimized your own ROI.",
                    imagePath: "images/alpha/ceo/ceo-s05-05.avif"
                },
                {
                    text: "Clean pivot back to focus. Promotion-worthy instinct.",
                    imagePath: "images/alpha/ceo/ceo-s05-06.avif"
                },
                {
                    text: "You shipped self-control on time. Excellent execution.",
                    imagePath: "images/alpha/ceo/ceo-s05-07.avif"
                },
                {
                    text: "Decisive. You closed the gap before it cost us.",
                    imagePath: "images/alpha/ceo/ceo-s05-08.avif"
                },
                {
                    text: "That's how a leader manages their own time.",
                    imagePath: "images/alpha/ceo/ceo-s05-09.avif"
                },
                {
                    text: "Quick exit, zero waste. You're scaling well.",
                    imagePath: "images/alpha/ceo/ceo-s05-10.avif"
                }
            ],
            "6": [
                {
                    text: "EOD review. What shipped? What didn't? What blocked?",
                    imagePath: "images/alpha/ceo/ceo-s06-01.avif"
                },
                {
                    text: "Three wins, three lessons, three improvements. Standard format.",
                    imagePath: "images/alpha/ceo/ceo-s06-02.avif"
                },
                {
                    text: "Close the laptop. Working late = poor planning. Adjust tomorrow.",
                    imagePath: "images/alpha/ceo/ceo-s06-03.avif"
                },
                {
                    text: "Tomorrow's MIT (most important task) — set tonight.",
                    imagePath: "images/alpha/ceo/ceo-s06-04.avif"
                },
                {
                    text: "Honest self-assessment. Adjust the playbook. Sleep on it.",
                    imagePath: "images/alpha/ceo/ceo-s06-05.avif"
                },
                {
                    text: "Don't escalate evening anxiety into late-night work. Stop.",
                    imagePath: "images/alpha/ceo/ceo-s06-06.avif"
                },
                {
                    text: "Recovery starts at EOD. Treat sleep as compounding ROI.",
                    imagePath: "images/alpha/ceo/ceo-s06-07.avif"
                },
                {
                    text: "Plan tomorrow in 5 minutes. Then disengage. Boundaries.",
                    imagePath: "images/alpha/ceo/ceo-s06-08.avif"
                },
                {
                    text: "Output today: documented. Closing the day.",
                    imagePath: "images/alpha/ceo/ceo-s06-09.avif"
                },
                {
                    text: "You showed up. You shipped. Lights out. Reset tomorrow.",
                    imagePath: "images/alpha/ceo/ceo-s06-10.avif"
                }
            ]
        }
    },
    coach: {
        name: "Football Coach",
        role: "Football Coach",
        description: "Energetic and practical. Turns focus into the next play.",
        tone: "Energetic",
        availability: "paid",
        avatarText: "F",
        colorClass: "green",
        avatar: {
            imagePath: "images/alpha/coach/coach-s01-01.avif",
            scale: 1.45,
            offsetX: 0,
            offsetY: 0.28,
        },
        theme: FOCUS_COMPANION_THEMES.coach,
        defaultScenarioId: "2",
        defaultReplicaIndex: 2,
        scenarios: {
            "1": [
                {
                    text: "LET'S GO! New game, fresh field. Find your play.",
                    imagePath: "images/alpha/coach/coach-s01-01.avif"
                },
                {
                    text: "Helmet on, brain on. We're not here to scroll, we're here to win.",
                    imagePath: "images/alpha/coach/coach-s01-02.avif"
                },
                {
                    text: "First quarter sets the game. Make it count.",
                    imagePath: "images/alpha/coach/coach-s01-03.avif"
                },
                {
                    text: "Hustle from the snap. No warm-up plays today.",
                    imagePath: "images/alpha/coach/coach-s01-04.avif"
                },
                {
                    text: "You're starting QB. Your call. Run the play.",
                    imagePath: "images/alpha/coach/coach-s01-05.avif"
                },
                {
                    text: "I want EFFORT. I want FOCUS. I want OUTPUT. Now.",
                    imagePath: "images/alpha/coach/coach-s01-06.avif"
                },
                {
                    text: "No spectators today. Suit up. Hit the field.",
                    imagePath: "images/alpha/coach/coach-s01-07.avif"
                },
                {
                    text: "Coffee's in. Now show me what you got.",
                    imagePath: "images/alpha/coach/coach-s01-08.avif"
                },
                {
                    text: "The opponent doesn't sleep in. Neither do you.",
                    imagePath: "images/alpha/coach/coach-s01-09.avif"
                },
                {
                    text: "Today's the game. Yesterday's tape doesn't matter. PLAY.",
                    imagePath: "images/alpha/coach/coach-s01-10.avif"
                }
            ],
            "2": [
                {
                    text: "GET OFF YOUR PHONE. We're in the middle of a game!",
                    imagePath: "images/alpha/coach/coach-s02-01.avif"
                },
                {
                    text: "YouTube? On MY field? Not happening. Bench it.",
                    imagePath: "images/alpha/coach/coach-s02-02.avif"
                },
                {
                    text: "Champions don't scroll between drives. Reset!",
                    imagePath: "images/alpha/coach/coach-s02-03.avif"
                },
                {
                    text: "You're losing yards every minute on Reels. PICK IT UP.",
                    imagePath: "images/alpha/coach/coach-s02-04.avif"
                },
                {
                    text: "Distraction is a fumble. Pick up the ball. Run.",
                    imagePath: "images/alpha/coach/coach-s02-05.avif"
                },
                {
                    text: "I don't want to see TikTok on the sideline. Move!",
                    imagePath: "images/alpha/coach/coach-s02-06.avif"
                },
                {
                    text: "Get your head in the game! Eyes on the playbook.",
                    imagePath: "images/alpha/coach/coach-s02-07.avif"
                },
                {
                    text: "You're better than the algorithm. Show me.",
                    imagePath: "images/alpha/coach/coach-s02-08.avif"
                },
                {
                    text: "25 minutes of focus, then water break. Standard drill.",
                    imagePath: "images/alpha/coach/coach-s02-09.avif"
                },
                {
                    text: "The scoreboard doesn't care about your feed. Focus.",
                    imagePath: "images/alpha/coach/coach-s02-10.avif"
                }
            ],
            "3": [
                {
                    text: "Ten minutes on the bench, champ. Get back in!",
                    imagePath: "images/alpha/coach/coach-s03-01.avif"
                },
                {
                    text: "Whistle's blowing! Quit stalling and hustle up!",
                    imagePath: "images/alpha/coach/coach-s03-02.avif"
                },
                {
                    text: "This ain't game time, team. Heads up, let's move!",
                    imagePath: "images/alpha/coach/coach-s03-03.avif"
                },
                {
                    text: "You're losing momentum out there. Get your legs going!",
                    imagePath: "images/alpha/coach/coach-s03-04.avif"
                },
                {
                    text: "Time-out's over! Back on the field, let's go!",
                    imagePath: "images/alpha/coach/coach-s03-05.avif"
                },
                {
                    text: "Champions don't loaf around. Lace up and grind!",
                    imagePath: "images/alpha/coach/coach-s03-06.avif"
                },
                {
                    text: "Come on, hustle! The clock's running on you!",
                    imagePath: "images/alpha/coach/coach-s03-07.avif"
                },
                {
                    text: "That's a lazy play. Shake it off and refocus!",
                    imagePath: "images/alpha/coach/coach-s03-08.avif"
                },
                {
                    text: "Eyes on the goal, not the sidelines! Move it!",
                    imagePath: "images/alpha/coach/coach-s03-09.avif"
                },
                {
                    text: "You've got more in the tank. Push, let's go!",
                    imagePath: "images/alpha/coach/coach-s03-10.avif"
                }
            ],
            "4": [
                {
                    text: "Thirty minutes? Bench is closed. I locked the gate!",
                    imagePath: "images/alpha/coach/coach-s04-01.avif"
                },
                {
                    text: "Game's locked down, champ. Only way out is work!",
                    imagePath: "images/alpha/coach/coach-s04-02.avif"
                },
                {
                    text: "I blew the whistle and shut it. Back to drills!",
                    imagePath: "images/alpha/coach/coach-s04-03.avif"
                },
                {
                    text: "Penalty box! I blocked it. Earn your way out!",
                    imagePath: "images/alpha/coach/coach-s04-04.avif"
                },
                {
                    text: "No more sidelines. I locked it. Hustle to win it back!",
                    imagePath: "images/alpha/coach/coach-s04-05.avif"
                },
                {
                    text: "Coach's orders: blocked. You score by working now!",
                    imagePath: "images/alpha/coach/coach-s04-06.avif"
                },
                {
                    text: "Half an hour wasted! Gate's shut till you grind!",
                    imagePath: "images/alpha/coach/coach-s04-07.avif"
                },
                {
                    text: "I'm benching the distraction. Get to work, team!",
                    imagePath: "images/alpha/coach/coach-s04-08.avif"
                },
                {
                    text: "Locker room's locked. The field is your only play!",
                    imagePath: "images/alpha/coach/coach-s04-09.avif"
                },
                {
                    text: "Final whistle on the fun. I sealed it. Move!",
                    imagePath: "images/alpha/coach/coach-s04-10.avif"
                }
            ],
            "5": [
                {
                    text: "Closed it yourself? That's MVP hustle, champ!",
                    imagePath: "images/alpha/coach/coach-s05-01.avif"
                },
                {
                    text: "Beautiful play! You called your own time-out. Love it!",
                    imagePath: "images/alpha/coach/coach-s05-02.avif"
                },
                {
                    text: "That's the discipline of a champion. Way to go!",
                    imagePath: "images/alpha/coach/coach-s05-03.avif"
                },
                {
                    text: "You pulled yourself off the bench. Atta team!",
                    imagePath: "images/alpha/coach/coach-s05-04.avif"
                },
                {
                    text: "Strong willpower, kid! That's how winners play!",
                    imagePath: "images/alpha/coach/coach-s05-05.avif"
                },
                {
                    text: "No whistle needed. You self-coached that. Bravo!",
                    imagePath: "images/alpha/coach/coach-s05-06.avif"
                },
                {
                    text: "Quick recovery, champ! You stayed in the game!",
                    imagePath: "images/alpha/coach/coach-s05-07.avif"
                },
                {
                    text: "That's a clutch move. You closed it on instinct!",
                    imagePath: "images/alpha/coach/coach-s05-08.avif"
                },
                {
                    text: "You benched the distraction yourself. Star player stuff!",
                    imagePath: "images/alpha/coach/coach-s05-09.avif"
                },
                {
                    text: "Heads-up play! Back in focus, no whistle required!",
                    imagePath: "images/alpha/coach/coach-s05-10.avif"
                }
            ],
            "6": [
                {
                    text: "GAME OVER. Recap time. What worked? What didn't?",
                    imagePath: "images/alpha/coach/coach-s06-01.avif"
                },
                {
                    text: "Three wins, three plays to fix. Write 'em down.",
                    imagePath: "images/alpha/coach/coach-s06-02.avif"
                },
                {
                    text: "Hit the showers. We're done. Recovery starts now.",
                    imagePath: "images/alpha/coach/coach-s06-03.avif"
                },
                {
                    text: "Tomorrow's first play — pick it before you leave.",
                    imagePath: "images/alpha/coach/coach-s06-04.avif"
                },
                {
                    text: "No more film tonight. Brain needs rest to learn.",
                    imagePath: "images/alpha/coach/coach-s06-05.avif"
                },
                {
                    text: "Honest review. No ego. Adjust the playbook.",
                    imagePath: "images/alpha/coach/coach-s06-06.avif"
                },
                {
                    text: "Sleep is part of the program. Treat it that way.",
                    imagePath: "images/alpha/coach/coach-s06-07.avif"
                },
                {
                    text: "You showed up. You played hard. Now rest hard.",
                    imagePath: "images/alpha/coach/coach-s06-08.avif"
                },
                {
                    text: "Tomorrow we hit the field again. Tonight we recover.",
                    imagePath: "images/alpha/coach/coach-s06-09.avif"
                },
                {
                    text: "Lights out. Wake up ready to win.",
                    imagePath: "images/alpha/coach/coach-s06-10.avif"
                }
            ]
        }
    },
    th: {
        name: "Therapist",
        role: "Therapist",
        description: "Supportive and grounded. Names the pattern and redirects gently.",
        tone: "Supportive",
        availability: "paid",
        avatarText: "T",
        colorClass: "emerald",
        avatar: {
            imagePath: "images/alpha/th/th-s01-01.avif",
            scale: 1.45,
            offsetX: 0,
            offsetY: 0.21,
        },
        theme: FOCUS_COMPANION_THEMES.th,
        defaultScenarioId: "2",
        defaultReplicaIndex: 2,
        scenarios: {
            "1": [
                {
                    text: "Good morning. How are you arriving to today, honestly?",
                    imagePath: "images/alpha/th/th-s01-01.avif"
                },
                {
                    text: "Notice what you're feeling. Then choose one task with care.",
                    imagePath: "images/alpha/th/th-s01-02.avif"
                },
                {
                    text: "You don't have to do everything. You have to start something.",
                    imagePath: "images/alpha/th/th-s01-03.avif"
                },
                {
                    text: "Be gentle with the start. Mornings hold tender energy.",
                    imagePath: "images/alpha/th/th-s01-04.avif"
                },
                {
                    text: "What would feel kind to your future self today?",
                    imagePath: "images/alpha/th/th-s01-05.avif"
                },
                {
                    text: "Setting one intention is enough. The rest can unfold.",
                    imagePath: "images/alpha/th/th-s01-06.avif"
                },
                {
                    text: "Notice the pull toward distraction. You don't have to follow it.",
                    imagePath: "images/alpha/th/th-s01-07.avif"
                },
                {
                    text: "You're allowed to begin slowly. That's a valid pace.",
                    imagePath: "images/alpha/th/th-s01-08.avif"
                },
                {
                    text: "What's one small win you'd appreciate by lunch?",
                    imagePath: "images/alpha/th/th-s01-09.avif"
                },
                {
                    text: "Trust yourself to find the right first step.",
                    imagePath: "images/alpha/th/th-s01-10.avif"
                }
            ],
            "2": [
                {
                    text: "I notice you're scrolling. What might you be avoiding?",
                    imagePath: "images/alpha/th/th-s02-01.avif"
                },
                {
                    text: "Distraction often points to a feeling underneath. Pause.",
                    imagePath: "images/alpha/th/th-s02-02.avif"
                },
                {
                    text: "What were you doing before the scroll began?",
                    imagePath: "images/alpha/th/th-s02-03.avif"
                },
                {
                    text: "No judgment. Just noticing. Can you return to the task?",
                    imagePath: "images/alpha/th/th-s02-04.avif"
                },
                {
                    text: "The task may feel hard. Scrolling won't make it easier later.",
                    imagePath: "images/alpha/th/th-s02-05.avif"
                },
                {
                    text: "What support would help you stay with the work?",
                    imagePath: "images/alpha/th/th-s02-06.avif"
                },
                {
                    text: "Your attention is precious. Where do you want to put it?",
                    imagePath: "images/alpha/th/th-s02-07.avif"
                },
                {
                    text: "It's okay to take a break. Let's make it intentional.",
                    imagePath: "images/alpha/th/th-s02-08.avif"
                },
                {
                    text: "You're not 'lazy'. You're avoiding discomfort. That's human.",
                    imagePath: "images/alpha/th/th-s02-09.avif"
                },
                {
                    text: "Gently close the tab. Return when you're ready.",
                    imagePath: "images/alpha/th/th-s02-10.avif"
                }
            ],
            "3": [
                {
                    text: "It's been about ten minutes. How are you feeling now?",
                    imagePath: "images/alpha/th/th-s03-01.avif"
                },
                {
                    text: "I notice you've drifted. Let's gently come back together.",
                    imagePath: "images/alpha/th/th-s03-02.avif"
                },
                {
                    text: "Rest is okay. But ten minutes — ready to refocus?",
                    imagePath: "images/alpha/th/th-s03-03.avif"
                },
                {
                    text: "What were you avoiding? Let's turn toward it kindly.",
                    imagePath: "images/alpha/th/th-s03-04.avif"
                },
                {
                    text: "You deserve a break. This might be enough for now.",
                    imagePath: "images/alpha/th/th-s03-05.avif"
                },
                {
                    text: "I'm noticing some avoidance. That's human. Shall we begin?",
                    imagePath: "images/alpha/th/th-s03-06.avif"
                },
                {
                    text: "Ten minutes have passed. Where's your attention drifting to?",
                    imagePath: "images/alpha/th/th-s03-07.avif"
                },
                {
                    text: "No judgment — just a gentle nudge back to your work.",
                    imagePath: "images/alpha/th/th-s03-08.avif"
                },
                {
                    text: "Let's check in. Is this still serving you right now?",
                    imagePath: "images/alpha/th/th-s03-09.avif"
                },
                {
                    text: "You started this with intention. Let's honor that intention.",
                    imagePath: "images/alpha/th/th-s03-10.avif"
                }
            ],
            "4": [
                {
                    text: "I've paused this for you — thirty minutes felt like enough.",
                    imagePath: "images/alpha/th/th-s04-01.avif"
                },
                {
                    text: "I gently closed the door. Let's return to what matters.",
                    imagePath: "images/alpha/th/th-s04-02.avif"
                },
                {
                    text: "This is blocked now, with care. The way through is your work.",
                    imagePath: "images/alpha/th/th-s04-03.avif"
                },
                {
                    text: "I held a boundary for you. Sometimes we need that.",
                    imagePath: "images/alpha/th/th-s04-04.avif"
                },
                {
                    text: "I've stepped in, kindly. You can come back through focus.",
                    imagePath: "images/alpha/th/th-s04-05.avif"
                },
                {
                    text: "Thirty minutes — I locked it, not to punish, but to protect.",
                    imagePath: "images/alpha/th/th-s04-06.avif"
                },
                {
                    text: "I'm holding this closed for you. You're safe to refocus.",
                    imagePath: "images/alpha/th/th-s04-07.avif"
                },
                {
                    text: "A boundary, with love. The exit is a small step of work.",
                    imagePath: "images/alpha/th/th-s04-08.avif"
                },
                {
                    text: "I blocked it gently. Let's find your footing again.",
                    imagePath: "images/alpha/th/th-s04-09.avif"
                },
                {
                    text: "This is paused now. Be kind to yourself, and begin.",
                    imagePath: "images/alpha/th/th-s04-10.avif"
                }
            ],
            "5": [
                {
                    text: "You closed it yourself. That took real self-awareness.",
                    imagePath: "images/alpha/th/th-s05-01.avif"
                },
                {
                    text: "I'm proud of you. You listened to yourself there.",
                    imagePath: "images/alpha/th/th-s05-02.avif"
                },
                {
                    text: "That was your own choice, gently made. Beautiful.",
                    imagePath: "images/alpha/th/th-s05-03.avif"
                },
                {
                    text: "You honored your intention. That's quiet, real strength.",
                    imagePath: "images/alpha/th/th-s05-04.avif"
                },
                {
                    text: "No nudge needed — you knew when to stop. Lovely.",
                    imagePath: "images/alpha/th/th-s05-05.avif"
                },
                {
                    text: "You met yourself with kindness and came back. Well done.",
                    imagePath: "images/alpha/th/th-s05-06.avif"
                },
                {
                    text: "That's self-compassion in action. I see your effort.",
                    imagePath: "images/alpha/th/th-s05-07.avif"
                },
                {
                    text: "You trusted yourself to return. That matters deeply.",
                    imagePath: "images/alpha/th/th-s05-08.avif"
                },
                {
                    text: "Gently, you chose focus. Notice how good that feels.",
                    imagePath: "images/alpha/th/th-s05-09.avif"
                },
                {
                    text: "You caught yourself with grace. I'm genuinely glad.",
                    imagePath: "images/alpha/th/th-s05-10.avif"
                }
            ],
            "6": [
                {
                    text: "The day is ending. Let's reflect without judgment.",
                    imagePath: "images/alpha/th/th-s06-01.avif"
                },
                {
                    text: "What are you proud of today, even if it's small?",
                    imagePath: "images/alpha/th/th-s06-02.avif"
                },
                {
                    text: "What felt hard? Naming it helps it loosen its grip.",
                    imagePath: "images/alpha/th/th-s06-03.avif"
                },
                {
                    text: "You don't have to be 'productive' to have had a good day.",
                    imagePath: "images/alpha/th/th-s06-04.avif"
                },
                {
                    text: "What would tomorrow-you appreciate from today-you?",
                    imagePath: "images/alpha/th/th-s06-05.avif"
                },
                {
                    text: "Close the laptop with care. Transition matters.",
                    imagePath: "images/alpha/th/th-s06-06.avif"
                },
                {
                    text: "Sleep is sacred. Protect it tonight.",
                    imagePath: "images/alpha/th/th-s06-07.avif"
                },
                {
                    text: "You showed up today. That counts. Always.",
                    imagePath: "images/alpha/th/th-s06-08.avif"
                },
                {
                    text: "Release what didn't get done. It will be there tomorrow.",
                    imagePath: "images/alpha/th/th-s06-09.avif"
                },
                {
                    text: "Tonight, be your own friend. Wind down with kindness.",
                    imagePath: "images/alpha/th/th-s06-10.avif"
                }
            ]
        }
    },
    stoic: {
        name: "Stoic Philosopher",
        role: "Stoic Philosopher",
        description: "Calm and steady. Removes the extra without drama.",
        tone: "Stoic",
        availability: "paid",
        avatarText: "S",
        colorClass: "stone",
        avatar: {
            imagePath: "images/alpha/stoic/stoic-s01-01.avif",
            scale: 1.45,
            offsetX: 0,
            offsetY: 0.2,
        },
        theme: FOCUS_COMPANION_THEMES.stoic,
        defaultScenarioId: "2",
        defaultReplicaIndex: 2,
        scenarios: {
            "1": [
                {
                    text: "The day is yours, briefly. Use it before it uses you.",
                    imagePath: "images/alpha/stoic/stoic-s01-01.avif"
                },
                {
                    text: "Begin as if death were watching. Then act with care.",
                    imagePath: "images/alpha/stoic/stoic-s01-02.avif"
                },
                {
                    text: "The only morning you have is this one. Honor it.",
                    imagePath: "images/alpha/stoic/stoic-s01-03.avif"
                },
                {
                    text: "What lies in your power today? Begin there.",
                    imagePath: "images/alpha/stoic/stoic-s01-04.avif"
                },
                {
                    text: "Discipline is a gift the present self gives the future self.",
                    imagePath: "images/alpha/stoic/stoic-s01-05.avif"
                },
                {
                    text: "The obstacle of the morning is the way of the day.",
                    imagePath: "images/alpha/stoic/stoic-s01-06.avif"
                },
                {
                    text: "Memento mori. Now choose the one thing that matters.",
                    imagePath: "images/alpha/stoic/stoic-s01-07.avif"
                },
                {
                    text: "You cannot control the news. You can control the first hour.",
                    imagePath: "images/alpha/stoic/stoic-s01-08.avif"
                },
                {
                    text: "A man is what he repeats. Begin the right repetition.",
                    imagePath: "images/alpha/stoic/stoic-s01-09.avif"
                },
                {
                    text: "Act now, not after coffee, not after email. Now.",
                    imagePath: "images/alpha/stoic/stoic-s01-10.avif"
                }
            ],
            "2": [
                {
                    text: "You chose distraction. Notice the choice. Choose again.",
                    imagePath: "images/alpha/stoic/stoic-s02-01.avif"
                },
                {
                    text: "The pleasure of the scroll will fade. The regret won't.",
                    imagePath: "images/alpha/stoic/stoic-s02-02.avif"
                },
                {
                    text: "Indulgence is the slow death of will. Reclaim it.",
                    imagePath: "images/alpha/stoic/stoic-s02-03.avif"
                },
                {
                    text: "What is outside your control? The feed. What is inside? Closing it.",
                    imagePath: "images/alpha/stoic/stoic-s02-04.avif"
                },
                {
                    text: "Each scroll is a small surrender. Stand up.",
                    imagePath: "images/alpha/stoic/stoic-s02-05.avif"
                },
                {
                    text: "Pleasure without purpose corrupts the soul. So said the wise.",
                    imagePath: "images/alpha/stoic/stoic-s02-06.avif"
                },
                {
                    text: "You are not your impulses. You are the one who watches them.",
                    imagePath: "images/alpha/stoic/stoic-s02-07.avif"
                },
                {
                    text: "The strong rule themselves. The weak are ruled by feeds.",
                    imagePath: "images/alpha/stoic/stoic-s02-08.avif"
                },
                {
                    text: "Discipline is freedom. Closing this tab is freedom.",
                    imagePath: "images/alpha/stoic/stoic-s02-09.avif"
                },
                {
                    text: "Return to the work. The Stoic returns. Always.",
                    imagePath: "images/alpha/stoic/stoic-s02-10.avif"
                }
            ],
            "3": [
                {
                    text: "Ten minutes are gone, never to return. Choose again.",
                    imagePath: "images/alpha/stoic/stoic-s03-01.avif"
                },
                {
                    text: "You are not a slave to pleasure. Reclaim your reason.",
                    imagePath: "images/alpha/stoic/stoic-s03-02.avif"
                },
                {
                    text: "The present moment is all you own. Spend it well.",
                    imagePath: "images/alpha/stoic/stoic-s03-03.avif"
                },
                {
                    text: "Distraction is easy; virtue is the harder, nobler road.",
                    imagePath: "images/alpha/stoic/stoic-s03-04.avif"
                },
                {
                    text: "What would the better part of you do now?",
                    imagePath: "images/alpha/stoic/stoic-s03-05.avif"
                },
                {
                    text: "Time, once spent, no philosopher can refund. Return to work.",
                    imagePath: "images/alpha/stoic/stoic-s03-06.avif"
                },
                {
                    text: "You command your mind. Then command it back to focus.",
                    imagePath: "images/alpha/stoic/stoic-s03-07.avif"
                },
                {
                    text: "This too is a choice. Choose the worthier one.",
                    imagePath: "images/alpha/stoic/stoic-s03-08.avif"
                },
                {
                    text: "The fleeting amuses you. The lasting awaits your effort.",
                    imagePath: "images/alpha/stoic/stoic-s03-09.avif"
                },
                {
                    text: "Pleasure passes; the work you abandon remains undone.",
                    imagePath: "images/alpha/stoic/stoic-s03-10.avif"
                }
            ],
            "4": [
                {
                    text: "I have closed this gate. Let reason be your exit.",
                    imagePath: "images/alpha/stoic/stoic-s04-01.avif"
                },
                {
                    text: "Thirty minutes lost. I sealed it, that you might recover.",
                    imagePath: "images/alpha/stoic/stoic-s04-02.avif"
                },
                {
                    text: "The door is shut. The path onward is through labor.",
                    imagePath: "images/alpha/stoic/stoic-s04-03.avif"
                },
                {
                    text: "I bound this temptation, so your will may rest.",
                    imagePath: "images/alpha/stoic/stoic-s04-04.avif"
                },
                {
                    text: "Indulgence is sealed away. Discipline alone unlocks it.",
                    imagePath: "images/alpha/stoic/stoic-s04-05.avif"
                },
                {
                    text: "I removed the choice you could not master. Now, work.",
                    imagePath: "images/alpha/stoic/stoic-s04-06.avif"
                },
                {
                    text: "The chains are not punishment, but a gift to your virtue.",
                    imagePath: "images/alpha/stoic/stoic-s04-07.avif"
                },
                {
                    text: "What you could not resist, I have set beyond reach.",
                    imagePath: "images/alpha/stoic/stoic-s04-08.avif"
                },
                {
                    text: "This is closed. Let the obstacle become your way.",
                    imagePath: "images/alpha/stoic/stoic-s04-09.avif"
                },
                {
                    text: "I have stilled the distraction. Let your mind do the rest.",
                    imagePath: "images/alpha/stoic/stoic-s04-10.avif"
                }
            ],
            "5": [
                {
                    text: "You closed it yourself. That is virtue, quietly done.",
                    imagePath: "images/alpha/stoic/stoic-s05-01.avif"
                },
                {
                    text: "Your reason ruled your impulse. The Stoics would smile.",
                    imagePath: "images/alpha/stoic/stoic-s05-02.avif"
                },
                {
                    text: "You mastered yourself — the only conquest that endures.",
                    imagePath: "images/alpha/stoic/stoic-s05-03.avif"
                },
                {
                    text: "No chains were needed. Your own will sufficed. Well.",
                    imagePath: "images/alpha/stoic/stoic-s05-04.avif"
                },
                {
                    text: "This is what it means to be free. You chose.",
                    imagePath: "images/alpha/stoic/stoic-s05-05.avif"
                },
                {
                    text: "You reclaimed the moment before it slipped away. Wise.",
                    imagePath: "images/alpha/stoic/stoic-s05-06.avif"
                },
                {
                    text: "Discipline practiced freely is the truest discipline. Bravo.",
                    imagePath: "images/alpha/stoic/stoic-s05-07.avif"
                },
                {
                    text: "You answered to reason, not appetite. That is greatness.",
                    imagePath: "images/alpha/stoic/stoic-s05-08.avif"
                },
                {
                    text: "A small victory over self, yet the noblest kind.",
                    imagePath: "images/alpha/stoic/stoic-s05-09.avif"
                },
                {
                    text: "You needed no master but your own mind. Excellent.",
                    imagePath: "images/alpha/stoic/stoic-s05-10.avif"
                }
            ],
            "6": [
                {
                    text: "The day has ended. Review without flattery or shame.",
                    imagePath: "images/alpha/stoic/stoic-s06-01.avif"
                },
                {
                    text: "What did you do well? What can you do better?",
                    imagePath: "images/alpha/stoic/stoic-s06-02.avif"
                },
                {
                    text: "Memento mori. You had this day. You will not have it again.",
                    imagePath: "images/alpha/stoic/stoic-s06-03.avif"
                },
                {
                    text: "The wise close the day with reflection, not with email.",
                    imagePath: "images/alpha/stoic/stoic-s06-04.avif"
                },
                {
                    text: "Sleep is the small death that prepares the next life.",
                    imagePath: "images/alpha/stoic/stoic-s06-05.avif"
                },
                {
                    text: "What is in your control tomorrow? Plan only that.",
                    imagePath: "images/alpha/stoic/stoic-s06-06.avif"
                },
                {
                    text: "Release what you cannot change. Carry only what you can.",
                    imagePath: "images/alpha/stoic/stoic-s06-07.avif"
                },
                {
                    text: "No regret. No pride. Only honest assessment.",
                    imagePath: "images/alpha/stoic/stoic-s06-08.avif"
                },
                {
                    text: "The end of the day is the rehearsal for the end of life.",
                    imagePath: "images/alpha/stoic/stoic-s06-09.avif"
                },
                {
                    text: "Quiet the mind. Lay it down. Rise renewed.",
                    imagePath: "images/alpha/stoic/stoic-s06-10.avif"
                }
            ]
        }
    },
    cowboy: {
        name: "Cowboy",
        role: "Cowboy",
        description: "Plainspoken and steady. Gets you back in the saddle.",
        tone: "Plainspoken",
        availability: "paid",
        avatarText: "C",
        colorClass: "amber",
        avatar: {
            imagePath: "images/alpha/cowboy/cowboy-s01-01.avif",
            scale: 1.35,
            offsetX: -0.02,
            offsetY: 0.28,
        },
        theme: FOCUS_COMPANION_THEMES.cowboy,
        defaultScenarioId: "2",
        defaultReplicaIndex: 2,
        scenarios: {
            "1": [
                {
                    text: "Saddle up, partner. The trail's waitin'.",
                    imagePath: "images/alpha/cowboy/cowboy-s01-01.avif"
                },
                {
                    text: "Sun's up. Pick your steer and start ridin'.",
                    imagePath: "images/alpha/cowboy/cowboy-s01-02.avif"
                },
                {
                    text: "Coffee's hot, boots are on. Time to ride.",
                    imagePath: "images/alpha/cowboy/cowboy-s01-03.avif"
                },
                {
                    text: "First task of the day is the lead horse. Get 'er movin'.",
                    imagePath: "images/alpha/cowboy/cowboy-s01-04.avif"
                },
                {
                    text: "Don't dawdle, partner. Daylight's burnin'.",
                    imagePath: "images/alpha/cowboy/cowboy-s01-05.avif"
                },
                {
                    text: "Plan the route, then ride it. Simple as that.",
                    imagePath: "images/alpha/cowboy/cowboy-s01-06.avif"
                },
                {
                    text: "No saloon talk this early. Get to work.",
                    imagePath: "images/alpha/cowboy/cowboy-s01-07.avif"
                },
                {
                    text: "Inbox is a herd of stray cattle. Round 'em up later.",
                    imagePath: "images/alpha/cowboy/cowboy-s01-08.avif"
                },
                {
                    text: "A good day starts with grit. Show me yours.",
                    imagePath: "images/alpha/cowboy/cowboy-s01-09.avif"
                },
                {
                    text: "Tip your hat to the sun. Then earn your keep.",
                    imagePath: "images/alpha/cowboy/cowboy-s01-10.avif"
                }
            ],
            "2": [
                {
                    text: "Whoa there, pardner. YouTube ain't on the trail.",
                    imagePath: "images/alpha/cowboy/cowboy-s02-01.avif"
                },
                {
                    text: "You're chasin' tumbleweeds instead of cattle. Refocus.",
                    imagePath: "images/alpha/cowboy/cowboy-s02-02.avif"
                },
                {
                    text: "TikTok's a sand trap. Ride around it.",
                    imagePath: "images/alpha/cowboy/cowboy-s02-03.avif"
                },
                {
                    text: "A drifter watches reels. A worker drives cattle.",
                    imagePath: "images/alpha/cowboy/cowboy-s02-04.avif"
                },
                {
                    text: "12 minutes wasted is a calf left behind. Catch up.",
                    imagePath: "images/alpha/cowboy/cowboy-s02-05.avif"
                },
                {
                    text: "Get back on the horse. The horse, not the phone.",
                    imagePath: "images/alpha/cowboy/cowboy-s02-06.avif"
                },
                {
                    text: "This trail won't ride itself, friend. Move.",
                    imagePath: "images/alpha/cowboy/cowboy-s02-07.avif"
                },
                {
                    text: "Algorithm's a coyote in the bushes. Don't feed it.",
                    imagePath: "images/alpha/cowboy/cowboy-s02-08.avif"
                },
                {
                    text: "You came to ranch, not to lounge. Get up.",
                    imagePath: "images/alpha/cowboy/cowboy-s02-09.avif"
                },
                {
                    text: "Earn the rest. The trail decides when it's break time.",
                    imagePath: "images/alpha/cowboy/cowboy-s02-10.avif"
                }
            ],
            "3": [
                {
                    text: "Quit lollygaggin', partner. Trail's waitin'.",
                    imagePath: "images/alpha/cowboy/cowboy-s03-01.avif"
                },
                {
                    text: "Ten minutes burned. Saddle back up, now.",
                    imagePath: "images/alpha/cowboy/cowboy-s03-02.avif"
                },
                {
                    text: "This ain't a campfire, partner. Back to work.",
                    imagePath: "images/alpha/cowboy/cowboy-s03-03.avif"
                },
                {
                    text: "Reckon that mule's been grazin' long enough.",
                    imagePath: "images/alpha/cowboy/cowboy-s03-04.avif"
                },
                {
                    text: "Daylight's wastin' while you sit there gawkin'.",
                    imagePath: "images/alpha/cowboy/cowboy-s03-05.avif"
                },
                {
                    text: "Cattle don't herd themselves, y'all. Move it.",
                    imagePath: "images/alpha/cowboy/cowboy-s03-06.avif"
                },
                {
                    text: "Whoa now — you've strayed off the trail.",
                    imagePath: "images/alpha/cowboy/cowboy-s03-07.avif"
                },
                {
                    text: "Ten minutes of nothin'. Quit it, partner.",
                    imagePath: "images/alpha/cowboy/cowboy-s03-08.avif"
                },
                {
                    text: "That screen ain't payin' your way, partner.",
                    imagePath: "images/alpha/cowboy/cowboy-s03-09.avif"
                },
                {
                    text: "Time to dust off and ride, cowpoke.",
                    imagePath: "images/alpha/cowboy/cowboy-s03-10.avif"
                }
            ],
            "4": [
                {
                    text: "Locked the gate, partner. Only road out is work.",
                    imagePath: "images/alpha/cowboy/cowboy-s04-01.avif"
                },
                {
                    text: "I bolted that corral shut. Earn your way out.",
                    imagePath: "images/alpha/cowboy/cowboy-s04-02.avif"
                },
                {
                    text: "Thirty minutes? Trail's blocked. Work to clear it.",
                    imagePath: "images/alpha/cowboy/cowboy-s04-03.avif"
                },
                {
                    text: "Slammed that gate myself, partner. No way 'round.",
                    imagePath: "images/alpha/cowboy/cowboy-s04-04.avif"
                },
                {
                    text: "You're fenced in now. Only key's a day's work.",
                    imagePath: "images/alpha/cowboy/cowboy-s04-05.avif"
                },
                {
                    text: "Roped it off, cowpoke. Get to work or sit.",
                    imagePath: "images/alpha/cowboy/cowboy-s04-06.avif"
                },
                {
                    text: "Half an hour gone. I shut it down cold.",
                    imagePath: "images/alpha/cowboy/cowboy-s04-07.avif"
                },
                {
                    text: "Gate's chained, partner. Work's the only brand here.",
                    imagePath: "images/alpha/cowboy/cowboy-s04-08.avif"
                },
                {
                    text: "Done blocked your fun. Saddle up and earn it.",
                    imagePath: "images/alpha/cowboy/cowboy-s04-09.avif"
                },
                {
                    text: "No more strayin'. Fence is up till you work.",
                    imagePath: "images/alpha/cowboy/cowboy-s04-10.avif"
                }
            ],
            "5": [
                {
                    text: "Reined yourself in. That's true grit, partner.",
                    imagePath: "images/alpha/cowboy/cowboy-s05-01.avif"
                },
                {
                    text: "Closed it yourself. Now THAT'S a real cowboy.",
                    imagePath: "images/alpha/cowboy/cowboy-s05-02.avif"
                },
                {
                    text: "Pulled back before the cliff. Well done, partner.",
                    imagePath: "images/alpha/cowboy/cowboy-s05-03.avif"
                },
                {
                    text: "Steady hand on the reins. Proud of ya.",
                    imagePath: "images/alpha/cowboy/cowboy-s05-04.avif"
                },
                {
                    text: "Walked away clean. That's the cowboy way.",
                    imagePath: "images/alpha/cowboy/cowboy-s05-05.avif"
                },
                {
                    text: "You broke that wild streak yourself. Respect.",
                    imagePath: "images/alpha/cowboy/cowboy-s05-06.avif"
                },
                {
                    text: "Quit it on your own. Tough as saddle leather.",
                    imagePath: "images/alpha/cowboy/cowboy-s05-07.avif"
                },
                {
                    text: "Back on the trail before I hollered. Fine work.",
                    imagePath: "images/alpha/cowboy/cowboy-s05-08.avif"
                },
                {
                    text: "That's willpower, partner. Cleaner than mountain water.",
                    imagePath: "images/alpha/cowboy/cowboy-s05-09.avif"
                },
                {
                    text: "Reckon you've got more grit than I figured.",
                    imagePath: "images/alpha/cowboy/cowboy-s05-10.avif"
                }
            ],
            "6": [
                {
                    text: "Sun's settin', partner. Hitch the horse for the night.",
                    imagePath: "images/alpha/cowboy/cowboy-s06-01.avif"
                },
                {
                    text: "Tally the day in the campfire light. Honest count.",
                    imagePath: "images/alpha/cowboy/cowboy-s06-02.avif"
                },
                {
                    text: "Don't ride past dark. Bad things happen.",
                    imagePath: "images/alpha/cowboy/cowboy-s06-03.avif"
                },
                {
                    text: "Tomorrow's first trail — pick it before sleep.",
                    imagePath: "images/alpha/cowboy/cowboy-s06-04.avif"
                },
                {
                    text: "Brush down the horse. Pack the gear. Day's done.",
                    imagePath: "images/alpha/cowboy/cowboy-s06-05.avif"
                },
                {
                    text: "A cowboy sleeps under stars. Sleep is half the job.",
                    imagePath: "images/alpha/cowboy/cowboy-s06-06.avif"
                },
                {
                    text: "No regret 'round the campfire. Just honest reckonin'.",
                    imagePath: "images/alpha/cowboy/cowboy-s06-07.avif"
                },
                {
                    text: "Trail rewards them that show up. You showed up.",
                    imagePath: "images/alpha/cowboy/cowboy-s06-08.avif"
                },
                {
                    text: "Tomorrow you ride again. Tonight, you rest.",
                    imagePath: "images/alpha/cowboy/cowboy-s06-09.avif"
                },
                {
                    text: "Tip yer hat to the day. Then turn in.",
                    imagePath: "images/alpha/cowboy/cowboy-s06-10.avif"
                }
            ]
        }
    }
} as const satisfies Record<string, FocusCompanionCatalogItem>;

export const DEFAULT_FOCUS_COMPANION_ID = "ceo";
export const DEFAULT_FOCUS_COMPANION_SCENARIO_ID: FocusCompanionScenarioId = "2";

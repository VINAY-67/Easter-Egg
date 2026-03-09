export const gameRules = [
    {
        id: 1,
        text: "The grid contains hidden ",
        highlight: "Jasmine",
        suffix: " images (these are fake, do not click them!).",
        color: "var(--danger)"
    },
    {
        id: 2,
        text: "Your goal is to reveal all safe tiles."
    },
    {
        id: 3,
        text: "Numbers will guide you to how many Jasmine images are adjacent."
    },
    {
        id: 4,
        text: "You have a maximum of ",
        highlight: "3 lives",
        suffix: ". Clicking a Jasmine loses a life.",
        color: "var(--accent)"
    },
    {
        id: 5,
        text: "Right-click to place a flag 🌸 on suspected Jasmine tiles."
    },
    {
        id: 6,
        text: "If you lose 3 lives, you are eliminated!"
    }
];

export const roundData = [
    {
        id: 1,
        title: "Round 1",
        status: "Ready to play",
        isActive: true,
        color: "var(--safe)"
    },
    {
        id: 2,
        title: "Round 2",
        status: "Coming Soon...",
        isActive: false
    },
    {
        id: 3,
        title: "Round 3",
        status: "Coming Soon...",
        isActive: false
    }
];

export const eventDetails = {
    title: "Find the Jasmine",
    description: "This is an Easter Egg hunt based game comprising 3 rounds.",
    subtitle: "Round 1 (Level 1) - Minesweeper Style",
    level2Title: "Level 2",
    level2Subtitle: "Maze Escape",
    level2Desc: "Navigate through a dark maze with limited vision to find the hidden Easter Egg. Use Arrow Keys or WASD to move through the darkness!"
};

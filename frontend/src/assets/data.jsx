export const round2Rules = [
    {
        id: 1,
        text: "Solve the riddle to reveal a hidden clue"
    },
    {
        id: 2,
        text: "Use clues to decode the final mystery"
    },
    {
        id: 3,
        text: "You have maximum of 3 attempts per riddle"
    },
    {
        id: 4,
        text: "Wrong answers trigger temporary lockout"
    },
    {
        id: 5,
        text: "Find each level through your own investigation"
    }
];

export const round2Levels = {
    level1: {
        id: 1,
        name: "Riddle-1",
        route: "/whispering-voice",
        riddle: "I speak without a mouth and hear without ears. I have no body but I come alive with wind. What am I?",
        clueOnCorrect: import.meta.env.VITE_RIDDLE1_CLUE || "5-3-8-15",
        clueDescription: "E-C-H-O (A1Z26 Cipher)"
    },
    level2: {
        id: 2,
        name: "Riddle-2",
        route: "/silent-key",
        riddle: "I have keys but no locks. I have space but no room. You can enter but you cannot go outside. What am I?",
        clueOnCorrect: import.meta.env.VITE_RIDDLE2_CLUE || "5-2-1-4",
        clueDescription: "Every second letter: E-B-A-D (A1Z26)"
    },
    final: {
        id: 3,
        name: "Final Riddle",
        route: "/final-cipher",
        puzzleString: "Q C R X E T S A Z C O D E P L M Y K R",
        hint: "Combine both clues to reveal the hidden word"
    }
};

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

export const round3Rules = [
    {
        id: 1,
        text: "Convert each  <strong style='color:#fff'>Clue </strong> into 4-bit binary "
    },
    {
        id: 2,
        text: "Find positions with <strong style='color:#f5af19'>\"1\"</strong>"
    },
    {
        id: 3,
        text: "Repeat for <strong style='color:#fff'>Clue 2</strong> and combine all "
    },
    {
        id: 4,
        text: "Click cells to reveal"
    },
];

export const round3Data = {
    name: "Aakari Ghattam",
    route: "/jasmine-revelation",
    description: "The final chapter - decode the hidden message using all collected clues"
};

export const eventDetails = {
    title: "Find the Jasmine",
    description: "This is an Easter Egg hunt based game comprising 3 rounds.",
    subtitle: "Round 1 (Level 1) - Minesweeper Style",
    level2Title: "Level 2",
    level2Subtitle: "Maze Escape",
    level2Desc: "Navigate through a dark maze with limited vision to find the hidden Easter Egg. Use Arrow Keys or WASD to move through the darkness!"
};

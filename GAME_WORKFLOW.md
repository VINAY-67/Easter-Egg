# Easter Egg Hunt - Game Workflow Documentation

## Table of Contents
1. [Game Overview](#game-overview)
2. [Complete Game Flow](#complete-game-flow)
3. [Routes and Their Requirements](#routes-and-their-requirements)
4. [Database Schema](#database-schema)
5. [Score System](#score-system)
6. [Round Progression Logic](#round-progression-logic)
7. [Variables That Control Flow](#variables-that-control-flow)
8. [API Actions](#api-actions)

---

## Game Overview

The Easter Egg Hunt is a multi-round game with the following structure:

```
ROUND 1 (Minesweeper Saga)
├── Level 1: Minesweeper (/game)
├── Level 2: Maze (/level2)
└── Level 3: Slider (/slider)
        ↓ (completing Slider unlocks)
        
ROUND 2 (Riddle Mania)
├── Level 1: Whispering Voice (/whispering-voice)
├── Level 2: Silent Key (/silent-key)
└── Level 3: Final Cipher (/final-cipher)
        ↓ (completing Final Cipher unlocks)
        
ROUND 3 (Jasmine Revelation)
├── Intro (/jasmine-intro)
└── Game (/jasmine-revelation)
```

---

## Complete Game Flow

### NEW USER FLOW:

```
User Registers
        ↓
Visits Instructions Page (/instructions)
        ↓
┌─────────────────────────────────────────────────────────────┐
│ ROUND 1 - MINESWEEPER SAGA                                  │
└─────────────────────────────────────────────────────────────┘
        ↓
START: Click "Start Round 1" button
        ↓
Play Minesweeper (/game)
        ↓
[WIN] Minesweeper Complete
        ↓
Backend sets: Scores['Round-1'] = 1
        ↓
Auto-navigates to Instructions
        ↓
Click "Play Maze" button
        ↓
Play Maze (/level2)
        ↓
[WIN] Maze Complete
        ↓
NO SCORE SET (Maze is internal to Round 1)
        ↓
Auto-navigates to Instructions
        ↓
SLIDER LEVEL: Shown as "LOCKED - It is there but hidden"
(NO BUTTON - Player must manually type /slider in URL bar)
        ↓
Play Slider (/slider) - Manual URL entry only
        ↓
[WIN] Slider Complete
        ↓
Backend sets: Scores['Round-1'] = 2 (indicates Round-1 fully complete)
        ↓
Auto-navigates to Instructions
        ↓
Shows: "Round-1 Completed! ✓"
        ↓
┌─────────────────────────────────────────────────────────────┐
│ ROUND 2 - RIDDLE MANIA (Unlock Button Appears)              │
└─────────────────────────────────────────────────────────────┘
        ↓
Click "Go to Round 2" button
        ↓
Auto-navigates to /riddle-intro
        ↓
RIDDLE PAGES: Player must manually type URLs
- /whispering-voice (Riddle 1)
- /silent-key (Riddle 2)  
- /final-cipher (Riddle 3)
(NO BUTTONS - Player must know the URLs or guess them)
        ↓
Solve All 3 Riddles (in any order)
        ↓
[WIN] All Riddles Complete (on Final Cipher win)
        ↓
Backend sets: 
- Round2Progress.finalComplete = true
- Scores['Round-2'] = 1
        ↓
Auto-navigate to Instructions
        ↓
Shows: "Round-2 Completed! ✓"
        ↓
┌─────────────────────────────────────────────────────────────┐
│ ROUND 3 - JASMINE REVELATION (Button Unlock)                │
└─────────────────────────────────────────────────────────────┘
        ↓
Click "Start Round 3" button
        ↓
Auto-navigates to /jasmine-intro
        ↓
Play Jasmine Intro (/jasmine-intro)
        ↓
Play Jasmine Game (/jasmine-revelation)
        ↓
[WIN] Easter Egg Found!
        ↓
Show Congratulations + Movie Credits
```

---

## Routes and Their Requirements

| Route | File | Access Requires | Redirect If Not Met | Notes |
|-------|------|-----------------|-------------------|-------|
| `/` | Login | Not logged in | `/instructions` | |
| `/instructions` | Instructions | Logged in | `/` (login) | Main hub showing progress |
| `/game` | Game.jsx | `Scores['Round-1'] < 1` AND `HasWon === false` | `/instructions` | Minesweeper |
| `/level2` | Level2.jsx | `Scores['Round-1'] > 0` OR `HasWon === true` | `/game` | Maze |
| `/slider` | Slider.jsx | `Scores['Round-1'] > 0` AND `Scores['Round-1'] !== 2` | `/instructions` | Manual URL entry only |
| `/riddle-intro` | RiddleIntro | `Scores['Round-1'] === 2` | `/instructions` | Intro page for Round-2 |
| `/whispering-voice` | WhisperingVoice | `Scores['Round-1'] === 2` | `/instructions` | Riddle 1 - Manual URL only |
| `/silent-key` | SilentKey | `Scores['Round-1'] === 2` | `/instructions` | Riddle 2 - Manual URL only |
| `/final-cipher` | FinalCipher | `Scores['Round-1'] === 2` | `/instructions` | Riddle 3 - Manual URL only |
| `/jasmine-intro` | JasmineIntro | `Round2Progress.finalComplete === true` OR `Scores['Round-2'] === 1` | `/instructions` | Jasmine intro |
| `/jasmine-revelation` | JasmineRevelation | `Round2Progress.finalComplete === true` OR `Scores['Round-2'] === 1` | `/jasmine-intro` | Jasmine word game |

---

## Database Schema

### User Model (`backend/models/user.js`)

```javascript
{
    name: String,              // User's display name
    email: String,             // User's email (unique)
    HashedPassword: String,    // Bcrypt hashed password
    
    // Score tracking
    Scores: {
        'Round-1': Number,    // Set when Minesweeper complete (value: 1)
        'Round-2': Number,    // Set when Slider complete (value: 1)
        'Round-3': Number     // Set when Riddles complete (value: 1)
    },
    
    // Round 2 (Riddles) progress
    Round2Progress: {
        level1Complete: Boolean,      // Whispering Voice solved
        level2Complete: Boolean,      // Silent Key solved
        finalComplete: Boolean,       // All riddles solved
        clue1: String,                // Clue from riddle 1
        clue2: String,                // Clue from riddle 2
        wrongAttempts: {
            level1: Number,           // Wrong attempts on riddle 1
            level2: Number,           // Wrong attempts on riddle 2
            final: Number             // Wrong attempts on final cipher
        },
        completedAt: Date,           // When riddles completed
        round2LockedAt: Date,        // Lockout timestamp (after 3 wrong)
        enteredFinalAt: Date         // When user entered final cipher
    },
    
    // Round 3 (Jasmine) progress
    Round3Progress: {
        levelComplete: Boolean,      // Jasmine word found
        wrongAttempts: Number,        // Wrong answers count
        completedAt: Date,           // When jasmine found
        round3LockedAt: Date         // Lockout timestamp (after 3 wrong)
    },
    
    // Game state
    HasWon: Boolean,         // Set to true when game won
    HasStarted: Boolean,     // Set to true on first game start
    Status: String,          // 'playing' | 'won' | 'lose' | 'eliminated'
    isLocked: Boolean,       // True if eliminated (3 lives lost)
    
    // Attempt tracking
    numberofTries: {
        'Round-1': Number,    // Lives used in Minesweeper
        'Round-2': Number,   // Lives used in Maze
        'Round-3': Number    // Lives used in Slider
    }
}
```

---

## Score System

| Score Key | Set By | When Set | Unlocks |
|-----------|--------|----------|---------|
| `Scores['Round-1']` = 1 | Backend | Minesweeper completion | Access to Maze |
| `Scores['Round-1']` = 2 | Backend | Slider completion | Access to Round-2 (Riddles) |
| `Scores['Round-2']` = 1 | Backend | Final Riddle (Final Cipher) completion | Access to Round-3 (Jasmine) |

### Backend Score Assignment:

```javascript
// In backend/controllers/user.js

// Minesweeper (Round-1 Level-1) - action: 'complete'
user.Scores['Round-1'] = 1;

// Slider (Round-1 Level-3) - round: 'Round-1', action: 'complete'
user.Scores['Round-1'] = 2;  // IMPORTANT: Set to 2, not 1!

// Final Cipher (Round-2 Riddle-3) - round: 'Round-2', action: 'complete'
user.Round2Progress.finalComplete = true;
user.Scores['Round-2'] = 1;
```

---

## Round Progression Logic

### Frontend Flow Control (App.jsx):

```javascript
// Game (Minesweeper) access - Round-1 Level-1
{user?.Scores?.['Round-1'] > 0 || user?.HasWon ? <Navigate to="/level2" /> : <Game />}

// Level2 (Maze) access - Round-1 Level-2
{user?.Scores?.['Round-1'] > 0 || user?.HasWon ? <Level2 /> : <Navigate to="/game" />}

// Slider access - Round-1 Level-3
// Requires Round-1 to be partially complete (Minesweeper done) but not fully complete
{user?.Scores?.['Round-1'] === 2 ? <Navigate to="/instructions" /> : 
 user?.Scores?.['Round-1'] > 0 ? <Slider /> : <Navigate to="/game" />}

// Riddle Intro access - Only after Slider complete
{user?.Scores?.['Round-1'] === 2 ? <RiddleIntro /> : <Navigate to="/instructions" />}

// Riddle access (all riddle routes) - All riddles manually accessed via URL
{user?.Scores?.['Round-1'] === 2 ? <RiddlePage /> : <Navigate to="/instructions" />}

// Jasmine access - Only after all riddles complete
{user?.Scores?.['Round-2'] === 1 || user?.Round2Progress?.finalComplete === true ? <JasminePage /> : <Navigate to="/instructions" />}
```

### Instructions Page Display:

```
IF Scores['Round-1'] === 0:
  Show: "Start Round 1" button

IF Scores['Round-1'] === 1:
  Show: "Play Maze" button
  Show: "Slider: LOCKED - It is there but hidden"

IF Scores['Round-1'] === 2:
  Show: "Round-1 Completed ✓"
  Show: "Go to Round 2" button

IF Scores['Round-2'] === 1 OR finalComplete === true:
  Show: "Round-2 Completed ✓"
  Show: "Start Round 3" button

IF Round3Progress exists and not complete:
  Show: "Round-3: LOCKED - Available after Round-2"
```

### Backend Progression Check:

```javascript
// Riddles lockout - check if user can answer
if (user.Round2Progress.round2LockedAt) {
    // Check if lockout expired
}

// Jasmine lockout - check if user can answer
if (user.Round3Progress.round3LockedAt) {
    // Check if lockout expired
}
```

---

## Variables That Control Flow

### Primary Flow Control Variables:

| Variable | Type | Purpose | Set By | Values |
|----------|------|---------|--------|--------|
| `Scores['Round-1']` | Number | Round-1 progression tracking | Backend | 0 = Not started, 1 = Minesweeper+Maze done, 2 = Round-1 complete |
| `Scores['Round-2']` | Number | Round-2 completion | Backend | 0 = Not done, 1 = All riddles complete |
| `Round2Progress.finalComplete` | Boolean | Alternative Round-2 unlock | Backend | true when Final Cipher solved |
| `HasWon` | Boolean | Legacy flag, set after Round-1 | Backend | Set to true when Minesweeper complete |

### Secondary Control Variables:

| Variable | Type | Purpose |
|----------|------|---------|
| `numberofTries['Round-1']` | Number | Tracks lives in Minesweeper (max 3) |
| `numberofTries['Round-2']` | Number | Tracks lives in Maze (max 3) |
| `numberofTries['Round-3']` | Number | Tracks lives in Slider (max 3) |
| `isLocked` | Boolean | True if user exhausted all lives |
| `Round2Progress.round2LockedAt` | Date | Lockout timestamp for Riddles (after 3 wrong) |
| `Round3Progress.round3LockedAt` | Date | Lockout timestamp for Jasmine (after 3 wrong) |
| `Status` | String | 'playing' \| 'won' \| 'lose' \| 'eliminated' |

### Riddle-Specific Variables:

| Variable | Type | Purpose |
|----------|------|---------|
| `Round2Progress.level1Complete` | Boolean | Whispering Voice solved |
| `Round2Progress.level2Complete` | Boolean | Silent Key solved |
| `Round2Progress.clue1` | String | Clue revealed after riddle 1 |
| `Round2Progress.clue2` | String | Clue revealed after riddle 2 |
| `Round2Progress.wrongAttempts.level1` | Number | Wrong answers on riddle 1 |
| `Round2Progress.wrongAttempts.level2` | Number | Wrong answers on riddle 2 |
| `Round2Progress.wrongAttempts.final` | Number | Wrong answers on final cipher |

---

## API Actions

### Backend API: `PUT /api/:userId/updateuser`

#### Round-1 (Minesweeper & Maze) Actions:

| Action | Effect |
|--------|--------|
| `start` | Sets `HasStarted = true` |
| `lose-life` | Increments `numberofTries['Round-1']` |
| `complete` | Sets `Scores['Round-1'] = 1`, `HasWon = true` |

#### Round-1 (Slider) Actions:

| Action | Effect |
|--------|--------|
| `slider-complete` | Sets `Scores['Round-1'] = 2` (enables Round-2 access) |

#### Round-2 (Riddles) Actions:

| Action | Effect |
|--------|--------|
| `riddle-intro-start` | Marks player entered riddle section |
| `riddle-answer` | Validates answer, sets `level1Complete` or `level2Complete` |
| `riddle-progress` | Updates clue progress |
| `riddle-final-answer` | Validates final cipher answer |
| `riddle-complete` | Sets `Round2Progress.finalComplete = true`, `Scores['Round-2'] = 1` |

#### Round-3 (Jasmine) Actions:

| Action | Effect |
|--------|--------|
| `jasmine-intro-start` | Marks player entered jasmine section |
| `jasmine-answer` | Validates the Jasmine word answer |
| `jasmine-complete` | Sets Jasmine game as complete |

---

## Lockout System

### Riddles Lockout:
- **Trigger**: 3 wrong attempts on any riddle level
- **Duration**: 6 hours (production)
- **Variable**: `Round2Progress.round2LockedAt`

### Jasmine Lockout:
- **Trigger**: 3 wrong attempts on Jasmine word
- **Duration**: 30 seconds (testing) / 2 hours (production)
- **Variable**: `Round3Progress.round3LockedAt`

### Elimination (3 Lives):
- **Trigger**: User loses 3 lives in Minesweeper
- **Effect**: `isLocked = true`, `Status = 'eliminated'`
- **Variable**: `isLocked`

---

## Testing Variables (for Round-3 Jasmine)

### Frontend (`frontend/src/pages/JasmineRevelation.jsx`):

```javascript
const LOCKOUT_DURATION = 30 * 1000; // 30 seconds (testing)
const ROUND3_ENABLED = true;         // Always enabled
const UNLOCK_DATE = new Date(Date.now() + 15 * 60 * 1000); // 15 min from now
```

### Backend (`backend/controllers/user.js`):

```javascript
const ROUND3_ENABLED = true;                          // Always enabled
const ROUND3_UNLOCK_DATE = new Date(Date.now() + 15 * 60 * 1000); // 15 min
const LOCKOUT_DURATION = 30 * 1000;                   // 30 seconds
const JASMINE_ANSWER = 'CRESCENCE';                   // The answer
```

---

## Environment Variables

### Frontend (`.env`):

```
VITE_ROUND3_LETTERS=CRESCENCE          # Letters for Jasmine puzzle
```

### Backend (`.env`):

```
JASMINE_ANSWER=CRESCENCE               # Correct answer
ROUND3_ENABLED=true                    # Enable/disable Round 3
ROUND3_UNLOCK_DATE=2026-03-21T12:30:00Z  # When Round 3 unlocks
CLUE1=echo                             # Riddle 1 answer
CLUE2=keyboard                         # Riddle 2 answer  
CLUE3=CRESCODE                         # Riddle 3 answer
RIDDLE_CLUE1=5-3-8-15                  # Clue after riddle 1
RIDDLE_CLUE2=5-2-1-4                   # Clue after riddle 2
```

---

## Common Issues and Solutions

### Issue: Slider button appearing on instructions page
**Cause**: Instructions displaying button instead of showing "locked" message
**Fix**: Remove button for Slider level; show "LOCKED - It is there but hidden" message only

### Issue: Player can navigate to riddles without completing Slider
**Cause**: Routes checking wrong score value
**Fix**: Riddle routes must check `Scores['Round-1'] === 2` (not 1)

### Issue: Round-2 button appears before Round-1 complete
**Cause**: Instructions showing button when `Scores['Round-1']` is 1
**Fix**: Show "Go to Round-2" button only when `Scores['Round-1'] === 2`

### Issue: Riddles showing as complete after Slider finishes
**Cause**: Backend incorrectly setting `Scores['Round-3'] = 1` on Slider completion
**Fix**: Only set `Scores['Round-2'] = 1` when Final Cipher is solved, not on Slider completion

### Issue: Player can access Jasmine before completing riddles
**Cause**: Routes not checking `Scores['Round-2']` value
**Fix**: Jasmine routes must check `Scores['Round-2'] === 1` or `finalComplete === true`

### Issue: No indication that Slider level exists
**Cause**: UI hiding the level completely
**Fix**: Show "LOCKED - It is there but hidden" message so players know to explore

---

## Migration Endpoints

### Migrate All Users:
```
POST /api/migrate
```
Adds missing `Round2Progress` and `Round3Progress` fields to existing users without affecting existing data.

### Migrate Single User:
```
POST /api/migrate-single/:userId
```
Migrates a specific user's data.

---

## File Structure Reference

```
frontend/src/
├── App.jsx                    # Route definitions and access control
├── pages/
│   ├── Instructions.jsx       # Main hub with progress and buttons
│   ├── Game.jsx               # Minesweeper (Round-1 Level-1)
│   ├── Level2.jsx            # Maze (Round-1 Level-2)
│   ├── Slider.jsx             # Slider puzzle (Round-1 Level-3)
│   ├── RiddleIntro.jsx       # Riddle intro screen
│   ├── WhisperingVoice.jsx    # Riddle 1
│   ├── SilentKey.jsx          # Riddle 2
│   ├── FinalCipher.jsx        # Riddle 3
│   ├── JasmineIntro.jsx       # Jasmine intro
│   └── JasmineRevelation.jsx  # Jasmine word game
└── context/
    └── AuthContext.jsx        # User authentication state

backend/
├── controllers/
│   └── user.js               # User actions and score management
├── models/
│   └── user.js               # User database schema
└── routes/
    └── user.js               # API routes and migration endpoints
```

---

## Version History

| Date | Change |
|------|--------|
| 2026-03-20 | **MAJOR WORKFLOW OVERHAUL** - Implemented actual game design |
| 2026-03-20 | Slider now manually accessed (/slider URL bar entry) - no button |
| 2026-03-20 | Slider shows as "LOCKED - It is there but hidden" on instructions |
| 2026-03-20 | Scores['Round-1'] = 2 when Slider complete (was 1) |
| 2026-03-20 | Riddle routes now require Scores['Round-1'] === 2 (not 1) |
| 2026-03-20 | "Go to Round 2" button appears only when Round-1 fully complete |
| 2026-03-20 | Riddles no longer auto-complete on Slider finish |
| 2026-03-20 | Final riddle completion sets Scores['Round-2'] = 1 (was Round-3) |
| 2026-03-20 | Round-3 button shown only after all riddles complete |
| 2026-03-20 | Round-3 shows as "LOCKED" until Round-2 completed |

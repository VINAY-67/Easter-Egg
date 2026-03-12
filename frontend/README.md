# Easter Egg Hunt - Round 2: Riddle Mania

## Project Overview

**Project:** Easter Egg Hunt - A multi-round puzzle game  
**Framework:** React + Vite  
**Theme:** Dark puzzle/hacker aesthetic with Easter Egg mystery

---

## Game Structure

### Round 1 (3 Levels)
| Level | Name | Route | Description |
|-------|------|-------|-------------|
| 1 | Minesweeper | `/game` | Find the Jasmine - avoid hidden traps |
| 2 | Maze Escape | `/level2` | Navigate through darkness to find the exit |
| 3 | Slider Puzzle | `/slider` | Rearrange tiles to solve the puzzle |

### Round 2: Riddle Mania (NEW)
| Level | Name | Route | Auto-Advance |
|-------|------|-------|--------------|
| 1 | Whispering Voice | `/whispering-voice` | 5 seconds after clue |
| 2 | Silent Key | `/silent-key` | 5 seconds after clue |
| 3 | Final Cipher | `/final-cipher` | 5 seconds → Instructions |

---

## Round-2 Game Flow

### Discovery Phase
1. User completes all 3 levels of Round-1 (Slider)
2. User is redirected to Instructions page showing Round-1 complete
3. **Easter Egg Aspect:** User must discover Round-2 by finding the URL themselves

### Level 1: Whispering Voice
- **Route:** `/whispering-voice`
- **Riddle:** "I speak without a mouth and hear without ears. I have no body but I come alive with wind. What am I?"
- **Answer:** `echo` (case-insensitive)
- **Max Attempts:** 3
- **On Correct:**
  - Reveals Clue: `5-3-8-15` (E-C-H-O using A1Z26 cipher)
  - Displays for 5 seconds
  - Auto-redirects to `/riddle-intro`

### Instructions Page (Round-2)
- **Route:** `/riddle-intro`
- Shows Round-2 rules and progress
- **Easter Egg Aspect:** No button to next level - user must find URL themselves

### Level 2: Silent Key
- **Route:** `/silent-key`
- **Riddle:** "I have keys but no locks. I have space but no room. You can enter but you cannot go outside. What am I?"
- **Answer:** `keyboard` (case-insensitive)
- **Max Attempts:** 3
- **On Correct:**
  - Reveals Clue (user-provided)
  - Displays for 5 seconds
  - Auto-redirects to `/riddle-intro`

### Level 3: Final Cipher
- **Route:** `/final-cipher`
- **Puzzle:** User-provided puzzle string
- **Answer:** User-provided answer
- **Max Attempts:** 3
- **On Correct:**
  - Victory animation
  - Updates backend (Round-2 complete)
  - Displays for 5 seconds
  - Auto-redirects to main `/instructions` (showing Round-2 completed)

---

## File Structure

```
frontend/src/
├── pages/
│   ├── Login.jsx              # User login
│   ├── Register.jsx           # User registration
│   ├── Instructions.jsx       # Round-1 Instructions
│   ├── Game.jsx              # Round-1 Level 1: Minesweeper
│   ├── Level2.jsx            # Round-1 Level 2: Maze
│   ├── Slider.jsx            # Round-1 Level 3: Slider Puzzle
│   ├── RiddleIntro.jsx       # NEW: Round-2 Instructions
│   ├── WhisperingVoice.jsx   # NEW: Round-2 Level 1
│   ├── SilentKey.jsx         # NEW: Round-2 Level 2
│   ├── FinalCipher.jsx       # NEW: Round-2 Final
│   ├── AdminLogin.jsx        # Admin login
│   └── AdminDashboard.jsx   # Admin player/
│   ├── management
├── components Cell.jsx             # Minesweeper cell
│   └── RiddleInput.jsx      # NEW: Reusable riddle input
├── hooks/
│   ├── useGame.js           # Minesweeper logic
│   ├── useMaze.js           # Maze generation
│   └── useRiddleProgress.js # NEW: Round-2 progress
├── context/
│   └── AuthContext.jsx      # Authentication state
├── assets/
│   └── data.jsx             # Game rules & data
├── backend.js               # API base URL
├── App.jsx                  # Routes & protection
└── main.jsx                 # Entry point
```

---

## Routes & Protection

### New Round-2 Routes

```javascript
// All protected by authentication
/riddle-intro           → Round-2 Instructions
/whispering-voice       → Level 1:/silent-key            Whispering Voice
 → Level 2: Silent Key
/final-cipher          → Level 3: Final Cipher
```

### Route Guard Logic

- All routes require authentication (JWT token)
- All Round-2 routes require `user?.Scores?.['Round-3'] > 0` (completed Round-1)
- No guards between levels (Easter Egg discovery aspect)
- Each level has internal state to prevent replay

---

## Data Storage

### Backend (MongoDB)

```javascript
// User Model - Round2Progress
{
  Round2Progress: {
    level1Complete: Boolean,     // Whispering Voice
    level2Complete: Boolean,    // Silent Key
    finalComplete: Boolean,     // Final Cipher
    clue1: String,              // From Level 1
    clue2: String,              // From Level 2
    completedAt: Date,          // Timestamp
    wrongAttempts: {
      level1: Number,
      level2: Number,
      final: Number
    }
  }
}
```

### Frontend (localStorage)

```javascript
// Key: 'jasmineUser'
{
  id: String,
  name: String,
  email: String,
  role: String,
  Scores: {
    'Round-1': Number,
    'Round-2': Number,
    'Round-3': Number
  },
  Round2Progress: {
    level1Complete: Boolean,
    level2Complete: Boolean,
    finalComplete: Boolean,
    clue1: String,
    clue2: String
  }
}
```

---

## Anti-Cheat Measures

| # | Measure | Implementation |
|---|---------|----------------|
| 1 | Server Validation | All answers validated via backend API |
| 2 | Input Normalization | `answer.trim().toLowerCase()` before validation |
| 3 | Attempt Limit | Max 3 attempts per riddle |
| 4 | Lockout | After 3 failed attempts: 30-second cooldown |
| 5 | Rate Limiting | 1 second minimum between submissions |
| 6 | Route Guards | Prevent access without Round-1 completion |
| 7 | No Answer Exposure | Correct answers NOT stored in frontend |
| 8 | Admin Monitoring | All progress visible in AdminDashboard |

### Anti-Cheat Flow

```
User submits answer
    ↓
Is locked out? → YES → Show "Too many attempts, wait X seconds"
    ↓ NO
Less than 1 second since last attempt? → YES → Show "Please wait..."
    ↓ NO
Normalize input (trim + lowercase)
    ↓
Send to backend API for validation
    ↓
IF CORRECT:
  - Update frontend state (clue + completion)
  - Update backend via /updateuser
  - Show success + clue
  - Start 5 second countdown
  - Auto-redirect after 5s
    ↓
IF WRONG:
  - Increment attempt counter
  - Show error message
  - IF attempts >= 3:
    - Set lockout timestamp (30 seconds)
    - Show countdown with remaining time
```

---

## API Endpoints

### Round-2 Related Endpoints

| Method | Endpoint | Purpose |
|--------|----------|---------|
| PUT | `/api/:userId/updateuser` | Update round progress (existing) |
| Body | `{ round: 'Round-2', action: 'riddle-start' }` | Start Round-2 |
| Body | `{ round: 'Round-2', action: 'riddle-answer', level: 1, answer: '...' }` | Validate answer |
| Body | `{ round: 'Round-2', action: 'complete' }` | Complete Round-2 |

---

## UI Components

### RiddleInput Component

```javascript
// Props
{
  riddleText: string,        // The riddle question
  hintText: string,          // Optional hint
  onSubmit: function,       // Submit handler
  attemptsLeft: number,      // Remaining attempts
  isLocked: boolean,         // Lockout state
  lockoutTimeLeft: number,   // Seconds remaining
  placeholder: string        // Input placeholder
}
```

### UI States

```
┌─────────────────────────────────┐
│  LEVEL TITLE                    │
│  (Whispering Voice / etc)        │
├─────────────────────────────────┤
│                                 │
│  Riddle Text                    │
│  "I speak without a mouth..."   │
│                                 │
├─────────────────────────────────┤
│  [Input Field]  [Submit]         │
│                                 │
│  Attempts: 2/3                  │
│  ❌ Wrong answer                │
│                                 │
├─────────────────────────────────┤
│  💡 Hint (optional)             │
└─────────────────────────────────┘

// After Correct Answer:
┌─────────────────────────────────┐
│  ✅ CORRECT!                    │
│                                 │
│  Your Clue: 5-3-8-15           │
│                                 │
│  Redirecting in 5...            │
└─────────────────────────────────┘

// After 3 Failed Attempts:
┌─────────────────────────────────┐
│  🔒 Too many attempts!          │
│                                 │
│  Try again in 28 seconds        │
└─────────────────────────────────┘
```

---

## Timing Summary

| Event | Duration |
|-------|----------|
| Show clue after correct | 5 seconds |
| Auto-redirect after clue | 5 seconds |
| Lockout after 3 failures | 30 seconds |
| Minimum attempt interval | 1 second |

---

## Round-2 Rules (Display)

```
1. Solve the riddle to reveal a hidden clue
2. Use clues to decode the final mystery
3. You have maximum of 3 attempts per riddle
4. Wrong answers trigger temporary lockout
5. Find each level through your own investigation
```

---

## Development Notes

### Authentication Flow
1. User logs in → Token stored in `localStorage.jasmineToken`
2. User object stored in `localStorage.jasmineUser`
3. AuthContext provides `login()`, `logout()`, `updateUser()` functions
4. ProtectedRoute checks for valid token and non-locked status

### Progression Logic
- Round-1: Complete Level 1 → Level 2 unlocks → Complete Level 2 → Level 3 unlocks
- Round-2: Complete all of Round-1 → Find URL → Complete Level 1 → Instructions → Find URL → Complete Level 2 → Find URL → Complete Final

### Easter Egg Philosophy
- Round-2 levels are hidden - no buttons or links
- Users must discover URLs through investigation
- This adds mystery and exploration to the game

---

## Admin Dashboard

Admin can view all players' progress including:
- Round-1 completion status
- Round-2 progress (level1Complete, level2Complete, finalComplete)
- Wrong attempt counts per level
- Completion timestamps

---

## Credits

Developed with React, Vite, Framer Motion, and MongoDB

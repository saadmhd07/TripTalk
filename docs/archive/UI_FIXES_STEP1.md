# UI Fixes - Step 1: Quick Fixes

## Completed Tasks ✅

### 1. Enter sends message in conversation ✅
**Problem:** Pressing Enter in textarea creates new line instead of sending message.

**Solution:** 
- Added `onKeyDown` handler to textarea
- Enter = send message
- Shift+Enter = new line
- Updated placeholder text to indicate keyboard shortcuts

**File modified:** `src/components/ConversationScreen.tsx`

---

### 2. Removed "Nouvelle conversation" button ✅
**Problem:** Button is confusing - seems like an action but just redirects to Explorer (which is already in nav).

**Solution:** 
- Removed button from AppShell header
- Removed `onNewConversation` prop from AppShell interface
- Cleaned up App.tsx to remove handler reference

**Files modified:**
- `src/components/AppShell.tsx`
- `src/App.tsx`

---

### 3. Fixed scenario cards height ✅
**Problem:** Scenario cards have different heights, looks inconsistent.

**Solution:** 
- Added `auto-rows-fr` to grid container
- All cards now have equal height regardless of content

**File modified:** `src/components/ExplorerScreen.tsx`

---

### 4. Improved hover states and clickable clarity ✅
**Problem:** Hard to distinguish clickable cards from informative sections.

**Solution:**
- Added `cursor-pointer` to clickable cards
- Enhanced hover effects:
  - Border color changes to orange
  - Shadow increases
  - Slight translate-y lift effect
- Added `cursor-default` to informative cultural tips cards
- Changed from subtle gray hover to clear orange accent

**File modified:** `src/components/ExplorerScreen.tsx`

---

### 5. Added progressive reveal in Explorer ✅
**Problem:** User doesn't understand the order: Country → Scenario → Level.

**Solution:**
- Added numbered step indicators (1, 2)
- Step 1: "Choose a country" with orange circle
- Step 2: "Pick a scenario" 
  - Gray circle when no country selected
  - Orange circle when country selected
- Updated labels from French to English for clarity
- Changed messaging to guide user ("Select a country first")

**File modified:** `src/components/ExplorerScreen.tsx`

---

## Summary

**All 5 tasks completed** ✅✅✅✅✅

**Changes:**
- Better UX in conversation (Enter to send)
- Cleaner header (removed confusing button)
- Consistent card heights
- Clear hover states
- Guided flow with numbered steps

**Next:** Step 2 - Complete UI overhaul (Notion-inspired)

---

## Files Changed

### Modified
- `src/components/ConversationScreen.tsx`
- `src/components/AppShell.tsx`
- `src/components/ExplorerScreen.tsx`
- `src/App.tsx`

**Total:** 4 files modified

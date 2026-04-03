# Bug Fixes: Tab Switching & Deployment Issues

## Issues Fixed

### 1. **Game Freezes When Switching Browser Tabs**
**Problem:** When players switched to a different Chrome tab, the game UI would freeze (timers, loading states, etc.) until they returned to the tab.

**Root Cause:** Browser tab suspension - Chrome suspends JavaScript timers and network operations when a tab is hidden. This caused:
- Game countdown timers to freeze
- Loading/initialization states to never resolve
- Socket events to delay/queue

**Solution:** Implemented page visibility detection across all time-sensitive components.

**Files Modified:**
- Created `client/src/hooks/usePageVisibility.ts` - New hook to detect tab visibility changes
- Updated `client/src/components/CreateJoinScreen.tsx` - Reset timeout when tab becomes visible
- Updated `client/src/components/MainGameScreen.tsx` - Resync timer on tab visibility
- Updated `client/src/components/CategoryVoteScreen.tsx` - Resync timer on tab visibility
- Updated `client/src/components/MeetingScreen.tsx` - Handle timer pause/resume
- Updated `client/src/lib/socket.ts` - Auto-reconnect when tab becomes visible

### 2. **Room Creation Takes 2+ Minutes in Production**
**Problem:** In deployed version, creating a room or joining takes extremely long or times out.

**Root Cause:** 
- Cold server starts (Vercel/Render free tier)
- Insufficient Socket.IO configuration for production
- Too-short client timeouts

**Solutions:**

#### Server Side (`server/src/index.ts`):
- Increased `pingInterval` from default to 25s
- Increased `pingTimeout` from default to 60s (allows recovery from cold starts)
- Explicit transport configuration: websocket + polling fallback
- Support for older Socket.IO clients with `allowEIO3`
- Increased max buffer size for reliability

#### Client Side (`client/src/lib/socket.ts`):
- Increased reconnection attempts from 10 to 15
- Increased socket timeout from 20s to 40s
- Increased max reconnection delay from 5s to 10s

#### UI Feedback (`client/src/components/CreateJoinScreen.tsx`):
- Increased "server taking too long" timeout from 15s to 35s
- Better messaging about cold start delays

#### Server Logging (`server/src/socketHandlers.ts`):
- Added detailed logging for create_room/join_room attempts
- Better error messages with timestamps for debugging

## Technical Details

### Page Visibility Hook
```typescript
export const usePageVisibility = (
  onHidden?: () => void,
  onVisible?: () => void,
) => {
  // Detects document.hidden changes
  // Calls callbacks when tab becomes hidden/visible
}
```

### Socket.IO Production Config
- `pingInterval: 25_000` - Send keepalive every 25s
- `pingTimeout: 60_000` - Wait 60s for response (handles slow connections)
- `transports: ['websocket', 'polling']` - Fallback if WebSocket fails
- `allowEIO3: true` - Support legacy clients

## Testing Checklist

- [ ] Tab switching: Game continues smoothly when switching tabs and returning
- [ ] Room creation: Takes <5s on warm server, <40s on cold start
- [ ] Room joining: Consistently works for second player
- [ ] Timers: Countdown continues correctly after tab switch
- [ ] Loading state: Never freezes or hangs
- [ ] Network: Handles poor connections gracefully

## Deployment Notes

### For Vercel:
1. Ensure `VITE_SERVER_URL` environment variable is set to deployed server URL
2. Server must be deployed on same Vercel project or separate Vercel backend
3. CORS is properly configured for both origins

### For Render/Similar:
- Free tier servers may have 30s cold start - increased timeouts handle this
- Use paid tier for better performance if needed

## Commit Message
```
fix: prevent UI freeze when switching tabs and improve production deployment stability

- Add page visibility detection to pause/resume timers when tab switches
- Increase Socket.IO timeouts for cold server starts (20s → 40s)
- Increase client connection timeout from 15s to 35s
- Improve server-side logging for room creation/join debugging
- Support older Socket.IO clients with allowEIO3 config
- Add fallback polling transport when WebSocket unavailable
```

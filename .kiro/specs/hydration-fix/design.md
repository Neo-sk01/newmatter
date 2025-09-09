# Design Document

## Overview

The hydration mismatch occurs because the `useTheme` hook from `next-themes` returns `undefined` for `resolvedTheme` during server-side rendering, but returns the actual theme value on the client. This causes the server to render one icon (based on `undefined` theme) while the client renders a different icon (based on the resolved theme).

The solution involves implementing a hydration-safe theme toggle that renders consistently on both server and client, then updates to show the correct state after hydration completes.

## Architecture

The fix will use a two-phase rendering approach:
1. **Server/Initial Render**: Render a neutral state that's safe for SSR
2. **Post-Hydration**: Update to show the actual theme state

We'll implement this using:
- A custom hook that tracks hydration state
- A theme toggle component that handles the transition gracefully
- Proper fallback rendering during the hydration phase

## Components and Interfaces

### 1. useHydration Hook

```typescript
interface UseHydrationReturn {
  isHydrated: boolean;
}

function useHydration(): UseHydrationReturn
```

This hook will track whether the component has hydrated on the client side.

### 2. HydrationSafeThemeToggle Component

```typescript
interface ThemeToggleProps {
  className?: string;
}

function HydrationSafeThemeToggle(props: ThemeToggleProps): JSX.Element
```

This component will:
- Use the hydration hook to determine rendering strategy
- Show a neutral icon during SSR/pre-hydration
- Transition to the correct theme icon after hydration
- Handle theme switching functionality

### 3. Updated Topbar Component

The existing Topbar component will be updated to use the new hydration-safe theme toggle instead of the current problematic implementation.

## Data Models

### Theme State Management

```typescript
type ThemeState = {
  theme: string | undefined;
  resolvedTheme: string | undefined;
  setTheme: (theme: string) => void;
  isHydrated: boolean;
}
```

### Component State

```typescript
type ThemeToggleState = {
  currentTheme: 'light' | 'dark' | 'unknown';
  isTransitioning: boolean;
}
```

## Error Handling

### Hydration Mismatch Prevention

1. **Consistent Initial Render**: Always render the same content on server and initial client render
2. **Graceful Transition**: Use `useEffect` to update the UI after hydration
3. **Fallback States**: Provide sensible defaults when theme information is unavailable

### Theme Detection Fallbacks

1. **System Preference**: Fall back to system theme if next-themes fails
2. **Default Theme**: Use light theme as ultimate fallback
3. **Error Boundaries**: Wrap theme-dependent components in error boundaries

## Testing Strategy

### Unit Tests

1. **useHydration Hook Tests**
   - Test that `isHydrated` is false initially
   - Test that `isHydrated` becomes true after useEffect runs
   - Test behavior in SSR environment

2. **HydrationSafeThemeToggle Tests**
   - Test initial render shows neutral state
   - Test post-hydration shows correct theme
   - Test theme switching functionality
   - Test accessibility attributes

### Integration Tests

1. **Hydration Behavior**
   - Test that no hydration mismatch errors occur
   - Test that theme toggle works after hydration
   - Test theme persistence across page refreshes

2. **Theme System Integration**
   - Test integration with next-themes
   - Test theme switching updates other components
   - Test system theme detection

### E2E Tests

1. **User Experience**
   - Test theme toggle click behavior
   - Test theme persistence across navigation
   - Test initial page load experience

## Implementation Details

### Phase 1: Hydration Detection

Create a custom hook that reliably detects when hydration has completed:

```typescript
function useHydration() {
  const [isHydrated, setIsHydrated] = useState(false);
  
  useEffect(() => {
    setIsHydrated(true);
  }, []);
  
  return { isHydrated };
}
```

### Phase 2: Safe Theme Toggle

Implement a theme toggle that renders safely during SSR:

```typescript
function HydrationSafeThemeToggle() {
  const { isHydrated } = useHydration();
  const { theme, setTheme, resolvedTheme } = useTheme();
  
  // Only determine actual theme after hydration
  const currentTheme = isHydrated ? (resolvedTheme ?? theme) : undefined;
  const isDark = currentTheme === 'dark';
  
  // Render neutral state during SSR/pre-hydration
  if (!isHydrated) {
    return (
      <Button variant="outline" size="icon" className="rounded-xl">
        <Sun className="h-5 w-5" /> {/* Always show sun during SSR */}
      </Button>
    );
  }
  
  // Render actual state after hydration
  return (
    <Button 
      variant="outline" 
      size="icon" 
      className="rounded-xl"
      onClick={() => setTheme(isDark ? "light" : "dark")}
    >
      {isDark ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
    </Button>
  );
}
```

### Phase 3: Integration

Replace the existing theme toggle in the Topbar component with the new hydration-safe version.

## Performance Considerations

1. **Minimal Re-renders**: The hydration hook only causes one re-render after mount
2. **No Layout Shift**: The button maintains consistent dimensions during transition
3. **Fast Hydration**: Simple state management ensures quick hydration completion

## Accessibility

1. **Screen Reader Support**: Maintain proper ARIA labels throughout the transition
2. **Keyboard Navigation**: Ensure button remains focusable during all states
3. **Visual Indicators**: Provide clear visual feedback for theme state
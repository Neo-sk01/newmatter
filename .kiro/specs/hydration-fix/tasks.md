# Implementation Plan

- [x] 1. Create hydration detection hook
  - Create `src/hooks/useHydration.ts` with a custom hook that tracks client-side hydration state
  - Implement useState and useEffect to detect when component has mounted on client
  - Add TypeScript interface for the hook's return type
  - _Requirements: 1.2, 2.2_

- [x] 2. Create hydration-safe theme toggle component
  - Create `src/components/HydrationSafeThemeToggle.tsx` with the new theme toggle component
  - Import and use the useHydration hook to determine rendering strategy
  - Implement conditional rendering that shows neutral state during SSR and actual state after hydration
  - Add proper TypeScript props interface and component typing
  - _Requirements: 1.1, 1.3, 2.1, 2.2_

- [-] 3. Add theme toggle functionality and accessibility
  - Implement theme switching logic using next-themes setTheme function
  - Add proper ARIA labels and accessibility attributes for screen readers
  - Ensure button maintains consistent dimensions during state transitions
  - Add tooltip content that updates based on current theme state
  - _Requirements: 1.3, 3.1, 3.2, 4.2_

- [ ] 4. Write unit tests for useHydration hook
  - Create `src/hooks/__tests__/useHydration.test.ts` with comprehensive test coverage
  - Test that isHydrated starts as false and becomes true after useEffect
  - Test behavior in different rendering environments (SSR vs client)
  - Mock useEffect to verify proper lifecycle behavior
  - _Requirements: 2.1, 2.2_

- [ ] 5. Write unit tests for HydrationSafeThemeToggle component
  - Create `src/components/__tests__/HydrationSafeThemeToggle.test.tsx` with component tests
  - Test initial render shows neutral state (Sun icon) before hydration
  - Test post-hydration render shows correct theme-based icon
  - Test theme switching functionality and setTheme calls
  - Test accessibility attributes and ARIA labels
  - _Requirements: 1.1, 1.3, 2.1, 4.3_

- [ ] 6. Update Topbar component to use new theme toggle
  - Replace the existing problematic theme toggle code in `src/app/sales_matter_ai_sales_automation_ui_shadcn_react.tsx`
  - Import and use HydrationSafeThemeToggle component
  - Remove the old isDark logic and direct theme rendering
  - Maintain existing styling and tooltip wrapper structure
  - _Requirements: 1.1, 1.2, 3.1, 3.2_

- [ ] 7. Add integration tests for hydration behavior
  - Create `src/__tests__/hydration-integration.test.tsx` to test full hydration flow
  - Test that no hydration mismatch console errors occur during component mounting
  - Test theme toggle functionality works correctly after hydration completes
  - Test theme persistence across simulated page refreshes
  - _Requirements: 1.1, 2.1, 3.1, 3.3_

- [ ] 8. Create reusable hydration utilities for other components
  - Create `src/utils/hydration.ts` with utility functions for hydration-safe rendering
  - Implement withHydration higher-order component for wrapping theme-dependent components
  - Add utility function for safe theme detection that other components can use
  - Export TypeScript types for hydration-safe component patterns
  - _Requirements: 4.1, 4.2, 4.3_

- [ ] 9. Write documentation and usage examples
  - Create `src/components/HydrationSafeThemeToggle.md` with component documentation
  - Document the hydration-safe pattern for other developers
  - Add code examples showing how to use the utilities in other components
  - Include troubleshooting guide for common hydration issues
  - _Requirements: 4.1, 4.2, 4.3_
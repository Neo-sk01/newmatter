'use client';

import { useState, useEffect } from 'react';

/**
 * Interface for the useHydration hook return type
 */
export interface UseHydrationReturn {
  isHydrated: boolean;
}

/**
 * Custom hook that tracks client-side hydration state
 * 
 * This hook helps prevent hydration mismatches by providing a way to detect
 * when a component has mounted on the client side. During server-side rendering
 * and the initial client render, isHydrated will be false. After the component
 * mounts on the client, isHydrated becomes true.
 * 
 * @returns {UseHydrationReturn} Object containing isHydrated boolean
 */
export function useHydration(): UseHydrationReturn {
  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    // This effect only runs on the client after hydration
    setIsHydrated(true);
  }, []);

  return { isHydrated };
}
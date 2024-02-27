import { useEffect, useCallback } from "react";
import { debounce } from "lodash";

// Custom hook for debouncing a function
export function useDebouncedEffect(effect: () => void, deps: any[], delay: number) {
  // Include `effect` in the dependency array for `useCallback`
  const callback = useCallback(effect, [effect, ...deps]);

  useEffect(() => {
    const handler = debounce(callback, delay);

    handler();

    // Cleanup function to cancel the debounced call if the component unmounts
    return () => handler.cancel();
  }, [callback, delay]); // `callback` already includes `effect` in its dependencies, so no need to add it here again.
}

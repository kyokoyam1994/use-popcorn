import { useEffect } from "react";

export function useKey(keyCode: string, onKeyDownCallback: () => void) {
  useEffect(() => {
    const callback = (e: KeyboardEvent) => {
      if (e.code.toLowerCase() === keyCode.toLowerCase()) {
        onKeyDownCallback();
      }
    };

    document.addEventListener("keydown", callback);
    return () => document.removeEventListener("keydown", callback);
  }, [keyCode, onKeyDownCallback]);
}

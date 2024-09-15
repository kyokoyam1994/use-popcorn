import { useEffect, useState } from "react";

export function useLocalStorageState<T>(initialState: T, key: string) {
  const [value, setValue] = useState<T>(() => {
    const storedItem = localStorage.getItem(key);
    const watchedList: T = storedItem ? JSON.parse(storedItem) : initialState;
    return watchedList;
  });

  // Updated setValue to accept a function or value
  const setLocalStorageValue = (newValue: T | ((prevState: T) => T)) => {
    setValue((prevState) => {
      const updatedValue =
        newValue instanceof Function ? newValue(prevState) : newValue;
      localStorage.setItem(key, JSON.stringify(updatedValue));
      return updatedValue;
    });
  };

  useEffect(() => {
    localStorage.setItem(key, JSON.stringify(value));
  }, [value, key]);

  return [value, setLocalStorageValue] as const;
}

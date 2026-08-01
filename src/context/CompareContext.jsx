import { createContext, useContext, useState, useCallback } from 'react';

const CompareContext = createContext(null);
const STORAGE_KEY = 'sheenbazaar_compare';
const MAX_COMPARE = 4;

function loadCompare() {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY)) || []; } catch { return []; }
}

export function CompareProvider({ children }) {
  const [items, setItems] = useState(loadCompare);

  const toggleCompare = useCallback((product) => {
    setItems((prev) => {
      const exists = prev.find((p) => p.id === product.id);
      let next;
      if (exists) {
        next = prev.filter((p) => p.id !== product.id);
      } else {
        if (prev.length >= MAX_COMPARE) {
          alert(`You can compare up to ${MAX_COMPARE} products at a time. Remove one first.`);
          return prev;
        }
        next = [...prev, product];
      }
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      return next;
    });
  }, []);

  const clearCompare = useCallback(() => {
    setItems([]);
    localStorage.removeItem(STORAGE_KEY);
  }, []);

  const isComparing = useCallback((id) => items.some((p) => p.id === id), [items]);

  return (
    <CompareContext.Provider value={{ items, toggleCompare, clearCompare, isComparing, max: MAX_COMPARE }}>
      {children}
    </CompareContext.Provider>
  );
}

export function useCompare() {
  return useContext(CompareContext);
}

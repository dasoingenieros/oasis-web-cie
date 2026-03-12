'use client';

import { createContext, useContext, useEffect, useState, useRef } from 'react';

interface NavScrollContextValue {
  navHidden: boolean;
}

const NavScrollContext = createContext<NavScrollContextValue>({ navHidden: false });

export function NavScrollProvider({ children }: { children: React.ReactNode }) {
  const [navHidden, setNavHidden] = useState(false);
  const lastY = useRef(0);

  useEffect(() => {
    const onScroll = () => {
      const y = window.scrollY;
      if (y > 100 && y > lastY.current) {
        setNavHidden(true);
      } else if (y < lastY.current) {
        setNavHidden(false);
      }
      lastY.current = y;
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <NavScrollContext.Provider value={{ navHidden }}>
      {children}
    </NavScrollContext.Provider>
  );
}

export function useNavScroll() {
  return useContext(NavScrollContext);
}

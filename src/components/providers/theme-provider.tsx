"use client";
import './styles/theme-provider.css';
import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { SettingsModalOverlay } from '@/components/settings-modal';

export type Theme = 'dark' | 'light' | 'eyecomfort';
export type FontSize = 'small' | 'medium' | 'large';
export type FontFamily = 'sans' | 'serif' | 'mono';

interface ThemeContextType {
  theme: Theme;
  fontSize: FontSize;
  fontSizePx: number;
  fontFamily: FontFamily;
  isSettingsOpen: boolean;
  toggleTheme: () => void;
  setTheme: (theme: Theme) => void;
  setFontSize: (size: FontSize) => void;
  setFontSizePx: (px: number) => void;
  setFontFamily: (family: FontFamily) => void;
  openSettings: () => void;
  closeSettings: () => void;
}

const ThemeContext = createContext<ThemeContextType>({
  theme: 'dark',
  fontSize: 'medium',
  fontSizePx: 16,
  fontFamily: 'sans',
  isSettingsOpen: false,
  toggleTheme: () => {},
  setTheme: () => {},
  setFontSize: () => {},
  setFontSizePx: () => {},
  setFontFamily: () => {},
  openSettings: () => {},
  closeSettings: () => {},
});

export const useTheme = () => useContext(ThemeContext);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<Theme>('dark');
  const [fontSize, setFontSizeState] = useState<FontSize>('medium');
  const [fontSizePx, setFontSizePxState] = useState<number>(16);
  const [fontFamily, setFontFamilyState] = useState<FontFamily>('sans');
  const [isSettingsOpen, setIsSettingsOpen] = useState<boolean>(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const savedTheme = (localStorage.getItem('syllabus_theme') as Theme) || 'dark';
    const savedFontSize = (localStorage.getItem('syllabus_font_size') as FontSize) || 'medium';
    const savedFontSizePxStr = localStorage.getItem('syllabus_font_size_px');
    const savedFontSizePx = savedFontSizePxStr ? parseInt(savedFontSizePxStr, 10) : (savedFontSize === 'small' ? 14 : savedFontSize === 'large' ? 18 : 16);
    const savedFontFamily = (localStorage.getItem('syllabus_font_family') as FontFamily) || 'sans';

    setThemeState(savedTheme);
    setFontSizeState(savedFontSize);
    setFontSizePxState(savedFontSizePx);
    setFontFamilyState(savedFontFamily);
    
    applySettings(savedTheme, savedFontSize, savedFontSizePx, savedFontFamily);
  }, []);

  const applySettings = (t: Theme, fs: FontSize, fPx: number, ff: FontFamily) => {
    const root = document.documentElement;
    
    // Theme classes
    root.classList.remove('dark', 'light', 'eyecomfort');
    if (t === 'eyecomfort') {
      root.classList.add('eyecomfort', 'dark');
    } else if (t === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.add('light');
    }

    // Font size classes & scoped CSS variable
    root.classList.remove('font-size-sm', 'font-size-md', 'font-size-[large]', 'font-size-lg');
    root.classList.add(`font-size-${fs === 'small' ? 'sm' : fs === 'large' ? 'lg' : 'md'}`);
    root.style.setProperty('--base-font-size', `${fPx}px`);

    // Font family classes
    root.classList.remove('font-family-sans', 'font-family-serif', 'font-family-mono');
    root.classList.add(`font-family-${ff}`);
  };

  const setTheme = (newTheme: Theme) => {
    setThemeState(newTheme);
    localStorage.setItem('syllabus_theme', newTheme);
    applySettings(newTheme, fontSize, fontSizePx, fontFamily);
  };

  const setFontSize = (newSize: FontSize) => {
    setFontSizeState(newSize);
    const numericPx = newSize === 'small' ? 14 : newSize === 'large' ? 18 : 16;
    setFontSizePxState(numericPx);
    localStorage.setItem('syllabus_font_size', newSize);
    localStorage.setItem('syllabus_font_size_px', String(numericPx));
    applySettings(theme, newSize, numericPx, fontFamily);
  };

  const setFontSizePx = (newPx: number) => {
    const clampedPx = Math.max(12, Math.min(24, newPx));
    setFontSizePxState(clampedPx);
    const stringCategory: FontSize = clampedPx <= 14 ? 'small' : clampedPx >= 18 ? 'large' : 'medium';
    setFontSizeState(stringCategory);
    localStorage.setItem('syllabus_font_size_px', String(clampedPx));
    localStorage.setItem('syllabus_font_size', stringCategory);
    applySettings(theme, stringCategory, clampedPx, fontFamily);
  };

  const setFontFamily = (newFamily: FontFamily) => {
    setFontFamilyState(newFamily);
    localStorage.setItem('syllabus_font_family', newFamily);
    applySettings(theme, fontSize, fontSizePx, newFamily);
  };

  const toggleTheme = () => {
    const nextTheme: Theme = theme === 'dark' ? 'light' : theme === 'light' ? 'eyecomfort' : 'dark';
    setTheme(nextTheme);
  };

  const openSettings = () => setIsSettingsOpen(true);
  const closeSettings = () => setIsSettingsOpen(false);

  return (
    <ThemeContext.Provider value={{ 
      theme, 
      fontSize, 
      fontSizePx, 
      fontFamily, 
      isSettingsOpen, 
      toggleTheme, 
      setTheme, 
      setFontSize, 
      setFontSizePx, 
      setFontFamily, 
      openSettings, 
      closeSettings 
    }}>
      {children}
      <SettingsModalOverlay isOpen={isSettingsOpen} onClose={closeSettings} />
    </ThemeContext.Provider>
  );
}

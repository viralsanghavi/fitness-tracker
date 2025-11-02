import { Moon, Sun, Monitor } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Button } from './button.jsx';
import { cn } from '../../lib/utils.js';

const storageKey = 'health-tracker-theme';
const themes = ['light', 'dark', 'system'];
const icons = {
  light: <Sun className="h-4 w-4" />,
  dark: <Moon className="h-4 w-4" />,
  system: <Monitor className="h-4 w-4" />
};

const applyTheme = (value) => {
  const root = window.document.documentElement;
  root.classList.remove('light', 'dark');

  if (value === 'system') {
    const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    root.classList.add(systemPrefersDark ? 'dark' : 'light');
  } else {
    root.classList.add(value);
  }
};

const ThemeToggle = ({ className }) => {
  const [theme, setTheme] = useState('system');

  useEffect(() => {
    const stored = localStorage.getItem(storageKey);
    const initialTheme = themes.includes(stored) ? stored : 'system';
    setTheme(initialTheme);
    applyTheme(initialTheme);

    const media = window.matchMedia('(prefers-color-scheme: dark)');
    const handleSystemChange = () => {
      const storedTheme = localStorage.getItem(storageKey);
      if (!storedTheme || storedTheme === 'system') {
        applyTheme('system');
      }
    };
    media.addEventListener('change', handleSystemChange);
    return () => media.removeEventListener('change', handleSystemChange);
  }, []);

  const handleToggle = () => {
    const currentIndex = themes.indexOf(theme);
    const nextTheme = themes[(currentIndex + 1) % themes.length];
    setTheme(nextTheme);
    localStorage.setItem(storageKey, nextTheme);
    applyTheme(nextTheme);
  };

  return (
    <Button variant="ghost" size="sm" className={cn('gap-2', className)} onClick={handleToggle}>
      {icons[theme]}
      <span className="text-sm capitalize">{theme}</span>
    </Button>
  );
};

export default ThemeToggle;

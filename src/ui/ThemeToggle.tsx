import { useEffect, useState } from 'react';
import { Moon, Sun } from 'lucide-react';
import { Button } from './components/button';
import { vi } from './copy.vi';

export function ThemeToggle() {
  const [theme, setTheme] = useState<'light' | 'dark'>(() => matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
  const [manual, setManual] = useState(false);
  useEffect(() => {
    const media = matchMedia('(prefers-color-scheme: dark)');
    const followSystem = () => { if (!manual) setTheme(media.matches ? 'dark' : 'light'); };
    media.addEventListener('change', followSystem);
    return () => media.removeEventListener('change', followSystem);
  }, [manual]);
  useEffect(() => { document.documentElement.dataset.theme = theme; }, [theme]);
  const Icon = theme === 'dark' ? Sun : Moon;
  return <Button variant="outline" className="theme-toggle" aria-label={theme === 'dark' ? vi.themeLight : vi.themeDark} title={vi.themeSession} onClick={() => { setManual(true); setTheme(theme === 'dark' ? 'light' : 'dark'); }}><Icon aria-hidden="true" /><span>{theme === 'dark' ? vi.themeLight : vi.themeDark}</span></Button>;
}

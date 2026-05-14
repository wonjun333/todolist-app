import { useThemeStore } from '../../stores/themeStore';

function SunIcon() {
  return (
    <svg className="theme-toggle__icon" viewBox="0 0 24 24" aria-hidden="true">
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v2" />
      <path d="M12 20v2" />
      <path d="m4.93 4.93 1.41 1.41" />
      <path d="m17.66 17.66 1.41 1.41" />
      <path d="M2 12h2" />
      <path d="M20 12h2" />
      <path d="m6.34 17.66-1.41 1.41" />
      <path d="m19.07 4.93-1.41 1.41" />
    </svg>
  );
}

function MoonIcon() {
  return (
    <svg className="theme-toggle__icon" viewBox="0 0 24 24" aria-hidden="true">
      <path d="M20.99 13.2A8.5 8.5 0 1 1 10.8 3.01 6.5 6.5 0 1 0 20.99 13.2Z" />
    </svg>
  );
}

export function ThemeToggle() {
  const { isDark, toggle } = useThemeStore();
  const label = isDark ? '라이트 모드로 변경' : '다크 모드로 변경';

  return (
    <button className="theme-toggle" type="button" onClick={toggle} aria-label={label} title={label}>
      {isDark ? <SunIcon /> : <MoonIcon />}
    </button>
  );
}

import { themeToggleButton } from './domElements.js';
import { THEME_STORAGE_KEY } from './config.js';

function applyTheme(theme) {
  const isDark = theme === "dark";
  document.body.classList.toggle("dark-theme", isDark);

  if (themeToggleButton) {
    themeToggleButton.textContent = isDark ? "☀️" : "🌙";
    themeToggleButton.setAttribute("aria-pressed", isDark.toString());
    themeToggleButton.setAttribute("aria-label", isDark ? "Switch to light mode" : "Switch to dark mode");
  }
  localStorage.setItem(THEME_STORAGE_KEY, theme);
}

function toggleTheme() {
  const currentThemeIsDark = document.body.classList.contains("dark-theme");
  const newTheme = currentThemeIsDark ? "light" : "dark";
  applyTheme(newTheme);
}

export function loadInitialTheme() {
  const savedTheme = localStorage.getItem(THEME_STORAGE_KEY);
  const prefersDarkScheme = window.matchMedia(
    "(prefers-color-scheme: dark)"
  ).matches;

  let initialTheme = "light"; // Default theme
  if (savedTheme) {
    initialTheme = savedTheme;
  } else if (prefersDarkScheme) {
    initialTheme = "dark";
  }
  applyTheme(initialTheme);

  if (themeToggleButton) {
    themeToggleButton.addEventListener("click", toggleTheme);
  } else {
    console.warn("Theme toggle button (#theme-toggle) not found. Theme switching via UI will not be available.");
  }
}
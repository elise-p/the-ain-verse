import { performPreFlightChecks } from './js/domElements.js';
import { loadInitialTheme } from './js/themeManager.js';
import { fetchAndDisplayRepos, setupInteractiveCardListeners } from './js/repoManager.js';
import { initializeCatSound } from './js/catSoundManager.js';

async function initializeApp() {
  // --- PRE-FLIGHT CHECKS ---
  if (!performPreFlightChecks()) {
    return;
  }

  // --- INITIALIZE ---
  loadInitialTheme();
  await fetchAndDisplayRepos(); // Wait for repos to be fetched and displayed
  setupInteractiveCardListeners(); // Setup listeners after repos are on the page
  initializeCatSound(); // Cat sound can be initialized after other UI elements
}

document.addEventListener("DOMContentLoaded", initializeApp);

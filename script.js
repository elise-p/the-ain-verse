import { performPreFlightChecks, repoSearchInput } from './js/domElements.js';
import { loadInitialTheme } from './js/themeManager.js';
import { fetchInitialRepos, handleSearch, setupInteractiveCardListeners } from './js/repoManager.js';
import { initializeCatSound } from './js/catSoundManager.js';

async function initializeApp() {
  // --- PRE-FLIGHT CHECKS ---
  if (!performPreFlightChecks()) {
    return;
  }

  // --- INITIALIZE ---
  loadInitialTheme();
  await fetchInitialRepos(); // Fetch and display initial set of repos
  setupInteractiveCardListeners(); // Setup listeners after repos are on the page
  initializeCatSound(); // Cat sound can be initialized after other UI elements

  // --- SETUP EVENT LISTENERS ---
  if (repoSearchInput) {
    repoSearchInput.addEventListener('input', (event) => {
      handleSearch(event.target.value);
    });
  }
}

document.addEventListener("DOMContentLoaded", initializeApp);
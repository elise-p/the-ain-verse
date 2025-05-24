document.addEventListener("DOMContentLoaded", () => {
  // --- CONFIGURATION ---
  const GITHUB_USERNAME = "ainstarc";
  const API_URL = `https://api.github.com/users/${GITHUB_USERNAME}/repos?sort=updated&per_page=100`;

  // --- DOM ELEMENTS ---
  const statusDiv = document.getElementById("status");
  const repoListDiv = document.getElementById("repoList");
  const themeToggleButton = document.getElementById("theme-toggle");

  // --- CONSTANTS ---
  const THEME_STORAGE_KEY = "user-theme-preference";

  // --- PRE-FLIGHT CHECKS ---
  if (!statusDiv || !repoListDiv) {
    console.error(
      "Error: Required DOM elements (#status or #repoList) not found."
    );
    if (statusDiv)
      statusDiv.textContent =
        "❌ Critical error: Page structure is missing required elements.";
    return;
  }

  // --- THEME FUNCTIONS ---
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

  function loadInitialTheme() {
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
    applyTheme(initialTheme); // applyTheme will also set aria-pressed

    if (themeToggleButton) {
      themeToggleButton.addEventListener("click", toggleTheme);
    } else {
      console.warn(
        "Theme toggle button (#theme-toggle) not found. Theme switching via UI will not be available."
      );
    }
  }

  // --- REPO FETCH & DISPLAY ---

  async function fetchAndDisplayRepos() {
    statusDiv.textContent = "🔄 Loading projects...";
    statusDiv.style.color = ""; // Reset color
    repoListDiv.innerHTML = ""; // Clear previous

    try {
      const response = await fetch(API_URL, {
        headers: {
          Accept: "application/vnd.github.mercy-preview+json", // for topics
        },
      });

      if (!response.ok) {
        const errorData = await response
          .json()
          .catch(() => ({ message: response.statusText }));
        throw new Error(
          `GitHub API Error: ${response.status} - ${
            errorData.message || "Unknown error"
          }`
        );
      }

      const repos = await response.json();

      if (!Array.isArray(repos) || repos.length === 0) {
        statusDiv.textContent = "🤷 No public repositories found.";
        return;
      }

      displayRepos(repos);
      statusDiv.textContent = ""; // Clear status on success
    } catch (error) {
      console.error("Error fetching repositories:", error);
      statusDiv.textContent = `❌ Error: ${error.message}. Check console for details.`;
      statusDiv.style.color = "red";
    }
  }

  function createRepoCardElement(repo) {
    const repoCard = document.createElement("div");
    repoCard.className = "repo-card";

    // Repo name link
    const repoNameLink = document.createElement("a");
    repoNameLink.href = repo.html_url;
    repoNameLink.textContent = repo.name;
    repoNameLink.target = "_blank";
    repoNameLink.rel = "noopener noreferrer";

    const repoNameHeading = document.createElement("h3");
    repoNameHeading.appendChild(repoNameLink);

    repoCard.appendChild(repoNameHeading);

    // Action icons container
    const cardActionsDiv = document.createElement("div");
    cardActionsDiv.className = "repo-card-actions";

    // GitHub Pages icon if available
    if (repo.has_pages) {
      let pagesUrl = repo.homepage;
      // If no homepage, or it's empty or not a string, try to construct the standard GitHub Pages URL
      if (!pagesUrl || typeof pagesUrl !== 'string' || pagesUrl.trim() === "") {
        if (
          repo.name.toLowerCase() ===
          `${GITHUB_USERNAME.toLowerCase()}.github.io`
        ) {
          pagesUrl = `https://${GITHUB_USERNAME.toLowerCase()}.github.io/`;
        } else {
          pagesUrl = `https://${GITHUB_USERNAME.toLowerCase()}.github.io/${repo.name}/`;
        }
      }
      if (pagesUrl.startsWith("http://") || pagesUrl.startsWith("https://")) {
        const pagesLink = document.createElement("a");
        pagesLink.href = pagesUrl;
        pagesLink.innerHTML = "🌐";
        pagesLink.target = "_blank";
        pagesLink.rel = "noopener noreferrer";
        pagesLink.className = "repo-action-icon repo-gh-pages-icon";
        pagesLink.title = `View GitHub Pages for ${repo.name}`;
        pagesLink.setAttribute("aria-label", "View GitHub Pages");
        cardActionsDiv.appendChild(pagesLink);
      }
    }

    // Issues icon/link
    const issuesLink = document.createElement("a");
    issuesLink.href = `${repo.html_url}/issues/new/choose`;
    issuesLink.innerHTML = '<i class="fas fa-bug"></i>'; // Font Awesome bug icon
    issuesLink.target = "_blank";
    issuesLink.rel = "noopener noreferrer";
    issuesLink.className = "repo-action-icon repo-issues-icon";
    issuesLink.title = `Report an issue or suggest a feature for ${repo.name}`;
    issuesLink.setAttribute(
      "aria-label",
      `Report issue or suggest feature for ${repo.name}`
    );
    cardActionsDiv.appendChild(issuesLink);

    repoCard.appendChild(cardActionsDiv);

    // Description
    if (repo.description) {
      const descP = document.createElement("p");
      descP.className = "repo-description";
      descP.textContent = repo.description;
      repoCard.appendChild(descP);
    }

    // Repo meta (language, stars, forks)
    const metaDiv = document.createElement("div");
    metaDiv.className = "repo-meta";

    if (repo.language) {
      const langSpan = document.createElement("span");
      langSpan.className = "repo-language";
      // Using innerHTML to include Font Awesome icon
      langSpan.innerHTML = `<i class="fas fa-laptop-code"></i> ${repo.language}`;
      metaDiv.appendChild(langSpan);
    }

    const starsSpan = document.createElement("span");
    starsSpan.className = "repo-stars";
    starsSpan.innerHTML = `<i class="fas fa-star"></i> ${repo.stargazers_count}`;
    metaDiv.appendChild(starsSpan);

    const forksSpan = document.createElement("span");
    forksSpan.className = "repo-forks";
    forksSpan.innerHTML = `<i class="fas fa-code-branch"></i> ${repo.forks_count}`;
    metaDiv.appendChild(forksSpan);

    repoCard.appendChild(metaDiv);

    // Topics (if any)
    if (repo.topics && repo.topics.length > 0) {
      const topicsDiv = document.createElement("div");
      topicsDiv.className = "repo-topics";
      const labelStrong = document.createElement("strong");
      labelStrong.textContent = "Topics: ";
      topicsDiv.appendChild(labelStrong);

      repo.topics.forEach((topic) => {
        const topicSpan = document.createElement("span");
        topicSpan.className = "repo-topic";
        topicSpan.textContent = topic;
        topicsDiv.appendChild(topicSpan);
      });

      repoCard.appendChild(topicsDiv);
    }

    return repoCard;
  }

  function displayRepos(repos) {
    const fragment = document.createDocumentFragment();
    repos.forEach((repo) => {
      const repoCard = createRepoCardElement(repo);
      fragment.appendChild(repoCard);
    });
    repoListDiv.appendChild(fragment);
  }

  // --- INTERACTIVE SOUNDS ---
  function initializeCatSound() {
    const catCallElement = document.getElementById("cat-call");
    const catAudioElement = document.getElementById("cat-sound");

    if (!catCallElement || !catAudioElement) {
      if (!catCallElement) console.warn("Cat call element (#cat-call) not found for sound effect.");
      if (!catAudioElement) console.warn("Cat sound audio element (#cat-sound) not found.");
      return; // Exit if essential elements are missing
    }

    let canPlaySound = true;
    const GENERAL_SOUND_COOLDOWN_MS = 1000; // Min 1 sec between any sound

    const ANGRY_MEOW_SOUND_PATH = "sounds/angrymeow.mp3";
    // All available sounds. Ensure ANGRY_MEOW_SOUND_PATH is in this list if it's a possibility.
    const ALL_CAT_SOUNDS = [
      "sounds/meow.mp3",
      ANGRY_MEOW_SOUND_PATH,
      "sounds/sweetkitty.wav",
    ];
    // Sounds to pick from when not playing the angry meow
    const OTHER_RANDOM_SOUNDS = ALL_CAT_SOUNDS.filter(sound => sound !== ANGRY_MEOW_SOUND_PATH);

    let hoverTimestamps = [];
    const ANGER_THRESHOLD_COUNT = 3; // More than 3 times
    const ANGER_TIME_WINDOW_MS = 10000; // in a 10-second cycle
    function getCatBehaviorVolume() {
      const currentHour = new Date().getHours();
      // Cats are often active in the morning (crepuscular - dawn)
      // and evening (crepuscular - dusk).
      // Let's define some volume levels (0.0 to 1.0)
      if (currentHour >= 5 && currentHour < 9) { // Morning activity (5 AM - 9 AM)
        return 0.8; // Louder
      } else if (currentHour >= 18 && currentHour < 22) { // Evening activity (6 PM - 10 PM)
        return 0.9; // Loudest
      } else if (currentHour >= 22 || currentHour < 5) { // Late night / Early morning (10 PM - 5 AM)
        return 0.3; // Quieter, sleepy cat
      } else { // Daytime (9 AM - 6 PM)
        return 0.5; // Medium, cat might be napping or just chilling
      }
    }

    function triggerCatSound() {
      if (!canPlaySound) return;

      canPlaySound = false; // Apply general cooldown
      const currentTime = Date.now();
      hoverTimestamps.push(currentTime);
        hoverTimestamps = hoverTimestamps.filter(
          (ts) => currentTime - ts < ANGER_TIME_WINDOW_MS
        );

        let soundToPlay;

        if (hoverTimestamps.length > ANGER_THRESHOLD_COUNT) {
          soundToPlay = ANGRY_MEOW_SOUND_PATH;
        } else {
          if (OTHER_RANDOM_SOUNDS.length > 0) {
            soundToPlay =
              OTHER_RANDOM_SOUNDS[
                Math.floor(Math.random() * OTHER_RANDOM_SOUNDS.length)
              ];
          } else {
            // Fallback if OTHER_RANDOM_SOUNDS is empty (e.g., if ALL_CAT_SOUNDS only had the angry one)
            soundToPlay = null;
          }
        }

      if (soundToPlay) {
        catAudioElement.src = soundToPlay;
        catAudioElement.volume = getCatBehaviorVolume(); // Set volume based on time
        catAudioElement.currentTime = 0; // Rewind to start
        catAudioElement.play().catch((error) => {
          console.warn("Could not play cat sound:", error);
        });
      }
      setTimeout(() => {
        canPlaySound = true;
      }, GENERAL_SOUND_COOLDOWN_MS);
    }

    catCallElement.addEventListener("mouseenter", triggerCatSound);
    catCallElement.addEventListener("click", triggerCatSound); // Added for touch/click support

  }
  // --- INITIALIZE ---
  loadInitialTheme();
  fetchAndDisplayRepos();
  initializeCatSound();
});

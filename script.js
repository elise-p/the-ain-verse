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
  const GITHUB_API_ACCEPT_HEADER = "application/vnd.github.mercy-preview+json"; // For topics

  // --- PRE-FLIGHT CHECKS ---
  if (!statusDiv || !repoListDiv) {
    console.error(
      "Error: Required DOM elements (#status or #repoList) not found."
    );
    // If statusDiv exists, display error there. Otherwise, it's already logged.
    if (statusDiv) statusDiv.textContent = "❌ Critical error: Page structure is missing required elements.";
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
          Accept: GITHUB_API_ACCEPT_HEADER,
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
      let errorMessage = `❌ Error: ${error.message}.`;
      if (error.message.includes("403")) {
        errorMessage += " This might be due to API rate limiting. Please try again later.";
      }
      errorMessage += " Check console for more details.";
      statusDiv.innerHTML = `${errorMessage} <button id="retry-fetch">Retry</button>`;
      statusDiv.style.color = "red";
      document.getElementById("retry-fetch")?.addEventListener("click", fetchAndDisplayRepos);
    }
  }

  function createRepoCardElement(repo) {
    const repoCard = document.createElement("div");
    repoCard.className = "repo-card";

    const repoNameLink = document.createElement("a");
    repoNameLink.href = repo.html_url;
    repoNameLink.textContent = repo.name;
    repoNameLink.target = "_blank";
    repoNameLink.rel = "noopener noreferrer";

    const repoNameHeading = document.createElement("h3");
    repoNameHeading.appendChild(repoNameLink);

    function getGhPagesUrl(repoData) {
      if (repoData.homepage && typeof repoData.homepage === 'string' && repoData.homepage.trim() !== "" && (repoData.homepage.startsWith("http://") || repoData.homepage.startsWith("https://"))) {
        return repoData.homepage;
      }
      if (repoData.name.toLowerCase() === `${GITHUB_USERNAME.toLowerCase()}.github.io`) {
        return `https://${GITHUB_USERNAME.toLowerCase()}.github.io/`;
      }
      return `https://${GITHUB_USERNAME.toLowerCase()}.github.io/${repoData.name}/`;
    }

    repoCard.appendChild(repoNameHeading);

    const cardActionsDiv = document.createElement("div");
    cardActionsDiv.className = "repo-card-actions";

    if (repo.has_pages) {
      const pagesUrl = getGhPagesUrl(repo);
      if (pagesUrl) {
        const pagesLink = document.createElement("a");
        pagesLink.href = pagesUrl;
        pagesLink.innerHTML = '<i class="fas fa-external-link-alt"></i>';
        pagesLink.target = "_blank";
        pagesLink.rel = "noopener noreferrer";
        pagesLink.className = "repo-action-icon repo-gh-pages-icon";
        pagesLink.title = `View GitHub Pages for ${repo.name}`;
        pagesLink.setAttribute("aria-label", `View GitHub Pages for ${repo.name}`);
        cardActionsDiv.appendChild(pagesLink);
      }
    }

    const issuesLink = document.createElement("a");
    issuesLink.href = `${repo.html_url}/issues/new/choose`;
    issuesLink.innerHTML = '<i class="fas fa-bug"></i>';
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

    if (repo.description) {
      const descP = document.createElement("p");
      descP.className = "repo-description";
      descP.textContent = repo.description;
      repoCard.appendChild(descP);
    }

    const metaDiv = document.createElement("div");
    metaDiv.className = "repo-meta";

    if (repo.language) {
      const langSpan = document.createElement("span");
      langSpan.className = "repo-language";
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
    const catMoodIndicator = document.getElementById("cat-mood-indicator");

    if (!catCallElement || !catAudioElement || !catMoodIndicator) {
      if (!catCallElement) console.warn("Cat call element (#cat-call) not found for sound effect.");
      if (!catAudioElement) console.warn("Cat sound audio element (#cat-sound) not found.");
      if (!catMoodIndicator) console.warn("Cat mood indicator element (#cat-mood-indicator) not found.");
      return;
    }

    if (catAudioElement.src) {
        catAudioElement.load();
    }

    let canPlaySound = true;
    const GENERAL_SOUND_COOLDOWN_MS = 500;

    const ANGRY_SOUND_FILES = [
      "sounds/cat-angry-1.mp3"
    ];

    const NORMAL_CAT_SOUNDS = [
      "sounds/cat-meow-1.mp3", "sounds/cat-meow-2.mp3", "sounds/cat-meow-3.mp3",
      "sounds/cat-meow-4.mp3", "sounds/cat-meow-5.mp3", "sounds/cat-meow-6.mp3",
      "sounds/cat-meow-7.mp3", "sounds/cat-growl.mp3", "sounds/cat-growl-2.mp3",
      "sounds/cat-growl-3.mp3"
    ];

    const OTHER_RANDOM_SOUNDS = NORMAL_CAT_SOUNDS;

    let hoverTimestamps = [];
    const ANGER_THRESHOLD_COUNT = 5;
    const IDLE_EMOJI_TIMEOUT_MS = 5000; // 5 seconds for idle emoji
    const ANGER_TIME_WINDOW_MS = 10000;

    function getCatBehaviorVolume() {
      const currentHour = new Date().getHours();
      if (currentHour >= 5 && currentHour < 9) return 0.8;
      if (currentHour >= 18 && currentHour < 22) return 0.9;
      if (currentHour >= 22 || currentHour < 5) return 0.3;
      return 0.5;
    }

    let idleEmojiTimeoutId = null;
    function setIdleEmoji() {
      if (catMoodIndicator) catMoodIndicator.textContent = "💤";
      if (catCallElement) { // Reset pspsps style when cat goes to sleep
        catCallElement.style.fontWeight = '';
        catCallElement.style.color = 'var(--cat-mood-idle-color)';
        catCallElement.style.textTransform = 'none';
      }
    }

    function resetIdleEmojiTimer() {
      if (idleEmojiTimeoutId) clearTimeout(idleEmojiTimeoutId);
      idleEmojiTimeoutId = setTimeout(setIdleEmoji, IDLE_EMOJI_TIMEOUT_MS);
    }

    function triggerCatSound() {
      if (!canPlaySound) return;
      if (idleEmojiTimeoutId) clearTimeout(idleEmojiTimeoutId); // Clear idle timer on new interaction

      canPlaySound = false;
      const currentTime = Date.now();
      hoverTimestamps.push(currentTime);
      hoverTimestamps = hoverTimestamps.filter(
        (ts) => currentTime - ts < ANGER_TIME_WINDOW_MS
      );

      let soundToPlay;
      let currentMoodEmoji = catMoodIndicator.textContent; // Default to current
      let currentMoodColor = catCallElement.style.color || 'var(--cat-mood-default-color)'; // Default to current or a base color

      if (hoverTimestamps.length > ANGER_THRESHOLD_COUNT) {
        soundToPlay = ANGRY_SOUND_FILES[Math.floor(Math.random() * ANGRY_SOUND_FILES.length)];
        currentMoodEmoji = "😾";
        currentMoodColor = 'var(--cat-mood-angry-color)';
        if (catCallElement) { // Style the "pspspsps" text
          catCallElement.style.fontWeight = 'bold';
          catCallElement.style.textTransform = 'uppercase';
        }
      } else {
        // Reset font weight and transform if not angry
        if (catCallElement) {
          catCallElement.style.fontWeight = '';
          catCallElement.style.textTransform = 'none';
        }
        if (OTHER_RANDOM_SOUNDS.length > 0) {
          soundToPlay = OTHER_RANDOM_SOUNDS[Math.floor(Math.random() * OTHER_RANDOM_SOUNDS.length)];
          const currentHour = new Date().getHours();
          if (currentHour >= 5 && currentHour < 9) { currentMoodEmoji = "😺✨"; currentMoodColor = 'var(--cat-mood-playful-color)'; }
          else if (currentHour >= 18 && currentHour < 22) { currentMoodEmoji = "😼🌙"; currentMoodColor = 'var(--cat-mood-alert-color)'; }
          else { currentMoodEmoji = "🐾"; currentMoodColor = 'var(--cat-mood-default-color)'; }
        } else {
          soundToPlay = null;
          }
      }

      if (catMoodIndicator) catMoodIndicator.textContent = currentMoodEmoji;
      if (catCallElement) catCallElement.style.color = currentMoodColor;

      if (soundToPlay) {
        catAudioElement.src = soundToPlay;
        catAudioElement.oncanplaythrough = () => {
          catAudioElement.volume = getCatBehaviorVolume();
          catAudioElement.currentTime = 0;
          catAudioElement.play().catch((error) => {
            console.warn("Could not play cat sound:", error);
          });
          catAudioElement.oncanplaythrough = null;
        };
        catAudioElement.load();
      }

      setTimeout(() => {
        canPlaySound = true;
      }, GENERAL_SOUND_COOLDOWN_MS);

      resetIdleEmojiTimer(); // Start/reset the idle emoji timer after every interaction
    }

    resetIdleEmojiTimer(); // Initialize idle timer on page load (after initial setup)
    catCallElement.addEventListener("mouseenter", triggerCatSound);
    catCallElement.addEventListener("click", triggerCatSound);
  }

  // --- INITIALIZE ---
  loadInitialTheme();
  fetchAndDisplayRepos();
  initializeCatSound();
});

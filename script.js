document.addEventListener("DOMContentLoaded", () => {
  // --- CONFIGURATION ---
  const GITHUB_USERNAME = "ainstarc";
  const API_URL = `https://api.github.com/users/${GITHUB_USERNAME}/repos?sort=updated&per_page=100`; // Get up to 100 repos, sorted by last update

  // --- DOM ELEMENTS ---
  const statusDiv = document.getElementById("status");
  const repoListDiv = document.getElementById("repoList");
  const themeToggleButton = document.getElementById("theme-toggle"); // Assuming you add a button with this ID

  // --- CONSTANTS ---
  const THEME_STORAGE_KEY = "user-theme-preference";

  // --- PRE-FLIGHT CHECKS ---
  if (!statusDiv || !repoListDiv) {
    console.error("Error: Required DOM elements (#status or #repoList) not found.");
    if (statusDiv) statusDiv.textContent = "❌ Critical error: Page structure is missing required elements.";
    return;
  }

  // --- THEME FUNCTIONS ---
  function applyTheme(theme) {
    if (theme === "dark") {
      document.body.classList.add("dark-theme");
      if (themeToggleButton) {
        themeToggleButton.textContent = "☀️ Light Mode"; // Or an icon
        themeToggleButton.setAttribute("aria-pressed", "true");
      }
    } else {
      document.body.classList.remove("dark-theme");
      if (themeToggleButton) {
        themeToggleButton.textContent = "🌙 Dark Mode"; // Or an icon
        themeToggleButton.setAttribute("aria-pressed", "false");
      }
    }
    localStorage.setItem(THEME_STORAGE_KEY, theme);
  }

  function toggleTheme() {
    const currentThemeIsDark = document.body.classList.contains("dark-theme");
    applyTheme(currentThemeIsDark ? "light" : "dark");
  }

  function loadInitialTheme() {
    const savedTheme = localStorage.getItem(THEME_STORAGE_KEY);
    const prefersDarkScheme = window.matchMedia("(prefers-color-scheme: dark)").matches;

    if (savedTheme) {
      applyTheme(savedTheme);
    } else if (prefersDarkScheme) {
      applyTheme("dark");
    } else {
      applyTheme("light"); // Default to light if no preference or saved theme
    }

    // Initialize aria-pressed state based on the loaded theme
    if (themeToggleButton) {
        themeToggleButton.setAttribute("aria-pressed", document.body.classList.contains("dark-theme") ? "true" : "false");
    }

    // Add event listener for the theme toggle button if it exists
    if (themeToggleButton) {
      themeToggleButton.addEventListener("click", toggleTheme);
    } else {
      console.warn("Theme toggle button (#theme-toggle) not found. Theme switching via UI will not be available.");
    }
  }

  // --- FUNCTIONS ---

  async function fetchAndDisplayRepos() {
    statusDiv.textContent = "🔄 Loading projects...";
    repoListDiv.innerHTML = ""; // Clear any existing content

    try {
      const response = await fetch(API_URL);

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

      if (repos.length === 0) {
        statusDiv.textContent =
          "🤷 No public repositories found for this user.";
        return;
      }

      displayRepos(repos);
      statusDiv.textContent = ""; // Clear loading message on success
    } catch (error) {
      console.error("Error fetching repositories:", error);
      statusDiv.textContent = `❌ Error: ${error.message}. Check the console for more details.`;
      statusDiv.style.color = "red";
    }
  }

  function createRepoCardElement(repo) {
    const repoCard = document.createElement("div");
    repoCard.className = "repo-card"; // For styling

    // Repository Name (Link to GitHub repo)
    const repoNameLink = document.createElement("a");
    repoNameLink.href = repo.html_url;
    repoNameLink.textContent = repo.name;
    repoNameLink.target = "_blank";
    repoNameLink.rel = "noopener noreferrer";
    const repoNameHeading = document.createElement("h3");
    repoNameHeading.appendChild(repoNameLink);
    repoCard.appendChild(repoNameHeading);

    // Create a container for action icons
    const cardActionsDiv = document.createElement('div');
    cardActionsDiv.className = 'repo-card-actions';

    // Description
    if (repo.description) {
      const descriptionP = document.createElement("p");
      descriptionP.className = "repo-description";
      descriptionP.textContent = repo.description;
      repoCard.appendChild(descriptionP);
    }

    // GitHub Pages Link (as an icon)
    if (repo.has_pages) {
      let pagesUrl = repo.homepage; // Use homepage if available
      if (!pagesUrl || pagesUrl.trim() === "") {
        // Construct default URL if homepage is not set or empty
        // User/Org site: <username>.github.io repo maps to https://<username>.github.io
        // Project site: <repo-name> maps to https://<username>.github.io/<repo-name>
        if (
          repo.name.toLowerCase() ===
          `${GITHUB_USERNAME.toLowerCase()}.github.io`
        ) {
          pagesUrl = `https://${GITHUB_USERNAME.toLowerCase()}.github.io/`;
        } else {
          pagesUrl = `https://${GITHUB_USERNAME.toLowerCase()}.github.io/${
            repo.name
          }/`;
        }
      }
      // Basic validation if it looks like a URL
      if (
        pagesUrl &&
        (pagesUrl.startsWith("http://") || pagesUrl.startsWith("https://"))
      ) {
        const pagesLinkA = document.createElement("a");
        pagesLinkA.href = pagesUrl;
        pagesLinkA.innerHTML = "🌐"; // Globe icon (Unicode)
        pagesLinkA.target = "_blank";
        pagesLinkA.rel = "noopener noreferrer";
        pagesLinkA.className = "repo-action-icon repo-gh-pages-icon";
        pagesLinkA.title = "View GitHub Pages";
        cardActionsDiv.appendChild(pagesLinkA);
      }
    }

    // Link to Repository Issues (as an icon)
    const issuesLink = document.createElement('a');
    issuesLink.href = `${repo.html_url}/issues/new/choose`; // Link to the specific repo's new issue page
    issuesLink.innerHTML = "❗"; // Exclamation mark icon (Unicode)
    issuesLink.target = "_blank";
    issuesLink.rel = "noopener noreferrer";
    issuesLink.className = 'repo-action-icon repo-issues-icon'; // Class for styling
    issuesLink.title = `Report an issue or suggest a feature for ${repo.name}`;
    cardActionsDiv.appendChild(issuesLink);

    // Append the actions container to the card
    repoCard.appendChild(cardActionsDiv);

    // Details (Language, Stars, Forks)
    const detailsDiv = document.createElement("div");
    detailsDiv.className = "repo-meta";

    if (repo.language) {
      const languageSpan = document.createElement("span");
      languageSpan.className = "repo-language";
      languageSpan.textContent = `💻 ${repo.language}`;
      detailsDiv.appendChild(languageSpan);
    }

    const starsSpan = document.createElement("span");
    starsSpan.className = "repo-stars";
    starsSpan.textContent = `⭐ ${repo.stargazers_count}`;
    detailsDiv.appendChild(starsSpan);

    const forksSpan = document.createElement("span");
    forksSpan.className = "repo-forks";
    forksSpan.textContent = `🍴 ${repo.forks_count}`;
    detailsDiv.appendChild(forksSpan);

    repoCard.appendChild(detailsDiv);

    // Topics
    if (repo.topics && repo.topics.length > 0) {
      const topicsDiv = document.createElement('div');
      topicsDiv.className = 'repo-topics';
      const topicsLabel = document.createElement('strong');
      topicsLabel.textContent = "Topics: ";
      topicsDiv.appendChild(topicsLabel);
      repo.topics.forEach((topic) => {
        const topicSpan = document.createElement('span');
        topicSpan.className = 'repo-topic';
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
      const repoCardElement = createRepoCardElement(repo);
      fragment.appendChild(repoCardElement);
    });
    repoListDiv.appendChild(fragment);
  }

  // --- START EXECUTION ---
  loadInitialTheme(); // Load theme first
  fetchAndDisplayRepos();
});

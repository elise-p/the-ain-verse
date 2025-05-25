import { GITHUB_USERNAME, GITHUB_API_ACCEPT_HEADER } from './config.js';


const MAX_ISSUES_TO_DISPLAY = 5;
let liveIssuesContainer = null;
let liveIssuesToggle = null;
let liveIssuesList = null;
let isSectionInitialized = false;

function createIssueElement(issue) {
  const listItem = document.createElement("li");
  listItem.className = "live-issue-item";

  const titleLink = document.createElement("a");
  titleLink.href = issue.html_url;
  titleLink.textContent = issue.title;
  titleLink.target = "_blank";
  titleLink.rel = "noopener noreferrer";
  titleLink.className = "live-issue-title";

  const repoNameSpan = document.createElement("span");
  repoNameSpan.className = "live-issue-repo-name";
  // Extract repo name from issue.repository_url
  const repoUrlParts = issue.repository_url.split("/");
  repoNameSpan.textContent = repoUrlParts[repoUrlParts.length - 1];

  listItem.appendChild(titleLink);
  listItem.appendChild(repoNameSpan);

  if (issue.labels && issue.labels.length > 0) {
    const labelsDiv = document.createElement("div");
    labelsDiv.className = "live-issue-labels";
    issue.labels.slice(0, 3).forEach((label) => {
      // Show max 3 labels
      const labelSpan = document.createElement("span");
      labelSpan.className = "live-issue-label";
      labelSpan.textContent = label.name;
      // Basic styling for labels based on their color
      labelSpan.style.backgroundColor = `#${label.color}`;
      // Calculate brightness to set text color (simple version)
      const r = parseInt(label.color.substring(0, 2), 16);
      const g = parseInt(label.color.substring(2, 4), 16);
      const b = parseInt(label.color.substring(4, 6), 16);
      const brightness = (r * 299 + g * 587 + b * 114) / 1000;
      labelSpan.style.color = brightness > 128 ? "#000000" : "#FFFFFF";
      labelsDiv.appendChild(labelSpan);
    });
    listItem.appendChild(labelsDiv);
  }

  return listItem;
}

async function fetchAndRenderLiveIssues() {
  if (!liveIssuesList || !liveIssuesToggle) return;

  liveIssuesList.innerHTML =
    '<li><i class="fas fa-spinner fa-spin"></i> Loading latest issues...</li>';
  liveIssuesToggle.disabled = true;

  try {
    const response = await fetch(
      `https://api.github.com/search/issues?q=user:${GITHUB_USERNAME}+is:open+is:issue&sort=created&order=desc&per_page=${MAX_ISSUES_TO_DISPLAY}`,
      { headers: { 
        Accept: GITHUB_API_ACCEPT_HEADER
      } }
    );

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

    const data = await response.json();
    liveIssuesList.innerHTML = ""; // Clear loading message

    if (data.items && data.items.length > 0) {
      data.items.forEach((issue) => {
        liveIssuesList.appendChild(createIssueElement(issue));
      });
    } else {
      liveIssuesList.innerHTML = "<li>No open issues found recently.</li>";
    }
  } catch (error) {
    console.error("Error fetching live issues:", error);
    liveIssuesList.innerHTML = `<li>Error loading issues: ${error.message}</li>`;
  } finally {
    liveIssuesToggle.disabled = false;
  }
}

function toggleLiveIssuesSection() {
  if (!liveIssuesContainer || !liveIssuesToggle) return;

  const isCurrentlyOpen = liveIssuesContainer.classList.contains("sidebar-open");

  if (isCurrentlyOpen) {
    // === CLOSE SIDEBAR ===
    liveIssuesContainer.classList.remove("sidebar-open"); // Start slide-out animation
    liveIssuesToggle.setAttribute("aria-expanded", "false");
    liveIssuesToggle.innerHTML = '<i class="fas fa-list-alt"></i> View Issues';

    // Hide with display:none after transition to remove from layout
    const handleTransitionEnd = () => {
      liveIssuesContainer.style.display = 'none';
      liveIssuesContainer.removeEventListener('transitionend', handleTransitionEnd);
    };
    liveIssuesContainer.addEventListener('transitionend', handleTransitionEnd);

  } else {
    // === OPEN SIDEBAR ===
    liveIssuesContainer.style.display = 'flex'; // Make it visible (display:flex for layout)

    // Force a reflow or use requestAnimationFrame to ensure 'display' change is applied before transition starts
    requestAnimationFrame(() => {
      liveIssuesContainer.classList.add("sidebar-open"); // Add class to trigger slide-in animation
      liveIssuesToggle.setAttribute("aria-expanded", "true");
      liveIssuesToggle.innerHTML = '<i class="fas fa-times"></i> Close Issues';
    });

    // Fetch issues if the list is empty or was showing "no issues"
    if (liveIssuesList.children.length === 0 ||
        (liveIssuesList.children.length === 1 &&
         liveIssuesList.firstChild && // Ensure firstChild exists
         liveIssuesList.firstChild.textContent && // Ensure textContent exists
         liveIssuesList.firstChild.textContent.includes("No open issues"))
    ) {
      fetchAndRenderLiveIssues();
    }
  }
}

/**
 * Initializes the live issues section, sets up the toggle button,
 * and ensures the sidebar is hidden initially.
 */
export function initializeLiveIssues() {
  if (isSectionInitialized) return;

  liveIssuesContainer = document.getElementById("live-issues-section");
  liveIssuesToggle = document.getElementById("live-issues-toggle");
  liveIssuesList = document.getElementById("live-issues-list");

  if (!liveIssuesContainer || !liveIssuesToggle || !liveIssuesList) {
    console.warn(
      "Live issues section DOM elements not found. Feature will not be available."
    );
    return;
  }

  liveIssuesToggle.addEventListener("click", toggleLiveIssuesSection);

  // Optional: If you add an internal close button inside the sidebar:
  // const internalCloseButton = document.getElementById('live-issues-internal-close-btn');
  // if (internalCloseButton) {
  //   internalCloseButton.addEventListener('click', toggleLiveIssuesSection);
  // }

  // Set initial state for toggle button (closed)
  liveIssuesToggle.innerHTML = '<i class="fas fa-list-alt"></i> View Issues';
  liveIssuesToggle.setAttribute("aria-expanded", "false");
  liveIssuesContainer.classList.remove("sidebar-open"); // Ensure no 'open' class
  liveIssuesContainer.style.display = 'none'; // Hide the sidebar initially
  liveIssuesContainer.classList.add("live-issues-sidebar"); // Base class for styling

  isSectionInitialized = true;
  console.log("Live Issues Section Initialized.");

  // Optional: Fetch issues immediately if you want the section to be populated
  // even when initially collapsed, or if you want to show a count on the toggle.
  // For now, it fetches when first expanded.
}

// Example of how to refresh issues (e.g., by a button or timer)
export function refreshLiveIssues() {
  if (
    liveIssuesContainer &&
    liveIssuesContainer.classList.contains("sidebar-open")
  ) {
    fetchAndRenderLiveIssues();
  } else if (liveIssuesList) {
    // Clear list if not expanded so it fetches fresh on next expand
    liveIssuesList.innerHTML = "";
  }
}

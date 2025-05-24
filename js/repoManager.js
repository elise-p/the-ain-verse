import { GITHUB_USERNAME, API_URL, GITHUB_API_ACCEPT_HEADER } from './config.js';
import { statusDiv, repoListDiv } from './domElements.js';

function getGhPagesUrl(repoData) {
  if (repoData.homepage && typeof repoData.homepage === 'string' && repoData.homepage.trim() !== "" && (repoData.homepage.startsWith("http://") || repoData.homepage.startsWith("https://"))) {
    return repoData.homepage;
  }
  if (repoData.name.toLowerCase() === `${GITHUB_USERNAME.toLowerCase()}.github.io`) {
    return `https://${GITHUB_USERNAME.toLowerCase()}.github.io/`;
  }
  return `https://${GITHUB_USERNAME.toLowerCase()}.github.io/${repoData.name}/`;
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
  repoCard.appendChild(repoNameHeading);

  const cardActionsDiv = document.createElement("div");
  cardActionsDiv.className = "repo-card-actions";

  if (repo.has_pages) {
    const pagesUrl = getGhPagesUrl(repo);
    if (pagesUrl) {
      repoCard.classList.add("repo-card--has-pages-preview");
      repoCard.dataset.pagesUrl = pagesUrl;
      repoCard.title = `Click to preview ${repo.name} GitHub Pages`;

      const pagesLinkIcon = document.createElement("a"); // This is the icon link
      pagesLinkIcon.href = pagesUrl;
      pagesLinkIcon.innerHTML = '<i class="fas fa-external-link-alt"></i>';
      pagesLinkIcon.target = "_blank";
      pagesLinkIcon.rel = "noopener noreferrer";
      pagesLinkIcon.className = "repo-action-icon repo-gh-pages-icon";
      pagesLinkIcon.title = `View GitHub Pages for ${repo.name}`;
      pagesLinkIcon.setAttribute("aria-label", `View GitHub Pages for ${repo.name}`);
      pagesLinkIcon.onclick = (e) => e.stopPropagation(); // Prevent card click when icon is clicked
      cardActionsDiv.appendChild(pagesLinkIcon);
    }
  }

  const issuesLink = document.createElement("a");
  issuesLink.href = `${repo.html_url}/issues/new/choose`;
  issuesLink.innerHTML = '<i class="fas fa-bug"></i>';
  issuesLink.target = "_blank";
  issuesLink.rel = "noopener noreferrer";
  issuesLink.className = "repo-action-icon repo-issues-icon";
  issuesLink.title = `Report an issue or suggest a feature for ${repo.name}`;
  issuesLink.setAttribute("aria-label", `Report issue or suggest feature for ${repo.name}`);
  issuesLink.onclick = (e) => e.stopPropagation(); // Prevent card click when icon is clicked
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
  repoListDiv.innerHTML = ""; // Clear previous before appending new
  const fragment = document.createDocumentFragment();
  repos.forEach((repo) => {
    const repoCard = createRepoCardElement(repo);
    fragment.appendChild(repoCard);
  });
  repoListDiv.appendChild(fragment);
}

function togglePagesPreview(event) {
  const repoCard = event.currentTarget;
  // Ensure we don't trigger preview if an action icon within the card was clicked
  if (event.target.closest('.repo-action-icon')) {
    return;
  }
  const pagesUrl = repoCard.dataset.pagesUrl;

  if (!pagesUrl) return;

  const existingIframeContainer = repoCard.querySelector(".pages-iframe-container");

  // For modal, we don't hide elements within the card itself.
  // The card might get an 'active' class for styling, but its content remains.

  if (existingIframeContainer) {
    // This logic was for in-card iframe, now we handle modal.
    // The modal removal will be handled by its own close function.
    // We just need to ensure the card's active state is reset if the modal is closed externally.
  } else {
    // Close any other active preview
    const currentlyActive = document.querySelector('.repo-card--preview-active');
    if (currentlyActive && currentlyActive !== repoCard) {
        togglePagesPreview({ currentTarget: currentlyActive, target: currentlyActive }); // Simulate event to close it
    }

    repoCard.classList.add("repo-card--preview-active");
    showPagesPreviewModal(pagesUrl, repoCard.querySelector('h3 a').textContent, repoCard);
  }
}

function closePagesPreviewModal() {
  const modal = document.getElementById("pages-preview-modal");
  if (modal) {
    modal.remove();
    document.body.classList.remove("modal-open");
    // Remove active state from any card that might have triggered it
    document.querySelectorAll('.repo-card--preview-active').forEach(card => {
      card.classList.remove('repo-card--preview-active');
    });
  }
}

function showPagesPreviewModal(pagesUrl, repoName, originatingCard) {
  closePagesPreviewModal(); // Close any existing modal

  const modalOverlay = document.createElement("div");
  modalOverlay.id = "pages-preview-modal";
  modalOverlay.className = "modal-overlay pages-preview-modal-overlay"; // Added specific class
  modalOverlay.onclick = (e) => {
    if (e.target === modalOverlay) { // Close only if overlay itself is clicked
      closePagesPreviewModal();
    }
  };

  const modalContent = document.createElement("div");
  modalContent.className = "modal-content pages-preview-modal-content"; // Added specific class

    const iframe = document.createElement("iframe");
    iframe.className = "pages-iframe";
    iframe.src = pagesUrl;
    iframe.sandbox = "allow-scripts allow-same-origin allow-popups allow-forms";
    iframe.title = `${repoName} GitHub Pages Preview`;
    iframe.setAttribute('loading', 'lazy');

    const closeButton = document.createElement("button");
    closeButton.className = "modal-close-btn pages-preview-close-btn"; // Added specific class
    closeButton.innerHTML = "&times;";
    closeButton.setAttribute("aria-label", "Close preview");
    closeButton.onclick = (e) => {
      e.stopPropagation();
      closePagesPreviewModal();
    };

  modalContent.appendChild(closeButton);
  modalContent.appendChild(iframe);
  modalOverlay.appendChild(modalContent);

  document.body.appendChild(modalOverlay);
  document.body.classList.add("modal-open");
  closeButton.focus();

  // Ensure the originating card has the active class
  if (originatingCard) originatingCard.classList.add('repo-card--preview-active');
}

export function setupInteractiveCardListeners() {
  // Use event delegation on repoListDiv for dynamically added cards
  // and to handle clicks more efficiently.
  repoListDiv.addEventListener('click', function(event) {
    const card = event.target.closest('.repo-card--has-pages-preview');
    if (card) {
      // Pass the original event target to togglePagesPreview to check for icon clicks
      togglePagesPreview({ currentTarget: card, target: event.target });
    }
  });

  // Add hover effects if desired (can also be pure CSS)
  repoListDiv.addEventListener('mouseover', function(event) {
    const card = event.target.closest('.repo-card--has-pages-preview');
    if (card && !card.classList.contains('repo-card--preview-active')) {
      card.classList.add("repo-card--hover-pop");
    }
  });
  repoListDiv.addEventListener('mouseout', function(event) {
    const card = event.target.closest('.repo-card--has-pages-preview');
    if (card) {
      card.classList.remove("repo-card--hover-pop");
    }
  });
}

export async function fetchAndDisplayRepos() {
  statusDiv.textContent = "🔄 Loading projects...";
  statusDiv.style.color = "";
  repoListDiv.innerHTML = "";

  try {
    const response = await fetch(API_URL, { headers: { Accept: GITHUB_API_ACCEPT_HEADER } });
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ message: response.statusText }));
      throw new Error(`GitHub API Error: ${response.status} - ${errorData.message || "Unknown error"}`);
    }
    const repos = await response.json();
    if (!Array.isArray(repos) || repos.length === 0) {
      statusDiv.textContent = "🤷 No public repositories found.";
      return;
    }
    displayRepos(repos);
    statusDiv.textContent = "";
  } catch (error) {
    console.error("Error fetching repositories:", error);
    let errorMessage = `❌ Error: ${error.message}.`;
    if (error.message.includes("403")) errorMessage += " This might be due to API rate limiting. Please try again later.";
    errorMessage += " Check console for more details.";
    statusDiv.innerHTML = `${errorMessage} <button id="retry-fetch">Retry</button>`;
    statusDiv.style.color = "red";
    const retryButton = document.getElementById("retry-fetch");
    if (retryButton) {
        retryButton.addEventListener("click", fetchAndDisplayRepos);
    }
  }
}

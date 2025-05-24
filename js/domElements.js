export const statusDiv = document.getElementById("status");
export const repoListDiv = document.getElementById("repoList");
export const themeToggleButton = document.getElementById("theme-toggle");
export const catCallElement = document.getElementById("cat-call");
export const catAudioElement = document.getElementById("cat-sound");
export const catMoodIndicator = document.getElementById("cat-mood-indicator");

export function performPreFlightChecks() {
  if (!statusDiv || !repoListDiv) {
    console.error(
      "Error: Required DOM elements (#status or #repoList) not found."
    );
    if (statusDiv) {
      statusDiv.textContent = "❌ Critical error: Page structure is missing required elements.";
    }
    return false; // Indicate failure
  }
  return true; // Indicate success
}
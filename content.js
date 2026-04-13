const DEFAULT_MESSAGE = '本番環境です。操作に注意して下さい。';
const DEFAULT_AUTO_BACK = false;
const STORAGE_KEYS = {
  projectNames: 'projectNames',
  dialogMessage: 'dialogMessage',
  autoBackOnProduction: 'autoBackOnProduction'
};

let settingsCache = {
  projectNames: [],
  dialogMessage: DEFAULT_MESSAGE,
  autoBackOnProduction: DEFAULT_AUTO_BACK
};
let lastHandledUrl = null;
let originalPushState = history.pushState;
let originalReplaceState = history.replaceState;

function normalizeName(name) {
  return (name || '').trim();
}

function escapeRegex(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function decodeUrlCandidates(url) {
  try {
    const parsed = new URL(url, location.origin);
    const href = parsed.href;
    const decodedHref = decodeURIComponent(href);
    return href === decodedHref ? [href] : [href, decodedHref];
  } catch {
    return [String(url || '')];
  }
}

function matchesProductionUrl(url, projectName) {
  const normalized = normalizeName(projectName);
  if (!normalized) return false;

  const escaped = escapeRegex(normalized);
  const pattern = new RegExp(`^https://dash\\.cloudflare\\.com/[^/]+/.*/${escaped}/production(?:$|[/?#])`, 'i');
  return decodeUrlCandidates(url).some((candidate) => pattern.test(candidate));
}

function getMatchedProject(url, projectNames) {
  for (const name of projectNames) {
    if (matchesProductionUrl(url, name)) {
      return name;
    }
  }
  return null;
}

async function loadSettings() {
  const loaded = await chrome.storage.sync.get({
    [STORAGE_KEYS.projectNames]: [],
    [STORAGE_KEYS.dialogMessage]: DEFAULT_MESSAGE,
    [STORAGE_KEYS.autoBackOnProduction]: DEFAULT_AUTO_BACK
  });

  settingsCache = {
    projectNames: Array.isArray(loaded.projectNames) ? loaded.projectNames.map(normalizeName).filter(Boolean) : [],
    dialogMessage: (loaded.dialogMessage || '').trim() || DEFAULT_MESSAGE,
    autoBackOnProduction: !!loaded.autoBackOnProduction
  };
}

function showWarning(projectName) {
  const message = `${settingsCache.dialogMessage}\n\nプロジェクト: ${projectName}\nURL: ${location.href}`;
  alert(message);
}

function autoBackIfNeeded() {
  if (!settingsCache.autoBackOnProduction) return;
  if (history.length <= 1) return;
  window.setTimeout(() => {
    history.back();
  }, 0);
}

function evaluateCurrentUrl() {
  const currentUrl = location.href;
  const matchedProject = getMatchedProject(currentUrl, settingsCache.projectNames);

  if (!matchedProject) {
    lastHandledUrl = null;
    return;
  }

  if (currentUrl === lastHandledUrl) {
    return;
  }

  lastHandledUrl = currentUrl;
  showWarning(matchedProject);
  autoBackIfNeeded();
}

function scheduleEvaluation() {
  window.setTimeout(evaluateCurrentUrl, 0);
}

function wrapHistoryMethod(original) {
  return function wrappedHistoryMethod(...args) {
    const result = original.apply(this, args);
    scheduleEvaluation();
    return result;
  };
}

function installSpaHooks() {
  if (history.pushState !== originalPushState) return;
  history.pushState = wrapHistoryMethod(originalPushState);
  history.replaceState = wrapHistoryMethod(originalReplaceState);
  window.addEventListener('popstate', scheduleEvaluation, true);
  window.addEventListener('hashchange', scheduleEvaluation, true);
}

function watchStorageChanges() {
  chrome.storage.onChanged.addListener((changes, area) => {
    if (area !== 'sync') return;

    if (changes.projectNames) {
      settingsCache.projectNames = Array.isArray(changes.projectNames.newValue)
        ? changes.projectNames.newValue.map(normalizeName).filter(Boolean)
        : [];
    }

    if (changes.dialogMessage) {
      settingsCache.dialogMessage = (changes.dialogMessage.newValue || '').trim() || DEFAULT_MESSAGE;
    }

    if (changes.autoBackOnProduction) {
      settingsCache.autoBackOnProduction = !!changes.autoBackOnProduction.newValue;
    }

    lastHandledUrl = null;
    evaluateCurrentUrl();
  });
}

(function init() {
  installSpaHooks();
  watchStorageChanges();
  loadSettings().then(() => {
    evaluateCurrentUrl();
  });

  const observer = new MutationObserver(() => {
    evaluateCurrentUrl();
  });

  observer.observe(document.documentElement || document.body, {
    childList: true,
    subtree: true
  });
})();

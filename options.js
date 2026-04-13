const DEFAULT_MESSAGE = '本番環境です。操作に注意して下さい。';
const DEFAULT_AUTO_BACK = false;

function normalizeProjectNames(text) {
  return Array.from(new Set(
    text
      .split(/\r?\n/)
      .map((s) => s.trim())
      .filter(Boolean)
  ));
}

async function loadSettings() {
  const {
    projectNames = [],
    dialogMessage = DEFAULT_MESSAGE,
    autoBackOnProduction = DEFAULT_AUTO_BACK
  } = await chrome.storage.sync.get({
    projectNames: [],
    dialogMessage: DEFAULT_MESSAGE,
    autoBackOnProduction: DEFAULT_AUTO_BACK
  });

  document.getElementById('projectNames').value = projectNames.join('\n');
  document.getElementById('dialogMessage').value = dialogMessage;
  document.getElementById('autoBackOnProduction').checked = !!autoBackOnProduction;
}

async function saveSettings() {
  const projectNames = normalizeProjectNames(document.getElementById('projectNames').value);
  const dialogMessage = (document.getElementById('dialogMessage').value || '').trim() || DEFAULT_MESSAGE;
  const autoBackOnProduction = document.getElementById('autoBackOnProduction').checked;

  await chrome.storage.sync.set({ projectNames, dialogMessage, autoBackOnProduction });

  const status = document.getElementById('status');
  status.textContent = `保存しました（${projectNames.length}件）`;
  setTimeout(() => {
    if (status.textContent.startsWith('保存しました')) {
      status.textContent = '';
    }
  }, 2000);
}

async function resetSettings() {
  document.getElementById('projectNames').value = '';
  document.getElementById('dialogMessage').value = DEFAULT_MESSAGE;
  document.getElementById('autoBackOnProduction').checked = DEFAULT_AUTO_BACK;
  await chrome.storage.sync.set({
    projectNames: [],
    dialogMessage: DEFAULT_MESSAGE,
    autoBackOnProduction: DEFAULT_AUTO_BACK
  });
  document.getElementById('status').textContent = '初期値に戻しました';
}

document.getElementById('saveBtn').addEventListener('click', saveSettings);
document.getElementById('resetBtn').addEventListener('click', resetSettings);

document.addEventListener('DOMContentLoaded', loadSettings);

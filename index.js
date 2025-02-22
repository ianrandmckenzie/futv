let highestZ = 100;
let activeMediaWindow = null; // ID of the active window with media
// Global state for windows (keyed by window id)
let windowStates = {};
// Global state for desktop icons positions
let desktopIconsState = {};
// Mapping for navigation windows to avoid duplicates
let navWindows = {};
// Global desktop settings (background, clock seconds)
let desktopSettings = {
  clockSeconds: false,
  bgColor: "#20b1b1", // Default color now set to #20b1b1
  bgImage: ""
};

/* =====================
File Explorer Window Type
This returns the HTML for a file explorer window.
====================== */
function getExplorerWindowContent(currentPath = 'C://') {
  return `
    <div id="file-explorer">
      <div class="flex">
        <!-- Left Sidebar -->
        <div id="file-sidebar" class="w-1/4 border-r p-2">
          <ul>
            <li class="cursor-pointer border-b border-gray-200 hover:bg-gray-50 system-folder" data-path="C://" onclick="openExplorer('C://')">
              <img src="image/drive_c.svg" class="inline h-4 w-4 mr-2"> C://
            </li>
            <li class="cursor-pointer border-b border-gray-200 hover:bg-gray-50 system-folder" data-path="A://" onclick="openExplorer('A://')">
              <img src="image/floppy.svg" class="inline h-4 w-4 mr-2"> A://
            </li>
            <li class="cursor-pointer border-b border-gray-200 hover:bg-gray-50 system-folder" data-path="D://" onclick="openExplorer('D://')">
              <img src="image/cd.svg" class="inline h-4 w-4 mr-2"> D://
            </li>
          </ul>
        </div>
        <!-- Main Content -->
        <div id="file-main" class="w-3/4 p-2">
          <div id="breadcrumbs" class="mb-2">Path: ${currentPath}</div>
          <div id="files-area">
            ${currentPath === 'C://Documents' ? 'Loading files...' : '<p>This folder is empty.</p>'}
          </div>
        </div>
      </div>
    </div>
  `;
}

// Opens an explorer window for the given path.
function openExplorer(path) {
  createWindow(path, getExplorerWindowContent(path), false, null, false, false, { type: 'integer', width: 600, height: 400 }, "Explorer");
  if (path === 'C://Documents') {
    setTimeout(fetchDocuments, 0);
  }
  // Setup drop events for folders after rendering.
  setTimeout(setupFolderDrop, 100);
}

/* =====================
    Context Menu on Right-Click
    Shows different options depending on whether an item was clicked.
====================== */
document.addEventListener('contextmenu', function (e) {
  e.preventDefault();
  let target = e.target.closest('.draggable-icon, .file-item');
  showContextMenu(e, target);
});

document.addEventListener('click', function () {
  hideContextMenu();
});

function showContextMenu(e, target) {
  const menu = document.getElementById('context-menu');
  let html = '';
  if (target) {
    // Right-click on an item: enable edit and delete only.
    html += `<div class="px-4 py-2 hover:bg-gray-50 cursor-pointer" onclick="editItemName(event, this)">Edit Name</div>`;
    html += `<div class="px-4 py-2 hover:bg-gray-50 cursor-pointer" onclick="deleteItem(event, this)">Delete</div>`;
    html += `<div class="px-4 py-2 text-gray-400">New Folder</div>`;
    html += `<div class="px-4 py-2 text-gray-400">New File</div>`;
  } else {
    // Right-click on empty space: allow creating new folder or file.
    html += `<div class="px-4 py-2 hover:bg-gray-50 cursor-pointer" onclick="createNewFolder(event)">New Folder</div>`;
    html += `<div class="px-4 py-2 hover:bg-gray-50 cursor-pointer" onclick="createNewFile(event)">New File</div>`;
  }
  menu.innerHTML = html;
  menu.style.top = e.clientY + 'px';
  menu.style.left = e.clientX + 'px';
  menu.classList.remove('hidden');
}

function hideContextMenu() {
  const menu = document.getElementById('context-menu');
  menu.classList.add('hidden');
}

function editItemName(e, menuItem) {
  e.stopPropagation();
  alert('Edit item name functionality to be implemented.');
  hideContextMenu();
}

function deleteItem(e, menuItem) {
  e.stopPropagation();
  alert('Delete item functionality to be implemented.');
  hideContextMenu();
}

function createNewFolder(e) {
  e.stopPropagation();
  alert('Create new folder functionality to be implemented.');
  hideContextMenu();
}

function createNewFile(e) {
  e.stopPropagation();
  // Open a new blank markdown editor.
  createWindow("New File.md", '', false, null, false, false, { type: 'integer', width: 400, height: 300 }, 'editor');
  hideContextMenu();
}

function openAboutWindow() {
  const content = `
<div class="p-4">
  <h1 class="text-xl font-bold mb-2">About this computer</h1>
  <p>This computer is running a simulated vintage operating system environment.</p>
  <p>Version: 1.0.0</p>
  <p>Enjoy your journey through time!</p>
</div>
`;
  createWindow("About this computer", content, false, null, false, false, { type: 'integer', width: 400, height: 300 }, "about");
}

// --- Splash Functionality ---
function showSplash() {
  // Create the overlay div
  const splashDiv = document.createElement('div');
  splashDiv.className = 'w-3xl'
  splashDiv.id = "splash-screen";
  splashDiv.style.position = "fixed";
  splashDiv.style.top = "0";
  splashDiv.style.left = "0";
  splashDiv.style.width = "100%";
  splashDiv.style.height = "100%";
  splashDiv.style.zIndex = "9999";
  splashDiv.style.backgroundColor = "#000"; // Black background

  splashDiv.innerHTML = `
  <div class="flex flex-col items-center justify-center h-full">
    <img id="splash-image" src="./image/startup.jpeg" alt="Startup" class="mb-4">
    <h1 class="text-4xl text-white font-bold mb-2">FUTV - Information Access</h1>
    <div class="mx-auto w-96 text-sm pl-3 mb-2 text-[rgb(0,255,0)]">[{[ I have prefilled credentials for you. —Your friendly neighborhood hackerman, _N30_phreak_ ]}]</div>
    <form id="splash-form" class="bg-gray-300 border border-gray-500 p-4 w-96">
      <div class="mb-2">
        <label class="block text-sm">Username</label>
        <input type="text" id="splash-username" value="FUTV_admin" class="border px-1 py-1 w-full" readonly>
      </div>
      <div class="mb-2">
        <label class="block text-sm">Password</label>
        <input type="password" id="splash-password" value="••••••" class="border px-1 py-1 w-full" readonly>
      </div>
      <button id="splash-login" class="bg-gray-200 border border-gray-500 px-3 py-1">Login</button>
    </form>
    <div class="mx-auto w-96 text-sm pl-3 mt-2 text-gray-400">For a more authentic experience, we recommend making your browser fullscreen by pressing CTRL+SHIFT+F (or CMD+SHIFT+F on macOS)</div>
  </div>
`;
  document.body.appendChild(splashDiv);

  // Play the startup sound
  const splashAudio = document.getElementById("splash-audio");
  splashAudio.play();

  document.getElementById("splash-form").addEventListener("submit", function (e) {
    e.preventDefault();
    // Change the image to a loading gif
    document.getElementById("splash-image").src = "image/loading.gif";
    // Stop the audio
    splashAudio.pause();
    splashAudio.currentTime = 0;
    // After 3 seconds, remove the splash overlay and mark splash as seen
    setTimeout(function () {
      splashDiv.remove();
      localStorage.setItem("splashSeen", "true");
    }, 3000);
  });

  // Attach click handler for Login button
  document.getElementById("splash-login").addEventListener("click", function () {
    // Change the image to a loading gif
    document.getElementById("splash-image").src = "image/loading.gif";
    // Stop the audio
    splashAudio.pause();
    splashAudio.currentTime = 0;
    // After 3 seconds, remove the splash overlay and mark splash as seen
    setTimeout(function () {
      splashDiv.remove();
      localStorage.setItem("splashSeen", "true");
    }, 3000);
  });
}

// Save states to localStorage
function saveState() {
  localStorage.setItem('windowStates', JSON.stringify(windowStates));
  localStorage.setItem('desktopIconsState', JSON.stringify(desktopIconsState));
  localStorage.setItem('desktopSettings', JSON.stringify(desktopSettings));
}

// Restore states on load
function restoreWindows() {
  const saved = localStorage.getItem('windowStates');
  if (saved) {
    const savedStates = JSON.parse(saved);
    windowStates = savedStates;
    for (const id in savedStates) {
      const state = savedStates[id];
      createWindow(
        state.title,
        state.content,
        state.isNav,
        state.id,
        state.isMinimized,
        true, // restoration flag
        state.dimensions,
        state.windowType
      );
    }
  }
}

function restoreDesktopIcons() {
  const saved = localStorage.getItem('desktopIconsState');
  if (saved) {
    desktopIconsState = JSON.parse(saved);
    for (const iconId in desktopIconsState) {
      const icon = document.getElementById(iconId);
      if (icon) {
        const pos = desktopIconsState[iconId];
        icon.style.position = 'absolute';
        icon.style.left = pos.left;
        icon.style.top = pos.top;
      }
    }
  }
}

function restoreDesktopSettings() {
  const saved = localStorage.getItem('desktopSettings');
  if (saved) {
    desktopSettings = JSON.parse(saved);
    applyDesktopSettings();
  }
}

// Apply desktop background settings
function applyDesktopSettings() {
  const desktop = document.getElementById('desktop');
  if (desktopSettings.bgColor) {
    desktop.style.backgroundColor = desktopSettings.bgColor;
  }
  if (desktopSettings.bgImage) {
    desktop.style.backgroundImage = `url(${desktopSettings.bgImage})`;
    desktop.style.backgroundSize = 'cover';
    desktop.style.backgroundRepeat = 'no-repeat';
  } else {
    desktop.style.backgroundImage = 'none';
  }
}

// Update clock in taskbar
function updateClock() {
  const clockEl = document.getElementById('clock');
  const now = new Date();
  let hours = now.getHours();
  let minutes = now.getMinutes();
  let seconds = now.getSeconds();
  hours = hours < 10 ? '0' + hours : hours;
  minutes = minutes < 10 ? '0' + minutes : minutes;
  seconds = seconds < 10 ? '0' + seconds : seconds;
  let timeStr = desktopSettings.clockSeconds ? `${hours}:${minutes}:${seconds}` : `${hours}:${minutes}`;
  clockEl.textContent = timeStr;
}
setInterval(updateClock, 1000);
updateClock();

// Update media control icon based on active media
function updateMediaControl() {
  const mediaEl = getActiveMediaElement();
  const mediaControl = document.getElementById('media-control');
  if (mediaEl) {
    mediaControl.textContent = mediaEl.paused ? "▶" : "⏸";
  } else {
    mediaControl.textContent = "";
  }
}

// Retrieve active media element from active media window
function getActiveMediaElement() {
  if (activeMediaWindow) {
    const win = document.getElementById(activeMediaWindow);
    if (win) {
      return win.querySelector("video, audio");
    }
  }
  return null;
}

// Toggle play/pause for the active media element
function toggleMediaPlayback() {
  const mediaEl = getActiveMediaElement();
  if (mediaEl) {
    mediaEl.paused ? mediaEl.play() : mediaEl.pause();
    updateMediaControl();
  }
}

/**
 * Create a new window (modal) and its taskbar tab.
 * Returns the created window element.
 *
 * @param {string} title - The window title.
 * @param {string} content - The window content.
 * @param {boolean} [isNav=false] - Whether this is a navigation window.
 * @param {string|null} [windowId=null] - Optional id (for restoration).
 * @param {boolean} [initialMinimized=false] - If true, window starts minimized.
 * @param {boolean} [restore=false] - If true, this is restoration (won't trigger saveState again).
 * @param {object} [dimensions={ type: 'default' }] - Dimensions object.
 *   For integer dimensions, use dimensions.width and dimensions.height (px).
 *   Otherwise, 'default' creates a full-screen window.
 * @param {string} [windowType='default'] - The type of window: "default", "Files", or "Settings".
 */

function createWindow(title, content, isNav = false, windowId = null, initialMinimized = false, restore = false, dimensions = { type: 'default' }, windowType = 'default', parentWin = null) {
  let contentToPrint = content;
  if (!windowId) {
    windowId = 'window-' + Date.now();
  }
  if (windowType === 'Files') {
    contentToPrint = getFilesWindowContent();
  }
  if (windowType === 'Settings') {
    contentToPrint = getSettingsContent();
  }
  if (windowType === 'Explorer') {
    contentToPrint = content || getExplorerWindowContent();
  }
  let styleDimensions = "";
  if (dimensions.type === 'integer') {
    styleDimensions = `width: ${dimensions.width}px; height: ${dimensions.height}px; max-width:100%; max-height:100%;`;
  } else {
    styleDimensions = "width: 100%; height: 100%;";
  }
  const win = document.createElement('div');
  win.id = windowId;
  win.className = 'absolute bg-white border border-gray-500 shadow-lg overflow-auto';
  win.style.cssText = styleDimensions;
  win.style.minWidth = "350px";
  win.style.minHeight = "240px";
  if (initialMinimized) {
    win.style.display = 'none';
  }
  win.innerHTML = `<div class="relative w-full h-[calc(100%-1rem)]">
    <div class="bg-handlebarBlue sticky top-0 left-0 text-white px-2 py-1 flex justify-between items-center cursor-move">
      <span>${title}</span>
      <div class="my-1">
        <button onclick="minimizeWindow('${windowId}'); event.stopPropagation();" class="bg-yellow-500 h-6 w-6 text-white">_</button>
        <button onclick="toggleFullScreen('${windowId}'); event.stopPropagation();" class="bg-green-500 h-6 w-6 text-white">⛶</button>
        <button onclick="closeWindow('${windowId}'); event.stopPropagation();" class="bg-red-500 h-6 w-6 text-white">X</button>
      </div>
    </div>
    <div class="p-2 ${windowType === 'editor' ? 'h-full w-full' : ''} overflow-auto" ${windowType === 'default' ? 'contenteditable="true" oninput="updateContent(\'' + windowId + '\', this.innerHTML)"' : ''}>
      ${contentToPrint}
    </div>
    </div>`;
  win.addEventListener('click', function () {
    bringToFront(win);
  });
  document.getElementById('windows-container').appendChild(win);

  // Append taskbar tab.
  const tab = document.createElement('div');
  tab.id = 'tab-' + windowId;
  tab.className = 'bg-gray-200 border border-gray-500 px-2 py-1 cursor-pointer';
  tab.textContent = title;
  tab.onclick = function () {
    if (win.style.display === 'none') {
      bringToFront(win);
    } else {
      minimizeWindow(win.id);
    }
  };
  document.getElementById('window-tabs').appendChild(tab);

  windowStates[windowId] = {
    id: windowId,
    title: title,
    content: contentToPrint,
    isNav: isNav,
    isMinimized: initialMinimized,
    dimensions: dimensions,
    windowType: windowType,
    position: windowStates[windowId] ? windowStates[windowId].position : null,
    fullScreen: false
  };
  if (isNav) {
    navWindows[title] = windowId;
  }
  if (!initialMinimized) {
    bringToFront(win);
  }
  if (dimensions.type !== 'default') {
    if (restore && windowStates[windowId].position) {
      win.style.left = windowStates[windowId].position.left;
      win.style.top = windowStates[windowId].position.top;
    } else {
      if (parentWin) {
        let parentLeft = parseInt(parentWin.style.left, 10) || 0;
        let parentTop = parseInt(parentWin.style.top, 10) || 0;
        let candidateLeft = parentLeft + 30;
        let candidateTop = parentTop + 30;
        let desktopWidth = window.innerWidth;
        let desktopHeight = window.innerHeight - 40;
        let newWidth = dimensions.width;
        let newHeight = dimensions.height;
        if (candidateLeft + newWidth > desktopWidth || candidateTop + newHeight > desktopHeight) {
          candidateLeft = 0;
          candidateTop = 0;
          const existingTopLeft = Array.from(document.querySelectorAll('#windows-container > div')).find(el => {
            return (parseInt(el.style.left, 10) || 0) <= 10 && (parseInt(el.style.top, 10) || 0) <= 10;
          });
          if (existingTopLeft) {
            candidateLeft = (parseInt(existingTopLeft.style.left, 10) || 0) + 30;
          }
        }
        win.style.left = candidateLeft + 'px';
        win.style.top = candidateTop + 'px';
      } else {
        win.style.left = "100px";
        win.style.top = "100px";
      }
    }
    makeDraggable(win);
    makeResizable(win);
  }
  if (!restore) {
    saveState();
  }
  return win;
}

// Update window content when edited.
function updateContent(windowId, newContent) {
  if (windowStates[windowId]) {
    windowStates[windowId].content = newContent;
    saveState();
  }
}

// Minimize a window and de-highlight its tab.
function minimizeWindow(windowId) {
  const win = document.getElementById(windowId);
  if (win) {
    win.style.display = 'none';
    if (windowStates[windowId]) {
      windowStates[windowId].isMinimized = true;
      saveState();
    }
    const tab = document.getElementById('tab-' + windowId);
    if (tab) {
      tab.classList.remove('bg-gray-50');
    }
  }
}

// Bring a window to the front and highlight its tab.
function bringToFront(win) {
  if (win.style.display === 'none') {
    win.style.display = 'block';
    if (windowStates[win.id]) {
      windowStates[win.id].isMinimized = false;
      saveState();
    }
  }
  highestZ++;
  win.style.zIndex = highestZ;
  document.querySelectorAll('#window-tabs > div').forEach(tab => tab.classList.remove('bg-gray-50'));
  const activeTab = document.getElementById('tab-' + win.id);
  if (activeTab) {
    activeTab.classList.add('bg-gray-50');
  }
  if (win.querySelector("video, audio")) {
    activeMediaWindow = win.id;
    updateMediaControl();
  }
}

// Close a window.
function closeWindow(windowId) {
  const win = document.getElementById(windowId);
  if (win) win.remove();
  const tab = document.getElementById('tab-' + windowId);
  if (tab) tab.remove();
  // If the closed window was the active media window, clear media control.
  if (activeMediaWindow === windowId) {
    activeMediaWindow = null;
    updateMediaControl();
  }
  delete windowStates[windowId];
  for (const key in navWindows) {
    if (navWindows[key] === windowId) { delete navWindows[key]; break; }
  }
  saveState();
}

// Make a window draggable via its title bar.
function makeDraggable(el) {
  const header = el.querySelector('.cursor-move');
  if (!header) return;
  header.addEventListener('mousedown', function (e) {
    e.preventDefault();
    const rect = el.getBoundingClientRect();
    const offsetX = e.clientX - rect.left;
    const offsetY = e.clientY - rect.top;
    function mouseMoveHandler(e) {
      el.style.left = (e.clientX - offsetX) + 'px';
      el.style.top = (e.clientY - offsetY) + 'px';
    }
    function mouseUpHandler() {
      document.removeEventListener('mousemove', mouseMoveHandler);
      document.removeEventListener('mouseup', mouseUpHandler);
      if (windowStates[el.id]) {
        windowStates[el.id].position = { left: el.style.left, top: el.style.top };
        saveState();
      }
    }
    document.addEventListener('mousemove', mouseMoveHandler);
    document.addEventListener('mouseup', mouseUpHandler);
    bringToFront(el);
  });
}
// Make a window resizable (adds a resizer handle at bottom right).
function makeResizable(el) {
  const resizer = document.createElement('div');
  resizer.className = 'sticky bottom-0 left-full w-4 h-4 cursor-se-resize';
  resizer.style.background = 'rgba(0,0,0,0.2)';
  el.appendChild(resizer);
  resizer.addEventListener('mousedown', function (e) {
    e.preventDefault();
    e.stopPropagation();
    const startX = e.clientX;
    const startY = e.clientY;
    const startWidth = parseInt(document.defaultView.getComputedStyle(el).width, 10);
    const startHeight = parseInt(document.defaultView.getComputedStyle(el).height, 10);
    function doDrag(e) {
      const newWidth = Math.max(startWidth + e.clientX - startX, 350);
      const newHeight = Math.max(startHeight + e.clientY - startY, 200);
      el.style.width = newWidth + 'px';
      el.style.height = newHeight + 'px';
    }
    function stopDrag() {
      document.documentElement.removeEventListener('mousemove', doDrag, false);
      document.documentElement.removeEventListener('mouseup', stopDrag, false);
      windowStates[el.id].dimensions = { type: 'integer', width: parseInt(el.style.width), height: parseInt(el.style.height) };
      saveState();
    }
    document.documentElement.addEventListener('mousemove', doDrag, false);
    document.documentElement.addEventListener('mouseup', stopDrag, false);
  });
}

// Make desktop icons draggable and attach single/double-click behavior.
function makeIconDraggable(icon) {
  icon.addEventListener('mousedown', function (e) {
    e.preventDefault();
    const rect = icon.getBoundingClientRect();
    const offsetX = e.clientX - rect.left;
    const offsetY = e.clientY - rect.top;
    function mouseMoveHandler(e) {
      icon.style.left = (e.clientX - offsetX) + 'px';
      icon.style.top = (e.clientY - offsetY) + 'px';
      icon.style.position = 'absolute';
    }
    function mouseUpHandler() {
      document.removeEventListener('mousemove', mouseMoveHandler);
      document.removeEventListener('mouseup', mouseUpHandler);
      desktopIconsState[icon.id] = { left: icon.style.left, top: icon.style.top };
      saveState();
    }
    document.addEventListener('mousemove', mouseMoveHandler);
    document.addEventListener('mouseup', mouseUpHandler);
  });
  icon.addEventListener('click', function () {
    document.querySelectorAll('.draggable-icon').forEach(i => i.classList.remove('bg-gray-50'));
    icon.classList.add('bg-gray-50');
  });
  icon.addEventListener('dblclick', function () {
    const title = icon.getAttribute('data-window-title');
    const id = icon.getAttribute('data-window-id');
    const windowType = icon.getAttribute('data-window-type');
    const dimensions = JSON.parse(icon.getAttribute('data-window-dimensions'));
    const content = icon.getAttribute('data-window-content') || ('Content for ' + id);
    openWindow(id, content, dimensions, windowType);
  });
}

// Deselect highlighted desktop icons when clicking on empty desktop space.
document.getElementById('desktop').addEventListener('click', function (e) {
  if (!e.target.closest('.draggable-icon')) {
    document.querySelectorAll('.draggable-icon').forEach(i => i.classList.remove('bg-gray-50'));
  }
});

// Home button: minimize all full-screen windows and de-select taskbar tabs.
function minimizeAllWindows() {
  for (const id in windowStates) {
    minimizeWindow(id);
  }
  document.querySelectorAll('#window-tabs > div').forEach(tab => {
    tab.classList.remove('bg-gray-50');
  });
}

// Open a navigation window (from Start Menu).
function openNav(title, content = '', dimensions = { type: 'default' }, windowType = 'default') {
  toggleStartMenu();
  if (navWindows[title]) {
    const existingWindow = document.getElementById(navWindows[title]);
    if (existingWindow) { bringToFront(existingWindow); return; }
    else { delete navWindows[title]; }
  }
  createWindow(title, content, true, null, false, false, dimensions, windowType);
}

// Open a window (used for desktop icons).
function openWindow(id, content = '', dimensions = { type: 'default' }, windowType = 'default', parentWin = null) {
  return createWindow(id, content === '' ? 'Content for ' + id : content, false, null, false, false, dimensions, windowType, parentWin);
}

// Fabricated Files explorer content (for Documents).
function getFilesWindowContent() {
  setTimeout(fetchDocuments, 0);
  return '<div id="documents-content">Loading files...</div>';
}

// Basic Markdown converter (supports headers, bold, italic, and line breaks)
function convertMarkdownToHTML(markdown) {
  // Convert headers
  markdown = markdown.replace(/^###### (.*$)/gim, '<h6style="font-weight:bold;font-size:18px;">$1</h6>');
  markdown = markdown.replace(/^##### (.*$)/gim, '<h5style="font-weight:bold;font-size:20px;">$1</h5>');
  markdown = markdown.replace(/^#### (.*$)/gim, '<h4 style="font-weight:bold;font-size:22px;">$1</h4>');
  markdown = markdown.replace(/^### (.*$)/gim, '<h3 style="font-weight:bold;font-size:24px;">$1</h3>');
  markdown = markdown.replace(/^## (.*$)/gim, '<h2 style="font-weight:bold;font-size:28px;">$1</h2>');
  markdown = markdown.replace(/^# (.*$)/gim, '<h1 style="font-weight:bold;font-size:32px;">$1</h1>');
  // Convert bold text
  markdown = markdown.replace(/\*\*(.*?)\*\*/gim, '<strongstyle="font-weight:bold;font-size:12px;">$1</strong>');
  // Convert italic text
  markdown = markdown.replace(/\*(.*?)\*/gim, '<emstyle="font-style:italic;font-size:12px;">$1</em>');
  // Convert line breaks
  markdown = markdown.replace(/\n$/gim, '<br />');
  return markdown.trim();
}

// Attach an input event listener for real-time markdown conversion.
document.addEventListener('input', function (e) {
  if (e.target && e.target.id === 'markdown-editor') {
    // Process the raw text content and update the HTML immediately.
    const updatedHTML = convertMarkdownToHTML(e.target.innerText);
    e.target.innerHTML = updatedHTML;
    // Optionally, update your window state if needed:
    // updateContent(currentWindowId, updatedHTML);
  }
});

// Fetch file list from the server and populate the Documents window.
function fetchDocuments() {
  fetch('./api/media.json')
    .then(response => response.json())
    .then(data => {
      const files = data.data.files; // New structure
      let listHtml = '<ul class="pl-5">';
      files.forEach(file => {
        let fileType = 'default';
        const ft = file.file_type.toLowerCase();
        if (['png', 'jpg', 'jpeg', 'gif'].includes(ft)) {
          fileType = 'image';
        } else if (['mp4', 'webm'].includes(ft)) {
          fileType = 'video';
        } else if (['mp3', 'wav'].includes(ft)) {
          fileType = 'audio';
        } else if (ft === 'html') {
          fileType = 'html';
        } else if (ft === 'md') {
          fileType = 'markdown';
        } else if (ft === 'txt') {
          fileType = 'text';
        }
        listHtml += `<li class="cursor-pointer hover:bg-gray-50 file-item" data-file-id="${file.id}" data-file-type="${fileType}" onclick="openFile('${file.url}', '${fileType}', event); event.stopPropagation();">
      ${file.url} ${file.description ? '(' + file.description + ')' : ''}
    </li>`;
      });
      listHtml += '</ul>';
      const container = document.getElementById('files-area');
      if (container) { container.innerHTML = listHtml; }
      // Setup drag events for new file items
      makeFileItemsDraggable();
    })
    .catch(error => {
      console.error("Error fetching media list:", error);
      const container = document.getElementById('files-area');
      if (container) { container.innerHTML = '<p>Error loading files.</p>'; }
    });
}

// Open a file from the Documents explorer.
function openFile(fileName, fileType, e) {
  let content = "";
  if (fileType === 'image') {
    content = `<img src="./media/${fileName}" alt="${fileName}" class="mx-auto max-h-full max-w-full" style="padding:10px;">`;
  } else if (fileType === 'video') {
    content = `<video controls class="mx-auto max-h-full max-w-full" style="padding:10px;">
            <source src="./media/${fileName}" type="video/mp4">
            Your browser does not support the video tag.
          </video>`;
  } else if (fileType === 'audio') {
    content = `<audio controls class="mx-auto" style="min-width:320px; min-height:60px; padding:10px;">
            <source src="./media/${fileName}" type="audio/mpeg">
            Your browser does not support the audio element.
          </audio>`;
  } else if (fileType === 'html') {
    content = `<p style="padding:10px;">Loading HTML file...</p>`;
  } else if (fileType === 'text' || fileType === 'markdown') {
    // For both text and markdown, show a placeholder.
    content = `<div id="file-content" style="padding:10px;">Loading file...</div>`;
  } else {
    content = `<p style="padding:10px;">Content of ${fileName}</p>`;
  }
  let parentWin = null;
  if (e) {
    parentWin = e.target.closest('#windows-container > div');
  }
  let windowType = 'default';
  if (typeof fileType !== 'undefined') {
    windowType = (fileType === 'text' || fileType === 'markdown') ? 'editor' : 'default';
  }
  let win = createWindow(fileName, content, false, null, false, false, { type: 'integer', width: 100, height: 100 }, windowType, parentWin);

  if (fileType === 'image') {
    let img = win.querySelector('img');
    if (img) {
      img.onload = function () {
        let newWidth = img.naturalWidth + 20;
        let newHeight = img.naturalHeight + 60;
        win.style.width = newWidth + 'px';
        win.style.height = newHeight + 'px';
        windowStates[win.id].dimensions = { type: 'integer', width: newWidth, height: newHeight };
        saveState();
      }
    }
  } else if (fileType === 'video') {
    let video = win.querySelector('video');
    if (video) {
      video.onloadedmetadata = function () {
        let newWidth = video.videoWidth + 20;
        let newHeight = video.videoHeight + 60;
        win.style.width = newWidth + 'px';
        win.style.height = newHeight + 'px';
        windowStates[win.id].dimensions = { type: 'integer', width: newWidth, height: newHeight };
        saveState();
      }
    }
  } else if (fileType === 'html') {
    fetch(`./media/${fileName}`)
      .then(response => response.text())
      .then(html => {
        const contentDiv = win.querySelector('.p-2');
        if (contentDiv) {
          contentDiv.innerHTML = html;
        }
        windowStates[win.id].content = html;
        saveState();
      })
      .catch(error => {
        console.error("Error loading HTML file:", error);
        const contentDiv = win.querySelector('.p-2');
        if (contentDiv) {
          contentDiv.innerHTML = '<p>Error loading HTML file.</p>';
        }
      });
  } else if (fileType === 'text') {
    fetch(`./media/${fileName}`)
      .then(response => response.text())
      .then(text => {
        const contentDiv = win.querySelector('.p-2');
        // For plain text, use a contenteditable div.
        contentDiv.innerHTML = `<div id="text-editor" contenteditable="true" style="padding:10px; overflow:auto;">${text}</div>`;
        const textEditor = document.getElementById('text-editor');
        textEditor.addEventListener('input', function () {
          updateContent(win.id, this.innerHTML);
        });
        windowStates[win.id].content = text;
        saveState();
      })
      .catch(error => {
        console.error("Error loading text file:", error);
        const contentDiv = win.querySelector('.p-2');
        if (contentDiv) {
          contentDiv.innerHTML = '<p>Error loading file.</p>';
        }
      });
  } else if (fileType === 'markdown') {
    fetch(`./media/${fileName}`)
      .then(response => response.text())
      .then(text => {
        const contentDiv = win.querySelector('.p-2');
        // For Markdown, use a single contenteditable div that shows the rendered HTML.
        contentDiv.innerHTML = `<div id="markdown-editor" contenteditable="true" class="overflow-auto" style="padding:10px; min-height:150px;">${convertMarkdownToHTML(text)}</div>`;
        document.getElementById('markdown-editor').addEventListener('input', function () {
          updateContent(win.id, this.innerHTML);
        });
        windowStates[win.id].content = text;
        saveState();
      })
      .catch(error => {
        console.error("Error loading markdown file:", error);
        const contentDiv = win.querySelector('.p-2');
        if (contentDiv) {
          contentDiv.innerHTML = '<p>Error loading file.</p>';
        }
      });
  }
}

// Settings window content: change desktop background and clock settings.
function getSettingsContent() {
  return `
    <div class="space-y-4">
      <div>
        <label class="block text-sm">Desktop Background Color:</label>
        <input id="bgColorInput" type="color" value="${desktopSettings.bgColor}" class="border" />
      </div>
      <div>
        <label class="block text-sm">Background Image URL:</label>
        <input id="bgImageInput" type="text" placeholder="Enter image URL" value="${desktopSettings.bgImage}" class="border w-full" />
      </div>
      <div>
        <label class="block text-sm">Show Seconds on Clock:</label>
        <input id="clockSecondsInput" type="checkbox" ${desktopSettings.clockSeconds ? "checked" : ""} />
      </div>
      <button onclick="updateDesktopSettings();createWindow('Settings Applied', 'Your settings have successfully been saved!', false, 'settings-saved', false, false, { type: 'integer', height: 300, width: 200 }, 'default');" class="bg-blue-500 text-white px-2 py-1">Apply</button>
    </div>
  `;
}

// Update desktop settings from Settings window.
function updateDesktopSettings() {
  const color = document.getElementById('bgColorInput').value;
  const image = document.getElementById('bgImageInput').value.trim();
  const clockSec = document.getElementById('clockSecondsInput').checked;
  desktopSettings.bgColor = color;
  desktopSettings.bgImage = image;
  desktopSettings.clockSeconds = clockSec;
  applyDesktopSettings();
  saveState();
}

// Restart: clear localStorage and reset state objects, then reload.
function restart() {
  localStorage.clear();
  windowStates = {};
  desktopIconsState = {};
  desktopSettings = {
    clockSeconds: false,
    bgColor: "#20b1b1",
    bgImage: ""
  };
  window.location.reload();
}

/* Global mapping of file IDs to folder paths */
let fileFolderMapping = {};

/* Drag & Drop in File Explorer */
function makeFileItemsDraggable() {
  document.querySelectorAll('.file-item').forEach(item => {
    item.setAttribute('draggable', true);
    item.addEventListener('dragstart', function (e) {
      e.dataTransfer.setData('text/plain', e.target.getAttribute('data-file-id'));
    });
  });
}

function setupFolderDrop() {
  document.querySelectorAll('.system-folder').forEach(folder => {
    folder.addEventListener('dragover', function (e) {
      e.preventDefault();
      folder.classList.add('bg-gray-50');
    });
    folder.addEventListener('dragleave', function () {
      folder.classList.remove('bg-gray-50');
    });
    folder.addEventListener('drop', function (e) {
      e.preventDefault();
      folder.classList.remove('bg-gray-50');
      const fileId = e.dataTransfer.getData('text/plain');
      const newFolder = folder.getAttribute('data-path');
      // Update the file's folder assignment
      fileFolderMapping[fileId] = newFolder;
      // Refresh any explorer windows showing this folder
      refreshExplorerViews(newFolder);
    });
  });
}

// Refresh file explorer views that display the folder where a file was moved.
function refreshExplorerViews(folderPath) {
  // Assume each explorer window has a class "file-explorer-window"
  // and an attribute "data-current-path" that stores its current folder.
  document.querySelectorAll('.file-explorer-window').forEach(explorer => {
    const currentPath = explorer.getAttribute('data-current-path');
    if (currentPath === folderPath) {
      if (folderPath === "C://Documents") {
        fetchDocuments(); // Uses your existing fetch logic for Documents.
      } else {
        // For non-documents folders, re-render based on the updated mapping.
        const filesArea = explorer.querySelector('#files-area');
        fetch('./api/media.json')
          .then(response => response.json())
          .then(data => {
            const files = data.data.files.filter(file => {
              // Default to "C:\Documents" if no folder has been assigned.
              const assignedFolder = fileFolderMapping[file.id] || "C://Documents";
              return assignedFolder === folderPath;
            });
            let listHtml = '<ul class="pl-5">';
            files.forEach(file => {
              let fileType = 'default';
              const ft = file.file_type.toLowerCase();
              if (['png', 'jpg', 'jpeg', 'gif'].includes(ft)) {
                fileType = 'image';
              } else if (['mp4', 'webm'].includes(ft)) {
                fileType = 'video';
              } else if (['mp3', 'wav'].includes(ft)) {
                fileType = 'audio';
              } else if (ft === 'html') {
                fileType = 'html';
              } else if (ft === 'md') {
                fileType = 'markdown';
              } else if (ft === 'txt') {
                fileType = 'text';
              }
              listHtml += `<li class="cursor-pointer hover:bg-gray-50 file-item" data-file-id="${file.id}" data-file-type="${fileType}" onclick="openFile('${file.url}', '${fileType}', event); event.stopPropagation();">
            ${file.url} ${file.description ? '(' + file.description + ')' : ''}
          </li>`;
            });
            listHtml += '</ul>';
            if (filesArea) filesArea.innerHTML = listHtml;
            // Reinitialize drag events for the updated file items.
            makeFileItemsDraggable();
          })
          .catch(error => {
            console.error("Error refreshing files:", error);
          });
      }
    }
  });
}

// Hide Start Menu when clicking outside.
window.addEventListener('click', function (e) {
  const startMenu = document.getElementById('start-menu');
  const startButton = document.getElementById('start-button');
  if (!startMenu.contains(e.target) && !startButton.contains(e.target)) {
    startMenu.classList.add('hidden');
  }
});

window.addEventListener('load', function () {
  // Show splash if localStorage flag not set (first load or after restart)
  if (!localStorage.getItem("splashSeen")) {
    showSplash();
  }
  // Continue with the normal initialization:
  restoreWindows();
  restoreDesktopIcons();
  restoreDesktopSettings();
  document.querySelectorAll('.draggable-icon').forEach(icon => makeIconDraggable(icon));
});

// Toggle full-screen for a window via the green button.
function toggleFullScreen(winId) {
  const win = document.getElementById(winId);
  if (!win) return;
  let state = windowStates[winId];
  if (!state.fullScreen) {
    state.originalDimensions = state.dimensions;
    state.originalPosition = state.position;
    win.style.left = "0px";
    win.style.top = "0px";
    win.style.width = window.innerWidth + "px";
    win.style.height = (window.innerHeight - 40) + "px";
    state.dimensions = { type: 'default' };
    state.fullScreen = true;
  } else {
    if (state.originalDimensions && state.originalPosition) {
      win.style.left = state.originalPosition.left;
      win.style.top = state.originalPosition.top;
      win.style.width = state.originalDimensions.width + "px";
      win.style.height = state.originalDimensions.height + "px";
      state.dimensions = state.originalDimensions;
    } else {
      win.style.left = "15%";
      win.style.top = "15%";
      win.style.width = "70vw";
      win.style.height = "70vh";
      state.dimensions = { type: 'integer', width: window.innerWidth * 0.7, height: window.innerHeight * 0.7 };
    }
    state.fullScreen = false;
    // Re-attach draggable and resizable functionality when no longer fullscreen.
    makeDraggable(win);
    makeResizable(win);
  }
  saveState();
}

// Toggle Start Menu visibility.
function toggleStartMenu() {
  const menu = document.getElementById('start-menu');
  menu.classList.toggle('hidden');
}

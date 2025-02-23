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
  icon.addEventListener('dblclick', function (e) {
    const id = icon.getAttribute('data-window-id');
    let fs = getFileSystemState();
    let item = fs.desktop.find(it => it.id === id);
    if (item && item.type === 'folder') {
      openExplorer("Desktop/" + item.name + "/");
    } else if (item) {
      openFile(item.id, e);
    }
  });
}

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

function renderDesktopIcons() {
  const desktopIconsContainer = document.getElementById('desktop-icons');
  desktopIconsContainer.innerHTML = "";
  let fs = getFileSystemState().folders['C://'].find(it => it.id === 'c-desktop');
  fs.contents.forEach(item => {
    const iconElem = document.createElement('div');
    iconElem.id = "icon-" + item.id;
    iconElem.className = 'flex flex-col items-center cursor-pointer draggable-icon';
    const iconSrc = (item.type === 'folder') ? 'image/folder.svg' : 'image/file.svg';
    iconElem.innerHTML = `<img src="${iconSrc}" alt="${item.name}" class="mb-1 bg-white shadow-lg p-1 max-h-16 max-w-16" />
      <span class="text-xs text-black max-w-20 text-center">${item.name}</span>`;
    iconElem.setAttribute('data-window-title', item.name);
    iconElem.setAttribute('data-window-id', item.id);
    iconElem.setAttribute('data-window-type', 'Desktop');
    iconElem.setAttribute('data-window-dimensions', '{"type": "integer", "height": 400, "width": 600}');
    iconElem.setAttribute('data-item-id', item.id);
    iconElem.setAttribute('data-window-content', item.content);
    desktopIconsContainer.appendChild(iconElem);
    makeIconDraggable(iconElem);
  });
}

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

renderDesktopIcons();
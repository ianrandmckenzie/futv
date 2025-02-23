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
  menu.style.zIndex = highestZ + 100; // Ensure it appears above all windows.
  let html = '';
  if (target) {
    html += `<div class="px-4 py-2 hover:bg-gray-50 cursor-pointer" onclick="editItemName(event, this)">Edit Name</div>`;
    html += `<div class="px-4 py-2 hover:bg-gray-50 cursor-pointer" onclick="deleteItem(event, this)">Delete</div>`;
    html += `<div class="px-4 py-2 text-gray-400">New Folder</div>`;
    html += `<div class="px-4 py-2 text-gray-400">New File</div>`;
  } else {
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
  hideContextMenu();
  const targetElem = e.target.closest('[data-item-id]');
  if (!targetElem) {
    const errorMessage = ("No item selected.");
    document.getElementById('error-popup-audio').play();
    createWindow("⚠️ Error", errorMessage, false, null, false, false, { type: 'integer', width: 300, height: 100 }, "Default")
    return;
  }
  const itemId = targetElem.getAttribute('data-item-id');
  let contextPath = "Desktop";
  const explorerElem = targetElem.closest('.file-explorer-window');
  if (explorerElem) {
    contextPath = explorerElem.getAttribute('data-current-path');
  }
  let fs = getFileSystemState();
  let itemsArray = (contextPath === "Desktop") ? fs.desktop : (fs.folders[contextPath] || []);
  let item = itemsArray.find(it => it.id === itemId);
  if (!item) {
    const errorMessage = ("Item not found in file system.");
    document.getElementById('error-popup-audio').play();
    createWindow("⚠️ Error", errorMessage, false, null, false, false, { type: 'integer', width: 300, height: 100 }, "Default")
    return;
  }
  let newName = prompt("Edit name:", item.name);
  if (newName && newName !== item.name) {
    item.name = newName;
    if (contextPath === "Desktop") {
      renderDesktopIcons();
    } else {
      const explorerWindow = document.getElementById('explorer-window');
      if (explorerWindow) {
        explorerWindow.querySelector('.file-explorer-window').outerHTML = getExplorerWindowContent(contextPath);
        setupFolderDrop();
      }
    }
    setFileSystemState(fs);
    saveState();
  }
}

function deleteItem(e, menuItem) {
  e.stopPropagation();
  hideContextMenu();
  const targetElem = e.target.closest('[data-item-id]');
  if (!targetElem) {
    const errorMessage = ("No item selected.");
    document.getElementById('error-popup-audio').play();
    createWindow("⚠️ Error", errorMessage, false, null, false, false, { type: 'integer', width: 300, height: 100 }, "Default")
    return;
  }
  const itemId = targetElem.getAttribute('data-item-id');
  let contextPath = "Desktop";
  const explorerElem = targetElem.closest('.file-explorer-window');
  if (explorerElem) {
    contextPath = explorerElem.getAttribute('data-current-path');
  }
  let fs = getFileSystemState();
  let itemsArray = (contextPath === "Desktop") ? fs.desktop : (fs.folders[contextPath] || []);
  const index = itemsArray.findIndex(it => it.id === itemId);
  if (index === -1) {
    const errorMessage = ("Item not found.");
    document.getElementById('error-popup-audio').play();
    createWindow("⚠️ Error", errorMessage, false, null, false, false, { type: 'integer', width: 300, height: 100 }, "Default")
    return;
  }
  if (!confirm("Are you sure you want to delete this item?")) {
    return;
  }
  itemsArray.splice(index, 1);
  if (contextPath === "Desktop") {
    renderDesktopIcons();
  } else {
    const explorerWindow = document.getElementById('explorer-window');
    if (explorerWindow) {
      explorerWindow.querySelector('.file-explorer-window').outerHTML = getExplorerWindowContent(contextPath);
      setupFolderDrop();
    }
  }
  setFileSystemState(fs);
  saveState();
}

function createNewFolder(e) {
  e.stopPropagation();
  hideContextMenu();
  let contextPath = "Desktop";
  const explorerElem = document.querySelector('.file-explorer-window');
  if (explorerElem) {
    contextPath = explorerElem.getAttribute('data-current-path');
  }
  let folderName = prompt("Enter new folder name:", "New Folder");
  if (!folderName) return;
  
  let fs = getFileSystemState();
  if (contextPath === "Desktop") {
    const desktopIcons = document.getElementById('desktop-icons');
    const iconId = "icon-" + Date.now();
    const newIcon = document.createElement('div');
    newIcon.id = iconId;
    newIcon.className = 'flex flex-col items-center cursor-pointer draggable-icon';
    newIcon.innerHTML = `<img src="image/folder.svg" alt="${folderName}" class="mb-1 bg-white shadow-lg p-1 max-h-16 max-w-16" />
      <span class="text-xs text-black max-w-20 text-center">${folderName}</span>`;
    newIcon.setAttribute('data-window-title', folderName);
    newIcon.setAttribute('data-window-id', iconId);
    newIcon.setAttribute('data-window-type', 'Explorer');
    newIcon.setAttribute('data-window-dimensions', '{"type": "integer", "height": 400, "width": 600}');
    newIcon.setAttribute('data-folder-path', folderName);
    desktopIcons.appendChild(newIcon);
    makeIconDraggable(newIcon);
    fs.desktop.push({ id: iconId, name: folderName, type: "folder" });
    setFileSystemState(fs);
    saveState();
  } else {
    if (!fs.folders[contextPath]) {
      fs.folders[contextPath] = [];
    }
    fs.folders[contextPath].push({ id: "folder-" + Date.now(), name: folderName, type: "folder", contents: [] });
    const explorerWindow = document.getElementById('explorer-window');
    if (explorerWindow) {
      explorerWindow.querySelector('.file-explorer-window').outerHTML = getExplorerWindowContent(contextPath);
      setupFolderDrop();
    }
    setFileSystemState(fs);
    saveState();
  }
}

function createNewFile(e) {
  e.stopPropagation();
  hideContextMenu();
  let contextPath = "Desktop";
  const explorerElem = document.querySelector('.file-explorer-window');
  if (explorerElem) {
    contextPath = explorerElem.getAttribute('data-current-path');
  }
  contextPath = normalizePath(contextPath);
  let fileName = prompt("Enter new file name:", "New File.md");
  if (!fileName) return;
  
  const newFile = {
    id: "file-" + Date.now(),
    name: fileName,
    type: "ugc-file",
    content: "",
    content_type: "markdown",
    icon_url: "image/doc.svg",
    description: ""
  };
  
  let fs = getFileSystemState();
  if (contextPath === "Desktop") {
    fs.desktop.push(newFile);
    const desktopIcons = document.getElementById('desktop-icons');
    const iconId = "icon-" + newFile.id;
    const newIcon = document.createElement('div');
    newIcon.id = iconId;
    newIcon.className = 'flex flex-col items-center cursor-pointer draggable-icon';
    newIcon.innerHTML = `<img src="${newFile.icon_url}" alt="${fileName}" class="mb-1 bg-white shadow-lg p-1 max-h-16 max-w-16" />
      <span class="text-xs text-black max-w-20 text-center">${fileName}</span>`;
    newIcon.setAttribute('data-window-title', fileName);
    newIcon.setAttribute('data-window-id', newFile.id);
    newIcon.setAttribute('data-window-type', 'editor');
    newIcon.setAttribute('data-window-dimensions', '{"type": "integer", "height": 350, "width": 520}');
    newIcon.setAttribute('data-item-id', newFile.id);
    desktopIcons.appendChild(newIcon);
    makeIconDraggable(newIcon);
    setFileSystemState(fs);
    saveState();
  } else {
    if (!fs.folders[contextPath]) {
      fs.folders[contextPath] = [];
    }
    fs.folders[contextPath].push(newFile);
    const explorerWindow = document.getElementById('explorer-window');
    if (explorerWindow) {
      explorerWindow.querySelector('.file-explorer-window').outerHTML = getExplorerWindowContent(contextPath);
      setupFolderDrop();
    }
    setFileSystemState(fs);
    saveState();
  }
}

/* =====================
   Context Menu & Creation Functions
   (They now accept an optional fromFullPath parameter to determine the parent folder.)
====================== */
document.addEventListener('contextmenu', function (e) {
  e.preventDefault();
  let target = e.target.closest('.draggable-icon, .file-item');
  // For right-click on blank space, determine current folder from the explorer.
  let explorerElem = document.querySelector('.file-explorer-window');
  let fromFullPath = explorerElem ? explorerElem.getAttribute('data-current-path') : 'C://';
  showContextMenu(e, target, fromFullPath);
});

document.addEventListener('click', function () {
  hideContextMenu();
});

function showContextMenu(e, target, fromFullPath) {
  const menu = document.getElementById('context-menu');
  menu.style.zIndex = highestZ + 100;
  let html = '';
  if (target) {
    target.classList.add('right-click-target');
    html += `<div class="px-4 py-2 hover:bg-gray-50 cursor-pointer" onclick="editItemName(event, this)">Edit Name</div>`;
    html += `<div class="px-4 py-2 hover:bg-gray-50 cursor-pointer" onclick="deleteItem(event, this)">Delete</div>`;
    html += `<div class="px-4 py-2 text-gray-400">New Folder</div>`;
    html += `<div class="px-4 py-2 text-gray-400">New File</div>`;
  } else {
    html += `<div class="px-4 py-2 hover:bg-gray-50 cursor-pointer" onclick="createNewFolder(event, '${fromFullPath}')">New Folder</div>`;
    html += `<div class="px-4 py-2 hover:bg-gray-50 cursor-pointer" onclick="createNewFile(event, '${fromFullPath}')">New File</div>`;
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
  const targetElem = document.querySelector('.right-click-target');
  if (!targetElem) {
    const errorMessage = "No item selected.";
    document.getElementById('error-popup-audio').play();
    createWindow("⚠️ Error", errorMessage, false, null, false, false, { type: 'integer', width: 300, height: 100 }, "Default");
    return;
  }
  const itemId = targetElem.getAttribute('data-item-id');
  const explorerElem = targetElem.closest('.file-explorer-window');
  const contextPath = explorerElem.getAttribute('data-current-path');
  let fs = getFileSystemState();
  // Get parent's contents as an object keyed by item IDs.
  let folderContents = findFolderObjectByFullPath(contextPath, fs).contents;
  console.log('contextPath: ', contextPath)
  console.log('folderContents: ', folderContents)
  let item = folderContents[itemId];
  console.log('item: ', item)
  if (!item) {
    const errorMessage = "Item not found in file system.";
    document.getElementById('error-popup-audio').play();
    createWindow("⚠️ Error", errorMessage, false, null, false, false, { type: 'integer', width: 300, height: 100 }, "Default");
    return;
  }
  let newName = prompt("Edit name:", item.name);
  if (newName && newName !== item.name) {
    item.name = newName;
    // For folders, if the name changes, you might want to update its fullPath
    if (item.type === "folder" && item.fullPath) {
      // Compute new full path based on parent context.
      const driveRootRegex = /^[A-Z]:\/\/$/;
      let newFullPath = driveRootRegex.test(contextPath) ? contextPath + newName : contextPath + "/" + newName;
      // Update the folder item.
      item.fullPath = newFullPath;
      // Also move its stored contents in fs.folders.
      fs.folders[newFullPath] = fs.folders[item.fullPath] || {};
      // Optionally, remove the old key if different.
    }
    if (contextPath === "C://Desktop") {
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
    refreshExplorerViews();
  }
}

function deleteItem(e, menuItem) {
  e.stopPropagation();
  hideContextMenu();
  const targetElem = document.querySelector('.right-click-target');
  if (!targetElem) {
    const errorMessage = "No file selected.";
    document.getElementById('error-popup-audio').play();
    createWindow("⚠️ Error", errorMessage, false, null, false, false, { type: 'integer', width: 300, height: 100 }, "Default");
    return;
  }
  let fileId = targetElem.getAttribute('data-item-id');
  const explorerElem = targetElem.closest('.file-explorer-window');
  const contextPath = explorerElem.getAttribute('data-current-path');
  let fs = getFileSystemState();
  let folderContents = {};
  const isDrive = contextPath.length === 4;
  if (isDrive) {
    folderContents = fs.folders[contextPath];
  } else {
    folderContents = findFolderObjectByFullPath(contextPath, fs);
  }
  if (!(fileId in folderContents)) {
    const errorMessage = "Item not found.";
    document.getElementById('error-popup-audio').play();
    createWindow("⚠️ Error", errorMessage, false, null, false, false, { type: 'integer', width: 300, height: 100 }, "Default");
    return;
  }
  if (!confirm("Are you sure you want to delete this file?")) {
    return;
  }
  delete folderContents[fileId];
  const explorerWindow = document.getElementById('explorer-window');
  if (explorerWindow) {
    explorerWindow.querySelector('.file-explorer-window').outerHTML = getExplorerWindowContent(contextPath);
    setupFolderDrop();
  }
  setFileSystemState(fs);
  saveState();
  refreshExplorerViews();
}

function createNewFolder(e, fromFullPath) {
  e.stopPropagation();
  hideContextMenu();
  let parentPath = fromFullPath || 'C://';
  let folderName = prompt("Enter new folder name:", "New Folder");
  if (!folderName) folderName = 'Untitled';
  
  let fs = getFileSystemState();
  const folderId = "folder-" + Date.now();
  // Compute new folder’s full path.
  const driveRootRegex = /^[A-Z]:\/\/$/;
  let newFolderPath = driveRootRegex.test(parentPath) ? parentPath + folderId : parentPath + "/" + folderId;
  // Create the new folder object.
  const newFolderItem = {
    id: folderId,
    name: folderName,
    type: "folder",
    fullPath: newFolderPath,
    contents: {}
  };

  const drive = fromFullPath.substring(4, -1);
  let paths = fromFullPath.substring(4).split('/');
  paths.unshift(drive);
  // Traverse to the folder object where the new folder belongs
  let destination = fs.folders;
  if (paths[1] !== '') { // aka, we are at the root of the drive
    paths.forEach(path => {
      const destination_parent = destination;
      destination = destination[path]
      if (typeof destination.contents !== 'undefined') {
        if (typeof destination.contents !== 'string') {
          destination = destination.contents;
        }
        if (typeof destination.contents === 'string') {
          // In other words, "Go back, you've gone too far!"
          destination = destination_parent;
        }
      }
    });
  } else {
    destination = destination[drive]
  }

  // Insert the new folder into the parent's contents.
  destination[folderId] = newFolderItem;
  
  // Refresh explorer view.
  // Currently does not work properly.
  let explorerWindow = document.getElementById('explorer-window');
  if (explorerWindow) {
    explorerWindow.querySelector('.file-explorer-window').outerHTML = getExplorerWindowContent(parentPath);
    // Also currently does not work
    setupFolderDrop();
  }
  setFileSystemState(fs);
  saveState();
  refreshExplorerViews();
}

function createNewFile(e, fromFullPath) {
  e.stopPropagation();
  hideContextMenu();
  let parentPath = fromFullPath || 'C://';
  let fileName = prompt("Enter new file name:", "New File.md");
  if (!fileName) fileName = 'Untitled';
  
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
  const drive = fromFullPath.substring(4, -1);
  let paths = fromFullPath.substring(4).split('/');
  paths.unshift(drive);
  // Traverse to the folder object where the new folder belongs
  let destination = fs.folders;
  if (paths[1] !== '') { // aka, we are at the root of the drive
    paths.forEach(path => {
      const destination_parent = destination;
      destination = destination[path]
      if (typeof destination.contents !== 'undefined') {
        if (typeof destination.contents !== 'string') {
          destination = destination.contents;
        }
        if (typeof destination.contents === 'string') {
          // In other words, "Go back, you've gone too far!"
          destination = destination_parent;
        }
      }
    });
  } else {
    destination = destination[drive]
  }

  // Insert the new folder into the parent's contents.
  destination[newFile.id] = newFile;
  
  let explorerWindow = document.getElementById('explorer-window');
  if (explorerWindow) {
    explorerWindow.querySelector('.file-explorer-window').outerHTML = getExplorerWindowContent(parentPath);
    setupFolderDrop();
  }
  setFileSystemState(fs);
  saveState();
  refreshExplorerViews();
}

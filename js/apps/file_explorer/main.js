/* =====================
   Getter & Setter for fileSystemState
   Always retrieve and update state from localStorage.
====================== */
function getFileSystemState() {
  const appStateStr = localStorage.getItem('appState');
  if (appStateStr) {
    const appState = JSON.parse(appStateStr);
    return appState.fileSystemState;
  }
  return fileSystemState;
}

function setFileSystemState(newFS) {
  const appStateStr = localStorage.getItem('appState');
  let appState = appStateStr ? JSON.parse(appStateStr) : {};
  appState.fileSystemState = newFS;
  localStorage.setItem('appState', JSON.stringify(appState));
  fileSystemState = newFS; // update global variable for consistency
}

/* =====================
   Helper: Retrieve items for a given fullPath
   Since each folder’s contents are stored under its fullPath key,
   we simply return fs.folders[fullPath] or {} if not present.
====================== */
function getItemsForPath(fullPath) {
  fullPath = normalizePath(fullPath);
  const fs = getFileSystemState();

  let current = fs.folders;
  if (fullPath.substring(1, 4) === '://' && fullPath.length === 4) {
    return current[fullPath]
  }
  
  const drivePath = fullPath.substring(0, 4);
  current = current[drivePath];

  // Split the path into segments
  let parts = fullPath.split('/').filter(Boolean).filter(str => str !== 'A:').filter(str => str !== 'D:').filter(str => str !== 'C:');

  if (parts.length === 0) return {};
  current = current[parts[0]]
  let infinite_prot = 50;
  while (infinite_prot > 1) {
    let breakit = false;
    infinite_prot -= 1;
    parts.forEach(part => {
      let objects = drillIntoFolder(part, current);
      current = objects;
      if (typeof objects.contents === 'undefined') breakit = true;
    });
    if (breakit) {
      break;
    }
  }

  function drillIntoFolder (part) {
    if (part) {
      if (current[part]) {
        current = current[part]
      }
    }

    if (typeof current.contents !== 'undefined') {
      if (drivePath === 'C://' && part === "Documents" && Object.keys(current.contents).length === 0) {
        fetchDocuments();
      }

      current = current.contents; // Move deeper into contents
      return current;
    }
  }
  return current;
}

/* =====================
   File Explorer Window Content
   Returns HTML for a file explorer window given a fullPath.
====================== */
function getExplorerWindowContent(currentPath = 'C://') {
  currentPath = normalizePath(currentPath);
  let itemsObj = getItemsForPath(currentPath);
  let items = Object.values(itemsObj);
  let listHtml = '<ul class="pl-5">';
  items.forEach(item => {
    let icon = item.type === 'folder' ? 'image/folder.svg' : 'image/file.svg';
    if (item.icon_url) { icon = item.icon_url; }
    if (item.type === "folder") {
      // For folders, the clickable link calls openExplorer with the folder’s id.
      listHtml += `<li class="cursor-pointer hover:bg-gray-50 file-item" data-item-id="${item.id}" ondblclick="openExplorer('${item.id}')">
        <img src="${icon}" class="inline h-4 w-4 mr-2"> ${item.name}
      </li>`;
    } else {
      listHtml += `<li class="cursor-pointer hover:bg-gray-50 file-item" data-file-id="${item.id}" ondblclick="openFile('${item.id}', event); event.stopPropagation();">
        <img src="${icon}" class="inline h-4 w-4 mr-2"> ${item.name}${item.description ? ' (' + item.description + ')' : ''}
      </li>`;
    }
  });
  listHtml += '</ul>';
  
  return `
  <div class="file-explorer-window" data-current-path="${currentPath}">
      <div class="flex">
        <!-- Left Sidebar -->
        <div id="file-sidebar" class="w-1/4 border-r p-2">
          <ul>
            <li class="cursor-pointer border-b border-gray-200 hover:bg-gray-50 system-folder" onclick="openExplorer('C://')">
              <img src="image/drive_c.svg" class="inline h-4 w-4 mr-2"> C://
            </li>
            <li class="cursor-pointer border-b border-gray-200 hover:bg-gray-50 system-folder" onclick="openExplorer('A://')">
              <img src="image/floppy.svg" class="inline h-4 w-4 mr-2"> A://
            </li>
            <li class="cursor-pointer border-b border-gray-200 hover:bg-gray-50 system-folder" onclick="openExplorer('D://')">
              <img src="image/cd.svg" class="inline h-4 w-4 mr-2"> D://
            </li>
          </ul>
        </div>
        <!-- Main Content -->
        <div id="file-main" class="w-3/4 p-2">
          <div id="breadcrumbs" class="mb-2">Path: ${getBreadcrumbs(currentPath)}</div>
          <div id="files-area">
            ${listHtml}
          </div>
        </div>
      </div>
    </div>
  `;
}

/* =====================
   openExplorer
   Now accepts a folderId. It finds the folder’s fullPath and refreshes the explorer.
====================== */
function openExplorer(folderId) {
  // If folderId is a drive root (like "C://"), use it directly.
  let fullPath = /^[A-Z]:\/\/$/.test(folderId) ? folderId : findFolderFullPathById(folderId);
  if (!fullPath) {
    console.error("Folder not found for id:", folderId);
    return;
  }
  let explorerWindow = document.getElementById('explorer-window');
  const newContent = getExplorerWindowContent(fullPath);
  if (explorerWindow) {
    explorerWindow.querySelector('.file-explorer-window').outerHTML = newContent;
    explorerWindow.querySelector('.file-explorer-window').setAttribute('data-current-path', fullPath);
    setTimeout(setupFolderDrop, 100);
  } else {
    explorerWindow = createWindow(
      fullPath,
      newContent,
      false,
      'explorer-window',
      false,
      false,
      { type: 'integer', width: 600, height: 400 },
      "Explorer"
    );
  }
}

function refreshExplorerViews(folderPath) {
  const fs = getFileSystemState();
  document.querySelectorAll('.file-explorer-window').forEach(explorer => {
    const currentPath = explorer.getAttribute('data-current-path');
    if (currentPath === folderPath) {
      if (folderPath === "C://Documents") {
        let documentsFolder = fs.folders["C://"] ? fs.folders["C://"]["Documents"] : null;
        if (documentsFolder && Object.keys(documentsFolder.contents).length === 0) {
          fetchDocuments();
        }
      }
    }
  });
}

/* =====================
   getBreadcrumbs
   Builds the breadcrumb trail for a given fullPath. Each segment is a clickable link.
====================== */
function getBreadcrumbs(fullPath) {
  fullPath = normalizePath(fullPath);
  let driveMatch = fullPath.match(/^([A-Z]:\/\/)(.*)/);
  if (!driveMatch) return fullPath;
  let drivePart = driveMatch[1];
  let rest = driveMatch[2]; // e.g., "folder-34862398/folder-9523759823"
  let breadcrumbHtml = `<span class="cursor-pointer hover:underline" ondblclick="openExplorer('${drivePart}')">${drivePart}</span>`;
  if (!rest) return breadcrumbHtml;
  let parts = rest.split('/').filter(p => p !== '');
  let currentPath = drivePart;
  parts.forEach(partKey => {
    // Append the folder key to currentPath.
    currentPath = currentPath.endsWith('/') ? currentPath + partKey : currentPath + "/" + partKey;
    let folderObj = findFolderObjectByFullPath(currentPath);
    let displayName = folderObj ? folderObj.name : partKey;
    breadcrumbHtml += ` / <span class="cursor-pointer hover:underline" ondblclick="openExplorer('${folderObj ? folderObj.id : currentPath}')">${displayName}</span>`;
  });
  return breadcrumbHtml;
}

/* =====================
   normalizePath
   Removes trailing slashes (except for drive roots).
====================== */
function normalizePath(path) {
  if (/^[A-Z]:\/\/$/.test(path)) return path;
  return path.replace(/\/+$/, "");
}

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
      fileFolderMapping[fileId] = newFolder;
      refreshExplorerViews(newFolder);
    });
  });
}

function fetchDocuments() {
  fetch('./api/media.json')
    .then(response => response.json())
    .then(data => {
      const files = data.data.files;
      const fileItems = files.map(file => {
        let content_type = file.file_type.toLowerCase();
        let icon_url = 'image/file.svg';
        if (['png', 'jpg', 'jpeg', 'gif'].includes(content_type)) {
          icon_url = 'image/image.svg';
        } else if (['mp4', 'webm'].includes(content_type)) {
          icon_url = 'image/video.svg';
        } else if (['mp3', 'wav'].includes(content_type)) {
          icon_url = 'image/audio.svg';
        } else if (content_type === 'html') {
          icon_url = 'image/html.svg';
        } else if (content_type === 'md') {
          icon_url = 'image/doc.svg';
        } else if (content_type === 'txt') {
          icon_url = 'image/doc.svg';
        }
        return {
          id: file.id,
          name: file.url,
          type: "file",
          content: "",
          fullPath: `C://Documents/${file.id}`,
          content_type: content_type,
          icon_url: icon_url,
          description: file.description || ""
        };
      });
      let fs = getFileSystemState();
      if (fs.folders['C://'] && fs.folders['C://']['Documents']) {
        // Convert fileItems array to an object keyed by file id.
        const fileItemsObj = {};
        fileItems.forEach(file => {
          fileItemsObj[file.id] = file;
        });
        fs.folders['C://']['Documents'].contents = fileItemsObj;
      }
      setFileSystemState(fs);
      let listHtml = '<ul class="pl-5">';
      fileItems.forEach(file => {
        listHtml += `<li class="cursor-pointer hover:bg-gray-50 file-item" data-file-id="${file.id}" data-file-type="${file.content_type}" ondblclick="openFile('${file.id}', event); event.stopPropagation();">
          <img src="${file.icon_url}" class="inline h-4 w-4 mr-2"> ${file.name} ${file.description ? '(' + file.description + ')' : ''}
        </li>`;
      });
      listHtml += '</ul>';
      const container = document.getElementById('files-area');
      if (container) {
        container.innerHTML = listHtml;
      }
      makeFileItemsDraggable();
    })
    .catch(error => {
      console.error("Error fetching media list:", error);
      const container = document.getElementById('files-area');
      if (container) {
        container.innerHTML = '<p>Error loading files.</p>';
      }
    });
}

// Looks up a file by its ID (from desktop or current folder) and opens it.
function openFile(incoming_file, e) {
  let file;
  const explorerElem = e.target.closest('.file-explorer-window');
  let currentPath;
  if (explorerElem) {
    currentPath = explorerElem.getAttribute('data-current-path');
  } else if (e.srcElement.classList.contains('desktop-folder-icon')) {
    currentPath = 'C://Desktop';
  }
  const itemsObj = getItemsForPath(currentPath);
  file = Object.values(itemsObj).find(it => it.id === incoming_file);

  if (!file || typeof file === 'string') {
    const file_name = `File ${typeof file === 'string' ? `"${file}"` : ''}`;
    const errorMessage = `<p>${file_name}not found.</p>`;
    document.getElementById('error-popup-audio').play();
    createWindow("⚠️ Error", errorMessage, false, null, false, false, { type: 'integer', width: 300, height: 100 }, "Default");
    return;
  }

  let content = "";
  let windowType = 'default';

  // Check if the file is user-generated; if so, use its local content.
  if (file.type === "ugc-file") {
    if (file.content_type === 'text' || file.content_type === 'txt') {
      content = `<div id="file-content" style="padding:10px;">
        <div id="text-editor" contenteditable="true" style="padding:10px; overflow:auto;">${file.content || "Empty file"}</div>
      </div>`;
      windowType = 'editor';
    } else if (file.content_type === 'markdown' || file.content_type === 'md') {
      content = `<div id="file-content" style="padding:10px;">
        <div class="md_editor_pro_plus min-h-48 h-full w-full" data-markdown-pro-plus-editor-id="${file.id}"></div>
      </div>`;
      windowType = 'editor';
    } else if (file.content_type === 'html') {
      content = file.content ? file.content : `<p style="padding:10px;">Empty HTML file.</p>`;
    } else {
      content = `<p style="padding:10px;">${file.content || "Empty file"}</p>`;
    }
  } else {
    // Non-UGC file: fetch from the media folder.
    if (['image', 'jpg', 'jpeg', 'png', 'webp', 'avif', 'gif'].includes(file.content_type)) {
      content = `<img src="./media/${file.name}" alt="${file.name}" class="mx-auto max-h-full max-w-full" style="padding:10px;">`;
    } else if (['video', 'mov', 'mp4', 'webm', 'avi'].includes(file.content_type)) {
      content = `<video controls class="mx-auto max-h-full max-w-full" style="padding:10px;">
            <source src="./media/${file.name}" type="video/mp4">
            Your browser does not support the video tag.
          </video>`;
    } else if (['audio', 'mp3', 'ogg', 'wav'].includes(file.content_type)) {
      content = `<audio controls class="mx-auto" style="min-width:320px; min-height:60px; padding:10px;">
            <source src="./media/${file.name}" type="audio/mpeg">
            Your browser does not support the audio element.
          </audio>`;
    } else if (file.content_type === 'html') {
      content = file.contents ? file.contents : `<p style="padding:10px;">Loading HTML file...</p>`;
      if (!file.contents) {
        fetch(`./media/${file.name}`)
          .then(response => response.text())
          .then(html => {
            const win = document.getElementById(file.id);
            const contentDiv = win ? win.querySelector('.p-2') : null;
            if (contentDiv) { contentDiv.innerHTML = html; }
            file.contents = html;
            saveState();
          })
          .catch(error => {
            console.error("Error loading HTML file:", error);
            const win = document.getElementById(file.id);
            const contentDiv = win ? win.querySelector('.p-2') : null;
            if (contentDiv) { contentDiv.innerHTML = '<p>Error loading HTML file.</p>'; }
          });
      }
    } else if (file.content_type === 'text' || file.content_type === 'txt') {
      content = `<div id="file-content" style="padding:10px;">Loading file...</div>`;
      fetch(`./media/${file.name}`)
        .then(response => response.text())
        .then(text => {
          const win = document.getElementById(file.id);
          const contentDiv = win ? win.querySelector('.p-2') : null;
          if (contentDiv) {
            contentDiv.innerHTML = `<div id="text-editor" contenteditable="true" style="padding:10px; overflow:auto;">${text}</div>`;
            const textEditor = document.getElementById('text-editor');
            textEditor.addEventListener('input', function () {
              updateContent(file.id, this.innerHTML);
              // Mark as UGC so that future loads use the edited version.
              file.type = "ugc-file";
              file.content = this.innerHTML;
              saveState();
            });
          }
          file.content = text;
          saveState();
        })
        .catch(error => {
          console.error("Error loading text file:", error);
          const win = document.getElementById(file.id);
          const contentDiv = win ? win.querySelector('.p-2') : null;
          if (contentDiv) { contentDiv.innerHTML = '<p>Error loading file.</p>'; }
        });
      windowType = 'editor';
    } else if (file.content_type === 'markdown' || file.content_type === 'md') {
      content = `<div id="file-content" style="padding:10px;">Loading file...</div>`;
      fetch(`./media/${file.name}`)
        .then(response => response.text())
        .then(text => {
          const win = document.getElementById(file.id);
          const contentDiv = win ? win.querySelector('.p-2') : null;
          if (contentDiv) {
            contentDiv.innerHTML = `<div class="md_editor_pro_plus min-h-48 h-full w-full" data-markdown-pro-plus-editor-id="${file.id}"></div>`;
          }
          saveState();
        })
        .catch(error => {
          console.error("Error loading markdown file:", error);
          const win = document.getElementById(file.id);
          const contentDiv = win ? win.querySelector('.p-2') : null;
          if (contentDiv) { contentDiv.innerHTML = '<p>Error loading file.</p>'; }
        });
      windowType = 'editor';
    } else {
      content = `<p style="padding:10px;">Content of ${file.name}</p>`;
    }
  }

  let parentWin = null;
  if (e) {
    parentWin = e.target.closest('#windows-container > div');
  }
  let win = createWindow(file.name, content, false, file.id, false, false, { type: 'integer', width: 420, height: 350 }, windowType, parentWin);

  if (file.content_type === 'image') {
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
  } else if (file.content_type === 'video') {
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
  }
}

function getFolderIdByFullPath(fullPath) {
  // For drive roots, return the fullPath itself.
  if (/^[A-Z]:\/\/$/.test(fullPath)) return fullPath;
  const fs = getFileSystemState();
  function searchInFolder(contents) {
    for (const key in contents) {
      const item = contents[key];
      if (item.type === 'folder') {
        if (item.fullPath === fullPath) return key;
        const nested = fs.folders[item.fullPath] || {};
        const result = searchInFolder(nested);
        if (result) return result;
      }
    }
    return null;
  }
  for (const rootKey in fs.folders) {
    if (/^[A-Z]:\/\/$/.test(rootKey)) {
      const result = searchInFolder(fs.folders[rootKey]);
      if (result) return result;
    }
  }
  return null;
}

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
  const targetElem = e.target.closest('[data-item-id]');
  if (!targetElem) {
    const errorMessage = "No item selected.";
    document.getElementById('error-popup-audio').play();
    createWindow("⚠️ Error", errorMessage, false, null, false, false, { type: 'integer', width: 300, height: 100 }, "Default");
    return;
  }
  const itemId = targetElem.getAttribute('data-item-id');
  let contextPath = "C://Desktop";
  const explorerElem = targetElem.closest('.file-explorer-window');
  if (explorerElem) {
    contextPath = explorerElem.getAttribute('data-current-path');
  }
  let fs = getFileSystemState();
  // Get parent's contents as an object keyed by item IDs.
  let folderContents = fs.folders[contextPath] || {};
  let item = folderContents[itemId];
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
  }
}

function deleteItem(e, menuItem) {
  e.stopPropagation();
  hideContextMenu();
  const targetElem = e.target.closest('[data-item-id]');
  if (!targetElem) {
    const errorMessage = "No item selected.";
    document.getElementById('error-popup-audio').play();
    createWindow("⚠️ Error", errorMessage, false, null, false, false, { type: 'integer', width: 300, height: 100 }, "Default");
    return;
  }
  const itemId = targetElem.getAttribute('data-item-id');
  let contextPath = "C://Desktop";
  const explorerElem = targetElem.closest('.file-explorer-window');
  if (explorerElem) {
    contextPath = explorerElem.getAttribute('data-current-path');
  }
  let fs = getFileSystemState();
  let folderContents = fs.folders[contextPath] || {};
  if (!(itemId in folderContents)) {
    const errorMessage = "Item not found.";
    document.getElementById('error-popup-audio').play();
    createWindow("⚠️ Error", errorMessage, false, null, false, false, { type: 'integer', width: 300, height: 100 }, "Default");
    return;
  }
  if (!confirm("Are you sure you want to delete this item?")) {
    return;
  }
  // For folders, you might also want to remove its dedicated fs.folders entry.
  let item = folderContents[itemId];
  if (item && item.type === "folder" && item.fullPath) {
    delete fs.folders[item.fullPath];
  }
  delete folderContents[itemId];
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
}

function createNewFolder(e, fromFullPath) {
  e.stopPropagation();
  hideContextMenu();
  let parentPath = fromFullPath || 'C://';
  let folderName = prompt("Enter new folder name:", "New Folder");
  if (!folderName) return;
  
  let fs = getFileSystemState();
  // Ensure parent folder exists.
  if (!fs.folders[parentPath]) {
    fs.folders[parentPath] = {};
  }
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
  // Insert the new folder into the parent's contents.
  fs.folders[parentPath][folderId] = newFolderItem;
  
  // Refresh explorer view.
  let explorerWindow = document.getElementById('explorer-window');
  if (explorerWindow) {
    explorerWindow.querySelector('.file-explorer-window').outerHTML = getExplorerWindowContent(parentPath);
    setupFolderDrop();
  }
  setFileSystemState(fs);
  saveState();
}

function createNewFile(e, fromFullPath) {
  e.stopPropagation();
  hideContextMenu();
  let parentPath = fromFullPath || 'C://';
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
  if (!fs.folders[parentPath]) {
    fs.folders[parentPath] = {};
  }
  fs.folders[parentPath][newFile.id] = newFile;
  
  let explorerWindow = document.getElementById('explorer-window');
  if (explorerWindow) {
    explorerWindow.querySelector('.file-explorer-window').outerHTML = getExplorerWindowContent(parentPath);
    setupFolderDrop();
  }
  setFileSystemState(fs);
  saveState();
}

/* =====================
   Helper: Recursively find a folder object by its fullPath.
   Returns the folder object (which includes name, id, fullPath, etc.)
====================== */
function findFolderObjectByFullPath(fullPath) {
  fullPath = normalizePath(fullPath);
  const fs = getFileSystemState();
  // For drive roots, return a synthetic folder object.
  if (/^[A-Z]:\/\/$/.test(fullPath)) {
    return { id: fullPath, name: fullPath, fullPath: fullPath };
  }
  function search(contents) {
    for (const key in contents) {
      const item = contents[key];
      if (item.type === "folder") {
        if (normalizePath(item.fullPath) === fullPath) {
          return item;
        }
        const nested = getItemsForPath(item.fullPath);
        const result = search(nested);
        if (result) return result;
      }
    }
    return null;
  }
  // Search in each drive root.
  const fsFolders = getFileSystemState().folders;
  for (const drive in fsFolders) {
    if (/^[A-Z]:\/\/$/.test(drive)) {
      const result = search(fsFolders[drive]);
      if (result) return result;
    }
  }
  return null;
}

/* =====================
   Helper: Recursively find the fullPath for a folder given its id.
   For drive roots the id is the fullPath.
====================== */
function findFolderFullPathById(folderId, file = false) {
  // If folderId is a drive root, return it.
  if (/^[A-Z]:\/\/$/.test(folderId)) return folderId;
  function search(contents) {
    for (const key in contents) {
      const item = contents[key];
      if (item.type === "folder" || file === true) {
        if (key === folderId) {
          return item.fullPath;
        }
        const nested = getItemsForPath(item.fullPath);
        const result = search(nested);
        if (result) return result;
      }
    }
    return null;
  }
  const fsFolders = getFileSystemState().folders;
  for (const drive in fsFolders) {
    if (/^[A-Z]:\/\/$/.test(drive)) {
      const result = search(fsFolders[drive]);
      if (result) return result;
    }
  }
  return null;
}

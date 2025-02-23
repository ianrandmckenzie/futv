/* =====================
   Getter & Setter for fileSystemState
   These functions wrap the file system state so that we always retrieve it from
   (and update it in) localStorage.
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
File Explorer Window Type
This returns the HTML for a file explorer window.
====================== */
function getExplorerWindowContent(currentPath = 'C://') {
  currentPath = normalizePath(currentPath);
  let fs = getFileSystemState();
  let items = [];
  if (currentPath === "Desktop") {
    items = fs.desktop;
  } else {
    items = fs.folders[currentPath] || [];
  }
  let listHtml = '<ul class="pl-5">';
  items.forEach(item => {
    let icon = item.type === 'folder' ? 'image/folder.svg' : 'image/file.svg';
    if (item.icon_url) { icon = item.icon_url; }
    if (item.type === "folder") {
      listHtml += `<li class="cursor-pointer hover:bg-gray-50 file-item" data-item-id="${item.id}" onclick="openExplorer('${(currentPath === 'Desktop' ? 'Desktop' : currentPath) + '/' + item.name}')">
        <img src="${icon}" class="inline h-4 w-4 mr-2"> ${item.name}
      </li>`;
    } else {
      listHtml += `<li class="cursor-pointer hover:bg-gray-50 file-item" data-file-id="${item.id}" ondblclick="openFile('${item.id}', event); event.stopPropagation();">
        <img src="${icon}" class="inline h-4 w-4 mr-2"> ${item.name} ${item.description ? '(' + item.description + ')' : ''}
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
          <div id="breadcrumbs" class="mb-2">Path: ${getBreadcrumbs(currentPath)}</div>
          <div id="files-area">
            <div id="files-area">${listHtml}</div>
          </div>
        </div>
      </div>
    </div>
  `;
}

// Opens an explorer window for the given path.
function openExplorer(path) {
  path = normalizePath(path);
  let explorerWindow = document.getElementById('explorer-window');
  const newContent = getExplorerWindowContent(path);
  if (explorerWindow) {
    explorerWindow.querySelector('.file-explorer-window').outerHTML = newContent;
    explorerWindow.querySelector('.file-explorer-window').setAttribute('data-current-path', path);
    setTimeout(setupFolderDrop, 100);
  } else {
    explorerWindow = createWindow(
      path,
      newContent,
      false,
      'explorer-window',
      false,
      false,
      { type: 'integer', width: 600, height: 400 },
      "Explorer"
    );
  }
  if (path === "C:///Documents") {
    fetchDocuments();
  }
}

function refreshExplorerViews(folderPath) {
  document.querySelectorAll('.file-explorer-window').forEach(explorer => {
    const currentPath = explorer.getAttribute('data-current-path');
    if (currentPath === folderPath) {
      if (folderPath === "C:///Documents") {
        fetchDocuments();
      } else {

      }
    }
  });
}

function normalizePath(path) {
  if (path === "Desktop") return path;
  if (/^[A-Z]:\/\/$/.test(path)) return path;
  return path.replace(/\/+$/, "");
}

function getBreadcrumbs(path) {
  path = normalizePath(path);
  let driveMatch = path.match(/^([A-Z]:\/\/)(.*)/);
  if (driveMatch) {
    let drivePart = driveMatch[1];
    let rest = driveMatch[2];
    let breadcrumbHtml = `<span class="cursor-pointer hover:underline" onclick="openExplorer('${drivePart}')">${drivePart}</span>`;
    if (rest) {
      let parts = rest.split('/').filter(p => p !== '');
      let cumulativePath = drivePart;
      parts.forEach((part, index) => {
        cumulativePath += '/' + part;
        console.log(cumulativePath)
        breadcrumbHtml += " / " + `<span class="cursor-pointer hover:underline" onclick="openExplorer('${cumulativePath}')">${part}</span>`;
        if (index < parts.length - 1) {
          cumulativePath += "/";
        }
      });
    }
    return breadcrumbHtml;
  }
  let parts = path.split('/').filter(p => p !== '');
  let breadcrumbHtml = '';
  let cumulativePath = "";
  parts.forEach((part, index) => {
    cumulativePath += part + (index < parts.length - 1 ? "/" : "");
    breadcrumbHtml += `<span class="cursor-pointer hover:underline" onclick="openExplorer('${cumulativePath}')">${part}</span>`;
    if (index < parts.length - 1) {
      breadcrumbHtml += " / ";
    }
  });
  return breadcrumbHtml;
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
          content_type: content_type,
          icon_url: icon_url,
          description: file.description || ""
        };
      });
      let fs = getFileSystemState();
      fs.folders['C://'].find(it => it.id === 'c-docs').contents = fileItems;
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
  const files = getFileSystemState();
  let file;
  const explorerElem = e.target.closest('.file-explorer-window');
  if (explorerElem) {
    currentPath = explorerElem.getAttribute('data-current-path');
    file = (files.folders[currentPath] || []).find(it => it.id === incoming_file);
  }
  if (!file) file = files.desktop.find(it => it.id === incoming_file);
  console.log(file)

  if (!file || typeof file === 'string') {
    const errorMessage = ('<p>File not found.</p>');
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
    if (file.content_type === 'image' || file.content_type === 'jpg' || file.content_type === 'jpeg' || file.content_type === 'png' || file.content_type === 'webp' || file.content_type === 'avif' || file.content_type === 'gif') {
      content = `<img src="./media/${file.name}" alt="${file.name}" class="mx-auto max-h-full max-w-full" style="padding:10px;">`;
    } else if (file.content_type === 'video' || file.content_type === 'mov' || file.content_type === 'mp4' || file.content_type === 'webm' || file.content_type === 'avi') {
      content = `<video controls class="mx-auto max-h-full max-w-full" style="padding:10px;">
            <source src="./media/${file.name}" type="video/mp4">
            Your browser does not support the video tag.
          </video>`;
    } else if (file.content_type === 'audio' || file.content_type === 'mp3' || file.content_type === 'ogg' || file.content_type === 'wav') {
      content = `<audio controls class="mx-auto" style="min-width:320px; min-height:60px; padding:10px;">
            <source src="./media/${file.name}" type="audio/mpeg">
            Your browser does not support the audio element.
          </audio>`;
    } else if (file.content_type === 'html') {
      content = file.content ? file.content : `<p style="padding:10px;">Loading HTML file...</p>`;
      if (!file.content) {
        fetch(`./media/${file.name}`)
          .then(response => response.text())
          .then(html => {
            const win = document.getElementById(file.id);
            const contentDiv = win ? win.querySelector('.p-2') : null;
            if (contentDiv) { contentDiv.innerHTML = html; }
            file.content = html;
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
      // For non-UGC text files, we fetch from the media folder.
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
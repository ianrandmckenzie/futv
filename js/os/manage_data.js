let fileSystemState = {
  folders: {
    "C://": {
      "Documents": { id: 'Documents', name: 'Documents', type: 'folder', fullPath: 'C://Documents', contents: {}},
      "Desktop": { id: 'Desktop', name: 'Desktop', type: 'folder', fullPath: 'C://Desktop', contents: {
          "tubestream": { id: 'tubestream', name: 'FUTV Channel Stream.exe', type: 'app', fullPath: 'C://Desktop/tubestream', content_type: 'html', contents: '', icon: './image/video.svg' },
          "mailbox": { id: 'mailbox', name: 'FUTV Mail.exe', type: 'app', fullPath: 'C://Desktop/mailbox', content_type: 'html', contents: '', icon: './image/ballotbox.svg' }
        }
      }
    },
    "A://": {
      "folder-34862398": { id: 'folder-34862398', name: 'example folder', type: 'folder', fullPath: 'A://folder-34862398', contents: {
        "folder-9523759823": { id: 'folder-9523759823', name: "nested in example", type: 'folder', fullPath: 'A://folder-34862398/folder-9523759823', contents: {
          "folder-53829539": { id: 'folder-53829539', name: 'supernested', type: 'folder', fullPath: 'A://folder-34862398/folder-9523759823/folder-53829539', contents: {
            "file-593485739": { id: 'file-593485739', name: 'some md example', type: 'ugc-file', content_type: 'md', fullPath: 'A://folder-34862398/folder-9523759823/folder-53829539/file-593485739', contents: 'lol sup' }
          }}
        }}
      }}
    },
    "D://": {}
  }
};

function saveState() {
  const appState = {
    fileSystemState: fileSystemState,
    windowStates: windowStates,
    desktopIconsState: desktopIconsState,
    desktopSettings: desktopSettings
  };
  localStorage.setItem('appState', JSON.stringify(appState));
}

function updateContent(windowId, newContent) {
  if (windowStates[windowId]) {
    windowStates[windowId].content = newContent;
    saveState();
  }
}

function initializeAppState() {
  if (!localStorage.getItem('appState')) {
    // No saved state; initialize using the default base objects.
    const initialState = {
      fileSystemState: fileSystemState,
      windowStates: windowStates,
      desktopIconsState: desktopIconsState,
      desktopSettings: desktopSettings
    };
    localStorage.setItem('appState', JSON.stringify(initialState));
  } else {
    // Load state from localStorage
    const storedState = JSON.parse(localStorage.getItem('appState'));
    setFileSystemState(storedState.fileSystemState);
    windowStates = storedState.windowStates;
    desktopIconsState = storedState.desktopIconsState;
    desktopSettings = storedState.desktopSettings;
  }
}

function restoreFileSystemState() {
  const saved = localStorage.getItem('fileSystemState');
  if (saved) {
    fileSystemState = JSON.parse(saved);
  }
}

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
        true,
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

restoreFileSystemState();

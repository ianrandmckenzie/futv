let fileSystemState = {
  folders: {
    "C://": [
      { id: 'c-docs', name: "Documents", type: "folder", contents: [] },
      { id: 'c-desktop', name: "Desktop", type: "folder", contents: [
        { id: 'futv-1', name: 'FUTV Channel Stream.exe', type: 'file', content: '<iframe width=&quot;560&quot; height=&quot;315&quot; style=&quot;margin:0 auto;&quot; src=&quot;https://www.youtube.com/embed/jLILJi1xCwo?si=pa3RREcmUPncuAam&amp;autoplay=true&quot; title=&quot;YouTube video player&quot; frameborder=&quot;0&quot; allow=&quot;accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share&quot; referrerpolicy=&quot;strict-origin-when-cross-origin&quot; allowfullscreen></iframe>' }
      ] },
      { id: 'c-test', name: "test", type: "folder", contents: [
        { id: 'c-test-nested', name: "nested", type: "folder", contents: [] }
      ]}
    ],
    "A://": [
      { id: 'a-floppy', name: "FloppyFiles", type: "folder" },
      { id: 'a-cheeky', name: "cheeky.txt", type: "file", content: "Cheeky content – enjoy your floppy!" }
    ],
    "D://": [
      { id: 'd-cd', name: "CD Drive", type: "folder" },
      { id: 'd-awesome', name: "awesome.mp3", type: "file", content: "This is some awesome music!" }
    ]
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

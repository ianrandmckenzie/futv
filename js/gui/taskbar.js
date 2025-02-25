function toggleStartMenu() {
  const menu = document.getElementById('start-menu');
  menu.classList.toggle('hidden');
  toggleButtonActiveState('start-button');
}

function toggleButtonActiveState(id, rename = null) {
  let btn;
  console.log(id)
  if (typeof id !== 'string') btn = id;
  btn = document.getElementById(id);
  btn.classList.toggle('bg-gray-100');
  btn.classList.toggle('bg-gray-300');
  btn.classList.toggle('border-gray-500');
  btn.classList.toggle('border-black');
  const btnInner = btn.querySelector('span')
  btnInner.classList.toggle('border-gray-500');
  btnInner.classList.toggle('border-black');
  if (rename) {
    btnInner.innerHTML = rename;
  }
}

function minimizeAllWindows() {
  for (const id in windowStates) {
    minimizeWindow(id);
  }
  document.querySelectorAll('#window-tabs > div').forEach(tab => {
    tab.classList.remove('bg-gray-50');
  });
}

function openNav(title, content = '', dimensions = { type: 'default' }, windowType = 'default') {
  toggleStartMenu();
  if (navWindows[title]) {
    const existingWindow = document.getElementById(navWindows[title]);
    if (existingWindow) { bringToFront(existingWindow); return; }
    else { delete navWindows[title]; }
  }
  createWindow(title, content, true, null, false, false, dimensions, windowType);
}

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

function toggleMediaPlayback() {
  const mediaEl = getActiveMediaElement();
  if (mediaEl) {
    mediaEl.paused ? mediaEl.play() : mediaEl.pause();
    updateMediaControl();
  }
}

function updateMediaControl() {
  const mediaEl = getActiveMediaElement();
  const mediaControl = document.getElementById('media-control');
  if (mediaEl) {
    mediaControl.textContent = mediaEl.paused ? "▶" : "⏸";
  } else {
    mediaControl.textContent = "";
  }
}

function getActiveMediaElement() {
  if (activeMediaWindow) {
    const win = document.getElementById(activeMediaWindow);
    if (win) {
      return win.querySelector("video, audio");
    }
  }
  return null;
}

setInterval(updateClock, 1000);
updateClock();

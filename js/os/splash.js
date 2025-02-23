function showSplash() {
  const splashDiv = document.createElement('div');
  splashDiv.className = 'w-3xl'
  splashDiv.id = "splash-screen";
  splashDiv.style.position = "fixed";
  splashDiv.style.top = "0";
  splashDiv.style.left = "0";
  splashDiv.style.width = "100%";
  splashDiv.style.height = "100%";
  splashDiv.style.zIndex = "9999";
  splashDiv.style.backgroundColor = "#000";

  splashDiv.innerHTML = `
  <div class="flex flex-col items-center justify-center h-full">
    <img id="splash-image" src="./image/startup.jpeg" alt="Startup" class="mb-4">
    <h1 class="text-4xl text-white font-bold mb-2">FUTV - Information Access</h1>
    <div class="mx-auto w-96 text-sm pl-3 mb-2 text-[rgb(0,255,0)]"><em>I have prefilled credentials for you.<br> —Your friendly neighborhood hackerman, _N30_phreak_</em></div>
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

  const splashAudio = document.getElementById("splash-audio");
  document.getElementById("splash-form").addEventListener("submit", function (e) {
    splashAudio.play();
    e.preventDefault();
    document.getElementById("splash-image").src = "image/loading.gif";
    splashAudio.currentTime = 0;
    setTimeout(function () {
      splashDiv.remove();
      localStorage.setItem("splashSeen", "true");
    }, 3000);
  });

  document.getElementById("splash-login").addEventListener("click", function () {
    splashAudio.play();
    document.getElementById("splash-image").src = "image/loading.gif";
    splashAudio.currentTime = 0;
    setTimeout(function () {
      splashDiv.remove();
      localStorage.setItem("splashSeen", "true");
    }, 3000);
  });
}
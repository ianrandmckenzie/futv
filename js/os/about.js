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

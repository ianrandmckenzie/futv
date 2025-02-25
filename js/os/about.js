function openAboutWindow() {
  const content = `
    <div class="p-4">
      <h1 class="text-xl font-bold mb-2">About this computer</h1>
      <p>This is an introductory paragraph to what FUTV is all about.</p>
      <p>Version: 1.0.0</p>
      <p>Some other flavor text blending FUTV branding with nostalgia.</p>
    </div>
  `;
  createWindow("About this computer", content, false, null, false, false, { type: 'integer', width: 400, height: 300 }, "default", null, 'gray-200 cursor-not-allowed pointer-events-none');
}

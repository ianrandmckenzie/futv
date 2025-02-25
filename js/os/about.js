function openAboutWindow() {
  const content = `
    <div class="p-4">
      <img src="./image/microsauce.jpeg" class="h-48 w-48 mx-auto mb-4 rounded shadow-md">
      <h1 class="text-xl font-bold mb-2">About This Computer</h1>
      <p>This is an introductory paragraph to what FUTV is all about.</p>
      <p>Version: 1.0.0</p>
      <p>Some other flavor text blending FUTV branding with nostalgia.</p>
    </div>
  `;
  createWindow("About This Computer", content, false, null, false, false, { type: 'integer', width: 400, height: 500 }, "default", null, 'gray-200 cursor-not-allowed pointer-events-none');
}

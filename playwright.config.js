module.exports = {
  testDir: './tests',
  timeout: 60000,
  projects: [{ name: 'chromium', use: { browserName: 'chromium', viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true } }],
  use: { headless: true },
  webServer: {
    command: 'python3 -m http.server 8765 --bind 127.0.0.1',
    port: 8765,
    reuseExistingServer: true,
    cwd: __dirname,
  },
};

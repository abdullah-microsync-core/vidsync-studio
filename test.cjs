const puppeteer = require('puppeteer-core');
const fs = require('fs');

(async () => {
  const browser = await puppeteer.launch({
    executablePath: 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
    headless: true,
    defaultViewport: { width: 1280, height: 800 }
  });
  
  const page = await browser.newPage();
  console.log("Navigating to app...");
  await page.goto('http://localhost:5174', { waitUntil: 'networkidle0' });
  
  // Wait for the app to initialize
  await new Promise(r => setTimeout(r, 3000));
  
  // Take initial screenshot
  await page.screenshot({ path: 'C:\\Users\\ELCOT\\.gemini\\antigravity-ide\\brain\\ac13531d-8eda-4de5-a6e2-b8b7e9243cf2\\scratch\\initial.png' });
  console.log("Took initial screenshot.");
  
  // Click the Play button
  await page.evaluate(() => {
    // Find the play icon SVG (lucide-play)
    const svgs = document.querySelectorAll('svg');
    for (const svg of svgs) {
      if (svg.classList.contains('lucide-play')) {
        const btn = svg.closest('button');
        if (btn) btn.click();
        break;
      }
    }
  });
  
  console.log("Clicked play button.");
  
  // Wait a few seconds for video to play
  await new Promise(r => setTimeout(r, 4000));
  
  // Take screenshot while playing
  await page.screenshot({ path: 'C:\\Users\\ELCOT\\.gemini\\antigravity-ide\\brain\\ac13531d-8eda-4de5-a6e2-b8b7e9243cf2\\scratch\\playing.png' });
  console.log("Took playing screenshot.");
  
  // Wait for it to reach the end (duration is maxDuration, around 10-15s, we waited 4s, let's wait 12s more)
  await new Promise(r => setTimeout(r, 12000));
  
  // Take screenshot at the end
  await page.screenshot({ path: 'C:\\Users\\ELCOT\\.gemini\\antigravity-ide\\brain\\ac13531d-8eda-4de5-a6e2-b8b7e9243cf2\\scratch\\end.png' });
  console.log("Took end screenshot.");
  
  await browser.close();
})();

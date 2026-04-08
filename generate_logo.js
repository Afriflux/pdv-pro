const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  await page.setViewport({ width: 512, height: 512 });
  
  const html = `
  <!DOCTYPE html>
  <html>
  <head>
    <style>
      @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@700&display=swap');
      body {
        margin: 0;
        padding: 0;
        background: #FAFAF7;
        display: flex;
        align-items: center;
        justify-content: center;
        width: 512px;
        height: 512px;
      }
      .logo-container {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 30px;
        margin-top: 20px;
      }
      .icon-box {
        background-color: #0F7A60;
        border-radius: 40px;
        width: 250px;
        height: 250px;
        display: flex;
        align-items: center;
        justify-content: center;
        box-shadow: 0 10px 25px rgba(0,0,0,0.05);
      }
      .text {
        font-family: 'Cormorant Garamond', serif;
        font-size: 70px;
        font-weight: 700;
        color: #1A1A1A;
        margin: 0;
        line-height: 1;
        letter-spacing: -2px;
      }
      .pro {
        color: #0F7A60;
      }
    </style>
  </head>
  <body>
    <div class="logo-container">
      <div class="icon-box">
        <svg xmlns="http://www.w3.org/2000/svg" width="130" height="130" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="m2 7 4.41-4.41A2 2 0 0 1 7.83 2h8.34a2 2 0 0 1 1.42.59L22 7"/>
          <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"/>
          <path d="M15 22v-4a2 2 0 0 0-2-2h-2a2 2 0 0 0-2 2v4"/>
          <path d="M2 7h20"/>
          <path d="M22 7v3a2 2 0 0 1-2 2v0a2.7 2.7 0 0 1-1.59-.63.7.7 0 0 0-.82 0A2.7 2.7 0 0 1 16 12a2.7 2.7 0 0 1-1.59-.63.7.7 0 0 0-.82 0A2.7 2.7 0 0 1 12 12a2.7 2.7 0 0 1-1.59-.63.7.7 0 0 0-.82 0A2.7 2.7 0 0 1 8 12a2.7 2.7 0 0 1-1.59-.63.7.7 0 0 0-.82 0A2.7 2.7 0 0 1 4 12v0a2 2 0 0 1-2-2V7"/>
        </svg>
      </div>
      <div class="text">Yayyam<span class="pro">Pro</span></div>
    </div>
  </body>
  </html>
  `;
  
  await page.setContent(html, { waitUntil: 'networkidle0' });
  await page.screenshot({ path: 'yayyam_telegram.png' });
  await browser.close();
})();

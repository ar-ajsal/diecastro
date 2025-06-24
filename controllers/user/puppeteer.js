const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  const page = await browser.newPage();
  await page.goto('https://example.com');
  await page.pdf({ path: 'test.pdf', format: 'A4' });
  await browser.close();
  console.log('PDF generated!');
})();

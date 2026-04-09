const puppeteer = require('puppeteer');
const { spawn } = require('child_process');

(async () => {
    console.log("Starting vite preview...");
    const vite = spawn('npm', ['run', 'preview'], { cwd: process.cwd(), stdio: 'pipe' });
    
    // Wait for vite to start
    await new Promise(res => setTimeout(res, 3000));
    
    console.log("Launching puppeteer...");
    const browser = await puppeteer.launch();
    const page = await browser.newPage();
    
    // Capture page errors
    page.on('pageerror', error => {
        console.error('PAGE ERROR CRASH:', error.message);
    });
    page.on('console', msg => {
        if (msg.type() === 'error') console.log('CONSOLE ERROR:', msg.text());
    });
    
    try {
        await page.goto('http://localhost:4173');
        
        // Wait for login view
        await page.waitForSelector('button');
        
        // Find and click the "新規販売店登録" tab (it sets tab to register)
        const tabs = await page.$$('button');
        for (const tab of tabs) {
            const text = await page.evaluate(el => el.textContent, tab);
            if (text.includes('新規販売店登録')) {
                await tab.click();
                break;
            }
        }
        
        // Wait for register form
        await page.waitForSelector('input[name="companyName"]');
        
        // Fill out required fields
        await page.type('input[name="companyName"]', 'Test Company');
        await page.type('input[name="companyNameKana"]', 'テストカンパニー');
        await page.type('input[name="representativeLastName"]', '山田');
        await page.type('input[name="representativeFirstName"]', '太郎');
        await page.type('input[name="representativeLastNameKana"]', 'ヤマダ');
        await page.type('input[name="representativeFirstNameKana"]', 'タロウ');
        await page.type('input[name="contactLastName"]', '佐藤');
        await page.type('input[name="contactFirstName"]', '一郎');
        await page.type('input[name="contactLastNameKana"]', 'サトウ');
        await page.type('input[name="contactFirstNameKana"]', 'イチロウ');
        await page.type('input[name="postalCode"]', '123-4567');
        await page.type('input[name="addressLine1"]', 'Tokyo');
        await page.type('input[name="phone"]', '09012345678');
        
        // Agree to terms
        await page.click('input[name="termsAgreed"]');
        
        console.log("Clicking proceed button...");
        // Click Proceed
        const proceedBtns = await page.$$('button');
        for (const btn of proceedBtns) {
            const text = await page.evaluate(el => el.textContent, btn);
            if (text.includes('入力内容の確認へ進む')) {
                await btn.click();
                console.log("Proceed button clicked!");
                break;
            }
        }
        
        // Wait to see if crash happens or confirm view appears
        await new Promise(res => setTimeout(res, 2000));
        
        const confirmText = await page.content();
        if (confirmText.includes('会社情報')) {
            console.log("SUCCESS: Confirmation screen appeared smoothly!");
        } else {
            console.log("FAILURE: Screen disappeared. Content:");
            console.log(confirmText.substring(0, 500)); // print root div
        }
        
    } catch (e) {
        console.error("Test script failed:", e);
    } finally {
        await browser.close();
        vite.kill();
        process.exit(0);
    }
})();

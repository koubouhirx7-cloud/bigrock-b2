import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const targetDir = path.join(__dirname, '../src');

const filesToProcess = [
    path.join(targetDir, 'App.jsx'),
    path.join(targetDir, 'components/Login.jsx'),
    path.join(targetDir, 'components/Admin.jsx'),
];

function processFile(filePath) {
    if (!fs.existsSync(filePath)) {
        console.warn(`File not found: ${filePath}`);
        return;
    }

    let content = fs.readFileSync(filePath, 'utf8');

    // Convert text-white to text-text-main (mostly safe, might need text-white on primary buttons?)
    // Primary is dark green, so text on primary buttons should STAY white.
    // E.g., `text-white` on `bg-primary` or `bg-accent-red`.
    // Instead of regex hacking, I'll globally replace text-white to text-text-main, then manually fix bg-primary if needed.
    // Wait, the primary button is bg-primary text-background-dark previously! 
    // Now background-dark is background-main (light). So text-background-main on bg-primary means light text on dark green! Which is PERFECT!
    
    content = content.replace(/text-white/g, 'text-text-main');
    
    // Convert bg-white/X to bg-black/X
    content = content.replace(/bg-white\/5/g, 'bg-black/5');
    content = content.replace(/bg-white\/10/g, 'bg-black/10');
    content = content.replace(/bg-white\/20/g, 'bg-black/20');
    content = content.replace(/hover:bg-white\/5/g, 'hover:bg-black/5');
    content = content.replace(/hover:bg-white\/10/g, 'hover:bg-black/10');
    
    // Borders
    content = content.replace(/border-white\/10/g, 'border-black/10');
    content = content.replace(/border-white\/20/g, 'border-black/20');
    content = content.replace(/hover:border-white/g, 'hover:border-text-main');

    // Text on overlays
    content = content.replace(/bg-black\/50 backdrop-blur-md/g, 'bg-black/10 backdrop-blur-md text-text-main');
    
    // In product detail image overlay, we want text-white because of the gradient
    // Wait... if the gradient is from background-main (which is light) to transparent, it's a light gradient!
    // So text-text-main is correct.
    
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`Updated ${filePath}`);
}

filesToProcess.forEach(processFile);

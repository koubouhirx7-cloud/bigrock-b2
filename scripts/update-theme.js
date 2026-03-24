import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const targetDir = path.join(__dirname, '../src');
const rootDir = path.join(__dirname, '..');

const filesToProcess = [
    path.join(rootDir, 'index.html'),
    path.join(targetDir, 'App.jsx'),
    path.join(targetDir, 'components/Login.jsx'),
    path.join(targetDir, 'components/Admin.jsx'),
    path.join(targetDir, 'index.css')
];

function processFile(filePath) {
    if (!fs.existsSync(filePath)) {
        console.warn(`File not found: ${filePath}`);
        return;
    }

    let content = fs.readFileSync(filePath, 'utf8');

    // Replace background-dark with background-main
    content = content.replace(/background-dark/g, 'background-main');

    // Remove dark class from html tag in index.html
    if (filePath.endsWith('index.html')) {
        content = content.replace(/class="dark"/g, '');
        // Update Tailwind config colors
        content = content.replace(/"primary": "#f2c84a"/g, '"primary": "#2D4A22"');
        content = content.replace(/"primary-dim": "#b39020"/g, '"primary-dim": "#1F3318"');
        content = content.replace(/"background-main": "#111113"/g, '"background-main": "#F7F9F6"');
        content = content.replace(/"surface": "#1E1E21"/g, '"surface": "#FFFFFF"');
        content = content.replace(/"surface-highlight": "#2a2a2d"/g, '"surface-highlight": "#F0F2EE"');
        content = content.replace(/"text-main": "#EAEAEA"/g, '"text-main": "#1A2016"');
        content = content.replace(/"text-muted": "#888888"/g, '"text-muted": "#687163"');
        content = content.replace(/"border-subtle": "#333336"/g, '"border-subtle": "#E2E6DF"');
        content = content.replace(/"accent-red": "#EB5757"/g, '"accent-red": "#E11D48"');
        content = content.replace(/"accent-green": "#27AE60"/g, '"accent-green": "#16A34A"');

        // Note: The previous string replacement might have already changed background-dark to background-main
        content = content.replace(/"background-dark": "#111113"/g, '"background-main": "#F7F9F6"'); // Fallback
    }

    // Replace technical-grid CSS in index.html to fit light theme
    if (filePath.endsWith('index.html')) {
        content = content.replace(/"grid-pattern": "linear-gradient\(to right, #333336 1px, transparent 1px\), linear-gradient\(to bottom, #333336 1px, transparent 1px\)"/g, 
            '"grid-pattern": "linear-gradient(to right, #E2E6DF 1px, transparent 1px), linear-gradient(to bottom, #E2E6DF 1px, transparent 1px)"');
        content = content.replace(/background: #111113;/g, 'background: #F7F9F6;');
        content = content.replace(/background: #333336;/g, 'background: #D1D5CB;');
    }

    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`Updated ${filePath}`);
}

filesToProcess.forEach(processFile);

const fs = require('fs');
const path = require('path');

const APPS = ['client-app', 'client-admin', 'driver-app'];
const MODES = ['dev', 'prod', 'toggle'];
const modeArg = process.argv[2];

if (!modeArg || !MODES.includes(modeArg)) {
  console.error('Usage: node env-switch.js <dev|prod|toggle>');
  process.exit(1);
}

const rootDir = __dirname;
const envFiles = APPS.map((app) => path.join(rootDir, app, '.env'));

function detectMode(content) {
  const lines = content.split(/\r?\n/);
  for (let line of lines) {
    const trimmed = line.trim();
    if (trimmed.startsWith('VITE_API_URL=')) return 'dev';
    if (trimmed.startsWith('# VITE_API_URL=')) return 'prod';
  }
  return null;
}

function transformLine(line, shouldEnable) {
  if (/^\s*$/.test(line)) return line;
  if (/^\s*#\s*VITE_/.test(line)) {
    if (shouldEnable) {
      return line.replace(/^\s*#\s?/, '');
    }
    return line;
  }
  if (/^\s*VITE_/.test(line)) {
    if (shouldEnable) return line;
    return `# ${line}`;
  }
  return line;
}

function processEnvFile(filePath, targetMode) {
  if (!fs.existsSync(filePath)) {
    console.warn(`Skipping missing file: ${filePath}`);
    return false;
  }

  const raw = fs.readFileSync(filePath, 'utf8');
  const lines = raw.split(/\r?\n/);
  let inDevSection = false;
  let inProdSection = false;
  let changed = false;
  const out = lines.map((line) => {
    const trimmed = line.trim();
    if (trimmed === '# Development (local)') {
      inDevSection = true;
      inProdSection = false;
      return line;
    }
    if (trimmed === '# Production (Render)') {
      inDevSection = false;
      inProdSection = true;
      return line;
    }

    if (inDevSection) {
      const shouldEnable = targetMode === 'dev';
      const nextLine = transformLine(line, shouldEnable);
      if (nextLine !== line) changed = true;
      return nextLine;
    }

    if (inProdSection) {
      const shouldEnable = targetMode === 'prod';
      const nextLine = transformLine(line, shouldEnable);
      if (nextLine !== line) changed = true;
      return nextLine;
    }

    return line;
  });

  if (changed) {
    fs.writeFileSync(filePath, out.join('\n'), 'utf8');
  }
  return changed;
}

let targetMode = modeArg;
if (modeArg === 'toggle') {
  const firstFile = envFiles[0];
  if (!fs.existsSync(firstFile)) {
    console.error('Root env file not found for toggle detection.');
    process.exit(1);
  }
  const content = fs.readFileSync(firstFile, 'utf8');
  const currentMode = detectMode(content);
  if (!currentMode) {
    console.error('Unable to detect current mode from first .env file.');
    process.exit(1);
  }
  targetMode = currentMode === 'dev' ? 'prod' : 'dev';
}

console.log(`Switching environment files to ${targetMode === 'prod' ? 'production' : 'development'} mode...`);
let applied = 0;
for (const envFile of envFiles) {
  const ok = processEnvFile(envFile, targetMode);
  if (ok) {
    console.log(`  ✔ Updated ${envFile}`);
    applied += 1;
  } else {
    console.log(`  - No changes needed for ${envFile}`);
  }
}

if (applied === 0) {
  console.log('No files were modified. They may already be in the requested mode.');
} else {
  console.log(`Updated ${applied} environment file${applied > 1 ? 's' : ''}.`);
}

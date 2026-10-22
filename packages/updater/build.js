import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { execSync } from 'node:child_process';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const esbuildPath = 'C:\\Users\\Marzipan\\Desktop\\Spruce\\node_modules\\esbuild\\bin\\esbuild';
const tscPath = 'C:\\Users\\Marzipan\\Desktop\\Spruce\\node_modules\\typescript\\bin\\tsc';

fs.rmSync(path.join(__dirname, 'dist'), { recursive: true, force: true });
fs.mkdirSync(path.join(__dirname, 'dist/main'), { recursive: true });
fs.mkdirSync(path.join(__dirname, 'dist/preload'), { recursive: true });
fs.mkdirSync(path.join(__dirname, 'dist/react'), { recursive: true });

execSync(`node "${esbuildPath}" src/main/index.ts --bundle --platform=node --format=esm --outfile=dist/main/index.js --external:electron`, { stdio: 'inherit' });
execSync(`node "${esbuildPath}" src/main/index.ts --bundle --platform=node --format=cjs --outfile=dist/main/index.cjs --external:electron`, { stdio: 'inherit' });

execSync(`node "${esbuildPath}" src/preload/index.ts --bundle --platform=node --format=esm --outfile=dist/preload/index.js --external:electron`, { stdio: 'inherit' });
execSync(`node "${esbuildPath}" src/preload/index.ts --bundle --platform=node --format=cjs --outfile=dist/preload/index.cjs --external:electron`, { stdio: 'inherit' });

execSync(`node "${esbuildPath}" src/react/index.ts --bundle --format=esm --outfile=dist/react/index.js --external:react --external:react-dom --loader:.tsx=tsx`, { stdio: 'inherit' });

fs.copyFileSync(
  path.join(__dirname, 'src/react/UpdateCard.css'),
  path.join(__dirname, 'dist/react/style.css')
);

try {
  execSync(`node "${tscPath}" --emitDeclarationOnly`, { stdio: 'inherit' });
} catch (e) {
}

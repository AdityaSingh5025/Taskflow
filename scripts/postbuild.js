import fs from 'fs';
import path from 'path';

const publicDir = path.resolve('public');
const clientDist = path.resolve('client', 'dist');

// 1. Clean up public directory
if (fs.existsSync(publicDir)) {
  fs.rmSync(publicDir, { recursive: true, force: true });
}
fs.mkdirSync(publicDir, { recursive: true });

// 2. Copy client/dist to public
const copyRecursiveSync = (src, dest) => {
  const exists = fs.existsSync(src);
  const stats = exists && fs.statSync(src);
  const isDirectory = exists && stats.isDirectory();
  if (isDirectory) {
    if (!fs.existsSync(dest)) fs.mkdirSync(dest);
    fs.readdirSync(src).forEach((childItemName) => {
      copyRecursiveSync(path.join(src, childItemName), path.join(dest, childItemName));
    });
  } else {
    fs.copyFileSync(src, dest);
  }
};

if (fs.existsSync(clientDist)) {
  console.log('Moving client/dist to public...');
  copyRecursiveSync(clientDist, publicDir);
  console.log('Build finalized successfully!');
} else {
  console.error('Error: client/dist not found. Please run vite build first.');
  process.exit(1);
}

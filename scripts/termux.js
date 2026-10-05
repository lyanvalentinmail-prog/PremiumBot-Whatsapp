import { spawnSync } from 'node:child_process';

const result = spawnSync('ffmpeg', ['-version'], { stdio: 'ignore' });
console.log(result.status === 0 ? '✓ FFmpeg detectado.' : '⚠️ FFmpeg no detectado. Instala con: pkg install ffmpeg -y');
console.log('Node.js:', process.version);
console.log('Para iniciar configuración: npm run setup');

const { spawnSync } = require('node:child_process');
const path = require('node:path');
const fs = require('node:fs');
const { generateImageAsync } = require('@expo/image-utils');

async function main() {
  const projectRoot = path.resolve(__dirname, '..');
  const icons = path.join(projectRoot, 'public', 'icons');
  fs.mkdirSync(icons, { recursive: true });
  for (const size of [180, 192, 512]) {
    const image = await generateImageAsync({ projectRoot, cacheType: 'pwa-icons' }, {
      src: path.join(projectRoot, 'assets/images/fut-manager-icon.png'), width: size, height: size,
      resizeMode: 'contain', backgroundColor: '#152B24', removeTransparency: true,
    });
    fs.writeFileSync(path.join(icons, `icon-${size}.png`), image.source);
  }
  const result = spawnSync(process.execPath, [require.resolve('expo/bin/cli'), 'export', '--platform', 'web'], {
    cwd: projectRoot, stdio: 'inherit',
    env: { ...process.env, EXPO_PUBLIC_API_URL: '/api', EAS_PROJECT_ID: '', EAS_UPDATE_URL: '', ANDROID_APPLICATION_ID: '' },
  });
  if (result.error) throw result.error;
  process.exitCode = result.status ?? 1;
}
main().catch(error => { console.error(error); process.exitCode = 1; });

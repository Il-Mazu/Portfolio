import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

function gitInfoPlugin() {
  const VIRTUAL_ID = 'virtual:git-info';
  const RESOLVED_ID = '\0' + VIRTUAL_ID;
  return {
    name: 'git-info',
    resolveId(id) {
      if (id === VIRTUAL_ID) return RESOLVED_ID;
    },
    load(id) {
      if (id === RESOLVED_ID) {
        try {
          const log = execSync('git log --oneline -5', { encoding: 'utf-8' }).trim();
          const remoteRaw = execSync('git remote get-url origin', { encoding: 'utf-8' }).trim();
          const buildDate = new Date().toISOString().split('T')[0];
          const commits = log.split('\n').filter(Boolean).map(line => {
            const i = line.indexOf(' ');
            return { hash: line.slice(0, i), message: line.slice(i + 1) };
          });
          return `
            export const commits = ${JSON.stringify(commits)};
            export const remote = ${JSON.stringify(remoteRaw)};
            export const buildDate = ${JSON.stringify(buildDate)};
          `;
        } catch (e) {
          return `
            export const commits = [];
            export const remote = '';
            export const buildDate = '';
          `;
        }
      }
    },
  };
}

function dumpImagesPlugin() {
  const VIRTUAL_ID = 'virtual:dump-images';
  const RESOLVED_ID = '\0' + VIRTUAL_ID;
  const dumpDir = path.resolve(__dirname, 'public/Dump');
  const exts = ['.jpeg', '.jpg', '.png', '.gif', '.webp'];

  function scanImages() {
    let files = [];
    try {
      files = fs.readdirSync(dumpDir);
    } catch (e) {
      return [];
    }
    return files
      .filter(f => exts.includes(path.extname(f).toLowerCase()))
      .sort()
      .map(f => `/Dump/${f}`);
  }

  return {
    name: 'dump-images',
    resolveId(id) {
      if (id === VIRTUAL_ID) return RESOLVED_ID;
    },
    load(id) {
      if (id === RESOLVED_ID) {
        const images = scanImages();
        return `export const images = ${JSON.stringify(images)};\nexport const count = ${images.length};`;
      }
    },
    configureServer(server) {
      server.watcher.add(dumpDir);
      const handler = (filePath) => {
        if (filePath.startsWith(dumpDir)) {
          const mod = server.moduleGraph.getModuleById(RESOLVED_ID);
          if (mod) {
            server.moduleGraph.invalidateModule(mod);
          }
          server.ws.send({ type: 'full-reload' });
        }
      };
      server.watcher.on('add', handler);
      server.watcher.on('unlink', handler);
    },
  };
}

export default defineConfig({
  plugins: [react(), gitInfoPlugin(), dumpImagesPlugin()],
  assetsInclude: ['**/*.gif', '**/*.mp3', '**/*.jpg'],
});

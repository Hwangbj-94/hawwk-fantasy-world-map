import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import fs from 'node:fs';

const repositoryName = process.env.GITHUB_REPOSITORY?.split('/')[1];
const base = repositoryName ? `/${repositoryName}/` : '/';
const workspaceRoot = process.cwd();
const realWorkspaceRoot = fs.realpathSync.native(workspaceRoot);

export default defineConfig({
  base,
  plugins: [react()],
  optimizeDeps: {
    include: [],
    noDiscovery: true
  },
  server: {
    fs: {
      allow: [workspaceRoot, realWorkspaceRoot]
    }
  },
  test: {
    environment: 'jsdom',
    globals: true,
    css: true
  }
});

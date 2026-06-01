import { defineConfig } from '@playwright/test';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  testDir: 'tests',
  timeout: 30000,
  use: {
    baseURL: `file://${path.join(__dirname, 'index.html')}`,
  },
});

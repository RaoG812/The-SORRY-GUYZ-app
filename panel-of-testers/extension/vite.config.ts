import { defineConfig } from 'vite';

export default defineConfig({
  build: {
    outDir: 'dist',
    rollupOptions: {
      input: {
        background: 'background.ts',
        content: 'content.ts',
        offscreen: 'offscreen.ts'
      },
      output: {
        entryFileNames: '[name].js'
      }
    }
  }
});

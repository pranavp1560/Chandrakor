import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@chandrakor/shared-types': path.resolve(__dirname, '../../packages/shared-types/src/index.ts'),
      '@chandrakor/supabase-client': path.resolve(__dirname, '../../packages/supabase-client/src/index.ts'),
    },
  },
  server: {
    port: 5173,
  },
});

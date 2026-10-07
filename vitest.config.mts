import path from 'node:path';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  resolve: {
    alias: {
      '@': path.resolve(import.meta.dirname, 'src'),
      // The game logic only touches storage through zustand's persist; in tests
      // an in-memory stand-in keeps them fast and off the device.
      '@react-native-async-storage/async-storage': path.resolve(import.meta.dirname, 'src/game/__tests__/async-storage-mock.ts'),
    },
  },
  test: { include: ['src/**/*.test.ts'] },
});

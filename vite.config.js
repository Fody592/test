import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import basicSsl from '@vitejs/plugin-basic-ssl';
import { viteSingleFile } from 'vite-plugin-singlefile';

// dev / build : normal app (self-signed https so Web Bluetooth works on your LAN)
// --mode esp  : one inlined index.html, later gzipped into the ESP32 firmware
export default defineConfig(({ mode }) => {
  const esp = mode === 'esp';
  return {
    base: './',
    plugins: [react(), esp ? viteSingleFile() : basicSsl()],
    build: esp ? { outDir: 'dist-esp' } : {},
  };
});

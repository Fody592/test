// Native Android/iOS Bluetooth (used inside the APK). Same interface as the Web Bluetooth class in ble.js.
import { BleClient } from '@capacitor-community/bluetooth-le';

const NUS_SERVICE = '6e400001-b5a3-f393-e0a9-e50e24dcca9e';
const NUS_RX = '6e400002-b5a3-f393-e0a9-e50e24dcca9e'; // app -> ESP32 (write)
const NUS_TX = '6e400003-b5a3-f393-e0a9-e50e24dcca9e'; // ESP32 -> app (notify)
const CHUNK = 20; // safe for the default 23-byte MTU; ESP32 reassembles until '\n'

class NativeBleError extends Error {}

class NativeBle {
  deviceId = null;
  isConnected = false;
  buffer = '';
  initialized = false;

  get supported() { return true; }
  get connected() { return this.isConnected; }

  async connect({ onDisconnect, onMessage }) {
    try {
      if (!this.initialized) {
        await BleClient.initialize({ androidNeverForLocation: true });
        this.initialized = true;
      }
      const device = await BleClient.requestDevice({ services: [NUS_SERVICE] });
      await BleClient.connect(device.deviceId, () => {
        this.isConnected = false;
        onDisconnect?.();
      });
      this.deviceId = device.deviceId;
      this.isConnected = true;
      await BleClient.startNotifications(device.deviceId, NUS_SERVICE, NUS_TX, (value) => {
        this.buffer += new TextDecoder().decode(value);
        let i;
        while ((i = this.buffer.indexOf('\n')) >= 0) {
          const line = this.buffer.slice(0, i).trim();
          this.buffer = this.buffer.slice(i + 1);
          if (!line) continue;
          try { onMessage?.(JSON.parse(line)); } catch { /* ignore garbage */ }
        }
      });
      return device.name || 'Dispenser';
    } catch (err) {
      this.isConnected = false;
      const msg = String(err?.message || err || '');
      if (/cancel|no device|not found/i.test(msg)) throw new NativeBleError('No device selected.');
      if (/permission|denied/i.test(msg)) throw new NativeBleError('Bluetooth permission denied. Allow "Nearby devices" in Android settings.');
      throw new NativeBleError(msg || 'Could not connect to the dispenser.');
    }
  }

  async send(obj) {
    if (!this.isConnected) throw new NativeBleError('Dispenser is not connected.');
    const bytes = new TextEncoder().encode(JSON.stringify(obj) + '\n');
    try {
      for (let i = 0; i < bytes.length; i += CHUNK) {
        const part = bytes.slice(i, i + CHUNK);
        await BleClient.write(this.deviceId, NUS_SERVICE, NUS_RX, new DataView(part.buffer));
      }
    } catch (err) {
      this.isConnected = false;
      throw new NativeBleError('Lost connection while sending: ' + (err?.message || 'unknown'));
    }
  }

  async disconnect() {
    try { if (this.deviceId) await BleClient.disconnect(this.deviceId); } catch { /* already gone */ }
    this.isConnected = false;
  }
}

export const nativeBle = new NativeBle();

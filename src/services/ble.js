import { Capacitor } from '@capacitor/core';
import { nativeBle } from './ble-native.js';

// Web Bluetooth wrapper using the Nordic UART Service (NUS) UUIDs.
// ESP32 side: expose the same service, read lines ending in '\n', notify replies.
const NUS_SERVICE = '6e400001-b5a3-f393-e0a9-e50e24dcca9e';
const NUS_RX = '6e400002-b5a3-f393-e0a9-e50e24dcca9e'; // app -> ESP32 (write)
const NUS_TX = '6e400003-b5a3-f393-e0a9-e50e24dcca9e'; // ESP32 -> app (notify)
const CHUNK = 180; // safe BLE write size; ESP32 reassembles until '\n'

export class BleError extends Error {}

class BleController {
  device = null;
  rx = null;
  buffer = '';

  get supported() {
    return typeof navigator !== 'undefined' && !!navigator.bluetooth;
  }

  get connected() {
    return !!this.device?.gatt?.connected && !!this.rx;
  }

  /** Opens the browser device picker and connects. */
  async connect({ onDisconnect, onMessage }) {
    if (!this.supported) {
      throw new BleError(
        'Web Bluetooth is not available. Use Chrome on Android/desktop (iOS: Bluefy browser).'
      );
    }
    try {
      this.device = await navigator.bluetooth.requestDevice({
        filters: [{ services: [NUS_SERVICE] }, { namePrefix: 'DRINK' }],
        optionalServices: [NUS_SERVICE],
      });
      this.device.addEventListener('gattserverdisconnected', () => {
        this.rx = null;
        onDisconnect?.();
      });
      const server = await this.device.gatt.connect();
      const service = await server.getPrimaryService(NUS_SERVICE);
      this.rx = await service.getCharacteristic(NUS_RX);
      const tx = await service.getCharacteristic(NUS_TX);
      await tx.startNotifications();
      tx.addEventListener('characteristicvaluechanged', (e) => {
        this.buffer += new TextDecoder().decode(e.target.value);
        let i;
        while ((i = this.buffer.indexOf('\n')) >= 0) {
          const line = this.buffer.slice(0, i).trim();
          this.buffer = this.buffer.slice(i + 1);
          if (!line) continue;
          try { onMessage?.(JSON.parse(line)); } catch { /* ignore garbage */ }
        }
      });
      return this.device.name || 'Dispenser';
    } catch (err) {
      if (err?.name === 'NotFoundError') throw new BleError('No device selected.');
      throw new BleError(err?.message || 'Could not connect to the dispenser.');
    }
  }

  /** Sends a JSON object as newline-terminated chunks. */
  async send(obj) {
    if (!this.connected) throw new BleError('Dispenser is not connected.');
    const bytes = new TextEncoder().encode(JSON.stringify(obj) + '\n');
    try {
      for (let i = 0; i < bytes.length; i += CHUNK) {
        await this.rx.writeValueWithResponse(bytes.slice(i, i + CHUNK));
      }
    } catch (err) {
      throw new BleError('Lost connection while sending: ' + (err?.message || 'unknown'));
    }
  }

  disconnect() {
    if (this.device?.gatt?.connected) this.device.gatt.disconnect();
    this.rx = null;
  }
}

// Inside the APK use native Bluetooth; in a browser use Web Bluetooth.
export const ble = Capacitor.isNativePlatform() ? nativeBle : new BleController();

// Wi-Fi transport: WebSocket to the ESP32-S3 (port 81). Same interface as ble.js.
export class WifiError extends Error {}

class WifiController {
  ws = null;
  buffer = '';

  get supported() { return typeof WebSocket !== 'undefined'; }
  get connected() { return this.ws?.readyState === WebSocket.OPEN; }

  /** host: IP/hostname of the ESP32. Empty = the host serving this page (when hosted on the ESP). */
  connect({ host, onDisconnect, onMessage }) {
    const h = (host || '').trim() || location.hostname;
    if (!h) return Promise.reject(new WifiError('Enter the dispenser address in Maintain → Settings.'));
    return new Promise((resolve, reject) => {
      let opened = false;
      let ws;
      try {
        ws = new WebSocket(`ws://${h}:81`);
      } catch {
        return reject(new WifiError('Could not open a connection. If this page is https, host it from the ESP32 instead.'));
      }
      const timer = setTimeout(() => { ws.close(); reject(new WifiError(`No response from ${h}. Same Wi-Fi network?`)); }, 5000);
      ws.onopen = () => { opened = true; clearTimeout(timer); this.ws = ws; resolve(`Wi-Fi ${h}`); };
      ws.onerror = () => { if (!opened) { clearTimeout(timer); reject(new WifiError(`Could not reach ${h}.`)); } };
      ws.onclose = () => { if (opened) { this.ws = null; onDisconnect?.(); } };
      ws.onmessage = (e) => {
        try { onMessage?.(JSON.parse(String(e.data).trim())); } catch { /* ignore garbage */ }
      };
    });
  }

  async send(obj) {
    if (!this.connected) throw new WifiError('Dispenser is not connected.');
    try { this.ws.send(JSON.stringify(obj)); }
    catch (err) { throw new WifiError('Lost connection while sending: ' + (err?.message || 'unknown')); }
  }

  disconnect() { this.ws?.close(); this.ws = null; }
}

export const wifi = new WifiController();

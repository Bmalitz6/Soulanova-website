'use strict';
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const Scanner = require('../app/soulfuel/foodscore-scanner.js');

function fakeBrowser({ secure = true, formats = ['ean_8', 'ean_13', 'upc_a', 'upc_e'], permission = 'granted' } = {}) {
  let frameCallback, stopped = 0, getUserMediaCalls = 0, barcode = null;
  class BarcodeDetector {
    constructor(options) { this.formats = options.formats; }
    static async getSupportedFormats() { return formats; }
    async detect() { return barcode ? [{ rawValue: barcode }] : []; }
  }
  const browser = {
    isSecureContext: secure,
    BarcodeDetector,
    navigator: { mediaDevices: { async getUserMedia(constraints) { getUserMediaCalls++; assert.deepEqual(constraints, { video: { facingMode: { ideal: 'environment' } }, audio: false }); if (permission === 'denied') throw new Error('permission denied'); return { getTracks: () => [{ stop() { stopped++; } }] }; } } },
    requestAnimationFrame(callback) { frameCallback = callback; return 17; },
    cancelAnimationFrame(id) { assert.equal(id, 17); },
  };
  const video = { srcObject: null, async play() {}, pause() {} };
  return { browser, video, setBarcode(value) { barcode = value; }, scanFrame() { return frameCallback(); }, stats() { return { stopped, getUserMediaCalls }; } };
}

test('camera scanner requires a secure supported browser and never prompts before explicit start', async () => {
  const unavailable = fakeBrowser({ secure: false });
  assert.equal(Scanner.capability(unavailable.browser), false);
  await assert.rejects(() => Scanner.start({ browser: unavailable.browser, video: unavailable.video, onBarcode() {} }), /not supported/);
  assert.equal(unavailable.stats().getUserMediaCalls, 0);
  const noFormat = fakeBrowser({ formats: ['qr_code'] });
  await assert.rejects(() => Scanner.start({ browser: noFormat.browser, video: noFormat.video, onBarcode() {} }), /common food barcodes/);
  assert.equal(noFormat.stats().getUserMediaCalls, 0);
});

test('supported camera scan sends only the decoded barcode and stops media tracks', async () => {
  const fixture = fakeBrowser(), values = [], statuses = [];
  const session = await Scanner.start({ browser: fixture.browser, video: fixture.video, onBarcode: value => values.push(value), onStatus: text => statuses.push(text) });
  assert.equal(typeof session.stop, 'function');
  assert.equal(fixture.stats().getUserMediaCalls, 1);
  fixture.setBarcode('0123456789012');
  await fixture.scanFrame();
  assert.deepEqual(values, ['0123456789012']);
  assert.equal(fixture.stats().stopped, 1);
  assert.equal(fixture.video.srcObject, null);
  assert.ok(statuses.some(text => /Camera is active/.test(text)));
});

test('permission denial surfaces manual fallback without capturing or sending a frame', async () => {
  const fixture = fakeBrowser({ permission: 'denied' });
  await assert.rejects(() => Scanner.start({ browser: fixture.browser, video: fixture.video, onBarcode() {} }), /permission denied/);
  assert.equal(fixture.stats().stopped, 0);
  const page = fs.readFileSync(path.resolve(__dirname, '../app/soulfuel/index.html'), 'utf8');
  const client = fs.readFileSync(path.resolve(__dirname, '../app/soulfuel/foodscore.js'), 'utf8');
  assert.match(page, /Camera frames stay on this device; only the barcode is sent/);
  assert.match(client, /cameraButton\.addEventListener\('click'/);
  assert.match(client, /method:'POST'/);
});

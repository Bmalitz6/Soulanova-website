'use strict';
(function (root) {
  const FORMATS = ['ean_8', 'ean_13', 'upc_a', 'upc_e'];

  function capability(browser = root) {
    return Boolean(browser?.isSecureContext && browser.navigator?.mediaDevices?.getUserMedia && browser.BarcodeDetector);
  }

  async function start({ browser = root, video, onBarcode, onStatus = () => {} }) {
    if (!capability(browser)) throw new Error('Camera scanning is not supported here. Enter the barcode manually.');
    const supported = await browser.BarcodeDetector.getSupportedFormats();
    const formats = FORMATS.filter(format => supported.includes(format));
    if (!formats.length) throw new Error('This browser cannot scan common food barcodes. Enter the barcode manually.');
    const detector = new browser.BarcodeDetector({ formats });
    const stream = await browser.navigator.mediaDevices.getUserMedia({ video: { facingMode: { ideal: 'environment' } }, audio: false });
    let stopped = false, frame = null, busy = false;
    const stop = () => {
      if (stopped) return;
      stopped = true;
      if (frame !== null) browser.cancelAnimationFrame(frame);
      for (const track of stream.getTracks()) track.stop();
      video.pause?.();
      video.srcObject = null;
    };
    video.srcObject = stream;
    video.playsInline = true;
    video.muted = true;
    try { await video.play(); } catch { stop(); throw new Error('Camera preview could not start. Enter the barcode manually.'); }
    onStatus('Camera is active. Hold the product barcode steady in the frame.');
    const scan = async () => {
      if (stopped || busy) return;
      busy = true;
      try {
        const matches = await detector.detect(video);
        const value = matches.find(item => typeof item.rawValue === 'string')?.rawValue;
        if (value) {
          stop();
          onStatus('Barcode found. Looking up product details…');
          onBarcode(value);
          return;
        }
      } catch {
        stop();
        onStatus('Camera scanning stopped. Enter the barcode manually.');
        return;
      } finally { busy = false; }
      if (!stopped) frame = browser.requestAnimationFrame(scan);
    };
    frame = browser.requestAnimationFrame(scan);
    return { stop };
  }

  const api = { FORMATS, capability, start };
  if (typeof module === 'object' && module.exports) module.exports = api;
  if (root) root.SoulanovaFoodScoreScanner = api;
})(typeof globalThis === 'undefined' ? this : globalThis);

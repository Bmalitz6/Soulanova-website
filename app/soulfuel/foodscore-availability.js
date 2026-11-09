'use strict';
// Release gate: keep FoodScore barcode lookup unavailable until a reviewed
// configuration change is approved. The client and API share this setting.
(function (root) {
  const config = Object.freeze({ enabled: false });
  if (typeof module === 'object' && module.exports) module.exports = config;
  if (root) root.SoulanovaFoodScoreAvailability = config;
})(typeof globalThis === 'undefined' ? this : globalThis);

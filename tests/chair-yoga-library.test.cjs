'use strict';

const { test } = require('node:test');
const assert = require('node:assert/strict');
const crypto = require('node:crypto');
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const catalog = require('../app/chair-yoga/catalog.json');
const route = fs.readFileSync(path.join(root, 'app/chair-yoga/index.html'), 'utf8');
const player = fs.readFileSync(path.join(root, 'app/chair-yoga/chair-yoga.js'), 'utf8');
const app = fs.readFileSync(path.join(root, 'app/app.js'), 'utf8');
const expectedIds = [
  4285,4286,4287,4288,4289,4290,4291,4292,4293,4294,4296,4297,
  4298,4299,4300,4303,4304,4305,4306,4307,4308,4309,4310,4311,
  4312,4313,4314,4315,4316,4317,4318,4319,4320,4323
].map(id => `IMG_${id}`);

test('Chair Yoga catalog preserves the owner list order and excludes the two held calf clips', () => {
  assert.equal(catalog.instructor, 'Miriam');
  assert.equal(catalog.libraryStatus, 'preview_candidates_pending_owner_review');
  assert.deepEqual(catalog.excludedOnHold, ['IMG_4321', 'IMG_4322']);
  assert.deepEqual(catalog.movements.map(item => item.id), expectedIds);
  assert.equal(catalog.movements.length, 34);
  assert.equal(catalog.movements.some(item => ['IMG_4321', 'IMG_4322'].includes(item.id)), false);
  assert.equal(catalog.movements[0].name, 'Seated Mountain Pose');
  assert.equal(catalog.movements.at(-1).name, 'Seated Meditation');
});

test('all 34 playable candidates and video-derived thumbnails match their manifest hashes', () => {
  for (const movement of catalog.movements) {
    assert.equal(movement.mediaStatus, 'candidate_pending_owner_review');
    assert.equal(movement.mappingStatus, 'visually_checked_against_owner_pose_list');
    const videoPath = path.join(root, movement.videoUrl.replace(/^\//, ''));
    const imagePath = path.join(root, movement.thumbnailUrl.replace(/^\//, ''));
    assert.equal(fs.existsSync(videoPath), true, movement.id);
    assert.equal(fs.existsSync(imagePath), true, `${movement.id} thumbnail`);
    assert.equal(crypto.createHash('sha256').update(fs.readFileSync(videoPath)).digest('hex'), movement.sha256, movement.id);
    assert.equal(movement.codec, 'h264');
  }
});

test('direct route requires a validated member and does not load video before authentication', () => {
  assert.match(route, /id="auth-gate"[^>]*hidden/);
  assert.match(route, /id="member-library" hidden/);
  assert.match(route, /href="\/app\/\?mode=signin"/);
  assert.match(route, /id="chair-yoga-video" controls playsinline preload="metadata"/);
  assert.doesNotMatch(route.match(/<video\b[^>]*>/)?.[0] || '', /\bsrc=/i);
  assert.match(player, /client\.auth\.getUser\(\)/);
  assert.match(player, /if \(!user\) return showSignedOut/);
  assert.match(player, /fetch\('\/app\/chair-yoga\/catalog\.json'/);
  assert.match(player, /event === 'SIGNED_OUT'/);
});

test('Yoga category opens the dedicated library and keeps direct member navigation', () => {
  assert.match(app, /title:'Chair Yoga with Miriam'/);
  assert.match(app, /label:'CHAIR YOGA', cta:'Explore Library'/);
  assert.match(app, /window\.location\.href='\/app\/chair-yoga\/'/);
  assert.match(route, /href="\/app\/"/);
});

test('player exposes play, pause, seek, previous and next controls', () => {
  assert.match(route, /controls playsinline/);
  assert.match(route, /id="previous-movement"/);
  assert.match(route, /id="next-movement"/);
  assert.match(route, /id="play-movement"/);
  assert.match(player, /video\.play\(\)/);
  assert.match(player, /video\.pause\(\)/);
  assert.match(player, /selectMovement\(currentIndex - 1\)/);
  assert.match(player, /selectMovement\(currentIndex \+ 1\)/);
});

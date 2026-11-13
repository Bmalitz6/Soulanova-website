# Chair Yoga Narration Production Review — Phase 7

Status: The 36-workout matrix was owner-approved on 2026-11-13 after progression, transition and chair-support safety review. The owner-approved 142-request Miriam narration batch is generated and awaiting the owner's listening approval. All new audio files are separate from the videos, hash-recorded and decode-validated. Member playback remains disabled.

Generated listening files: [Miriam voice sample and complete one-movement Beginner demo](narration-audio-review.html). The corrected demo follows the exact owner-approved seated segue. File hashes, Runway task IDs, durations, decode evidence, and 20 total credits used for the sample/demo plus the one corrected close are in the [Miriam review audio manifest](../../app/chair-yoga/narration/review-2026-11-12-miriam/review-manifest.json). The prior closing is retained as superseded history; the approved opening and movement loops were preserved byte-for-byte. No review audio is mapped to member playback. The earlier Paula sample has been superseded and was not selected.

The complete batch can be listened to at [Miriam narration batch review](narration-batch-review.html). This page is for owner review only and does not save approvals. The [production batch manifest](../../app/chair-yoga/narration/production-batch-manifest.json) records all task IDs, request text, file names, byte counts, durations and SHA-256 hashes.

## Source checks

- Movement catalog: 36 entries; every narration record matched catalog name, video URL, duration and SHA-256.
- Workout matrix: 36 workouts, 12 per level, 12 movements per workout; assignments owner-approved 2026-11-13 after review of level suitability and position transitions.
- Scripts are keyed to the stable movement IDs, not workout position.
- Left/right language is used only where the approved catalog name and movement mapping identify a side. Wrist Stretch IMG_4298 stays side-neutral.
- Source videos remain unchanged; every cue is a separate narration asset plan.
- Loop audio must be selected by movement ID + loop number and pass SHA-256/owner-approval gate. Silence follows each short cue track; no narration plays over five-second black transitions.

## Verified Miriam voice and approval provenance

The exact SoulStretch production manifest contains 22 owner-approved generated Miriam recordings. All 22 entries carry the same Runway voice ID `VhxAIIZM8IRmnl5fyeyk`, model `eleven_multilingual_v2`, and speed `0.75`. The source manifest records English, MP3 output, and “Calm, warm, professional British female narrator.” Owner approval of the voice/settings is recorded in its `voice_approval` and `audio_owner_approval` sections; the owner approved the 22 exact SoulStretch files on November 9, 2026. Source file reviewed: `/Users/bob/Desktop/Soulanova/07 Documentation/Production_Inventory/Release_2_Website_Review/docs/release2/SOULSTRETCH_NARRATION_PRODUCTION_MANIFEST.json`.

One existing Runway task was independently read back: `cbee1399-e9e3-4b21-9e96-ae4296cb87ad` resolves to voice ID `VhxAIIZM8IRmnl5fyeyk`, model `eleven_multilingual_v2`, speed `0.75`, and the exact matching script in the manifest. The Chair Yoga sample task (`c3d5bf40-f120-4409-b6e5-9fcb15ddea48`) resolves to the same voice ID, model, and speed. The Runway Generate Speech interface uses the preset name “Miriam”; no voice cloning or imitation was used.

The owner directed use of this approved voice for Chair Yoga on November 12 and approved the voice, speed, tone, opening, and both Mountain Pose loops on November 13. The corrected demo segue is owner-approved for review only. All review MP3s remain separate from member narration. The previous Paula audition is superseded and not selected.

## Miriam sample and demo audio QA

All six generated files, including the superseded closing retained for history, are mono 44.1 kHz MP3s and passed full FFmpeg decoding. The source Seated Mountain Pose video remains the existing 29-second approved file with SHA-256 `b13fc1b98649b2d43843d404d5e79637ea0e454f04784abd92577adc047d6769`.

| Review item | File | Duration | Size | SHA-256 |
|---|---|---:|---:|---|
| Voice sample | `voice-sample-miriam-review.mp3` | 16.440 s | 264,193 B | `521f607aa944a413bb585506c5648791bdab7a8862d2b018a9afb2f31290745b` |
| Beginner opening | `opening-beginner-miriam-review.mp3` | 15.557 s | 249,982 B | `8f6700b1078777dcb9f000fdeae17859a4a06c00a0f33e49e245ac7a9d8b4efd` |
| Seated Mountain Pose · Loop 1 | `IMG_4285-loop-1-miriam-review.mp3` | 17.740 s | 285,091 B | `b134d5b0ddb816b49835d0fbea6433294fac8aafa98629c0b9ad1363b1a72053` |
| Seated Mountain Pose · Loop 2 | `IMG_4285-loop-2-miriam-review.mp3` | 12.864 s | 206,932 B | `b8670bc10d22f1363c4436a918cf1c730321d3703d457d16a9469d35dfae48a5` |
| Superseded demo close | `closing-beginner-miriam-review.mp3` | 15.929 s | 255,834 B | `5e16abb6e6c5762dd2dc1a70020cbb1e7c926f94c9001fa47048a736722943d7` |
| Corrected demo segue | `closing-beginner-miriam-review-v2.mp3` | 16.440 s | 264,193 B | `bf5be402097c5bb7f7bb1657991f39fb9e01f0f84dbfbd53f3f0be18f708051a` |

The movement tracks finish within their respective video loops, leaving approximately 11.260 seconds and 16.136 seconds of quiet practice. Loop 1 and Loop 2 use different scripts and separate audio files. The exact corrected demo segue is “Wonderful work. Take one more gentle breath, relax your shoulders, and remain comfortably seated as we prepare for our next movement.” It lasts 16.440 seconds, decodes cleanly, and peaks at -12.6 dBFS. Its Runway task confirms the same voice ID, model, speed, and English setting. The corrected recording used 3 additional credits; 20 total credits have been used for this sample/demo sequence. No bulk generation occurred and no credits were purchased.

## Position-instruction audit — November 13, 2026

Reviewed all 144 loop cues across the 36 mapped movements, plus the three level openings and three planned final-workout closings. There were 63 loop cues with explicit sit/stand/chair/upright/step terms; these cues match their movement mappings. The seated Warrior I, Warrior II, and Side Angle demonstrations were visually checked against IMG_4310–IMG_4315; chair-supported standing Tree and Calf demonstrations were checked against IMG_4316–IMG_4317 and IMG_4321–IMG_4322. No loop cue mismatch was found. The proposed workout matrix currently begins each routine with seated IMG_4285, but the 36 combinations are still pending approval.

No movement-loop cue was found to conflict with its approved video or transition. The earlier three final-workout closings were replaced with position-neutral scripts below; they do not tell members to sit, stand, or change position. The new wording is owner-approved. The approved one-movement demo segue remains separate and is not reused as a class closing. The 36-workout matrix is now owner-approved; do not change its movement order without further approval.

## Level opening and closing scripts

### Beginner opening

> Welcome to your Beginner Chair Yoga session. Settle near a stable chair with both feet supported. Move gently within a range that feels comfortable today.

### Beginner closing · 29 words · estimated 17 seconds

> Your Beginner Chair Yoga practice is complete. Take one gentle breath and let your shoulders soften. There is no need to move right away; take the time you need.

### Intermediate opening

> Welcome to your Intermediate Chair Yoga session. Arrange your chair securely and follow each movement at your own pace. Keep your range comfortable and your breath steady.

### Intermediate closing · 28 words · estimated 16 seconds

> Your Intermediate Chair Yoga practice is complete. Let your breathing return to its natural rhythm. Notice how your body feels, and take your time before ending your practice.

### Advanced opening

> Welcome to your Advanced Chair Yoga session. Keep your chair close and use the support shown. Choose a steady, comfortable range and pause whenever you need.

### Advanced closing · 27 words · estimated 15 seconds

> Your Advanced Chair Yoga practice is complete. Let your breath settle at its natural pace. Pause for a moment, then finish your practice whenever you feel ready.

These full-workout closings are position-neutral and avoid instructing members to stand or change position. The owner approved the scripts; they have not been recorded. No MP3 exists for any of these three scripts.

## Recording-ready movement loop table

All timings are estimates at a calm pace around 105 words/minute, with punctuation pauses. Target audio remains shorter than the actual video loop; the estimated remaining time is quiet practice. Verify actual MP3 durations after recording. The four drafts are available for each movement because the same approved movement may appear in routines with different loop counts. Beginner uses loops 1–2, Intermediate 1–3, Advanced 1–4.

The drafts estimate 5–18 seconds of spoken content per loop against 29-second clips (30.2 seconds for IMG_4286), leaving at least 11 seconds for quiet practice. The four generated demo recordings were 9.10 and 12.12 seconds for IMG_4285, within its 29-second video. These recordings are only timing samples, not final approved production audio.

### 1. Seated Mountain Pose — IMG_4285

Video: IMG_4285.mp4 · 29.0 s · SHA-256 b13fc1b98649b2d43843d404d5e79637ea0e454f04784abd92577adc047d6769

**Loop 1** · cue at 00:00 · approx. 17s speech + 12s quiet

> Sit near the front of your chair with both feet grounded. Lengthen through your spine, soften your shoulders, and rest your hands on your thighs. Breathe gently.

**Loop 2** · cue at 00:00 · approx. 14s speech + 15s quiet

> Keep both feet steady as you breathe. Let your shoulders soften and your jaw relax; there is no need to hold yourself rigid.

**Loop 3** · cue at 00:00 · approx. 14s speech + 15s quiet

> Notice your sit bones supported by the chair. Grow tall through the crown of your head, then ease back to your natural posture.

**Loop 4** · cue at 00:00 · approx. 10s speech + 19s quiet

> Let one easy breath come and go. Keep your hands resting and your shoulders quiet.

### 2. Seated Side Bend Right — IMG_4286

Video: IMG_4286.mp4 · 30.2 s · SHA-256 9fc5f8d5ba9c6de5106ffbc75ae4525c0dfdc5d9180f5c14cdaf1398f579df0a

**Loop 1** · cue at 00:00 · approx. 15s speech + 15.2s quiet

> Keep both feet grounded. Lift your right arm as shown and lengthen your right side, keeping the shoulder soft. Breathe comfortably, then return upright.

**Loop 2** · cue at 00:00 · approx. 14s speech + 16.2s quiet

> Let your hips stay heavy as you reach to the right. Breathe into the side of your ribs without forcing the stretch.

**Loop 3** · cue at 00:00 · approx. 12s speech + 18.2s quiet

> Keep the right shoulder away from your ear. Make the side bend only as wide as the demonstration feels comfortable.

**Loop 4** · cue at 00:00 · approx. 8s speech + 22.2s quiet

> Notice the breath along your right side, then return toward center when ready.

### 3. Seated Side Bend Left — IMG_4287

Video: IMG_4287.mp4 · 29.0 s · SHA-256 7f32517dc3c29ee22419d3159f91f33d9b09ef0bc9af87ddc7743d7d738fda5d

**Loop 1** · cue at 00:00 · approx. 15s speech + 14s quiet

> Keep both feet grounded. Lift your left arm as shown and lengthen your left side, keeping the shoulder soft. Breathe comfortably, then return upright.

**Loop 2** · cue at 00:00 · approx. 14s speech + 15s quiet

> Let your hips stay heavy as you reach to the left. Breathe into the side of your ribs without forcing the stretch.

**Loop 3** · cue at 00:00 · approx. 12s speech + 17s quiet

> Keep the left shoulder away from your ear. Make the side bend only as wide as the demonstration feels comfortable.

**Loop 4** · cue at 00:00 · approx. 8s speech + 21s quiet

> Notice the breath along your left side, then return toward center when ready.

### 4. Seated Twist Right — IMG_4288

Video: IMG_4288.mp4 · 29.0 s · SHA-256 f5474f214094e41b40cdac0b8e33386f1cd3315e96a1e7274e02c0dd7d31c86d

**Loop 1** · cue at 00:00 · approx. 18s speech + 11s quiet

> Sit tall with your feet grounded. Turn your chest gently to the right, using the chair for light support. Keep your hips forward, breathe, then return to center.

**Loop 2** · cue at 00:00 · approx. 12s speech + 17s quiet

> Let your gaze follow the comfortable turn to the right. Keep your pelvis facing forward and your breath easy.

**Loop 3** · cue at 00:00 · approx. 11s speech + 18s quiet

> Lengthen through the spine before turning. Use only light chair support, then unwind slowly without pushing farther.

**Loop 4** · cue at 00:00 · approx. 9s speech + 20s quiet

> Stay with a small, comfortable turn. Soften back toward center on an easy breath.

### 5. Seated Twist Left — IMG_4289

Video: IMG_4289.mp4 · 29.0 s · SHA-256 be97402e68991537e15b675ee1c3f77a623a55aff6c75b2d3f2ef6e201eec9a5

**Loop 1** · cue at 00:00 · approx. 18s speech + 11s quiet

> Sit tall with your feet grounded. Turn your chest gently to the left, using the chair for light support. Keep your hips forward, breathe, then return to center.

**Loop 2** · cue at 00:00 · approx. 12s speech + 17s quiet

> Let your gaze follow the comfortable turn to the left. Keep your pelvis facing forward and your breath easy.

**Loop 3** · cue at 00:00 · approx. 11s speech + 18s quiet

> Lengthen through the spine before turning. Use only light chair support, then unwind slowly without pushing farther.

**Loop 4** · cue at 00:00 · approx. 9s speech + 20s quiet

> Stay with a small, comfortable turn. Soften back toward center on an easy breath.

### 6. Seated Cat-Cow — IMG_4290

Video: IMG_4290.mp4 · 29.0 s · SHA-256 9b386d3673d50bc9fac6c73d680635f7363c83e3a1fe26dc7898478174a21862

**Loop 1** · cue at 00:00 · approx. 15s speech + 14s quiet

> Rest your hands on your thighs. Inhale and lift your chest; exhale and round gently, moving within comfort. Return to a neutral seat.

**Loop 2** · cue at 00:00 · approx. 10s speech + 19s quiet

> Let the breath guide the shape: open gently as you inhale, round softly as you exhale.

**Loop 3** · cue at 00:00 · approx. 12s speech + 17s quiet

> Move like a slow wave through your spine. Keep your shoulders relaxed and use a range that feels easy.

**Loop 4** · cue at 00:00 · approx. 8s speech + 21s quiet

> One soft breath for each shape. Return to neutral when the movement ends.

### 7. Eagle Arms Stretch — IMG_4291

Video: IMG_4291.mp4 · 29.0 s · SHA-256 b9ddf081a039278a47c4ef3654a8f188a2b8db99567dd9fd75f91a8a368a0af3

**Loop 1** · cue at 00:00 · approx. 15s speech + 14s quiet

> Sit tall and cross your arms into the shape shown. Keep shoulders relaxed and elbows comfortable. Breathe into your upper back, then release gently.

**Loop 2** · cue at 00:00 · approx. 12s speech + 17s quiet

> Let the upper back widen behind you. Keep your hands and elbows relaxed rather than pulling into the shape.

**Loop 3** · cue at 00:00 · approx. 10s speech + 19s quiet

> Notice whether your shoulders are creeping upward; let them settle while your breath stays smooth.

**Loop 4** · cue at 00:00 · approx. 7s speech + 22s quiet

> Keep the arms easy. Uncross slowly whenever the demonstration releases.

### 8. Seated Forward Fold — IMG_4292

Video: IMG_4292.mp4 · 29.0 s · SHA-256 e995b411ae1d14bb94b55dd0489d2b61cff91d83375377b06676a066a2a8614d

**Loop 1** · cue at 00:00 · approx. 16s speech + 13s quiet

> Set your feet comfortably apart. Hinge forward from your hips, reaching only as shown. Keep your neck easy, breathe out, and return upright slowly.

**Loop 2** · cue at 00:00 · approx. 12s speech + 17s quiet

> Let the fold come from your hips. Rest your hands where they feel supported and keep your breath flowing.

**Loop 3** · cue at 00:00 · approx. 11s speech + 18s quiet

> Keep the back long and soften the knees if shown. There is no need to reach lower.

**Loop 4** · cue at 00:00 · approx. 7s speech + 22s quiet

> Pause in the comfortable range, then rise slowly with support.

### 9. Cactus Arms Chest Opener — IMG_4293

Video: IMG_4293.mp4 · 29.0 s · SHA-256 ed7723d2fc516eed8b187573b86c8c00f2406c67789ce6490e4944d736976427

**Loop 1** · cue at 00:00 · approx. 16s speech + 13s quiet

> Sit tall in the demonstrated cactus shape. Draw your elbows back gently without arching your lower back. Breathe into the chest, then soften your arms.

**Loop 2** · cue at 00:00 · approx. 11s speech + 18s quiet

> Keep your ribs relaxed as your chest opens. Let your shoulder blades move gently without squeezing hard.

**Loop 3** · cue at 00:00 · approx. 10s speech + 19s quiet

> Broaden across the collarbones only as comfortable. Keep the neck long and the breath unforced.

**Loop 4** · cue at 00:00 · approx. 6s speech + 23s quiet

> Soften the arms and let the chest return to rest.

### 10. Neck Stretch Right — IMG_4294

Video: IMG_4294.mp4 · 29.0 s · SHA-256 403258359472f5659d9b166272e8e1d7f9aff52aa7c81470d5045820a1d13bcf

**Loop 1** · cue at 00:00 · approx. 15s speech + 14s quiet

> Sit upright with relaxed shoulders. Tip your right ear toward your right shoulder as shown; keep the movement small. Breathe, then return to center.

**Loop 2** · cue at 00:00 · approx. 12s speech + 17s quiet

> Keep the right shoulder low and let the head tip gently. Do not press or pull on your head.

**Loop 3** · cue at 00:00 · approx. 9s speech + 20s quiet

> Choose a small, comfortable angle. Keep your face relaxed and breathe without holding.

**Loop 4** · cue at 00:00 · approx. 6s speech + 23s quiet

> Let the head return to center gently when ready.

### 11. Neck Stretch Left — IMG_4296

Video: IMG_4296.mp4 · 29.0 s · SHA-256 ca8db636db9bae2c017d66eebb33ddcb16af1dc1332924efcca88b7752d91b03

**Loop 1** · cue at 00:00 · approx. 15s speech + 14s quiet

> Sit upright with relaxed shoulders. Tip your left ear toward your left shoulder as shown; keep the movement small. Breathe, then return to center.

**Loop 2** · cue at 00:00 · approx. 12s speech + 17s quiet

> Keep the left shoulder low and let the head tip gently. Do not press or pull on your head.

**Loop 3** · cue at 00:00 · approx. 9s speech + 20s quiet

> Choose a small, comfortable angle. Keep your face relaxed and breathe without holding.

**Loop 4** · cue at 00:00 · approx. 6s speech + 23s quiet

> Let the head return to center gently when ready.

### 12. Shoulder Rolls — IMG_4297

Video: IMG_4297.mp4 · 29.0 s · SHA-256 a57e47d249b54ee1d997ac2a5c715de98a53d559ac504a60b6864282ab49afd3

**Loop 1** · cue at 00:00 · approx. 15s speech + 14s quiet

> Sit comfortably with your hands relaxed. Roll your shoulders slowly as shown, keeping circles smooth and easy. Breathe naturally, then let both shoulders settle.

**Loop 2** · cue at 00:00 · approx. 11s speech + 18s quiet

> Let the shoulders move at an easy pace. Keep the jaw soft and avoid lifting toward your ears.

**Loop 3** · cue at 00:00 · approx. 9s speech + 20s quiet

> Make each circle smooth and controlled. Keep your neck relaxed as the shoulders travel.

**Loop 4** · cue at 00:00 · approx. 6s speech + 23s quiet

> Finish the circle gently and let the shoulders rest.

### 13. Wrist Stretch — IMG_4298

Video: IMG_4298.mp4 · 29.0 s · SHA-256 87a0d87803b903c5e51ff056771deac5f9d5633ec49ad3fe30cbfb3de7347098

**Loop 1** · cue at 00:00 · approx. 17s speech + 12s quiet

> Extend your hands as demonstrated. Gently stretch the wrists without pulling hard on the fingers. Keep your shoulders relaxed, breathe evenly, and release to your lap.

**Loop 2** · cue at 00:00 · approx. 12s speech + 17s quiet

> Keep the wrist stretch light and follow the hand position shown. Let your elbows stay soft and your breath steady.

**Loop 3** · cue at 00:00 · approx. 9s speech + 20s quiet

> Notice any unnecessary tension in your fingers. Ease the stretch rather than pulling farther.

**Loop 4** · cue at 00:00 · approx. 6s speech + 23s quiet

> Soften both hands and let them rest when ready.

### 14. Seated Figure Four Right — IMG_4299

Video: IMG_4299.mp4 · 29.0 s · SHA-256 f5f13dfc4cdee7e99cc641997185ff873d783e66caae62ba208d880eddd276a3

**Loop 1** · cue at 00:00 · approx. 16s speech + 13s quiet

> Sit tall and place your right ankle over the opposite thigh as shown, only if comfortable. Keep your back long; release the leg with control.

**Loop 2** · cue at 00:00 · approx. 11s speech + 18s quiet

> Let the right hip stay easy. Keep your ankle supported and do not press the knee down.

**Loop 3** · cue at 00:00 · approx. 12s speech + 17s quiet

> If the position feels comfortable, hinge only slightly from the hips. Keep the spine long and breath steady.

**Loop 4** · cue at 00:00 · approx. 6s speech + 23s quiet

> Uncross the right leg carefully and place both feet down.

### 15. Seated Figure Four Left — IMG_4300

Video: IMG_4300.mp4 · 29.0 s · SHA-256 c19be04b305b1c0aff30cf8a97adecb24b1ca80b3aaacd3408769e332f6e0b98

**Loop 1** · cue at 00:00 · approx. 16s speech + 13s quiet

> Sit tall and place your left ankle over the opposite thigh as shown, only if comfortable. Keep your back long; release the leg with control.

**Loop 2** · cue at 00:00 · approx. 11s speech + 18s quiet

> Let the left hip stay easy. Keep your ankle supported and do not press the knee down.

**Loop 3** · cue at 00:00 · approx. 12s speech + 17s quiet

> If the position feels comfortable, hinge only slightly from the hips. Keep the spine long and breath steady.

**Loop 4** · cue at 00:00 · approx. 6s speech + 23s quiet

> Uncross the left leg carefully and place both feet down.

### 16. Knee-to-Chest Right — IMG_4303

Video: IMG_4303.mp4 · 29.0 s · SHA-256 acb8f65b5d29acf6acaa6eba93bd6ba43500b24c7a8717cabf010cecda00711c

**Loop 1** · cue at 00:00 · approx. 17s speech + 12s quiet

> Sit securely and bring your right knee up as shown, only to a comfortable height. Keep the other foot supported, breathe out, then lower with control.

**Loop 2** · cue at 00:00 · approx. 10s speech + 19s quiet

> Keep your chest upright as you hold the right knee. Let the supporting foot stay grounded.

**Loop 3** · cue at 00:00 · approx. 11s speech + 18s quiet

> Use your hands only as shown and keep your shoulders relaxed. Breathe steadily in the comfortable position.

**Loop 4** · cue at 00:00 · approx. 6s speech + 23s quiet

> Lower the right foot slowly and let both feet rest.

### 17. Knee-to-Chest Left — IMG_4304

Video: IMG_4304.mp4 · 29.0 s · SHA-256 f7ff43dc63213feac4e25b0b87f81e99ab7a41504a07b53f320ae73bc9d349bf

**Loop 1** · cue at 00:00 · approx. 17s speech + 12s quiet

> Sit securely and bring your left knee up as shown, only to a comfortable height. Keep the other foot supported, breathe out, then lower with control.

**Loop 2** · cue at 00:00 · approx. 10s speech + 19s quiet

> Keep your chest upright as you hold the left knee. Let the supporting foot stay grounded.

**Loop 3** · cue at 00:00 · approx. 11s speech + 18s quiet

> Use your hands only as shown and keep your shoulders relaxed. Breathe steadily in the comfortable position.

**Loop 4** · cue at 00:00 · approx. 6s speech + 23s quiet

> Lower the left foot slowly and let both feet rest.

### 18. Seated Hamstring Stretch Right — IMG_4305

Video: IMG_4305.mp4 · 29.0 s · SHA-256 48f5f8c210f42e7a8606530f5c2c0f82fb7cd394d309fed6ec4bc068eb5f4c6a

**Loop 1** · cue at 00:00 · approx. 16s speech + 13s quiet

> Sit near the chair edge and extend your right leg as shown, keeping the knee soft. Hinge slightly with a long back, then return upright.

**Loop 2** · cue at 00:00 · approx. 11s speech + 18s quiet

> Keep the right heel supported and toes comfortable. Let the stretch stay behind the leg without rounding forward.

**Loop 3** · cue at 00:00 · approx. 12s speech + 17s quiet

> Lengthen your spine and hinge only a little from the hips. Ease out if the position feels too strong.

**Loop 4** · cue at 00:00 · approx. 6s speech + 23s quiet

> Bend the right knee gently and sit tall again.

### 19. Seated Hamstring Stretch Left — IMG_4306

Video: IMG_4306.mp4 · 29.0 s · SHA-256 f4dfc96df3cacdcc1530e35a2c2695b7621f410eacd9f56e84836bd91ac63772

**Loop 1** · cue at 00:00 · approx. 16s speech + 13s quiet

> Sit near the chair edge and extend your left leg as shown, keeping the knee soft. Hinge slightly with a long back, then return upright.

**Loop 2** · cue at 00:00 · approx. 11s speech + 18s quiet

> Keep the left heel supported and toes comfortable. Let the stretch stay behind the leg without rounding forward.

**Loop 3** · cue at 00:00 · approx. 12s speech + 17s quiet

> Lengthen your spine and hinge only a little from the hips. Ease out if the position feels too strong.

**Loop 4** · cue at 00:00 · approx. 6s speech + 23s quiet

> Bend the left knee gently and sit tall again.

### 20. Ankle Rolls Right — IMG_4307

Video: IMG_4307.mp4 · 29.0 s · SHA-256 d92a7729a02a1d9db29c85703f9d05fbbc67699bf709f899bb25b10f546a897c

**Loop 1** · cue at 00:00 · approx. 16s speech + 13s quiet

> Stay seated with your foot supported. Circle your right ankle slowly through an easy range, keeping your thigh relaxed. Breathe naturally, then rest the foot.

**Loop 2** · cue at 00:00 · approx. 8s speech + 21s quiet

> Keep the right thigh quiet while the ankle makes small, smooth circles.

**Loop 3** · cue at 00:00 · approx. 8s speech + 21s quiet

> Change direction only as the demonstration does, keeping the movement comfortable and controlled.

**Loop 4** · cue at 00:00 · approx. 6s speech + 23s quiet

> Pause the ankle circles and let the foot rest.

### 21. Ankle Rolls Left — IMG_4308

Video: IMG_4308.mp4 · 29.0 s · SHA-256 8ce45b01559490f60cb994da1efc78950fef7e53a4650d28db6e947c324b227f

**Loop 1** · cue at 00:00 · approx. 16s speech + 13s quiet

> Stay seated with your foot supported. Circle your left ankle slowly through an easy range, keeping your thigh relaxed. Breathe naturally, then rest the foot.

**Loop 2** · cue at 00:00 · approx. 8s speech + 21s quiet

> Keep the left thigh quiet while the ankle makes small, smooth circles.

**Loop 3** · cue at 00:00 · approx. 8s speech + 21s quiet

> Change direction only as the demonstration does, keeping the movement comfortable and controlled.

**Loop 4** · cue at 00:00 · approx. 6s speech + 23s quiet

> Pause the ankle circles and let the foot rest.

### 22. Toe-Heel Lift — IMG_4309

Video: IMG_4309.mp4 · 29.0 s · SHA-256 1e3536aee9b8e5f5f04d4ebce8ee5e79cc99fac35af3a63005cc7759047af7d2

**Loop 1** · cue at 00:00 · approx. 16s speech + 13s quiet

> Sit upright with both feet grounded. Lift your toes, then your heels, following the demonstrated rhythm. Keep knees easy and hold the chair if needed.

**Loop 2** · cue at 00:00 · approx. 10s speech + 19s quiet

> Let the toes and heels alternate smoothly. Keep both knees comfortable and your torso steady.

**Loop 3** · cue at 00:00 · approx. 8s speech + 21s quiet

> Move with control rather than speed. Keep each lift within the range shown.

**Loop 4** · cue at 00:00 · approx. 6s speech + 23s quiet

> Finish the last lift and let both feet settle.

### 23. Chair Warrior I Right — IMG_4310

Video: IMG_4310.mp4 · 29.0 s · SHA-256 3f85418c3dec1be1efddd6e99a72503ca6471e4dd07fd2aaa49a56c268522915

**Loop 1** · cue at 00:00 · approx. 16s speech + 13s quiet

> Sit near the chair front and set your right leg as shown. Keep your foot steady; raise your arms only as comfortable. Breathe, then release.

**Loop 2** · cue at 00:00 · approx. 10s speech + 19s quiet

> Use the chair as demonstrated and keep the right foot supported. Let the arms stay relaxed.

**Loop 3** · cue at 00:00 · approx. 10s speech + 19s quiet

> Lengthen through your torso without forcing the pose. Keep your gaze steady and breath easy.

**Loop 4** · cue at 00:00 · approx. 6s speech + 23s quiet

> Lower your arms and release the right leg with care.

### 24. Chair Warrior I Left — IMG_4311

Video: IMG_4311.mp4 · 29.0 s · SHA-256 468cf30e68a8295d430c14629cea5318ed89bd0a0f4e56546ea7488b05691b97

**Loop 1** · cue at 00:00 · approx. 16s speech + 13s quiet

> Sit near the chair front and set your left leg as shown. Keep your foot steady; raise your arms only as comfortable. Breathe, then release.

**Loop 2** · cue at 00:00 · approx. 10s speech + 19s quiet

> Use the chair as demonstrated and keep the left foot supported. Let the arms stay relaxed.

**Loop 3** · cue at 00:00 · approx. 10s speech + 19s quiet

> Lengthen through your torso without forcing the pose. Keep your gaze steady and breath easy.

**Loop 4** · cue at 00:00 · approx. 6s speech + 23s quiet

> Lower your arms and release the left leg with care.

### 25. Chair Warrior II Right — IMG_4312

Video: IMG_4312.mp4 · 29.0 s · SHA-256 fd6e57ca7b09c76d45a98a5441429ba79042b596c49fbd406be94b1cba86aa3c

**Loop 1** · cue at 00:00 · approx. 16s speech + 13s quiet

> Sit near the chair front, position your right leg as shown, and open your arms comfortably. Keep shoulders soft and gaze steady. Breathe, then reset.

**Loop 2** · cue at 00:00 · approx. 10s speech + 19s quiet

> Keep your right leg supported as shown. Let the arms reach out without lifting the shoulders.

**Loop 3** · cue at 00:00 · approx. 10s speech + 19s quiet

> Feel steady through your seat and feet. Keep your chest easy and turn only as demonstrated.

**Loop 4** · cue at 00:00 · approx. 6s speech + 23s quiet

> Lower your arms and return the right leg to rest.

### 26. Chair Warrior II Left — IMG_4313

Video: IMG_4313.mp4 · 29.0 s · SHA-256 884a5f15f4dfd4101984e50035da642fe40388c928d381ba294037c1a0928ce5

**Loop 1** · cue at 00:00 · approx. 16s speech + 13s quiet

> Sit near the chair front, position your left leg as shown, and open your arms comfortably. Keep shoulders soft and gaze steady. Breathe, then reset.

**Loop 2** · cue at 00:00 · approx. 10s speech + 19s quiet

> Keep your left leg supported as shown. Let the arms reach out without lifting the shoulders.

**Loop 3** · cue at 00:00 · approx. 10s speech + 19s quiet

> Feel steady through your seat and feet. Keep your chest easy and turn only as demonstrated.

**Loop 4** · cue at 00:00 · approx. 6s speech + 23s quiet

> Lower your arms and return the left leg to rest.

### 27. Chair Side Angle Right — IMG_4314

Video: IMG_4314.mp4 · 29.0 s · SHA-256 7404e8a7f564bde6c53ddef97de44c68f46e9085ebb706ad30492becd1a51e12

**Loop 1** · cue at 00:00 · approx. 15s speech + 14s quiet

> Open into the right side angle shown, staying supported by the chair. Lengthen through your chest, keep the shoulder soft, and return upright slowly.

**Loop 2** · cue at 00:00 · approx. 12s speech + 17s quiet

> Keep the chair close for support. Reach only as far as shown and breathe comfortably along your right side.

**Loop 3** · cue at 00:00 · approx. 10s speech + 19s quiet

> Lengthen through the side body without compressing or forcing the position. Let your neck stay easy.

**Loop 4** · cue at 00:00 · approx. 5s speech + 24s quiet

> Use the chair to return upright with control.

### 28. Chair Side Angle Left — IMG_4315

Video: IMG_4315.mp4 · 29.0 s · SHA-256 190600abacd76175e57339a8a92aefbf0d27fd0f54e82f37a75486327ed32db6

**Loop 1** · cue at 00:00 · approx. 15s speech + 14s quiet

> Open into the left side angle shown, staying supported by the chair. Lengthen through your chest, keep the shoulder soft, and return upright slowly.

**Loop 2** · cue at 00:00 · approx. 12s speech + 17s quiet

> Keep the chair close for support. Reach only as far as shown and breathe comfortably along your left side.

**Loop 3** · cue at 00:00 · approx. 10s speech + 19s quiet

> Lengthen through the side body without compressing or forcing the position. Let your neck stay easy.

**Loop 4** · cue at 00:00 · approx. 5s speech + 24s quiet

> Use the chair to return upright with control.

### 29. Chair-Supported Tree Right — IMG_4316

Video: IMG_4316.mp4 · 29.0 s · SHA-256 1c3728603a1d840dd53f3468ba16481d81301aa418f24600e49178dcb63bbac9

**Loop 1** · cue at 00:00 · approx. 16s speech + 13s quiet

> Stand beside the chair with one hand supported. Place your right foot at the demonstrated level, never at the knee. Breathe steadily, then lower safely.

**Loop 2** · cue at 00:00 · approx. 12s speech + 17s quiet

> Keep one hand on the chair and your gaze on a steady point. Use only the foot position shown.

**Loop 3** · cue at 00:00 · approx. 11s speech + 18s quiet

> Stay near the chair, keep the standing knee soft, and choose the balance level that feels steady.

**Loop 4** · cue at 00:00 · approx. 7s speech + 22s quiet

> If balance shifts, lower the right foot and hold the chair.

### 30. Chair-Supported Tree Left — IMG_4317

Video: IMG_4317.mp4 · 29.0 s · SHA-256 e31509bd9c84c204ca66ec07e6bd14bfa47acdac6f96fce63cce3f4d95af67b3

**Loop 1** · cue at 00:00 · approx. 16s speech + 13s quiet

> Stand beside the chair with one hand supported. Place your left foot at the demonstrated level, never at the knee. Breathe steadily, then lower safely.

**Loop 2** · cue at 00:00 · approx. 12s speech + 17s quiet

> Keep one hand on the chair and your gaze on a steady point. Use only the foot position shown.

**Loop 3** · cue at 00:00 · approx. 11s speech + 18s quiet

> Stay near the chair, keep the standing knee soft, and choose the balance level that feels steady.

**Loop 4** · cue at 00:00 · approx. 7s speech + 22s quiet

> If balance shifts, lower the left foot and hold the chair.

### 31. Seated Wide-Leg Fold — IMG_4318

Video: IMG_4318.mp4 · 29.0 s · SHA-256 df4b0c31b4c8c78be6ebc2826cf9de3efc875756e61e9719066a1c7942daf5c7

**Loop 1** · cue at 00:00 · approx. 16s speech + 13s quiet

> Sit securely with feet wide. Hinge from the hips and reach only as comfortable. Keep your neck relaxed, breathe, then return upright with hands supported.

**Loop 2** · cue at 00:00 · approx. 12s speech + 17s quiet

> Let your hands rest on your thighs or chair as shown. Keep your back long and the fold easy.

**Loop 3** · cue at 00:00 · approx. 9s speech + 20s quiet

> Breathe into the back of your ribs while keeping the movement within the demonstrated range.

**Loop 4** · cue at 00:00 · approx. 5s speech + 24s quiet

> Press through your feet and return upright slowly.

### 32. Chair Sun Reach — IMG_4319

Video: IMG_4319.mp4 · 29.0 s · SHA-256 3950414e1c217e83c05cd84cdfe6ee01b9b94703032d0ae1fabf3965c097cae4

**Loop 1** · cue at 00:00 · approx. 15s speech + 14s quiet

> Sit tall with feet grounded. Sweep both arms upward as shown, keeping shoulders relaxed. Breathe in to reach and out to lower comfortably.

**Loop 2** · cue at 00:00 · approx. 11s speech + 18s quiet

> Let your arms rise only as high as feels comfortable. Keep your ribs easy and shoulders soft.

**Loop 3** · cue at 00:00 · approx. 10s speech + 19s quiet

> Coordinate the reach with a steady breath. Lower with control rather than dropping the arms.

**Loop 4** · cue at 00:00 · approx. 6s speech + 23s quiet

> Let your hands return to rest and breathe naturally.

### 33. Chair-Supported Half Lift — IMG_4320

Video: IMG_4320.mp4 · 29.0 s · SHA-256 6ec4223dd057c77d870eb575dade5dc1981f9a2d57d8f4a5b5ecb8d0cff1a7f0

**Loop 1** · cue at 00:00 · approx. 15s speech + 14s quiet

> Sit toward the chair front with feet grounded. Hinge slightly from the hips, hands on thighs, lengthen your chest forward, then return upright slowly.

**Loop 2** · cue at 00:00 · approx. 11s speech + 18s quiet

> Keep your hands supported on your thighs as shown. Reach your chest forward without rounding or forcing.

**Loop 3** · cue at 00:00 · approx. 9s speech + 20s quiet

> Lengthen from the crown of your head and keep the hinge small and controlled.

**Loop 4** · cue at 00:00 · approx. 6s speech + 23s quiet

> Bring your torso back upright and rest your hands.

### 34. Calf Stretch Right — IMG_4321

Video: IMG_4321.mp4 · 29.0 s · SHA-256 413c38823c0b94092f30d58a4ccf1d7602eeaf2859c9a9a983f544480c69d734

**Loop 1** · cue at 00:00 · approx. 17s speech + 12s quiet

> Stand beside the chair and hold it with both hands. Step into the right calf stretch shown, keeping the heel grounded. Breathe, then step in carefully.

**Loop 2** · cue at 00:00 · approx. 12s speech + 17s quiet

> Keep both hands supported and let the right heel stay heavy only as shown. Do not force the stretch.

**Loop 3** · cue at 00:00 · approx. 11s speech + 18s quiet

> Keep your body steady and use a comfortable step length. Let the calf soften with each breath.

**Loop 4** · cue at 00:00 · approx. 6s speech + 23s quiet

> Step in carefully and remain supported by the chair.

### 35. Calf Stretch Left — IMG_4322

Video: IMG_4322.mp4 · 29.0 s · SHA-256 a8d6f6191c370701acd4565710e72cb8fab8dab0ed6e5259fedee9d688d38106

**Loop 1** · cue at 00:00 · approx. 17s speech + 12s quiet

> Stand beside the chair and hold it with both hands. Step into the left calf stretch shown, keeping the heel grounded. Breathe, then step in carefully.

**Loop 2** · cue at 00:00 · approx. 12s speech + 17s quiet

> Keep both hands supported and let the left heel stay heavy only as shown. Do not force the stretch.

**Loop 3** · cue at 00:00 · approx. 11s speech + 18s quiet

> Keep your body steady and use a comfortable step length. Let the calf soften with each breath.

**Loop 4** · cue at 00:00 · approx. 6s speech + 23s quiet

> Step in carefully and remain supported by the chair.

### 36. Seated Meditation — IMG_4323

Video: IMG_4323.mp4 · 29.0 s · SHA-256 4e86fd9b79a385f9628db0934fd26631d66167de2ee2eb7301a8b6bca6a74246

**Loop 1** · cue at 00:00 · approx. 15s speech + 14s quiet

> Sit comfortably with feet supported and hands resting softly. Lengthen your spine without stiffness, let your breath settle, and gently return your gaze.

**Loop 2** · cue at 00:00 · approx. 11s speech + 18s quiet

> Keep your hands easy and let your breathing find its own rhythm. Soften your face and shoulders.

**Loop 3** · cue at 00:00 · approx. 10s speech + 19s quiet

> Notice one natural breath at a time. Sit tall without holding tension in your back.

**Loop 4** · cue at 00:00 · approx. 6s speech + 23s quiet

> Enjoy a quiet moment, then gently lift your gaze.

## Owner approvals and remaining review gate

1. The owner approved the Miriam voice/settings, Beginner opening, both Seated Mountain Pose loops, corrected seated demo closing, all three full-workout closing scripts, the 36-workout matrix, and the 354-credit generation ceiling.
2. The 142 generated files are now pending owner listening review. Explicitly approve or request redo for the recordings before any are enabled in the member player.
3. Keep narration disabled until approval metadata and SHA-256 gates are updated for the exact selected assets.

## Bulk production estimate

The exact request texts use Runway's 1-credit-per-50-character rule, rounded separately per request. The 142 requests were generated: 137 movement-loop recordings, two openings and three closings. The approved Beginner opening and two approved Mountain Pose loop tracks were reused and not regenerated. The approved sample, demo segue and demo assets were preserved. Runway balance was 3,542 before and 3,188 after; **354 credits were consumed**, with no purchase. One transient provider connection failure was not charged; that exact request was retried once and completed. See the production batch manifest for per-request accounting. No recording in this batch is owner-approved yet, and no member playback is enabled.

## Generation validation

- 142/142 distinct requested MP3s are present under `app/chair-yoga/narration/production/` with unique filenames and task IDs.
- Every file passed full `ffmpeg` decoding; recorded local SHA-256 and byte size match the manifest.
- All movement-loop narrations fit their respective video durations; the shortest quiet practice tail is preserved as recorded in the manifest. Opening and closing tracks have no associated clip duration.
- All 36 source video files still match the existing SHA-256 inventory.
- New audio remains review-only. `memberPlaybackEnabled` is false and the active playback approval/hash gate is unchanged.

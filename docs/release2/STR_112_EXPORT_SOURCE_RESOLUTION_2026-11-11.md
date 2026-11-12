# STR-112 — focused final-export and rights decision

> Current disposition: the owner attests personal creation of the performance-driving video and a wholly synthetic instructor with no real-person reference. The scoped STR-112 rights gate is satisfied and all ten runtime replacements are applied. Active exercise-demo coverage is now 12/12/12 (36/36); STR-053 stays excluded. See [final disposition and mapping report](STR_112_FINAL_RIGHTS_DISPOSITION_AND_MAPPINGS_2026-11-11.md). Earlier blocked/practice-only findings below are historical, not current status. No push or deployment.

**Decision: Runway export evidence substantially strengthened; performance-input permission remains unresolved. The ten mappings remain inactive. No evidence of infringement was identified.** A documentary gap is not a finding of infringement.

## Owner facts accepted and recorded

For STR-112 / IMG_4058 the owner confirms that the instructor character was entirely synthetic and no real person's photo, face or likeness was used as an instructor reference. The owner also confirms prior sign-off on the 36-workout experience and does not remember whether Runway or Magic Hour made the export.

These are **owner-provided factual provenance**, not independently verified input records. They are appended to the existing rights/provenance reports. No traditional real-person model release is requested for this fictional instructor. No movement, workout or video approval is reopened. The two approved bilateral prescription corrections remain intact.

## One focused export-chain check — new independent evidence

The exact original Act-Two export, named approved master and packaged candidate all match:

`ef0433a6e4f1b889b5bf183715c139d0bb96a797728f126651907fb65fbc9705`

The original export is `D/Act-Two%20-%20IMG_4058_Runway_Ready_Cropped_Focused%20Dumbbell%20Press%20in%20Soulanova%20Gym.mp4`, where **D** is `/Users/bob/Downloads`.

Beyond the filename, its MP4 contains a provenance manifest in UUID box `d8fec3d6-1b0e-483c-9297-5828877ec481` (offsets 32–14223). The embedded creation action identifies:

- **Software agent:** `Runway Performance Capture`, version `1.0.0-turbo`.
- **Digital-source classification:** `trainedAlgorithmicMedia`.
- **Signature metadata:** ES256, issuer `Runway AI, Inc.`, common name `Runway`.
- **Recorded signature time:** `2026-11-04T16:01:05+00:00`; this is not represented as an independently trusted generation timestamp.
- **Ingredient records:** zero. The manifest does not identify the supplied character image or performance video.

The available standard container fields include encoder `Lavf59.27.100`, 1280×720 H.264/AAC, 24 fps and approximately 19.167 seconds. They do not independently identify a provider. Local file birth/modified timestamps and existing hash/copy manifests were compared; copy timestamps are not treated as generation records.

### Validation performed, without changing the video

A temporary official `contentauth/c2patool` **v0.28.6** binary was downloaded to `/private/tmp`; the archive SHA-256 matched GitHub's published asset digest. Nothing was installed globally or added as an application dependency. The validator was run in read/validate mode only, without signing, repair or output-write options.

| Check | Observed result |
|---|---|
| Claim signature / validity | PASS (`claimSignature.insideValidity`; validator explanation: claim signature valid) |
| Action and BMFF assertion hashes | PASS (`assertion.hashedURI.match`) |
| BMFF media hash | PASS (`assertion.bmffHash.match`) |
| Timestamp message digest | PASS; reported TSA text names Runway |
| Signer trust | **FAIL** (`signingCredential.untrusted`) |
| Required certificate EKU | **FAIL** (`signingCredential.invalid`) |
| Timestamp trust / revocation | Timestamp trust not established; OCSP fetch skipped |
| Additional hash exclusions | Informational: additional BMFF exclusions present |
| Overall validator state | **Invalid** — not described as fully trusted/certified provenance |

Signature/media binding success and publisher trust are distinct. The full failure codes are retained, not hidden or bypassed. No trust exception was installed, and the original manifest/video was not replaced. See the [official validation status reference](https://opensource.contentauthenticity.org/docs/manifest/reading/manifest-validation/) for the distinction.

**Finding:** the content-bound Runway claim, recorded issuer and original exact-hash approval chain strongly support **Runway Performance Capture** as the output source, independently of filename. Fully trusted publisher/account identity is not established by this validator result. No affirmative Magic Hour final-export evidence was found. The trust/profile failures are not evidence of infringement and are not a request to regenerate or reapprove the asset.

A single read-only connected Runway recent-assets lookup returned 46 entries and no IMG_4058/STR-112 name match. That bounded view cannot prove historical absence or locate an asset by hash. No unrelated asset URLs, credentials or generation work were exported. No new broad Strength inventory was performed.

[Exact evidence, matching-file timestamps, validator codes and tool-download digest](STR_112_EXPORT_SOURCE_RESOLUTION_2026-11-11.json).

## Commercial-use determination

[Runway's official commercial-use guidance](https://help.runwayml.com/hc/en-us/articles/21668707517587-Can-I-use-the-content-I-made-in-Runway-for-commercial-purposes) permits commercial outputs under its agreement; [Terms of Use, section 4.4](https://runway.com/terms-ofuse) does not impose a general non-commercial output restriction. The page reviewed is dated October 23, 2026, preceding the manifest's recorded November 4 signature time; that chronology is supporting context, not proof of account acceptance or a historical entitlement receipt.

The owner's specific synthetic/no-real-person-reference attestation resolves the instructor-reference question for this audit. It is not a photographic likeness release and does not need to become one. The prior hypothetical Magic Hour paid-tier question is no longer the primary blocker given the Runway evidence; no Magic Hour stage is assumed.

**Current evidence does not yet support activating the ten substitutions for commercial release because the permission basis for the actual performance-driving input is unestablished.** The manifest has no ingredient records. A related raw `IMG_4058.MOV` and cropped intermediate exist, but filenames/durations do not establish that either was used or who owned/cleared the actual input. The creator's commercial-output permission does not supply rights to an uploaded recording. No separate input licence is assumed necessary if the owner created and owns the actual input; the missing fact is its provenance/permission basis.

### One remaining targeted question

**What performance-driving video was actually used for IMG_4058, and was it owner-created/owned or licensed for the intended commercial AI processing and website use?** An asset-specific factual owner statement or existing job/input/permission record is sufficient to identify the basis; do not send credentials, tokens or unrelated billing/personal records. If the related MOV was not used, identify the actual input instead.

No new instructor model release, movement approval, replacement video or rebuild is requested. If this input-rights fact is adequately established, apply the existing ten compatible STR-112 step substitutions locally, preserve STR-053's block, recalculate coverage and rerun the suite. This engineering decision is not a legal opinion or guarantee of copyright ownership/exclusivity.

## Actual coverage and preservation

| Difficulty | Original workouts | Complete active exercise-demo coverage |
|---|---:|---:|
| Beginner | 12 | 10 |
| Intermediate | 12 | 8 |
| Advanced | 12 | 8 |
| Total | **36** | **26** |

**Zero substitutions applied.** The prepared replacement plan would produce 36/36 exercise-demo coverage only after the input-rights basis is established and the ten mappings are actually applied/verified. STR-053 remains identity-blocked, without relabeling. The owner's 8-total and 10-total bilateral corrections remain. The existing 17 videos, workout structures/order, approval evidence and progress behavior remain unchanged.

No push, deployment, Production change, database write, credential/environment change, replacement-video creation or other-session modification occurred. SoulWalk, SoulFuel, SoulStretch, Tai Chi and all other application files are unchanged. FoodScore stays disabled.

## Fresh validation

**224/224** full sequential regression/security/unit/browser checks PASS; zero failures/skips. All **17/17** packaged videos pass native Chrome decode/play/pause/seek/resume checks; all **17/17** source and local-build output hashes match. **68/68** JavaScript syntax checks PASS. Local production-mode build PASS with deliberately empty local environment, without retrieving Production secrets or deploying. Application source is unchanged; actual exercise-demo coverage is still **26/36**. These successful checks do not supply the missing performance-input permission fact.

# SoulStrength standalone demonstration control cleanup

Base: `9623ea645fede7ecebb3f6444c2760be2b0c1204`, protected feature branch.

Audit identified two active render locations: exercise rows within every workout-detail view, and the 17-card Exercise Reference grid. Both standalone `View approved demonstration` button bindings are removed. The main workout library and level navigation retain their plan/detail controls; no demonstration links are substituted. The dormant generic catalog renderer is not loaded by the current SoulStrength page and is preserved as infrastructure.

Member wording now says guided workout playback is unavailable in this Preview. Reference cards show the actual muscle group rather than internal approval status. The per-exercise “Video pending final-master confirmation” notices and now-inapplicable AirPlay instructions are removed from the active UI. Approval statuses themselves remain unchanged in the preserved metadata.

Approved video files/URLs, five-final-master allowlist, twelve historical review restrictions, future playback handlers, source plan catalog, thumbnails, exercise names, sets/repetitions/rest, equipment and instructions remain unchanged. Guided Start remains disabled. No other program or data/auth behavior changes; the complete approved SoulStretch implementation, movement controls, 24 programs and Miriam assets match the starting commit byte-for-byte.

Regression checks cover no standalone demonstration buttons in reference and workout-detail views at 1280, 390 and 320 pixels, preserved thumbnails/detail mapping, disabled guided Start, member navigation and the full security/browser suite. No live barcode or standalone Strength video request is needed for this removal. Only the SSO-protected feature Preview may be deployed; only its branch-scoped approved commit pointer may change. Production and Redis credentials stay untouched.

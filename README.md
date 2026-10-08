# Study Pace

Private source snapshot for https://study-pace-a98b4.web.app/ (Firebase production snapshot deployed 2026-10-07), verified on 2026-10-08. Original deployment source commit: `0ccdd5f270e3d5b6d547673effc8ee4d3fc83f64`. The GitHub repository begins with a new snapshot commit and contains no prior private Git history.

## Run

Serve the `dist/` directory with a static HTTP server, for example:

```sh
python -m http.server 8080 --bind 127.0.0.1 --directory dist
```

Open http://127.0.0.1:8080/. The production files are plain HTML, CSS and JavaScript; no build is required.

## Checks

Run `node qa/calculation-tests.cjs`. `qa/check.cjs` is the original optional Playwright smoke test; it assumes Linux Chromium at `/usr/bin/chromium` and needs Playwright installed. The single-file `Study-Pace.html` is preserved as an earlier portable prototype; `dist/` is the authoritative current deployment.

## Hosting and source

The current production provider is Firebase Hosting, project/site `study-pace-a98b4`. `firebase.json` is preserved and `.firebaserc` records that public project ID. The older Sites manifest was excluded to prevent accidental deployment to the earlier prototype. Project IDs are public configuration, not credentials. No deployment was performed during this backup.

Runtime files in `dist/` are copied byte-for-byte from the deployment source commit. See `source-snapshot.json` for original file hashes. Development imports, dependency manifests and this documentation are normalized for a standalone checkout.

## Assets and exclusions

See `ASSET-NOTES.md`. Existing Git metadata, credentials, environment files, node_modules, caches, browser profiles, downloads, archives, deployment tokens, personal logs and QA screenshots/results are excluded. No essential production file was excluded. No open-source code license has been assigned. Keep this repository private; future publication requires a separate authorized decision.

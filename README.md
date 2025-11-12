# Simple Training Website (Static / GitHub Pages)

A minimal training site with:
- Login (client-side only) collecting student name and email
- Modules page with anti-skip YouTube player and "Play" overlay
- Auto-log module completion to Google Apps Script endpoint (Google Sheet)
- Unlock a test after all modules are complete; log score to the same endpoint

> ⚠️ This is intentionally simple: client-side auth only (not for sensitive data). For audits, pair with your Google Sheet logs.

## 1) Configure
Edit `assets/config.js`:
- `GAS_ENDPOINT`: your Apps Script web app URL (Deploy > New deployment > "Web app" > Anyone with the link)
- `MODULES`: add your modules with `id`, `title`, and `youtubeId`
- `CREDENTIALS`: add allowed username/password pairs (or set `"allowAnyUser": true` to accept any login)

## 2) Google Apps Script (Logging)
Your script should accept JSON POSTs like:

### Completion log
```json
{
  "type": "completion",
  "timestamp": "2025-11-12T15:00:00Z",
  "student": {"name":"Alice Example","email":"alice@example.com","username":"student"},
  "module": {"id":"mod1","title":"Module 1: Demo","youtubeId":"dQw4w9WgXcQ"}
}
```

### Score log
```json
{
  "type": "score",
  "timestamp": "2025-11-12T15:05:00Z",
  "student": {"name":"Alice Example","email":"alice@example.com","username":"student"},
  "test": {"id":"final","title":"Final Test"},
  "score": {"correct":4,"total":5,"percent":80,"passed":true}
}
```

In Apps Script, you can do:
```js
function doPost(e) {
  const body = JSON.parse(e.postData.contents);
  const ss = SpreadsheetApp.getActive();
  const log = (sheet, arr) => { const sh = ss.getSheetByName(sheet) || ss.insertSheet(sheet); sh.appendRow(arr) };
  const ts = new Date();
  if (body.type === 'completion') {
    log('Completions', [ts, body.student.name, body.student.email, body.student.username, body.module.id, body.module.title, body.module.youtubeId]);
  } else if (body.type === 'score') {
    log('Scores', [ts, body.student.name, body.student.email, body.student.username, body.test.id, body.test.title, body.score.correct, body.score.total, body.score.percent, body.score.passed]);
  }
  return ContentService.createTextOutput(JSON.stringify({ok:true})).setMimeType(ContentService.MimeType.JSON);
}
```

## 3) Run Locally
Just open `index.html` in a browser. For GitHub Pages, push all files and enable Pages.

## 4) Notes
- Anti-skip prevents seeking beyond the furthest watched time; controls hidden; keyboard disabled.
- Completion only posts once when video ends.
- Progress & completion stored in `localStorage` by `siteKey` to keep it separate across sites.

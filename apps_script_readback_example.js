// === Simple Training Logger with Read-Back (Google Apps Script) ===
// Sheets: "Completions" and "Scores"
// Deploy: Deploy > New deployment > Web app > Execute as: Me, Who has access: Anyone with the link

const COMPLETIONS_SHEET = 'Completions';
const SCORES_SHEET      = 'Scores';

function _openSheet(name, headers) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sh = ss.getSheetByName(name);
  if (!sh) sh = ss.insertSheet(name);
  if (headers && sh.getLastRow() === 0) {
    sh.appendRow(headers);
    sh.setFrozenRows(1);
  }
  return sh;
}

function _setup() {
  _openSheet(COMPLETIONS_SHEET, ['timestamp','studentName','studentEmail','username','moduleId','moduleTitle','youtubeId']);
  _openSheet(SCORES_SHEET,      ['timestamp','studentName','studentEmail','username','testId','testTitle','correct','total','percent','passed']);
}

function doPost(e) {
  try {
    const body = JSON.parse(e.postData.contents || '{}');
    const type = body.type;

    if (type === 'completion') {
      _setup();
      const sh = _openSheet(COMPLETIONS_SHEET);
      const row = [
        new Date(),
        body?.student?.name || '',
        body?.student?.email || '',
        body?.student?.username || '',
        body?.module?.id || '',
        body?.module?.title || '',
        body?.module?.youtubeId || ''
      ];
      sh.appendRow(row);
      return _json({ ok: true });
    }

    if (type === 'score') {
      _setup();
      const sh = _openSheet(SCORES_SHEET);
      const s = body?.score || {};
      const row = [
        new Date(),
        body?.student?.name || '',
        body?.student?.email || '',
        body?.student?.username || '',
        body?.test?.id || '',
        body?.test?.title || '',
        s.correct ?? '',
        s.total ?? '',
        s.percent ?? '',
        s.passed ?? ''
      ];
      sh.appendRow(row);
      return _json({ ok: true });
    }

    if (type === 'progress') {
      // Read-back: return a unique list of moduleIds completed by this student
      _setup();
      const key = _studentKey(body?.student);
      const sh = _openSheet(COMPLETIONS_SHEET);
      const values = sh.getDataRange().getValues(); // includes header
      const header = values[0] || [];
      const idx = {
        email: header.indexOf('studentEmail'),
        username: header.indexOf('username'),
        moduleId: header.indexOf('moduleId')
      };
      const done = {};
      for (let i = 1; i < values.length; i++) {
        const row = values[i];
        const rowKey = _studentKey({email: row[idx.email], username: row[idx.username]});
        if (rowKey === key) {
          const mid = row[idx.moduleId];
          if (mid) done[mid] = true;
        }
      }
      return _json({ ok: true, completedModuleIds: Object.keys(done) });
    }

    return _json({ ok: false, error: 'Unsupported type' }, 400);

  } catch (err) {
    return _json({ ok: false, error: String(err) }, 500);
  }
}

function doGet(e) {
  // Optional GET progress: /exec?type=progress&email=a@b.com&username=student
  try {
    const type = (e.parameter.type || '').toLowerCase();
    if (type !== 'progress') return _json({ ok:false, error:'Use type=progress' }, 400);
    _setup();
    const key = _studentKey({ email: e.parameter.email || '', username: e.parameter.username || '' });
    const sh = _openSheet(COMPLETIONS_SHEET);
    const values = sh.getDataRange().getValues();
    const header = values[0] || [];
    const idx = {
      email: header.indexOf('studentEmail'),
      username: header.indexOf('username'),
      moduleId: header.indexOf('moduleId')
    };
    const done = {};
    for (let i = 1; i < values.length; i++) {
      const row = values[i];
      const rowKey = _studentKey({email: row[idx.email], username: row[idx.username]});
      if (rowKey === key) {
        const mid = row[idx.moduleId];
        if (mid) done[mid] = true;
      }
    }
    return _json({ ok:true, completedModuleIds: Object.keys(done) });
  } catch (err) {
    return _json({ ok:false, error:String(err) }, 500);
  }
}

function _studentKey(stu) {
  const email = String(stu?.email || '').trim().toLowerCase();
  const user  = String(stu?.username || '').trim().toLowerCase();
  // Prefer email when present; fall back to username
  return email || user;
}

function _json(obj, status) {
  const out = ContentService.createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
  if (status) {
    // Apps Script doesn't support setting HTTP status with ContentService,
    // but the JSON will include ok/error for client handling.
  }
  return out;
}

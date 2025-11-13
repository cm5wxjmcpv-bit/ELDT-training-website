// === Logger with name-based read-back (v2) ===
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
  const body = JSON.parse(e.postData.contents || '{}');
  const type = body.type;
  if (type === 'completion') {
    _setup();
    const sh = _openSheet(COMPLETIONS_SHEET);
    sh.appendRow([new Date(), body?.student?.name || '', '', '', body?.module?.id || '', body?.module?.title || '', body?.module?.youtubeId || '']);
    return _json({ ok: true });
  }
  if (type === 'score') {
    _setup();
    const sh = _openSheet(SCORES_SHEET);
    const s = body?.score || {};
    sh.appendRow([new Date(), body?.student?.name || '', '', '', body?.test?.id || '', body?.test?.title || '', s.correct ?? '', s.total ?? '', s.percent ?? '', s.passed ?? '']);
    return _json({ ok: true });
  }
  if (type === 'progress') {
    _setup();
    const key = _studentKey(body?.student);
    const sh = _openSheet(COMPLETIONS_SHEET);
    const values = sh.getDataRange().getValues();
    const header = values[0] || [];
    const idx = {
      name: header.indexOf('studentName'),
      email: header.indexOf('studentEmail'),
      username: header.indexOf('username'),
      moduleId: header.indexOf('moduleId')
    };
    const done = {};
    for (let i = 1; i < values.length; i++) {
      const row = values[i];
      const rowKey = _studentKey({ name: row[idx.name], email: row[idx.email], username: row[idx.username] });
      if (rowKey === key) { const mid = row[idx.moduleId]; if (mid) done[mid] = true; }
    }
    return _json({ ok:true, completedModuleIds: Object.keys(done) });
  }
  return _json({ ok:false, error:'Unsupported type' });
}

function doGet(e) {
  if ((e.parameter.type || '') !== 'progress') return _json({ ok:false, error:'Use type=progress' });
  _setup();
  const key = _studentKey({ name: e.parameter.name || '', email: e.parameter.email || '', username: e.parameter.username || '' });
  const sh = _openSheet(COMPLETIONS_SHEET);
  const values = sh.getDataRange().getValues();
  const header = values[0] || [];
  const idx = {
    name: header.indexOf('studentName'),
    email: header.indexOf('studentEmail'),
    username: header.indexOf('username'),
    moduleId: header.indexOf('moduleId')
  };
  const done = {};
  for (let i = 1; i < values.length; i++) {
    const row = values[i];
    const rowKey = _studentKey({ name: row[idx.name], email: row[idx.email], username: row[idx.username] });
    if (rowKey === key) { const mid = row[idx.moduleId]; if (mid) done[mid] = true; }
  }
  return _json({ ok:true, completedModuleIds: Object.keys(done) });
}

function _studentKey(stu) {
  const email = String(stu?.email || '').trim().toLowerCase();
  const user  = String(stu?.username || '').trim().toLowerCase();
  const name  = String(stu?.name || '').trim().toLowerCase();
  return email || user || name;
}

function _json(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}

// test.js - very simple quiz, unlock is handled on modules page; this logs score
(function(){
  const auth = (window.Auth && window.Auth.get && window.Auth.get()) || null;
  if (!auth) { window.location.href = "index.html"; return; }
  document.getElementById('studentInfo').textContent = auth.name + " • " + auth.email + " • @" + auth.username;

  const answers = { q1:"a", q2:"a", q3:"a", q4:"a", q5:"a" };

  function computeScore(fd){
    const keys = Object.keys(answers);
    let correct = 0;
    keys.forEach(k => { if (fd.get(k) === answers[k]) correct++; });
    const total = keys.length;
    const percent = Math.round((correct/total)*100);
    const passed = percent >= (CONFIG.TEST.passPercent || 70);
    return { correct, total, percent, passed };
  }

  document.getElementById('quiz').addEventListener('submit', (e) => {
    e.preventDefault();
    const fd = new FormData(e.target);
    const score = computeScore(fd);
    const div = document.getElementById('result');
    div.classList.remove('hidden');
    div.innerHTML = `<h3>Result</h3>
      <p>Score: ${score.correct}/${score.total} (${score.percent}%). ${score.passed ? "✅ Passed" : "❌ Not passed"}.</p>`;
    logScore(score).catch(console.error);
  });

  function logScore(score){
    if (!CONFIG.GAS_ENDPOINT || CONFIG.GAS_ENDPOINT.includes("REPLACE_WITH_YOUR_DEPLOYMENT")) {
      console.warn("GAS endpoint not set. Skipping remote score log.");
      return Promise.resolve();
    }
    const payload = {
      type: "score",
      timestamp: new Date().toISOString(),
      student: { name: auth.name, email: auth.email, username: auth.username },
      test: { id: CONFIG.TEST.id, title: CONFIG.TEST.title },
      score
    };
    return fetch(CONFIG.GAS_ENDPOINT, {
      method: "POST",
      headers: { "Content-Type":"application/json" },
      body: JSON.stringify(payload)
    }).then(r => r.json()).then(j => { if (!j.ok) throw new Error("GAS error"); });
  }
})();
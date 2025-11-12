// modules.js - render modules, anti-skip player, completion logging, and READ-BACK from Google Sheet
(function(){
  const auth = (window.Auth && window.Auth.get && window.Auth.get()) || null;
  if (!auth) { window.location.href = "index.html"; return; }

  const stateRoot = CONFIG.siteKey + ":progress";
  const getProgress = () => JSON.parse(localStorage.getItem(stateRoot) || "{}");
  const saveProgress = (obj) => localStorage.setItem(stateRoot, JSON.stringify(obj));
  const progress = getProgress();
  progress.completed = progress.completed || {}; // map of moduleId -> true
  progress.furthest = progress.furthest || {};  // map of moduleId -> seconds
  saveProgress(progress);

  document.getElementById('studentInfo').textContent = auth.name + " • " + auth.email + " • @" + auth.username;
  document.getElementById('logoutBtn').addEventListener('click', () => { localStorage.removeItem(CONFIG.siteKey + ":auth"); window.location.href = "index.html"; });

  const list = document.getElementById('moduleList');
  let current = CONFIG.MODULES[0];

  function renderList(){
    list.innerHTML = "";
    CONFIG.MODULES.forEach(m => {
      const wrap = document.createElement('div');
      wrap.className = "module-item";
      const left = document.createElement('div');
      left.innerHTML = `<div class="title">${m.title}</div><div class="footer">ID: ${m.id}</div>`;
      const right = document.createElement('div');
      const done = !!progress.completed[m.id];
      right.innerHTML = done ? `<span class="badge">✅ Complete</span>` : `<span class="badge">⏳ Incomplete</span>`;
      wrap.appendChild(left); wrap.appendChild(right);
      wrap.addEventListener('click', () => loadModule(m));
      list.appendChild(wrap);
    });
    updateTestUnlock();
  }

  function updateTestUnlock(){
    const all = CONFIG.MODULES.every(m => progress.completed[m.id]);
    document.getElementById('testUnlock').classList.toggle('hidden', !all);
  }

  // ==== READ-BACK on load ====
  (function syncFromServer(){
    if (!CONFIG.GAS_ENDPOINT || CONFIG.GAS_ENDPOINT.includes("REPLACE_WITH_YOUR_DEPLOYMENT")) {
      renderList(); // no endpoint configured; just render local
      return;
    }
    fetch(CONFIG.GAS_ENDPOINT, {
      method: "POST",
      headers: { "Content-Type":"application/json" },
      body: JSON.stringify({
        type: "progress",
        student: { name: auth.name, email: auth.email, username: auth.username }
      })
    })
    .then(r => r.json())
    .then(j => {
      if (j && j.ok && Array.isArray(j.completedModuleIds)) {
        j.completedModuleIds.forEach(id => { progress.completed[id] = true; });
        saveProgress(progress);
      }
    })
    .catch(err => console.warn("Progress read error:", err))
    .finally(() => renderList());
  })();

  // Player
  let player, allowedTime = 0, currentId = null;
  const playerTitle = document.getElementById('playerTitle');
  const overlayPlay = document.getElementById('overlayPlay');
  const playBtn = document.getElementById('playBtn');

  window.onYouTubeIframeAPIReady = function(){
    player = new YT.Player('player', {
      videoId: current.youtubeId,
      playerVars: {
        controls: 0, disablekb: 1, modestbranding: 1, rel: 0, fs: 0, iv_load_policy: 3
      },
      events: {
        onReady: onReady,
        onStateChange: onStateChange,
        onPlaybackRateChange: onPlaybackRateChange,
        onError: (e)=>console.warn("YT error", e)
      }
    });
  }

  function loadModule(m){
    current = m; currentId = m.id; allowedTime = progress.furthest[m.id] || 0;
    playerTitle.textContent = "Player • " + m.title;
    if (player && player.loadVideoById) {
      player.loadVideoById(m.youtubeId);
      player.stopVideo();
      overlayPlay.classList.remove('hidden');
    }
  }

  function onReady(){
    playBtn.addEventListener('click', () => {
      overlayPlay.classList.add('hidden');
      player.playVideo();
    });
    loadModule(current);
  }

  function onStateChange(e){
    const s = e.data;
    if (s === YT.PlayerState.PLAYING) {
      monitor();
    } else if (s === YT.PlayerState.ENDED) {
      if (!progress.completed[current.id]) {
        progress.completed[current.id] = true;
        saveProgress(progress);
        renderList();
        logCompletion(current).catch(console.error);
      }
      overlayPlay.classList.remove('hidden');
    }
  }

  function onPlaybackRateChange(){
    if (player && player.getPlaybackRate && player.setPlaybackRate) {
      if (player.getPlaybackRate() !== 1) player.setPlaybackRate(1);
    }
  }

  function monitor(){
    function tick(){
      if (!player || player.getPlayerState() !== YT.PlayerState.PLAYING) return;
      const t = player.getCurrentTime();
      if (t > allowedTime + 0.75) {
        player.seekTo(allowedTime, true);
      } else {
        if (t > allowedTime) { allowedTime = t; progress.furthest[current.id] = allowedTime; saveProgress(progress); }
      }
      requestAnimationFrame(tick);
    }
    requestAnimationFrame(tick);
  }

  function logCompletion(module){
    if (!CONFIG.GAS_ENDPOINT || CONFIG.GAS_ENDPOINT.includes("REPLACE_WITH_YOUR_DEPLOYMENT")) {
      console.warn("GAS endpoint not set. Skipping remote log.");
      return Promise.resolve();
    }
    const payload = {
      type: "completion",
      timestamp: new Date().toISOString(),
      student: { name: auth.name, email: auth.email, username: auth.username },
      module: { id: module.id, title: module.title, youtubeId: module.youtubeId }
    };
    return fetch(CONFIG.GAS_ENDPOINT, {
      method: "POST",
      headers: { "Content-Type":"application/json" },
      body: JSON.stringify(payload)
    }).then(r => r.json()).then(j => { if (!j.ok) throw new Error("GAS error"); });
  }

  // Blocker div already prevents interacting with iframe directly
  document.getElementById('blocker').addEventListener('click', () => {});
})();
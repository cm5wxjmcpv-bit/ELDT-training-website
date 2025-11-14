// modules.js (server-only progress) – no localStorage
(function () {
  const auth = (window.Auth && window.Auth.get && window.Auth.get()) || null;
  if (!auth) {
    window.location.href = "index.html";
    return;
  }

  // Show who is logged in
  document.getElementById("studentInfo").textContent = auth.name;
  document.getElementById("logoutBtn").addEventListener("click", () => {
    if (window.Auth && window.Auth.clear) window.Auth.clear();
    window.location.href = "index.html";
  });

  // Progress kept only in memory; source of truth is Google Sheet
  let completed = {}; // moduleId -> true (from Sheet + this session)
  let furthest = {};  // moduleId -> seconds (for anti-skip this session only)

  const list = document.getElementById("moduleList");
  const testUnlockEl = document.getElementById("testUnlock");
  const playerTitle = document.getElementById("playerTitle");
  const overlayPlay = document.getElementById("overlayPlay");
  const playBtn = document.getElementById("playBtn");
  const blocker = document.getElementById("blocker");

  let current = CONFIG.MODULES[0];
  let player = null;
  let allowedTime = 0;

  // ---------- UI RENDERING ----------

  function renderList() {
    list.innerHTML = "";
    CONFIG.MODULES.forEach((m) => {
      const wrap = document.createElement("div");
      wrap.className = "module-item";

      const left = document.createElement("div");
      left.innerHTML =
        `<div class="title">${m.title}</div>` +
        `<div class="footer">ID: ${m.id}</div>`;

      const right = document.createElement("div");
      const done = !!completed[m.id];
      right.innerHTML = done
        ? `<span class="badge">✅ Complete</span>`
        : `<span class="badge">⏳ Incomplete</span>`;

      wrap.appendChild(left);
      wrap.appendChild(right);

      wrap.addEventListener("click", () => loadModule(m));

      list.appendChild(wrap);
    });

    updateTestUnlock();
  }

  function updateTestUnlock() {
    const allDone = CONFIG.MODULES.every((m) => completed[m.id]);
    testUnlockEl.classList.toggle("hidden", !allDone);
    if (allDone) {
      testUnlockEl.querySelector(
        "div strong"
      ).textContent = "All modules complete.";
    }
  }

  // ---------- LOAD PROGRESS FROM SHEET ----------

  (function loadProgressFromServer() {
    if (
      !CONFIG.GAS_ENDPOINT ||
      CONFIG.GAS_ENDPOINT.includes("REPLACE_WITH_YOUR_DEPLOYMENT")
    ) {
      console.warn("GAS_ENDPOINT not configured; progress will be in-memory only.");
      renderList();
      return;
    }

    fetch(CONFIG.GAS_ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        type: "progress",
        student: { name: auth.name } // we’re matching by studentName column
      })
    })
      .then((r) => r.json())
      .then((j) => {
        if (j && j.ok && Array.isArray(j.completedModuleIds)) {
          j.completedModuleIds.forEach((id) => {
            completed[id] = true;
          });
        } else {
          console.warn("Progress response not ok:", j);
        }
      })
      .catch((err) => console.warn("Progress read error:", err))
      .finally(() => {
        renderList();
      });
  })();

  // ---------- YOUTUBE PLAYER / ANTI-SKIP ----------

  window.onYouTubeIframeAPIReady = function () {
    player = new YT.Player("player", {
      videoId: current.youtubeId,
      playerVars: {
        controls: 0,
        disablekb: 1,
        modestbranding: 1,
        rel: 0,
        fs: 0,
        iv_load_policy: 3
      },
      events: {
        onReady,
        onStateChange,
        onPlaybackRateChange,
        onError: (e) => console.warn("YT error", e)
      }
    });
  };

  function loadModule(m) {
    current = m;
    allowedTime = furthest[m.id] || 0;
    playerTitle.textContent = "Player • " + m.title;

    if (player && player.loadVideoById) {
      player.loadVideoById(m.youtubeId);
      player.stopVideo();
      overlayPlay.classList.remove("hidden");
    }
  }

  function onReady() {
    playBtn.addEventListener("click", () => {
      overlayPlay.classList.add("hidden");
      player.playVideo();
    });
    loadModule(current);
  }

  function onStateChange(e) {
    if (e.data === YT.PlayerState.PLAYING) {
      monitor();
    } else if (e.data === YT.PlayerState.ENDED) {
      // Only mark complete once per session, but source of truth is Sheet
      if (!completed[current.id]) {
        completed[current.id] = true;
        renderList();
        logCompletion(current).catch(console.error);
      }
      overlayPlay.classList.remove("hidden");
    }
  }

  function onPlaybackRateChange() {
    if (player && player.getPlaybackRate && player.setPlaybackRate) {
      if (player.getPlaybackRate() !== 1) player.setPlaybackRate(1);
    }
  }

  function monitor() {
    function tick() {
      if (!player || player.getPlayerState() !== YT.PlayerState.PLAYING) return;
      const t = player.getCurrentTime();

      if (t > allowedTime + 0.75) {
        // Tried to skip ahead, snap back
        player.seekTo(allowedTime, true);
      } else {
        if (t > allowedTime) {
          allowedTime = t;
          furthest[current.id] = allowedTime; // session-only
        }
      }
      requestAnimationFrame(tick);
    }
    requestAnimationFrame(tick);
  }

  // Prevent clicking directly on the iframe
  blocker.addEventListener("click", () => {});

  // ---------- LOG COMPLETION TO SHEET ONLY ----------

  function logCompletion(module) {
    if (
      !CONFIG.GAS_ENDPOINT ||
      CONFIG.GAS_ENDPOINT.includes("REPLACE_WITH_YOUR_DEPLOYMENT")
    ) {
      console.warn("GAS endpoint not set. Skipping remote log.");
      return Promise.resolve();
    }

    const payload = {
      type: "completion",
      timestamp: new Date().toISOString(),
      student: { name: auth.name },
      module: {
        id: module.id,
        title: module.title,
        youtubeId: module.youtubeId
      }
    };

    return fetch(CONFIG.GAS_ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    })
      .then((r) => r.json())
      .then((j) => {
        if (!j.ok) throw new Error("GAS error");
      });
  }
})();

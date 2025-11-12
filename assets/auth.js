// auth.js - simple client-side authentication and routing
(function(){
  const stateKey = CONFIG.siteKey + ":auth";
  const btn = document.getElementById('loginBtn');
  if (!btn) return; // if not on login page

  function saveAuth(auth){
    localStorage.setItem(stateKey, JSON.stringify(auth));
  }
  function getAuth(){
    try { return JSON.parse(localStorage.getItem(stateKey) || "null") } catch(e){ return null }
  }

  btn.addEventListener('click', () => {
    const name = document.getElementById('name').value.trim();
    const email = document.getElementById('email').value.trim();
    const username = document.getElementById('username').value.trim();
    const password = document.getElementById('password').value;

    if (!name || !email || !username || !password) {
      alert("Please complete all fields.");
      return;
    }

    let ok = false;
    if (CONFIG.allowAnyUser) ok = true;
    else {
      ok = CONFIG.CREDENTIALS.some(c => c.username === username && c.password === password);
    }
    if (!ok) {
      alert("Invalid username or password.");
      return;
    }
    saveAuth({ name, email, username, loggedInAt: Date.now() });
    window.location.href = "modules.html";
  });

  // Expose for other pages
  window.Auth = {
    get: getAuth,
    clear: () => localStorage.removeItem(stateKey)
  };
})();

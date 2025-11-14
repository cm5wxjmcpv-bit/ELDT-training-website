// auth.js (fixed v2) - first name, last name, password
(function(){
  const stateKey = CONFIG.siteKey + ":auth";

  function saveAuth(auth){
    localStorage.setItem(stateKey, JSON.stringify(auth));
  }

  function getAuth(){
    try {
      return JSON.parse(localStorage.getItem(stateKey) || "null");
    } catch (e) {
      return null;
    }
  }

  function normalize(s){ return String(s || "").trim(); }

  function matchUser(first, last, password){
    if (CONFIG.allowAnyUser) return true;
    const f = normalize(first).toLowerCase();
    const l = normalize(last).toLowerCase();
    return CONFIG.USERS.some(u =>
      u.password === password &&
      normalize(u.first).toLowerCase() === f &&
      normalize(u.last).toLowerCase()  === l
    );
  }

  // Attach login handler only on pages that actually have the login button
  const btn = document.getElementById('loginBtn');
  if (btn) {
    btn.addEventListener('click', () => {
      const first = document.getElementById('first').value;
      const last  = document.getElementById('last').value;
      const pwd   = document.getElementById('password').value;

      if (!first || !last || !pwd) {
        alert("Please complete all fields.");
        return;
      }
      if (!matchUser(first, last, pwd)) {
        alert("Invalid name or password.");
        return;
      }
      const name = `${normalize(first)} ${normalize(last)}`;
      saveAuth({
        name,
        first: normalize(first),
        last: normalize(last),
        loggedInAt: Date.now()
      });
      window.location.href = "modules.html";
    });
  }

  // Always define Auth helper so other pages can read login
  window.Auth = {
    get: getAuth,
    clear: () => localStorage.removeItem(stateKey)
  };
})();

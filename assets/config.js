// Basic configuration for the site
const CONFIG = {
  siteKey: "simple-training-site-v1",
  GAS_ENDPOINT: "https://script.google.com/macros/s/REPLACE_WITH_YOUR_DEPLOYMENT/exec",
  allowAnyUser: false, // if true, any username/password accepted (still collects name/email)
  CREDENTIALS: [
    { username: "student", password: "Password123" },
    { username: "micah", password: "Martinsville123" }
  ],
  MODULES: [
    { id: "mod1", title: "Module 1: Demo Safety Video", youtubeId: "dQw4w9WgXcQ" },
    { id: "mod2", title: "Module 2: Vehicle Checks", youtubeId: "oHg5SJYRHA0" }
  ],
  TEST: { id: "final", title: "Final Test", passPercent: 70 }
};

// Site config (v2 - name + password login, all progress from Google Sheet)
const CONFIG = {
  // Change this if you ever run multiple versions on the same domain
  siteKey: "simple-training-site-v2",

  // Your live Google Apps Script Web App URL
  GAS_ENDPOINT: "https://script.google.com/macros/s/AKfycbzPnr3n7q8TkbDXxSNCbo7QVZPMw2xgSvV9cqm7oN_aJzTt66Mcb6iJtDMFv-pP9Kl_/exec",

  // If true, anyone can log in with any name + any password (not recommended for you)
  allowAnyUser: false,

  // Allowed users (First name, Last name, Password)
  USERS: [
    { first: "Micah", last: "Lackey", password: "Password123" }
    // You can add more like:
    // { first: "Josh", last: "Smith", password: "Training123" }
  ],

  // Training modules (YouTube video IDs only, NOT full URLs)
  MODULES: [
    // Example:
    // If your link is https://www.youtube.com/watch?v=ABC123XYZ
    // then youtubeId should be "ABC123XYZ"
    { id: "mod1", title: "Module 1: Demo Safety Video", youtubeId: "dQw4w9WgXcQ" },
    { id: "mod2", title: "Module 2: Vehicle Checks",   youtubeId: "oHg5SJYRHA0" }
  ],

  // Final test settings
  TEST: {
    id: "final",
    title: "Final Test",
    passPercent: 70 // minimum percent to count as passed
  }
};

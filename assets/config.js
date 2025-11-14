// Site config (v2 - name+password login)
const CONFIG = {
  siteKey: "simple-training-site-v2",
  GAS_ENDPOINT: "https://script.google.com/macros/s/AKfycbwRSkyCEsT8SUZLa2wff4gvxegzMYh6XUXKKqJbiDmPILP-BVJuyou4T2rOSbWK-GS_/exec",
  allowAnyUser: false,
  USERS: [
    { first: "Micah", last: "Lackey", password: "Password123" }
  ],
  MODULES: [
    { id: "mod1", title: "Module 1: Demo Safety Video", youtubeId: "6DSvlh-zHu4" },
    { id: "mod2", title: "Module 2: Vehicle Checks", youtubeId: "6DSvlh-zHu4" }
  ],
  TEST: { id: "final", title: "Final Test", passPercent: 70 }
};

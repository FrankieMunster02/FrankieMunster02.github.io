// Firebase + Firestore shared sync for Beer Olympics
// All devices read/write the same document below.
const firebaseConfig = {
  apiKey: "AIzaSyCWv1fxaIB7rmZ8rgg07UyXdI5WXxsnAes",
  authDomain: "poconos-beer-olympics.firebaseapp.com",
  projectId: "poconos-beer-olympics",
  storageBucket: "poconos-beer-olympics.firebasestorage.app",
  messagingSenderId: "374830698435",
  appId: "1:374830698435:web:f6f8af1f139d51ce90b776",
  measurementId: "G-TFV1BCHEFH"
};

const app = firebase.initializeApp(firebaseConfig);
try { firebase.analytics(); } catch (e) {}
const db = firebase.firestore();
const STATE_DOC = db.collection("beerOlympics").doc("mainState");

window.defaultBeerOlympicsState = {
  eventName: "",
  subtitle: "",
  announcerName: "",
  announcer: "",
  games: [],
  teams: [],
  brackets: {},
  fun: { predictions: [], records: [], photos: [], rivalries: [], awards: [] }
};

function normalizeBeerOlympicsState(input) {
  const base = JSON.parse(JSON.stringify(window.defaultBeerOlympicsState));
  const s = Object.assign(base, input || {});
  if (!Array.isArray(s.games)) s.games = [];
  if (!Array.isArray(s.teams)) s.teams = [];
  if (!s.brackets || typeof s.brackets !== "object") s.brackets = {};
  if (!s.fun || typeof s.fun !== "object") s.fun = {};
  ["predictions", "records", "photos", "rivalries", "awards"].forEach(k => {
    if (!Array.isArray(s.fun[k])) s.fun[k] = [];
  });
  return s;
}

window.loadBeerOlympicsState = function(callback) {
  STATE_DOC.onSnapshot(async (snapshot) => {
    let nextState;
    if (snapshot.exists) {
      nextState = normalizeBeerOlympicsState(snapshot.data().state);
    } else {
      // First-time setup: migrate old browser-only data if it exists.
      let local = null;
      try {
        const saved = localStorage.getItem("beerOlympicsState");
        if (saved) local = JSON.parse(saved);
      } catch (e) {}
      nextState = normalizeBeerOlympicsState(local);
      await STATE_DOC.set({ state: nextState, updatedAt: firebase.firestore.FieldValue.serverTimestamp() });
    }

    try { localStorage.setItem("beerOlympicsState", JSON.stringify(nextState)); } catch (e) {}
    callback(nextState);
  }, (error) => {
    console.error("Firestore load failed:", error);
    alert("Could not load shared online data. Check your Firebase setup and Firestore rules.");
  });
};

window.saveBeerOlympicsState = async function(state) {
  const cleanState = normalizeBeerOlympicsState(state);
  try { localStorage.setItem("beerOlympicsState", JSON.stringify(cleanState)); } catch (e) {}
  await STATE_DOC.set({ state: cleanState, updatedAt: firebase.firestore.FieldValue.serverTimestamp() }, { merge: true });
};

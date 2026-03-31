import { initializeApp } from "https://www.gstatic.com/firebasejs/10.9.0/firebase-app.js";
import { getAuth, GoogleAuthProvider, signInWithPopup, signInWithEmailAndPassword, createUserWithEmailAndPassword, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.9.0/firebase-auth.js";
import { getFirestore, doc, setDoc, getDoc, updateDoc, increment, collection, query, orderBy, limit, getDocs } from "https://www.gstatic.com/firebasejs/10.9.0/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyAkbyGNos4sh7znOy-ofDzbkOBooDtVX1c",
  authDomain: "mathmind-app-6a73b.firebaseapp.com",
  projectId: "mathmind-app-6a73b",
  storageBucket: "mathmind-app-6a73b.appspot.com",
  messagingSenderId: "650091461476",
  appId: "1:650091461476:web:ee461b69377b2a91c69871"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

window.state = { user: null, score: 0, game: null, timer: null, timeLeft: 0, ans: '', target: null, soundEnabled: true };
let isAnimating = false;
window.audioCtx = null;

window.playSound = (type) => {
  if (!window.state.soundEnabled) return;
  if (!window.audioCtx) window.audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  
  const osc = window.audioCtx.createOscillator();
  const gain = window.audioCtx.createGain();
  osc.connect(gain);
  gain.connect(window.audioCtx.destination);
  
  if (type === 'click') {
    if(navigator.vibrate) navigator.vibrate(20);
    osc.type = 'sine'; osc.frequency.setValueAtTime(600, window.audioCtx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(300, window.audioCtx.currentTime + 0.1);
    gain.gain.setValueAtTime(0.5, window.audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, window.audioCtx.currentTime + 0.1);
    osc.start(); osc.stop(window.audioCtx.currentTime + 0.1);
  } else if (type === 'correct') {
    if(navigator.vibrate) navigator.vibrate([30, 50, 30]);
    osc.type = 'triangle'; osc.frequency.setValueAtTime(800, window.audioCtx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(1200, window.audioCtx.currentTime + 0.2);
    gain.gain.setValueAtTime(0.5, window.audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, window.audioCtx.currentTime + 0.2);
    osc.start(); osc.stop(window.audioCtx.currentTime + 0.2);
  } else if (type === 'wrong') {
    if(navigator.vibrate) navigator.vibrate([100, 50, 100]);
    osc.type = 'square'; osc.frequency.setValueAtTime(150, window.audioCtx.currentTime);
    gain.gain.setValueAtTime(0.5, window.audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, window.audioCtx.currentTime + 0.3);
    osc.start(); osc.stop(window.audioCtx.currentTime + 0.3);
  }
};

window.navTo = (id) => {
  window.playSound('click');
  const delay = document.getElementById('screen-splash').classList.contains('active') ? 800 : 50;
  
  document.querySelectorAll('.screen.active').forEach(s => {
    s.style.opacity = '0';
    setTimeout(() => { s.classList.remove('active'); s.style.opacity = ''; }, 300);
  });
  
  setTimeout(() => {
    const el = document.getElementById(id); 
    if (el) { el.classList.add('active'); el.scrollTop = 0; }
    if (id === 'screen-leaderboard') window.fetchLeaderboard();
  }, delay);
};

window.loginWithGoogle = async () => {
  try {
    const res = await signInWithPopup(auth, new GoogleAuthProvider());
    await handleLogin(res.user);
  } catch (err) { alert(err.message); }
};

window.login = async () => {
  try {
    const e = document.getElementById('login-email').value, p = document.getElementById('login-pass').value;
    if (!e||!p) return alert("Fill fields");
    const res = await signInWithEmailAndPassword(auth, e, p);
    await handleLogin(res.user);
  } catch(err) { alert(err.message); }
};

window.register = async () => {
  try {
    const n = document.getElementById('signup-name').value, e = document.getElementById('signup-email').value, p = document.getElementById('signup-pass').value;
    if (!n||!e||!p) return alert("Fill fields");
    const res = await createUserWithEmailAndPassword(auth, e, p);
    await setDoc(doc(db, "users", res.user.uid), { name: n, score: 0, streak: 1, email: e }, { merge: true });
    await handleLogin(res.user);
  } catch(err) { alert(err.message); }
};

window.logout = async () => { await signOut(auth); window.state.user = null; window.navTo('screen-login'); };

async function handleLogin(user) {
  const ref = doc(db, "users", user.uid);
  const snap = await getDoc(ref);
  if (!snap.exists()) await setDoc(ref, { name: user.displayName || "Player", score: 0, streak: 1 }, { merge: true });
  const data = (await getDoc(ref)).data();
  window.state.user = { uid: user.uid, ...data };
  
  document.getElementById('user-display-name').innerText = data.name;
  document.getElementById('user-total-score').innerText = data.score || 0;
  document.getElementById('header-avatar').src = `https://api.dicebear.com/7.x/adventurer/svg?seed=${encodeURIComponent(data.name)}`;
  
  if (window.updateDailyGoal) window.updateDailyGoal();
  window.navTo('screen-home');
}

window.updateDailyGoal = () => {
  const goal = 200;
  const userScore = window.state.user ? (window.state.user.score || 0) : 0;
  const fillPct = Math.min((userScore / goal) * 100, 100).toFixed(0);
  const fillEl = document.getElementById('user-streak-fill');
  const txtEl = document.getElementById('user-streak-percent');
  if (fillEl && txtEl) {
    fillEl.style.width = fillPct + '%';
    if (fillPct >= 100) { fillEl.classList.add('gold-streak'); txtEl.innerText = "Goal Reached! 🌟"; }
    else { fillEl.classList.remove('gold-streak'); txtEl.innerText = `${fillPct}% complete`; }
  }
};

onAuthStateChanged(auth, user => {
  if (user) handleLogin(user);
  else window.navTo('screen-login');
});

window.fetchLeaderboard = async () => {
  const container = document.getElementById('global-lb-list');
  container.innerHTML = '<div style="text-align:center;padding:20px;">Loading...</div>';
  try {
    const snap = await getDocs(query(collection(db, "users"), orderBy("score", "desc"), limit(10)));
    container.innerHTML = ''; let rank = 1;
    snap.forEach(d => {
      const u = d.data(); const name = u.name || "User";
      let league = '', glowClass = '';
      if(rank <= 3) { league = '💎'; glowClass = 'lb-glow-diamond'; }
      else if(rank <= 6) { league = '🥇'; glowClass = 'lb-glow-gold'; }
      else if(rank <= 10) { league = '🥈'; glowClass = 'lb-glow-silver'; }
      
      container.innerHTML += `<div class="lb-row ${glowClass}"><div class="lb-rank-num">#${rank++}</div><img src="https://api.dicebear.com/7.x/adventurer/svg?seed=${encodeURIComponent(name)}" class="lb-avatar"><div class="lb-name">${name} <span class="league-b">${league}</span></div><div class="lb-pts">${u.score || 0} pts</div></div>`;
    });
  } catch (err) { container.innerHTML = '<div style="text-align:center;padding:20px;">Error loading leaderboard.</div>'; }
};

window.startTimer = (sec, gameId) => {
  if (window.state.timer) clearInterval(window.state.timer);
  window.state.timeLeft = sec;
  const tEl = document.getElementById(`${gameId}-timer-text`);
  if(tEl) tEl.innerText = `${sec}s`;
  window.state.timer = setInterval(() => {
    window.state.timeLeft--;
    if(tEl) tEl.innerText = `${window.state.timeLeft}s`;
    if (window.state.timeLeft <= 0) { 
      clearInterval(window.state.timer); 
      finishGame(false); 
    }
  }, 1000);
};

window.openGame = (gameId) => {
  if (window.state.timer) clearInterval(window.state.timer);
  isAnimating = false;
  window.state.game = gameId; window.state.score = 0; window.state.ans = '';
  
  if (gameId === 'calculator' || gameId === 'quick_calc' || gameId === 'sqrt' || gameId === 'cube') {
    window.navTo('screen-game-calc');
    nextRoundCalc(gameId);
  } else if (gameId === 'guess_sign') {
    window.navTo('screen-game-sign');
    nextRoundSign();
  } else {
    // defaults
    window.navTo('screen-game-calc');
    nextRoundCalc('calculator');
  }
};

function nextRoundCalc(type) {
  window.state.ans = ''; document.getElementById('calc-ans-display').innerText = '_';
  let eq = '', target = 0, time = 15;
  if(type === 'calculator') {
    const n1 = Math.floor(Math.random()*20)+1, n2 = Math.floor(Math.random()*20)+1;
    target = n1 + n2; eq = `${n1} + ${n2} = ?`; time = 15;
  } else if(type === 'quick_calc') {
    const n1 = Math.floor(Math.random()*10)+1, n2 = Math.floor(Math.random()*10)+1;
    target = n1 + n2; eq = `${n1} + ${n2} = ?`; time = 5;
  } else if(type === 'sqrt') {
    const r = Math.floor(Math.random()*14)+2; target = r; eq = `√${r*r} = ?`; time = 12;
  } else if(type === 'cube') {
    const v = Math.floor(Math.random()*10)+2; target = v*v*v; eq = `${v}³ = ?`; time = 15;
  }
  window.state.target = target;
  document.getElementById('calc-eq').innerText = eq;
  document.getElementById('calc-score').innerText = window.state.score;
  window.startTimer(time, 'calc');
}

function nextRoundSign() {
  const ops = ['+','-','*']; const op = ops[Math.floor(Math.random()*ops.length)];
  const n1 = Math.floor(Math.random()*10)+1, n2 = Math.floor(Math.random()*10)+1;
  window.state.target = op;
  document.getElementById('s-n1').innerText = n1; document.getElementById('s-n2').innerText = n2;
  document.getElementById('s-res').innerText = op==='+'?(n1+n2):op==='-'?(n1-n2):(n1*n2);
  document.getElementById('sign-score').innerText = window.state.score;
  window.startTimer(10, 'sign');
}

window.np = (v) => {
  window.playSound('click');
  if (v==='clear') window.state.ans = '';
  else if (v==='del') window.state.ans = window.state.ans.slice(0,-1);
  else if (window.state.ans.length < 6) window.state.ans += v;
  document.getElementById('calc-ans-display').innerText = window.state.ans || '_';
};

window.submitCalc = () => {
  if (isAnimating) return;
  if (parseInt(window.state.ans) === window.state.target) {
    window.playSound('correct');
    isAnimating = true; window.state.score += 10; clearInterval(window.state.timer);
    setTimeout(() => { isAnimating = false; nextRoundCalc(window.state.game); }, 400); // reduced delay
  } else {
    window.playSound('wrong');
    finishGame(false);
  }
};

window.chooseSign = (op) => {
  if (isAnimating) return;
  if (op === window.state.target) {
    window.playSound('correct');
    isAnimating = true; window.state.score += 10; clearInterval(window.state.timer);
    setTimeout(() => { isAnimating = false; nextRoundSign(); }, 400); // reduced delay
  } else {
    window.playSound('wrong');
    finishGame(false);
  }
};

function finishGame(isWin) {
  if (window.state.timer) clearInterval(window.state.timer);
  isAnimating = false;
  document.getElementById('res-score').innerText = window.state.score;
  document.getElementById('res-correct').innerText = window.state.score / 10;
  document.getElementById('res-wrong').innerText = 1;
  
  if (window.state.user && window.state.score > 0) {
    updateDoc(doc(db, "users", window.state.user.uid), { score: increment(window.state.score) })
      .then(() => {
        window.state.user.score += window.state.score;
        document.getElementById('user-total-score').innerText = window.state.user.score;
        if (window.updateDailyGoal) window.updateDailyGoal();
      }).catch(e=>console.log(e));
  }
  window.navTo('screen-result');
}

window.toggleTheme = () => { window.playSound('click'); document.body.classList.toggle('dark-mode'); };
window.toggleSound = () => {
  window.state.soundEnabled = !window.state.soundEnabled;
  if (window.state.soundEnabled) window.playSound('click');
  const s = document.getElementById('sound-status');
  if(s) s.innerText = window.state.soundEnabled ? 'Enabled' : 'Disabled';
};
window.openSettings = () => window.navTo('screen-settings');

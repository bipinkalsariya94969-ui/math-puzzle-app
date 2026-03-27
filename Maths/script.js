// ================= MATHMIND CORE LOGIC =================

let state = {
  user: null, // { email, name, score, coins, verified }
  currentScore: 0,
  currentCoins: 0,
  currentGame: null,
  timer: null,
  timeLeft: 0,
  ans: '',
  target: null,
  isDark: false
};

const API_URL = 'http://localhost:3000/api'; // CHANGE THIS TO YOUR RENDER APP URL AFTER DEPLOYING

// ================= NAVIGATION =================

function navTo(screenId) {
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
  const target = document.getElementById(screenId);
  if (target) {
    target.classList.add('active');
    // Scroll to top of the specific screen
    target.scrollTop = 0;
  }
}

window.onload = () => {
  // Splash Logic
  setTimeout(() => {
    const savedUser = localStorage.getItem('mathMindUser');
    if (savedUser) {
      state.user = JSON.parse(savedUser);
      updateUI();
      navTo('screen-home');
    } else {
      navTo('screen-login');
    }
  }, 2000);
};

// ================= AUTHENTICATION =================

async function handleSignup() {
  const name = document.getElementById('signup-name').value;
  const email = document.getElementById('signup-email').value;
  const password = document.getElementById('signup-pass').value;

  if (!name || !email || !password) return alert('Please fill all fields');

  try {
    const res = await fetch(`${API_URL}/signup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email, password })
    });
    const data = await res.json();
    if (res.ok) {
      alert(data.message);
      navTo('screen-verify');
      state.pendingEmail = email;
    } else {
      alert(data.error);
    }
  } catch (e) {
    alert('Backend server not running. Using guest mode.');
    guestLogin(name, email);
  }
}

async function handleVerify() {
  const code = document.getElementById('verify-code').value;
  if (!code) return alert('Please enter verification code');

  // Simple mock verification for demo
  try {
    const res = await fetch(`${API_URL}/verify`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: state.pendingEmail })
    });
    if (res.ok) {
      alert('Verified! Please Login.');
      navTo('screen-login');
    }
  } catch (e) {
    alert('Verification successful (Mock)');
    navTo('screen-login');
  }
}

async function handleLogin() {
  const email = document.getElementById('login-email').value;
  const password = document.getElementById('login-pass').value;

  try {
    const res = await fetch(`${API_URL}/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });
    const data = await res.json();
    if (res.ok) {
      state.user = data.user;
      localStorage.setItem('mathMindUser', JSON.stringify(data.user));
      updateUI();
      navTo('screen-home');
    } else {
      alert(data.error);
    }
  } catch (e) {
    alert('Backend not found. Logging in as guest.');
    guestLogin('Guest User', email);
  }
}

function guestLogin(name, email) {
  state.user = { name, email, score: 0, coins: 0, verified: true };
  updateUI();
  navTo('screen-home');
}

function updateUI() {
  if (!state.user) return;
  document.getElementById('user-display-name').innerText = state.user.name;
  document.getElementById('user-total-score').innerText = state.user.score.toLocaleString();
}

// ================= GAMEPLAY CORE =================

function openGame(type) {
  state.currentGame = type;
  state.currentScore = 0;
  state.currentCoins = 0;

  if (type === 'calculator') {
    document.getElementById('calc-score').innerText = '0';
    navTo('screen-game-calc');
    nextRoundCalc();
  } else if (type === 'guess_sign') {
    document.getElementById('sign-score').innerText = '0';
    navTo('screen-game-sign');
    nextRoundSign();
  } else if (type === 'quick_calc') {
    document.getElementById('quick-score').innerText = '0';
    navTo('screen-game-quick');
    nextRoundQuick();
  } else if (type === 'sqrt') {
    document.getElementById('sqrt-score').innerText = '0';
    navTo('screen-game-sqrt');
    nextRoundSqrt();
  } else if (type === 'grid') {
    document.getElementById('grid-score').innerText = '0';
    navTo('screen-game-grid');
    nextRoundGrid();
  } else if (type === 'pairs') {
    document.getElementById('pairs-score').innerText = '0';
    navTo('screen-game-pairs');
    nextRoundPairs();
  } else if (type === 'triangle') {
    document.getElementById('triangle-score').innerText = '0';
    navTo('screen-game-triangle');
    nextRoundTriangle();
  } else if (type === 'pyramid') {
    document.getElementById('pyramid-score').innerText = '0';
    navTo('screen-game-pyramid');
    nextRoundPyramid();
  } else if (type === 'cube') {
    document.getElementById('cube-score').innerText = '0';
    navTo('screen-game-cube');
    nextRoundCube();
  } else if (type === 'picture') {
    document.getElementById('picture-score').innerText = '0';
    navTo('screen-game-picture');
    nextRoundPicture();
  } else if (type === 'conc') {
    document.getElementById('conc-score').innerText = '0';
    navTo('screen-game-conc');
    nextRoundConc();
  } else if (type === 'multi') {
    navTo('screen-game-multi');
  } else if (type === 'find_missing') {
    document.getElementById('calc-score').innerText = '0';
    navTo('screen-game-calc'); // Reuse calc UI for missing number
    nextRoundMissing();
  } else if (type === 'true_false') {
    document.getElementById('calc-score').innerText = '0';
    navTo('screen-game-calc'); // Reuse calc UI
    nextRoundTF();
  } else if (type === 'complex') {
    document.getElementById('calc-score').innerText = '0';
    navTo('screen-game-calc');
    nextRoundComplex();
  } else if (type === 'memory') {
    navTo('screen-memory');
  } else if (type === 'brain') {
    navTo('screen-brain');
  }
}

// --- Find Missing ---
function nextRoundMissing() {
  state.ans = '';
  document.getElementById('calc-ans-display').innerText = '_';
  const n1 = Math.floor(Math.random() * 20) + 1;
  const n2 = Math.floor(Math.random() * 20) + 1;
  state.target = n2;
  document.getElementById('calc-eq').innerText = `${n1} + ? = ${n1 + n2}`;
  startTimer(15, 'calc');
}

// --- True / False ---
function nextRoundTF() {
  state.ans = '';
  document.getElementById('calc-ans-display').innerText = '1:True / 0:False';
  const n1 = Math.floor(Math.random() * 10);
  const n2 = Math.floor(Math.random() * 10);
  const isCorrect = Math.random() > 0.5;
  const displayRes = isCorrect ? (n1 + n2) : (n1 + n2 + 1);
  state.target = isCorrect ? 1 : 0;
  document.getElementById('calc-eq').innerText = `${n1} + ${n2} = ${displayRes}`;
  startTimer(10, 'calc');
}

// --- Complex ---
function nextRoundComplex() {
  state.ans = '';
  document.getElementById('calc-ans-display').innerText = '_';
  const n1 = Math.floor(Math.random() * 10) + 1;
  const n2 = Math.floor(Math.random() * 5) + 1;
  const n3 = Math.floor(Math.random() * 10) + 1;
  state.target = (n1 * n2) + n3;
  document.getElementById('calc-eq').innerText = `(${n1} × ${n2}) + ${n3} = ?`;
  startTimer(20, 'calc');
}

// --- Multiplayer Duel (Simulated) ---
let myDuelScore = 0;
let botDuelScore = 0;
let duelActive = false;

function startDuel() {
  const status = document.querySelector('.duel-status');
  status.innerText = "Finding Opponent...";
  setTimeout(() => {
    status.innerText = "Opponent: Bot 402 Found!";
    setTimeout(() => {
      status.innerText = "Battle Starts in 3...";
      setTimeout(() => status.innerText = "Battle Starts in 2...", 1000);
      setTimeout(() => status.innerText = "Battle Starts in 1...", 2000);
      setTimeout(beginDuelBattle, 3000);
    }, 1000);
  }, 1500);
}

function beginDuelBattle() {
  duelActive = true;
  myDuelScore = 0;
  botDuelScore = 0;
  document.querySelectorAll('.p-score')[0].innerText = "Score: 0";
  document.querySelectorAll('.p-score')[1].innerText = "Score: 0";
  document.querySelector('.duel-status').innerText = "CALCULATE FAST!";

  // Start BOT simulation
  const botInterval = setInterval(() => {
    if (!duelActive) { clearInterval(botInterval); return; }
    botDuelScore++;
    document.querySelectorAll('.p-score')[1].innerText = `Score: ${botDuelScore}`;
    if (botDuelScore >= 10) endDuel(false);
  }, 3000);

  // Simple prompt for user
  duelPrompt();
}

function duelPrompt() {
  if (!duelActive) return;
  const ans = prompt(`${Math.floor(Math.random() * 10)} + ${Math.floor(Math.random() * 10)} = ?`);
  if (parseInt(ans) >= 0) {
    myDuelScore++;
    document.querySelectorAll('.p-score')[0].innerText = `Score: ${myDuelScore}`;
    if (myDuelScore >= 10) endDuel(true);
    else duelPrompt();
  }
}

function endDuel(win) {
  duelActive = false;
  alert(win ? "YOU WIN! +50 Coins" : "BOT WINS! Try again.");
  if (win) updateCoins(50);
  navTo('screen-home');
}

// --- Picture Puzzle ---
function nextRoundPicture() {
  state.ans = '';
  document.getElementById('pic-ans-display').innerText = '_';
  const icons = ['🍎', '🍌', '🍒', '🍇', '🍓', '🥑'];
  icons.sort(() => Math.random() - 0.5);
  const vA = Math.floor(Math.random() * 10) + 5;
  const vB = Math.floor(Math.random() * 5) + 2;
  const vC = Math.floor(Math.random() * 5) + 1;

  const container = document.getElementById('pic-puzzle-container');
  container.innerHTML = `
    <div class="pic-eq">${icons[0]} + ${icons[0]} = ${vA + vA}</div>
    <div class="pic-eq">${icons[0]} + ${icons[1]} = ${vA + vB}</div>
    <div class="pic-eq">${icons[1]} - ${icons[2]} = ${vB - vC}</div>
    <div class="pic-eq" style="border-top: 1px solid var(--border); padding-top:10px">${icons[0]} + ${icons[1]} + ${icons[2]} = ?</div>
  `;
  state.target = vA + vB + vC;
  startTimer(40, 'picture');
}

// --- Concentration ---
function nextRoundConc() {
  const container = document.getElementById('game-conc-grid');
  container.innerHTML = '';
  const icons = ['🍎', '🍔', '🍕', '🍦', '🍭', '🍩', '🍫', '🍯'];
  let pool = [...icons, ...icons].sort(() => Math.random() - 0.5);
  pool.forEach(icon => {
    const card = document.createElement('div');
    card.className = 'pair-card ripple';
    card.innerText = '?';
    card.onclick = () => flipCard(card, { txt: icon, val: icon });
    container.appendChild(card);
  });
  startTimer(25, 'conc');
}

// --- Square Cube Mode ---
function nextRoundCube() {
  state.ans = '';
  document.getElementById('cube-ans-display').innerText = '_';
  const val = Math.floor(Math.random() * 12) + 2;
  state.target = val * val * val;
  document.getElementById('cube-eq').innerText = `${val}³ = ?`;
  startTimer(15, 'cube');
}

// --- Number Pyramid ---
let pyramidSolution = [];
function nextRoundPyramid() {
  const b1 = Math.floor(Math.random() * 10) + 1;
  const b2 = Math.floor(Math.random() * 10) + 1;
  const b3 = Math.floor(Math.random() * 10) + 1;
  const m1 = b1 + b2;
  const m2 = b2 + b3;
  const t1 = m1 + m2;
  pyramidSolution = [t1, m1, m2, b1, b2, b3];

  const hiddenIndices = [0, 1, 2, 3, 4, 5].sort(() => Math.random() - 0.5).slice(0, 3);

  pyramidSolution.forEach((val, i) => {
    const input = document.getElementById(`pyr-${i}`);
    if (hiddenIndices.includes(i)) {
      input.value = '';
      input.readOnly = false;
    } else {
      input.value = val;
      input.readOnly = true;
    }
  });
  startTimer(45, 'pyramid');
}

function checkPyramid() {
  let isCorrect = true;
  pyramidSolution.forEach((val, i) => {
    if (parseInt(document.getElementById(`pyr-${i}`).value) !== val) isCorrect = false;
  });
  if (isCorrect) {
    correctAction('pyramid');
    setTimeout(nextRoundPyramid, 1000);
  } else {
    wrongAction('pyramid');
  }
}

// --- Math Pairs ---
let firstCard = null;
let secondCard = null;
let lockPairs = false;

function nextRoundPairs() {
  const container = document.getElementById('game-pairs-grid');
  container.innerHTML = '';
  const pairs = [];
  for (let i = 1; i <= 6; i++) {
    const n1 = Math.floor(Math.random() * 9) + 1;
    const n2 = Math.floor(Math.random() * 9) + 1;
    pairs.push({ txt: `${n1}+${n2}`, val: n1 + n2 });
    pairs.push({ txt: `${n1 + n2}`, val: n1 + n2 });
  }
  pairs.sort(() => Math.random() - 0.5);
  pairs.forEach(p => {
    const card = document.createElement('div');
    card.className = 'pair-card ripple';
    card.innerText = '?';
    card.onclick = () => flipCard(card, p);
    container.appendChild(card);
  });
  startTimer(30, 'pairs');
}

function flipCard(el, p) {
  if (lockPairs || el === firstCard || el.classList.contains('matched')) return;
  el.innerText = p.txt;
  el.classList.add('flipped');
  if (!firstCard) { firstCard = { el, p }; return; }
  secondCard = { el, p };
  lockPairs = true;
  if (firstCard.p.val === secondCard.p.val) {
    setTimeout(() => {
      firstCard.el.classList.add('matched');
      secondCard.el.classList.add('matched');
      resetPairs();
      if (document.querySelectorAll('.pair-card:not(.matched)').length === 0) {
        correctAction('pairs');
        setTimeout(nextRoundPairs, 1000);
      }
    }, 500);
  } else {
    setTimeout(() => {
      firstCard.el.innerText = '?';
      secondCard.el.innerText = '?';
      firstCard.el.classList.remove('flipped');
      secondCard.el.classList.remove('flipped');
      resetPairs();
    }, 1000);
  }
}
function resetPairs() { [firstCard, secondCard, lockPairs] = [null, null, false]; }

// --- Magic Triangle ---
let activeTriNode = null;
let triangleData = [0, 0, 0, 0, 0, 0];

function nextRoundTriangle() {
  triangleData = [0, 0, 0, 0, 0, 0];
  const target = [9, 10, 11, 12][Math.floor(Math.random() * 4)];
  state.target = target;
  document.getElementById('tri-target').innerText = target;

  const nodes = document.querySelectorAll('.tri-node');
  nodes.forEach(n => {
    n.innerText = '?';
    n.classList.remove('active');
    n.onclick = () => {
      nodes.forEach(x => x.classList.remove('active'));
      n.classList.add('active');
      activeTriNode = n;
    };
  });

  const optContainer = document.getElementById('tri-num-options');
  optContainer.innerHTML = '';
  for (let i = 1; i <= 6; i++) {
    const opt = document.createElement('div');
    opt.className = 'tri-opt ripple';
    opt.innerText = i;
    opt.onclick = () => {
      if (!activeTriNode) return;
      const pos = activeTriNode.dataset.pos;
      triangleData[pos] = i;
      activeTriNode.innerText = i;
      // Mark as used? Simple version allows reuse for easy trial-error
    };
    optContainer.appendChild(opt);
  }
  startTimer(40, 'triangle');
}

function checkTriangle() {
  const s1 = triangleData[0] + triangleData[1] + triangleData[3];
  const s2 = triangleData[0] + triangleData[2] + triangleData[5];
  const s3 = triangleData[3] + triangleData[4] + triangleData[5];
  if (s1 === state.target && s2 === state.target && s3 === state.target) {
    correctAction('triangle');
    setTimeout(nextRoundTriangle, 1000);
  } else {
    wrongAction('triangle');
  }
}

// --- Square Root Mode ---
function nextRoundSqrt() {
  state.ans = '';
  document.getElementById('sqrt-ans-display').innerText = '_';
  const roots = [2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15];
  const root = roots[Math.floor(Math.random() * roots.length)];
  state.target = root;
  document.getElementById('sqrt-eq').innerText = `√${root * root} = ?`;
  startTimer(12, 'sqrt');
}

// --- Math Grid Mode ---
let selectedTiles = [];
function nextRoundGrid() {
  selectedTiles = [];
  const gridContainer = document.getElementById('game-grid-tiles');
  gridContainer.innerHTML = '';

  const nums = [];
  for (let i = 0; i < 9; i++) nums.push(Math.floor(Math.random() * 9) + 1);

  // Pick 2 or 3 random tiles to form the target
  const targetIndices = [0, 1, 2, 3, 4, 5, 6, 7, 8].sort(() => Math.random() - 0.5).slice(0, 3);
  const targetSum = targetIndices.reduce((acc, idx) => acc + nums[idx], 0);
  state.target = targetSum;
  document.getElementById('grid-target').innerText = targetSum;

  nums.forEach((n, i) => {
    const tile = document.createElement('div');
    tile.className = 'grid-tile ripple';
    tile.innerText = n;
    tile.onclick = () => toggleTile(tile, n);
    gridContainer.appendChild(tile);
  });
  startTimer(20, 'grid');
}

function toggleTile(el, val) {
  el.classList.toggle('selected');
  const idx = selectedTiles.indexOf(el);
  if (idx > -1) selectedTiles.splice(idx, 1);
  else selectedTiles.push(el);
}

function checkGridSum() {
  const sum = selectedTiles.reduce((acc, el) => acc + parseInt(el.innerText), 0);
  if (sum === state.target) {
    correctAction('grid');
    setTimeout(nextRoundGrid, 1000);
  } else {
    wrongAction('grid');
  }
}

// --- Quick Calc Mode ---
function nextRoundQuick() {
  state.ans = '';
  document.getElementById('quick-ans-display').innerText = '_';
  const n1 = Math.floor(Math.random() * 10) + 1;
  const n2 = Math.floor(Math.random() * 10) + 1;
  state.target = n1 + n2;
  document.getElementById('quick-eq').innerText = `${n1} + ${n2} = ?`;
  startTimer(5, 'quick');
}

// --- Leaderboard ---
async function fetchLeaderboard() {
  try {
    const res = await fetch(`${API_URL}/leaderboard`);
    const data = await res.json();
    const listEl = document.getElementById('global-lb-list');
    listEl.innerHTML = '';
    data.forEach((entry, i) => {
      listEl.innerHTML += `
        <div class="lb-row">
          <div class="lb-rank-num">#${i + 1}</div>
          <div class="lb-name">${entry.name}</div>
          <div class="lb-pts">${entry.score} pts</div>
        </div>`;
    });
  } catch (e) {
    document.getElementById('global-lb-list').innerHTML = '<p style="text-align:center; padding:20px">Connect to server for global ranking</p>';
  }
}

// Update navTo to fetch LB when entering
const originalNavTo = navTo;
navTo = (id) => {
  originalNavTo(id);
  if (id === 'screen-leaderboard') fetchLeaderboard();
};

// --- Calculator Mode ---
function nextRoundCalc() {
  state.ans = '';
  document.getElementById('calc-ans-display').innerText = '_';
  const n1 = Math.floor(Math.random() * 20) + 1;
  const n2 = Math.floor(Math.random() * 20) + 1;
  state.target = n1 + n2;
  document.getElementById('calc-eq').innerText = `${n1} + ${n2} = ?`;
  startTimer(15, 'calc');
}

function np(val) {
  if (val === 'clear') state.ans = '';
  else if (val === 'del') state.ans = state.ans.slice(0, -1);
  else if (state.ans.length < 5) state.ans += val;
  document.getElementById('calc-ans-display').innerText = state.ans || '_';
}

function submitCalc() {
  if (parseInt(state.ans) === state.target) {
    correctAction('calc');
    setTimeout(nextRoundCalc, 800);
  } else {
    wrongAction('calc');
  }
}

// --- Guess Sign Mode ---
function nextRoundSign() {
  const ops = ['+', '-', '*'];
  const op = ops[Math.floor(Math.random() * ops.length)];
  const n1 = Math.floor(Math.random() * 10) + 1;
  const n2 = Math.floor(Math.random() * 10) + 1;

  let result;
  if (op === '+') result = n1 + n2;
  else if (op === '-') result = n1 - n2;
  else result = n1 * n2;

  state.target = op;
  document.getElementById('s-n1').innerText = n1;
  document.getElementById('s-n2').innerText = n2;
  document.getElementById('s-res').innerText = result;

  startTimer(10, 'sign');
}

function chooseSign(op) {
  if (op === state.target) {
    correctAction('sign');
    setTimeout(nextRoundSign, 800);
  } else {
    wrongAction('sign');
  }
}

// --- Shared Feedback ---
function correctAction(game) {
  clearInterval(state.timer);
  state.currentScore += 10;
  state.currentCoins += 1;
  const scoreEl = document.getElementById(`${game}-score`);
  if (scoreEl) scoreEl.innerText = state.currentScore;

  const card = document.querySelector(game === 'calc' ? '#screen-game-calc .eq-card' : '#screen-game-sign .eq-card');
  card.style.background = '#E8F8F0';
  setTimeout(() => card.style.background = 'var(--card)', 500);
}

function wrongAction(game) {
  clearInterval(state.timer);
  const card = document.querySelector(game === 'calc' ? '#screen-game-calc .eq-card' : '#screen-game-sign .eq-card');
  card.style.background = '#FFF5F5';
  setTimeout(() => {
    card.style.background = 'var(--card)';
    showResult();
  }, 600);
}

// ================= UTILITIES =================

function startTimer(seconds, game) {
  clearInterval(state.timer);
  state.timeLeft = seconds;
  const textEl = document.getElementById(`${game}-timer-text`);
  const fillEl = document.getElementById(`${game}-timer-fill`);

  if (!textEl || !fillEl) return;

  const total = 283; // Circumference
  textEl.innerText = `${seconds}s`;
  fillEl.style.strokeDashoffset = '0';

  state.timer = setInterval(() => {
    state.timeLeft--;
    textEl.innerText = `${state.timeLeft}s`;

    const offset = total - (state.timeLeft / seconds) * total;
    fillEl.style.strokeDashoffset = offset;

    if (state.timeLeft <= 0) {
      clearInterval(state.timer);
      wrongAction(game);
    }
  }, 1000);
}

function showResult() {
  document.getElementById('res-score').innerText = state.currentScore.toLocaleString();
  document.getElementById('res-correct').innerText = state.currentScore / 10;
  document.getElementById('res-wrong').innerText = '1';
  document.getElementById('res-acc').innerText = '90%';

  navTo('screen-result');
  updateBackendScore();
}

async function updateBackendScore() {
  if (!state.user) return;
  try {
    const res = await fetch(`${API_URL}/update-score`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: state.user.email,
        score: state.user.score + state.currentScore,
        coins: state.currentCoins
      })
    });
    const data = await res.json();
    if (res.ok) {
      state.user = data.user;
      localStorage.setItem('mathMindUser', JSON.stringify(data.user));
      updateUI();
    }
  } catch (e) {
    // Persistent guest mode
    state.user.score += state.currentScore;
    state.user.coins += state.currentCoins;
    localStorage.setItem('mathMindUser', JSON.stringify(state.user));
    updateUI();
  }
}

function toggleTheme() {
  state.isDark = !state.isDark;
  document.body.classList.toggle('dark-mode', state.isDark);
}
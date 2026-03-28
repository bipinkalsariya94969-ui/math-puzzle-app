const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;
const DATA_FILE = path.join(__dirname, 'data.json');

app.use(cors());
app.use(bodyParser.json());
app.use(express.static(__dirname));

// Initialize dummy data if not exists
if (!fs.existsSync(DATA_FILE)) {
  fs.writeFileSync(DATA_FILE, JSON.stringify({ users: [], leaderboard: [] }));
}

function getData() {
  return JSON.parse(fs.readFileSync(DATA_FILE));
}

function saveData(data) {
  fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
}

// Auth Routes
app.post('/api/signup', (req, res) => {
  const { email, password, name } = req.body;
  const data = getData();
  if (data.users.find(u => u.email === email)) {
    return res.status(400).json({ error: 'User already exists' });
  }
  const newUser = { email, password, name, score: 0, coins: 0, verified: false };
  data.users.push(newUser);
  saveData(data);
  res.json({ message: 'Signup successful! Please verify your account.', user: { email, name } });
});

app.post('/api/verify', (req, res) => {
  const { email } = req.body;
  const data = getData();
  const user = data.users.find(u => u.email === email);
  if (user) {
    user.verified = true;
    saveData(data);
    return res.json({ message: 'Verification successful!' });
  }
  res.status(400).json({ error: 'User not found' });
});

app.post('/api/login', (req, res) => {
  const { email, password } = req.body;
  const data = getData();
  const user = data.users.find(u => u.email === email && u.password === password);
  if (user) {
    if (!user.verified) return res.status(403).json({ error: 'Account not verified' });
    return res.json({ message: 'Login successful!', user });
  }
  res.status(401).json({ error: 'Invalid credentials' });
});

// Leaderboard
app.get('/api/leaderboard', (req, res) => {
  const data = getData();
  const topScores = data.users
    .map(u => ({ name: u.name, score: u.score }))
    .sort((a, b) => b.score - a.score)
    .slice(0, 10);
  res.json(topScores);
});

app.post('/api/update-score', (req, res) => {
  const { email, score, coins } = req.body;
  const data = getData();
  const user = data.users.find(u => u.email === email);
  if (user) {
    user.score = Math.max(user.score, score);
    user.coins = (user.coins || 0) + (coins || 0);
    saveData(data);
    return res.json({ message: 'Score updated!', user });
  }
  res.status(404).json({ error: 'User not found' });
});

app.listen(PORT, () => {
  console.log(`MathMind Server running at http://localhost:${PORT}`);
});

const express = require('express');
const fs = require('fs');
const path = require('path');
const session = require('express-session');
const bodyParser = require('body-parser');

const app = express();
const PORT = 3000;

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static('public'));

app.use(session({
  secret: 'secretKey123',
  resave: false,
  saveUninitialized: false
}));

function readJSON(file) {
  if (!fs.existsSync(file)) return [];
  return JSON.parse(fs.readFileSync(file, 'utf8'));
}
function writeJSON(file, data) {
  fs.writeFileSync(file, JSON.stringify(data, null, 2));
}

app.post('/signup', (req, res) => {
  const { username, password } = req.body;
  const users = readJSON('users.json');

  if (users.find(u => u.username === username)) {
    return res.status(400).send('Username already exists');
  }

  const newUser = {
    id: Date.now(),
    username,
    password
  };
  users.push(newUser);
  writeJSON('users.json', users);

  res.send('Signup successful! You can now log in.');
});

app.post('/login', (req, res) => {
  const { username, password } = req.body;
  const users = readJSON('users.json');

  const user = users.find(u => u.username === username && u.password === password);
  if (!user) return res.status(401).send('Invalid credentials');

  req.session.userId = user.id;
  res.redirect('/dashboard.html');
});

function authMiddleware(req, res, next) {
  if (!req.session.userId) {
    return res.redirect('/login.html');
  }
  next();
}

app.get('/tasks', authMiddleware, (req, res) => {
  const tasks = readJSON('tasks.json');
  const userTasks = tasks.filter(t => t.userId === req.session.userId);
  res.json(userTasks);
});

app.post('/tasks', authMiddleware, (req, res) => {
  const { title, status } = req.body;
  const tasks = readJSON('tasks.json');

  const newTask = {
    id: Date.now(),
    userId: req.session.userId,
    title,
    status
  };

  tasks.push(newTask);
  writeJSON('tasks.json', tasks);
  res.json({ message: 'Task added successfully', task: newTask });
});

app.get('/logout', (req, res) => {
  req.session.destroy(() => {
    res.redirect('/login.html');
  });
});

app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));

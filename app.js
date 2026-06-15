const express = require('express');
const session = require('express-session');
const SQLiteStore = require('connect-sqlite3')(session);
const path = require('path');
const authService = require('./services/authService');
const postModel = require('./models/postModel');

const app = express();

// 1. 配置 EJS 模板引擎
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// 2. 解析 POST 请求中的表单数据
app.use(express.urlencoded({ extended: false }));

// 3. 配置 Session（登录状态保持）
app.use(session({
  store: new SQLiteStore({ db: 'sessions.db', dir: path.join(__dirname, 'data') }),
  secret: 'blog-app-secret-change-me',
  resave: false,
  saveUninitialized: false,
  cookie: { maxAge: 7 * 24 * 60 * 60 * 1000 } // 7 天过期
}));

// 4. 托管静态文件（CSS 等）
app.use(express.static(path.join(__dirname, 'public')));

// 5. 把 user 注入到每个模板（避免每个路由重复传 user）
app.use((req, res, next) => {
  res.locals.user = req.session.user || null;
  next();
});

// ========== 首页 ==========
app.get('/', async (req, res) => {
  const posts = await postModel.getAll();
  res.render('index', { posts });
});

// ========== 注册 ==========
app.get('/register', (req, res) => {
  res.render('register', { error: null });
});

app.post('/register', async (req, res) => {
  const { username, password } = req.body;
  const result = await authService.register(username, password);
  if (result.success) {
    res.redirect('/login');
  } else {
    res.render('register', { error: result.error });
  }
});

// ========== 登录 ==========
app.get('/login', (req, res) => {
  res.render('login', { error: null });
});

app.post('/login', async (req, res) => {
  const { username, password } = req.body;
  const result = await authService.login(username, password);
  if (result.success) {
    req.session.user = result.user;
    res.redirect('/');
  } else {
    res.render('login', { error: result.error });
  }
});

// ========== 登出 ==========
app.get('/logout', (req, res) => {
  req.session.destroy(() => {
    res.redirect('/');
  });
});

// ========== 写文章（需要登录） ==========
app.get('/posts/write', (req, res) => {
  if (!req.session.user) return res.redirect('/login');
  res.render('write', { error: null });
});

app.post('/posts/write', async (req, res) => {
  if (!req.session.user) return res.redirect('/login');
  const { title, content } = req.body;
  if (!title || !content) {
    return res.render('write', { error: '标题和内容不能为空' });
  }
  await postModel.create(req.session.user.id, title, content);
  res.redirect('/');
});

// ========== 文章详情 ==========
app.get('/posts/:id', async (req, res) => {
  const post = await postModel.getById(req.params.id);
  if (!post) return res.status(404).send('文章不存在');
  res.render('post', { post });
});

// 启动服务器
const PORT = 3000;
app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});

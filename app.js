const express = require('express');
const session = require('express-session');
const SQLiteStore = require('connect-sqlite3')(session);
const rateLimit = require('express-rate-limit');
const path = require('path');
const authService = require('./services/authService');
const chatService = require('./services/chatService');
const postModel = require('./models/postModel');
const userModel = require('./models/userModel');
const commentModel = require('./models/commentModel');
const likeModel = require('./models/likeModel');
const mineModel = require('./models/mineModel');

const app = express();

// 1. 配置 EJS 模板引擎
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// 2. 解析 POST 请求中的表单数据 / JSON 数据
app.use(express.urlencoded({ extended: false }));
app.use(express.json());

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

  // 阅读量 +1（先入库，再让本次页面也显示最新值）
  await postModel.incrementViewCount(req.params.id);
  post.view_count = (post.view_count || 0) + 1;

  const comments = await commentModel.getByPostId(req.params.id);
  const likeCount = await likeModel.countByPostId(req.params.id);
  const isLiked = req.session.user
    ? await likeModel.isLiked(req.session.user.id, req.params.id)
    : false;

  res.render('post', { post, comments, likeCount, isLiked });
});

// ========== 发表评论（需要登录） ==========
app.post('/posts/:id/comment', async (req, res) => {
  if (!req.session.user) return res.redirect('/login');

  const post = await postModel.getById(req.params.id);
  if (!post) return res.status(404).send('文章不存在');

  const { content } = req.body;
  if (!content || !content.trim()) {
    return res.redirect('/posts/' + req.params.id);
  }

  await commentModel.create(req.session.user.id, req.params.id, content.trim());
  res.redirect('/posts/' + req.params.id);
});

// ========== 点赞 / 取消点赞（需要登录，AJAX） ==========
app.post('/posts/:id/like', async (req, res) => {
  if (!req.session.user) return res.status(401).json({ error: '请先登录' });

  const post = await postModel.getById(req.params.id);
  if (!post) return res.status(404).json({ error: '文章不存在' });

  const result = await likeModel.toggle(req.session.user.id, req.params.id);
  res.json(result);
});

// ========== 编辑文章（需要登录） ==========
app.get('/posts/:id/edit', async (req, res) => {
  if (!req.session.user) return res.redirect('/login');

  const post = await postModel.getById(req.params.id);
  if (!post) return res.status(404).send('文章不存在');
  if (post.user_id !== req.session.user.id) return res.status(403).send('不能编辑别人的文章');

  res.render('edit', { post, error: null });
});

app.post('/posts/:id/edit', async (req, res) => {
  if (!req.session.user) return res.redirect('/login');

  const post = await postModel.getById(req.params.id);
  if (!post) return res.status(404).send('文章不存在');
  if (post.user_id !== req.session.user.id) return res.status(403).send('不能编辑别人的文章');

  const { title, content } = req.body;
  if (!title || !content) {
    return res.render('edit', { post, error: '标题和内容不能为空' });
  }

  await postModel.update(req.params.id, title, content);
  res.redirect('/posts/' + req.params.id);
});

// ========== 删除文章（需要登录） ==========
app.post('/posts/:id/delete', async (req, res) => {
  if (!req.session.user) return res.redirect('/login');

  const post = await postModel.getById(req.params.id);
  if (!post) return res.status(404).send('文章不存在');
  if (post.user_id !== req.session.user.id) return res.status(403).send('不能删除别人的文章');

  await postModel.delete(req.params.id);
  res.redirect('/');
});

// ========== 扫雷游戏 ==========
app.get('/games/minesweeper', (req, res) => {
  res.render('games/minesweeper', { title: '扫雷 - Lye\'s Blog' });
});

// 有效难度白名单
const VALID_DIFFICULTIES = ['beginner', 'intermediate', 'expert'];

// 成绩提交限流：每个 IP 每分钟最多 10 次
const saveLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: '提交过于频繁，请稍后再试' }
});

// 保存通关成绩（需要登录，AJAX）
app.post('/api/minesweeper/save', saveLimiter, async (req, res) => {
  if (!req.session.user) return res.status(401).json({ error: '请先登录' });

  const { difficulty, time_seconds } = req.body;
  const timeSeconds = parseInt(time_seconds, 10);

  if (!VALID_DIFFICULTIES.includes(difficulty)) {
    return res.status(400).json({ error: '难度不合法' });
  }
  if (!Number.isInteger(timeSeconds) || timeSeconds <= 0) {
    return res.status(400).json({ error: '用时不合法' });
  }

  const record = await mineModel.save(req.session.user.id, difficulty, timeSeconds);
  res.json({ success: true, record });
});

// 排行榜（公开）
app.get('/api/minesweeper/leaderboard', async (req, res) => {
  const difficulty = req.query.difficulty;
  if (!VALID_DIFFICULTIES.includes(difficulty)) {
    return res.status(400).json({ error: '难度不合法' });
  }
  const rows = await mineModel.getTop10(difficulty);
  res.json({ difficulty, leaderboard: rows });
});

// ========== 阅读统计仪表盘（需要登录） ==========
app.get('/stats', async (req, res) => {
  if (!req.session.user) return res.redirect('/login');
  const stats = await postModel.getViewStats();
  const totalViews = await postModel.getTotalViews();
  res.render('stats', {
    title: '阅读统计',
    stats,
    totalViews,
    postCount: stats.length
  });
});

// ========== 对话闲人（AI 聊天） ==========
// 聊天页
app.get('/chat', async (req, res) => {
  if (!req.session.user) return res.redirect('/login');
  const user = await userModel.getById(req.session.user.id);
  res.render('chat', {
    title: '对话闲人',
    freeChatCount: user ? user.free_chat_count : 0,
    hasOwnKey: !!(user && user.own_api_key)
  });
});

// 聊天接口限流：每 IP 每分钟最多 20 次（防刷爆 API 额度）
const chatLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: '聊天太频繁了，歇会儿再来～' }
});

app.post('/api/chat', chatLimiter, async (req, res) => {
  if (!req.session.user) return res.status(401).json({ error: '请先登录' });

  const { message } = req.body;
  if (!message || !message.trim()) {
    return res.status(400).json({ error: '消息不能为空' });
  }

  const result = await chatService.sendMessage(req.session.user.id, message.trim());
  if (result.error) {
    return res.status(400).json({ error: result.error });
  }
  res.json({ reply: result.reply, remaining: result.remaining });
});

// ========== API Key 设置（需要登录） ==========
app.get('/settings', async (req, res) => {
  if (!req.session.user) return res.redirect('/login');
  const user = await userModel.getById(req.session.user.id);
  const key = user && user.own_api_key ? user.own_api_key : '';
  res.render('settings', {
    title: 'API Key 设置',
    hasKey: !!key,
    // 只把后 4 位给前端，其余打码，避免泄露完整 Key
    maskedKey: key ? '••••••••' + key.slice(-4) : '',
    freeChatCount: user ? user.free_chat_count : 0,
    saved: req.query.saved === '1'
  });
});

app.post('/settings', async (req, res) => {
  if (!req.session.user) return res.redirect('/login');
  const { api_key } = req.body;
  await userModel.updateApiKey(req.session.user.id, (api_key || '').trim());
  res.redirect('/settings?saved=1');
});

// 启动服务器
const PORT = 3000;
app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});

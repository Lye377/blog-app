const express = require('express');
const db = require('./models/db');
const session = require('express-session');
const SQLiteStore = require('connect-sqlite3')(session);
const path = require('path');

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

// 5. 首页路由（先写个最简单的确认服务能跑）
app.get('/', (req, res) => {
    res.render('index', { user: req.session.user || null });
  });

// 6. 启动服务器
const PORT = 3000;
app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
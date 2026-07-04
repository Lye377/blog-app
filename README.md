# Lye's Blog

一个从零搭建的个人博客系统，作为 xlab 教学项目验收。除用户 / 博客 / 评论 / 点赞四大基础模块外，还实现了阅读统计、扫雷游戏、AI 对话三个进阶功能。

## 技术选型及理由

| 层 | 选什么 | 理由 |
|---|---|---|
| 运行时 | Node.js | 前后端一种语言，降低学习成本 |
| 框架 | Express | 最轻量的 Node.js Web 框架，路由/中间件概念清晰 |
| 模板 | EJS | 接近纯 HTML，嵌入极少量 JS 即可实现动态渲染 |
| 数据库 | SQLite | 零安装，整个数据库就是一个 .db 文件，适合小项目 |
| 密码安全 | bcryptjs | 单向哈希，密码不可逆存储 |
| 登录态 | express-session + connect-sqlite3 | Session 持久化到数据库，服务重启不丢失 |
| 接口限流 | express-rate-limit | 防止刷爆 API 额度 / 服务器 |
| 数据可视化 | Chart.js（CDN） | 阅读统计柱状图，无需安装 |
| AI 能力 | DeepSeek API | 通过服务端代理调用，实现「对话闲人」 |

## 功能列表

| 模块 | 说明 |
|------|------|
| 用户系统 | 注册 / 登录 / 登出，bcrypt 哈希 + session 登录态 |
| 博客文章 | 发布 / 查看 / 编辑 / 删除（含作者权限校验） |
| 评论 | 登录用户可在文章下评论 |
| 点赞 | AJAX toggle，同一用户对同一文章仅一次（数据库 UNIQUE 约束） |
| 阅读统计 | 记录每篇文章阅读量，Chart.js 柱状图 + 总量/文章数卡片 |
| 扫雷游戏 | 纯前端实现（三难度、flood fill、计时），成绩存后端排行榜 |
| 对话闲人 | 服务端代理 DeepSeek API 的 AI 聊天，免费 10 次 + 可填自己的 Key |

## 目录结构

```
blog-app/
├── app.js                    # 应用入口：Express 配置 + 全部路由 + 启动
├── models/                   # Model 层 — 和数据库打交道
│   ├── db.js                 # 数据库连接 + 建表 + ALTER 补字段
│   ├── userModel.js          # 用户（含 API Key、免费额度）
│   ├── postModel.js          # 文章（含阅读量、统计聚合）
│   ├── commentModel.js       # 评论
│   ├── likeModel.js          # 点赞
│   └── mineModel.js          # 扫雷成绩
├── services/                 # Service 层 — 业务逻辑
│   ├── authService.js        # 注册 / 登录逻辑
│   └── chatService.js        # DeepSeek API 代理 + 额度判断
├── views/                    # View 层 — EJS 模板
│   ├── index.ejs             # 首页（文章列表）
│   ├── login.ejs / register.ejs
│   ├── post.ejs              # 文章详情（评论 + 点赞）
│   ├── write.ejs / edit.ejs  # 写 / 编辑文章
│   ├── stats.ejs             # 阅读统计仪表盘
│   ├── chat.ejs              # 对话闲人
│   ├── settings.ejs          # API Key 设置
│   ├── games/
│   │   └── minesweeper.ejs   # 扫雷游戏 + 排行榜
│   └── partials/             # 可复用片段
│       ├── header.ejs        # 顶部导航
│       └── footer.ejs        # 页脚
├── public/                   # 静态资源（express.static 托管）
│   ├── css/
│   └── js/
│       └── utils.js          # 前端公共函数（escapeHtml 等）
├── data/                     # SQLite 数据库文件（自动生成，不进 git）
├── package.json              # 依赖清单
└── README.md                 # 本文件
```

**分层约定：** 路由（app.js）→ Service（业务逻辑）→ Model（数据库操作）。每一层只做自己该做的事。

## 数据库设计

### users 表

| 字段 | 类型 | 约束 | 说明 |
|------|------|------|------|
| id | INTEGER | PRIMARY KEY AUTOINCREMENT | 用户唯一标识 |
| username | TEXT | NOT NULL UNIQUE | 用户名，不可重复 |
| password_hash | TEXT | NOT NULL | bcrypt 哈希后的密码 |
| free_chat_count | INTEGER | DEFAULT 10 | AI 对话剩余免费次数 |
| own_api_key | TEXT | DEFAULT '' | 用户自己的 DeepSeek Key |
| created_at | DATETIME | DEFAULT CURRENT_TIMESTAMP | 注册时间 |
| updated_at | DATETIME | DEFAULT CURRENT_TIMESTAMP | 最后更新时间 |

### posts 表

| 字段 | 类型 | 约束 | 说明 |
|------|------|------|------|
| id | INTEGER | PRIMARY KEY AUTOINCREMENT | 文章唯一标识 |
| user_id | INTEGER | NOT NULL, FOREIGN KEY | 作者，关联 users(id) |
| title | TEXT | NOT NULL | 文章标题 |
| summary | TEXT | DEFAULT '' | 摘要 |
| content | TEXT | NOT NULL | 正文 |
| status | TEXT | DEFAULT 'published' | 状态（published/draft） |
| view_count | INTEGER | DEFAULT 0 | 阅读量 |
| created_at | DATETIME | DEFAULT CURRENT_TIMESTAMP | 创建时间 |
| updated_at | DATETIME | DEFAULT CURRENT_TIMESTAMP | 最后更新时间 |

### comments 表

| 字段 | 类型 | 约束 | 说明 |
|------|------|------|------|
| id | INTEGER | PRIMARY KEY AUTOINCREMENT | 评论唯一标识 |
| user_id | INTEGER | NOT NULL, FOREIGN KEY | 评论者，关联 users(id) |
| post_id | INTEGER | NOT NULL, FOREIGN KEY | 所属文章，关联 posts(id) |
| content | TEXT | NOT NULL | 评论内容 |
| created_at | DATETIME | DEFAULT CURRENT_TIMESTAMP | 评论时间 |

### likes 表

| 字段 | 类型 | 约束 | 说明 |
|------|------|------|------|
| id | INTEGER | PRIMARY KEY AUTOINCREMENT | 点赞唯一标识 |
| user_id | INTEGER | NOT NULL, FOREIGN KEY | 点赞者，关联 users(id) |
| post_id | INTEGER | NOT NULL, FOREIGN KEY | 被赞文章，关联 posts(id) |
| created_at | DATETIME | DEFAULT CURRENT_TIMESTAMP | 点赞时间 |

> `UNIQUE(user_id, post_id)` 联合唯一约束：同一用户对同一文章只能点赞一次。

### mine_scores 表

| 字段 | 类型 | 约束 | 说明 |
|------|------|------|------|
| id | INTEGER | PRIMARY KEY AUTOINCREMENT | 记录唯一标识 |
| user_id | INTEGER | NOT NULL, FOREIGN KEY | 玩家，关联 users(id) |
| difficulty | TEXT | NOT NULL | 难度（beginner/intermediate/expert） |
| time_seconds | INTEGER | NOT NULL | 通关用时（秒） |
| created_at | DATETIME | DEFAULT CURRENT_TIMESTAMP | 通关时间 |

**设计说明：**
- 注册不需要邮箱，只用用户名 + 密码；密码经 bcrypt 单向哈希后存储。
- `view_count`、`free_chat_count`、`own_api_key` 是后期新增字段，用 `ALTER TABLE ADD COLUMN`（空回调容错）补齐，避免删库丢数据。

## 路由规划

### 用户 & 首页

| 方法 | 路径 | 功能 | 状态 |
|------|------|------|------|
| GET | `/` | 首页（文章列表） | ✅ |
| GET / POST | `/register` | 注册页 / 处理注册 | ✅ |
| GET / POST | `/login` | 登录页 / 处理登录 | ✅ |
| GET | `/logout` | 退出登录 | ✅ |

### 博客文章

| 方法 | 路径 | 功能 | 状态 |
|------|------|------|------|
| GET / POST | `/posts/write` | 写文章页 / 发布 | ✅ |
| GET | `/posts/:id` | 文章详情（阅读量 +1） | ✅ |
| GET / POST | `/posts/:id/edit` | 编辑页 / 保存编辑 | ✅ |
| POST | `/posts/:id/delete` | 删除文章 | ✅ |

### 评论 & 点赞

| 方法 | 路径 | 功能 | 状态 |
|------|------|------|------|
| POST | `/posts/:id/comment` | 发表评论 | ✅ |
| POST | `/posts/:id/like` | 点赞 / 取消（AJAX，返回 JSON） | ✅ |

### 阅读统计

| 方法 | 路径 | 功能 | 状态 |
|------|------|------|------|
| GET | `/stats` | 阅读统计仪表盘（需登录） | ✅ |

### 扫雷游戏

| 方法 | 路径 | 功能 | 状态 |
|------|------|------|------|
| GET | `/games/minesweeper` | 游戏页 + 排行榜 | ✅ |
| POST | `/api/minesweeper/save` | 保存成绩（需登录，限流） | ✅ |
| GET | `/api/minesweeper/leaderboard` | 某难度前十排行榜 | ✅ |

### 对话闲人（AI）

| 方法 | 路径 | 功能 | 状态 |
|------|------|------|------|
| GET | `/chat` | 聊天页（需登录） | ✅ |
| POST | `/api/chat` | 发消息（需登录，限流，代理 DeepSeek） | ✅ |
| GET / POST | `/settings` | API Key 设置页 / 保存 | ✅ |

## 启动方式

```bash
# 1. 安装依赖
npm install

# 2.（可选）配置 AI 对话的服务端默认 Key
#    不配也能启动，只是「对话闲人」会提示去设置页填自己的 Key
export DEEPSEEK_API_KEY=sk-你的key

# 3. 启动服务
node app.js
#    开发时推荐用 nodemon 自动重启：npx nodemon app.js

# 4. 浏览器访问
# http://localhost:3000
```

## 开发约定

- 默认中文沟通，代码、命令、变量名用英文
- 密码、API Key 不进日志、不进 git、不返回前端（设置页只显示 Key 后 4 位）
- 数据库文件（`data/*.db`）不进 git
- 每 20 轮对话更新一次 `学习笔记.md`
- 功能截图放在 `screenshots/` 目录下

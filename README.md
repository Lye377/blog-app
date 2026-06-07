# Lye's Blog

一个从零搭建的个人博客系统，作为 xlab 教学项目验收。

## 技术选型及理由

| 层 | 选什么 | 理由 |
|---|---|---|
| 运行时 | Node.js | 前后端一种语言，降低学习成本 |
| 框架 | Express | 最轻量的 Node.js Web 框架，路由/中间件概念清晰 |
| 模板 | EJS | 接近纯 HTML，嵌入极少量 JS 即可实现动态渲染 |
| 数据库 | SQLite | 零安装，整个数据库就是一个 .db 文件，适合小项目 |
| 密码安全 | bcryptjs | 单向哈希，密码不可逆存储 |
| 登录态 | express-session + connect-sqlite3 | Session 持久化到数据库，服务重启不丢失 |

## 目录结构

```
blog-app/
├── app.js                  # 应用入口：Express 配置 + 路由 + 启动
├── models/                 # Model 层 — 和数据库打交道
│   ├── db.js               # 数据库连接 + 建表
│   └── userModel.js        # 用户相关数据库操作
├── services/               # Service 层 — 业务逻辑
│   └── authService.js      # 注册/登录逻辑
├── views/                  # View 层 — EJS 模板
│   ├── index.ejs           # 首页
│   ├── register.ejs        # 注册页
│   └── partials/           # 可复用页面片段
├── public/                 # 静态资源（CSS、前端 JS、图片）
├── data/                   # SQLite 数据库文件（自动生成）
├── package.json            # 依赖清单
└── README.md               # 本文件
```

**分层约定：** 路由（app.js）→ Service（业务逻辑）→ Model（数据库操作）。每一层只做自己该做的事。

## 数据库设计

### users 表

| 字段 | 类型 | 约束 | 说明 |
|------|------|------|------|
| id | INTEGER | PRIMARY KEY AUTOINCREMENT | 用户唯一标识 |
| username | TEXT | NOT NULL UNIQUE | 用户名，不可重复 |
| password_hash | TEXT | NOT NULL | bcrypt 哈希后的密码 |
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
| created_at | DATETIME | DEFAULT CURRENT_TIMESTAMP | 创建时间 |
| updated_at | DATETIME | DEFAULT CURRENT_TIMESTAMP | 最后更新时间 |

**设计说明：** 注册不需要邮箱，只用用户名 + 密码。密码经 bcrypt 单向哈希后存储，原文不可逆。

## 路由规划

| 方法 | 路径 | 功能 | 状态 |
|------|------|------|------|
| GET | `/` | 首页 | ✅ |
| GET | `/register` | 注册页面 | ⏳ |
| POST | `/register` | 处理注册 | ⏳ |
| GET | `/login` | 登录页面 | ⏳ |
| POST | `/login` | 处理登录 | ⏳ |
| GET | `/logout` | 退出登录 | ⏳ |

## 启动方式

```bash
# 1. 安装依赖
npm install

# 2. 启动服务
node app.js

# 3. 浏览器访问
# http://localhost:3000
```

## 开发约定

- 默认中文沟通，代码、命令、变量名用英文
- 密码不进日志、不进 git
- 每 15 轮对话更新一次 `学习笔记.md`
- 功能截图放在 `screenshots/` 目录下

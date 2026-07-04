const sqlite3 = require('sqlite3').verbose();
  const path = require('path');

  const dbPath = path.join(__dirname, '..', 'data', 'blog.db');
  const db = new sqlite3.Database(dbPath);

  // 开启 WAL 模式，读写并发性能更好
  db.run('PRAGMA journal_mode = WAL');

  // 建表（IF NOT EXISTS 确保只建一次）
  db.serialize(() => {
    // 用户表
    db.run(`
      CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT NOT NULL UNIQUE,
        password_hash TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // 文章表
    db.run(`
      CREATE TABLE IF NOT EXISTS posts (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        title TEXT NOT NULL,
        summary TEXT DEFAULT '',
        content TEXT NOT NULL,
        status TEXT DEFAULT 'published',
        view_count INTEGER DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id)
      )
    `);

    // 3. 评论表
    db.run(`
      CREATE TABLE IF NOT EXISTS comments (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        post_id INTEGER NOT NULL,
        content TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id),
        FOREIGN KEY (post_id) REFERENCES posts(id)
      )
    `);

    // 4. 点赞表（同一用户对同一文章只能点赞一次）
    db.run(`
      CREATE TABLE IF NOT EXISTS likes (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        post_id INTEGER NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        UNIQUE (user_id, post_id),
        FOREIGN KEY (user_id) REFERENCES users(id),
        FOREIGN KEY (post_id) REFERENCES posts(id)
      )
    `);

    // 5. 扫雷通关记录表
    db.run(`
      CREATE TABLE IF NOT EXISTS mine_scores (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        difficulty TEXT NOT NULL,
        time_seconds INTEGER NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id)
      )
    `);

    // 6. 给已有表补字段（ALTER TABLE ADD COLUMN）
    // 说明：CREATE TABLE IF NOT EXISTS 只建表、不改已存在表的结构。
    // 对于「后来才加的字段」，老数据库里的旧表不会自动多出这些列，
    // 所以用 ALTER TABLE 补齐。空回调 () => {} 用来吞掉「列已存在」的报错，
    // 这样重复启动、或全新数据库（建表时已含该列）都不会崩。
    db.run('ALTER TABLE posts ADD COLUMN view_count INTEGER DEFAULT 0', () => {});
    db.run('ALTER TABLE users ADD COLUMN free_chat_count INTEGER DEFAULT 10', () => {});
    db.run("ALTER TABLE users ADD COLUMN own_api_key TEXT DEFAULT ''", () => {});

  });

  module.exports = db;
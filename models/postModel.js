const db = require('./db');

const postModel = {
  // 查所有文章（按时间倒序）
  getAll() {
    return new Promise((resolve, reject) => {
      db.all(
        `SELECT posts.*, users.username
         FROM posts
         JOIN users ON posts.user_id = users.id
         ORDER BY posts.created_at DESC`,
        (err, rows) => {
          if (err) return reject(err);
          resolve(rows);
        }
      );
    });
  },

  // 查单篇文章
  getById(id) {
    return new Promise((resolve, reject) => {
      db.get(
        `SELECT posts.*, users.username
         FROM posts
         JOIN users ON posts.user_id = users.id
         WHERE posts.id = ?`,
        [id],
        (err, row) => {
          if (err) return reject(err);
          resolve(row);
        }
      );
    });
  },

  // 创建文章
  create(userId, title, content) {
    return new Promise((resolve, reject) => {
      db.run(
        'INSERT INTO posts (user_id, title, content) VALUES (?, ?, ?)',
        [userId, title, content],
        function (err) {
          if (err) return reject(err);
          resolve({ id: this.lastID, userId, title, content });
        }
      );
    });
  },

  // 更新文章
  update(id, title, content) {
    return new Promise((resolve, reject) => {
      db.run(
        'UPDATE posts SET title = ?, content = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
        [title, content, id],
        function (err) {
          if (err) return reject(err);
          resolve({ changes: this.changes });
        }
      );
    });
  },

  // 删除文章
  delete(id) {
    return new Promise((resolve, reject) => {
      db.run('DELETE FROM posts WHERE id = ?', [id], function (err) {
        if (err) return reject(err);
        resolve({ changes: this.changes });
      });
    });
  },
  // 阅读量 +1
  incrementViewCount(id) {
    return new Promise((resolve, reject) => {
      db.run(
        'UPDATE posts SET view_count = view_count + 1 WHERE id = ?',
        [id],
        function (err) {
          if (err) return reject(err);
          resolve({ changes: this.changes });
        }
      );
    });
  },

  // 每篇文章的阅读统计（标题 + 阅读量 + 时间，按阅读量倒序）
  getViewStats() {
    return new Promise((resolve, reject) => {
      db.all(
        'SELECT title, view_count, created_at FROM posts ORDER BY view_count DESC, created_at DESC',
        (err, rows) => {
          if (err) return reject(err);
          resolve(rows);
        }
      );
    });
  },

  // 全站阅读总量（COALESCE 把 NULL 兜底成 0，空表也返回 0）
  getTotalViews() {
    return new Promise((resolve, reject) => {
      db.get(
        'SELECT COALESCE(SUM(view_count), 0) AS total FROM posts',
        (err, row) => {
          if (err) return reject(err);
          resolve(row.total);
        }
      );
    });
  }
};

module.exports = postModel;
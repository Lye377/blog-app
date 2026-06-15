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
  }
};

module.exports = postModel;
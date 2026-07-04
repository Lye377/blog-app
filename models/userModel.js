const db = require('./db');

  const userModel = {
    // 查用户（按用户名）
    getByUsername(username) {
      return new Promise((resolve, reject) => {
        db.get('SELECT * FROM users WHERE username = ?', [username], (err, row) => {
          if (err) return reject(err);
          resolve(row);
        });
      });
    },

    // 查用户（按 id）——用于获取 free_chat_count、own_api_key 等
    getById(id) {
      return new Promise((resolve, reject) => {
        db.get('SELECT * FROM users WHERE id = ?', [id], (err, row) => {
          if (err) return reject(err);
          resolve(row);
        });
      });
    },

    // 创建用户
    create(username, passwordHash) {
      return new Promise((resolve, reject) => {
        db.run(
          'INSERT INTO users (username, password_hash) VALUES (?, ?)',
          [username, passwordHash],
          function (err) {
            if (err) return reject(err);
            resolve({ id: this.lastID, username });
          }
        );
      });
    },

    // 更新用户自己的 DeepSeek API Key
    updateApiKey(userId, apiKey) {
      return new Promise((resolve, reject) => {
        db.run(
          'UPDATE users SET own_api_key = ? WHERE id = ?',
          [apiKey, userId],
          function (err) {
            if (err) return reject(err);
            resolve({ changes: this.changes });
          }
        );
      });
    },

    // 免费额度 -1（WHERE 加 free_chat_count > 0 防止减成负数）
    decrementFreeChat(userId) {
      return new Promise((resolve, reject) => {
        db.run(
          'UPDATE users SET free_chat_count = free_chat_count - 1 WHERE id = ? AND free_chat_count > 0',
          [userId],
          function (err) {
            if (err) return reject(err);
            resolve({ changes: this.changes });
          }
        );
      });
    }
  };

  module.exports = userModel;
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
    }
  };

  module.exports = userModel;
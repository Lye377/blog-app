const db = require('./db');

const mineModel = {
  // 保存一条通关记录
  save(userId, difficulty, timeSeconds) {
    return new Promise((resolve, reject) => {
      db.run(
        'INSERT INTO mine_scores (user_id, difficulty, time_seconds) VALUES (?, ?, ?)',
        [userId, difficulty, timeSeconds],
        function (err) {
          if (err) return reject(err);
          resolve({ id: this.lastID, userId, difficulty, timeSeconds });
        }
      );
    });
  },

  // 查某个难度的前十名（JOIN users 拿 username，用时正序）
  getTop10(difficulty) {
    return new Promise((resolve, reject) => {
      db.all(
        `SELECT mine_scores.*, users.username
         FROM mine_scores
         JOIN users ON mine_scores.user_id = users.id
         WHERE mine_scores.difficulty = ?
         ORDER BY mine_scores.time_seconds ASC, mine_scores.created_at ASC
         LIMIT 10`,
        [difficulty],
        (err, rows) => {
          if (err) return reject(err);
          resolve(rows);
        }
      );
    });
  }
};

module.exports = mineModel;

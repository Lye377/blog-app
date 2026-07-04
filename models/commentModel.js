const db = require('./db');

const commentModel = {
  // 查某篇文章的所有评论（JOIN users 拿 username，按时间正序）
  getByPostId(postId) {
    return new Promise((resolve, reject) => {
      db.all(
        `SELECT comments.*, users.username
         FROM comments
         JOIN users ON comments.user_id = users.id
         WHERE comments.post_id = ?
         ORDER BY comments.created_at ASC`,
        [postId],
        (err, rows) => {
          if (err) return reject(err);
          resolve(rows);
        }
      );
    });
  },

  // 创建评论
  create(userId, postId, content) {
    return new Promise((resolve, reject) => {
      db.run(
        'INSERT INTO comments (user_id, post_id, content) VALUES (?, ?, ?)',
        [userId, postId, content],
        function (err) {
          if (err) return reject(err);
          resolve({ id: this.lastID, userId, postId, content });
        }
      );
    });
  }
};

module.exports = commentModel;

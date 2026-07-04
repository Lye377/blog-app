const db = require('./db');

const likeModel = {
  // 返回某篇文章的点赞总数
  countByPostId(postId) {
    return new Promise((resolve, reject) => {
      db.get(
        'SELECT COUNT(*) AS count FROM likes WHERE post_id = ?',
        [postId],
        (err, row) => {
          if (err) return reject(err);
          resolve(row.count);
        }
      );
    });
  },

  // 返回当前用户是否已点赞该文章
  isLiked(userId, postId) {
    return new Promise((resolve, reject) => {
      db.get(
        'SELECT 1 FROM likes WHERE user_id = ? AND post_id = ?',
        [userId, postId],
        (err, row) => {
          if (err) return reject(err);
          resolve(!!row);
        }
      );
    });
  },

  // 切换点赞状态：已点则取消，未点则新增。返回 { liked, count }
  async toggle(userId, postId) {
    const liked = await this.isLiked(userId, postId);
    await new Promise((resolve, reject) => {
      if (liked) {
        db.run(
          'DELETE FROM likes WHERE user_id = ? AND post_id = ?',
          [userId, postId],
          (err) => (err ? reject(err) : resolve())
        );
      } else {
        db.run(
          'INSERT INTO likes (user_id, post_id) VALUES (?, ?)',
          [userId, postId],
          (err) => (err ? reject(err) : resolve())
        );
      }
    });
    const count = await this.countByPostId(postId);
    return { liked: !liked, count };
  }
};

module.exports = likeModel;

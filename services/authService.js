const bcrypt = require('bcryptjs');
const userModel = require('../models/userModel');

const authService = {
    async register(username, password) {
        const existByUsername = await userModel.getByUsername(username);
        if (existByUsername) {
          return { success: false, error: '该用户名已被使用' };
        }
        const passwordHash = await bcrypt.hash(password, 10);
        const user = await userModel.create(username, passwordHash);
        return { success: true, user };
    },

    async login(username, password) {
        const user = await userModel.getByUsername(username);
        if (!user) {
          return { success: false, error: '用户名或密码错误' };
        }
        const isMatch = await bcrypt.compare(password, user.password_hash);
        if (!isMatch) {
          return { success: false, error: '用户名或密码错误' };
        }
        return { success: true, user: { id: user.id, username: user.username } };
    }
};

module.exports = authService;

const bcrypt = require('bcryptjs');
const userModel = require('../models/userModel');

const authService = {
    async register(username, password) {
        const existByUsername = await userModel.getByUsername(username);
        if (existByUsername) {
          return { success: false, error: '该用户名已被使用' };
        }
        const passwordHash = await bcrypt.hash(password, 10);
        // 第一个注册的用户自动成为站长（个人博客：站长才能写文章）
        const isAdmin = (await userModel.count()) === 0;
        const user = await userModel.create(username, passwordHash, isAdmin);
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
        // is_admin 存进 session，模板和路由据此判断能否写/管文章
        return { success: true, user: { id: user.id, username: user.username, is_admin: user.is_admin } };
    }
};

module.exports = authService;

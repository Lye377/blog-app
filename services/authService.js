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
    }
};

module.exports = authService;

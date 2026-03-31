const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { query } = require('../config/db');
const router = express.Router();

const PERMISSIONS = {
  SUPER_ADMIN: 1,
  COMPANY_ADMIN: 2,
  OPERATOR: 3,
  REGISTERED: 4
};

// 注册
router.post('/register', async (req, res) => {
  try {
    const { username, password, phone, email, companyId } = req.body;

    const existing = await query('SELECT id FROM users WHERE username = ?', [username]);
    if (existing.length > 0) {
      return res.status(400).json({ message: '用户名已存在' });
    }

    const hashedPassword = bcrypt.hashSync(password, 10);

    const result = await query(
          `INSERT INTO users (username, password, phone, email, company_id, permission_level, role) 
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [username, hashedPassword, phone, email, companyId || null, PERMISSIONS.REGISTERED, '注册人员']
    );

    res.json({
      success: true,
      message: '注册成功，请等待管理员审核',
      userId: result.insertId
    });
  } catch (error) {
    console.error('注册错误:', error);
    res.status(500).json({ message: '服务器错误' });
  }
});

// 登录
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;

    console.log('登录尝试:', username);

    const users = await query(
        `SELECT u.*, c.name as company_name 
       FROM users u 
       LEFT JOIN companies c ON u.company_id = c.id 
       WHERE u.username = ?`,
        [username]
    );

    if (users.length === 0) {
      return res.status(401).json({ message: '用户名或密码错误' });
    }

    const user = users[0];

    // 正常 bcrypt 验证
    const isValid = bcrypt.compareSync(password, user.password);

    console.log('验证结果:', isValid);

    if (!isValid) {
      return res.status(401).json({ message: '用户名或密码错误' });
    }

    if (user.permission_level === PERMISSIONS.REGISTERED) {
      return res.status(403).json({
        message: '账号正在审核中，请联系管理员开通权限',
        permissionLevel: user.permission_level
      });
    }

    const token = jwt.sign(
        {
          userId: user.id,
          username: user.username,
          permissionLevel: user.permission_level,
          companyId: user.company_id
        },
        process.env.JWT_SECRET,
        { expiresIn: '7d' }
    );

    delete user.password;

    res.json({
      success: true,
      token,
      userInfo: {
        id: user.id,
        username: user.username,
        role: user.role,
        age: user.age,
        phone: user.phone,
        email: user.email,
        department: user.department,
        permissionLevel: user.permission_level,
        companyId: user.company_id,
        // ... 其他字段
      }
    });
  } catch (error) {
    console.error('登录错误:', error);
    res.status(500).json({ message: '服务器错误' });
  }
});


// 获取当前用户信息
router.get('/user', async (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
      return res.status(401).json({ message: '未登录' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const users = await query(
          `SELECT u.id, u.username, u.age, u.phone, u.email, 
              u.department, u.role, u.permission_level, u.avatar,
              u.company_id, c.name as company_name
       FROM users u 
       LEFT JOIN companies c ON u.company_id = c.id 
       WHERE u.id = ?`,
        [decoded.userId]
    );

    if (users.length === 0) {
      return res.status(404).json({ message: '用户不存在' });
    }

    res.json({ success: true, userInfo: users[0] });
  } catch (error) {
    res.status(401).json({ message: '登录已过期' });
  }
});

// 获取用户列表
router.get('/users', async (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
      return res.status(401).json({ message: '未登录' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const { permissionLevel, companyId } = decoded;

    let sql = `
      SELECT u.id, u.username, u.phone, u.email, u.role, 
             u.permission_level, u.created_at,
             c.name as company_name
      FROM users u 
      LEFT JOIN companies c ON u.company_id = c.id 
      WHERE 1=1
    `;
    const params = [];

    if (permissionLevel === PERMISSIONS.SUPER_ADMIN) {
      if (req.query.companyId) {
        sql += ' AND u.company_id = ?';
        params.push(req.query.companyId);
      }
    } else if (permissionLevel === PERMISSIONS.COMPANY_ADMIN) {
      sql += ' AND u.company_id = ? AND u.permission_level > ?';
      params.push(companyId, permissionLevel);
    } else {
      return res.status(403).json({ message: '无权查看用户列表' });
    }

    sql += ' ORDER BY u.created_at DESC';

    const users = await query(sql, params);
    res.json({ success: true, data: users });
  } catch (error) {
    console.error('获取用户列表错误:', error);
    res.status(500).json({ message: '获取失败' });
  }
});

// 修改用户权限
router.put('/users/:id/permission', async (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
      return res.status(401).json({ message: '未登录' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const { permissionLevel, companyId } = decoded;
    const targetUserId = req.params.id;
    const { newPermissionLevel, newCompanyId } = req.body;

    if (targetUserId == decoded.userId) {
      return res.status(400).json({ message: '不能修改自己的权限' });
    }

    const [targetUser] = await query(
        'SELECT permission_level, company_id FROM users WHERE id = ?',
        [targetUserId]
    );

    if (!targetUser) {
      return res.status(404).json({ message: '用户不存在' });
    }

    if (permissionLevel === PERMISSIONS.COMPANY_ADMIN) {
      if (targetUser.company_id !== companyId) {
        return res.status(403).json({ message: '无权修改其他公司用户' });
      }
      if (targetUser.permission_level <= permissionLevel) {
        return res.status(403).json({ message: '无权修改同级或上级用户' });
      }
      if (newPermissionLevel <= permissionLevel) {
        return res.status(403).json({ message: '不能提升用户到同级或更高级别' });
      }
    }

    await query(
        'UPDATE users SET permission_level = ?, company_id = ?, updated_at = NOW() WHERE id = ?',
        [newPermissionLevel, newCompanyId || targetUser.company_id, targetUserId]
    );

    res.json({
      success: true,
      message: '权限修改成功'
    });
  } catch (error) {
    console.error('修改权限错误:', error);
    res.status(500).json({ message: '修改失败' });
  }
});

// 删除用户
router.delete('/users/:id', async (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
      return res.status(401).json({ message: '未登录' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const targetUserId = req.params.id;

    const [targetUser] = await query(
        'SELECT permission_level, company_id FROM users WHERE id = ?',
        [targetUserId]
    );

    if (!targetUser) {
      return res.status(404).json({ message: '用户不存在' });
    }

    if (decoded.permissionLevel === PERMISSIONS.COMPANY_ADMIN) {
      if (targetUser.company_id !== decoded.companyId ||
          targetUser.permission_level <= decoded.permissionLevel) {
        return res.status(403).json({ message: '无权删除该用户' });
      }
    }

    await query('DELETE FROM users WHERE id = ?', [targetUserId]);
    res.json({ success: true, message: '用户已删除' });
  } catch (error) {
    res.status(500).json({ message: '删除失败' });
  }
});

// 获取公司列表
router.get('/companies', async (req, res) => {
  try {
    const companies = await query('SELECT id, name FROM companies ORDER BY name');
    res.json({ success: true, data: companies });
  } catch (error) {
    res.status(500).json({ message: '获取失败' });
  }
});

// 紧急模式
router.post('/emergency', async (req, res) => {
  const { emergencyKey } = req.body;

  if (emergencyKey === process.env.EMERGENCY_PASSWORD) {
    const token = jwt.sign(
        {
          userId: 0,
          username: 'emergency',
          permissionLevel: PERMISSIONS.SUPER_ADMIN,
          isEmergency: true
        },
        process.env.JWT_SECRET,
        { expiresIn: '4h' }
    );

    res.json({
      success: true,
      token,
      message: '紧急模式已激活'
    });
  } else {
    res.status(401).json({ message: '紧急密码错误' });
  }
});

module.exports = router;
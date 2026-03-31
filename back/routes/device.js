const express = require('express');
const { query } = require('../config/db');
const router = express.Router();

// 获取设备列表
router.get('/', async (req, res) => {
    try {
        const token = req.headers.authorization?.split(' ')[1];
        if (!token) {
            return res.status(401).json({ message: '未登录' });
        }

        const jwt = require('jsonwebtoken');
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const { permissionLevel, companyId, userId } = decoded;

        // 查询现有表结构的所有字段
        let sql = `SELECT * FROM devices WHERE 1=1`;
        const params = [];

        // 权限过滤：非超级管理员只能看自己创建的设备
        if (permissionLevel > 1) {
            sql += ' AND user_id = ?';
            params.push(userId);
        }

        sql += ' ORDER BY created_at DESC';

        const devices = await query(sql, params);

        // 处理 source_type：根据 url 判断是否为本地摄像头
        const devicesWithSource = devices.map(d => ({
            ...d,
            // 如果 url 包含 local:// 则认为是本地设备
            source_type: d.url && d.url.startsWith('local://') ? 'local' : 'network',
            // 确保状态有值
            status: d.status || 'offline'
        }));

        res.json({ success: true, data: devicesWithSource });
    } catch (error) {
        console.error('获取设备列表错误:', error);
        res.status(500).json({ message: '获取失败' });
    }
});

// 添加设备
router.post('/', async (req, res) => {
    try {
        const token = req.headers.authorization?.split(' ')[1];
        const jwt = require('jsonwebtoken');
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        const { name, location, type, url, meter_type, unit } = req.body;

        // 使用现有表字段插入
        const result = await query(
            `INSERT INTO devices 
       (name, location, type, url, meter_type, unit, user_id, status) 
       VALUES (?, ?, ?, ?, ?, ?, ?, 'offline')`,
            [name, location, type, url, meter_type || 'electric', unit || 'kWh', decoded.userId]
        );

        res.json({
            success: true,
            id: result.insertId,
            message: '设备添加成功'
        });
    } catch (error) {
        console.error('添加设备错误:', error);
        res.status(500).json({ message: '添加失败' });
    }
});

// 更新设备
router.put('/:id', async (req, res) => {
    try {
        const token = req.headers.authorization?.split(' ')[1];
        const jwt = require('jsonwebtoken');
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        const { name, location, status, url, meter_type, unit } = req.body;

        // 检查权限
        const [device] = await query('SELECT user_id FROM devices WHERE id = ?', [req.params.id]);
        if (!device) {
            return res.status(404).json({ message: '设备不存在' });
        }

        if (decoded.permissionLevel > 1 && device.user_id !== decoded.userId) {
            return res.status(403).json({ message: '无权修改此设备' });
        }

        await query(
            `UPDATE devices SET 
        name=?, location=?, status=?, url=?, meter_type=?, unit=?
       WHERE id=?`,
            [name, location, status, url, meter_type, unit, req.params.id]
        );

        res.json({ success: true, message: '设备更新成功' });
    } catch (error) {
        res.status(500).json({ message: '更新失败' });
    }
});

// 删除设备
router.delete('/:id', async (req, res) => {
    try {
        const token = req.headers.authorization?.split(' ')[1];
        const jwt = require('jsonwebtoken');
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        const [device] = await query('SELECT user_id FROM devices WHERE id = ?', [req.params.id]);
        if (!device) {
            return res.status(404).json({ message: '设备不存在' });
        }

        if (decoded.permissionLevel > 1 && device.user_id !== decoded.userId) {
            return res.status(403).json({ message: '无权删除此设备' });
        }

        await query('DELETE FROM devices WHERE id=?', [req.params.id]);
        res.json({ success: true, message: '设备已删除' });
    } catch (error) {
        res.status(500).json({ message: '删除失败' });
    }
});

module.exports = router;
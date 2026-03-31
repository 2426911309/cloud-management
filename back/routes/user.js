const express = require('express');
const bcrypt = require('bcryptjs');
const { query } = require('../config/db');
const { verifyToken, requirePermission, PERMISSIONS } = require('../middleware/auth');
const router = express.Router();

// 更新用户信息（自己或上级可修改）
router.put('/info', verifyToken, async (req, res) => {
    try {
        const { username, age, phone, email, department, avatar, targetUserId } = req.body;
        const currentUserId = req.user.userId;
        const currentLevel = req.user.permissionLevel;

        // 确定要修改的用户ID（管理员可以修改他人，其他人只能修改自己）
        let userIdToUpdate = currentUserId;
        if (targetUserId && targetUserId !== currentUserId) {
            // 检查是否有权修改他人
            if (currentLevel > PERMISSIONS.COMPANY_ADMIN) {
                return res.status(403).json({ message: '无权修改他人信息' });
            }

            // 检查目标用户是否在自己管辖范围内
            const [targetUser] = await query(
                'SELECT company_id, permission_level FROM users WHERE id = ?',
                [targetUserId]
            );

            if (!targetUser) {
                return res.status(404).json({ message: '目标用户不存在' });
            }

            if (currentLevel === PERMISSIONS.COMPANY_ADMIN) {
                if (targetUser.company_id !== req.user.companyId ||
                    targetUser.permission_level <= currentLevel) {
                    return res.status(403).json({ message: '无权修改该用户信息' });
                }
            }

            userIdToUpdate = targetUserId;
        }

        await query(
            `UPDATE users SET 
        username = ?, age = ?, phone = ?, email = ?, 
        department = ?, avatar = ?, updated_at = NOW() 
       WHERE id = ?`,
            [username, age, phone, email, department, avatar, userIdToUpdate]
        );

        // 返回更新后的信息
        const [users] = await query(
            `SELECT u.id, u.username, u.age, u.phone, u.email, 
              u.department, u.role, u.permission_level, u.avatar,
              u.company_id, c.name as company_name
       FROM users u 
       LEFT JOIN companies c ON u.company_id = c.id 
       WHERE u.id = ?`,
            [userIdToUpdate]
        );

        res.json({ success: true, data: users[0] });
    } catch (error) {
        console.error('更新用户信息错误:', error);
        res.status(500).json({ message: '更新失败' });
    }
});

// 修改密码（只能修改自己的）
router.put('/password', verifyToken, async (req, res) => {
    try {
        const { oldPassword, newPassword } = req.body;
        const userId = req.user.userId;

        // 验证旧密码
        const [users] = await query('SELECT password FROM users WHERE id = ?', [userId]);
        if (users.length === 0) {
            return res.status(404).json({ message: '用户不存在' });
        }

        const isValid = bcrypt.compareSync(oldPassword, users[0].password);
        if (!isValid) {
            return res.status(400).json({ message: '原密码错误' });
        }

        // 更新新密码
        const hashedPassword = bcrypt.hashSync(newPassword, 10);
        await query('UPDATE users SET password = ? WHERE id = ?', [hashedPassword, userId]);

        res.json({ success: true, message: '密码修改成功，请重新登录' });
    } catch (error) {
        console.error('修改密码错误:', error);
        res.status(500).json({ message: '修改失败' });
    }
});

// 重置密码（管理员功能）
router.put('/reset-password/:id', verifyToken, requirePermission(PERMISSIONS.COMPANY_ADMIN), async (req, res) => {
    try {
        const { id } = req.params;
        const { newPassword } = req.body;
        const currentLevel = req.user.permissionLevel;
        const companyId = req.user.companyId;

        // 获取目标用户
        const [targetUser] = await query(
            'SELECT company_id, permission_level FROM users WHERE id = ?',
            [id]
        );

        if (!targetUser) {
            return res.status(404).json({ message: '用户不存在' });
        }

        // 权限检查
        if (currentLevel === PERMISSIONS.COMPANY_ADMIN) {
            if (targetUser.company_id !== companyId || targetUser.permission_level <= currentLevel) {
                return res.status(403).json({ message: '无权重置该用户密码' });
            }
        }

        const hashedPassword = bcrypt.hashSync(newPassword || '123456', 10);
        await query('UPDATE users SET password = ? WHERE id = ?', [hashedPassword, id]);

        res.json({ success: true, message: '密码已重置' });
    } catch (error) {
        res.status(500).json({ message: '重置失败' });
    }
});

// 获取个人中心统计数据
router.get('/dashboard-stats', verifyToken, async (req, res) => {
    try {
        const userId = req.user.userId;
        const permissionLevel = req.user.permissionLevel;
        const companyId = req.user.companyId;

        // 1. 获取设备总数和在线数（根据权限）
        let deviceSql = 'SELECT id, status FROM devices WHERE 1=1';
        const deviceParams = [];
        if (permissionLevel !== 1) { // 非超级管理员只能看自己公司的设备
            deviceSql += ' AND company_id = ?';
            deviceParams.push(companyId);
        }
        const devices = await query(deviceSql, deviceParams);
        const totalDevices = devices.length;
        const onlineDevices = devices.filter(d => d.status === 'online').length;
        const onlineRate = totalDevices ? ((onlineDevices / totalDevices) * 100).toFixed(1) : 0;

        // 2. 获取本月巡检次数（当月内该用户/公司的识别记录数）
        const now = new Date();
        const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        let inspectionSql = `
            SELECT COUNT(*) as count
            FROM recognition_logs r
            JOIN devices d ON r.device_id = d.id
            WHERE r.recognized_at >= ?
        `;
        const inspectionParams = [firstDayOfMonth];
        if (permissionLevel !== 1) {
            inspectionSql += ' AND d.company_id = ?';
            inspectionParams.push(companyId);
        }
        const inspectionResult = await query(inspectionSql, inspectionParams);
        const monthlyInspections = inspectionResult[0]?.count || 0;

        res.json({
            success: true,
            data: {
                totalDevices,
                onlineRate,
                monthlyInspections
            }
        });
    } catch (error) {
        console.error('获取个人中心统计数据失败:', error);
        res.status(500).json({ message: error.message });
    }
});

module.exports = router;
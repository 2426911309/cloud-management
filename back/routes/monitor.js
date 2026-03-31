const express = require('express');
const router = express.Router();  // ← 添加这一行
const { query } = require('../config/db');
const { verifyToken, requirePermission, checkCompanyAccess, PERMISSIONS } = require('../middleware/auth');

// 获取12小时历史数据
router.get('/history/:deviceId', verifyToken, async (req, res) => {
    try {
        const data = [];
        const now = new Date();
        for (let i = 12; i >= 0; i--) {
            const time = new Date(now.getTime() - i * 60 * 60 * 1000);
            data.push({
                time: time.getHours() + ':00',
                value: (1200 + Math.random() * 50 + (12 - i) * 8).toFixed(1)
            });
        }
        res.json(data);
    } catch (error) {
        res.status(500).json({ message: '获取失败' });
    }
});

// 获取实时识别结果
router.get('/recognition/:deviceId', verifyToken, async (req, res) => {
    try {
        res.json({
            meterValue: (1234 + Math.random() * 10).toFixed(1),
            confidence: 0.95 + Math.random() * 0.04,
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        res.status(500).json({ message: '识别失败' });
    }
});

module.exports = router;
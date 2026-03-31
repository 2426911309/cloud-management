const express = require('express');
const router = express.Router();
const { query } = require('../config/db');
const { verifyToken } = require('../middleware/auth');

// 获取设备历史读数（默认12小时）
router.get('/history/:deviceId', verifyToken, async (req, res) => {
    try {
        const { deviceId } = req.params;
        const { start, end } = req.query;
        // 默认最近12小时
        let startTime = start ? new Date(start) : new Date(Date.now() - 12 * 60 * 60 * 1000);
        let endTime = end ? new Date(end) : new Date();

        const sql = `
            SELECT recognized_at AS time, meter_value AS value
            FROM recognition_logs
            WHERE device_id = ? AND recognized_at BETWEEN ? AND ?
            ORDER BY recognized_at ASC
        `;
        const results = await query(sql, [deviceId, startTime, endTime]);

        // 返回格式与前端 ECharts 兼容
        res.json(results.map(r => ({
            time: new Date(r.time).toLocaleTimeString(),
            value: r.value
        })));
    } catch (error) {
        console.error('错误接口:', req.originalUrl);
        console.error('错误详情:', error);
        res.status(500).json({ message: error.message });
    }
});

// 设备能耗对比（本月累计用电量）
router.get('/devices/compare', verifyToken, async (req, res) => {
    try {
        const { metric = 'electric' } = req.query;  // electric / water
        const userId = req.user.userId;
        const userLevel = req.user.permissionLevel;
        const companyId = req.user.companyId;

        // 根据权限获取设备列表
        let deviceSql = `
            SELECT id, name, meter_type
            FROM devices
            WHERE 1=1
        `;
        const params = [];
        if (userLevel === 1) {
            // 超级管理员可看全部
        } else {
            deviceSql += ` AND company_id = ?`;
            params.push(companyId);
        }
        const devices = await query(deviceSql, params);

        // 计算本月累计（以电表为例）
        const now = new Date();
        const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        const results = [];
        for (const device of devices) {
            // 若设备表计类型不匹配，跳过（可根据metric过滤）
            if (metric === 'electric' && device.meter_type !== 'electric') continue;
            if (metric === 'water' && device.meter_type !== 'water') continue;

            const logSql = `
                SELECT meter_value
                FROM recognition_logs
                WHERE device_id = ? AND recognized_at >= ?
                ORDER BY recognized_at DESC
                LIMIT 1
            `;
            const lastReading = await query(logSql, [device.id, firstDayOfMonth]);
            if (lastReading.length > 0) {
                results.push({
                    name: device.name,
                    value: parseFloat(lastReading[0].meter_value)
                });
            }
        }
        res.json(results);
    } catch (error) {
        console.error('错误接口:', req.originalUrl);
        console.error('错误详情:', error);
        res.status(500).json({ message: error.message });
    }
});

// 识别准确率统计（最近7天平均置信度）
router.get('/accuracy', verifyToken, async (req, res) => {
    try {
        const { days = 7 } = req.query;
        const startTime = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
        const sql = `
            SELECT 
                DATE(recognized_at) as date,
                AVG(confidence) as avg_confidence,
                COUNT(*) as total,
                SUM(CASE WHEN confidence >= 0.8 THEN 1 ELSE 0 END) as high_conf_count
            FROM recognition_logs
            WHERE recognized_at >= ?
            GROUP BY DATE(recognized_at)
            ORDER BY date ASC
        `;
        const results = await query(sql, [startTime]);
        res.json(results.map(row => ({
            date: row.date,
            avgConfidence: parseFloat(row.avg_confidence).toFixed(2),
            total: row.total,
            highRate: (row.high_conf_count / row.total * 100).toFixed(1)
        })));
    } catch (error) {
        console.error('错误接口:', req.originalUrl);
        console.error('错误详情:', error);
        res.status(500).json({ message: error.message });
    }
});

// 获取统计卡片数据
router.get('/statistics', verifyToken, async (req, res) => {
    try {
        const userLevel = req.user.permissionLevel;
        const companyId = req.user.companyId;

        // 构建设备查询条件（根据权限过滤）
        let deviceSql = 'SELECT status FROM devices WHERE 1=1';
        const deviceParams = [];
        if (userLevel !== 1) { // 非超级管理员
            deviceSql += ' AND company_id = ?';
            deviceParams.push(companyId);
        }
        const devices = await query(deviceSql, deviceParams);
        const totalDevices = devices.length;
        const onlineDevices = devices.filter(d => d.status === 'online').length;
        const onlineRate = totalDevices ? ((onlineDevices / totalDevices) * 100).toFixed(1) : 0;

        // 今日识别次数
        const todayStart = new Date().setHours(0, 0, 0, 0);
        const todayEnd = new Date().setHours(23, 59, 59, 999);
        let recognitionSql = `
            SELECT COUNT(*) as count
            FROM recognition_logs r
            JOIN devices d ON r.device_id = d.id
            WHERE r.recognized_at BETWEEN ? AND ?
        `;
        const recognitionParams = [new Date(todayStart), new Date(todayEnd)];
        if (userLevel !== 1) {
            recognitionSql += ' AND d.company_id = ?';
            recognitionParams.push(companyId);
        }
        const recognitionResult = await query(recognitionSql, recognitionParams);
        const todayRecognition = recognitionResult[0]?.count || 0;

        // 异常告警（最近24小时置信度低于0.7的识别记录）
        let lowConfidenceSql = `
            SELECT COUNT(*) as count
            FROM recognition_logs r
            JOIN devices d ON r.device_id = d.id
            WHERE r.confidence < 0.7 AND r.recognized_at >= DATE_SUB(NOW(), INTERVAL 1 DAY)
        `;
        const lowConfidenceParams = [];
        if (userLevel !== 1) {
            lowConfidenceSql += ' AND d.company_id = ?';
            lowConfidenceParams.push(companyId);
        }
        const lowConfidenceResult = await query(lowConfidenceSql, lowConfidenceParams);
        const anomalies = lowConfidenceResult[0]?.count || 0;

        res.json({
            success: true,
            data: {
                totalDevices,
                onlineRate,
                todayRecognition,
                anomalies
            }
        });
    } catch (error) {
        console.error('错误接口:', req.originalUrl);
        console.error('错误详情:', error);
        res.status(500).json({ message: error.message });
    }
});

// 获取准确率统计（按表计类型分组）
router.get('/accuracy-stats', verifyToken, async (req, res) => {
    try {
        const userLevel = req.user.permissionLevel;
        const companyId = req.user.companyId;

        // 构建设备权限过滤子查询
        let deviceFilter = '';
        const params = [];
        if (userLevel !== 1) {
            deviceFilter = ' AND d.company_id = ?';
            params.push(companyId);
        }

        // 按表计类型统计最近7天的平均置信度、总数、成功数
        const sql = `
            SELECT 
                d.meter_type,
                AVG(r.confidence) as avg_confidence,
                COUNT(*) as total,
                SUM(CASE WHEN r.confidence >= 0.8 THEN 1 ELSE 0 END) as high_conf_count
            FROM recognition_logs r
            JOIN devices d ON r.device_id = d.id
            WHERE r.recognized_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)
            ${deviceFilter}
            GROUP BY d.meter_type
        `;
        const results = await query(sql, params);

        // 整理数据，默认给电表、水表、燃气表填充0
        const stats = {
            electric: { avg: 0, total: 0, success: 0 },
            water: { avg: 0, total: 0, success: 0 },
            gas: { avg: 0, total: 0, success: 0 }
        };
        results.forEach(row => {
            const type = row.meter_type;
            if (stats[type]) {
                stats[type] = {
                    avg: parseFloat(row.avg_confidence) * 100,
                    total: row.total,
                    success: row.high_conf_count
                };
            }
        });

        // 整体统计
        const overallSql = `
            SELECT 
                COUNT(*) as total,
                SUM(CASE WHEN r.confidence >= 0.8 THEN 1 ELSE 0 END) as success,
                AVG(r.confidence) as avg_confidence
            FROM recognition_logs r
            JOIN devices d ON r.device_id = d.id
            WHERE r.recognized_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)
            ${deviceFilter}
        `;
        const overallResult = await query(overallSql, params);
        const overall = overallResult[0] || { total: 0, success: 0, avg_confidence: 0 };

        res.json({
            success: true,
            data: {
                electric: stats.electric.avg,
                water: stats.water.avg,
                gas: stats.gas.avg,
                total: overall.total,
                success: overall.success,
                failed: overall.total - overall.success,
                avgConfidence: overall.avg_confidence * 100
            }
        });
    } catch (error) {
        console.error('错误接口:', req.originalUrl);
        console.error('错误详情:', error);
        res.status(500).json({ message: error.message });
    }
});

// 获取识别记录明细（支持分页、搜索）
router.get('/recognition-logs', verifyToken, async (req, res) => {
    try {
        const userLevel = req.user.permissionLevel;
        const companyId = req.user.companyId;
        const page = parseInt(req.query.page) || 1;
        const pageSize = parseInt(req.query.pageSize) || 10;
        const keyword = req.query.keyword || '';   // 注意这里是 keyword
        const offset = (page - 1) * pageSize;

        // 构建 WHERE 条件（动态参数）
        let whereClause = '';
        const params = [];

        // 权限过滤（非超级管理员只能看自己公司的设备）
        if (userLevel !== 1 && companyId) {
            whereClause += ' AND d.company_id = ?';
            params.push(companyId);
        }

        // 搜索过滤（设备名称模糊匹配）
        if (keyword) {
            whereClause += ' AND d.name LIKE ?';
            params.push(`%${keyword}%`);
        }

        // 查询总数（使用相同的 params）
        const countSql = `
            SELECT COUNT(*) as total
            FROM recognition_logs r
            JOIN devices d ON r.device_id = d.id
            WHERE 1=1 ${whereClause}
        `;
        const countResult = await query(countSql, params);
        const total = countResult[0]?.total || 0;

        // 查询数据（参数需包含 where 条件 + 分页）
        const dataSql = `
            SELECT 
                r.id,
                r.recognized_at as time,
                d.name as deviceName,
                d.meter_type as meterType,
                r.meter_value as reading,
                r.confidence,
                d.unit,
                CASE 
                    WHEN r.confidence >= 0.8 THEN '正常'
                    WHEN r.confidence >= 0.5 THEN '警告'
                    ELSE '异常'
                END as status
            FROM recognition_logs r
            JOIN devices d ON r.device_id = d.id
            WHERE 1=1 ${whereClause}
            ORDER BY r.recognized_at DESC
            LIMIT ? OFFSET ?
        `;
        const dataParams = [...params, String(pageSize), String(offset)];
        const rows = await query(dataSql, dataParams);

        // 格式化数据（添加 change 字段，暂时为0）
        const data = rows.map(row => ({
            ...row,
            change: 0,
            unit: row.unit || (row.meterType === 'electric' ? 'kWh' : 'm³')
        }));

        res.json({
            success: true,
            data,
            total,
            page,
            pageSize
        });
    } catch (error) {
        console.error('错误接口:', req.originalUrl);
        console.error('错误详情:', error);
        res.status(500).json({ message: error.message });
    }
});

module.exports = router;
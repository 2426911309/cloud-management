const jwt = require('jsonwebtoken');
const { query } = require('../config/db');

// 权限等级常量
const PERMISSIONS = {
    SUPER_ADMIN: 1,    // 超级管理员（厂商）
    COMPANY_ADMIN: 2,  // 小区管理员
    OPERATOR: 3,       // 值班员
    REGISTERED: 4      // 注册人员（未授权）
};

// JWT 验证
const verifyToken = async (req, res, next) => {
    try {
        const token = req.headers.authorization?.split(' ')[1];
        if (!token) {
            return res.status(401).json({ message: '未提供认证令牌' });
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        // 查询用户最新信息（包括权限等级）
        const users = await query(
            'SELECT id, username, permission_level, company_id, role FROM users WHERE id = ?',
            [decoded.userId]
        );

        if (users.length === 0) {
            return res.status(401).json({ message: '用户不存在' });
        }

        req.user = {
            userId: users[0].id,
            username: users[0].username,
            permissionLevel: users[0].permission_level,
            companyId: users[0].company_id,
            role: users[0].role
        };

        next();
    } catch (error) {
        if (error.name === 'TokenExpiredError') {
            return res.status(401).json({ message: '登录已过期，请重新登录' });
        }
        return res.status(401).json({ message: '无效的认证令牌' });
    }
};

// 权限检查中间件生成器
const requirePermission = (minLevel) => {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({ message: '未登录' });
        }

        if (req.user.permissionLevel > minLevel) {
            return res.status(403).json({
                message: '权限不足',
                required: minLevel,
                current: req.user.permissionLevel
            });
        }

        next();
    };
};

// 紧急模式验证（网络异常时使用）
const emergencyMode = async (req, res, next) => {
    const emergencyKey = req.headers['x-emergency-key'];

    if (emergencyKey === process.env.EMERGENCY_PASSWORD) {
        req.emergencyMode = true;
        req.user = {
            permissionLevel: PERMISSIONS.SUPER_ADMIN,
            isEmergency: true
        };
        return next();
    }

    // 非紧急模式，走正常验证
    verifyToken(req, res, next);
};

// 数据访问控制（检查用户能否访问特定公司数据）
const checkCompanyAccess = async (req, res, next) => {
    const targetCompanyId = req.params.companyId || req.body.companyId || req.query.companyId;

    // 超级管理员可以访问所有
    if (req.user.permissionLevel === PERMISSIONS.SUPER_ADMIN || req.emergencyMode) {
        return next();
    }

    // 其他用户只能访问自己公司
    if (targetCompanyId && targetCompanyId != req.user.companyId) {
        return res.status(403).json({ message: '无权访问其他公司数据' });
    }

    next();
};

module.exports = {
    PERMISSIONS,
    verifyToken,
    requirePermission,
    emergencyMode,
    checkCompanyAccess
};
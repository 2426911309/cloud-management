const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');

dotenv.config();

const app = express();

// CORS 配置
app.use(cors({
    origin: ['http://localhost:8080', 'http://127.0.0.1:8080'],
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true
}));

app.use(express.json());

// 请求日志
app.use((req, res, next) => {
    console.log(`${new Date().toISOString()} ${req.method} ${req.path}`);
    next();
});

// 加载路由
const path = require('path');

const loadRoute = (name) => {
    try {
        const routePath = path.join(__dirname, 'routes', `${name}.js`);
        const route = require(routePath);
        console.log(`✅ ${name} 路由加载成功`);
        return route;
    } catch (err) {
        console.error(`❌ ${name} 路由加载失败:`, err.message);
        const { Router } = require('express');
        return Router();
    }
};

app.use('/api/auth', loadRoute('auth'));
app.use('/api/user', loadRoute('user'));
app.use('/api/device', loadRoute('device'));
app.use('/api/monitor', loadRoute('monitor'));
app.use('/api/analysis', require('./routes/analysis'));

// 健康检查
app.get('/health', (req, res) => {
    res.json({
        status: 'OK',
        time: new Date().toISOString(),
        service: 'cloud-management-server',
        version: '1.0.0'
    });
});

// 404处理
app.use((req, res) => {
    console.log('404:', req.method, req.path);
    res.status(404).json({ message: '接口不存在: ' + req.path });
});

// 错误处理
app.use((err, req, res, next) => {
    console.error('服务器错误:', err);
    res.status(500).json({
        message: '服务器内部错误',
        error: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
    console.log(`
╔════════════════════════════════════════════════╗
║                                                ║
║   云巡检管理平台后端服务启动成功                ║
║                                                ║
║   服务地址: http://localhost:${PORT}              ║
║   健康检查: http://localhost:${PORT}/health       ║
║                                                ║
╚════════════════════════════════════════════════╝
  `);
});
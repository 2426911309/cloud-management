const mysql = require('mysql2/promise');

const pool = mysql.createPool({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '123456',
    database: process.env.DB_NAME || 'cloud_management',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
    enableKeepAlive: true,
    keepAliveInitialDelay: 0
});

// 测试连接
pool.getConnection()
    .then(conn => {
        console.log('✅ MySQL 连接成功');
        conn.release();
    })
    .catch(err => {
        console.error('❌ MySQL 连接失败:', err.message);
    });

// 查询包装器（添加错误处理）
const query = async (sql, params) => {
    try {
        const [results] = await pool.execute(sql, params);
        return results;
    } catch (error) {
        console.error('数据库查询错误:', error);
        throw error;
    }
};

module.exports = { pool, query };
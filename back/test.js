const bcrypt = require('bcryptjs');

const password = 'admin123';
const hash = '$2a$10$N9qo8uLOickgx2ZMRZoMy.MqrqQzBZN0UfGNEJHqJqGQz/xZzGKiK';

console.log('密码:', password);
console.log('哈希:', hash);
console.log('哈希长度:', hash.length);
console.log('验证结果:', bcrypt.compareSync(password, hash));

// 重新生成哈希测试
const newHash = bcrypt.hashSync(password, 10);
console.log('新生成哈希:', newHash);
console.log('新哈希验证:', bcrypt.compareSync(password, newHash));
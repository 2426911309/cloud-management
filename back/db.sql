-- 创建数据库
CREATE DATABASE IF NOT EXISTS cloud_management
    CHARACTER SET utf8mb4
    COLLATE utf8mb4_unicode_ci;

USE cloud_management;

-- 用户表
CREATE TABLE users (
                       id INT PRIMARY KEY AUTO_INCREMENT,
                       username VARCHAR(50) NOT NULL UNIQUE,
                       password VARCHAR(255) NOT NULL,  -- 加密存储
                       age INT DEFAULT 28,
                       phone VARCHAR(20),
                       email VARCHAR(100),
                       department VARCHAR(50) DEFAULT '物业管理部',
                       role VARCHAR(20) DEFAULT '管理员',
                       avatar VARCHAR(500),
                       created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                       updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- 设备表
CREATE TABLE devices (
                         id INT PRIMARY KEY AUTO_INCREMENT,
                         name VARCHAR(100) NOT NULL,
                         location VARCHAR(100),
                         status ENUM('online', 'offline') DEFAULT 'offline',
                         type VARCHAR(20) DEFAULT 'camera',
                         url VARCHAR(500),  -- 视频流地址
                         meter_type ENUM('electric', 'water', 'gas') DEFAULT 'electric',
                         last_reading DECIMAL(10,2) DEFAULT 0,
                         unit VARCHAR(10) DEFAULT 'kWh',
                         user_id INT,
                         created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                         FOREIGN KEY (user_id) REFERENCES users(id)
);

-- 识别记录表（YOLO识别结果）
CREATE TABLE recognition_logs (
                                  id INT PRIMARY KEY AUTO_INCREMENT,
                                  device_id INT,
                                  meter_value DECIMAL(10,2),
                                  confidence DECIMAL(4,3),
                                  image_path VARCHAR(500),
                                  recognized_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                                  FOREIGN KEY (device_id) REFERENCES devices(id)
);

-- 插入测试账号（密码是 '123456' 的 bcrypt 加密）
INSERT INTO users (username, password, phone, email) VALUES
('admin', '$2a$10$YourHashedPasswordHere', '13800138000', 'admin@example.com');

-- 修改用户表，添加权限等级字段
ALTER TABLE users ADD COLUMN permission_level INT DEFAULT 4 COMMENT '1:超级管理员, 2:小区管理员, 3:值班员, 4:注册人员';
ALTER TABLE users ADD COLUMN company_id INT DEFAULT NULL COMMENT '所属公司ID，超级管理员可为空';
ALTER TABLE users ADD COLUMN created_by INT DEFAULT NULL COMMENT '创建者用户ID';

-- 创建公司表
CREATE TABLE companies (
  id INT PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(100) NOT NULL COMMENT '公司名称',
  address VARCHAR(200),
  contact_person VARCHAR(50),
  contact_phone VARCHAR(20),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- 创建设备权限关联表（用于精细控制）
CREATE TABLE device_permissions (
  id INT PRIMARY KEY AUTO_INCREMENT,
  user_id INT NOT NULL,
  device_id INT NOT NULL,
  can_view BOOLEAN DEFAULT TRUE,
  can_control BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (device_id) REFERENCES devices(id) ON DELETE CASCADE,
  UNIQUE KEY unique_user_device (user_id, device_id)
);

-- 插入默认超级管理员（厂商）
-- 密码是 'admin123' 的 bcrypt 哈希，请替换为实际哈希值
INSERT INTO users (username, password, phone, email, permission_level, role) VALUES
('superadmin', '$2a$10$YourHashedPasswordHere', '13800138000', 'superadmin@vendor.com', 1, '超级管理员');

-- 插入示例公司
INSERT INTO companies (name, address, contact_person, contact_phone) VALUES
('万科物业', '北京市朝阳区xxx', '张三', '13800138001'),
('碧桂园物业', '广州市番禺区xxx', '李四', '13800138002');
const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const User = sequelize.define('User', {
  id: {
    type: DataTypes.BIGINT,
    primaryKey: true,
    allowNull: false,
    comment: 'Telegram User ID',
  },
  username: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  first_name: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  currency: {
    type: DataTypes.STRING(3),
    defaultValue: 'USD',
    comment: 'Default currency preference: USD or KHR',
  },
  language: {
    type: DataTypes.STRING(2),
    defaultValue: 'km',
  }
}, {
  tableName: 'users',
  timestamps: true,
});

module.exports = User;


const mongoose = require('mongoose');

const serverConfigSchema = new mongoose.Schema({
  guildId: {
    type: String,
    required: true,
    unique: true
  },
  channels: {
    general: { type: String, default: null },
    announcement: { type: String, default: null },
    welcome: { type: String, default: null }
  },
  roles: {
    default: { type: String, default: null },
    moderator: { type: String, default: null },
    levelRoles: { type: [String], default: [] }
  },
  moderation: {
    antiSpam: { type: Number, default: 5 },
    badWords: { type: [String], default: [] },
    punishment: { type: String, default: 'mute', enum: ['mute', 'kick', 'ban'] }
  },
  logs: {
    moderation: { type: String, default: null },
    server: { type: String, default: null },
    messages: { type: String, default: null }
  },
  welcome: {
    message: { type: String, default: '¡Bienvenido {user} a {server}!' },
    image: { type: String, default: null }
  }
});

module.exports = mongoose.model('ServerConfig', serverConfigSchema);

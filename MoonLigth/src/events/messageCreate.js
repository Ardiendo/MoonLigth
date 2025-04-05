
const { Events } = require('discord.js');
const ServerConfig = require('../models/serverConfig');

// Mapa para rastrear mensajes de usuarios
const userMessages = new Map();

module.exports = {
  name: Events.MessageCreate,
  async execute(message) {
    // Ignorar mensajes de bots y DMs
    if (message.author.bot || !message.guild) return;

    try {
      // Obtener la configuración del servidor
      const serverConfig = await ServerConfig.findOne({ guildId: message.guild.id });
      if (!serverConfig) return;

      // Sistema anti-spam
      if (serverConfig.moderation.antiSpam > 0) {
        const userId = message.author.id;
        
        // Obtener o crear un registro para el usuario
        if (!userMessages.has(userId)) {
          userMessages.set(userId, {
            messageCount: 0,
            lastMessage: Date.now(),
            timeout: null
          });
        }
        
        const userData = userMessages.get(userId);
        
        // Incrementar contador de mensajes
        userData.messageCount++;
        
        // Verificar si es spam
        if (userData.messageCount >= serverConfig.moderation.antiSpam && (Date.now() - userData.lastMessage) < 5000) {
          // Aplicar castigo según la configuración
          switch (serverConfig.moderation.punishment) {
            case 'mute':
              if (message.member.moderatable) {
                await message.member.timeout(60000, 'Anti-spam');
                message.channel.send(`${message.author}, has sido silenciado por 1 minuto por spam.`);
              }
              break;
            case 'kick':
              if (message.member.kickable) {
                await message.member.kick('Anti-spam');
                message.channel.send(`${message.author.tag} ha sido expulsado por spam.`);
              }
              break;
            case 'ban':
              if (message.member.bannable) {
                await message.member.ban({ reason: 'Anti-spam' });
                message.channel.send(`${message.author.tag} ha sido baneado por spam.`);
              }
              break;
          }
          
          // Registrar en logs si está configurado
          if (serverConfig.logs.moderation) {
            const logChannel = message.guild.channels.cache.get(serverConfig.logs.moderation);
            if (logChannel) {
              logChannel.send(`🛡️ **Anti-Spam:** ${message.author.tag} (${message.author.id}) recibió un ${serverConfig.moderation.punishment} por spam.`);
            }
          }
        }
        
        // Actualizar timestamp
        userData.lastMessage = Date.now();
        
        // Limpiar contador después de 5 segundos
        clearTimeout(userData.timeout);
        userData.timeout = setTimeout(() => {
          userData.messageCount = 0;
        }, 5000);
      }

      // Filtro de palabras prohibidas
      if (serverConfig.moderation.badWords.length > 0) {
        const content = message.content.toLowerCase();
        for (const word of serverConfig.moderation.badWords) {
          if (content.includes(word.toLowerCase())) {
            // Eliminar el mensaje
            await message.delete();
            
            // Enviar advertencia
            const warningMsg = await message.channel.send(`${message.author}, tu mensaje contenía palabras prohibidas y ha sido eliminado.`);
            setTimeout(() => warningMsg.delete().catch(() => {}), 5000);
            
            // Registrar en logs si está configurado
            if (serverConfig.logs.moderation) {
              const logChannel = message.guild.channels.cache.get(serverConfig.logs.moderation);
              if (logChannel) {
                logChannel.send(`🛡️ **Filtro de palabras:** ${message.author.tag} (${message.author.id}) envió un mensaje con contenido prohibido.`);
              }
            }
            
            break;
          }
        }
      }
    } catch (error) {
      console.error('Error en el evento messageCreate:', error);
    }
  },
};

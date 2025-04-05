
const { Events, EmbedBuilder } = require('discord.js');
const ServerConfig = require('../models/serverConfig');

module.exports = {
  name: Events.GuildMemberAdd,
  async execute(member) {
    try {
      // Obtener la configuración del servidor
      const serverConfig = await ServerConfig.findOne({ guildId: member.guild.id });
      if (!serverConfig || !serverConfig.channels.welcome) return;

      // Obtener el canal de bienvenida
      const welcomeChannel = member.guild.channels.cache.get(serverConfig.channels.welcome);
      if (!welcomeChannel) return;

      // Preparar el mensaje de bienvenida
      let welcomeMessage = serverConfig.welcome.message || '¡Bienvenido {user} a {server}!';
      welcomeMessage = welcomeMessage
        .replace('{user}', `<@${member.id}>`)
        .replace('{server}', member.guild.name);

      // Crear el embed de bienvenida
      const welcomeEmbed = new EmbedBuilder()
        .setColor('Random')
        .setTitle(`¡Bienvenido a ${member.guild.name}!`)
        .setDescription(welcomeMessage)
        .setThumbnail(member.user.displayAvatarURL({ dynamic: true }))
        .setImage(serverConfig.welcome.image || null)
        .setTimestamp();

      // Enviar el mensaje de bienvenida
      await welcomeChannel.send({ embeds: [welcomeEmbed] });

      // Asignar rol por defecto si existe
      if (serverConfig.roles.default) {
        const defaultRole = member.guild.roles.cache.get(serverConfig.roles.default);
        if (defaultRole) {
          await member.roles.add(defaultRole);
        }
      }
    } catch (error) {
      console.error('Error en el evento guildMemberAdd:', error);
    }
  },
};

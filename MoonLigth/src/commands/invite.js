
const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
require('dotenv').config();

module.exports = {
  data: new SlashCommandBuilder()
    .setName('invite')
    .setDescription('Muestra enlaces para invitar al bot a tu servidor.'),

  async execute(interaction) {
    try {
      const clientId = process.env.CLIENT_ID || interaction.client.user.id;
      
      // Crear el enlace de invitación con permisos recomendados
      const inviteUrl = `https://discord.com/api/oauth2/authorize?client_id=${clientId}&permissions=8&scope=bot%20applications.commands`;
      
      // Enlace al servidor de soporte (si existe)
      const supportServer = process.env.SUPPORT_SERVER || 'https://discord.gg/vZyQ3u5re2';
      
      const inviteEmbed = new EmbedBuilder()
        .setColor('Random')
        .setTitle('¡Invita a MoonLigth a tu servidor!')
        .setDescription('Gracias por tu interés en MoonLigth. Aquí tienes los enlaces para invitar al bot a tu servidor y unirte a nuestra comunidad.')
        .setThumbnail(interaction.client.user.displayAvatarURL({ dynamic: true }))
        .addFields(
          { name: '🔗 Enlace de Invitación', value: `[Click aquí para invitar](${inviteUrl})`, inline: false },
          { name: '🌟 Servidor de Soporte', value: `[Únete a nuestra comunidad](${supportServer})`, inline: false }
        )
        .setFooter({ text: `Solicitado por ${interaction.user.tag}`, iconURL: interaction.user.displayAvatarURL({ dynamic: true }) })
        .setTimestamp();

      // Crear botones para los enlaces
      const actionRow = new ActionRowBuilder()
        .addComponents(
          new ButtonBuilder()
            .setLabel('Invitar Bot')
            .setURL(inviteUrl)
            .setStyle(ButtonStyle.Link)
            .setEmoji('🤖'),
          new ButtonBuilder()
            .setLabel('Servidor de Soporte')
            .setURL(supportServer)
            .setStyle(ButtonStyle.Link)
            .setEmoji('🌐')
        );

      await interaction.reply({
        embeds: [inviteEmbed],
        components: [actionRow]
      });
    } catch (error) {
      console.error(`Error en el comando invite: ${error}`);
      await interaction.reply({
        content: 'Ha ocurrido un error al generar los enlaces de invitación.',
        ephemeral: true
      });
    }
  },
};

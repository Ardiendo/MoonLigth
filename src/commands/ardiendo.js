const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
require('dotenv').config();

module.exports = {
  data: new SlashCommandBuilder()
    .setName('ardiendo')
    .setDescription('Muestra información sobre la desarrolladora y MoonLigth'),

  async execute(interaction) {
    const developerId = process.env.DEVELOPER_ID;
    const DEVELOPER_TAG = process.env.DEVELOPER_TAG;

    try {
      const developer = await interaction.guild.members.fetch(developerId);
      const bot = interaction.client.user;

      const embed = new EmbedBuilder()
        .setTitle(`Info de ${DEVELOPER_TAG}`)
        .setColor("Random")
        .setThumbnail(developer.user.displayAvatarURL())
        .setDescription('¡Hola! Soy la desarrolladora de este bot. Aquí tienes algo de información sobre mí y el bot:')
        .addFields(
          {
            name: 'Desarrolladora',
            value: `**Nombre:** ${developer.user.tag}\n**ID:** ${developer.user.id}\n**Rol principal:** ${developer.roles.highest.name}\n**Se unió al servidor:** <t:${Math.floor(developer.joinedTimestamp / 1000)}:R>\n**Cuenta creada:** <t:${Math.floor(developer.user.createdTimestamp / 1000)}:R>`,
            inline: true,
          },
          {
            name: `${bot.tag}`,
            value: `**Nombre:** ${bot.tag}\n**ID:** ${bot.id}\n**Creado:** <t:${Math.floor(bot.createdTimestamp / 1000)}:R>`,
            inline: true,
          },
        )
        .setFooter({ text: 'Gracias por usar el bot 😊', iconURL: bot.displayAvatarURL() });

      const buttons = new ActionRowBuilder()
        .addComponents(
          new ButtonBuilder()
            .setLabel('GitHub')
            .setStyle(ButtonStyle.Link)
            .setURL('https://github.com/Ardiendo'),
          new ButtonBuilder()
            .setLabel('X')
            .setStyle(ButtonStyle.Link)
            .setURL('https://x.com/_aaari__'),
        );

      await interaction.reply({ embeds: [embed], components: [buttons] });
    } catch (error) {
      console.error('Error al obtener la información:', error);
      await interaction.reply({ content: 'No se pudo obtener la información.', ephemeral: true });
    }
  },
};

const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, SelectMenuBuilder, ComponentType } = require('discord.js');
require('dotenv').config();

module.exports = {
  data: new SlashCommandBuilder()
    .setName('moonligth')
    .setDescription('Muestra información detallada de MoonLigth'),

  async execute(interaction) { 
    try {
      const bot = interaction.client.user;
      const developerId = process.env.DEVELOPER_ID;
      const DEVELOPER_TAG = process.env.DEVELOPER_TAG;
      const developer = await interaction.guild.members.fetch(developerId);
      const guild = interaction.guild;

      const options = [
        {
          label: 'Información General',
          description: 'Muestra información básica del bot',
          value: 'general',
          emoji: '📊'
        },
        {
          label: 'Estadísticas',
          description: 'Muestra estadísticas del bot',
          value: 'stats',
          emoji: '📈'
        },
        {
          label: 'Información del Desarrollador',
          description: 'Muestra información sobre el desarrollador',
          value: 'dev',
          emoji: '👨‍💻'
        },
        {
          label: 'Soporte',
          description: 'Información de soporte y enlaces útiles',
          value: 'support',
          emoji: '🔧'
        }
      ];

      const selectMenu = new ActionRowBuilder()
        .addComponents(
          new SelectMenuBuilder()
            .setCustomId('info-menu')
            .setPlaceholder('Selecciona una categoría')
            .addOptions(options)
        );

      const initialEmbed = new EmbedBuilder()
        .setColor('Random')
        .setTitle('MoonLigth Bot - Panel de Información')
        .setDescription('Selecciona una categoría del menú para ver información específica.')
        .setThumbnail(bot.displayAvatarURL())
        .setTimestamp();

      const response = await interaction.reply({
        embeds: [initialEmbed],
        components: [selectMenu],
        fetchReply: true
      });

      const collector = response.createMessageComponentCollector({
        componentType: ComponentType.SelectMenu,
        time: 60000
      });

      collector.on('collect', async i => {
        if (i.user.id === interaction.user.id) {
          const selection = i.values[0];
          const embed = new EmbedBuilder()
            .setColor('Random')
            .setTimestamp();

          const buttons = new ActionRowBuilder();

          switch (selection) {
            case 'general':
              embed
                .setTitle('Información General')
                .setThumbnail(bot.displayAvatarURL())
                .addFields(
                  { name: 'Nombre', value: bot.tag, inline: true },
                  { name: 'ID', value: bot.id, inline: true },
                  { name: 'Creado', value: `<t:${Math.floor(bot.createdTimestamp / 1000)}:D>`, inline: true },
                  { name: 'Lenguaje', value: 'JavaScript', inline: true },
                  { name: 'Librería', value: 'discord.js', inline: true },
                  { name: 'Prefijo', value: '/', inline: true }
                );
              break;

            case 'stats':
              embed
                .setTitle('Estadísticas del Bot')
                .setThumbnail(bot.displayAvatarURL())
                .addFields(
                  { name: 'Servidores', value: `${interaction.client.guilds.cache.size}`, inline: true },
                  { name: 'Usuarios', value: `${interaction.client.users.cache.size}`, inline: true },
                  { name: 'Canales', value: `${interaction.client.channels.cache.size}`, inline: true },
                  { name: 'Tiempo Activo', value: `<t:${Math.floor((Date.now() - interaction.client.uptime) / 1000)}:R>`, inline: true },
                  { name: 'Memoria Usada', value: `${(process.memoryUsage().heapUsed / 1024 / 1024).toFixed(2)} MB`, inline: true }
                );
              break;

            case 'dev':
              embed
                .setTitle('Información del Desarrollador')
                .setThumbnail(developer.user.displayAvatarURL())
                .addFields(
                  { name: 'Desarrollador', value: DEVELOPER_TAG, inline: true },
                  { name: 'ID', value: developer.user.id, inline: true },
                  { name: 'Rol Principal', value: developer.roles.highest.name, inline: true }
                );
              break;

            case 'support':
              embed
                .setTitle('Soporte y Enlaces')
                .setDescription('Aquí tienes enlaces útiles para obtener ayuda y soporte.')
                .addFields(
                  { name: '🔗 Enlaces Útiles', value: 'Selecciona uno de los botones de abajo.' }
                );

              buttons.addComponents(
                new ButtonBuilder()
                  .setLabel('Invitar Bot')
                  .setStyle(ButtonStyle.Link)
                  .setURL('https://discord.com/oauth2/authorize?client_id=1259146338516471879&scope=bot&permissions=1099511627775'),
                new ButtonBuilder()
                  .setLabel('Servidor de Soporte')
                  .setStyle(ButtonStyle.Link)
                  .setURL(guild.vanityURLCode ? `https://discord.gg/${guild.vanityURLCode}` : 'https://discord.gg/vZyQ3u5re2')
              );
              break;
          }

          const components = [selectMenu];
          if (buttons.components.length > 0) {
            components.push(buttons);
          }

          await i.update({ embeds: [embed], components: components });
        } else {
          await i.reply({ content: 'No puedes usar este menú.', ephemeral: true });
        }
      });

      collector.on('end', () => {
        selectMenu.components[0].setDisabled(true);
        interaction.editReply({ components: [selectMenu] }).catch(() => {});
      });

    } catch (error) {
      console.error(`\n❌ Error al ejecutar el comando: \n${error}\n`);
      const errorEmbed = new EmbedBuilder()
        .setColor('Red')
        .setTitle('❌ Error')
        .setDescription('Hubo un error al ejecutar el comando. Por favor, inténtalo de nuevo más tarde.')
        .addFields(
          { name: 'Comando', value: `/${interaction.commandName}`, inline: true },
          { name: 'Usuario', value: interaction.user.tag, inline: true },
          { name: 'Fecha', value: `<t:${Math.floor(Date.now() / 1000)}:F>`, inline: true }
        )
        .setFooter({ text: 'Si el error persiste, contacta al desarrollador.' });

      await interaction.reply({ embeds: [errorEmbed], ephemeral: true });
    }
  },
};

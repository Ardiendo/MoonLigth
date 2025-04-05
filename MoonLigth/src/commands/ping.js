
const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, StringSelectMenuBuilder, ComponentType, version } = require('discord.js');
const os = require('node:os');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('ping')
    .setDescription('Muestra información detallada sobre el estado del bot'),

  async execute(interaction) {
    try {
      const initialEmbed = new EmbedBuilder()
        .setColor("Random")
        .setTitle('🏓 Estado del Bot')
        .setDescription('Selecciona una opción del menú para ver información específica.')
        .setThumbnail(interaction.client.user.displayAvatarURL())
        .setTimestamp();

      const options = [
        {
          label: 'Latencia',
          description: 'Ver información sobre la latencia del bot',
          value: 'latency',
          emoji: '⚡'
        },
        {
          label: 'Sistema',
          description: 'Ver información del sistema',
          value: 'system',
          emoji: '🖥️'
        },
        {
          label: 'Estadísticas',
          description: 'Ver estadísticas del bot',
          value: 'stats',
          emoji: '📊'
        }
      ];

      const menu = new ActionRowBuilder()
        .addComponents(
          new StringSelectMenuBuilder()
            .setCustomId('ping-menu')
            .setPlaceholder('Selecciona una categoría')
            .addOptions(options)
        );

      const response = await interaction.reply({
        embeds: [initialEmbed],
        components: [menu],
        withResponse: true
      });

      const collector = response.createMessageComponentCollector({
        componentType: ComponentType.StringSelect,
        time: 60000
      });

      collector.on('collect', async i => {
        if (i.user.id === interaction.user.id) {
          const embed = new EmbedBuilder()
            .setColor("Random")
            .setTimestamp()
            .setFooter({ text: `Solicitado por ${i.user.tag}`, iconURL: i.user.displayAvatarURL() });

          switch (i.values[0]) {
            case 'latency':
              embed
                .setTitle('⚡ Información de Latencia')
                .addFields(
                  { name: '📶 Latencia del Bot', value: `${response.createdTimestamp - interaction.createdTimestamp}ms`, inline: true },
                  { name: '🌐 Latencia de la API', value: `${interaction.client.ws.ping}ms`, inline: true }
                );
              break;

            case 'system':
              embed
                .setTitle('🖥️ Información del Sistema')
                .addFields(
                  { name: '💻 Sistema Operativo', value: `${os.platform()} ${os.release()}`, inline: true },
                  { name: '📚 Versión de Discord.js', value: `v${version}`, inline: true },
                  { name: '💾 Memoria Usada', value: `${(process.memoryUsage().heapUsed / 1024 / 1024).toFixed(2)} MB`, inline: true },
                  { name: '⏰ Uptime', value: `<t:${Math.floor(Date.now() / 1000 - interaction.client.uptime / 1000)}:R>`, inline: true }
                );
              break;

            case 'stats':
              embed
                .setTitle('📊 Estadísticas del Bot')
                .addFields(
                  { name: '🏰 Servidores', value: `${interaction.client.guilds.cache.size}`, inline: true },
                  { name: '👥 Usuarios', value: `${interaction.client.users.cache.size}`, inline: true },
                  { name: '📝 Canales', value: `${interaction.client.channels.cache.size}`, inline: true },
                  { name: '🤖 Comandos', value: `${interaction.client.commands.size}`, inline: true }
                );
              break;
          }

          await i.update({ embeds: [embed], components: [menu] });
        } else {
          await i.reply({ content: '❌ No puedes usar este menú.', ephemeral: true });
        }
      });

      collector.on('end', () => {
        menu.components[0].setDisabled(true);
        interaction.editReply({ components: [menu] }).catch(() => {});
      });

    } catch (error) {
      console.error(error);
      await interaction.reply({ 
        content: 'Hubo un error al ejecutar el comando.', 
        ephemeral: true 
      });
    }
  }
};

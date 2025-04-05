const { SlashCommandBuilder, EmbedBuilder, version, ActionRowBuilder, SelectMenuBuilder, ComponentType } = require('discord.js');
const os = require('node:os');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('infosv')
    .setDescription('Muestra información sobre la latencia y el estado del bot.'),
  async execute(interaction) {
    try {
      const options = [
        {
          label: 'Latencia',
          description: 'Muestra la latencia del bot y de la API.',
          value: 'latencia',
        },
        {
          label: 'Versión',
          description: 'Muestra la versión de Discord.js.',
          value: 'version',
        },
        {
          label: 'Sistema',
          description: 'Muestra información sobre el sistema operativo.',
          value: 'sistema',
        },
        {
          label: 'Memoria',
          description: 'Muestra el uso de memoria del bot.',
          value: 'memoria',
        },
        {
          label: 'Uptime',
          description: 'Muestra el tiempo que el bot ha estado activo.',
          value: 'uptime',
        },
      ];

      const selectMenu = new ActionRowBuilder()
        .addComponents(
          new SelectMenuBuilder()
            .setCustomId('select-info')
            .setPlaceholder('Selecciona una opción')
            .addOptions(options),
        );

      const initialEmbed = new EmbedBuilder()
        .setColor("Random")
        .setTitle('🏓 Pong!')
        .setDescription('Selecciona una opción del menú desplegable para ver la información.')
        .setTimestamp();

      const reply = await interaction.reply({ embeds: [initialEmbed], components: [selectMenu], fetchReply: true });

      const collector = reply.createMessageComponentCollector({ componentType: ComponentType.SelectMenu, time: 60000 });

      collector.on('collect', async i => {
        if (i.user.id === interaction.user.id) {
          await i.deferUpdate();

          const option = i.values[0];
          const embed = new EmbedBuilder()
            .setColor("Random")
            .setTitle('🏓 Pong!');

          if (option === 'latencia') {
            embed.addFields(
              { name: 'Latencia del bot', value: `${reply.createdTimestamp - interaction.createdTimestamp}ms`, inline: true },
              { name: 'Latencia de la API', value: `${interaction.client.ws.ping}ms`, inline: true },
            );
          } else if (option === 'version') {
            embed.addFields({ name: 'Versión de Discord.js', value: `v${version}`, inline: true });
          } else if (option === 'sistema') {
            embed.addFields({ name: 'Sistema operativo', value: `${os.platform()} ${os.release()}`, inline: true });
          } else if (option === 'memoria') {
            embed.addFields({ name: 'Uso de memoria', value: `${(process.memoryUsage().heapUsed / 1024 / 1024).toFixed(2)} MB`, inline: true });
          } else if (option === 'uptime') {
            embed.addFields({ name: 'Uptime', value: `<t:${Math.floor(interaction.client.uptime / 1000)}:R>`, inline: true });
          }

          embed.setTimestamp();
          await i.editReply({ embeds: [embed], components: [] });
        } else {
          await i.reply({ content: 'No puedes interactuar con este menú.', ephemeral: true });
        }
      });

      collector.on('end', collected => console.log(`Se recogieron ${collected.size} interacciones.`));

    } catch (error) {
      console.error(`\n❌ Error al ejecutar el comando: \n${error}\n`);

      const errorEmbed = new EmbedBuilder()
        .setColor('Red')
        .setTitle('❌ Error')
        .setDescription('Hubo un error al ejecutar el comando. Por favor, inténtalo de nuevo más tarde.')
        .addFields(
          { name: 'Comando', value: `/${interaction.commandName}`, inline: true },
          { name: 'Usuario', value: interaction.user.tag, inline: true },
          { name: 'Fecha', value: `<t:${Math.floor(Date.now() / 1000)}:F>`, inline: true },
        )
        .setFooter({ text: 'Si el error persiste, contacta al desarrollador.' });

      await interaction.reply({ embeds: [errorEmbed], ephemeral: true });
    }
  },
};
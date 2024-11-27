const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('help')
    .setDescription('Muestra la lista de comandos y su descripción.'),

  async execute(interaction) {
    try { 
      const commands = interaction.client.commands;

      const categories = {
        "Moderación": [],
        "Utilidad": [],
      };

      commands.forEach(command => {
        if (command.data.name.startsWith("ban") || command.data.name.startsWith("kick")) {
          categories["Moderación"].push(command);
        } else if (command.data.name === "avatar" || command.data.name === "userinfo") {
          categories["Utilidad"].push(command);
        } else {
          categories["Diversión"].push(command);
        }
      });

      const categoryButtons = new ActionRowBuilder();
      for (const category in categories) {
        categoryButtons.addComponents(
          new ButtonBuilder()
            .setCustomId(category)
            .setLabel(category)
            .setStyle(ButtonStyle.Primary)
        );
      }

      const initialEmbed = new EmbedBuilder()
        .setColor(0x0099FF)
        .setTitle('Lista de Comandos')
        .setDescription('Selecciona una categoría para ver los comandos.')
        .setThumbnail(interaction.client.user.displayAvatarURL());

      const reply = await interaction.reply({ embeds: [initialEmbed], components: [categoryButtons] });

      const collector = reply.createMessageComponentCollector({ time: 60000 });

      collector.on('collect', async i => {
        if (i.user.id === interaction.user.id) {
          const category = i.customId;
          const categoryCommands = categories[category];

          const categoryEmbed = new EmbedBuilder()
            .setColor(0x0099FF)
            .setTitle(`Comandos de ${category}`)
            .setDescription(categoryCommands.map(command => `**/${command.data.name}**: ${command.data.description}`).join('\n'))
            .setThumbnail(interaction.client.user.displayAvatarURL());

          await i.update({ embeds: [categoryEmbed], components: [] });
        } else {
          await i.reply({ content: 'No puedes interactuar con este menú.', ephemeral: true });
        }
      });

      collector.on('end', collected => console.log(`Se recogieron ${collected.size} interacciones.`));

    } catch (error) { 
      console.error('Error al ejecutar el comando:', error);

      const errorEmbed = new EmbedBuilder()
        .setColor('Red')
        .setTitle('❌ Error')
        .setDescription('Hubo un error al ejecutar el comando. Por favor, inténtalo de nuevo más tarde.');

      await interaction.reply({ embeds: [errorEmbed], ephemeral: true });
    }
  },
};
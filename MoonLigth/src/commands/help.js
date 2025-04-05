
const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, SelectMenuBuilder, ComponentType } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('help')
    .setDescription('Muestra la lista de comandos y su descripción.'),

  async execute(interaction) {
    try {
      const commands = interaction.client.commands;

      const categories = {
        "🛡️ Moderación": ["ban", "kick", "mute", "timeout", "warn", "purgar"],
        "🛠️ Utilidad": ["avatar", "userprofile", "infosv", "ping", "configembed", "configrole"],
        "🎮 Diversión": ["minijuegos", "ardiendo", "moonligth"],
        "🎫 Tickets": ["tickets"],
        "📋 Información": ["help", "repo"],
        "⚙️ Desarrollo": ["dev"]
      };

      const mainEmbed = new EmbedBuilder()
        .setColor("Random")
        .setTitle('📚 Sistema de Ayuda')
        .setDescription('Selecciona una categoría del menú desplegable para ver los comandos disponibles.')
        .setThumbnail(interaction.client.user.displayAvatarURL())
        .setFooter({ text: `Solicitado por ${interaction.user.tag}`, iconURL: interaction.user.displayAvatarURL() });

      const selectMenu = new ActionRowBuilder()
        .addComponents(
          new SelectMenuBuilder()
            .setCustomId('help-menu')
            .setPlaceholder('Selecciona una categoría')
            .addOptions(
              Object.keys(categories).map(category => ({
                label: category.replace(/^[^ ]+ /, ''),
                value: category,
                emoji: category.split(' ')[0]
              }))
            )
        );

      const response = await interaction.reply({
        embeds: [mainEmbed],
        components: [selectMenu],
        fetchReply: true
      });

      const collector = response.createMessageComponentCollector({
        componentType: ComponentType.SelectMenu,
        time: 60000
      });

      collector.on('collect', async i => {
        if (i.user.id === interaction.user.id) {
          const selectedCategory = i.values[0];
          const categoryCommands = categories[selectedCategory];

          const categoryEmbed = new EmbedBuilder()
            .setColor("Random")
            .setTitle(`${selectedCategory}`)
            .setDescription(categoryCommands.map(cmdName => {
              const cmd = commands.get(cmdName);
              return cmd ? `**/${cmdName}**: ${cmd.data.description}` : `**/${cmdName}**: Descripción no disponible`;
            }).join('\n'))
            .setThumbnail(interaction.client.user.displayAvatarURL())
            .setFooter({ text: `Solicitado por ${interaction.user.tag}`, iconURL: interaction.user.displayAvatarURL() });

          await i.update({ embeds: [categoryEmbed], components: [selectMenu] });
        } else {
          await i.reply({
            content: 'No puedes usar este menú, usa el comando /help para ver tus propios menús.',
            ephemeral: true
          });
        }
      });

      collector.on('end', () => {
        selectMenu.components[0].setDisabled(true);
        interaction.editReply({ components: [selectMenu] }).catch(() => {});
      });

    } catch (error) {
      console.error(error);
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

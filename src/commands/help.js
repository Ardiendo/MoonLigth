 const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, SelectMenuBuilder, ComponentType } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('help')
    .setDescription('Muestra la lista de comandos y su descripción.'),

  async execute(interaction) {
    try {
      const commands = interaction.client.commands;

      const categories = {
        "Moderacion | 🛡️": [],
        "Otros | 📁": [],
        "Utilidad | 🛠️": [] 
      };

      commands.forEach(command => {
        if (command.data.name.startsWith("ban") || command.data.name.startsWith("kick")) {
          categories["Moderación"].push(command);
        } else if (command.data.name === "avatar" || command.data.name === "userinfo") {
          categories["Utilidad"].push(command);
        } else {
          categories["Utilidad | 🛠️"].push(command); 
        }
      });

      const selectMenu = new ActionRowBuilder()
        .addComponents(
          new SelectMenuBuilder()
            .setCustomId('select-category')
            .setPlaceholder('Selecciona una categoría')
            .addOptions(Object.keys(categories).map(category => ({
              label: category,
              value: category
            })))
        );

        const initialEmbed = new EmbedBuilder()
        .setColor("Random")
        .setTitle('❔ Lista de Comandos')
        .setDescription('Selecciona una categoría del menú desplegable para ver los comandos disponibles.')
        .setThumbnail(interaction.client.user.displayAvatarURL())
        .setFooter({ text: `Solicitado por ${interaction.user.tag}`, iconURL: interaction.user.displayAvatarURL() });
      
      const reply = await interaction.reply({ embeds: [initialEmbed], components: [selectMenu], fetchReply: true });
      
      const collector = reply.createMessageComponentCollector({ componentType: ComponentType.SelectMenu, time: 60000 });
      
      collector.on('collect', async i => {
        if (i.user.id === interaction.user.id) {
          await i.deferUpdate(); 
      
          const category = i.values[0];
          const categoryCommands = categories[category];
      
          const categoryEmbed = new EmbedBuilder()
            .setColor("Random")
            .setTitle(`📂 Comandos de ${category}`)
            .setDescription(categoryCommands.map(command => `**/${command.data.name}**: ${command.data.description}`).join('\n'))
            .setThumbnail(interaction.client.user.displayAvatarURL())
            .setFooter({ text: `Solicitado por ${interaction.user.tag}`, iconURL: interaction.user.displayAvatarURL() });
      
          await i.editReply({ embeds: [categoryEmbed], components: [] });
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
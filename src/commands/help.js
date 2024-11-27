const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('help')
    .setDescription('Muestra 1  la lista de comandos y su descripción.'),
  async execute(interaction) {
    const commands = interaction.client.commands; 

    const embed = new EmbedBuilder()
      .setColor(0x0099FF)
      .setTitle('Lista de Comandos')
      .setDescription('Aquí tienes una lista de todos mis comandos disponibles:')
      .setThumbnail(interaction.client.user.displayAvatarURL()); 

  
    commands.forEach(command => {
      embed.addFields({
        name: `/${command.data.name}`,
        value: command.data.description,
        inline: false,
      });
    });


    embed.setFooter({
      text: `Puedes usar /help [nombre del comando] para obtener más información sobre un comando específico.`,
      iconURL: interaction.user.displayAvatarURL(), 
    });

    await interaction.reply({ embeds: [embed] });
  },
};
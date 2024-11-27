const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('avatar')
    .setDescription('🖼️ Muestra el avatar de un usuario')
    .addUserOption(option => 
      option.setName('user')
        .setDescription('El usuario cuyo avatar quieres ver')
    ),
  
  async execute(interaction) {
    const user = interaction.options.getUser('user') || interaction.user;
    const avatarURL = user.displayAvatarURL({ dynamic: true, size: 4096 }); 

    const avatarEmbed = new EmbedBuilder()
      .setColor(user.accentColor || 0x00ff00) 
      .setTitle(`🖼️ Avatar de ${user.tag}`)
      .setImage(avatarURL)
      .setTimestamp()
      .setFooter({ text: `Solicitado por ${interaction.user.tag}`, iconURL: interaction.user.displayAvatarURL({ dynamic: true }) });

    const row = new ActionRowBuilder()
      .addComponents(
        new ButtonBuilder()
          .setLabel('Descargar Avatar')
          .setStyle(ButtonStyle.Link)
          .setURL(avatarURL)
          .setEmoji('📥')
      );

    await interaction.reply({ embeds: [avatarEmbed], components: [row] });
  }
};
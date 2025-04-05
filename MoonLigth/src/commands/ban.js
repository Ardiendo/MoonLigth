const { SlashCommandBuilder, EmbedBuilder, PermissionsBitField } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('ban')
    .setDescription('🔨 Banea a un usuario del servidor.')
    .addUserOption(option => 
      option.setName('usuario')
        .setDescription('Usuario a banear')
        .setRequired(true))
    .addStringOption(option => 
      option.setName('razon')
        .setDescription('Razón del baneo')
        .setRequired(false)),

  async execute(interaction) {
    if (!interaction.member.permissions.has(PermissionsBitField.Flags.BanMembers)) {
      const embed = new EmbedBuilder()
        .setTitle('Permiso Denegado 🚫')
        .setDescription('No tienes permiso para usar este comando. Necesitas el permiso de **Bannear Miembros** para ejecutar esta acción.')
        .setColor(0xff0000)
        .setTimestamp()
        .setFooter({ text: 'Solicita permisos a un administrador.' });
      return interaction.reply({ embeds: [embed], ephemeral: true });
    }

    const user = interaction.options.getUser('usuario');
    const reason = interaction.options.getString('razon') || 'No se proporcionó una razón';

    const member = await interaction.guild.members.fetch(user.id);
    if (!member) {
      const embed = new EmbedBuilder()
        .setTitle('Error 🚨')
        .setDescription('El usuario especificado no está en este servidor. Verifica el ID o menciona al usuario correctamente.')
        .setColor(0xff0000)
        .setTimestamp()
        .setFooter({ text: 'Verifica la información del usuario.' });
      return interaction.reply({ embeds: [embed], ephemeral: true });
    }

    try {
      await member.ban({ reason });
      const embed = new EmbedBuilder()
        .setTitle('Usuario Baneado 🔨')
        .setDescription(`El usuario **${user.tag}** ha sido baneado del servidor.`)
        .addFields(
          { name: 'Razón:', value: `📜 | ${reason}`, inline: false },
          { name: 'Baneado por:', value: `👤 | ${interaction.user.tag}`, inline: true }
        )
        .setColor(0xff0000)
        .setTimestamp()
        .setFooter({ text: `Ban ejecutado correctamente | ${user.tag}`,
          iconURL: interaction.client.user.displayAvatarURL({ size: 32, format: 'png' }),
        });
      await interaction.reply({ embeds: [embed] });
    } catch (error) {
      console.error('Error al banear al usuario:', error);
      const embed = new EmbedBuilder()
        .setTitle('Error 🚨')
        .setDescription('Hubo un error al intentar banear al usuario. Asegúrate de que tengo permisos adecuados y vuelve a intentarlo.')
        .setColor(0xffa500)
        .setTimestamp()
        .setFooter({ text: 'Si el problema persiste, contacta con un administrador.' });
      await interaction.reply({ embeds: [embed], ephemeral: true });
    }
  }
};

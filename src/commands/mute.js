const { SlashCommandBuilder, EmbedBuilder, PermissionsBitField } = require('discord.js');
const ms = require('ms'); // Biblioteca para manejar la conversión de tiempo

module.exports = {
  data: new SlashCommandBuilder()
    .setName('mute')
    .setDescription('🔇 Silencia a un miembro del servidor.')
    .addUserOption(option => 
      option.setName('miembro')
        .setDescription('El miembro que deseas silenciar')
        .setRequired(true))
    .addStringOption(option =>
      option.setName('tiempo')
        .setDescription('Duración del mute (ej. 10m, 1h, 1d)')
        .setRequired(true))
    .addStringOption(option =>
      option.setName('razon')
        .setDescription('Razón para mutear al miembro')
        .setRequired(false)),

  async execute(interaction) {
    const guild = interaction.guild;
    const member = interaction.options.getMember('miembro');
    const time = interaction.options.getString('tiempo');
    let reason = interaction.options.getString('razon') || 'No se especificó una razón.';

    if (!interaction.member.permissions.has(PermissionsBitField.Flags.MuteMembers)) {
      return interaction.reply({
        content: 'No tienes permiso para silenciar miembros.',
        ephemeral: true,
      });
    }

    if (!member.moderatable) {
      return interaction.reply({
        content: 'No puedo silenciar a este miembro.',
        ephemeral: true,
      });
    }

    if (member.roles.cache.some(role => role.name === 'Muted')) {
      return interaction.reply({
        content: 'Este miembro ya está silenciado.',
        ephemeral: true,
      });
    }

    const muteRole = guild.roles.cache.find(role => role.name === 'Muted');

    if (!muteRole) {
      return interaction.reply({
        content: 'No se encontró el rol de mute.',
        ephemeral: true,
      });
    }

    try {
      await member.roles.add(muteRole);
      const muteDuration = ms(time);

      if (muteDuration) {
        setTimeout(async () => {
          await member.roles.remove(muteRole);
          const unmuteEmbed = new EmbedBuilder()
            .setTitle('🔊 Desmuteado')
            .setDescription(`El miembro **${member.user.tag}** ha sido desmuteado automáticamente después del tiempo de mute.`)
            .setColor('#00FF00')
            .setTimestamp();
          
          await interaction.channel.send({ embeds: [unmuteEmbed] });
        }, muteDuration);
      }

      const embed = new EmbedBuilder()
        .setTitle('🔇 Miembro Silenciado')
        .setThumbnail(interaction.client.user.displayAvatarURL())
        .setDescription(`
          **Miembro silenciado:** ${member.user.tag} (${member.id})
          **Tiempo de mute:** ${time}
          **Razón:** ${reason}
        `)
        .setColor('#FF0000')
        .setTimestamp();

      await interaction.reply({ embeds: [embed], ephemeral: false });
    } catch (error) {
      console.error('Error al silenciar al miembro:', error);
      await interaction.reply({
        content: 'Hubo un error al intentar silenciar al miembro.',
        ephemeral: true,
      });
    }
  }
};

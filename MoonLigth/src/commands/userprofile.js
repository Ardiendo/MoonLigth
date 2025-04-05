const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('userprofile')
    .setDescription('📋 Muestra información detallada sobre un usuario')
    .addUserOption(option => 
      option.setName('usuario')
        .setDescription('El usuario del que quieres ver el perfil')
        .setRequired(false)),

  async execute(interaction) {
    try {
      // Obtener usuario objetivo (el mencionado o el autor)
      const targetUser = interaction.options.getUser('usuario') || interaction.user;
      const member = await interaction.guild.members.fetch(targetUser.id).catch(() => null);

      if (!member) {
        return interaction.reply({
          content: '❌ No se pudo encontrar a ese miembro en el servidor.',
          flags: 64
        });
      }

      // Calcular fecha de creación de cuenta y de unión al servidor
      const createdAt = Math.floor(targetUser.createdTimestamp / 1000);
      const joinedAt = Math.floor(member.joinedTimestamp / 1000);

      // Roles del usuario (excluyendo @everyone)
      const roles = member.roles.cache
        .filter(role => role.id !== interaction.guild.id)
        .map(role => role.toString())
        .join(', ') || 'Ninguno';

      // Determinar si es bot, booster, etc.
      const badges = [];
      if (targetUser.bot) badges.push('🤖 Bot');
      if (member.premiumSince) badges.push('💎 Booster');
      if (member.permissions.has('Administrator')) badges.push('⚙️ Administrador');
      if (member.permissions.has('ModerateMembers')) badges.push('🔨 Moderador');

      // Crear el embed
      const profileEmbed = new EmbedBuilder()
        .setColor(member.displayHexColor)
        .setTitle(`Perfil de ${targetUser.tag}`)
        .setThumbnail(targetUser.displayAvatarURL({ dynamic: true, size: 256 }))
        .addFields(
          { name: '📛 Nombre', value: `${targetUser.username}`, inline: true },
          { name: '🆔 ID', value: targetUser.id, inline: true },
          { name: '📆 Cuenta creada', value: `<t:${createdAt}:R>`, inline: true },
          { name: '📥 Se unió al servidor', value: `<t:${joinedAt}:R>`, inline: true },
          { name: '🎭 Nickname', value: member.nickname || 'Ninguno', inline: true },
          { name: '🎨 Color', value: member.displayHexColor, inline: true },
          { name: '🔰 Insignias', value: badges.length ? badges.join('\n') : 'Ninguna', inline: false },
          { name: `👑 Roles (${member.roles.cache.size - 1})`, value: roles.length > 1024 ? 'Demasiados roles para mostrar' : roles, inline: false }
        )
        .setFooter({ text: `Solicitado por ${interaction.user.tag}`, iconURL: interaction.user.displayAvatarURL() })
        .setTimestamp();

      // Enviar el embed
      await interaction.reply({ embeds: [profileEmbed] });

    } catch (error) {
      console.error(error);
      await interaction.reply({
        content: '❌ Hubo un error al obtener el perfil del usuario.',
        flags: 64
      });
    }
  },
};
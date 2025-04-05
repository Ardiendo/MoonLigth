
const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits, ActionRowBuilder, StringSelectMenuBuilder, ComponentType } = require('discord.js');

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
    try {
      if (!interaction.member.permissions.has(PermissionFlagsBits.BanMembers)) {
        const embed = new EmbedBuilder()
          .setTitle('Permiso Denegado 🚫')
          .setDescription('No tienes permiso para usar este comando.')
          .setColor(0xff0000)
          .setTimestamp();
        return interaction.reply({ embeds: [embed], ephemeral: true });
      }

      const user = interaction.options.getUser('usuario');
      const reason = interaction.options.getString('razon') || 'No se proporcionó una razón';

      const options = [
        {
          label: 'Ban Suave',
          description: 'Banear sin eliminar mensajes',
          value: 'soft',
          emoji: '🔨'
        },
        {
          label: 'Ban Normal',
          description: 'Banear y eliminar mensajes de 24h',
          value: 'normal',
          emoji: '⚒️'
        },
        {
          label: 'Ban Duro',
          description: 'Banear y eliminar todos los mensajes',
          value: 'hard',
          emoji: '⛔'
        }
      ];

      const selectMenu = new ActionRowBuilder()
        .addComponents(
          new StringSelectMenuBuilder()
            .setCustomId('ban-menu')
            .setPlaceholder('Selecciona el tipo de ban')
            .addOptions(options)
        );

      const initialEmbed = new EmbedBuilder()
        .setTitle('Sistema de Ban')
        .setDescription(`Selecciona el tipo de ban para ${user.tag}`)
        .setColor('Red')
        .setTimestamp();

      const response = await interaction.reply({
        embeds: [initialEmbed],
        components: [selectMenu],
        withResponse: true
      });

      const collector = response.createMessageComponentCollector({
        componentType: ComponentType.SelectMenu,
        time: 30000
      });

      collector.on('collect', async i => {
        if (i.user.id === interaction.user.id) {
          const selection = i.values[0];
          let deleteMessageSeconds = 0;

          switch(selection) {
            case 'soft':
              deleteMessageSeconds = 0;
              break;
            case 'normal':
              deleteMessageSeconds = 86400;
              break;
            case 'hard':
              deleteMessageSeconds = 604800;
              break;
          }

          try {
            await interaction.guild.members.ban(user, {
              deleteMessageSeconds: deleteMessageSeconds,
              reason: `${reason} (${selection} ban por ${interaction.user.tag})`
            });

            const banEmbed = new EmbedBuilder()
              .setTitle('Usuario Baneado 🔨')
              .setDescription(`El usuario **${user.tag}** ha sido baneado del servidor.`)
              .addFields(
                { name: 'Tipo de Ban', value: selection, inline: true },
                { name: 'Razón', value: reason, inline: true },
                { name: 'Baneado por', value: interaction.user.tag, inline: true }
              )
              .setColor('Red')
              .setTimestamp();

            await i.update({ embeds: [banEmbed], components: [] });
          } catch (error) {
            console.error(error);
            const errorEmbed = new EmbedBuilder()
              .setTitle('Error 🚨')
              .setDescription('No se pudo banear al usuario. Verifica mis permisos y la jerarquía de roles.')
              .setColor('Red');
            await i.update({ embeds: [errorEmbed], components: [] });
          }
        }
      });

      collector.on('end', collected => {
        if (collected.size === 0) {
          const timeoutEmbed = new EmbedBuilder()
            .setTitle('Tiempo Agotado ⏰')
            .setDescription('El comando ha expirado. Por favor, inténtalo de nuevo.')
            .setColor('Red');
          interaction.editReply({ embeds: [timeoutEmbed], components: [] });
        }
      });

    } catch (error) {
      console.error('Error:', error);
      const errorEmbed = new EmbedBuilder()
        .setTitle('Error 🚨')
        .setDescription('Hubo un error al ejecutar el comando.')
        .setColor('Red');
      await interaction.reply({ embeds: [errorEmbed], ephemeral: true });
    }
  }
};

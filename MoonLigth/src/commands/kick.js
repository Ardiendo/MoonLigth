
const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits, ActionRowBuilder, SelectMenuBuilder, ComponentType } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('kick')
    .setDescription('🚪 Expulsa a un usuario del servidor.')
    .addUserOption(option => 
      option.setName('usuario')
        .setDescription('Usuario a expulsar')
        .setRequired(true))
    .addStringOption(option => 
      option.setName('razon')
        .setDescription('Razón de la expulsión')
        .setRequired(false)),

  async execute(interaction) {
    try {
      if (!interaction.member.permissions.has(PermissionFlagsBits.KickMembers)) {
        const embed = new EmbedBuilder()
          .setTitle('Permiso Denegado 🚫')
          .setDescription('No tienes permiso para usar este comando.')
          .setColor('Red')
          .setTimestamp();
        return interaction.reply({ embeds: [embed], ephemeral: true });
      }

      const user = interaction.options.getUser('usuario');
      const reason = interaction.options.getString('razon') || 'No se proporcionó una razón';

      const options = [
        {
          label: 'Kick Normal',
          description: 'Expulsar sin notificación por DM',
          value: 'normal',
          emoji: '👢'
        },
        {
          label: 'Kick con Aviso',
          description: 'Expulsar y enviar notificación por DM',
          value: 'notify',
          emoji: '📨'
        },
        {
          label: 'Kick Silencioso',
          description: 'Expulsar sin anuncio en el canal',
          value: 'silent',
          emoji: '🤫'
        }
      ];

      const selectMenu = new ActionRowBuilder()
        .addComponents(
          new SelectMenuBuilder()
            .setCustomId('kick-menu')
            .setPlaceholder('Selecciona el tipo de expulsión')
            .addOptions(options)
        );

      const initialEmbed = new EmbedBuilder()
        .setTitle('Sistema de Expulsión')
        .setDescription(`Selecciona el tipo de expulsión para ${user.tag}`)
        .setColor('Orange')
        .setTimestamp();

      const response = await interaction.reply({
        embeds: [initialEmbed],
        components: [selectMenu],
        fetchReply: true
      });

      const collector = response.createMessageComponentCollector({
        componentType: ComponentType.SelectMenu,
        time: 30000
      });

      collector.on('collect', async i => {
        if (i.user.id === interaction.user.id) {
          const selection = i.values[0];

          try {
            const member = await interaction.guild.members.fetch(user.id);
            
            if (selection === 'notify') {
              try {
                await user.send({
                  embeds: [
                    new EmbedBuilder()
                      .setTitle('Has sido expulsado')
                      .setDescription(`Has sido expulsado de ${interaction.guild.name}`)
                      .addFields({ name: 'Razón', value: reason })
                      .setColor('Orange')
                      .setTimestamp()
                  ]
                });
              } catch (error) {
                console.error('No se pudo enviar DM al usuario:', error);
              }
            }

            await member.kick(reason);

            const kickEmbed = new EmbedBuilder()
              .setTitle('Usuario Expulsado 👢')
              .setDescription(`El usuario **${user.tag}** ha sido expulsado del servidor.`)
              .addFields(
                { name: 'Tipo de Expulsión', value: selection, inline: true },
                { name: 'Razón', value: reason, inline: true },
                { name: 'Expulsado por', value: interaction.user.tag, inline: true }
              )
              .setColor('Orange')
              .setTimestamp();

            if (selection === 'silent') {
              await i.update({ embeds: [kickEmbed], components: [], ephemeral: true });
            } else {
              await i.update({ embeds: [kickEmbed], components: [] });
            }

          } catch (error) {
            console.error(error);
            const errorEmbed = new EmbedBuilder()
              .setTitle('Error 🚨')
              .setDescription('No se pudo expulsar al usuario. Verifica mis permisos y la jerarquía de roles.')
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

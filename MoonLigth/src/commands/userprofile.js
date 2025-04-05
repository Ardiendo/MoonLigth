
const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, StringSelectMenuBuilder, ButtonBuilder, ButtonStyle, ComponentType } = require('discord.js');
require('dotenv').config();

module.exports = {
  data: new SlashCommandBuilder()
    .setName('userprofile')
    .setDescription('Muestra información detallada sobre el usuario.')
    .addUserOption(option => 
      option.setName('usuario')
        .setDescription('Usuario del que quieres ver la información')
        .setRequired(false)),

  async execute(interaction) {
    try {
      const targetUser = interaction.options.getUser('usuario') || interaction.user;
      const member = interaction.guild.members.cache.get(targetUser.id);
      const developerId = process.env.DEVELOPER_ID;

      const mainEmbed = new EmbedBuilder()
        .setColor("Random")
        .setTitle(`Perfil de ${targetUser.tag}`)
        .setThumbnail(targetUser.displayAvatarURL({ dynamic: true, size: 512 }))
        .setDescription(`Selecciona una opción del menú para ver información específica sobre ${targetUser.username}`);

      const menu = new ActionRowBuilder()
        .addComponents(
          new StringSelectMenuBuilder()
            .setCustomId('profile-menu')
            .setPlaceholder('Selecciona una categoría')
            .addOptions([
              {
                label: 'Información General',
                description: 'Ver información básica del usuario',
                value: 'general',
                emoji: '👤'
              },
              {
                label: 'Información del Servidor',
                description: 'Ver información específica del servidor',
                value: 'server',
                emoji: '🏰'
              },
              {
                label: 'Roles y Permisos',
                description: 'Ver roles y permisos del usuario',
                value: 'roles',
                emoji: '⚔️'
              },
              {
                label: 'Presencia',
                description: 'Ver estado y actividad actual',
                value: 'presence',
                emoji: '🎮'
              }
            ])
        );

      const response = await interaction.reply({
        embeds: [mainEmbed],
        components: [menu],
        fetchReply: true
      });

      const collector = response.createMessageComponentCollector({
        componentType: ComponentType.StringSelect,
        time: 60000
      });

      collector.on('collect', async i => {
        if (i.user.id === interaction.user.id) {
          const embed = new EmbedBuilder()
            .setColor("Random")
            .setTimestamp()
            .setFooter({ text: `Solicitado por ${i.user.tag}`, iconURL: i.user.displayAvatarURL() });

          switch (i.values[0]) {
            case 'general':
              embed
                .setTitle(`📋 Información General de ${targetUser.tag}`)
                .addFields(
                  { name: '🏷️ Nombre', value: targetUser.username, inline: true },
                  { name: '🆔 ID', value: targetUser.id, inline: true },
                  { name: '📅 Cuenta Creada', value: `<t:${Math.floor(targetUser.createdTimestamp / 1000)}:R>`, inline: true },
                  { name: '🤖 Bot', value: targetUser.bot ? 'Sí' : 'No', inline: true },
                  { name: '🎨 Color de Acento', value: member.displayHexColor || 'Ninguno', inline: true },
                  { name: '🖼️ Avatar', value: `[Link](${targetUser.displayAvatarURL({ dynamic: true, size: 1024 })})`, inline: true }
                );
              break;

            case 'server':
              embed
                .setTitle(`🏰 Información del Servidor para ${targetUser.tag}`)
                .addFields(
                  { name: '📝 Apodo', value: member.nickname || 'Sin apodo', inline: true },
                  { name: '📅 Se unió al servidor', value: `<t:${Math.floor(member.joinedTimestamp / 1000)}:R>`, inline: true },
                  { name: '🎭 Rol más alto', value: member.roles.highest.name, inline: true },
                  { name: '🎨 Color del rol', value: member.displayHexColor || 'Ninguno', inline: true },
                  { name: '🛡️ Moderado', value: member.isCommunicationDisabled() ? 'Sí' : 'No', inline: true },
                  { name: '🎯 Boosting', value: member.premiumSince ? `Desde <t:${Math.floor(member.premiumSince / 1000)}:R>` : 'No', inline: true }
                );
              break;

            case 'roles':
              const roles = member.roles.cache
                .sort((a, b) => b.position - a.position)
                .map(role => role.toString())
                .slice(0, 15);

              embed
                .setTitle(`⚔️ Roles y Permisos de ${targetUser.tag}`)
                .addFields(
                  { name: '🛡️ Roles', value: roles.join(', ') || 'Sin roles' },
                  { name: '📊 Total de roles', value: `${member.roles.cache.size - 1}`, inline: true },
                  { name: '⚡ Permisos Clave', value: member.permissions.toArray().slice(0, 5).join(', ').replaceAll('_', ' ').toLowerCase() || 'Ninguno' }
                );
              break;

            case 'presence':
              const status = {
                online: '🟢 En línea',
                idle: '🟡 Ausente',
                dnd: '🔴 No molestar',
                offline: '⚫ Desconectado'
              };

              embed
                .setTitle(`🎮 Presencia de ${targetUser.tag}`)
                .addFields(
                  { name: '📡 Estado', value: status[member.presence?.status || 'offline'], inline: true },
                  { name: '🎯 Cliente', value: member.presence?.clientStatus ? Object.keys(member.presence.clientStatus).join(', ') : 'Desconocido', inline: true }
                );

              if (member.presence?.activities?.length > 0) {
                member.presence.activities.forEach(activity => {
                  embed.addFields({
                    name: `${activity.type === 'CUSTOM_STATUS' ? '💭' : '🎮'} ${activity.type}`,
                    value: activity.name + (activity.details ? `\n${activity.details}` : ''),
                    inline: false
                  });
                });
              }
              break;
          }

          if (targetUser.id === developerId) {
            embed.addFields({ 
              name: '👑 Información Especial', 
              value: '¡Este usuario es el desarrollador del bot!' 
            });
          }

          await i.update({ embeds: [embed], components: [menu] });
        } else {
          await i.reply({ 
            content: '❌ No puedes interactuar con este menú.', 
            ephemeral: true 
          });
        }
      });

      collector.on('end', () => {
        menu.components[0].setDisabled(true);
        interaction.editReply({ components: [menu] }).catch(() => {});
      });

    } catch (error) {
      console.error('Error en el comando userprofile:', error);
      const errorEmbed = new EmbedBuilder()
        .setColor('Red')
        .setTitle('❌ Error')
        .setDescription('Hubo un error al mostrar la información del usuario.')
        .addFields(
          { name: 'Comando', value: interaction.commandName, inline: true },
          { name: 'Error', value: error.message, inline: true }
        )
        .setTimestamp();

      await interaction.reply({ embeds: [errorEmbed], ephemeral: true });
    }
  },
};

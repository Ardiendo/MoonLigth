
const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits, ActionRowBuilder, StringSelectMenuBuilder, ComponentType, RoleManager } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('configrole')
    .setDescription('🎭 Gestiona los roles del servidor.')
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageRoles),

  async execute(interaction) {
    try {
      const mainEmbed = new EmbedBuilder()
        .setColor("Random")
        .setTitle('🎭 Gestión de Roles')
        .setDescription('Selecciona una acción para gestionar los roles.')
        .setThumbnail(interaction.guild.iconURL())
        .setTimestamp();

      const menu = new ActionRowBuilder()
        .addComponents(
          new StringSelectMenuBuilder()
            .setCustomId('role-menu')
            .setPlaceholder('Selecciona una acción')
            .addOptions([
              {
                label: 'Crear Rol',
                description: 'Crea un nuevo rol en el servidor',
                value: 'create',
                emoji: '➕'
              },
              {
                label: 'Eliminar Rol',
                description: 'Elimina un rol existente',
                value: 'delete',
                emoji: '🗑️'
              },
              {
                label: 'Modificar Rol',
                description: 'Modifica un rol existente',
                value: 'modify',
                emoji: '⚙️'
              },
              {
                label: 'Asignar Rol',
                description: 'Asigna un rol a un usuario',
                value: 'assign',
                emoji: '👤'
              },
              {
                label: 'Remover Rol',
                description: 'Remueve un rol de un usuario',
                value: 'remove',
                emoji: '❌'
              }
            ])
        );

      const response = await interaction.reply({
        embeds: [mainEmbed],
        components: [menu],
        ephemeral: true
      });

      const collector = response.createMessageComponentCollector({
        componentType: ComponentType.StringSelect,
        time: 60000
      });

      collector.on('collect', async i => {
        if (i.user.id === interaction.user.id) {
          const roles = interaction.guild.roles.cache
            .filter(role => role.name !== '@everyone')
            .map(role => ({
              label: role.name,
              value: role.id,
              emoji: '🏷️'
            }))
            .slice(0, 25); // Limit to 25 roles

          switch (i.values[0]) {
            case 'create':
              const createEmbed = new EmbedBuilder()
                .setColor("Green")
                .setTitle('➕ Crear Rol')
                .setDescription('Para crear un rol, usa el siguiente comando:\n`/createrole nombre:#color:permisos`')
                .addFields(
                  { name: 'Ejemplo', value: '`/createrole Moderador:#ff0000:kickMembers,banMembers`' }
                );
              await i.update({ embeds: [createEmbed], components: [] });
              break;

            case 'delete':
              if (roles.length === 0) {
                await i.update({ content: '❌ No hay roles disponibles para eliminar.', embeds: [], components: [] });
                return;
              }

              const deleteMenu = new ActionRowBuilder()
                .addComponents(
                  new StringSelectMenuBuilder()
                    .setCustomId('delete-role')
                    .setPlaceholder('Selecciona un rol para eliminar')
                    .addOptions(roles)
                );

              await i.update({ content: 'Selecciona el rol que deseas eliminar:', components: [deleteMenu] });
              break;

            case 'modify':
              if (roles.length === 0) {
                await i.update({ content: '❌ No hay roles disponibles para modificar.', embeds: [], components: [] });
                return;
              }

              const modifyMenu = new ActionRowBuilder()
                .addComponents(
                  new StringSelectMenuBuilder()
                    .setCustomId('modify-role')
                    .setPlaceholder('Selecciona un rol para modificar')
                    .addOptions(roles)
                );

              await i.update({ content: 'Selecciona el rol que deseas modificar:', components: [modifyMenu] });
              break;

            case 'assign':
              if (roles.length === 0) {
                await i.update({ content: '❌ No hay roles disponibles para asignar.', embeds: [], components: [] });
                return;
              }

              const assignMenu = new ActionRowBuilder()
                .addComponents(
                  new StringSelectMenuBuilder()
                    .setCustomId('assign-role')
                    .setPlaceholder('Selecciona un rol para asignar')
                    .addOptions(roles)
                );

              try {
                await i.update({ 
                  content: 'Selecciona el rol que deseas asignar:', 
                  components: [assignMenu],
                  fetchReply: true 
                });

                const assignCollector = i.message.createMessageComponentCollector({
                  componentType: ComponentType.StringSelect,
                  time: 30000
                });

                assignCollector.on('collect', async (roleSelection) => {
                  const selectedRole = interaction.guild.roles.cache.get(roleSelection.values[0]);
                  if (selectedRole) {
                    try {
                      const targetUser = await interaction.guild.members.fetch(interaction.user.id);
                      await targetUser.roles.add(selectedRole);
                      await roleSelection.update({
                        content: `✅ Rol ${selectedRole.name} asignado correctamente.`,
                        components: []
                      });
                    } catch (error) {
                      await roleSelection.update({
                        content: '❌ Error al asignar el rol. Verifica los permisos.',
                        components: []
                      });
                    }
                  }
                });
              } catch (error) {
                await i.update({
                  content: '❌ Ocurrió un error al procesar la asignación del rol.',
                  components: []
                });
              }
              break;

            case 'remove':
              if (roles.length === 0) {
                await i.update({ content: '❌ No hay roles disponibles para remover.', embeds: [], components: [] });
                return;
              }

              const removeMenu = new ActionRowBuilder()
                .addComponents(
                  new StringSelectMenuBuilder()
                    .setCustomId('remove-role')
                    .setPlaceholder('Selecciona un rol para remover')
                    .addOptions(roles)
                );

              await i.update({ content: 'Selecciona el rol que deseas remover:', components: [removeMenu] });
              break;
          }
        } else {
          await i.reply({ content: '❌ No puedes usar este menú.', ephemeral: true });
        }
      });

      collector.on('end', () => {
        menu.components[0].setDisabled(true);
        interaction.editReply({ components: [menu] }).catch(() => {});
      });

    } catch (error) {
      console.error(error);
      await interaction.reply({ 
        content: 'Hubo un error al ejecutar el comando.',
        ephemeral: true 
      });
    }
  },
};

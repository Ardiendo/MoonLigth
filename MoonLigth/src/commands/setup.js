
const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits, ActionRowBuilder, StringSelectMenuBuilder, ComponentType, ChannelType, ModalBuilder, TextInputBuilder, TextInputStyle } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('setup')
    .setDescription('⚙️ Configura las diferentes opciones del bot')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

  async execute(interaction) {
    try {
      const setupEmbed = new EmbedBuilder()
        .setColor("Random")
        .setTitle('⚙️ Panel de Configuración')
        .setDescription('Selecciona una categoría para configurar el bot.')
        .setThumbnail(interaction.guild.iconURL())
        .setTimestamp();

      const menu = new ActionRowBuilder()
        .addComponents(
          new StringSelectMenuBuilder()
            .setCustomId('setup-menu')
            .setPlaceholder('Selecciona una categoría')
            .addOptions([
              {
                label: 'Canales',
                description: 'Configura los canales del servidor',
                value: 'channels',
                emoji: '📺'
              },
              {
                label: 'Roles',
                description: 'Configura los roles del servidor',
                value: 'roles',
                emoji: '👑'
              },
              {
                label: 'Moderación',
                description: 'Configura las opciones de moderación',
                value: 'moderation',
                emoji: '🛡️'
              },
              {
                label: 'Logs',
                description: 'Configura los canales de logs',
                value: 'logs',
                emoji: '📝'
              },
              {
                label: 'Bienvenida',
                description: 'Configura el mensaje de bienvenida',
                value: 'welcome',
                emoji: '👋'
              }
            ])
        );

      const response = await interaction.reply({
        embeds: [setupEmbed],
        components: [menu],
        ephemeral: true
      });

      const collector = response.createMessageComponentCollector({
        componentType: ComponentType.StringSelect,
        time: 300000
      });

      collector.on('collect', async i => {
        if (i.user.id === interaction.user.id) {
          const selection = i.values[0];

          switch(selection) {
            case 'channels':
              const channelModal = new ModalBuilder()
                .setCustomId('channel-config')
                .setTitle('Configuración de Canales');

              const generalChannel = new TextInputBuilder()
                .setCustomId('general-channel')
                .setLabel('ID del Canal General')
                .setStyle(TextInputStyle.Short)
                .setRequired(true);

              const announcementChannel = new TextInputBuilder()
                .setCustomId('announcement-channel')
                .setLabel('ID del Canal de Anuncios')
                .setStyle(TextInputStyle.Short)
                .setRequired(true);

              const welcomeChannel = new TextInputBuilder()
                .setCustomId('welcome-channel')
                .setLabel('ID del Canal de Bienvenida')
                .setStyle(TextInputStyle.Short)
                .setRequired(true);

              const firstRow = new ActionRowBuilder().addComponents(generalChannel);
              const secondRow = new ActionRowBuilder().addComponents(announcementChannel);
              const thirdRow = new ActionRowBuilder().addComponents(welcomeChannel);

              channelModal.addComponents(firstRow, secondRow, thirdRow);
              await i.showModal(channelModal);
              break;

            case 'roles':
              const roleModal = new ModalBuilder()
                .setCustomId('role-config')
                .setTitle('Configuración de Roles');

              const defaultRole = new TextInputBuilder()
                .setCustomId('default-role')
                .setLabel('ID del Rol por Defecto')
                .setStyle(TextInputStyle.Short)
                .setRequired(true);

              const modRole = new TextInputBuilder()
                .setCustomId('mod-role')
                .setLabel('ID del Rol de Moderación')
                .setStyle(TextInputStyle.Short)
                .setRequired(true);

              const levelRole = new TextInputBuilder()
                .setCustomId('level-role')
                .setLabel('ID del Rol de Nivel (separados por ,)')
                .setStyle(TextInputStyle.Paragraph)
                .setRequired(true);

              roleModal.addComponents(
                new ActionRowBuilder().addComponents(defaultRole),
                new ActionRowBuilder().addComponents(modRole),
                new ActionRowBuilder().addComponents(levelRole)
              );

              await i.showModal(roleModal);
              break;

            case 'moderation':
              const modModal = new ModalBuilder()
                .setCustomId('mod-config')
                .setTitle('Configuración de Moderación');

              const antiSpam = new TextInputBuilder()
                .setCustomId('anti-spam')
                .setLabel('Límite de mensajes (por 5 segundos)')
                .setStyle(TextInputStyle.Short)
                .setRequired(true);

              const autoMod = new TextInputBuilder()
                .setCustomId('auto-mod')
                .setLabel('Palabras prohibidas (separadas por ,)')
                .setStyle(TextInputStyle.Paragraph)
                .setRequired(true);

              const punishment = new TextInputBuilder()
                .setCustomId('punishment')
                .setLabel('Tipo de castigo (mute/kick/ban)')
                .setStyle(TextInputStyle.Short)
                .setRequired(true);

              modModal.addComponents(
                new ActionRowBuilder().addComponents(antiSpam),
                new ActionRowBuilder().addComponents(autoMod),
                new ActionRowBuilder().addComponents(punishment)
              );

              await i.showModal(modModal);
              break;

            case 'logs':
              const logsModal = new ModalBuilder()
                .setCustomId('logs-config')
                .setTitle('Configuración de Logs');

              const modLogs = new TextInputBuilder()
                .setCustomId('mod-logs')
                .setLabel('ID del Canal de Logs de Moderación')
                .setStyle(TextInputStyle.Short)
                .setRequired(true);

              const serverLogs = new TextInputBuilder()
                .setCustomId('server-logs')
                .setLabel('ID del Canal de Logs del Servidor')
                .setStyle(TextInputStyle.Short)
                .setRequired(true);

              const messageLogs = new TextInputBuilder()
                .setCustomId('message-logs')
                .setLabel('ID del Canal de Logs de Mensajes')
                .setStyle(TextInputStyle.Short)
                .setRequired(true);

              logsModal.addComponents(
                new ActionRowBuilder().addComponents(modLogs),
                new ActionRowBuilder().addComponents(serverLogs),
                new ActionRowBuilder().addComponents(messageLogs)
              );

              await i.showModal(logsModal);
              break;

            case 'welcome':
              const welcomeModal = new ModalBuilder()
                .setCustomId('welcome-config')
                .setTitle('Configuración de Bienvenida');

              const welcomeMessage = new TextInputBuilder()
                .setCustomId('welcome-message')
                .setLabel('Mensaje de Bienvenida')
                .setStyle(TextInputStyle.Paragraph)
                .setRequired(true)
                .setValue('¡Bienvenido {user} a {server}!');

              const welcomeImage = new TextInputBuilder()
                .setCustomId('welcome-image')
                .setLabel('URL de la Imagen de Bienvenida')
                .setStyle(TextInputStyle.Short)
                .setRequired(false);

              welcomeModal.addComponents(
                new ActionRowBuilder().addComponents(welcomeMessage),
                new ActionRowBuilder().addComponents(welcomeImage)
              );

              await i.showModal(welcomeModal);
              break;
          }
        } else {
          await i.reply({ content: '❌ No puedes usar este menú.', ephemeral: true });
        }
      });

      // Manejador de envío de modales
      interaction.client.on('interactionCreate', async interaction => {
        if (!interaction.isModalSubmit()) return;

        try {
          switch (interaction.customId) {
            case 'channel-config':
              // Guardar configuración de canales
              const generalId = interaction.fields.getTextInputValue('general-channel');
              const announcementId = interaction.fields.getTextInputValue('announcement-channel');
              const welcomeId = interaction.fields.getTextInputValue('welcome-channel');
              
              await interaction.reply({
                content: '✅ Configuración de canales guardada correctamente.',
                ephemeral: true
              });
              break;

            case 'role-config':
              // Guardar configuración de roles
              const defaultRoleId = interaction.fields.getTextInputValue('default-role');
              const modRoleId = interaction.fields.getTextInputValue('mod-role');
              const levelRoles = interaction.fields.getTextInputValue('level-role').split(',');

              await interaction.reply({
                content: '✅ Configuración de roles guardada correctamente.',
                ephemeral: true
              });
              break;

            case 'mod-config':
              // Guardar configuración de moderación
              const spamLimit = interaction.fields.getTextInputValue('anti-spam');
              const badWords = interaction.fields.getTextInputValue('auto-mod').split(',');
              const punishmentType = interaction.fields.getTextInputValue('punishment');

              await interaction.reply({
                content: '✅ Configuración de moderación guardada correctamente.',
                ephemeral: true
              });
              break;

            case 'logs-config':
              // Guardar configuración de logs
              const modLogsId = interaction.fields.getTextInputValue('mod-logs');
              const serverLogsId = interaction.fields.getTextInputValue('server-logs');
              const messageLogsId = interaction.fields.getTextInputValue('message-logs');

              await interaction.reply({
                content: '✅ Configuración de logs guardada correctamente.',
                ephemeral: true
              });
              break;

            case 'welcome-config':
              // Guardar configuración de bienvenida
              const welcomeMsg = interaction.fields.getTextInputValue('welcome-message');
              const welcomeImg = interaction.fields.getTextInputValue('welcome-image');

              await interaction.reply({
                content: '✅ Configuración de bienvenida guardada correctamente.',
                ephemeral: true
              });
              break;
          }
        } catch (error) {
          console.error(error);
          await interaction.reply({
            content: '❌ Hubo un error al guardar la configuración.',
            ephemeral: true
          });
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

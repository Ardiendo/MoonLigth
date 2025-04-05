const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, SelectMenuBuilder, ButtonBuilder, ButtonStyle, ComponentType, PermissionFlagsBits, ModalBuilder, TextInputBuilder, TextInputStyle } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('dev')
    .setDescription('Herramientas de desarrollo')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

  async execute(interaction) {
    try {
      const embed = new EmbedBuilder()
        .setColor("Random")
        .setTitle('🛠️ MoonLigth | Panel de Desarrollo')
        .setDescription('Bienvenido al panel de desarrollo.\n\nUtiliza los menús desplegables para gestionar las diferentes configuraciones.')
        .setThumbnail(interaction.client.user.displayAvatarURL())
        .setFooter({ text: 'MoonLigth Dev Interface' });

      const channelMenu = new SelectMenuBuilder()
        .setCustomId('channel-menu')
        .setPlaceholder('📺 Configuración de Canal')
        .addOptions([
          { label: 'Configurar nombre', value: 'nombre', emoji: '📝' },
          { label: 'Configurar límite', value: 'limite', emoji: '👥' },
          { label: 'Configurar bitrate', value: 'bitrate', emoji: '🎵' }
        ]);

      const permissionsMenu = new SelectMenuBuilder()
        .setCustomId('perms-menu')
        .setPlaceholder('🔒 Gestión de Permisos')
        .addOptions([
          { label: 'Ver permisos', value: 'ver-permisos', emoji: '👀' },
          { label: 'Añadir permiso', value: 'añadir-permiso', emoji: '✅' },
          { label: 'Remover permiso', value: 'remover-permiso', emoji: '❌' }
        ]);

      const row1 = new ActionRowBuilder().addComponents(channelMenu);
      const row2 = new ActionRowBuilder().addComponents(permissionsMenu);

      const response = await interaction.reply({ 
        embeds: [embed], 
        components: [row1, row2],
        ephemeral: true 
      });

      const collector = response.createMessageComponentCollector({ 
        componentType: ComponentType.SelectMenu,
        time: 300000 
      });

      collector.on('collect', async i => {
        if (i.user.id === interaction.user.id) {
          const value = i.values[0];

          if (i.customId === 'channel-menu') {
            const modal = new ModalBuilder()
              .setCustomId(`modal-${value}`)
              .setTitle('Configuración de Canal');

            const input = new TextInputBuilder()
              .setCustomId(`${value}-input`)
              .setLabel(value.charAt(0).toUpperCase() + value.slice(1))
              .setStyle(TextInputStyle.Short)
              .setRequired(true);

            const actionRow = new ActionRowBuilder().addComponents(input);
            modal.addComponents(actionRow);
            await i.showModal(modal);

          } else if (i.customId === 'perms-menu') {
            if (value === 'ver-permisos') {
              const permsEmbed = new EmbedBuilder()
                .setColor("Blue")
                .setTitle('🔒 Permisos del Canal')
                .setDescription('Lista de permisos actuales:')
                .addFields(
                  { name: 'Administrador', value: '✅', inline: true },
                  { name: 'Gestionar Mensajes', value: '✅', inline: true },
                  { name: 'Ver Canal', value: '✅', inline: true }
                );
              await i.reply({ embeds: [permsEmbed], ephemeral: true });
            } else {
              const modal = new ModalBuilder()
                .setCustomId(`modal-${value}`)
                .setTitle('Gestión de Permisos');

              const userInput = new TextInputBuilder()
                .setCustomId('user-input')
                .setLabel('ID del Usuario')
                .setStyle(TextInputStyle.Short)
                .setRequired(true);

              const actionRow = new ActionRowBuilder().addComponents(userInput);
              modal.addComponents(actionRow);
              await i.showModal(modal);
            }
          }
        } else {
          await i.reply({ content: 'No puedes usar este menú.', ephemeral: true });
        }
      });

      collector.on('end', collected => {
        if (collected.size === 0) {
          const timeoutEmbed = new EmbedBuilder()
            .setColor("Red")
            .setTitle('⏰ Tiempo Agotado')
            .setDescription('El panel de desarrollo ha expirado.');
          interaction.editReply({ embeds: [timeoutEmbed], components: [] });
        }
      });

    } catch (error) {
      console.error(`Error en comando dev: ${error}`);
      const errorEmbed = new EmbedBuilder()
        .setColor("Red")
        .setTitle('❌ Error')
        .setDescription('Ocurrió un error al ejecutar el comando.')
        .addFields({ name: 'Detalles', value: error.message });
      await interaction.reply({ embeds: [errorEmbed], ephemeral: true });
    }
  }
};
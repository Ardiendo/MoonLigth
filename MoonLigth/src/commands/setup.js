
const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits, ActionRowBuilder, StringSelectMenuBuilder, ComponentType } = require('discord.js');

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
        time: 60000
      });

      collector.on('collect', async i => {
        if (i.user.id === interaction.user.id) {
          const selection = i.values[0];
          const configEmbed = new EmbedBuilder()
            .setColor("Random")
            .setTimestamp();

          switch(selection) {
            case 'channels':
              configEmbed
                .setTitle('📺 Configuración de Canales')
                .setDescription('Aquí podrás configurar los diferentes canales del servidor.')
                .addFields(
                  { name: 'Canal General', value: 'Canal principal del servidor', inline: true },
                  { name: 'Canal de Anuncios', value: 'Canal para anuncios importantes', inline: true },
                  { name: 'Canal de Bienvenida', value: 'Canal para mensajes de bienvenida', inline: true }
                );
              break;
            case 'roles':
              configEmbed
                .setTitle('👑 Configuración de Roles')
                .setDescription('Aquí podrás configurar los roles del servidor.')
                .addFields(
                  { name: 'Rol por Defecto', value: 'Rol asignado a nuevos miembros', inline: true },
                  { name: 'Roles de Moderación', value: 'Roles con permisos especiales', inline: true },
                  { name: 'Roles de Nivel', value: 'Roles basados en actividad', inline: true }
                );
              break;
            case 'moderation':
              configEmbed
                .setTitle('🛡️ Configuración de Moderación')
                .setDescription('Aquí podrás configurar las opciones de moderación.')
                .addFields(
                  { name: 'Anti-Spam', value: 'Configura la protección contra spam', inline: true },
                  { name: 'Auto-Mod', value: 'Configura la moderación automática', inline: true },
                  { name: 'Filtros', value: 'Configura filtros de contenido', inline: true }
                );
              break;
            case 'logs':
              configEmbed
                .setTitle('📝 Configuración de Logs')
                .setDescription('Aquí podrás configurar los canales de logs.')
                .addFields(
                  { name: 'Logs de Moderación', value: 'Registro de acciones de moderación', inline: true },
                  { name: 'Logs de Servidor', value: 'Registro de cambios en el servidor', inline: true },
                  { name: 'Logs de Mensajes', value: 'Registro de mensajes editados/borrados', inline: true }
                );
              break;
            case 'welcome':
              configEmbed
                .setTitle('👋 Configuración de Bienvenida')
                .setDescription('Aquí podrás configurar el mensaje de bienvenida.')
                .addFields(
                  { name: 'Mensaje', value: 'Personaliza el mensaje de bienvenida', inline: true },
                  { name: 'Canal', value: 'Selecciona el canal de bienvenida', inline: true },
                  { name: 'Imagen', value: 'Configura la imagen de bienvenida', inline: true }
                );
              break;
          }

          await i.update({ embeds: [configEmbed], components: [menu] });
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

const { SlashCommandBuilder, PermissionFlagsBits, ChannelType, EmbedBuilder, ActionRowBuilder, StringSelectMenuBuilder, ButtonBuilder, ButtonStyle, ComponentType } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('tickets')
    .setDescription('Administra el sistema de tickets.'),

  async execute(interaction) {
    try {
      const mainEmbed = new EmbedBuilder()
        .setColor("Random")
        .setTitle('🎫 Sistema de Tickets')
        .setDescription('Selecciona una acción del menú desplegable.')
        .setThumbnail(interaction.client.user.displayAvatarURL())
        .setTimestamp();

      const menu = new ActionRowBuilder()
        .addComponents(
          new StringSelectMenuBuilder()
            .setCustomId('ticket-menu')
            .setPlaceholder('Selecciona una acción')
            .addOptions([
              {
                label: 'Crear Ticket',
                description: 'Crea un nuevo ticket de soporte',
                value: 'create',
                emoji: '📩'
              },
              {
                label: 'Cerrar Ticket',
                description: 'Cierra el ticket actual',
                value: 'close',
                emoji: '🔒'
              },
              {
                label: 'Añadir Usuario',
                description: 'Añade un usuario al ticket',
                value: 'add',
                emoji: '➕'
              },
              {
                label: 'Eliminar Usuario',
                description: 'Elimina un usuario del ticket',
                value: 'remove',
                emoji: '➖'
              },
              {
                label: 'Panel de Tickets',
                description: 'Crea un panel de tickets',
                value: 'panel',
                emoji: '📋'
              }
            ])
        );

      const response = await interaction.reply({
        embeds: [mainEmbed],
        components: [menu],
        flags: 64
      });

      const collector = response.createMessageComponentCollector({
        componentType: ComponentType.StringSelect,
        time: 60000
      });

      collector.on('collect', async i => {
        if (i.user.id === interaction.user.id) {
          switch (i.values[0]) {
            case 'create':
              const ticketChannel = await interaction.guild.channels.create({
                name: `ticket-${interaction.user.username}`,
                type: ChannelType.GuildText,
                permissionOverwrites: [
                  {
                    id: interaction.guild.id,
                    deny: [PermissionFlagsBits.ViewChannel],
                  },
                  {
                    id: interaction.user.id,
                    allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages],
                  },
                ],
              });

              const ticketEmbed = new EmbedBuilder()
                .setColor('Green')
                .setTitle('🎫 Nuevo Ticket')
                .setDescription('Por favor, describe tu problema o solicitud. Un miembro del staff te atenderá pronto.')
                .addFields(
                  { name: 'Creado por', value: `${interaction.user}`, inline: true },
                  { name: 'Fecha', value: `<t:${Math.floor(Date.now() / 1000)}:F>`, inline: true }
                );

              const closeButton = new ActionRowBuilder()
                .addComponents(
                  new ButtonBuilder()
                    .setCustomId('close-ticket')
                    .setLabel('Cerrar Ticket')
                    .setStyle(ButtonStyle.Danger)
                    .setEmoji('🔒')
                );

              await ticketChannel.send({ embeds: [ticketEmbed], components: [closeButton] });
              await i.update({ content: `Ticket creado en ${ticketChannel}`, embeds: [], components: [] });
              break;

            case 'close':
              if (!interaction.channel.name.startsWith('ticket-')) {
                await i.update({ content: '❌ Este comando solo puede ser usado en un canal de ticket.', embeds: [], components: [] });
                return;
              }

              const closeEmbed = new EmbedBuilder()
                .setColor('Red')
                .setTitle('🔒 Ticket Cerrado')
                .setDescription(`Ticket cerrado por ${interaction.user}`)
                .setTimestamp();

              await interaction.channel.send({ embeds: [closeEmbed] });
              setTimeout(() => interaction.channel.delete(), 5000);
              await i.update({ content: 'Cerrando ticket en 5 segundos...', embeds: [], components: [] });
              break;

            case 'add':
              if (!interaction.channel.name.startsWith('ticket-')) {
                await i.update({ content: '❌ Este comando solo puede ser usado en un canal de ticket.', embeds: [], components: [] });
                return;
              }

              const userSelect = new ActionRowBuilder()
                .addComponents(
                  new StringSelectMenuBuilder()
                    .setCustomId('add-user')
                    .setPlaceholder('Selecciona un usuario')
                    .addOptions(
                      interaction.guild.members.cache
                        .filter(member => !member.user.bot)
                        .first(25)
                        .map(member => ({
                          label: member.user.username,
                          value: member.id,
                          emoji: '👤'
                        }))
                    )
                );

              await i.update({ content: 'Selecciona el usuario que quieres añadir:', components: [userSelect] });
              break;

            case 'remove':
              if (!interaction.channel.name.startsWith('ticket-')) {
                await i.update({ content: '❌ Este comando solo puede ser usado en un canal de ticket.', embeds: [], components: [] });
                return;
              }

              const removeSelect = new ActionRowBuilder()
                .addComponents(
                  new StringSelectMenuBuilder()
                    .setCustomId('remove-user')
                    .setPlaceholder('Selecciona un usuario')
                    .addOptions(
                      interaction.channel.permissionOverwrites.cache
                        .filter(perm => perm.type === 1)
                        .first(25)
                        .map(perm => ({
                          label: interaction.guild.members.cache.get(perm.id)?.user.username || 'Usuario Desconocido',
                          value: perm.id,
                          emoji: '👤'
                        }))
                    )
                );

              await i.update({ content: 'Selecciona el usuario que quieres eliminar:', components: [removeSelect] });
              break;

            case 'panel':
              if (!interaction.member.permissions.has(PermissionFlagsBits.ManageChannels)) {
                await i.update({ content: '❌ No tienes permisos para crear paneles de tickets.', embeds: [], components: [] });
                return;
              }

              const panelEmbed = new EmbedBuilder()
                .setColor('Blue')
                .setTitle('🎫 Sistema de Tickets')
                .setDescription('¡Bienvenido al sistema de tickets!\nPara crear un ticket, haz clic en el botón de abajo.')
                .addFields(
                  { name: '📝 Uso', value: 'Los tickets son para consultas, reportes o ayuda.' },
                  { name: '⚠️ Importante', value: 'No abuses del sistema de tickets.' }
                )
                .setTimestamp();

              const createButton = new ActionRowBuilder()
                .addComponents(
                  new ButtonBuilder()
                    .setCustomId('create-ticket')
                    .setLabel('Crear Ticket')
                    .setStyle(ButtonStyle.Primary)
                    .setEmoji('📩')
                );

              await interaction.channel.send({ embeds: [panelEmbed], components: [createButton] });
              await i.update({ content: '✅ Panel de tickets creado.', embeds: [], components: [] });
              break;
          }
        } else {
          await i.reply({ content: '❌ No puedes usar este menú.', flags: 64 });
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
        flags: 64
      });
    }
  },
};
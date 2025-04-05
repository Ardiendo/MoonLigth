const { SlashCommandBuilder, PermissionFlagsBits, ChannelType, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('tickets')
    .setDescription('Administra el sistema de tickets.')
    .addSubcommand(subcommand =>
      subcommand
        .setName('crear')
        .setDescription('Crea un nuevo ticket.'))
    .addSubcommand(subcommand =>
      subcommand
        .setName('cerrar')
        .setDescription('Cierra el ticket actual.'))
    .addSubcommand(subcommand =>
      subcommand
        .setName('añadir')
        .setDescription('Añade un usuario al ticket.')
        .addUserOption(option =>
          option.setName('usuario')
            .setDescription('El usuario que quieres añadir.')
            .setRequired(true)))
    .addSubcommand(subcommand =>
      subcommand
        .setName('eliminar')
        .setDescription('Elimina un usuario del ticket.')
        .addUserOption(option =>
          option.setName('usuario')
            .setDescription('El usuario que quieres eliminar.')
            .setRequired(true)))
    .addSubcommand(subcommand =>
      subcommand
        .setName('panel')
        .setDescription('Envía un panel de creación de tickets a un canal.')
        .addChannelOption(option =>
          option.setName('canal')
            .setDescription('El canal donde quieres enviar el panel.')
            .setRequired(true))),

  async execute(interaction) {
    const subcommand = interaction.options.getSubcommand();

    try {
      if (subcommand === 'crear') {
        await crearTicket(interaction);
      } else if (subcommand === 'cerrar') {
        await cerrarTicket(interaction);
      } else if (subcommand === 'añadir') {
        await añadirUsuario(interaction);
      } else if (subcommand === 'eliminar') {
        await eliminarUsuario(interaction);
      } else if (subcommand === 'panel') {
        await enviarPanel(interaction);
      }
    } catch (error) {
      console.error('Error al ejecutar el comando:', error);
      await interaction.reply({ content: 'Hubo un error al ejecutar el comando.', ephemeral: true });
    }
  },
};

async function crearTicket(interaction) {
  const guild = interaction.guild;
  const usuario = interaction.user;

  const canalTicket = await guild.channels.create({
    name: `ticket-${usuario.username}`,
    type: ChannelType.GuildText,
    permissionOverwrites: [
      {
        id: guild.id,
        deny: [PermissionFlagsBits.ViewChannel],
      },
      {
        id: usuario.id,
        allow: [PermissionFlagsBits.ViewChannel],
      },
    ],
  });

  const embed = new EmbedBuilder()
    .setColor('Random')
    .setTitle('Nuevo Ticket')
    .setDescription('Describe tu problema o solicitud aquí. Un miembro del personal te atenderá en breve.');

  await canalTicket.send({ content: `${usuario} ha abierto un nuevo ticket.`, embeds: [embed] });

  await interaction.reply({ content: `Tu ticket ha sido creado en ${canalTicket}.`, ephemeral: true });
}

async function cerrarTicket(interaction) {
  const canal = interaction.channel;

  if (!canal.name.startsWith('ticket-')) {
    return interaction.reply({ content: 'Este comando solo puede ser usado en un canal de ticket.', ephemeral: true });
  }

  await interaction.reply('Cerrando el ticket...');
  await canal.delete();
}

async function añadirUsuario(interaction) {
  const canal = interaction.channel;
  const usuario = interaction.options.getUser('usuario');

  if (!canal.name.startsWith('ticket-')) {
    return interaction.reply({ content: 'Este comando solo puede ser usado en un canal de ticket.', ephemeral: true });
  }

  try {
    await canal.permissionOverwrites.edit(usuario, { ViewChannel: true });
    await interaction.reply({ content: `${usuario} ha sido añadido al ticket.`, ephemeral: true });
  } catch (error) {
    console.error('Error al añadir el usuario al ticket:', error);
    await interaction.reply({ content: 'Hubo un error al añadir el usuario al ticket.', ephemeral: true });
  }
}

async function eliminarUsuario(interaction) {
  const canal = interaction.channel;
  const usuario = interaction.options.getUser('usuario');

  if (!canal.name.startsWith('ticket-')) {
    return interaction.reply({ content: 'Este comando solo puede ser usado en un canal de ticket.', ephemeral: true });
  }

  try {
    await canal.permissionOverwrites.edit(usuario, { ViewChannel: false });
    await interaction.reply({ content: `${usuario} ha sido eliminado del ticket.`, ephemeral: true });
  } catch (error) {
    console.error('Error al eliminar el usuario del ticket:', error);
    await interaction.reply({ content: 'Hubo un error al eliminar el usuario al ticket.', ephemeral: true });
  }
}

async function enviarPanel(interaction) {
  const canal = interaction.options.getChannel('canal');

  const embed = new EmbedBuilder()
    .setColor('Random')
    .setTitle('Crear un Ticket')
    .setDescription('Haz clic en el botón de abajo para abrir un nuevo ticket.');

  const boton = new ActionRowBuilder()
    .addComponents(
      new ButtonBuilder()
        .setCustomId('crear-ticket')
        .setLabel('Crear Ticket')
        .setStyle(ButtonStyle.Primary),
    );

  await canal.send({ embeds: [embed], components: [boton] });
  await interaction.reply({ content: 'Panel de tickets enviado.', ephemeral: true });
}
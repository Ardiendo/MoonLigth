
const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, StringSelectMenuBuilder, ComponentType, PermissionFlagsBits } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('purgar')
    .setDescription('Purga mensajes de un canal.')
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages)
    .addNumberOption(option =>
      option.setName('cantidad')
        .setDescription('La cantidad de mensajes a purgar (máximo 100).')
        .setRequired(true)),

  async execute(interaction) {
    try {
      const cantidad = interaction.options.getNumber('cantidad');

      if (cantidad < 1 || cantidad > 100) {
        return interaction.reply({ content: 'La cantidad de mensajes debe estar entre 1 y 100.', ephemeral: true });
      }

      const options = [
        {
          label: 'Mensajes de todos',
          description: 'Purgar mensajes de todos los usuarios.',
          value: 'todos',
        },
        {
          label: 'Mensajes del bot',
          description: 'Purgar mensajes del bot.',
          value: 'bot',
        },
        {
          label: 'Mensajes de un usuario',
          description: 'Purgar mensajes de un usuario específico.',
          value: 'usuario',
        },
      ];

      const selectMenu = new ActionRowBuilder()
        .addComponents(
          new StringSelectMenuBuilder()
            .setCustomId('select-purgar')
            .setPlaceholder('Selecciona una opción')
            .addOptions(options),
        );

      const embed = new EmbedBuilder()
        .setColor('Yellow')
        .setTitle('⚠️ Purgar mensajes')
        .setDescription(`Vas a purgar ${cantidad} mensajes. Selecciona una opción del menú para especificar qué mensajes quieres purgar.`);

      const reply = await interaction.reply({ embeds: [embed], components: [selectMenu], fetchReply: true });

      const collector = reply.createMessageComponentCollector({ componentType: ComponentType.StringSelectMenu, time: 60000 });

      collector.on('collect', async i => {
        if (i.user.id === interaction.user.id) {
          await i.deferUpdate();

          const opcion = i.values[0];

          if (opcion === 'todos') {
            await interaction.channel.bulkDelete(cantidad);
          } else if (opcion === 'bot') {
            const mensajes = await interaction.channel.messages.fetch({ limit: cantidad });
            const mensajesBot = mensajes.filter(msg => msg.author.bot);
            await interaction.channel.bulkDelete(mensajesBot);
          } else if (opcion === 'usuario') {
            const mensajes = await interaction.channel.messages.fetch({ limit: cantidad });
            const mensajesUsuario = mensajes.filter(msg => msg.author.id === interaction.user.id);
            await interaction.channel.bulkDelete(mensajesUsuario);
          }

          try {
            await i.editReply({ content: `Se han purgado los mensajes según lo solicitado.`, embeds: [], components: [] });
          } catch (error) {
            if (error.code === 10008) {
              console.error('Attempted to edit a message that does not exist.');
            } else {
              console.error('An unexpected error occurred:', error);
            }
          }
        } else {
          await i.reply({ content: 'No puedes interactuar con este menú.', ephemeral: true });
        }
      });

      collector.on('end', collected => console.log(`Se recogieron ${collected.size} interacciones.`));

    } catch (error) {
      console.error(`\n❌ Error al ejecutar el comando: \n${error}\n`);
      await interaction.reply({ content: 'Hubo un error al ejecutar el comando.', ephemeral: true });
    }
  },
};

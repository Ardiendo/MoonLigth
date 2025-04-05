const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, SelectMenuBuilder, ComponentType, PermissionFlagsBits } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('warn')
    .setDescription('Advierte a un usuario.')
    .setDefaultMemberPermissions(PermissionFlagsBits.KickMembers) 
    .addUserOption(option =>
      option.setName('usuario')
        .setDescription('El usuario al que quieres advertir.')
        .setRequired(true))
    .addStringOption(option =>
      option.setName('razon')
        .setDescription('La razón de la advertencia.')
        .setRequired(true)),

  async execute(interaction) {
    try {
      const usuario = interaction.options.getUser('usuario');
      const razon = interaction.options.getString('razon');

      const options = [
        {
          label: 'Sí',
          description: 'Enviar advertencia al usuario.',
          value: 'si',
        },
        {
          label: 'No',
          description: 'No enviar advertencia al usuario.',
          value: 'no',
        },
      ];

      const selectMenu = new ActionRowBuilder()
        .addComponents(
          new SelectMenuBuilder()
            .setCustomId('select-advertir')
            .setPlaceholder('¿Enviar advertencia al usuario?')
            .addOptions(options),
        );

      const embed = new EmbedBuilder()
        .setColor('Yellow')
        .setTitle('⚠️ Advertir a un usuario')
        .setDescription(`Vas a advertir a ${usuario}. ¿Quieres enviar la advertencia al usuario?`);

      const reply = await interaction.reply({ embeds: [embed], components: [selectMenu], fetchReply: true });

      const collector = reply.createMessageComponentCollector({ componentType: ComponentType.SelectMenu, time: 60000 });

      collector.on('collect', async i => {
        if (i.user.id === interaction.user.id) {
          await i.deferUpdate();

          const opcion = i.values[0];

          if (opcion === 'si') {
            try {
              await usuario.send(`Has sido advertido en ${interaction.guild.name} por la siguiente razón: ${razon}`);
              await i.editReply({ content: `Se ha advertido a ${usuario}.`, embeds: [], components: [] });
            } catch (error) {
              console.error(`No se pudo enviar la advertencia a ${usuario}:`, error);
              await i.editReply({ content: `Se ha advertido a ${usuario}, pero no se pudo enviar la advertencia por mensaje privado.`, embeds: [], components: [] });
            }
          } else if (opcion === 'no') {
            await i.editReply({ content: 'No se ha enviado la advertencia al usuario.', embeds: [], components: [] });
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
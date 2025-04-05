
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

      const confirmEmbed = new EmbedBuilder()
        .setColor('Yellow')
        .setTitle('⚠️ Advertir a un usuario')
        .setDescription(`Vas a advertir a ${usuario}`)
        .addFields(
          { name: 'Usuario', value: usuario.tag, inline: true },
          { name: 'Razón', value: razon, inline: true }
        )
        .setTimestamp();

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

      const reply = await interaction.reply({ embeds: [confirmEmbed], components: [selectMenu], fetchReply: true });

      const collector = reply.createMessageComponentCollector({ componentType: ComponentType.SelectMenu, time: 60000 });

      collector.on('collect', async i => {
        if (i.user.id === interaction.user.id) {
          await i.deferUpdate();

          const opcion = i.values[0];

          if (opcion === 'si') {
            const warnEmbed = new EmbedBuilder()
              .setColor('Red')
              .setTitle('⚠️ Advertencia')
              .setDescription(`Has sido advertido en ${interaction.guild.name}`)
              .addFields(
                { name: 'Razón', value: razon, inline: true },
                { name: 'Moderador', value: interaction.user.tag, inline: true }
              )
              .setTimestamp();

            try {
              await usuario.send({ embeds: [warnEmbed] });
              
              const successEmbed = new EmbedBuilder()
                .setColor('Green')
                .setTitle('✅ Advertencia Enviada')
                .setDescription(`Se ha advertido a ${usuario.tag}`)
                .setTimestamp();
              
              await i.editReply({ embeds: [successEmbed], components: [] });
            } catch (error) {
              const warningEmbed = new EmbedBuilder()
                .setColor('Red')
                .setTitle('⚠️ Advertencia Pública')
                .setDescription(`No se pudo enviar un mensaje privado a ${usuario.tag}`)
                .addFields(
                  { name: 'Usuario Advertido', value: usuario.tag, inline: true },
                  { name: 'Razón', value: razon, inline: true },
                  { name: 'Moderador', value: interaction.user.tag, inline: true }
                )
                .setTimestamp();

              await i.editReply({ embeds: [warningEmbed], components: [] });
            }
          } else if (opcion === 'no') {
            const cancelEmbed = new EmbedBuilder()
              .setColor('Grey')
              .setTitle('❌ Advertencia Cancelada')
              .setDescription('No se ha enviado la advertencia al usuario.')
              .setTimestamp();

            await i.editReply({ embeds: [cancelEmbed], components: [] });
          }
        } else {
          const noPermEmbed = new EmbedBuilder()
            .setColor('Red')
            .setDescription('No puedes interactuar con este menú.')
            .setTimestamp();

          await i.reply({ embeds: [noPermEmbed], ephemeral: true });
        }
      });

      collector.on('end', collected => console.log(`Se recogieron ${collected.size} interacciones.`));

    } catch (error) {
      console.error(`\n❌ Error al ejecutar el comando: \n${error}\n`);
      
      const errorEmbed = new EmbedBuilder()
        .setColor('Red')
        .setTitle('❌ Error')
        .setDescription('Hubo un error al ejecutar el comando.')
        .setTimestamp();

      await interaction.reply({ embeds: [errorEmbed], ephemeral: true });
    }
  },
};

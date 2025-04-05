
const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, SelectMenuBuilder, ComponentType, PermissionFlagsBits } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('warn')
    .setDescription('Sistema de advertencias.')
    .setDefaultMemberPermissions(PermissionFlagsBits.KickMembers)
    .addSubcommand(subcommand =>
      subcommand
        .setName('add')
        .setDescription('Advierte a un usuario.')
        .addUserOption(option =>
          option.setName('usuario')
            .setDescription('El usuario al que quieres advertir.')
            .setRequired(true))
        .addStringOption(option =>
          option.setName('razon')
            .setDescription('La razón de la advertencia.')
            .setRequired(true)))
    .addSubcommand(subcommand =>
      subcommand
        .setName('unwarn')
        .setDescription('Quita una advertencia a un usuario.')
        .addUserOption(option =>
          option.setName('usuario')
            .setDescription('El usuario al que quieres quitar la advertencia.')
            .setRequired(true))),

  async execute(interaction) {
    const subcommand = interaction.options.getSubcommand();

    if (subcommand === 'add') {
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
    } else if (subcommand === 'unwarn') {
      try {
        const usuario = interaction.options.getUser('usuario');

        const unwarnEmbed = new EmbedBuilder()
          .setColor('Green')
          .setTitle('✅ Advertencia Removida')
          .setDescription(`Se ha quitado la advertencia a ${usuario.tag}`)
          .addFields(
            { name: 'Usuario', value: usuario.tag, inline: true },
            { name: 'Moderador', value: interaction.user.tag, inline: true }
          )
          .setTimestamp();

        try {
          const dmEmbed = new EmbedBuilder()
            .setColor('Green')
            .setTitle('✅ Advertencia Removida')
            .setDescription(`Se te ha quitado una advertencia en ${interaction.guild.name}`)
            .addFields(
              { name: 'Moderador', value: interaction.user.tag, inline: true }
            )
            .setTimestamp();

          await usuario.send({ embeds: [dmEmbed] });
          await interaction.reply({ embeds: [unwarnEmbed] });
        } catch (error) {
          const publicUnwarnEmbed = new EmbedBuilder()
            .setColor('Yellow')
            .setTitle('⚠️ Advertencia Removida')
            .setDescription(`Se ha quitado la advertencia a ${usuario.tag}, pero no se pudo enviar el mensaje privado`)
            .addFields(
              { name: 'Usuario', value: usuario.tag, inline: true },
              { name: 'Moderador', value: interaction.user.tag, inline: true }
            )
            .setTimestamp();

          await interaction.reply({ embeds: [publicUnwarnEmbed] });
        }
      } catch (error) {
        console.error(`\n❌ Error al ejecutar el comando: \n${error}\n`);
        
        const errorEmbed = new EmbedBuilder()
          .setColor('Red')
          .setTitle('❌ Error')
          .setDescription('Hubo un error al ejecutar el comando.')
          .setTimestamp();

        await interaction.reply({ embeds: [errorEmbed], ephemeral: true });
      }
    }
  },
};

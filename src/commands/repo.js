const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const simpleGit = require('simple-git');
const { exec } = require('child_process');
require('dotenv').config();

module.exports = {
  data: new SlashCommandBuilder()
    .setName('repo')
    .setDescription('Comandos para gestionar el repositorio de GitHub.')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    .addSubcommand(subcommand =>
      subcommand
        .setName('update')
        .setDescription('Actualiza MoonLigth desde el repositorio de GitHub.'))
    .addSubcommand(subcommand =>
      subcommand
        .setName('status')
        .setDescription('Muestra el estado del repositorio.'))
    .addSubcommand(subcommand =>
      subcommand
        .setName('commit')
        .setDescription('Realiza un commit de los cambios.')
        .addStringOption(option =>
          option
            .setName('mensaje')
            .setDescription('Mensaje del commit.')
            .setRequired(true)))
    .addSubcommand(subcommand =>
      subcommand
        .setName('reset')
        .setDescription('Revierte los cambios al último commit.'))
    .addSubcommand(subcommand =>
      subcommand
        .setName('log')
        .setDescription('Muestra el historial de commits.')),

  async execute(interaction) {
    const developerId = process.env.DEVELOPER_ID;

    if (interaction.user.id !== developerId) {
      const embed = new EmbedBuilder()
        .setColor('Red')
        .setTitle('❌ Error')
        .setDescription('No tienes permiso para ejecutar este comando.')
        .setImage(interaction.user.displayAvatarURL());
      await interaction.reply({ embeds: [embed], ephemeral: true });
      return;
    }

    const subcommand = interaction.options.getSubcommand();

    try {
      const git = simpleGit();

      if (subcommand === 'update') {
        // Preguntar al usuario si desea continuar con la actualización
        const confirmationEmbed = new EmbedBuilder()
          .setColor('Yellow')
          .setTitle('⚠️ Confirmar actualización')
          .setDescription('¿Estás seguro de que quieres actualizar MoonLigth? Esto puede tardar unos minutos.');

        const confirmationButtons = new ActionRowBuilder()
          .addComponents(
            new ButtonBuilder()
              .setCustomId('confirmar-update')
              .setLabel('Confirmar')
              .setStyle(ButtonStyle.Success),
            new ButtonBuilder()
              .setCustomId('cancelar-update')
              .setLabel('Cancelar')
              .setStyle(ButtonStyle.Danger),
          );

        const confirmationReply = await interaction.reply({ embeds: [confirmationEmbed], components: [confirmationButtons] });

        const collector = confirmationReply.createMessageComponentCollector({ time: 60000 });

        collector.on('collect', async i => {
          if (i.user.id === interaction.user.id) {
            if (i.customId === 'confirmar-update') {
              await i.update({ content: 'Actualizando MoonLigth... esto puede tardar unos minutos.', embeds: [], components: [] });

              try {
                const status = await git.status();
                if (!status.isClean()) {
                  await interaction.editReply('⚠️ Hay cambios sin confirmar en el repositorio. Por favor, confirma o descarta los cambios antes de actualizar.');
                  return;
                }

                await git.pull();

                await new Promise((resolve, reject) => {
                  exec('npm install', (error, stdout, stderr) => {
                    if (error) {
                      console.error(`Error al instalar dependencias: ${error}`);
                      reject(error);
                      return;
                    }
                    console.log(`stdout: ${stdout}`);
                    console.error(`stderr: ${stderr}`);
                    resolve();
                  });
                });

                await new Promise((resolve, reject) => {
                  exec('pm2 restart moon.js', (error, stdout, stderr) => {
                    if (error) {
                      console.error(`Error al reiniciar el bot: ${error}`);
                      reject(error);
                      return;
                    }
                    console.log(`stdout: ${stdout}`);
                    console.error(`stderr: ${stderr}`);
                    resolve();
                  });
                });

                const lastCommit = await git.log({ maxCount: 1 });
                const embed = new EmbedBuilder()
                  .setColor(0x0099FF)
                  .setTitle('✅ MoonLigth actualizado con éxito!')
                  .setDescription(`**Último commit:** ${lastCommit.latest.hash.substring(0, 7)} - ${lastCommit.latest.message}`);

                await interaction.editReply({ content: null, embeds: [embed] });
              } catch (error) {
                console.error('Error al actualizar el bot:', error);
                await interaction.editReply('❌ Hubo un error al actualizar el bot.');
              }
            } else if (i.customId === 'cancelar-update') {
              await i.update({ content: 'Actualización cancelada.', embeds: [], components: [] });
            }
          } else {
            await i.reply({ content: 'No puedes interactuar con este menú.', ephemeral: true });
          }
        });

        collector.on('end', collected => console.log(`Se recogieron ${collected.size} interacciones.`));

      } else if (subcommand === 'status') {
        const status = await git.status();

        const embed = new EmbedBuilder()
          .setColor('Blue')
          .setTitle('Estado del repositorio')
          .setDescription(`
            **Rama actual:** ${status.current}\n
            **Archivos modificados:** ${status.modified.length}\n
            **Archivos nuevos:** ${status.not_added.length}\n
            **Archivos eliminados:** ${status.deleted.length}\n
          `);

        await interaction.reply({ embeds: [embed] });
      } else if (subcommand === 'commit') {
        const mensaje = interaction.options.getString('mensaje');

        await git.add('.')
          .commit(mensaje);

        const embed = new EmbedBuilder()
          .setColor('Green')
          .setTitle('Commit realizado')
          .setDescription(`Cambios confirmados con el mensaje: "${mensaje}"`);

        await interaction.reply({ embeds: [embed] });
      } else if (subcommand === 'reset') {
        await git.reset('hard');

        const embed = new EmbedBuilder()
          .setColor('Yellow')
          .setTitle('Reset realizado')
          .setDescription('Se han revertido los cambios al último commit.');

        await interaction.reply({ embeds: [embed] });
      } else if (subcommand === 'log') {
        const log = await git.log();

        const embed = new EmbedBuilder()
          .setColor('Blue')
          .setTitle('Historial de commits')
          .setDescription(log.all.map(commit => `**${commit.hash.substring(0, 7)}** - ${commit.message}`).join('\n'));

        await interaction.reply({ embeds: [embed] });
      }
    } catch (error) {
      console.error('Error al ejecutar el comando:', error);

      const embed = new EmbedBuilder()
        .setColor('Red')
        .setTitle('❌ Error')
        .setDescription('Hubo un error al ejecutar el comando. Por favor, inténtalo de nuevo más tarde.');

      await interaction.reply({ embeds: [embed], ephemeral: true });
    }
  },
};
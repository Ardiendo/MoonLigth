const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const simpleGit = require('simple-git');
const { exec } = require('child_process');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('repo')
    .setDescription('Comandos para gestionar el repositorio de GitHub.')
    .addSubcommand(subcommand =>
      subcommand
        .setName('update')
        .setDescription('Actualiza ha MoonLigth desde el repositorio de GitHub.')
    ),
  async execute(interaction) {
    const subcommand = interaction.options.getSubcommand();

    if (subcommand === 'update') {
      await interaction.reply('Actualizando MoonLigth... esto puede tardar unos minutos.');

      try {
        const git = simpleGit();

        
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

        await interaction.editReply({ embeds: [embed] });
      } catch (error) {
        console.error('Error al actualizar el bot:', error);
        await interaction.editReply('❌ Hubo un error al actualizar el bot.');
      }
    }
  },
};
const { SlashCommandBuilder } = require('discord.js');
const simpleGit = require('simple-git');
const { exec } = require('child_process');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('update')
    .setDescription('Actualiza el bot desde el repositorio de GitHub.'),
  async execute(interaction) {
    await interaction.reply('Actualizando MoonLigth... esto puede tardar unos minutos.');

    try {
      
      await simpleGit().clone('https://github.com/Ardiendo/MoonLigth.git', '.', {
        '--depth': 1 
      });

      
      exec('npm install', (error, stdout, stderr) => {
        if (error) {
          console.error(`Error al instalar dependencias: ${error}`);
          return;
        }
        console.log(`stdout: ${stdout}`);
        console.error(`stderr: ${stderr}`);
      });

      
       exec('pm2 restart moon.js');

      await interaction.editReply(`${bot.data} | All is Ok.`);
    } catch (error) {
      console.error('Error al actualizar el bot:', error);
      await interaction.editReply('Hubo un error al actualizar el bot.');
    }
  },
};
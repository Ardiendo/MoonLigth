const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
require('dotenv').config();

module.exports = {
  data: new SlashCommandBuilder()
    .setName('moonligth')
    .setDescription('Muestra información detallada de MoonLigth'),

  async execute(interaction) { 
    try {
      const bot = interaction.client.user;
      const developerId = process.env.DEVELOPER_ID;
      const DEVELOPER_TAG = process.env.DEVELOPER_TAG;
      const developer = await interaction.guild.members.fetch(developerId);
      const guild = interaction.guild; 

      const embed = new EmbedBuilder()
        .setColor('Random')
        .setTitle(`Información de MoonLigth`)
        .setThumbnail(bot.displayAvatarURL())
        .addFields(
          { name: 'Nombre', value: `${bot.tag}`, inline: true },
          { name: 'ID', value: `${bot.id}`, inline: true },
          { name: 'Creado', value: `<t:${Math.floor(bot.createdTimestamp / 1000)}:D>`, inline: true },
          { name: 'Desarrollador', value: `${DEVELOPER_TAG}`, inline: true },
          { name: 'ID del Desarrollador', value: `${developer.user.id}`, inline: true },
          { name: 'Lenguaje', value: 'JavaScript', inline: true },
          { name: 'Librería', value: 'discord.js', inline: true },
          { name: 'Prefijo', value: '/', inline: true }, 
          { name: 'Descripción', value: 'MoonLigth es un bot multipropósito que ofrece una variedad de comandos útiles y divertidos para mejorar tu experiencia en Discord.', inline: false },
        );

      const buttons = new ActionRowBuilder()
        .addComponents(
          new ButtonBuilder()
            .setLabel('Invitar a MoonLigth')
            .setStyle(ButtonStyle.Link)
            .setURL('https://discord.com/oauth2/authorize?client_id=1259146338516471879&scope=bot&permissions=1099511627775'), 
        );

      const row = new ActionRowBuilder()
        .addComponents(
          new ButtonBuilder()
            .setDisabled(false)
            .setLabel('Yumi | MoonLigth Support SV')
            .setURL(guild.vanityURLCode ? `https://discord.gg/${guild.vanityURLCode}` : 'https://discord.gg/vZyQ3u5re2')
            .setStyle(ButtonStyle.Link),
        );
      
      await interaction.reply({ embeds: [embed], components: [buttons, row] }); 

    } catch (error) {
      console.error('Error al obtener la información:', error);

      const embed = new EmbedBuilder()
        .setColor('Red') 
        .setTitle('❌ Error')
        .setDescription('Hubo un error al ejecutar el comando. Por favor, inténtalo de nuevo más tarde.');

      await interaction.reply({ embeds: [embed], ephemeral: true }); 
    }
  }, 
};
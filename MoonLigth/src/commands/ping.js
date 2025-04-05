
const { SlashCommandBuilder, EmbedBuilder, version } = require('discord.js');
const os = require('node:os');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('ping')
    .setDescription('Responde con información detallada sobre la latencia y el estado del bot.'),
  async execute(interaction) {
    const sent = await interaction.reply({ content: 'Pinging...', withResponse: true });
    const embed = new EmbedBuilder()
      .setColor("Random") 
      .setTitle('🏓 Pong!') 
      .setDescription(`Aquí tienes información sobre mi estado actual.`) 
      .addFields(
        { name: 'Latencia del bot', value: `${sent.createdTimestamp - interaction.createdTimestamp}ms`, inline: true },
        { name: 'Latencia de la API', value: `${interaction.client.ws.ping}ms`, inline: true },
        { name: 'Versión de Discord.js', value: `v${version}`, inline: true },
        { name: 'Sistema operativo', value: `${os.platform()} ${os.release()}`, inline: true },
        { name: 'Uso de memoria', value: `${(process.memoryUsage().heapUsed / 1024 / 1024).toFixed(2)} MB`, inline: true },
        { name: 'Uptime', value: `<t:${Math.floor(Date.now() / 1000)}:R>`, inline: true },
      )
      .setTimestamp();
    await interaction.editReply({ content: '', embeds: [embed] });
  },
};

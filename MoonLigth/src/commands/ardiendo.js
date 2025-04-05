const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
require('dotenv').config();

module.exports = {
  data: new SlashCommandBuilder()
    .setName('ardiendo')
    .setDescription('Muestra información detallada sobre la desarrolladora.'),

  async execute(interaction) {
    const developerId = process.env.DEVELOPER_ID;
    const DEVELOPER_TAG = process.env.DEVELOPER_TAG;

    if (!developerId) {
      return interaction.reply({ 
        content: 'Error: ID del desarrollador no configurado correctamente.',
        ephemeral: true 
      });
    }

    try {
      const developer = await interaction.client.users.fetch(developerId);
      const member = interaction.guild?.members.cache.get(developerId);

      const embed = new EmbedBuilder()
        .setTitle(`🔥 Perfil de ${DEVELOPER_TAG}`)
        .setColor("#FF6B6B")
        .setThumbnail(developer.displayAvatarURL({ dynamic: true, size: 512 }))
        .setDescription('¡Hola! Soy la desarrolladora principal de MoonLigth. Me especializo en desarrollo de bots y aplicaciones web.')
        .addFields(
          {
            name: '👩‍💻 Información Personal',
            value: [
              `**Tag:** ${developer.tag}`,
              `**ID:** ${developer.id}`,
              member ? `**Rol Principal:** ${member.roles.highest.name}` : '**Rol:** No disponible en este servidor',
              member ? `**Se unió:** <t:${Math.floor(member.joinedTimestamp / 1000)}:R>` : '',
              `**Cuenta creada:** <t:${Math.floor(developer.createdTimestamp / 1000)}:R>`
            ].filter(Boolean).join('\n'),
            inline: false
          },
          {
            name: '🛠️ Tecnologías',
            value: '```\nJavaScript • Python • Node.js • Discord.js\nHTML/CSS • React • MongoDB • Git\n```',
            inline: false
          },
          {
            name: '📊 Estadísticas del Bot',
            value: [
              `**Servidores:** ${interaction.client.guilds.cache.size}`,
              `**Usuarios:** ${interaction.client.users.cache.size}`,
              `**Comandos:** ${interaction.client.commands.size}`,
              `**Versión:** ${require('../package.json').version || '1.0.0'}`
            ].join('\n'),
            inline: false
          }
        )
        .setImage('https://cdn.discordapp.com/attachments/1220480757227847837/1357879871753158796/copy_3316ABF3-DE47-47C7-A4D6-A28D9067ED81.gif?ex=67f1cfad&is=67f07e2d&hm=adaefcdf50fd263c46d206f42d3bc110b987037c8c172ea76a324f5d42a21f61&')
        .setFooter({ 
          text: '¡Gracias por usar MoonLigth! 💜', 
          iconURL: developer.displayAvatarURL()
        })
        .setTimestamp();

      const buttons = new ActionRowBuilder()
        .addComponents(
          new ButtonBuilder()
            .setLabel('GitHub')
            .setStyle(ButtonStyle.Link)
            .setURL('https://github.com/Ardiendo')
            .setEmoji('📚'),
          new ButtonBuilder()
            .setLabel('X')
            .setStyle(ButtonStyle.Link)
            .setURL('https://x.com/_aaari__')
            .setEmoji('🐦'),
          new ButtonBuilder()
            .setLabel('Soporte')
            .setStyle(ButtonStyle.Link)
            .setURL('https://discord.gg/moonligth')
            .setEmoji('💬')
        );

      await interaction.reply({ 
        embeds: [embed], 
        components: [buttons] 
      });
    } catch (error) {
      console.error('Error en el comando ardiendo:', error);
      const errorEmbed = new EmbedBuilder()
        .setColor('Red')
        .setTitle('❌ Error')
        .setDescription('Hubo un error al mostrar la información de la desarrolladora.')
        .addFields({
          name: 'Detalles',
          value: 'Por favor, inténtalo de nuevo más tarde o contacta con el soporte.'
        })
        .setTimestamp();

      await interaction.reply({ 
        embeds: [errorEmbed], 
        ephemeral: true 
      });
    }
  },
};
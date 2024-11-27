const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
require('dotenv').config();

module.exports = {
  data: new SlashCommandBuilder()
    .setName('userprofile')
    .setDescription('Muestra información sobre el usuario.'),

  async execute(interaction) {
    try {
      const usuario = interaction.user;
      const guild = interaction.guild;
      const developerId = process.env.DEVELOPER_ID;

      const embed = new EmbedBuilder()
        .setColor(0x0099FF)
        .setTitle(`Información de ${usuario.tag}`)
        .setThumbnail(usuario.displayAvatarURL())
        .setDescription(`Aquí tienes tu información en el servidor **${guild.name}**:`); 
      
      const botones = new ActionRowBuilder()
        .addComponents(
          new ButtonBuilder()
            .setCustomId('avatar')
            .setLabel('Avatar')
            .setStyle(ButtonStyle.Primary),
          new ButtonBuilder()
            .setCustomId('info')
            .setLabel('Información')
            .setStyle(ButtonStyle.Primary),
          
        );

      const respuesta = await interaction.reply({ embeds: [embed], components: [botones] });

     
      const collector = respuesta.createMessageComponentCollector({ time: 60000 });

      collector.on('collect', async i => {
        if (i.user.id === interaction.user.id) {
          if (i.customId === 'avatar') {
            
            const avatarEmbed = new EmbedBuilder()
              .setColor(0x0099FF)
              .setTitle(`Avatar de ${usuario.tag}`)
              .setImage(usuario.displayAvatarURL({ dynamic: true, size: 4096 }));

            await i.update({ embeds: [avatarEmbed], components: [] });
          } else if (i.customId === 'info') {
            
            const infoEmbed = new EmbedBuilder()
              .setColor('Random')
              .setTitle(`Información de ${usuario.tag}`)
              .addFields(
                { name: 'Nombre', value: usuario.username, inline: true },
                { name: 'Discriminator', value: usuario.discriminator, inline: true },
                { name: 'ID', value: usuario.id, inline: true },
                { name: 'Cuenta creada', value: `<t:${Math.floor(usuario.createdTimestamp / 1000)}:D>`, inline: true },
                { name: 'Bot', value: usuario.bot ? 'Sí' : 'No', inline: true },
                { name: 'Banner', value: usuario.bannerURL() ? `[Enlace](${usuario.bannerURL({ dynamic: true })})` : 'No tiene', inline: true },
                { name: 'Color de acento', value: usuario.accentColor ? `#${usuario.accentColor.toString(16)}` : 'No tiene', inline: true },
                { name: 'Es un usuario verificado', value: usuario.verified ? 'Sí' : 'No', inline: true },
                { name: 'Tiene un banner público', value: usuario.banner ? 'Sí' : 'No', inline: true },
              );

            
            const miembro = guild.members.cache.get(usuario.id);
            if (miembro) {
              infoEmbed.addFields(
                { name: 'Apodo', value: miembro.nickname || 'No tiene', inline: true },
                { name: 'Se unió al servidor', value: `<t:${Math.floor(miembro.joinedTimestamp / 1000)}:D>`, inline: true },
                { name: 'Rol más alto', value: miembro.roles.highest.name, inline: true },
                
              );
            }

            
            if (usuario.id === developerId) {
              infoEmbed.addFields({ name: 'Información adicional', value: '¡Eres el desarrollador de este bot! Gracias por tu trabajo 😊' });
            }

            await i.update({ embeds: [infoEmbed], components: [] });
          }
          
        } else {
          await i.reply({ content: 'No puedes interactuar con este menú.', ephemeral: true });
        }
      });

      collector.on('end', collected => console.log(`Se recogieron ${collected.size} interacciones.`));
    } catch (error) {
      console.error('Error al ejecutar el comando:', error);
      await interaction.reply({ content: 'Hubo un error al ejecutar el comando.', ephemeral: true });
    }
  },
};
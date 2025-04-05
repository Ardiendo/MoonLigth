
const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, SelectMenuBuilder, ComponentType } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('avatar')
    .setDescription('🖼️ Muestra el avatar de un usuario')
    .addUserOption(option => 
      option.setName('user')
        .setDescription('El usuario cuyo avatar quieres ver')
    ),
  
  async execute(interaction) {
    try {
      const user = interaction.options.getUser('user') || interaction.user;
      const member = await interaction.guild.members.fetch(user.id);

      const options = [
        {
          label: 'Avatar Normal',
          description: 'Ver el avatar normal del usuario',
          value: 'normal',
          emoji: '🖼️'
        },
        {
          label: 'Avatar del Servidor',
          description: 'Ver el avatar específico del servidor',
          value: 'server',
          emoji: '🏷️'
        },
        {
          label: 'Avatar con Marcos',
          description: 'Ver el avatar con diferentes marcos',
          value: 'frames',
          emoji: '🎭'
        }
      ];

      const selectMenu = new ActionRowBuilder()
        .addComponents(
          new SelectMenuBuilder()
            .setCustomId('avatar-menu')
            .setPlaceholder('Selecciona un tipo de avatar')
            .addOptions(options)
        );

      const initialEmbed = new EmbedBuilder()
        .setColor('Random')
        .setTitle(`🖼️ Avatar de ${user.tag}`)
        .setDescription('Selecciona una opción del menú para ver diferentes versiones del avatar.')
        .setThumbnail(user.displayAvatarURL({ dynamic: true }))
        .setTimestamp();

      const response = await interaction.reply({
        embeds: [initialEmbed],
        components: [selectMenu],
        fetchReply: true
      });

      const collector = response.createMessageComponentCollector({
        componentType: ComponentType.SelectMenu,
        time: 60000
      });

      collector.on('collect', async i => {
        if (i.user.id === interaction.user.id) {
          const selection = i.values[0];
          const embed = new EmbedBuilder()
            .setColor('Random')
            .setTimestamp();

          const row = new ActionRowBuilder()
            .addComponents(
              new ButtonBuilder()
                .setLabel('Descargar Avatar')
                .setStyle(ButtonStyle.Link)
                .setEmoji('📥')
            );

          switch (selection) {
            case 'normal':
              const avatarURL = user.displayAvatarURL({ dynamic: true, size: 4096 });
              embed
                .setTitle(`Avatar Normal de ${user.tag}`)
                .setImage(avatarURL);
              row.components[0].setURL(avatarURL);
              break;

            case 'server':
              const serverAvatarURL = member.displayAvatarURL({ dynamic: true, size: 4096 });
              embed
                .setTitle(`Avatar del Servidor de ${user.tag}`)
                .setImage(serverAvatarURL);
              row.components[0].setURL(serverAvatarURL);
              break;

            case 'frames':
              const framesEmbed = user.displayAvatarURL({ dynamic: true, size: 4096 });
              embed
                .setTitle(`Avatar con Marcos de ${user.tag}`)
                .setImage(framesEmbed)
                .addFields(
                  { name: 'Formato', value: 'PNG/GIF (si es animado)', inline: true },
                  { name: 'Tamaño', value: '4096x4096', inline: true }
                );
              row.components[0].setURL(framesEmbed);
              break;
          }

          await i.update({
            embeds: [embed],
            components: [selectMenu, row]
          });
        } else {
          await i.reply({ content: 'No puedes usar este menú.', ephemeral: true });
        }
      });

      collector.on('end', () => {
        selectMenu.components[0].setDisabled(true);
        interaction.editReply({ components: [selectMenu] }).catch(() => {});
      });

    } catch (error) {
      console.error('Error al ejecutar el comando:', error);
      const errorEmbed = new EmbedBuilder()
        .setColor('Red')
        .setTitle('❌ Error')
        .setDescription('Hubo un error al mostrar el avatar. Por favor, inténtalo de nuevo más tarde.')
        .setTimestamp();
      await interaction.reply({ embeds: [errorEmbed], ephemeral: true });
    }
  },
};

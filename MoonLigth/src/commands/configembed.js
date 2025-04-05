
const { 
  SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, 
  StringSelectMenuBuilder, TextInputBuilder, TextInputStyle, 
  ModalBuilder, ComponentType 
} = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('configembed')
    .setDescription('Crea embeds personalizados a través de un menú desplegable'),

  async execute(interaction) {
    try {
      const embedBuilder = new EmbedBuilder()
        .setColor('Random')
        .setTitle('Embed Configurator')
        .setDescription('Selecciona una opción para configurar tu embed.')
        .setTimestamp();

      const actionRow = new ActionRowBuilder()
        .addComponents(
          new StringSelectMenuBuilder()
            .setCustomId('embed-menu')
            .setPlaceholder('Selecciona una opción')
            .addOptions([
              {
                label: 'Titulo',
                description: 'Configura el título del embed',
                value: 'title',
                emoji: '📝'
              },
              {
                label: 'Descripción',
                description: 'Configura la descripción del embed',
                value: 'description',
                emoji: '📄'
              },
              {
                label: 'Color',
                description: 'Configura el color del embed',
                value: 'color',
                emoji: '🎨'
              },
              {
                label: 'Imagen',
                description: 'Configura la imagen del embed',
                value: 'image',
                emoji: '🖼️'
              }
            ])
        );

      const response = await interaction.reply({
        embeds: [embedBuilder],
        components: [actionRow],
        ephemeral: true
      });

      const collector = response.createMessageComponentCollector({
        componentType: ComponentType.StringSelect,
        time: 300000
      });

      collector.on('collect', async i => {
        if (i.user.id === interaction.user.id) {
          let modal;
          switch (i.values[0]) {
            case 'title':
              modal = new ModalBuilder()
                .setCustomId('embed-title')
                .setTitle('Configura el título del embed')
                .addComponents(
                  new ActionRowBuilder().addComponents(
                    new TextInputBuilder()
                      .setCustomId('title-input')
                      .setLabel('Título del Embed')
                      .setStyle(TextInputStyle.Short)
                      .setRequired(true)
                  )
                );
              break;
            case 'description':
              modal = new ModalBuilder()
                .setCustomId('embed-description')
                .setTitle('Configura la descripción del embed')
                .addComponents(
                  new ActionRowBuilder().addComponents(
                    new TextInputBuilder()
                      .setCustomId('description-input')
                      .setLabel('Descripción del Embed')
                      .setStyle(TextInputStyle.Paragraph)
                      .setRequired(true)
                  )
                );
              break;
            case 'color':
              modal = new ModalBuilder()
                .setCustomId('embed-color')
                .setTitle('Configura el color del embed')
                .addComponents(
                  new ActionRowBuilder().addComponents(
                    new TextInputBuilder()
                      .setCustomId('color-input')
                      .setLabel('Color del Embed (Hexadecimal)')
                      .setStyle(TextInputStyle.Short)
                      .setRequired(true)
                  )
                );
              break;
            case 'image':
              modal = new ModalBuilder()
                .setCustomId('embed-image')
                .setTitle('Configura la imagen del embed')
                .addComponents(
                  new ActionRowBuilder().addComponents(
                    new TextInputBuilder()
                      .setCustomId('image-input')
                      .setLabel('URL de la Imagen')
                      .setStyle(TextInputStyle.Short)
                      .setRequired(true)
                  )
                );
              break;
          }
          await i.showModal(modal);
        } else {
          await i.reply({ content: '❌ No puedes usar este menú.', ephemeral: true });
        }
      });

      interaction.client.on('interactionCreate', async interaction => {
        if (!interaction.isModalSubmit()) return;

        try {
          switch (interaction.customId) {
            case 'embed-title':
              const title = interaction.fields.getTextInputValue('title-input');
              embedBuilder.setTitle(title);
              break;
            case 'embed-description':
              const description = interaction.fields.getTextInputValue('description-input');
              embedBuilder.setDescription(description);
              break;
            case 'embed-color':
              const color = interaction.fields.getTextInputValue('color-input');
              embedBuilder.setColor(color);
              break;
            case 'embed-image':
              const imageUrl = interaction.fields.getTextInputValue('image-input');
              embedBuilder.setImage(imageUrl);
              break;
          }

          await interaction.update({
            embeds: [embedBuilder],
            components: [actionRow]
          });
        } catch (error) {
          console.error(error);
          await interaction.reply({
            content: '❌ Hubo un error al guardar la configuración.',
            ephemeral: true
          });
        }
      });

      collector.on('end', () => {
        actionRow.components[0].setDisabled(true);
        interaction.editReply({ components: [actionRow] }).catch(() => {});
      });

    } catch (error) {
      console.error(error);
      if (!interaction.replied) {
        await interaction.reply({
          content: 'Hubo un error al ejecutar el comando.',
          ephemeral: true
        });
      }
    }
  },
};

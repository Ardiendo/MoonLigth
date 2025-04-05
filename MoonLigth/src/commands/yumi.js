const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, StringSelectMenuBuilder, ComponentType, StringSelectMenuOptionBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('yumi')
        .setDescription('Muestra enlaces importantes del proyecto Yumi mediante un menú.'),

    async execute(interaction) {
        const initialEmbed = new EmbedBuilder()
            .setColor('Random')
            .setTitle('📡 | Enlaces del Proyecto Yumi')
            .setDescription('Selecciona una opción del menú desplegable para obtener el enlace correspondiente.');

        const selectMenu = new StringSelectMenuBuilder()
            .setCustomId('link_selector')
            .setPlaceholder('Selecciona un enlace...')
            .addOptions(
                new StringSelectMenuOptionBuilder()
                    .setLabel('Repositorio GitHub')
                    .setDescription('Obtén el enlace al código fuente del proyecto.')
                    .setValue('github_link')
                    .setEmoji('♨️'),
                new StringSelectMenuOptionBuilder()
                    .setLabel('Invitar a Yumi')
                    .setDescription('Obtén el enlace para invitar al bot a tu servidor.')
                    .setValue('invite_link')
                    .setEmoji('🩷')
            );

        const actionRow = new ActionRowBuilder()
            .addComponents(selectMenu);

        const response = await interaction.reply({
            embeds: [initialEmbed],
            components: [actionRow],
            fetchReply: true,
        });

        const filter = (i) => i.user.id === interaction.user.id && i.customId === 'link_selector';

        const collector = response.createMessageComponentCollector({
            componentType: ComponentType.StringSelect,
            filter,
            time: 60000 
        });

        collector.on('collect', async i => {
            const selectedValue = i.values[0];
            let resultEmbed;

            if (selectedValue === 'github_link') {
                resultEmbed = new EmbedBuilder()
                    .setColor('#FFFFFF') 
                    .setTitle('♨️ Repositorio GitHub')
                    .setDescription('Aquí tienes el enlace al repositorio del proyecto Yumi en GitHub:\n\n[**Ardiendo/Yumi1.4x**](https://github.com/Ardiendo/Yumi1.4x)');
            } else if (selectedValue === 'invite_link') {
                resultEmbed = new EmbedBuilder()
                    .setColor('#5865F2') 
                    .setTitle('🩷 Invitar a Yumi')
                    .setDescription('Usa este enlace para añadir a Yumi a tu servidor:\n\n[**Enlace de invitación**](https://discord.com/oauth2/authorize?client_id=1249418453131984939)');
            }

            
            const disabledMenu = StringSelectMenuBuilder.from(selectMenu).setDisabled(true);
            const disabledRow = new ActionRowBuilder().addComponents(disabledMenu);

            await i.update({
                embeds: [resultEmbed],
                components: [disabledRow] 
            });
             collector.stop('selectionMade'); 
        });

        collector.on('end', (collected, reason) => {
           
            if (reason !== 'selectionMade' && collected.size === 0) {
                 const timeoutEmbed = new EmbedBuilder()
                    .setColor('Red')
                    .setTitle('📡 | Enlaces del Proyecto Yumi')
                    .setDescription('El tiempo para seleccionar una opción ha expirado.');

                 const disabledMenu = StringSelectMenuBuilder.from(selectMenu).setDisabled(true);
                 const disabledRow = new ActionRowBuilder().addComponents(disabledMenu);

                 interaction.editReply({
                    embeds: [timeoutEmbed],
                    components: [disabledRow] 
                }).catch(console.error); 
            }
        });
    }
};

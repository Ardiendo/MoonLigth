const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, userMention } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('info')
        .setDescription('Muestra información del servidor | MedusaRP'),
    async execute(interaction) {
        const guild = interaction.guild; 
        const embed = new EmbedBuilder()
            .setColor('Random')
            .setTitle(`Información del servidor: ${guild.name} | ${userMention} `)
            .setThumbnail(guild.iconURL())
            .setDescription(`**Descripción:** ${guild.description || 'No hay descripción.'}`)
            .addFields(
                { name: 'Miembros', value: `${guild.memberCount}`, inline: true },
                { name: 'Canales', value: `${guild.channels.cache.size}`, inline: true },
                { name: 'Roles', value: `${guild.roles.cache.size}`, inline: true },
                { name: 'Emojis', value: `${guild.emojis.cache.size}`, inline: true },
                { name: 'Stickers', value: `${guild.stickers.cache.size}`, inline: true },
                { name: 'Creado el', value: `<t:${Math.floor(guild.createdTimestamp / 1000)}:D>`, inline: true },
                { name: 'Dueño', value: `<@${guild.ownerId}>`, inline: true },
                { name: 'Nivel de verificación', value: `${guild.verificationLevel}`, inline: true },
                { name: 'Nivel de boost', value: `${guild.premiumTier}`, inline: true },
            );

        const row = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                .setDisabled(true)
                    .setLabel('Unirse al Servidor')
                    .setURL(guild.vanityURLCode ? `https://discord.gg/${guild.vanityURLCode}` : 'https://discord.gg/Q7yZPaF5Xm') 
                    .setStyle(ButtonStyle.Link),
            );

        await interaction.reply({ embeds: [embed], components: [row] });
    },
};
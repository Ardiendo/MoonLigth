const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, userMention } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('moonligth')
        .setDescription('Muestra información del servidor'),
    async execute(interaction) {
        const guild = interaction.guild; 
        const embed = new EmbedBuilder()
            .setColor('Random')
            .setTitle(`Información del servidor: ${guild.name} | for ${userMention} `)
            .setThumbnail(guild.iconURL())
            .setDescription(`**Descripción:** ${guild.description || 'No Info / No description.'}`)
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
                .setDisabled(false)
                .setLabel('Yumi | MoonLigth Support SV')
                .setURL(guild.vanityURLCode ? `https://discord.gg/${guild.vanityURLCode}` : 'https://discord.gg/vZyQ3u5re2')
                .setStyle(ButtonStyle.Link),
              new ButtonBuilder() 
              .setDisabled(true)
                .setLabel('Private Repository | MoonLigth')
                .setURL('https://github.com/Ardiendo/MoonLigth') 
                .setStyle(ButtonStyle.Link),
            );

        await interaction.reply({ embeds: [embed], components: [row] });
    },
};
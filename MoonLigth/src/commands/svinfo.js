const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, StringSelectMenuBuilder, ChannelType, GuildVerificationLevel, GuildExplicitContentFilter, GuildDefaultMessageNotifications, GuildPremiumTier, SystemChannelFlagsBitField } = require('discord.js');
const fs = require('node:fs');
const path = require('node:path');

const logDirectory = path.join(__dirname, '..', 'logs');
const logFilePath = path.join(logDirectory, 'bot_log.log');

if (!fs.existsSync(logDirectory)) {
    fs.mkdirSync(logDirectory, { recursive: true });
}

function logToFile(message) {
    const timestamp = new Date().toISOString();
    const logEntry = `[${timestamp}] ${message}\n`;
    fs.appendFile(logFilePath, logEntry, err => {
        if (err) {
            console.error('Error al escribir en el archivo de registro:', err);
        }
    });
}

const verificationLevels = {
    [GuildVerificationLevel.None]: 'Ninguno',
    [GuildVerificationLevel.Low]: 'Bajo (Email verificado)',
    [GuildVerificationLevel.Medium]: 'Medio (Registrado > 5 min)',
    [GuildVerificationLevel.High]: 'Alto (Miembro > 10 min)',
    [GuildVerificationLevel.VeryHigh]: 'Muy Alto (Teléfono verificado)'
};

const explicitContentFilters = {
    [GuildExplicitContentFilter.Disabled]: 'Desactivado',
    [GuildExplicitContentFilter.MembersWithoutRoles]: 'Miembros sin roles',
    [GuildExplicitContentFilter.AllMembers]: 'Todos los miembros'
};

const defaultMessageNotifications = {
    [GuildDefaultMessageNotifications.AllMessages]: 'Todos los mensajes',
    [GuildDefaultMessageNotifications.OnlyMentions]: 'Solo @menciones'
};

const premiumTiers = {
    [GuildPremiumTier.None]: 'Nivel 0',
    [GuildPremiumTier.Tier1]: 'Nivel 1',
    [GuildPremiumTier.Tier2]: 'Nivel 2',
    [GuildPremiumTier.Tier3]: 'Nivel 3'
};

function truncateString(str, num) {
    if (str.length <= num) {
        return str;
    }
    return str.slice(0, num - 3) + '...';
}

module.exports = {
    data: new SlashCommandBuilder()
        .setName('svinfo')
        .setDescription('ℹ️ Muestra información detallada sobre el servidor.'),

    async execute(interaction) {

        if (!interaction.guild) {
            return interaction.reply({ content: 'Este comando solo puede usarse en un servidor.', ephemeral: true });
        }
        const guild = interaction.guild;

        let owner;
        try {
            owner = await guild.fetchOwner();
        } catch (error) {
            logToFile(`Error al obtener el dueño del servidor ${guild.id}: ${error}`);
            console.error('Error fetching owner:', error);
            owner = { id: 'Desconocido', user: { tag: 'Desconocido', username: 'Desconocido', displayAvatarURL: () => null, createdTimestamp: Date.now() } }; 
            return interaction.reply({ content: 'No pude obtener la información del dueño del servidor. Inténtalo de nuevo más tarde.', ephemeral: true });
        }

        const initialEmbed = new EmbedBuilder()
            .setTitle(`🏠 Información del Servidor | ${guild.name}`)
            .setThumbnail(guild.iconURL({ dynamic: true, size: 512 })) // Tamaño ajustado
            .setDescription(`Selecciona una opción para ver información detallada sobre **${guild.name}**.`)
            .setColor('#FFA500')
            .setTimestamp()
            .setFooter({ text: `Solicitado por ${interaction.user.tag}`, iconURL: interaction.user.displayAvatarURL({ dynamic: true }) });

        const selectMenu = new StringSelectMenuBuilder()
            .setCustomId('svinfo_select')
            .setPlaceholder('Selecciona una categoría')
            .addOptions(
                { label: 'General', value: 'general', emoji: '🏠' },
                { label: 'Estadísticas', value: 'stats', emoji: '📊' },
                { label: 'Canales', value: 'channels', emoji: '#️⃣' },
                { label: 'Roles', value: 'roles', emoji: '🎭' },
                { label: 'Configuración', value: 'config', emoji: '🔧' },
                { label: 'Dueño', value: 'owner', emoji: '👑' },
                { label: 'Copiar ID Servidor', value: 'copyId', emoji: '📋' }
            );

        const row = new ActionRowBuilder().addComponents(selectMenu);

        try {
            await interaction.reply({ embeds: [initialEmbed], components: [row] });
        } catch (error) {
            logToFile(`Error al enviar la respuesta inicial de svinfo en ${guild.id}: ${error}`);
            console.error("Error replying initially:", error);

            return;
        }

        const filter = i => i.user.id === interaction.user.id && i.customId === 'svinfo_select';
        const collector = interaction.channel.createMessageComponentCollector({ filter, time: 120000 });

        collector.on('collect', async i => {
            try {
                await i.deferUpdate();

                const section = i.values[0]; // Valor seleccionado del menú desplegable

                let updatedEmbed = new EmbedBuilder()
                    .setColor('#FFA500')
                    .setTimestamp()
                    .setFooter({ text: `Solicitado por ${interaction.user.tag}`, iconURL: interaction.user.displayAvatarURL({ dynamic: true }) })
                    .setThumbnail(guild.iconURL({ dynamic: true, size: 512 }));

                switch (section) {
                    case 'general':
                        updatedEmbed
                            .setTitle(`🏠 Información General | ${guild.name}`)
                            .addFields(
                                { name: '🆔 ID Servidor', value: guild.id, inline: true },
                                { name: '👑 Dueño', value: owner ? `<@${owner.id}> (${owner.user.tag})` : 'Desconocido', inline: true },
                                { name: '📆 Creación', value: `<t:${Math.floor(guild.createdTimestamp / 1000)}:F>`, inline: true },
                                { name: '🌐 Región Preferida', value: guild.preferredLocale || 'No especificada', inline: true },
                                { name: '🛡️ Nivel Verificación', value: verificationLevels[guild.verificationLevel] || 'Desconocido', inline: true },
                                { name: '👥 Miembros (aprox)', value: `${guild.memberCount}`, inline: true }, 
                                { name: '📝 Descripción', value: guild.description || 'Sin descripción', inline: false }
                            );
                        break;

                    case 'stats':
                        const members = await guild.members.fetch();
                        const userCount = members.filter(member => !member.user.bot).size;
                        const botCount = members.filter(member => member.user.bot).size;
                        const onlineCount = members.filter(member => member.presence?.status === 'online').size;
                        const idleCount = members.filter(member => member.presence?.status === 'idle').size;
                        const dndCount = members.filter(member => member.presence?.status === 'dnd').size;
                        const offlineCount = userCount + botCount - (onlineCount + idleCount + dndCount); 

                        updatedEmbed
                            .setTitle(`📊 Estadísticas | ${guild.name}`)
                            .addFields(
                                { name: '👥 Miembros Totales', value: `${guild.memberCount}`, inline: true }, 
                                { name: '👤 Usuarios', value: `${userCount}`, inline: true },
                                { name: '🤖 Bots', value: `${botCount}`, inline: true },
                                { name: '🟢 En línea', value: `${onlineCount}`, inline: true },
                                { name: '🌙 Ausente', value: `${idleCount}`, inline: true },
                                { name: '🔴 No molestar', value: `${dndCount}`, inline: true },
                                { name: '⚪️ Desconectado', value: `${offlineCount}`, inline: true }, 
                                { name: '#️⃣ Canales Totales', value: `${guild.channels.cache.size}`, inline: true },
                                { name: '💬 Texto', value: `${guild.channels.cache.filter(ch => ch.type === ChannelType.GuildText).size}`, inline: true },
                                { name: '🔊 Voz', value: `${guild.channels.cache.filter(ch => ch.type === ChannelType.GuildVoice).size}`, inline: true },
                                { name: '🎭 Roles', value: `${guild.roles.cache.size}`, inline: true },
                                { name: '😂 Emojis', value: `${guild.emojis.cache.size}`, inline: true },
                                { name: '✨ Stickers', value: `${guild.stickers.cache.size}`, inline: true },
                                { name: '🚀 Nivel Boost', value: premiumTiers[guild.premiumTier] || 'N/A', inline: true },
                                { name: '💎 Boosts', value: `${guild.premiumSubscriptionCount || 0}`, inline: true }
                            )
                            .setFooter({ text: `Recuerda activar Intents para estadísticas precisas. Solicitado por ${interaction.user.tag}`, iconURL: interaction.user.displayAvatarURL({ dynamic: true }) });
                        break;

                    case 'channels':
                        updatedEmbed
                            .setTitle(`#️⃣ Canales | ${guild.name}`)
                            .addFields(
                                { name: '💬 Texto', value: `${guild.channels.cache.filter(ch => ch.type === ChannelType.GuildText).size}`, inline: true },
                                { name: '🔊 Voz', value: `${guild.channels.cache.filter(ch => ch.type === ChannelType.GuildVoice).size}`, inline: true },
                                { name: '📢 Anuncios', value: `${guild.channels.cache.filter(ch => ch.type === ChannelType.GuildAnnouncement).size}`, inline: true },
                                { name: '📰 Noticias (Hilos)', value: `${guild.channels.cache.filter(ch => ch.type === ChannelType.AnnouncementThread).size}`, inline: true }, // Ejemplo
                                { name: '🧵 Hilos Públicos', value: `${guild.channels.cache.filter(ch => ch.type === ChannelType.PublicThread).size}`, inline: true }
                            );
                        break;

                    case 'roles':
                        const rolesList = guild.roles.cache.map(role => role.name).join(', ');
                        updatedEmbed
                            .setTitle(`🎭 Roles | ${guild.name}`)
                            .setDescription(`Lista de roles:\n${rolesList}`)
                            .setFooter({ text: `Roles totales: ${guild.roles.cache.size} | Solicitado por ${interaction.user.tag}`, iconURL: interaction.user.displayAvatarURL({ dynamic: true }) });
                        break;

                    case 'config':
                        updatedEmbed
                            .setTitle(`🔧 Configuración | ${guild.name}`)
                            .addFields(
                                { name: '📅 Fecha de creación', value: `<t:${Math.floor(guild.createdTimestamp / 1000)}:F>`, inline: true },
                                { name: '🛡️ Nivel de verificación', value: verificationLevels[guild.verificationLevel], inline: true },
                                { name: '🔞 Filtro contenido explícito', value: explicitContentFilters[guild.explicitContentFilter], inline: true },
                                { name: '📝 Notificaciones por defecto', value: defaultMessageNotifications[guild.defaultMessageNotifications], inline: true },
                                { name: '🔧 Configuración de canal del sistema', value: guild.systemChannelFlags.bitfield.toString(), inline: true }
                            );
                        break;

                    case 'owner':
                        updatedEmbed
                            .setTitle(`👑 Dueño del servidor`)
                            .setDescription(`Dueño del servidor: ${owner ? `<@${owner.id}> (${owner.user.tag})` : 'Desconocido'}`);
                        break;

                    case 'copyId':
                        updatedEmbed
                            .setTitle(`📋 ID Servidor`)
                            .setDescription(`ID del servidor: \`${guild.id}\``);
                        break;
                }

                await i.editReply({ embeds: [updatedEmbed] });

            } catch (error) {
                logToFile(`Error en el comando svinfo para ${guild.id}: ${error}`);
                console.error("Error collecting:", error);
            }
        });

        collector.on('end', async (collected, reason) => {
            if (reason === 'time') {
                await interaction.editReply({ content: 'El tiempo ha expirado para interactuar con el menú.', components: [] });
            }
        });
    },
};
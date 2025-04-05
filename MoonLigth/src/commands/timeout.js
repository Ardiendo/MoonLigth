
const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits, WebhookClient } = require('discord.js');
require('dotenv').config();

const webhookURL = process.env.TIMEOUT_WEBHOOK_URL;
const webhookClient = webhookURL ? new WebhookClient({ url: webhookURL }) : null;

module.exports = {
    data: new SlashCommandBuilder()
        .setName('timeout')
        .setDescription('Administra el tiempo de espera de un usuario.')
        .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers)
        .addSubcommand(subcommand =>
            subcommand
                .setName('aplicar')
                .setDescription('Aplica un tiempo de espera a un usuario.')
                .addUserOption(option => option.setName('usuario').setDescription('El usuario al que se le aplicará el tiempo de espera.').setRequired(true))
                .addStringOption(option => option.setName('duracion').setDescription('La duración del tiempo de espera (ej. 1h, 30m, 1d).').setRequired(true))
                .addStringOption(option => option.setName('razon').setDescription('La razón del tiempo de espera.')))
        .addSubcommand(subcommand =>
            subcommand
                .setName('quitar')
                .setDescription('Quita el tiempo de espera de un usuario.')
                .addUserOption(option => option.setName('usuario').setDescription('El usuario al que se le quitará el tiempo de espera.').setRequired(true))),

    async execute(interaction) {
        const subcommand = interaction.options.getSubcommand();

        if (subcommand === 'aplicar') {
            const usuario = interaction.options.getMember('usuario');
            const duracion = interaction.options.getString('duracion');
            const razon = interaction.options.getString('razon') || 'No se proporcionó ninguna razón.';

            if (!duracion) {
                return interaction.reply({ content: 'Error: La duración es requerida.', ephemeral: true });
            }

            const ms = convertirDuracion(duracion);
            if (ms === null) {
                return interaction.reply({ content: 'Formato de duración inválido. Usa "1h", "30m", "1d", etc.', ephemeral: true });
            }

            try {
                await usuario.timeout(ms, razon);

                const embed = new EmbedBuilder()
                    .setColor('Red')
                    .setTitle('Usuario con Tiempo de Espera')
                    .setDescription(`${usuario} ha recibido un tiempo de espera de ${duracion}.`)
                    .addFields(
                        { name: 'Moderador', value: interaction.user.tag, inline: true },
                        { name: 'Razón', value: razon, inline: true },
                    )
                    .setTimestamp();

                if (webhookClient) {
                    await webhookClient.send({ embeds: [embed] });
                }

                await interaction.reply({ content: `${usuario} ha recibido un tiempo de espera de ${duracion}.`, ephemeral: true });
            } catch (error) {
                console.error(`Error al aplicar el tiempo de espera:`, error);
                await interaction.reply({ content: 'Hubo un error al aplicar el tiempo de espera.', ephemeral: true });
            }
        } else if (subcommand === 'quitar') {
            const usuario = interaction.options.getMember('usuario');

            try {
                await usuario.timeout(null);

                const embed = new EmbedBuilder()
                    .setColor('Green')
                    .setTitle('Tiempo de Espera Quitado')
                    .setDescription(`Se ha quitado el tiempo de espera de ${usuario}.`)
                    .addFields({ name: 'Moderador', value: interaction.user.tag, inline: true })
                    .setTimestamp();

                if (webhookClient) {
                    await webhookClient.send({ embeds: [embed] });
                }

                await interaction.reply({ content: `Se ha quitado el tiempo de espera de ${usuario}.`, ephemeral: true });
            } catch (error) {
                console.error(`Error al quitar el tiempo de espera:`, error);
                await interaction.reply({ content: 'Hubo un error al quitar el tiempo de espera.', ephemeral: true });
            }
        }
    },
};

function convertirDuracion(duracion) {
    if (!duracion || typeof duracion !== 'string') {
        return null;
    }

    const regex = /^(\d+)([hmsd])$/;
    const match = duracion.match(regex);

    if (!match) {
        return null;
    }

    const cantidad = parseInt(match[1]);
    const unidad = match[2];

    switch (unidad) {
        case 'h':
            return cantidad * 60 * 60 * 1000;
        case 'm':
            return cantidad * 60 * 1000;
        case 's':
            return cantidad * 1000;
        case 'd':
            return cantidad * 24 * 60 * 60 * 1000;
        default:
            return null;
    }
}

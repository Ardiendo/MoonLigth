require('dotenv').config()
const {
    Client,
    Intents,
    Partials,
    Collection,
    GatewayIntentBits,
    ActivityType,
    EmbedBuilder
} = require('discord.js')
const { REST } = require('@discordjs/rest')
const { Routes } = require('discord-api-types/v9')
const fs = require('node:fs')
const winston = require('winston')
const path = require('path')

const logger = winston.createLogger({
    level: 'info',
    format: winston.format.combine(
        winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
        winston.format.colorize(),
        winston.format.printf(({ timestamp, level, message }) => `[${timestamp}] ${level}: ${message}`)
    ),
    transports: [
        new winston.transports.Console(),
        new winston.transports.File({ filename: 'error.log', level: 'error' })
    ]
})

const token = process.env.TOKEN
const clientId = process.env.CLIENT_ID
const guildId = process.env.GUILD_ID
const NODE_ENV = process.env.NODE_ENV || 'development'
const COMMAND_SCOPE = process.env.COMMAND_SCOPE || 'both'

const client = new Client({
    intents: Object.values(GatewayIntentBits),
    partials: [Partials.Channel]
})

const Dev = '_.aari._'
const MoonLigthVersion = '1.1'

client.commands = new Collection()
client.events = new Collection()

const commands = []
const loadedCommandNames = new Set()
const commandsPath = path.join(__dirname, 'commands')

if (fs.existsSync(commandsPath)) {
    const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'))

    for (const file of commandFiles) {
        const filePath = path.join(commandsPath, file)
        try {
            const command = require(filePath)
            if (!command.data || !command.data.name || !command.execute) {
                logger.warn(`⚠️ Archivo de comando inválido: ${file}`)
                continue
            }

            if (loadedCommandNames.has(command.data.name)) {
                logger.warn(`⚠️ Comando duplicado omitido: ${command.data.name} en ${file}`)
                continue
            }

            loadedCommandNames.add(command.data.name)
            client.commands.set(command.data.name, command)
            commands.push(command.data.toJSON())
            logger.info(`✅ Comando cargado: ${command.data.name}`)
        } catch (error) {
            logger.error(`❌ Error al cargar el comando ${file}: ${error.stack || error}`)
        }
    }
} else {
    logger.warn(`⚠️ La carpeta de comandos no existe en: ${commandsPath}`)
}

const rest = new REST({ version: '10' }).setToken(token)

client.on('ready', async () => {
    try {
        if (!token || !clientId) {
            throw new Error('❌ Faltan variables de entorno esenciales (TOKEN, CLIENT_ID)')
        }

        logger.info(`🎉 ¡Conectado como ${client.user.tag}!`)
        const bot = client.user

        const logsChannelId = '1220480757697478697'
        const logsChannel = client.channels.cache.get(logsChannelId)
        if (logsChannel) {
            const commandsList = Array.from(client.commands.keys()).join(', ') || 'Ninguno'
            const loginEmbed = new EmbedBuilder()
                .setColor("Random")
                .setTitle('🟢 \\ MoonLigth | ONLINE \\ 🟢')
                .setDescription(`${bot.tag} | Se inició correctamente\n\n**Comandos Cargados Localmente:**\n\`\`\`${commandsList}\`\`\``)
                .addFields(
                    { name: '📊 Servidores', value: `${client.guilds.cache.size}`, inline: true },
                    { name: '👥 Usuarios', value: `${client.guilds.cache.size > 1 ? 'No disponible (Shard?)' : client.guilds.cache.first()?.memberCount ?? 'N/A'}`, inline: true },
                    { name: '🕒 Tiempo de inicio', value: `<t:${Math.floor(Date.now() / 1000)}:F>`, inline: true },
                    { name: '🛠️ Total Comandos Cargados', value: `${client.commands.size}`, inline: true }
                )
                .setThumbnail(bot.displayAvatarURL())
                .setFooter({ text: `ID del Bot: ${bot.id}` })
                .setTimestamp()

            await logsChannel.send({ embeds: [loginEmbed] })
            logger.info('✅ Logs de inicio enviados correctamente')
        } else {
            logger.warn(`⚠️ No se pudo encontrar el canal de logs con ID: ${logsChannelId}`)
        }

        const scope = COMMAND_SCOPE.toLowerCase()
        if (!['global', 'guild', 'both'].includes(scope)) {
            throw new Error(`❌ COMMAND_SCOPE inválido: "${COMMAND_SCOPE}". Usa: global, guild o both.`)
        }

        logger.info('🧹 Iniciando proceso de limpieza y registro de comandos...')

        try {
            logger.info('🔄 Obteniendo comandos globales existentes...')
            const existingGlobalCommands = await rest.get(
                Routes.applicationCommands(clientId)
            )

            const commandsToDelete = []
            for (const cmd of existingGlobalCommands) {
                if (!loadedCommandNames.has(cmd.name)) {
                    commandsToDelete.push(cmd)
                }
            }

            if (commandsToDelete.length > 0) {
                logger.warn(`⚠️ Se eliminarán ${commandsToDelete.length} comandos globales obsoletos: ${commandsToDelete.map(c => c.name).join(', ')}`)
                await Promise.all(commandsToDelete.map(cmd =>
                    rest.delete(Routes.applicationCommand(clientId, cmd.id))
                        .then(() => logger.info(`✅ Comando global eliminado: ${cmd.name} (${cmd.id})`))
                        .catch(err => logger.error(`❌ Error eliminando comando global ${cmd.name} (${cmd.id}): ${err.stack || err}`))
                ))
                logger.info('✅ Limpieza de comandos globales completada.')
            } else {
                logger.info('🟢 No se encontraron comandos globales obsoletos.')
            }

            if (scope === 'global' || scope === 'both') {
                logger.info(`🌍 Registrando ${commands.length} comandos globales...`)
                await rest.put(Routes.applicationCommands(clientId), { body: commands })
                logger.info('✅ Comandos registrados globalmente.')
            }
        } catch (error) {
            logger.error(`❌ Error durante el proceso de comandos globales: ${error.stack || error}`)
        }

        if ((scope === 'guild' || scope === 'both') && guildId) {
            try {
                logger.info(`🏗️ Registrando ${commands.length} comandos en el servidor de desarrollo (ID: ${guildId})...`)
                await rest.put(Routes.applicationGuildCommands(clientId, guildId), { body: commands })
                logger.info('✅ Comandos registrados en el servidor de desarrollo.')
            } catch (error) {
                logger.error(`❌ Error registrando comandos en el servidor ${guildId}: ${error.stack || error}`)
            }
        } else if ((scope === 'guild' || scope === 'both') && !guildId) {
            logger.warn("⚠️ COMMAND_SCOPE incluye 'guild' pero no se proporcionó GUILD_ID. Omitiendo registro de servidor.")
        }

        const activities = [
            { name: 'By: Ardiendo | discord.gg/vZyQ3u5re2', type: ActivityType.Playing },
            { name: 'MoonLigth v1.1 en acción', type: ActivityType.Competing },
            { name: 'Comandos mágicos disponibles', type: ActivityType.Listening },
            { name: 'Protegiendo servidores...', type: ActivityType.Watching },
            { name: '/help para ver mis comandos', type: ActivityType.Listening }
        ]
        let currentActivity = 0
        const updatePresence = () => {
            client.user.setPresence({
                activities: [activities[currentActivity]],
                status: 'dnd'
            })
            currentActivity = (currentActivity + 1) % activities.length
        }
        updatePresence()
        setInterval(updatePresence, 30 * 1000)
        logger.info('✅ Rich Presence configurada')

    } catch (error) {
        logger.error(`❌ Error crítico durante el inicio: ${error.stack || error}`)
        const errorChannelId = '1356718029924335752'
        const channel = client.channels.cache.get(errorChannelId)
        if (channel && channel.isTextBased()) {
            const embed = new EmbedBuilder()
                .setColor('Red')
                .setTitle('❌ Error Crítico al Iniciar')
                .setDescription('Se produjo un error durante el arranque del bot.')
                .addFields(
                    { name: 'Mensaje', value: `\`\`\`${error.message}\`\`\`` },
                    { name: 'Stack (parcial)', value: `\`\`\`${error.stack?.slice(0, 1000) || 'No disponible'}\`\`\`` }
                )
                .setTimestamp()
            await channel.send({ embeds: [embed] }).catch(err => logger.error(`❌ Failed to send critical error embed: ${err}`))
        } else {
            logger.warn(`⚠️ No se pudo encontrar o enviar al canal de errores críticos con ID: ${errorChannelId}`)
        }
    }
})

client.on('interactionCreate', async interaction => {
    if (!interaction.isChatInputCommand()) return

    const command = client.commands.get(interaction.commandName)
    if (!command) {
        logger.warn(`⚠️ Comando no encontrado: ${interaction.commandName}`)
        try {
            await interaction.reply({ content: 'Ups! Parece que ese comando ya no existe o ha cambiado.', ephemeral: true })
        } catch (replyError) {
            logger.error(`❌ Error respondiendo a comando no encontrado: ${replyError}`)
        }
        return
    }

    try {
        await command.execute(interaction, client)
    } catch (error) {
        logger.error(`❌ Error ejecutando /${interaction.commandName}: ${error.stack || error}`)

        const errorEmbed = new EmbedBuilder()
            .setColor('Red')
            .setTitle('❌ Error al Ejecutar')
            .setDescription('Hubo un error al ejecutar este comando.')
            .addFields(
                { name: 'Comando', value: `\`/${interaction.commandName}\`` },
                { name: 'Usuario', value: `${interaction.user.tag} (\`${interaction.user.id}\`)` },
                { name: 'Error', value: `\`\`\`${error.message}\`\`\`` }
            )
            .setTimestamp()

        try {
            if (interaction.replied || interaction.deferred) {
                await interaction.followUp({ embeds: [errorEmbed], ephemeral: true })
            } else {
                await interaction.reply({ embeds: [errorEmbed], ephemeral: true })
            }
        } catch (err) {
            logger.error(`❌ Error al responder con embed de error: ${err.stack || err}`)
        }
    }
})

const eventsPath = path.join(__dirname, 'events')
if (fs.existsSync(eventsPath)) {
    const eventFiles = fs.readdirSync(eventsPath).filter(f => f.endsWith('.js'))
    for (const file of eventFiles) {
        const filePath = path.join(eventsPath, file)
        try {
            const event = require(filePath)
            if (!event.name || !event.execute) {
                logger.warn(`⚠️ Archivo de evento inválido: ${file}`)
                continue
            }
            if (event.once) {
                client.once(event.name, (...args) => event.execute(...args, client))
            } else {
                client.on(event.name, (...args) => event.execute(...args, client))
            }
            client.events.set(event.name, event)
            logger.info(`✅ Evento cargado: ${event.name}`)
        } catch (error) {
            logger.error(`❌ Error cargando evento ${file}: ${error.stack || error}`)
        }
    }
} else {
    logger.info("⚠️ La carpeta de eventos no existe, omitiendo carga de eventos.")
}

client.login(token)
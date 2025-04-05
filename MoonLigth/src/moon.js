require('dotenv').config();

const { Client, Intents, Partials, Collection, GatewayIntentBits, ActivityType, EmbedBuilder } = require('discord.js');
const { REST } = require('@discordjs/rest');
const { Routes } = require('discord-api-types/v9');
const fs = require('node:fs');
const winston = require('winston');
const path = require('path');

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    winston.format.colorize(),
    winston.format.printf(({ timestamp, level, message }) => {
      return `[${timestamp}] ${level}: ${message}`;
    })
  ),
  transports: [
    new winston.transports.Console(),
    new winston.transports.File({ filename: 'error.log', level: 'error' }),
  ],
});

const token = process.env.TOKEN;
const clientId = process.env.CLIENT_ID;
const guildId = process.env.GUILD_ID;
const NODE_ENV = process.env.NODE_ENV || 'development';

const commands = [];
const commandFiles = fs.readdirSync(path.join(__dirname, 'commands')).filter(file => file.endsWith('.js'));

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildBans,
    GatewayIntentBits.GuildEmojisAndStickers,
    GatewayIntentBits.GuildIntegrations,
    GatewayIntentBits.GuildWebhooks,
    GatewayIntentBits.GuildInvites,
    GatewayIntentBits.GuildVoiceStates,
    GatewayIntentBits.GuildPresences,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.GuildMessageReactions,
    GatewayIntentBits.GuildMessageTyping,
    GatewayIntentBits.DirectMessages,
    GatewayIntentBits.DirectMessageReactions,
    GatewayIntentBits.DirectMessageTyping,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildScheduledEvents,
    GatewayIntentBits.AutoModerationConfiguration,
    GatewayIntentBits.AutoModerationExecution
  ],
  partials: [Partials.Channel],
});

const Dev = '_.aari._';
const MoonLigthVersion = '1.1';
client.commands = new Collection();

const loadedCommands = new Set();

for (const file of commandFiles) {
  try {
    const command = require(`./commands/${file}`);

    if (loadedCommands.has(command.data.name)) {
      logger.warn(`⚠️ Comando duplicado encontrado: ${command.data.name} en ${file}`);
      continue;
    }

    loadedCommands.add(command.data.name);
    client.commands.set(command.data.name, command);
    commands.push(command.data.toJSON());
    logger.info(`✅ Comando cargado: ${command.data.name}`);
  } catch (error) {
    logger.error(`❌ Error al cargar el comando ${file}: ${error}`);
    const loggingChannelId = '1356718029924335752'; 
    const loggingChannel = client.channels.cache.get(loggingChannelId);
    if (loggingChannel) {
      const errorEmbed = new EmbedBuilder()
        .setColor('Red')
        .setTitle('❌ Error al cargar comando')
        .setDescription(`Hubo un error al cargar el comando \`${file}\`.`)
        .addFields({ name: 'Error', value: error.message, inline: false })
        .setTimestamp();
      loggingChannel.send({ embeds: [errorEmbed] });
    }
  }
}

const rest = new REST({ version: '10' }).setToken(token);

client.on('ready', async () => {
  try {
    if (!token || !clientId || !guildId) {
      throw new Error('Faltan variables de entorno necesarias (TOKEN, CLIENT_ID, GUILD_ID)');
    }

    logger.info(`¡Conectado como ${client.user.tag}!`);
    const bot = client.user;

    // Sistema de logs de inicio
    const logsChannel = client.channels.cache.get('1220480757697478697', '1356718029924335752');
    if (logsChannel) {
      const commandsList = Array.from(client.commands.keys()).join(', ');
      const loginEmbed = new EmbedBuilder()
        .setColor("Green")
        .setTitle('🟢 Bot Iniciado')
        .setDescription(`${bot.tag} se ha conectado correctamente\n\n**Comandos Actualizados:**\n\`\`\`${commandsList}\`\`\``)
        .addFields(
          { name: '📊 Servidores', value: `${client.guilds.cache.size}`, inline: true },
          { name: '👥 Usuarios', value: `${client.users.cache.size}`, inline: true },
          { name: '🕒 Tiempo de inicio', value: `<t:${Math.floor(Date.now() / 1000)}:F>`, inline: true },
          { name: '🛠️ Total Comandos', value: `${client.commands.size}`, inline: true }
        )
        .setThumbnail(bot.displayAvatarURL())
        .setFooter({ text: `ID del Bot: ${bot.id}` })
        .setTimestamp();

      await logsChannel.send({ embeds: [loginEmbed] });
      logger.info('✅ Logs de inicio enviados correctamente');
    } else {
      logger.warn('⚠️ No se pudo encontrar el canal de logs');
    }

    try {
      logger.info('🚀 Actualizando comandos globalmente...');

      await rest.put(Routes.applicationCommands(clientId), { body: commands });
      logger.info('✅ Comandos actualizados globalmente con éxito.');

      if (NODE_ENV === 'development' && guildId) {
        await rest.put(Routes.applicationGuildCommands(clientId, guildId), { body: commands });
        logger.info('✅ Comandos actualizados en el servidor de desarrollo con éxito.');
      }
    } catch (error) {
      logger.error('❌ Error al actualizar los comandos:', error.message);
      throw error;
    }

    const activities = [
      { name: 'By: Ardiendo', type: ActivityType.Playing },
      { name: 'discord.gg/vZyQ3u5re2', type: ActivityType.Competing },
      { name: 'Ticket system | Coming soon...', type: ActivityType.Watching },
      { name: '/help para ver mis comandos', type: ActivityType.Listening },
    ];

    let currentActivity = 0;

    function updatePresence() {
      const activity = activities[currentActivity];
      if (activity.name === 'By: Ardiendo') {
        activity.name = `By: Ardiendo | ${client.guilds.cache.size} servidores`;
      }
      client.user.setPresence({ activities: [activity], status: 'dnd' });
      currentActivity = (currentActivity + 1) % activities.length;
    }

    updatePresence();
    setInterval(updatePresence, 60 * 60 * 1000);

    const channelId = '1356718029924335752';
    const channel = client.channels.cache.get(channelId);
    if (channel) {
      const embed = new EmbedBuilder()
        .setColor("Random")
        .setTitle('✅', `${Dev} | Inicio completado`)
        .setDescription(`${bot.tag} está **ONLINE**!`)
        .setThumbnail(bot.displayAvatarURL())
        .addFields(
          { name: 'Versión', value: MoonLigthVersion, inline: true },
          { name: 'Servidor', value: client.guilds.cache.first().name, inline: true }, 
        )
        .setTimestamp()
        .setFooter({ text: `Desarrollado por ${Dev}`, iconURL: bot.displayAvatarURL() });

      channel.send({ embeds: [embed] });
    } else {
      logger.warn('No se pudo encontrar el canal para enviar el mensaje de inicio.');
    }

    logger.info('✅ Rich Presence configurada.');
  } catch (error) {
      logger.error('❌ Error crítico:', error);
      const debuggingChannelId = '1356718029924335752';
      const debuggingChannel = client.channels.cache.get(debuggingChannelId);
      if (debuggingChannel) {
        const errorEmbed = new EmbedBuilder()
          .setColor('Red')
          .setTitle('⚠️ Error Crítico Detectado')
          .setDescription('Se ha producido un error durante el inicio del bot')
          .addFields(
            { 
              name: '🔍 Detalles del Error',
              value: `\`\`\`js\n${error.stack || error.message}\`\`\``,
              inline: false 
            },
            { 
              name: '⏰ Timestamp',
              value: `<t:${Math.floor(Date.now() / 1000)}:F>`,
              inline: true 
            },
            {
              name: '🔧 Tipo de Error',
              value: error.name || 'Error Desconocido',
              inline: true
            },
            {
              name: '💻 Estado del Sistema',
              value: `RAM: ${(process.memoryUsage().heapUsed / 1024 / 1024).toFixed(2)}MB\nUptime: ${Math.floor(process.uptime())}s`,
              inline: true
            }
          )
          .setTimestamp()
          .setFooter({ text: 'MoonLigth Error Handler', iconURL: client.user?.displayAvatarURL() });

        await debuggingChannel.send({ embeds: [errorEmbed] });
      } else {
        logger.error('No se pudo encontrar el canal de depuración para enviar el mensaje de error.');
      }

      if (error.name === 'MoonLigth | Error Ready') {
        logger.error('Error crítico detectado. Iniciando apagado de emergencia...');
        process.exit(1);
      }
    }
});

client.on('interactionCreate', async interaction => {
  if (!interaction.isChatInputCommand()) return;

  const command = client.commands.get(interaction.commandName);

  if (!command) return;

  try {
    await command.execute(interaction);
  } catch (error) {
    console.error(`\n❌ Error al ejecutar el comando: \n${error}\n`);

    const errorEmbed = new EmbedBuilder()
      .setColor('Red')
      .setTitle('❌ Error')
      .setDescription('Hubo un error al ejecutar el comando. Por favor, inténtalo de nuevo más tarde.')
      .addFields(
        { name: 'Comando', value: `/${interaction.commandName}`, inline: true },
        { name: 'Usuario', value: interaction.user.tag, inline: true },
        { name: 'Fecha', value: `<t:${Math.floor(Date.now() / 1000)}:F>`, inline: true },
      )
      .setFooter({ text: 'Si el error persiste, contacta al desarrollador.' });

    await interaction.reply({ embeds: [errorEmbed], ephemeral: true });
    }
  }
);

client.login(token);
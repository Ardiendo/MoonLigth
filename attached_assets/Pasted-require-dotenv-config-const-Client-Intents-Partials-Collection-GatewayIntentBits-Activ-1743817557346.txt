require('dotenv').config();

const { Client, Intents, Partials, Collection, GatewayIntentBits, ActivityType, EmbedBuilder } = require('discord.js');
const { REST } = require('@discordjs/rest');
const { Routes } = require('discord-api-types/v9');
const fs = require('node:fs');
const winston = require('winston');
const path = require('path');

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

for (const file of commandFiles) {
  try {
    const command = require(`./commands/${file}`);
    client.commands.set(command.data.name, command);
    commands.push(command.data.toJSON());
  } catch (error) {
    console.error(`\n❌ Error al cargar el comando ${file}: \n${error}\n`);
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

const rest = new REST({ version: '10' }).setToken(token);

client.on('ready', async () => {
  try {
    logger.info(`¡Conectado como ${client.user.tag}!`);
    const bot = client.user;

    if (NODE_ENV === 'development') {
      logger.info('🚀 Actualizando comandos globalmente...');
      try {
        await rest.put(Routes.applicationGuildCommands(clientId, guildId), { body: [] });
        logger.info('🗑️ Comandos antiguos: eliminados del servidor.');
        await rest.put(Routes.applicationCommands(clientId), { body: commands });
        logger.info('✅ Comandos actualizados globalmente con éxito.');
      } catch (error) {
        logger.error('❌ Error al actualizar los comandos globalmente:', error);
      }
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
    logger.error('❌ Ya la hemos liao:', error);
    const debuggingChannelId = '1356718029924335752';
    const debuggingChannel = client.channels.cache.get(debuggingChannelId);
    if (debuggingChannel) {
      const embed = new EmbedBuilder()
        .setColor('Red')
        .setTitle('Error en el evento "ready"')
        .setDescription(`Se ha producido un error al iniciar el bot: ${error.message}`)
        .setTimestamp();
      debuggingChannel.send({ embeds: [embed] });
    } else {
      logger.warn('No se pudo encontrar el canal de depuración para enviar el mensaje de error.');
    }
    if (error.name === 'MoonLigth | Error Ready') {
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
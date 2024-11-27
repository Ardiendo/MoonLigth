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

const MoonLigthVersion = '1.0.0';


client.commands = new Collection();


for (const file of commandFiles) {
  try {
    const command = require(`./commands/${file}`);
    client.commands.set(command.data.name, command);
    commands.push(command.data.toJSON());
  } catch (error) {
    logger.error(`Error al cargar el comando ${file}:`, error);
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

        
        await rest.put(
          Routes.applicationCommands(clientId),
          { body: commands },
        );

        logger.info('✅ Comandos actualizados globalmente con éxito.');
      } catch (error) {
        logger.error('❌ Error al actualizar los comandos globalmente:', error);
      }
    }

    const { ActivityType } = require('discord.js');

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

  client.user.setPresence({
    activities: [activity],
    status: 'dnd',
  });

  currentActivity = (currentActivity + 1) % activities.length;
}

updatePresence(); 
setInterval(updatePresence, 60 * 60 * 1000); 
    
    const channelId = '1294566335933845525'; 
    const channel = client.channels.cache.get(channelId);
    
    if (channel) {
      const embed = new EmbedBuilder()
        .setTitle(`${Dev} | Start Finish...`)
        .setColor('Random')
        .setDescription(`${bot.tag} | ONLINE `) 
        .setThumbnail(bot.displayAvatarURL())
        .setFooter({ text: 'Bot by Ardiendo', iconURL: bot.displayAvatarURL() }, `Version: ${MoonLigthVersion}`)
        .setTimestamp()
    
      channel.send({ embeds: [embed] });
    } else {
      logger.warn('No se pudo encontrar el canal para enviar el mensaje de inicio.');
    }
    
    logger.info('✅ Rich Presence configurada.');

  } catch (error) {
    logger.error('❌ Ya la hemos liao:', error);
  
    
    const debuggingChannelId = '1290516437533986891'; 
    const debuggingChannel = client.channels.cache.get(debuggingChannelId);
  
    if (debuggingChannel) {
      const embed = new EmbedBuilder()
        .setColor(0xFF0000)
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
})


client.on('interactionCreate', async interaction => {
  if (!interaction.isChatInputCommand()) return;

  const command = client.commands.get(interaction.commandName);

  if (!command) return;

  try {
    await command.execute(interaction);
  } catch (error) {
    console.error(error);
    logger.error(`Error al ejecutar el comando ${interaction.commandName}:`, error);

    const embed = new EmbedBuilder()
      .setColor(0xFF0000)
      .setTitle('Error')
      .setDescription('Hubo un error al ejecutar este comando! Contacta con los developers.');

    try {
      await interaction.reply({ embeds: [embed], ephemeral: true });
    } catch (errorReply) {
      console.error('Error al enviar el mensaje de error:', errorReply);
      logger.error('Error al enviar el mensaje de error:', errorReply);
    }
  }
});

client.login(token);
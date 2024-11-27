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

    if (NODE_ENV === 'development') {
      logger.info('🚀 Actualizando comandos (solo en desarrollo)...');

      try {
        
        await rest.put(Routes.applicationGuildCommands(clientId, guildId), { body: [] });
        logger.info('🗑️ Comandos antiguos eliminados del servidor.');

        
        await rest.put(Routes.applicationGuildCommands(clientId, guildId), { body: commands });
        logger.info('✅ Comandos actualizados en el servidor con éxito.');
      } catch (error) {
        logger.error('❌ Error al actualizar los comandos:', error);
      }
    }

    client.user.setPresence({
      activities: [
        { name: 'By: Ardiendo', type: ActivityType.Playing },
        { name: 'Ticket system | Coming soon...', type: ActivityType.Watching }
      ],
      status: 'dnd',
    });
    
    
    const channelId = '1294566335933845525'; 
    const channel = client.channels.cache.get(channelId);
    
    if (channel) {
      const embed = new EmbedBuilder()
        .setColor(0x0099FF)
        .setTitle('¡Estoy listo!')
        .setDescription('MoonLigth se ha iniciado correctamente y está listo para usar.')
        .setTimestamp();
    
      channel.send({ embeds: [embed] });
    } else {
      logger.warn('No se pudo encontrar el canal para enviar el mensaje de inicio.');
    }
    
    logger.info('✅ Rich Presence configurada.');

  } catch (error) {
    logger.error('❌ Error en el evento "ready":', error);
  }
});


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
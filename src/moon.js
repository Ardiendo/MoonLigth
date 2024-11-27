require('dotenv').config();

const { Client, Intents, Partials, Collection, GatewayIntentBits, ActivityType } = require('discord.js');
const { REST } = require('@discordjs/rest');
const { Routes } = require('discord-api-types/v9');
const fs = require('node:fs');
const winston = require('winston');

const token = process.env.TOKEN;
const clientId = process.env.CLIENT_ID;
const guildId = process.env.GUILD_ID;

const commands = [];
const commandFiles = fs.readdirSync('./commands').filter(file => file.endsWith('.js'));

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
  const command = require(`./commands/${file}`);
  client.commands.set(command.data.name, command);
  commands.push(command.data.toJSON());
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
  
     
      if (process.env.NODE_ENV === 'development') {
        logger.info('🚀 Iniciando la actualización de comandos (solo en desarrollo)...');
  
        
        await rest.put(Routes.applicationGuildCommands(clientId, guildId), { body: [] });
        logger.info('🗑️ Comandos antiguos eliminados del servidor.');
  
        
        await rest.put(Routes.applicationGuildCommands(clientId, guildId), { body: commands });
        logger.info('✅ Comandos actualizados en el servidor con éxito.');
      }
  
      
      client.user.setPresence({
        activities: [
          { name: 'By: Ardiendo', type: ActivityType.Playing },
          { name: 'Ticket system | Coming soon...', type: ActivityType.Watching }
        ],
        status: 'dnd',
      });
      logger.info('✅ Rich Presence configurada.');
    } catch (error) {
      logger.error('❌ Error al actualizar los comandos o configurar Rich Presence:', error);
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

        const embed = new EmbedBuilder()
            .setColor(0xFF0000)
            .setTitle('Error')
            .setDescription('Hubo un error al ejecutar este comando! contacta con los developers');

        await interaction.reply({ embeds: [embed], ephemeral: true });
    }
});

client.login(token);
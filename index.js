const { Client, GatewayIntentBits, Events } = require('discord.js');
require('dotenv').config();

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildVoiceStates,
    GatewayIntentBits.GuildModeration,
    GatewayIntentBits.GuildInvites,
    GatewayIntentBits.GuildPresences,
    GatewayIntentBits.GuildScheduledEvents,
  ],
});

const cleanTemporaryChannels = require('./modules/voiceDeleter.js');
const generateTemporaryChannels = require('./modules/voiceGenerator.js')(client);

client.once(Events.ClientReady, async () => {
  const guildId = process.env.GUILD_ID;
  const guild = client.guilds.cache.get(guildId);

  if (!guild) {
    console.error(`Guild with ID ${guildId} not found in cache.`);
    try {
      const fetchedGuild = await client.guilds.fetch(guildId);
      console.log(`Fetched guild: ${fetchedGuild.name}`);
    } catch (err) {
      console.error(`Failed to fetch guild ${guildId}:`, err);
      return;
    }
  } else {
    console.log(`Found Guild: ${guild.name}`);
  }

  console.log(`Connected as ${client.user.tag}`);

  try {
    await cleanTemporaryChannels(client);
  } catch (err) {
    console.error('Initial cleaning failed:', err);
  }

  const interval = setInterval(async () => {
    try {
      await cleanTemporaryChannels(client);
    } catch (err) {
      console.error('Periodic cleaning failed:', err);
    }
  }, 5_000);

  setTimeout(() => {
    clearInterval(interval);
    console.log('The automatic cleaning of temporary channels has stopped.');
  }, 30 * 60 * 1000);
});

client.login(process.env.CLIENT_TOKEN).catch(error => {
  console.error('Failed to login:', error);
});

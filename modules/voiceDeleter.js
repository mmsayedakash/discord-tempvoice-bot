const { ChannelType } = require('discord.js');
require('dotenv').config();

function isValidSnowflake(id) {
  return typeof id === 'string' && /^\d{17,19}$/.test(id);
}

async function cleanTemporaryChannels(client) {
  try {
    if (!client.isReady()) return;

    const configs = [
      {
        prefix: process.env.CHANNEL1_CHANNEL_NAME || '',
        categoryId: process.env.CHANNEL1_JOIN_CATEGORY_ID,
      },
      {
        prefix: process.env.CHANNEL2_CHANNEL_NAME || '',
        categoryId: process.env.CHANNEL2_JOIN_CATEGORY_ID,
      },
      {
        prefix: process.env.CHANNEL3_CHANNEL_NAME || '',
        categoryId: process.env.CHANNEL3_JOIN_CATEGORY_ID,
      },
    ].filter(c => c.prefix && isValidSnowflake(c.categoryId));

    for (const { prefix, categoryId } of configs) {
      let category;
      try {
        category = await client.channels.fetch(categoryId);
      } catch (err) {
        console.warn(`[cleanTemporaryChannels] Failed to fetch category ${categoryId}:`, err);
        continue;
      }

      if (!category || category.type !== ChannelType.GuildCategory) {
        console.warn(`[cleanTemporaryChannels] Category ${categoryId} is invalid or not a category`);
        continue;
      }

      const guild = category.guild;
      let allChannels;
      try {
        allChannels = await guild.channels.fetch();
      } catch (err) {
        console.warn(`[cleanTemporaryChannels] Failed to fetch channels for guild ${guild.id}:`, err);
        continue;
      }

      const voiceChannels = allChannels.filter(channel =>
        channel.parentId === categoryId &&
        channel.type === ChannelType.GuildVoice &&
        channel.name.startsWith(prefix)
      );

      for (const [channelId, channel] of voiceChannels) {
        try {
          if (channel.members.size === 0) {
            await new Promise(resolve => setTimeout(resolve, 2000));

            let freshChannel;
            try {
              freshChannel = await client.channels.fetch(channelId);
            } catch {
              continue;
            }

            if (!freshChannel) continue;

            if (freshChannel.members.size === 0) {
              try {
                await freshChannel.delete('Clean empty temporary channels');
              } catch (err) {
                console.warn(`[cleanTemporaryChannels] Failed to delete channel ${freshChannel.id}:`, err);
              }
            }
          }
        } catch (err) {
          console.warn(`[cleanTemporaryChannels] Error processing channel ${channelId}:`, err);
        }
      }
    }
  } catch (err) {
    console.error('[cleanTemporaryChannels] Unexpected error:', err);
  }
}

module.exports = cleanTemporaryChannels;

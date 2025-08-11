const { PermissionsBitField, EmbedBuilder } = require('discord.js');

module.exports = (client) => {
  const categoriesConfig = {
    support: {
        waitingChannelId: process.env.CHANNEL1_JOIN_CHANNEL_ID,
        waitingCategoryId: process.env.CHANNEL1_JOIN_CATEGORY_ID,
        notifyChannelId: process.env.CHANNEL1_NOTIFY_CHANNEL_ID,
        staffRoleIds: process.env.CHANNEL1_STAFF_IDS?.split(',').map(id => id.trim()) || [],
        cooldown: parseInt(process.env.CHANNEL1_COOLDOWN) || 30,
        channelPrefix: process.env.CHANNEL1_CHANNEL_NAME,
        notifyEmbedColor: process.env.CHANNEL1_NOTIFY_EMBED_COLOR || '#3498DB',
    },
    mafia: {
        waitingChannelId: process.env.CHANNEL2_JOIN_CHANNEL_ID,
        waitingCategoryId: process.env.CHANNEL2_JOIN_CATEGORY_ID,
        notifyChannelId: process.env.CHANNEL2_NOTIFY_CHANNEL_ID,
        staffRoleIds: process.env.CHANNEL2_STAFF_IDS?.split(',').map(id => id.trim()) || [],
        cooldown: parseInt(process.env.CHANNEL2_COOLDOWN) || 45,
        channelPrefix: process.env.CHANNEL2_CHANNEL_NAME,
        notifyEmbedColor: process.env.CHANNEL2_NOTIFY_EMBED_COLOR || '#E74C3C',
    },
    donate: {
        waitingChannelId: process.env.CHANNEL3_JOIN_CHANNEL_ID,
        waitingCategoryId: process.env.CHANNEL3_JOIN_CATEGORY_ID,
        notifyChannelId: process.env.CHANNEL3_NOTIFY_CHANNEL_ID,
        staffRoleIds: process.env.CHANNEL3_STAFF_IDS?.split(',').map(id => id.trim()) || [],
        cooldown: parseInt(process.env.CHANNEL3_COOLDOWN) || 60,
        channelPrefix: process.env.CHANNEL3_CHANNEL_NAME,
        notifyEmbedColor: process.env.CHANNEL3_NOTIFY_EMBED_COLOR || '#2ECC71',
    }
  };

  const cooldowns = new Map();
  const activeChannels = new Map();
  const userActiveSupportChannels = new Map();

  client.on('voiceStateUpdate', async (oldState, newState) => {
    try {
      const member = newState.member;
      if (!member) return;

      if (oldState.channel && activeChannels.has(oldState.channelId)) {
        const oldChannel = oldState.channel;
        if (oldChannel.members.size === 0) {
          const timeoutId = setTimeout(async () => {
            if (oldChannel.members.size === 0) {
              try { await oldChannel.delete(); } catch { }
              activeChannels.delete(oldChannel.id);
              for (const [userId, categoryMap] of userActiveSupportChannels) {
                for (const [catKey, chanId] of categoryMap) {
                  if (chanId === oldChannel.id) {
                    categoryMap.delete(catKey);
                    if (categoryMap.size === 0) userActiveSupportChannels.delete(userId);
                    break;
                  }
                }
              }
            }
          }, 3000);
          activeChannels.set(oldChannel.id, timeoutId);
        }
      }

      const categoryKey = Object.keys(categoriesConfig).find(key => categoriesConfig[key].waitingChannelId === newState.channelId);
      if (!categoryKey) return;
      if (oldState.channelId === newState.channelId) return;

      const now = Date.now();

      if (!cooldowns.has(member.id)) cooldowns.set(member.id, new Map());
      const userCooldowns = cooldowns.get(member.id);
      const lastUsed = userCooldowns.get(categoryKey);
      const cooldownTime = categoriesConfig[categoryKey].cooldown * 1000;

      let userChannelsMap = userActiveSupportChannels.get(member.id);
      if (!userChannelsMap) {
        userChannelsMap = new Map();
        userActiveSupportChannels.set(member.id, userChannelsMap);
      }

      const existingChannelId = userChannelsMap.get(categoryKey);
      if (existingChannelId) {
        const existingChannel = newState.guild.channels.cache.get(existingChannelId);
        if (existingChannel) {
          if (existingChannel.members.size === 0) {
            try { await existingChannel.delete(); } catch { }
            activeChannels.delete(existingChannel.id);
            userChannelsMap.delete(categoryKey);
          } else {
            try { await member.voice.setChannel(existingChannel); } catch { }
            return;
          }
        } else {
          userChannelsMap.delete(categoryKey);
        }
      }

      if (lastUsed && now - lastUsed < cooldownTime) {
        try { await member.voice.disconnect('Cooldown active'); } catch { }
        return;
      }

      userCooldowns.set(categoryKey, now);

      const config = categoriesConfig[categoryKey];

      const categoryId = config.waitingCategoryId;
      const category = categoryId ? newState.guild.channels.cache.get(categoryId) : null;
      if (!category) return;

      const rawUsername = member.user.username.replace(/\s+/g, '-').replace(/[^\w-]/g, '');
      const cleanUsername = rawUsername.charAt(0).toUpperCase() + rawUsername.slice(1);
      const channelName = `${config.channelPrefix}-${cleanUsername}`;

      const permissions = [
        {
          id: member.id,
          allow: [
            PermissionsBitField.Flags.ViewChannel,
            PermissionsBitField.Flags.Connect,
            PermissionsBitField.Flags.Speak,
            PermissionsBitField.Flags.UseVAD,
            PermissionsBitField.Flags.Stream
          ]
        },
        ...config.staffRoleIds.map(roleId => ({
          id: roleId,
          allow: [
            PermissionsBitField.Flags.ViewChannel,
            PermissionsBitField.Flags.Connect,
            PermissionsBitField.Flags.Speak,
            PermissionsBitField.Flags.MoveMembers,
            PermissionsBitField.Flags.MuteMembers,
            PermissionsBitField.Flags.UseVAD,
            PermissionsBitField.Flags.Stream
          ]
        })),
        {
          id: newState.guild.roles.everyone.id,
          deny: [PermissionsBitField.Flags.ViewChannel]
        }
      ];

      let supportChannel;
      try {
        supportChannel = await newState.guild.channels.create({
          name: channelName,
          type: 2,
          parent: category,
          permissionOverwrites: permissions
        });
      } catch {
        return;
      }

      userChannelsMap.set(categoryKey, supportChannel.id);
      try { await member.voice.setChannel(supportChannel); } catch { }

      const timeoutId = setInterval(async () => {
        if (supportChannel.members.size === 0) {
          try { await supportChannel.delete(); } catch { }
          clearInterval(timeoutId);
          activeChannels.delete(supportChannel.id);

          for (const [userId, categoryMap] of userActiveSupportChannels) {
            for (const [catKey, chanId] of categoryMap) {
              if (chanId === supportChannel.id) {
                categoryMap.delete(catKey);
                if (categoryMap.size === 0) userActiveSupportChannels.delete(userId);
                break;
              }
            }
          }
        }
      }, 3000);

      activeChannels.set(supportChannel.id, timeoutId);

try {
  const notifyChannel = newState.guild.channels.cache.get(config.notifyChannelId);
  if (notifyChannel) {
    const prefixName = config.channelPrefix || categoryKey.charAt(0).toUpperCase() + categoryKey.slice(1);
    const title = `\`${prefixName} Notify\``;

    let color = config.notifyEmbedColor.startsWith('#') ? config.notifyEmbedColor : `#${config.notifyEmbedColor}`;

    const embed = new EmbedBuilder()
      .setTitle(title)
      .setDescription(`<@${member.id}> has entered the **${prefixName}**.`)
      .setColor(color);

    notifyChannel.send({ embeds: [embed] });
  }
} catch { }

    } catch { }
  });
};

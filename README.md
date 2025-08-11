## 🎙️ Discord Temporary Voice Channel Manager

**Discord Temporary Voice Channel Manager** is a powerful Node.js Discord bot designed to automate the creation, management, and cleanup of temporary voice channels. Ideal for communities looking to streamline private voice rooms for support, gaming, donations, and more, while keeping their server organized and free of clutter.

This bot supports multiple configurable categories, role-based permissions, cooldowns, notifications, and periodic cleanup for a smooth user and staff experience.

## ✨ Features

* [x] Dynamically create temporary voice channels when users join configured "waiting" voice channels.
* [x] Automatic deletion of empty temporary voice channels after a short delay.
* [x] Support for multiple independent categories (e.g., Support, Mafia, Donate) with separate configs.
* [x] User cooldown system to prevent spam and abuse of channel creation.
* [x] Role-based permission overwrites applied to each temporary channel.
* [x] Sends notification embeds to specified text channels when users enter temporary channels.
* [x] Periodic cleanup every 5 seconds to ensure no empty temporary channels linger.
* [x] Fully configurable through environment variables for flexibility.
* [x] Modular, maintainable codebase with error handling for Discord API interactions.
* [ ] Planned: Web dashboard for easier configuration, channel limits, multi-language support.

## ⚙️ How It Works

1. **Waiting Channels:**  
   Users join special "waiting" voice channels assigned per category. The bot detects this and creates a new private temporary voice channel with permissions granted to the user and designated staff roles.

2. **Cooldowns:**  
   Each user has a cooldown timer per category to avoid spamming channel creation. If the cooldown is active, the user is disconnected from the waiting channel.

3. **Active Channel Management:**  
   The bot tracks temporary voice channels per user and category, allowing users to rejoin existing empty channels or trigger new ones as appropriate.

4. **Automatic Cleanup:**  
   Temporary channels are deleted after being empty for a configurable short period, triggered both on voiceStateUpdate and periodic sweeps.

5. **Notifications:**  
   Notification embeds are sent to configured text channels alerting staff when users join or create temporary channels.

6. **Periodic Cleanup:**  
   Every 5 seconds, a cleanup job removes any empty temporary channels that might have been missed, maintaining server hygiene.

> [!WARNING]  
> This bot requires the **Manage Channels** and **Connect** permissions, along with access to the relevant voice and text channels it manages. Ensure the bot’s role is above any roles it needs to manage in the hierarchy.

> [!TIP]  
> Configure your `.env` file carefully with valid Discord IDs and tokens. Restart the bot after any changes for them to take effect.

## 🛠️ Installation & Setup

### Prerequisites

- Node.js v18 or higher
- A Discord bot with permissions: `Manage Channels`, `Connect`, `View Channels`, `Move Members`, `Mute Members`, `Speak`, and `Use Voice Activity`
- A Discord server with appropriate roles and channels configured

### Installation Steps

1. Clone this repository:

   ```bash
   git clone https://github.com/KaloudasDev/discord-temp-voice.git
   cd discord-temp-voice
````

2. Install dependencies:

   ```bash
   npm install
   ```

3. Create a `.env` file in the root directory based on the provided `.env.example` and fill in your bot token, guild ID, channel IDs, role IDs, cooldowns, and colors.

4. Start the bot:

   ```bash
   node index.js
   ```

## 🔎 Usage

* Have users join one of the configured **waiting voice channels**.
* The bot will create a new private temporary voice channel under the specified category.
* Staff roles configured will have permissions to moderate the channel.
* Temporary channels delete themselves once empty after a short timeout.
* Notifications are sent to specified text channels when users join temporary channels.

## ⚠️ Permissions & Role Setup

Ensure the bot has these permissions:

* **Guild-wide:**
  `View Channels`, `Manage Channels`, `Connect`, `Move Members`, `Mute Members`, `Speak`

* **Temporary voice channels:**
  Permission overwrites grant access to the channel owner and staff roles, deny everyone else.

* The bot’s role must be higher in the role hierarchy than roles it manages for permission overwrites to succeed.

## 📣 Contributing

Contributions, suggestions, and bug reports are welcome! Please:

* Fork the repo and create feature branches.
* Write clear commit messages.
* Open pull requests with detailed descriptions.
* Report issues in GitHub Issues.

## 📜 License

This project is licensed under the **MIT License**. See the [LICENSE](LICENSE) file for details.

## 👤 Author

Created by [YourName](https://github.com/KaloudasDev).

If you find this project useful, please ⭐ star the repository!

import { REST, Routes } from 'discord.js';
import 'dotenv/config';
import { data as leaderboardData } from './commands/utility/leaderboard.js';

async function deployCommands() {
  try {
    const applicationCommands = [
      leaderboardData.toJSON()
    ];
    console.log(`Started refreshing application (/) commands.`);

    await rest.put(
      Routes.applicationGuildCommands(process.env.clientId, process.env.guildId),
      { body: applicationCommands },
    );

    console.log(`Successfully reloaded application (/) commands.`);
  } catch (error) {
    console.error(error);
  }
}

const rest = new REST().setToken(process.env.token);

await deployCommands();

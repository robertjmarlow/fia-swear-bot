import { SlashCommandBuilder } from 'discord.js';

const allowedChannels = new Map([
  ["1331279251797970995", "zoomy zooms"],
  ["1342637090256589001", "test bot channel"]
]);

export const data = new SlashCommandBuilder()
  .setName('swearleaderboard')
  .setDescription('Outputs the current "leaderboard" from the FIA-swear-bot.');

export async function execute(interaction) {
  const channelName = allowedChannels.get(interaction.channelId);
  if (channelName != undefined) {
    await interaction.reply(`Leaderboard goes here`);
  }
}

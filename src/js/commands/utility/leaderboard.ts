import { ChatInputCommandInteraction, SlashCommandBuilder } from 'discord.js';
import { createClient } from 'redis';
import 'dotenv/config';
import { UserFine } from '../../obj/user-fine.js';
import { UserFines } from '../../obj/user-fines.js';
import { BadWordsCache } from '../../bad-words-cache.js';

const redisClient = await createClient({
  socket: {
    host: process.env.dbHost,
    port: parseInt(process.env.dbPort)
  }
})
.on('error', err => console.log('Redis Client Error', err))
.connect();

const allowedChannels = new Map([
  ["1331279251797970995", "zoomy zooms"],
  ["1342637090256589001", "test bot channel"]
]);

export const data = new SlashCommandBuilder()
  .setName('swearleaderboard')
  .setDescription('Outputs the current "leaderboard" from the FIA-swear-bot.');

export async function execute(interaction: ChatInputCommandInteraction) {
  const channelName = allowedChannels.get(interaction.channelId);
  if (channelName != undefined) {
    const userKeys: string[] = await redisClient.keys('users:*');
    const guildFines: UserFines[] = [];

    for (const userKey of userKeys) {
      const userFinesJson = await redisClient.get(userKey);
      if (userFinesJson !== null) {
        const userFinesArr: UserFine[] = [];
        const userFinesJsonObj = JSON.parse(userFinesJson);
        for (const userFine of userFinesJsonObj.fines) {
          userFinesArr.push(new UserFine(userFine.enforcedAt, userFine.enforcedFine, userFine.badWord));
        }
        const userFines = new UserFines(userKey.substring(6), userFinesArr);
        guildFines.push(userFines);
      }
    }

    let leaderboard = "";
    const badWords = await BadWordsCache.getBadWords();
    for (const userFines of guildFines) {
      const guildMember = await interaction.guild.members.fetch(userFines.getUserId());

      if (guildMember !== undefined) {
        leaderboard += `**${guildMember.displayName}** owes **€${userFines.getTotalFines(badWords)}** from **${userFines.getTotalFineCount()}** violations\n`;
      }
    }

    await interaction.reply(leaderboard);
  }
}

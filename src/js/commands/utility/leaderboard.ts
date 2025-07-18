import { ChatInputCommandInteraction, SlashCommandBuilder } from 'discord.js';
import { createClient } from 'redis';
import 'dotenv/config';
import { UserFine } from '../../obj/user-fine.js';
import { BadWordsCache } from '../../bad-words-cache.js';
import { UserFinesWithTotals } from '../../obj/user-fines-with-total.js';

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
    // the first call sometimes takes more than 3s.
    // discord fails the call if it takes more than 3s.
    // deferReply magically gives you 15m to respond.
    // isn't that neat?
    await interaction.deferReply();

    // grab the list of bad words to calculate total fines
    const badWords = await BadWordsCache.getBadWords();

    // totally prod ready--get all keys
    const userKeys: string[] = await redisClient.keys('users:*');

    // all fines for users in the guild
    const guildFines: UserFinesWithTotals[] = [];

    for (const userKey of userKeys) {
      const userFinesJson = await redisClient.get(userKey);
      if (userFinesJson !== null) {
        const userFinesArr: UserFine[] = [];
        const userFinesJsonObj = JSON.parse(userFinesJson);

        // convert each user fine json object into an actual UserFine object
        // there has to be a better way to do this
        for (const userFine of userFinesJsonObj.fines) {
          userFinesArr.push(new UserFine(userFine.enforcedAt, userFine.enforcedFine, userFine.badWord));
        }

        // take all the individual UserFine and put them into a UserFines
        const userFines = new UserFinesWithTotals(userKey.substring(6), userFinesArr, badWords);
        guildFines.push(userFines);
      }
    }

    // sort by "largest total fine descending"
    guildFines.sort((a, b) => {
      if (a.getTotalFines() > b.getTotalFines()) {
        return -1;
      } else if (a.getTotalFines() < b.getTotalFines()) {
        return 1;
      }
      return 0;
    });

    let leaderboard = "";

    // go through each UserFine for the guild and construct an individual fine line
    for (const userFines of guildFines) {
      const guildMember = await interaction.guild.members.fetch(userFines.getUserId());

      if (guildMember !== undefined) {
        leaderboard += `**${guildMember.displayName}** owes **€${userFines.getTotalFines().toLocaleString()}** from **${userFines.getTotalFineCount()}** violation${userFines.getTotalFineCount() > 1 ? 's' : ''}\n`;
      }
    }

    await interaction.editReply(leaderboard);
  }
}

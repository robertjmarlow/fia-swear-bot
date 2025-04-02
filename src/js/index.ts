import { Client, Collection, Events, GatewayIntentBits, MessageFlags, TextChannel } from 'discord.js';
import 'dotenv/config';
import axios from 'axios';
import { parse } from 'csv-parse/sync';
import winston from 'winston';
import { BadWord } from './obj/bad-word.js';
import { UserFines } from './obj/user-fines.js';
import { UserFine } from './obj/user-fine.js';
import { createClient } from 'redis';
import * as leaderboard from './commands/utility/leaderboard.js';

const redisClient = await createClient({
  socket: {
    host: process.env.dbHost,
    port: parseInt(process.env.dbPort)
  }
})
.on('error', err => console.log('Redis Client Error', err))
.connect();

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
  ],
});

const logger = winston.createLogger({
  level: 'info',
  transports: [
    new winston.transports.Console({
      format: winston.format.cli()
    }),
    new winston.transports.File({
      filename: 'logs/logs.log',
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.json()
      )
    }),
  ]
});

const wordSeparator = /\b(\w+)\b/g;

function getCommands() {
  const commands = new Collection();

  commands.set(leaderboard.data.name, leaderboard);

  return commands;
}

async function getBadWords(): Promise<Map<string, BadWord>> {
  const badWords: Map<string, BadWord> = new Map();

  try {
    logger.info(`Getting bad words from "${process.env.badWordList}".`);

    // get the bad word list csv
    const profanityCsvResponse = await axios.get(process.env.badWordList);
    if (profanityCsvResponse.status === 200) {
      const profanityCsv: string = profanityCsvResponse.data;

      logger.info(`Read [${profanityCsv.length}] characters of bad words csv.`);

      // turn the csv into an array of records
      const profanityRecords: any[] = parse(profanityCsv, {
        columns: true
      });

      logger.info(`Read [${profanityRecords.length}] bad words records.`);

      // turn the array of records into an array of BadWords
      for (let badWordIdx = 0; badWordIdx < profanityRecords.length; badWordIdx++) {
        const badWord: BadWord = BadWord.BadWordFactory(profanityRecords[badWordIdx]);

        if (badWord !== undefined) {
          badWords.set(badWord.getText(), badWord);
        } else {
          logger.warn(`I had a problem reading ${profanityRecords[badWordIdx]}.`);
        }
      }

      logger.info(`Added ${badWords.size} bad words.`);
    } else {
      logger.error(`Got a ${profanityCsvResponse.status} when reading bad words csv.`);
    }
  } catch (error) {
    logger.error(error);
  }

  return badWords;
}

client.commands = getCommands();
const badWords = await getBadWords();

// TODO put all these event handlers in their own files / directory?
client.once(Events.ClientReady, readyClient => {
  logger.info(`Ready! Logged in as ${readyClient.user.tag}`);
});

client.on(Events.MessageCreate, async message => {
  // ignore bot-generated message
  // it'll probably end up in end endless loop otherwise
  if (message.author.bot) {
    logger.info("Ignoring bot-generated message.");
    return;
  }

  // ignore anything that's not from a text channel
  // not necessary to do anything else with the message
  if (!(client.channels.cache.get(message.channelId) instanceof TextChannel)) {
    logger.info("Ignoring message from non-text channel.");
    return;
  }

  const textChannel = client.channels.cache.get(message.channelId) as TextChannel;

  // ignore "empty messages", e.g. from image replies
  // not necessary to do anything else with the message
  if (message.content.trim().length === 0) {
    logger.info(`Ignoring empty message from user ${message.author.globalName} in channel "${textChannel.name}".`);
    return;
  }

  // swear bot only in zoomy zooms
  if (message.channelId === "1331279251797970995") {
    logger.info(`user ${message.author.globalName} said "${message.content}" in channel "${textChannel.name}".`);

    const badWordsInMessage: BadWord[] = [];
    const messageWords: string[] = message.content.toLowerCase().match(wordSeparator);

    // match() will return null if no matches are found, e.g. a message is just emojis
    if (messageWords === null) {
      logger.info(`No word matches found for message from ${message.author.globalName} in channel "${textChannel.name}".`);
      return;
    }

    // go through every word in the message looking for bad words
    for (const messageWord of messageWords) {
      const badWord: BadWord = badWords.get(messageWord);

      if (badWord !== undefined) {
        badWordsInMessage.push(badWord);
      }
    }

    // did the message have a bad word?
    if (badWordsInMessage.length > 0) {
      // construct a user-readable list of bad words
      const badWordsStr = badWordsInMessage.map((badWordInMessage) => `"${badWordInMessage.getText()}"`).join(", ");
      logger.info(`user ${message.author.globalName} said ${badWordsInMessage.length} bad word(s) in channel "${textChannel.name}": [${badWordsInMessage}], [${badWordsStr}].`);

      // construct a fine
      const totalFine: number = badWordsInMessage.reduce((totalFine, nextBadWord) => totalFine + (nextBadWord.getSeverity() * Number(process.env.badWordMultiplier)), 0)

      // let the user know they've been fined
      const messageStr = `user **${message.author.globalName}** has been fined **€${totalFine.toLocaleString()}** for using the following words: ${badWordsStr}.`;

      // save to db
      const userIdStr = `users:${message.author.id}`;
      const userFinesJson = await redisClient.get(userIdStr);
      let userFines: UserFines;
      if (userFinesJson !== null) {
        // add to the existing collection
        const userFinesArr: UserFine[] = [];
        const userFinesJsonObj = JSON.parse(userFinesJson);
        for (const userFine of userFinesJsonObj.fines) {
          userFinesArr.push(new UserFine(userFine.enforcedAt, userFine.enforcedFine, userFine.badWord));
        }
        userFines = new UserFines(userIdStr, userFinesArr);
      } else {
        // create a new collection for the user
        userFines = new UserFines(userIdStr, []);
      }

      // commit the fines to db
      for (const badWordInMessage of badWordsInMessage) {
        userFines.addFine(new UserFine(new Date(), badWordInMessage.getSeverity() * Number(process.env.badWordMultiplier), badWordInMessage.getText()));
      }
      await redisClient.set(userIdStr, JSON.stringify(userFines));

      logger.info(JSON.stringify(userFines));
      logger.info(messageStr);
      textChannel.send(messageStr);
    }
  }
});

client.on(Events.InteractionCreate, async interaction => {
  if (!interaction.isChatInputCommand()) return;

  logger.info(`user ${interaction.user.globalName} used "/${interaction.commandName}" in channel [${interaction.channelId}].`);

  const command = interaction.client.commands.get(interaction.commandName);

  if (!command) {
    logger.warn(`No command matching ${interaction.commandName} was found.`);
    return;
  }

  try {
    await command.execute(interaction);
  } catch (error) {
    logger.error(error);
    if (interaction.replied || interaction.deferred) {
      await interaction.followUp({ content: 'There was an error while executing this command!', flags: MessageFlags.Ephemeral });
    } else {
      await interaction.reply({ content: 'There was an error while executing this command!', flags: MessageFlags.Ephemeral });
    }
  }
});

client.login(process.env.token);

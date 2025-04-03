import { BadWord } from './obj/bad-word.js';
import winston from 'winston';
import { parse } from 'csv-parse/sync';
import axios from 'axios';

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

export class BadWordsCache {
  private static badWords: Map<string, BadWord>;

  public static async getBadWords(): Promise<Map<string, BadWord>> {
    if (this.badWords === undefined) {
      try {
        this.badWords = new Map();
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
              this.badWords.set(badWord.getText(), badWord);
            } else {
              logger.warn(`I had a problem reading ${profanityRecords[badWordIdx]}.`);
            }
          }
    
          logger.info(`Added ${this.badWords.size} bad words.`);
        } else {
          logger.error(`Got a ${profanityCsvResponse.status} when reading bad words csv.`);
        }
      } catch (error) {
        logger.error(error);
      }
    }
    return this.badWords;
  }
}

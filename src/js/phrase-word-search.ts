import winston from 'winston';
import { BadWord } from './obj/bad-word.js';
import WordSearch from './word-search'

export class PhraseWordSearch implements WordSearch {
  private wordSeparator = /\b(\w+)\b/g;
  private logger: winston.Logger;

  constructor(badWords: Map<string, BadWord>) {
    this.logger = winston.createLogger({
      level: 'info',
      transports: [
        new winston.transports.Console({
          format: winston.format.cli()
        })]
    });
  }

  public search(badWordSearch: string): BadWord[] {
    const badWordsSearchResult: BadWord[] = [];

    return badWordsSearchResult;
  }
}

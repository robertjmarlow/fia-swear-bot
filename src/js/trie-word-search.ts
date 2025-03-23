import TrieSearch from 'trie-search';
import winston from 'winston';
import { BadWord } from './obj/bad-word.js';
import WordSearch from './word-search'

export class TrieWordSearch implements WordSearch {
  private wordSeparator = /\b(\w+)\b/g;
  // private badWordsMap: Map<string, BadWord>;
  private badWordsTrie: TrieSearch<BadWord>;
  private logger: winston.Logger;

  constructor(badWords: Map<string, BadWord>) {
    // this.badWordsMap = badWords;
    this.logger = winston.createLogger({
      level: 'info',
      transports: [
        new winston.transports.Console({
          format: winston.format.cli()
        })]
    });

    this.badWordsTrie = new TrieSearch<BadWord>("text", {
      ignoreCase: true,
      splitOnRegEx: false
    });

    badWords.forEach(badWordEntry => this.badWordsTrie.add(badWordEntry));
  }

  public search(badWordSearch: string): BadWord[] {
    const badWordsSearchResult: BadWord[] = [];

    const wordSearchWords: string[] = badWordSearch.toLowerCase().match(this.wordSeparator);

    // match() will return null if no matches are found, e.g. a badWordSearch is just emojis
    if (wordSearchWords !== null) {
      let wordSearchBeginIdx = 0;
      let wordSearchEndIdx = 1;

      while (wordSearchBeginIdx < wordSearchEndIdx &&
             wordSearchBeginIdx < wordSearchWords.length
      ) {
        const phraseSearch = wordSearchWords.slice(wordSearchBeginIdx, wordSearchEndIdx).join(" ");
        const foundBadWords = this.badWordsTrie.search(phraseSearch);

        if (foundBadWords.length === 0) {
          // nothing found, move to the next word
          wordSearchBeginIdx++;
          wordSearchEndIdx = wordSearchBeginIdx + 1;
        } else {
          // found a least one bad word / phrase
          // trie will return multiple results for a search string, so check for exact matches
          let exactMatchFound = false;
          for (const foundBadWord of foundBadWords) {
            if (foundBadWord.getText() === phraseSearch) {
              // found an exact match, head to the next word / phrase
              badWordsSearchResult.push(foundBadWord);
              exactMatchFound = true;
              break;
            }
          }
          if (exactMatchFound) {
            wordSearchBeginIdx = wordSearchEndIdx;
            wordSearchEndIdx = wordSearchBeginIdx + 1;
          } else {
            wordSearchEndIdx++;
          }
        }
      }
    }

    this.logger.info(`${badWordSearch} => ${badWordsSearchResult.map(badWord => badWord.getText())}`);

    return badWordsSearchResult;
  }
}

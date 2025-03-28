import { describe, expect, test, beforeAll } from '@jest/globals';
import { BadWord, BadWordSeverity } from '../../src/js/obj/bad-word';
import { PhraseWordSearch } from '../../src/js/phrase-word-search';
import WordSearch from '../../src/js/word-search';

describe("Trie WordSearch", () => {
  let wordSearch: WordSearch;

  beforeAll(() => {
    const badWords: Map<string, BadWord> = new Map();
    [
      "foo",
      "bar",
      "baz",
      "foo bar",
      "lorem",
      "lorem ipsum",
      "lorem ipsum dolor",
      "dolor sit amet",
      "sit amet",
      "amet",
    ].forEach(badWord => badWords.set(badWord, new BadWord(badWord, [], [], 1.0, BadWordSeverity.Mild)));
    wordSearch = new PhraseWordSearch(badWords);
  });

  test("finds 'bar'", () => {
    const searchResults: BadWord[] = wordSearch.search("bar");
    expect(searchResults.length).toBe(1);
    expect(searchResults[0].getText()).toBe("bar");
  });

  test("finds one 'foo'", () => {
    const searchResults: BadWord[] = wordSearch.search("foo");
    expect(searchResults.length).toBe(1);
    expect(searchResults[0].getText()).toBe("foo");
  });

  test("finds one 'foo bar'", () => {
    const searchResults: BadWord[] = wordSearch.search("foo bar");
    expect(searchResults.length).toBe(1);
    expect(searchResults[0].getText()).toBe("foo bar");
  });

  test("doesn't find any 'biz'", () => {
    const searchResults: BadWord[] = wordSearch.search("biz");
    expect(searchResults.length).toBe(0);
  });

  test("doesn't find any phrases in search strings of just emoji", () => {
    const searchResults: BadWord[] = wordSearch.search("💀");
    expect(searchResults.length).toBe(0);
  });

  test("finds single words in search strings", () => {
    const searchResults: BadWord[] = wordSearch.search("i had a whole amet yesterday");
    expect(searchResults.length).toBe(1);
    expect(searchResults[0].getText()).toBe("amet");
  });

  test("finds multiple single words in search strings", () => {
    const searchResults: BadWord[] = wordSearch.search("i had a whole foo and amet yesterday");
    expect(searchResults.length).toBe(2);
    expect(searchResults[0].getText()).toBe("foo");
    expect(searchResults[1].getText()).toBe("amet");
  });

  test("finds phrases in search strings", () => {
    const searchResults: BadWord[] = wordSearch.search("i had a whole sit amet yesterday");
    expect(searchResults.length).toBe(1);
    expect(searchResults[0].getText()).toBe("sit amet");
  });

  test("finds multiple phrases in search strings", () => {
    const searchResults: BadWord[] = wordSearch.search("i had a whole foo bar and sit amet yesterday");
    expect(searchResults.length).toBe(2);
    expect(searchResults[0].getText()).toBe("foo bar");
    expect(searchResults[1].getText()).toBe("sit amet");
  });

  test("finds multiple words and phrases right next to each other in search strings", () => {
    const searchResults: BadWord[] = wordSearch.search("i had a whole foo bar lorem sit amet yesterday");
    expect(searchResults.length).toBe(3);
    expect(searchResults[0].getText()).toBe("foo bar");
    expect(searchResults[1].getText()).toBe("lorem");
    expect(searchResults[2].getText()).toBe("sit amet");
  });
});

import { BadWord } from '../../src/js/obj/bad-word';

export default interface WordSearch {
  search(badWordSearch: string): BadWord[];
}

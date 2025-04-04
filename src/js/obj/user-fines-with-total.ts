import { UserFines } from "./user-fines.js";
import { UserFine } from "./user-fine.js";
import { BadWord } from './bad-word.js';

export class UserFinesWithTotals extends UserFines {
  private totalFines: number;

  /**
   *
   * @param userId The snowflake id of the user.
   * @param fines All UserFine for this user.
   * @param badwords Bad words map.
   */
  constructor(userId: string, fines: UserFine[], badwords: Map<string, BadWord>) {
    super(userId, fines);

    this.totalFines = fines.reduce((totalFine, nextFine) => {
      const badword: BadWord = badwords.get(nextFine.getBadWord());

      if (badword !== undefined) {
        totalFine += badword.getSeverity() * Number(process.env.badWordMultiplier);
      }

      return totalFine;
    }, 0);
  }

  public getTotalFines(): number {
    return this.totalFines;
  }
}

import { UserFine } from "./user-fine.js";
import { BadWord } from './bad-word.js';

export class UserFines {
  private userId: string;
  private fines: UserFine[];

  constructor(userId: string, fines: UserFine[]) {
    this.userId = userId;
    this.fines = fines;
  }

  public getTotalFines(badwords: Map<string, BadWord> ): number {
    return this.fines.reduce((totalFine, nextFine) => {
      const badword: BadWord = badwords.get(nextFine.getBadWord());

      if (badword !== undefined) {
        totalFine += badword.getSeverity() * Number(process.env.badWordMultiplier);
      }

      return totalFine;
    }, 0);
  }

  public getTotalFineCount(): number {
    return this.fines.length;
  }

  public addFine(fine: UserFine) {
    this.fines.push(fine);
  }

  public getUserId(): string {
    return this.userId;
  }

  public toString(): string {
    return `userId:${this.userId} fines:[${this.fines}]`;
  }
}

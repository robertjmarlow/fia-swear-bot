import { UserFine } from "./user-fine.js";

export class UserFines {
  private userId: string;
  private fines: UserFine[];

  /**
   * @param userId The snowflake id of the user.
   * @param fines All UserFine for this user.
   */
  constructor(userId: string, fines: UserFine[]) {
    this.userId = userId;
    this.fines = fines;
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

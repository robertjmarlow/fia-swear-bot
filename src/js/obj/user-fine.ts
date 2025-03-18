export class UserFine {
  private enforcedAt: Date;
  private enforcedFine: number;
  private badWord: string;

  constructor(enforcedAt: Date, enforcedFine: number, badWord: string) {
    this.enforcedAt = enforcedAt;
    this.enforcedFine = enforcedFine;
    this.badWord = badWord;
  }

  public getEnforcedAt(): Date {
    return this.enforcedAt;
  }

  public getEnforcedFine(): number {
    return this.enforcedFine;
  }

  public getBadWord(): string {
    return this.badWord;
  }

  public toString(): string {
    return `enforcedAt:[${this.enforcedAt}] enforcedFine:${this.enforcedFine} badWord:"${this.badWord}"`;
  }
}

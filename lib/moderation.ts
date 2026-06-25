import { Filter } from "bad-words";

const filter = new Filter();

export function containsBannedWords(text: string): boolean {
  return filter.isProfane(text);
}

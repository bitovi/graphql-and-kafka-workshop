// In-memory data store. Resets every time the server restarts.

export type Genre = "FANTASY" | "SCIENCE_FICTION" | "MYSTERY" | "NONFICTION";

export interface Author {
  id: string;
  name: string;
}

export interface Book {
  id: string;
  title: string;
  year?: number;
  genre: Genre;
  authorId: string;
  readingDifficulty: "EASY" | "MEDIUM" | "HARD";
}

export interface Comic extends Book {
  inColor: boolean
}

export const authors: Author[] = [
  { id: "a1", name: "Ursula K. Le Guin" },
  { id: "a2", name: "Agatha Christie" },
  { id: "a3", name: "Octavia E. Butler" },
];

export const books: Book[] = [
  { id: "b1", title: "A Wizard of Earthsea", year: 1968, genre: "FANTASY", authorId: "a1", readingDifficulty: "MEDIUM" },
  { id: "b2", title: "The Left Hand of Darkness", year: 1969, genre: "SCIENCE_FICTION", authorId: "a1", readingDifficulty: "HARD" },
  { id: "b3", title: "Murder on the Orient Express", year: 1934, genre: "MYSTERY", authorId: "a2", readingDifficulty: "EASY" },
  { id: "b4", title: "Kindred", year: 1979, genre: "SCIENCE_FICTION", authorId: "a3", readingDifficulty: "MEDIUM" },
];

export const comics: Comic[] = [
  { id: "c1", title: "X-Men", year: 1963, genre: "FANTASY", authorId: "a1", inColor: true, readingDifficulty: "MEDIUM" },
  { id: "c2", title: "Spider-Man", year: 1962, genre: "FANTASY", authorId: "a1", inColor: false, readingDifficulty: "EASY" },
  { id: "c3", title: "Batman", year: 1939, genre: "FANTASY", authorId: "a1", inColor: false, readingDifficulty: "HARD" },
];
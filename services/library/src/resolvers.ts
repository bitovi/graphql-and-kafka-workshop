import { GraphQLError } from "graphql";
import { authors, books, comics, type Book, type Author, type Genre, type Comic } from "./data.js";

export const resolvers = {
  Query: {
    books: (_: unknown, args: { genre?: Genre }) =>
      args.genre ? books.filter((b) => b.genre === args.genre) : books,
    book: (_: unknown, args: { id: string }) => books.find((b) => b.id === args.id),
    authors: () => authors,
    author: (_: unknown, args: { id: string }) => authors.find((a) => a.id === args.id),
    comic: (_: unknown, args: { id: string }) => comics.find((c) => c.id === args.id),
  },

  Mutation: {
    addBook: (_: unknown, { input }: { input: Omit<Book, "id"> }) => {
      if (!authors.some((a) => a.id === input.authorId)) {
        throw new GraphQLError(`Author ${input.authorId} not found`, {
          extensions: { code: "BAD_USER_INPUT" },
        });
      }
      const book = { id: `b${books.length + 1}`, ...input };
      books.push(book);
      return book;
    },
  },

  // Field resolvers: GraphQL calls these only when a query asks for the field.
  Book: {
    author: (book: Book) => authors.find((a) => a.id === book.authorId),
  },
  Author: {
    books: (author: Author) => books.filter((b) => b.authorId === author.id),
  },
  Comic: {
    comics: (comic: Comic) => comics.filter((c) => c.authorId === comic.authorId)
  }
};

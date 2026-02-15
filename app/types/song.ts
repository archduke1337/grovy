import { z } from "zod";

export const SongSchema = z.object({
  id: z.string(),
  title: z.string(),
  url: z.string(),
  artist: z.string().optional().default("Unknown Artist"),
  cover: z.string().optional(),
  genre: z.string().optional().default("Unknown"),
  duration: z.number().optional(),
});

export type Song = z.infer<typeof SongSchema>;

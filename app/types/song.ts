import { z } from "zod";

export const SongSchema = z.object({
  id: z.string().min(1),
  title: z.string().min(1),
  url: z.string().min(1),
  artist: z.string().optional().default("Unknown Artist"),
  cover: z.string().optional(),
  genre: z.string().optional().default("Unknown"),
  duration: z.number().optional(),
  source: z.string().optional(),
});

export type Song = z.infer<typeof SongSchema>;

/** A saved playlist. Songs inside are validated on read (see localStore). */
export const PlaylistSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  songs: z.array(SongSchema),
  createdAt: z.number(),
  cover: z.string().optional(),
});

export interface Playlist extends z.infer<typeof PlaylistSchema> {}

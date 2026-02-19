/**
 * Unit tests for the API client layer.
 * Run with: npx vitest run __tests__/api.test.ts
 *
 * Install: npm i -D vitest
 */

import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock fetch globally
const mockFetch = vi.fn();
vi.stubGlobal("fetch", mockFetch);

// Mock offlineCache to avoid IndexedDB in API tests
vi.mock("../app/lib/offlineCache", () => ({
  cacheSongs: vi.fn().mockResolvedValue(undefined),
  cacheSearchResults: vi.fn().mockResolvedValue(undefined),
  getCachedSearch: vi.fn().mockResolvedValue(null),
}));

// Import after mocks are set up
import { searchSongs, search, getLyrics, getArtistInfo } from "../app/lib/api";

function jsonResponse(data: any, status = 200) {
  return {
    ok: status >= 200 && status < 300,
    status,
    statusText: status === 200 ? "OK" : "Error",
    json: () => Promise.resolve(data),
  };
}

describe("API client", () => {
  beforeEach(() => {
    mockFetch.mockReset();
  });

  describe("searchSongs", () => {
    it("should call /api/songs with query params", async () => {
      const songs = [{ id: "1", title: "Test", url: "/test.mp3" }];
      mockFetch.mockResolvedValueOnce(jsonResponse(songs));

      const result = await searchSongs("hello", "YouTube");
      expect(result).toEqual(songs);
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining("/api/songs?"),
        expect.any(Object)
      );
      const calledUrl = mockFetch.mock.calls[0][0] as string;
      expect(calledUrl).toContain("source=YouTube");
      expect(calledUrl).toContain("query=hello");
    });

    it("should throw on non-ok response", async () => {
      mockFetch.mockResolvedValueOnce(jsonResponse({}, 500));
      await expect(searchSongs("fail")).rejects.toThrow();
    });
  });

  describe("search", () => {
    it("should call /api/search with type and query", async () => {
      const results = [{ id: "s1", name: "Song 1" }];
      mockFetch.mockResolvedValueOnce(jsonResponse(results));

      const result = await search("test query", "song");
      expect(result).toEqual(results);
      const calledUrl = mockFetch.mock.calls[0][0] as string;
      expect(calledUrl).toContain("type=song");
      expect(calledUrl).toContain("query=test%20query");
    });
  });

  describe("getLyrics", () => {
    it("should call /api/lyrics with title and artist", async () => {
      const lyrics = { lyrics: [{ text: "Hello", time: 0 }] };
      mockFetch.mockResolvedValueOnce(jsonResponse(lyrics));

      const result = await getLyrics("My Song", "Artist");
      expect(result).toEqual(lyrics);
      const calledUrl = mockFetch.mock.calls[0][0] as string;
      expect(calledUrl).toContain("title=My%20Song");
      expect(calledUrl).toContain("artist=Artist");
    });
  });

  describe("getArtistInfo", () => {
    it("should call /api/artist/info", async () => {
      const info = { name: "Artist", bio: "Bio" };
      mockFetch.mockResolvedValueOnce(jsonResponse(info));

      const result = await getArtistInfo("Artist");
      expect(result).toEqual(info);
    });
  });
});

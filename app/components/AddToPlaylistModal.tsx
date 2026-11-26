"use client";

import React, { useState } from "react";
import { Button, Modal } from "@heroui/react";
import { Music, Plus, Check } from "lucide-react";
import Image from "next/image";

import { usePlayer } from "@/app/context/PlayerContext";
import { getHDThumbnail } from "@/app/lib/thumbnail";

/**
 * Add-to-playlist sheet.
 *
 * Controlled through `PlayerContext` so any song menu can open it, which is why
 * the open state lives there rather than in a `Modal.Trigger`. The body is a
 * HeroUI `Modal` for focus trapping, escape handling and scroll locking.
 */
export const AddToPlaylistModal: React.FC = () => {
  const {
    isPlaylistModalOpen,
    closePlaylistModal,
    playlists,
    createPlaylist,
    addToPlaylist,
    playlistModalSong,
  } = usePlayer();

  const [newPlaylistName, setNewPlaylistName] = useState("");

  const handleCreate = () => {
    const name = newPlaylistName.trim();
    if (!name) return;

    const id = createPlaylist(name);
    if (playlistModalSong) addToPlaylist(id, playlistModalSong);

    setNewPlaylistName("");
    closePlaylistModal();
  };

  return (
    <Modal isOpen={isPlaylistModalOpen} onOpenChange={(open) => !open && closePlaylistModal()}>
      <Modal.Container placement="bottom" scroll="inside">
        <Modal.Dialog>
          <Modal.Header>
            <Modal.Heading>
              {playlistModalSong ? "Add to playlist" : "Your playlists"}
            </Modal.Heading>
            <Modal.CloseTrigger />
          </Modal.Header>

          <Modal.Body className="space-y-5">
            {playlistModalSong ? (
              <div className="flex items-center gap-4 rounded-2xl bg-default/40 p-3">
                <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-xl bg-default">
                  {playlistModalSong.cover ? (
                    <Image
                      src={getHDThumbnail(playlistModalSong.cover) || playlistModalSong.cover}
                      alt={playlistModalSong.title}
                      width={60}
                      height={60}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center">
                      <Music size={20} className="text-muted" />
                    </div>
                  )}
                </div>
                <div className="min-w-0">
                  <h3 className="truncate font-semibold text-foreground">
                    {playlistModalSong.title}
                  </h3>
                  <p className="truncate text-xs text-muted">{playlistModalSong.artist}</p>
                </div>
              </div>
            ) : null}

            <form
              className="flex gap-2"
              onSubmit={(event) => {
                event.preventDefault();
                handleCreate();
              }}
            >
              <input
                type="text"
                placeholder="New playlist name"
                value={newPlaylistName}
                onChange={(event) => setNewPlaylistName(event.target.value)}
                aria-label="New playlist name"
                className="min-w-0 flex-1 rounded-xl bg-default/40 px-4 py-2.5 text-sm font-medium text-foreground outline-none placeholder:text-muted focus-visible:ring-2 focus-visible:ring-focus"
              />
              <Button type="submit" variant="primary" isDisabled={!newPlaylistName.trim()}>
                <Plus size={16} />
                Create
              </Button>
            </form>

            <div className="space-y-1">
              {playlists.length === 0 ? (
                <p className="px-1 py-6 text-center text-sm text-muted">
                  No playlists yet — name one above to get started.
                </p>
              ) : (
                playlists.map((playlist) => {
                  const alreadyIn = playlist.songs.some(
                    (song) => song.id === playlistModalSong?.id
                  );

                  return (
                    <button
                      key={playlist.id}
                      type="button"
                      onClick={() => {
                        if (playlistModalSong) addToPlaylist(playlist.id, playlistModalSong);
                        closePlaylistModal();
                      }}
                      disabled={alreadyIn}
                      className="flex w-full items-center justify-between gap-4 rounded-2xl p-3 text-left transition-colors hover:bg-default/50 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      <span className="flex min-w-0 items-center gap-3">
                        <span className="relative flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-default">
                          {playlist.songs[0]?.cover ? (
                            <Image
                              src={
                                getHDThumbnail(playlist.songs[0].cover) ||
                                playlist.songs[0].cover
                              }
                              alt={playlist.name}
                              width={44}
                              height={44}
                              className="h-full w-full object-cover"
                              loading="lazy"
                            />
                          ) : (
                            <Music size={18} className="text-muted" />
                          )}
                        </span>
                        <span className="min-w-0">
                          <span className="block truncate text-sm font-semibold text-foreground">
                            {playlist.name}
                          </span>
                          <span className="block text-[11px] font-medium text-muted">
                            {playlist.songs.length} track
                            {playlist.songs.length === 1 ? "" : "s"}
                          </span>
                        </span>
                      </span>

                      {alreadyIn ? (
                        <span className="flex shrink-0 items-center gap-1 rounded-full bg-success/10 px-2 py-1 text-success">
                          <Check size={14} strokeWidth={3} />
                          <span className="text-[10px] font-bold uppercase tracking-wide">
                            Added
                          </span>
                        </span>
                      ) : null}
                    </button>
                  );
                })
              )}
            </div>
          </Modal.Body>
        </Modal.Dialog>
      </Modal.Container>
    </Modal>
  );
};

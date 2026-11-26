"use client";

import React, { useEffect, useState } from "react";
import { Button, Modal, Tooltip } from "@heroui/react";
import { Moon, Timer } from "lucide-react";

interface SleepTimerProps {
  isOpen: boolean;
  onClose: () => void;
  sleepMinutes: number | null;
  sleepEndTime: number | null;
  onSetTimer: (minutes: number | null) => void;
}

const PRESETS = [
  { label: "15 min", value: 15 },
  { label: "30 min", value: 30 },
  { label: "45 min", value: 45 },
  { label: "1 hour", value: 60 },
  { label: "1.5 hours", value: 90 },
  { label: "2 hours", value: 120 },
];

/**
 * Shared countdown formatting for the timer button and the dialog.
 *
 * Both used to run their own near-identical `setInterval`, which meant two
 * timers ticking for the same deadline. One hook keeps them in step and only
 * runs while a deadline exists.
 */
function useCountdown(endTime: number | null): string {
  const [remaining, setRemaining] = useState("");

  useEffect(() => {
    if (!endTime) return;

    const read = () => {
      const diff = endTime - Date.now();
      if (diff <= 0) return "";
      const minutes = Math.floor(diff / 60_000);
      const seconds = Math.floor((diff % 60_000) / 1000);
      return minutes > 0 ? `${minutes}m ${seconds}s` : `${seconds}s`;
    };

    // The first value is computed here rather than in a separate setState
    // pass, so the label is correct on the very first paint after opening.
    const initial = read();
    queueMicrotask(() => setRemaining(initial));
    if (!initial) return;

    const interval = setInterval(() => {
      const next = read();
      setRemaining(next);
      if (!next) clearInterval(interval);
    }, 1000);

    return () => clearInterval(interval);
  }, [endTime]);

  // A cleared deadline hides the label immediately, without an effect.
  return endTime ? remaining : "";
}

export const SleepTimerModal: React.FC<SleepTimerProps> = ({
  isOpen,
  onClose,
  sleepMinutes,
  sleepEndTime,
  onSetTimer,
}) => {
  const remaining = useCountdown(isOpen ? sleepEndTime : null);

  return (
    <Modal isOpen={isOpen} onOpenChange={(open) => !open && onClose()}>
      <Modal.Container placement="center">
        <Modal.Dialog>
          <Modal.Header>
            <Modal.Heading className="flex items-center gap-2">
              <Moon size={18} className="text-primary" aria-hidden="true" />
              Sleep timer
            </Modal.Heading>
            <Modal.CloseTrigger />
          </Modal.Header>

          <Modal.Body className="space-y-5">
            {sleepMinutes ? (
              <div className="rounded-2xl border border-primary/20 bg-primary/10 p-4 text-center">
                <p className="text-sm font-semibold text-primary">Timer active</p>
                <p className="mt-1 text-xs text-muted">
                  {remaining
                    ? `Playback pauses in ${remaining}`
                    : `Playback pauses in ${sleepMinutes} min`}
                </p>
              </div>
            ) : null}

            <div className="grid grid-cols-2 gap-2">
              {PRESETS.map(({ label, value }) => (
                <Button
                  key={value}
                  variant={sleepMinutes === value ? "primary" : "secondary"}
                  onPress={() => {
                    onSetTimer(value);
                    onClose();
                  }}
                >
                  {label}
                </Button>
              ))}
            </div>

            {sleepMinutes ? (
              <Button
                variant="danger-soft"
                fullWidth
                onPress={() => {
                  onSetTimer(null);
                  onClose();
                }}
              >
                Cancel timer
              </Button>
            ) : null}
          </Modal.Body>
        </Modal.Dialog>
      </Modal.Container>
    </Modal>
  );
};

export const SleepTimerButton: React.FC<{
  sleepMinutes: number | null;
  sleepEndTime: number | null;
  onClick: () => void;
}> = ({ sleepMinutes, sleepEndTime, onClick }) => {
  const remaining = useCountdown(sleepEndTime);

  return (
    <Tooltip>
      <Tooltip.Trigger>
        <Button
          isIconOnly
          size="sm"
          variant="ghost"
          onPress={onClick}
          aria-label={
            sleepMinutes
              ? `Sleep timer active${remaining ? `, ${remaining} left` : ""}`
              : "Set sleep timer"
          }
          className={`relative ${
            sleepMinutes
              ? "bg-primary/10 text-primary"
              : "text-white/50 hover:text-white"
          }`}
        >
          <Timer size={18} />
          {sleepMinutes ? (
            <span
              aria-hidden="true"
              className="absolute -right-0.5 -top-0.5 h-2 w-2 animate-pulse rounded-full bg-primary"
            />
          ) : null}
        </Button>
      </Tooltip.Trigger>
      <Tooltip.Content>
        {sleepMinutes
          ? remaining
            ? `Pausing in ${remaining}`
            : "Sleep timer active"
          : "Sleep timer"}
      </Tooltip.Content>
    </Tooltip>
  );
};

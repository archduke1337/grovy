"use client";

import { useState } from "react";
import { AlertDialog, Button } from "@heroui/react";

type ConfirmDialogProps = {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  title: string;
  description?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  isDanger?: boolean;
  onConfirm: () => void;
};

/**
 * Accessible replacement for `window.confirm`.
 *
 * `window.confirm` blocks the main thread, cannot be styled, and is suppressed
 * in some embedded browsers — which silently turned "delete playlist" into a
 * no-op. This keeps the same yes/no contract with a real dialog.
 */
export function ConfirmDialog({
  isOpen,
  onOpenChange,
  title,
  description,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  isDanger = false,
  onConfirm,
}: ConfirmDialogProps) {
  return (
    <AlertDialog isOpen={isOpen} onOpenChange={onOpenChange}>
      <AlertDialog.Container placement="center">
        <AlertDialog.Dialog>
          <AlertDialog.Header>
            <AlertDialog.Heading>{title}</AlertDialog.Heading>
          </AlertDialog.Header>
          {description ? (
            <AlertDialog.Body>{description}</AlertDialog.Body>
          ) : null}
          <AlertDialog.Footer>
            <Button variant="tertiary" onPress={() => onOpenChange(false)}>
              {cancelLabel}
            </Button>
            <Button
              variant={isDanger ? "danger" : "primary"}
              onPress={() => {
                onConfirm();
                onOpenChange(false);
              }}
            >
              {confirmLabel}
            </Button>
          </AlertDialog.Footer>
        </AlertDialog.Dialog>
      </AlertDialog.Container>
    </AlertDialog>
  );
}

/** Convenience state for a single confirm action on a page. */
export function useConfirm() {
  const [isOpen, setIsOpen] = useState(false);

  return {
    isOpen,
    open: () => setIsOpen(true),
    onOpenChange: setIsOpen,
  };
}

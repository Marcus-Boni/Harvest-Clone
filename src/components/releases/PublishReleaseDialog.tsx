"use client";

import { Loader2, Send, X } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";

export interface PublishReleaseDialogProps {
  open: boolean;
  versionTag: string;
  onConfirm: (notifyUsers: boolean) => Promise<void>;
  onClose: () => void;
}

export default function PublishReleaseDialog({
  open,
  versionTag,
  onConfirm,
  onClose,
}: PublishReleaseDialogProps) {
  const [notifyUsers, setNotifyUsers] = useState(true);
  const [isPublishing, setIsPublishing] = useState(false);

  async function handleConfirm() {
    setIsPublishing(true);
    try {
      await onConfirm(notifyUsers);
      toast.success(
        notifyUsers
          ? `Release ${versionTag} publicada! Notificações enviadas.`
          : `Release ${versionTag} publicada com sucesso!`,
      );
      onClose();
    } catch (err: unknown) {
      console.error("[PublishReleaseDialog] handleConfirm:", err);
      toast.error(
        err instanceof Error ? err.message : "Erro ao publicar release",
      );
    } finally {
      setIsPublishing(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Publicar {versionTag}</DialogTitle>
          <DialogDescription>
            Ao publicar, esta release ficará visível para todos os usuários no
            changelog. Esta ação não pode ser desfeita.
          </DialogDescription>
        </DialogHeader>

        <div className="my-2 flex items-center justify-between rounded-xl border border-border/50 bg-muted/30 px-4 py-3">
          <div>
            <Label
              htmlFor="notify-users-switch"
              className="text-sm font-medium"
            >
              Notificar usuários
            </Label>
            <p className="mt-0.5 text-xs text-muted-foreground">
              Envia e-mail com as release notes para todos os usuários ativos
            </p>
          </div>
          <Switch
            id="notify-users-switch"
            checked={notifyUsers}
            onCheckedChange={setNotifyUsers}
            disabled={isPublishing}
            aria-label="Notificar usuários por e-mail ao publicar"
          />
        </div>

        {notifyUsers && (
          <p className="rounded-lg border border-brand-500/20 bg-brand-500/5 px-3 py-2 text-xs text-brand-400">
            📧 Um e-mail profissional com as release notes será enviado a todos
            os usuários com conta ativa.
          </p>
        )}

        <DialogFooter className="gap-2">
          <Button
            variant="outline"
            onClick={onClose}
            disabled={isPublishing}
            className="gap-1.5"
          >
            <X className="h-4 w-4" />
            Cancelar
          </Button>
          <Button
            onClick={handleConfirm}
            disabled={isPublishing}
            className="gap-1.5 bg-brand-500 text-white hover:bg-brand-600"
            aria-busy={isPublishing}
          >
            {isPublishing ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Publicando...
              </>
            ) : (
              <>
                <Send className="h-4 w-4" />
                Publicar
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

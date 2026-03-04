/**
 * UserAvatar — componente reutilizável para exibir a foto de perfil do usuário.
 *
 * A Microsoft OAuth pode retornar a foto como base64 (data URI).
 * next/image NÃO suporta data URIs, portanto usamos <img> nativo nesses casos.
 * Para URLs externas normais, usamos AvatarImage (Radix) que aceita qualquer src.
 */

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn, getInitials, isBase64Image, resolveUserImage } from "@/lib/utils";

export interface UserAvatarProps {
  /** Nome completo do usuário — usado para gerar as iniciais do fallback */
  name: string;
  /** Imagem do usuário: pode ser URL externa ou data URI base64 (Microsoft OAuth) */
  image?: string | null;
  /** Tamanho do avatar */
  size?: "sm" | "default" | "lg";
  /** Classes CSS adicionais para o wrapper Avatar */
  className?: string;
}

const imgSizeMap = {
  sm: "h-6 w-6",
  default: "h-8 w-8",
  lg: "h-10 w-10",
} as const;

export function UserAvatar({
  name,
  image,
  size = "default",
  className,
}: UserAvatarProps) {
  const src = resolveUserImage(image);
  const initials = getInitials(name);

  return (
    <Avatar
      size={size}
      className={cn("shrink-0 border border-border", className)}
    >
      {src !== null && isBase64Image(src) ? (
        /*
         * base64 data URI — next/image NÃO suporta este formato.
         * eslint-disable-next-line @next/next/no-img-element
         * Usamos <img> nativo dentro do container Radix para preservar
         * o comportamento de fallback e o estilo circular.
         */

        // biome-ignore lint/performance/noImgElement: <especific case for base64 images>
        <img
          src={src}
          alt={`Foto de perfil de ${name}`}
          className={cn(
            "aspect-square rounded-full object-cover",
            imgSizeMap[size],
          )}
        />
      ) : src !== null ? (
        /*
         * URL externa normal (ex: CDN de provedor OAuth).
         * AvatarImage lida com o fallback automaticamente via Radix.
         */
        <AvatarImage src={src} alt={`Foto de perfil de ${name}`} />
      ) : null}

      {/* Fallback: iniciais do usuário — exibido quando não há imagem ou ela falha ao carregar */}
      <AvatarFallback
        className="bg-brand-500/10 text-xs font-semibold text-brand-500"
        aria-label={`Iniciais de ${name}: ${initials}`}
      >
        {initials}
      </AvatarFallback>
    </Avatar>
  );
}

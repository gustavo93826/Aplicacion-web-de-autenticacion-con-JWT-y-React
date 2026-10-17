// components/UserAvatar.tsx
import { getInitials } from "@/lib/format";
import { cn } from "@/lib/utils";

type UserAvatarProps = {
  name: string;
  className?: string; // opcional: para cambiar el tamaño desde fuera
};

export default function UserAvatar({ name, className }: UserAvatarProps) {
  return (
    // aria-hidden: es decorativo, el nombre ya aparece escrito junto a él
    <div
      aria-hidden="true"
      className={cn(
        "flex size-9 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-semibold text-primary-foreground",
        className
      )}
    >
      {getInitials(name)}
    </div>
  );
}
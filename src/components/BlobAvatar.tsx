import avatarUrl from "../assets/avatar.svg";

interface BlobAvatarProps {
  size?: number;
  className?: string;
}

export function BlobAvatar({ size = 40, className }: BlobAvatarProps) {
  return (
    <img
      src={avatarUrl}
      alt="Ombre AI"
      width={size}
      height={size}
      className={className ?? ""}
      style={{ width: size, height: size }}
      draggable={false}
    />
  );
}

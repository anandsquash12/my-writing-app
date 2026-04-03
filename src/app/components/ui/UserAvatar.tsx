"use client";

import { useMemo, useState } from "react";
import { getInitial } from "@/app/lib/avatar";

interface UserAvatarProps {
  name: string;
  src?: string;
  size?: "sm" | "md" | "lg" | "xl";
  className?: string;
}

const sizeClassNames: Record<NonNullable<UserAvatarProps["size"]>, string> = {
  sm: "h-8 w-8 text-xs",
  md: "h-10 w-10 text-sm",
  lg: "h-14 w-14 text-lg",
  xl: "h-20 w-20 text-xl",
};

export default function UserAvatar({ name, src = "", size = "md", className = "" }: UserAvatarProps) {
  const [imageFailed, setImageFailed] = useState(false);
  const safeSrc = src.trim();
  const initials = useMemo(() => getInitial(name), [name]);
  const wrapperClassName = `inline-flex shrink-0 items-center justify-center overflow-hidden rounded-full border border-neutral-200 bg-gradient-to-br from-orange-100 via-amber-50 to-rose-100 font-semibold text-neutral-700 ${sizeClassNames[size]} ${className}`.trim();

  if (!safeSrc || imageFailed) {
    return <span className={wrapperClassName}>{initials}</span>;
  }

  return (
    <span className={wrapperClassName}>
      <img
        src={safeSrc}
        alt={name}
        className="h-full w-full object-cover"
        onError={() => setImageFailed(true)}
      />
    </span>
  );
}

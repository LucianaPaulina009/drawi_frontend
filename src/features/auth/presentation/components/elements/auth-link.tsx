import Link from "next/link";
import { cn } from "@/lib/utils";

type AuthLinkProps = {
  href: string;
  label: string;
  className?: string;
};

export function AuthLink({ href, label, className }: AuthLinkProps) {
  return (
    <Link
      href={href}
      className={cn(
        "font-bold text-black hover:underline transition-colors ml-1 focus-visible:outline-none focus-visible:underline",
        className
      )}
    >
      {label}
    </Link>
  );
}

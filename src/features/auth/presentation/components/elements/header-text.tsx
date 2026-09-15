import { cn } from "@/lib/utils";

type HeaderTextProps = {
  title: string;
  description: string;
  className?: string;
};

export default function HeaderText({
  title,
  description,
  className,
}: HeaderTextProps) {
  return (
    <header className={cn("text-center", className)}>
      <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
        {title}
      </h1>
      <p className="mt-2 text-sm text-slate-400 leading-relaxed">
        {description}
      </p>
    </header>
  );
}

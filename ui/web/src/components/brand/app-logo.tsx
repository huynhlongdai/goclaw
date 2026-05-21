import { useBrandStore } from "@/stores/use-brand-store";
import { cn } from "@/lib/utils";

interface AppLogoProps {
  className?: string;
  size?: number;
}

export function AppLogo({ className, size = 28 }: AppLogoProps) {
  const { logoDataUrl } = useBrandStore();

  if (logoDataUrl) {
    return (
      <img
        src={logoDataUrl}
        alt="Logo"
        className={cn("object-contain", className)}
        style={{ width: size, height: size }}
      />
    );
  }

  return (
    <img
      src="/goclaw-icon.svg"
      alt="GoClaw"
      className={cn(className)}
      style={{ width: size, height: size }}
    />
  );
}

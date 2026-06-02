import type { SVGProps } from "react";

/** Logo principal de María Vallunas — mascota con colores de marca */
export function Logo({ className, ...props }: SVGProps<SVGSVGElement>) {
  return (
    <img
      src="/logo.svg"
      alt="María Vallunas"
      className={className}
      {...(props as React.ImgHTMLAttributes<HTMLImageElement>)}
    />
  );
}

/** Líneas decorativas del logo — versión tenue para fondos */
export function LogoLineas({ className, ...props }: SVGProps<SVGSVGElement>) {
  return (
    <img
      src="/logo-lineas.svg"
      alt=""
      aria-hidden
      className={className}
      {...(props as React.ImgHTMLAttributes<HTMLImageElement>)}
    />
  );
}

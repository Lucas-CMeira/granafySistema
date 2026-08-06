// Logotipo da GranaFy.
//

import GranaFyLogo from "../assets/GranaFy.png";

const ASPECT = 850 / 293;

const SIZES = {
  sm: 28,
  md: 36,
  lg: 44,
} as const;

type LogoProps = {
  /** Altura renderizada do logotipo. */
  size?: keyof typeof SIZES;
  /** Coloca o logo sobre uma placa branca — necessário em fundos escuros,
   *  já que o "Grana" azul do logotipo some sobre o verde da marca. */
  plate?: boolean;
  className?: string;
};

export default function Logo({ size = "md", plate = false, className = "" }: LogoProps) {
  const height = SIZES[size];
  const width = Math.round(height * ASPECT);

  const image = (
    <img
      src={GranaFyLogo}
      alt="GranaFy"
      width={width}
      height={height}
      style={{ height, width }}
      className="block max-w-full shrink-0 self-start object-contain"
    />
  );

  if (!plate) return <span className={`inline-flex shrink-0 ${className}`}>{image}</span>;

  return (
    <span
      className={`inline-flex shrink-0 items-center rounded-xl bg-white px-3 py-2 shadow-sm ring-1 ring-white/40 ${className}`}
    >
      {image}
    </span>
  );
}

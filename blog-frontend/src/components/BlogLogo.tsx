interface BlogLogoProps {
  size?: number;
  color?: string;
  opacity2?: number;
}

/** Stylised "B" mark — place inside a coloured container for the full logo effect. */
export default function BlogLogo({ size = 24, color = "white", opacity2 = 0.78 }: BlogLogoProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      {/* Top bump of B */}
      <path d="M4 3h8a4 4 0 0 1 0 8H4V3z" fill={color} />
      {/* Bottom bump of B (slightly wider) */}
      <path d="M4 11h9a4.5 4.5 0 0 1 0 9H4V11z" fill={color} fillOpacity={opacity2} />
    </svg>
  );
}

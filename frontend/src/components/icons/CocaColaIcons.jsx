import React from 'react';

/**
 * Ícone vetorial da icônica garrafa de vidro Contour da Coca-Cola.
 * Compatível com a API dos ícones Lucide (size, color, stroke, className).
 */
export function CocaColaBottle({
  size = 24,
  color = 'currentColor',
  strokeWidth = 2,
  className = '',
  ...props
}) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={`coke-icon-bottle shrink-0 ${className}`}
      {...props}
    >
      {/* Tampa da garrafa (Crown cap) */}
      <rect x="10" y="2" width="4" height="1.5" rx="0.5" fill={color} />
      
      {/* Gargalo */}
      <path d="M10.5 3.5v2.5M13.5 3.5v2.5" />
      
      {/* Silhueta icônica Contour */}
      <path d="M10.5 6C9 7.5 8 9.5 8 11.5c0 1.5 1 2.2 1 3.2 0 1.3-1.5 2.2-1.5 4.3C7.5 21 9 22 12 22s4.5-1 4.5-3c0-2.1-1.5-3-1.5-4.3 0-1 1-1.7 1-3.2 0-2-1-4-2.5-5.5" />
      
      {/* Onda / Dynamic Ribbon característica central */}
      <path d="M8.8 13.2c1.2.6 2 .4 3.2-.2s2.2-.6 3.2.2" strokeWidth={Math.max(1.2, strokeWidth * 0.75)} opacity="0.85" />
      <path d="M9 15.5c1 .5 1.8.3 3-.2s2.2-.5 3 .2" strokeWidth={Math.max(1.2, strokeWidth * 0.75)} opacity="0.6" />
      
      {/* Linhas de reflexo e textura de vidro */}
      <path d="M10.5 8.5c-.8.8-1 1.7-1 2.7" strokeWidth={Math.max(1, strokeWidth * 0.6)} opacity="0.7" />
    </svg>
  );
}

/**
 * Ícone vetorial estilizado de lata de refrigerante moderna com lacre.
 */
export function SodaCan({
  size = 24,
  color = 'currentColor',
  strokeWidth = 2,
  className = '',
  ...props
}) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={`coke-icon-can shrink-0 ${className}`}
      {...props}
    >
      {/* Topo / Anel superior da lata */}
      <ellipse cx="12" cy="5" rx="5.5" ry="1.8" />
      {/* Lacre / Puxador */}
      <path d="M11 4.5h2M12 3.8v1.4" strokeWidth={Math.max(1.2, strokeWidth * 0.75)} />
      
      {/* Corpo da lata */}
      <path d="M6.5 5v13.5c0 1 2.5 1.8 5.5 1.8s5.5-.8 5.5-1.8V5" />
      {/* Linha da base */}
      <path d="M6.8 17.5c1.2.8 3.1 1.2 5.2 1.2s4-.4 5.2-1.2" opacity="0.5" />
      
      {/* Onda dinâmica temática */}
      <path d="M7 11c1.5 1.2 3.2.8 5-.2s3.5-.8 5 .5" strokeWidth={Math.max(1.2, strokeWidth * 0.75)} opacity="0.85" />
      <path d="M7.2 13.5c1.5 1 3.2.7 4.8-.2s3.5-.8 4.8.4" strokeWidth={Math.max(1, strokeWidth * 0.6)} opacity="0.6" />
    </svg>
  );
}

export default CocaColaBottle;

import React from 'react';
import { Link } from 'react-router-dom';

interface BrandLogoProps {
  size?: 'sm' | 'md' | 'lg';
  showText?: boolean;
  to?: string;
  className?: string;
}

export function BrandLogo({ size = 'md', showText = true, to = '/', className = '' }: BrandLogoProps) {
  const iconSizes = {
    sm: 28,
    md: 36,
    lg: 48,
  };

  const fontSizes = {
    sm: '16px',
    md: '20px',
    lg: '26px',
  };

  const imgSize = iconSizes[size];

  const logoContent = (
    <div
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '10px',
        textDecoration: 'none',
        fontWeight: 900,
        color: '#0F172A',
        fontFamily: "'Inter', system-ui, sans-serif",
      }}
      className={`brand-logo-container ${className}`}
    >
      <img
        src="/logo.png"
        alt="HireUp AI Logo"
        style={{
          width: imgSize,
          height: imgSize,
          objectFit: 'contain',
          borderRadius: '8px',
          filter: 'drop-shadow(0 2px 8px rgba(255, 45, 85, 0.25))',
          transition: 'transform 0.2s ease',
        }}
      />
      {showText && (
        <span style={{ fontSize: fontSizes[size], letterSpacing: '-0.03em', color: '#0F172A' }}>
          hireup<span style={{ color: '#FF2D55' }}>.ai</span>
        </span>
      )}
    </div>
  );

  if (to) {
    return (
      <Link to={to} style={{ textDecoration: 'none' }}>
        {logoContent}
      </Link>
    );
  }

  return logoContent;
}

export default BrandLogo;

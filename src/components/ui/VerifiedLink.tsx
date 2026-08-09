'use client';

import React from 'react';
import Link, { LinkProps } from 'next/link';
import { UrlObject } from 'url';
import { ExternalLink } from 'lucide-react';

type LinkHref = string | UrlObject;

interface VerifiedLinkProps extends Omit<React.AnchorHTMLAttributes<HTMLAnchorElement>, 'href'> {
  href: LinkHref;
  children: React.ReactNode;
  isVerified?: boolean;
  sourceType?: 'reddit' | 'original' | 'external';
  tooltip?: string;
  showVerificationBadge?: boolean;
}

const VerifiedLink: React.FC<VerifiedLinkProps> = ({
  href,
  children,
  isVerified = true,
  sourceType = 'reddit',
  tooltip = 'Verified original source',
  showVerificationBadge = true,
  ...props
}) => {
  // Determine styling based on verification and source type
  const verificationClass = isVerified
    ? sourceType === 'reddit' 
      ? 'text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300' 
      : 'text-green-600 hover:text-green-800 dark:text-green-400 dark:hover:text-green-300'
    : 'text-orange-500 hover:text-orange-700 dark:text-orange-400 dark:hover:text-orange-300';
    
  const verificationIcon = isVerified ? (
    <span className="inline-flex items-center ml-1 bg-green-100 text-green-800 text-xs font-medium px-1.5 py-0.5 rounded-full dark:bg-green-900 dark:text-green-300">
      ✓
    </span>
  ) : (
    <span className="inline-flex items-center ml-1 bg-orange-100 text-orange-800 text-xs font-medium px-1.5 py-0.5 rounded-full dark:bg-orange-900 dark:text-orange-300">
      ⚠️
    </span>
  );

  return (
    <Link 
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className={`${verificationClass} inline-flex items-center font-medium hover:underline underline-offset-4 transition-colors duration-200`}
      title={tooltip}
      {...props}
    >
      <span>{children}</span>
      <ExternalLink className="ml-1 h-3 w-3 flex-shrink-0" />
      {showVerificationBadge && (
        <span className="ml-1" title={isVerified ? "Verified source linked" : "Source not verified"}>
          {verificationIcon}
        </span>
      )}
    </Link>
  );
};

export default VerifiedLink;
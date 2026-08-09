import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Privacy Policy – ReddigInsight | Your Data Protection',
  description: 'Learn how ReddigInsight protects your privacy and handles your Reddit analysis data.',
};

export default function PrivacyLayout({ children }: { children: React.ReactNode }) {
  return children;
}

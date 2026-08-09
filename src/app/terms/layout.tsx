import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Terms of Service – ReddigInsight',
  description: 'Terms and conditions for using the ReddigInsight AI-powered Reddit analysis service.',
};

export default function TermsLayout({ children }: { children: React.ReactNode }) {
  return children;
}

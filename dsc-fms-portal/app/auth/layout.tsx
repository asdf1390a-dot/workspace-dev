import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'DSC FMS - 로그인',
  description: 'DSC Mannur Facility Management System 로그인',
};

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}

/**
 * Icon wrapper for JEEPNEY portal.
 * Uses `lucide-react` (already in deps) as the Heroicons v24-style source.
 * Re-exported under stable names so the rest of the app imports from one place.
 *
 * Usage:
 *   import { Icon, HomeIcon } from "@/app/components/icons/HeroiconsWrapper";
 *   <Icon name="home" size={20} />
 *   <HomeIcon size={20} />
 */
'use client';

import {
  Home,
  LayoutDashboard,
  User,
  Settings,
  UserCircle,
  Menu,
  X,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  Search,
  Bell,
  Briefcase,
  Wrench,
  ClipboardList,
  Factory,
  BarChart3,
  Plus,
  Check,
  AlertCircle,
  Info,
  Loader2,
  type LucideIcon,
  type LucideProps,
} from 'lucide-react';

export const ICONS = {
  home: Home,
  hub: LayoutDashboard,
  user: User,
  settings: Settings,
  profile: UserCircle,
  menu: Menu,
  close: X,
  back: ChevronLeft,
  forward: ChevronRight,
  down: ChevronDown,
  search: Search,
  bell: Bell,
  career: Briefcase,
  wrench: Wrench,
  clipboard: ClipboardList,
  factory: Factory,
  chart: BarChart3,
  plus: Plus,
  check: Check,
  alert: AlertCircle,
  info: Info,
  spinner: Loader2,
} as const satisfies Record<string, LucideIcon>;

export type IconName = keyof typeof ICONS;

export interface IconProps extends Omit<LucideProps, 'ref'> {
  name: IconName;
}

export function Icon({ name, size = 20, strokeWidth = 2, ...rest }: IconProps) {
  const Cmp = ICONS[name];
  return <Cmp size={size} strokeWidth={strokeWidth} aria-hidden="true" {...rest} />;
}

// Named exports for ergonomic usage
export const HomeIcon = Home;
export const HubIcon = LayoutDashboard;
export const PersonalIcon = User;
export const SettingsIcon = Settings;
export const ProfileIcon = UserCircle;
export const MenuIcon = Menu;
export const CloseIcon = X;
export const BackIcon = ChevronLeft;
export const SpinnerIcon = Loader2;

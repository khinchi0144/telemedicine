import type { LucideIcon } from 'lucide-react';
import {
  Activity,
  BarChart3,
  Building2,
  Calendar,
  CalendarClock,
  ClipboardList,
  FileCheck2,
  FileText,
  HeartPulse,
  LayoutDashboard,
  MessageSquare,
  Package,
  Pill,
  Settings,
  Search,
  ShoppingCart,
  Stethoscope,
  Store,
  UserCog,
  UserRound,
  Users,
  Video,
  Wallet,
} from 'lucide-react';

import type { Role } from '@/types/auth';

export interface NavItem {
  label: string;
  href: string;
  icon: LucideIcon;
  /** Short label used by the mobile bottom bar. */
  short?: string;
  /**
   * Rendered as a disabled entry with an honest explanation — the module has
   * no backend yet, so there is deliberately no page behind the link.
   */
  comingSoon?: boolean;
}

export interface NavGroup {
  label: string;
  items: NavItem[];
}

/** Icon used by "Find doctors" comes from lucide, like every other icon. */

const PATIENT_NAV: NavGroup[] = [
  {
    label: 'Workspace',
    items: [
      { label: 'Overview', href: '/patient', icon: LayoutDashboard, short: 'Home' },
      { label: 'Find doctors', href: '/patient/doctors', icon: Search },
      { label: 'Book appointment', href: '/patient/appointments', icon: Calendar },
      { label: 'My appointments', href: '/patient/appointments', icon: CalendarClock },
      { label: 'Video consultation', href: '/patient/consultations', icon: Video },
    ],
  },
  {
    label: 'Health',
    items: [
      { label: 'Prescriptions', href: '/patient/prescriptions', icon: ClipboardList },
      { label: 'Medical records', href: '/patient/records', icon: FileText },
      { label: 'Messages', href: '/patient/messages', icon: MessageSquare },
    ],
  },
  {
    label: 'Pharmacy',
    items: [
      { label: 'Find medicines', href: '/patient/medicines', icon: Pill },
      { label: 'Nearby pharmacies', href: '/patient/pharmacies', icon: Store },
      { label: 'Order history', href: '/patient/orders', icon: ShoppingCart },
    ],
  },
  {
    label: 'Account',
    items: [
      { label: 'My profile', href: '/patient/profile', icon: UserRound },
      { label: 'Settings', href: '/patient/settings', icon: Settings, comingSoon: true },
    ],
  },
];

const DOCTOR_NAV: NavGroup[] = [
  {
    label: 'Workspace',
    items: [
      { label: 'Overview', href: '/doctor', icon: LayoutDashboard, short: 'Home' },
      { label: 'Appointments', href: '/doctor/appointments', icon: Calendar },
      { label: 'Patient requests', href: '/doctor/requests', icon: Users, comingSoon: true },
      { label: 'Video consultations', href: '/doctor/consultations', icon: Video },
      { label: 'Messages', href: '/doctor/messages', icon: MessageSquare },
    ],
  },
  {
    label: 'Clinical',
    items: [
      { label: 'My patients', href: '/doctor/patients', icon: Users, comingSoon: true },
      { label: 'Prescriptions', href: '/doctor/prescriptions', icon: ClipboardList },
      { label: 'Availability', href: '/doctor/availability', icon: CalendarClock },
    ],
  },
  {
    label: 'Practice',
    items: [
      { label: 'Earnings', href: '/doctor/earnings', icon: Wallet, comingSoon: true },
      { label: 'Reviews', href: '/doctor/reviews', icon: Activity, comingSoon: true },
      { label: 'My profile', href: '/doctor/profile', icon: Stethoscope },
      { label: 'Settings', href: '/doctor/settings', icon: Settings, comingSoon: true },
    ],
  },
];

const PHARMACY_NAV: NavGroup[] = [
  {
    label: 'Workspace',
    items: [
      { label: 'Overview', href: '/pharmacy', icon: LayoutDashboard, short: 'Home' },
      { label: 'Medicine inventory', href: '/pharmacy/inventory', icon: Package, comingSoon: true },
      { label: 'Prescription requests', href: '/pharmacy/requests', icon: ClipboardList, comingSoon: true },
      { label: 'Medicine availability', href: '/pharmacy/availability', icon: Pill, comingSoon: true },
    ],
  },
  {
    label: 'Commerce',
    items: [
      { label: 'Orders', href: '/pharmacy/orders', icon: ShoppingCart, comingSoon: true },
      { label: 'Order history', href: '/pharmacy/order-history', icon: Activity, comingSoon: true },
    ],
  },
  {
    label: 'Business',
    items: [
      { label: 'Pharmacy profile', href: '/pharmacy/profile', icon: Store },
      { label: 'Documents', href: '/pharmacy/documents', icon: FileCheck2 },
      { label: 'Settings', href: '/pharmacy/settings', icon: Settings, comingSoon: true },
    ],
  },
];

const ADMIN_NAV: NavGroup[] = [
  {
    label: 'Overview',
    items: [
      { label: 'Dashboard', href: '/admin', icon: LayoutDashboard, short: 'Home' },
    ],
  },
  {
    label: 'Verification',
    items: [
      { label: 'Doctor verification', href: '/admin/doctors', icon: FileCheck2 },
      { label: 'Pharmacy verification', href: '/admin/pharmacies', icon: FileCheck2 },
    ],
  },
  {
    label: 'Directory',
    items: [
      { label: 'Patients', href: '/admin/patients', icon: HeartPulse, comingSoon: true },
      { label: 'Doctors', href: '/admin/doctors', icon: Stethoscope },
      { label: 'Pharmacies', href: '/admin/pharmacies', icon: Building2 },
    ],
  },
  {
    label: 'Platform',
    items: [
      { label: 'Reports', href: '/admin/reports', icon: BarChart3, comingSoon: true },
      { label: 'Platform settings', href: '/admin/settings', icon: UserCog, comingSoon: true },
    ],
  },
];

export const ROLE_NAV: Record<Role, NavGroup[]> = {
  PATIENT: PATIENT_NAV,
  DOCTOR: DOCTOR_NAV,
  PHARMACY: PHARMACY_NAV,
  ADMIN: ADMIN_NAV,
};

export const ROLE_LABEL: Record<Role, string> = {
  PATIENT: 'Patient',
  DOCTOR: 'Doctor',
  PHARMACY: 'Pharmacy',
  ADMIN: 'Administrator',
};

/** Links shown in the mobile bottom navigation. */
export function mobileNav(role: Role): NavItem[] {
  return ROLE_NAV[role]
    .flatMap((group) => group.items)
    .filter((item) => !item.comingSoon)
    .slice(0, 4);
}

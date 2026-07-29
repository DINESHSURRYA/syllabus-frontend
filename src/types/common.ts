import { ReactNode } from 'react';

export interface NavItem {
  label: string;
  href: string;
  icon?: string;
  badge?: string;
  active?: boolean;
}

export interface ToastNotification {
  id: string;
  title: string;
  message?: string;
  type: 'info' | 'success' | 'warning' | 'error';
  duration?: number;
}

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'faculty' | 'student';
  department?: string;
  avatarUrl?: string;
}

export interface SelectOption<T = string> {
  label: string;
  value: T;
  disabled?: boolean;
}

export interface BaseComponentProps {
  className?: string;
  children?: ReactNode;
}

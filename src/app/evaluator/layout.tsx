"use client";

import React, { ReactNode } from 'react';
import { AppShell } from '@/components/layout/app-shell';

export default function EvaluatorLayout({ children }: { children: ReactNode }) {
  return <AppShell>{children}</AppShell>;
}

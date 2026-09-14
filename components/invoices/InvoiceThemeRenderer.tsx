'use client';

import React, { useMemo } from 'react';
import { Customer, GstProfile, InvoiceItem, InvoiceWithDetails, Organization } from '@/types/database';
import { ThemeID } from '@/lib/themes/types';
import { getTheme } from '@/lib/themes/registry';
import { createCanonicalInvoiceViewModel, getSampleCanonicalInvoiceViewModel } from '@/lib/themes/viewModel';

interface InvoiceThemeRendererProps {
  themeId?: ThemeID | string | null;
  invoice?: InvoiceWithDetails | null;
  items?: InvoiceItem[];
  organization?: Organization | null;
  gstProfile?: GstProfile | null;
  customer?: Customer | null;
  isPrintMode?: boolean;
  useSampleDataIfMissing?: boolean;
}

export function InvoiceThemeRenderer({
  themeId,
  invoice,
  items = [],
  organization,
  gstProfile,
  customer,
  isPrintMode = false,
  useSampleDataIfMissing = true,
}: InvoiceThemeRendererProps) {
  const theme = getTheme(themeId);
  const ThemeComponent = theme.component;

  const viewModel = useMemo(() => {
    if (invoice) {
      return createCanonicalInvoiceViewModel({
        invoice,
        items,
        organization,
        gstProfile,
        customer,
      });
    }

    if (useSampleDataIfMissing) {
      return getSampleCanonicalInvoiceViewModel();
    }

    return null;
  }, [invoice, items, organization, gstProfile, customer, useSampleDataIfMissing]);

  if (!viewModel) {
    return (
      <div className="p-8 text-center text-slate-500 bg-slate-50 border border-dashed border-slate-300 rounded-lg">
        No invoice data provided to theme renderer.
      </div>
    );
  }

  return (
    <div className="w-full h-full text-slate-900" id={`theme-renderer-${theme.id}`}>
      <ThemeComponent data={viewModel} isPrintMode={isPrintMode} />
    </div>
  );
}

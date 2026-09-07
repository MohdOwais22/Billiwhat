'use client';

import React from 'react';
import { WhatsAppStatusView } from './WhatsAppStatusView';
import { Organization } from '@/types/database';

interface WhatsAppAssistantViewProps {
  organization: Organization;
  onNavigateToInvoice?: (invoiceId: string) => void;
}

export function WhatsAppAssistantView({ organization }: WhatsAppAssistantViewProps) {
  return <WhatsAppStatusView organization={organization} />;
}

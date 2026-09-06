import { InvoiceStatus, PaymentMethod, PaymentStatus, PriorityLevel } from '../types/database';

/**
 * Formats a number into Indian Rupee (INR) currency format (e.g. ₹1,42,500.00 or ₹42,500)
 */
export function formatINR(
  amount: number | null | undefined,
  options?: {
    compact?: boolean;
    showDecimals?: boolean;
    showSymbol?: boolean;
  }
): string {
  if (amount === null || amount === undefined || isNaN(amount)) {
    return options?.showSymbol !== false ? '₹0' : '0';
  }

  const { compact = false, showDecimals = false, showSymbol = true } = options || {};
  const isNegative = amount < 0;
  const absAmount = Math.abs(amount);

  let formatted = '';

  if (compact) {
    if (absAmount >= 10000000) {
      // Crores
      formatted = `${(absAmount / 10000000).toFixed(2)} Cr`;
    } else if (absAmount >= 100000) {
      // Lakhs
      formatted = `${(absAmount / 100000).toFixed(2)} L`;
    } else if (absAmount >= 1000) {
      // Thousands
      formatted = `${(absAmount / 1000).toFixed(1)} K`;
    } else {
      formatted = absAmount.toLocaleString('en-IN', {
        maximumFractionDigits: showDecimals ? 2 : 0,
        minimumFractionDigits: showDecimals ? 2 : 0,
      });
    }
  } else {
    formatted = absAmount.toLocaleString('en-IN', {
      maximumFractionDigits: showDecimals ? 2 : 0,
      minimumFractionDigits: showDecimals ? 2 : 0,
    });
  }

  const prefix = isNegative ? '-' : '';
  const symbol = showSymbol ? '₹' : '';
  return `${prefix}${symbol}${formatted}`;
}

/**
 * Formats a date string or Date object into Indian standard business date (e.g., 06 Sep 2026)
 */
export function formatDate(dateInput: string | Date | null | undefined, format: 'short' | 'medium' | 'long' = 'medium'): string {
  if (!dateInput) return '—';
  
  const d = typeof dateInput === 'string' ? new Date(dateInput) : dateInput;
  if (isNaN(d.getTime())) return '—';

  if (format === 'short') {
    return d.toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
    });
  }

  if (format === 'long') {
    return d.toLocaleDateString('en-IN', {
      weekday: 'short',
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  }

  return d.toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

/**
 * Calculates days difference relative to today and returns a human-readable overdue tag
 */
export function formatOverdueDays(dueDateStr: string): {
  days: number;
  isOverdue: boolean;
  label: string;
  variant: 'overdue-critical' | 'overdue-high' | 'overdue-mid' | 'due-today' | 'due-soon' | 'future';
} {
  if (!dueDateStr) {
    return { days: 0, isOverdue: false, label: 'No due date', variant: 'future' };
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const due = new Date(dueDateStr);
  due.setHours(0, 0, 0, 0);

  const diffTime = today.getTime() - due.getTime();
  const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays > 30) {
    return {
      days: diffDays,
      isOverdue: true,
      label: `${diffDays} days overdue`,
      variant: 'overdue-critical',
    };
  } else if (diffDays > 14) {
    return {
      days: diffDays,
      isOverdue: true,
      label: `${diffDays} days overdue`,
      variant: 'overdue-high',
    };
  } else if (diffDays > 0) {
    return {
      days: diffDays,
      isOverdue: true,
      label: `${diffDays} day${diffDays > 1 ? 's' : ''} overdue`,
      variant: 'overdue-mid',
    };
  } else if (diffDays === 0) {
    return {
      days: 0,
      isOverdue: false,
      label: 'Due today',
      variant: 'due-today',
    };
  } else {
    const remainingDays = Math.abs(diffDays);
    if (remainingDays <= 3) {
      return {
        days: diffDays,
        isOverdue: false,
        label: `Due in ${remainingDays} day${remainingDays > 1 ? 's' : ''}`,
        variant: 'due-soon',
      };
    }
    return {
      days: diffDays,
      isOverdue: false,
      label: `Due in ${remainingDays} days`,
      variant: 'future',
    };
  }
}

/**
 * Returns UI representation info for Invoice Status
 */
export function getInvoiceStatusConfig(status: InvoiceStatus): {
  label: string;
  badgeClass: string;
  dotClass: string;
} {
  switch (status) {
    case 'paid':
      return {
        label: 'Paid',
        badgeClass: 'bg-emerald-50 text-emerald-700 border-emerald-200',
        dotClass: 'bg-emerald-500',
      };
    case 'partially_paid':
      return {
        label: 'Partially Paid',
        badgeClass: 'bg-amber-50 text-amber-700 border-amber-200',
        dotClass: 'bg-amber-500',
      };
    case 'overdue':
      return {
        label: 'Overdue',
        badgeClass: 'bg-rose-50 text-rose-700 border-rose-200',
        dotClass: 'bg-rose-500',
      };
    case 'issued':
      return {
        label: 'Issued',
        badgeClass: 'bg-blue-50 text-blue-700 border-blue-200',
        dotClass: 'bg-blue-500',
      };
    case 'draft':
      return {
        label: 'Draft',
        badgeClass: 'bg-slate-100 text-slate-700 border-slate-200',
        dotClass: 'bg-slate-400',
      };
    case 'cancelled':
      return {
        label: 'Cancelled',
        badgeClass: 'bg-gray-100 text-gray-500 border-gray-200 line-through',
        dotClass: 'bg-gray-400',
      };
    default:
      return {
        label: status,
        badgeClass: 'bg-slate-50 text-slate-600 border-slate-200',
        dotClass: 'bg-slate-400',
      };
  }
}

/**
 * Returns UI representation info for Payment Method
 */
export function getPaymentMethodConfig(method: PaymentMethod): {
  label: string;
  badgeClass: string;
} {
  switch (method) {
    case 'upi':
      return {
        label: 'UPI',
        badgeClass: 'bg-violet-50 text-violet-700 border-violet-200',
      };
    case 'bank_transfer':
      return {
        label: 'Bank Transfer (NEFT/RTGS)',
        badgeClass: 'bg-sky-50 text-sky-700 border-sky-200',
      };
    case 'cheque':
      return {
        label: 'Cheque',
        badgeClass: 'bg-amber-50 text-amber-700 border-amber-200',
      };
    case 'cash':
      return {
        label: 'Cash',
        badgeClass: 'bg-emerald-50 text-emerald-700 border-emerald-200',
      };
    default:
      return {
        label: method,
        badgeClass: 'bg-slate-50 text-slate-700 border-slate-200',
      };
  }
}

/**
 * Returns UI representation info for Payment Status
 */
export function getPaymentStatusConfig(status: PaymentStatus): {
  label: string;
  badgeClass: string;
} {
  switch (status) {
    case 'cleared':
      return {
        label: 'Cleared',
        badgeClass: 'bg-emerald-50 text-emerald-700 border-emerald-200',
      };
    case 'recorded':
      return {
        label: 'Recorded',
        badgeClass: 'bg-blue-50 text-blue-700 border-blue-200',
      };
    case 'bounced':
      return {
        label: 'Bounced / Rejected',
        badgeClass: 'bg-rose-50 text-rose-700 border-rose-200',
      };
    default:
      return {
        label: status,
        badgeClass: 'bg-slate-50 text-slate-700 border-slate-200',
      };
  }
}

/**
 * Returns UI representation info for Priority Level
 */
export function getPriorityConfig(priority: PriorityLevel): {
  label: string;
  badgeClass: string;
  indicatorClass: string;
} {
  switch (priority) {
    case 'critical':
      return {
        label: 'Critical',
        badgeClass: 'bg-rose-100 text-rose-800 border-rose-300 font-semibold',
        indicatorClass: 'bg-rose-600',
      };
    case 'high':
      return {
        label: 'High Priority',
        badgeClass: 'bg-orange-100 text-orange-800 border-orange-300 font-semibold',
        indicatorClass: 'bg-orange-500',
      };
    case 'medium':
      return {
        label: 'Medium',
        badgeClass: 'bg-amber-50 text-amber-800 border-amber-200',
        indicatorClass: 'bg-amber-500',
      };
    case 'normal':
      return {
        label: 'Normal',
        badgeClass: 'bg-slate-100 text-slate-700 border-slate-200',
        indicatorClass: 'bg-slate-400',
      };
    default:
      return {
        label: 'Standard',
        badgeClass: 'bg-slate-100 text-slate-700 border-slate-200',
        indicatorClass: 'bg-slate-400',
      };
  }
}

/**
 * Computes greeting based on time of day
 */
export function getTimeOfDayGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) {
    return 'Good morning';
  } else if (hour < 17) {
    return 'Good afternoon';
  } else {
    return 'Good evening';
  }
}

export function formatNumber(value: number): string {
  return new Intl.NumberFormat('en-US').format(Math.round(value));
}

export function formatPercent(value: number): string {
  return `${value.toFixed(1)}%`;
}

export function calculateScrapRate(scrapQty: number, producedQty: number): number {
  const total = producedQty + scrapQty;
  if (total === 0) return 0;
  return (scrapQty / total) * 100;
}

export function calculateVariance(producedQty: number, targetQty: number): number {
  return producedQty - targetQty;
}

export function calculateCompletionPct(producedQty: number, targetQty: number): number {
  if (targetQty <= 0) return 0;
  return Math.min(100, Math.round((producedQty / targetQty) * 100));
}

/**
 * Cleans product type names by stripping polymer specs like (LDPE), (HDPE), etc.
 * Example: "Poly Bag (LDPE)" => "Poly Bag"
 */
export function cleanProductType(type?: string): string {
  if (!type) return '';
  return type
    .replace(/\s*\([^)]*\)/g, '')
    .trim();
}

export function formatDate(dateString: string): string {
  if (!dateString) return '-';
  try {
    const d = new Date(dateString);
    return d.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  } catch {
    return dateString;
  }
}

export function formatTime(isoString: string): string {
  if (!isoString) return '-';
  try {
    const d = new Date(isoString);
    return d.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return isoString;
  }
}

export function getStageColorClasses(stage: string, isOverdue: boolean = false): {
  pillClass: string;
  badgeBg: string;
  textColor: string;
  borderColor: string;
  progressColor: string;
} {
  if (isOverdue) {
    return {
      pillClass: 'stage-overdue',
      badgeBg: 'bg-[#FFE4E6]',
      textColor: 'text-[#E11D48]',
      borderColor: 'border-[#FECDD3]',
      progressColor: 'bg-[#E11D48]',
    };
  }

  switch (stage) {
    case 'Extrusion':
      return {
        pillClass: 'stage-extrusion',
        badgeBg: 'bg-[#E0F2FE]',
        textColor: 'text-[#0284C7]',
        borderColor: 'border-[#BAE6FD]',
        progressColor: 'bg-[#0284C7]',
      };
    case 'Printing':
      return {
        pillClass: 'stage-printing',
        badgeBg: 'bg-[#EDE9FE]',
        textColor: 'text-[#7C3AED]',
        borderColor: 'border-[#DDD6FE]',
        progressColor: 'bg-[#7C3AED]',
      };
    case 'Bag Making':
      return {
        pillClass: 'stage-bag-making',
        badgeBg: 'bg-[#FEF3C7]',
        textColor: 'text-[#D97706]',
        borderColor: 'border-[#FDE68A]',
        progressColor: 'bg-[#D97706]',
      };
    case 'Dispatch':
      return {
        pillClass: 'stage-dispatch',
        badgeBg: 'bg-[#DCFCE7]',
        textColor: 'text-[#16A34A]',
        borderColor: 'border-[#BBF7D0]',
        progressColor: 'bg-[#16A34A]',
      };
    case 'Completed':
      return {
        pillClass: 'stage-completed',
        badgeBg: 'bg-[#F1F5F9]',
        textColor: 'text-[#475569]',
        borderColor: 'border-[#E2E8F0]',
        progressColor: 'bg-[#64748B]',
      };
    default:
      return {
        pillClass: 'bg-gray-100 text-gray-700 border-gray-200',
        badgeBg: 'bg-gray-100',
        textColor: 'text-gray-700',
        borderColor: 'border-gray-200',
        progressColor: 'bg-gray-500',
      };
  }
}

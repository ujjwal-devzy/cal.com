export type DateRange = {
  startDate?: Date;
  endDate?: Date;
};

export type CalculateNewDateRangeParams = {
  startDate?: Date;
  endDate?: Date;
  clickedDate: Date;
};

export type CalculateHoverDateRangeParams = {
  startDate?: Date;
  endDate?: Date;
  hoveredDate?: Date;
};

export type NormalizeDateRangeParams = {
  startDate?: Date;
  endDate?: Date;
  minDate?: Date | null;
  maxDate?: Date;
};

export type DateRangeDisplayTextParams = {
  startDate?: Date;
  endDate?: Date;
  dateFormatter: (date: Date) => string;
  placeholderText?: string;
  pendingEndDateText?: string;
};

export function calculateNewDateRange({
  startDate,
  endDate,
  clickedDate,
}: CalculateNewDateRangeParams): DateRange {
  if (!startDate || endDate) {
    return { startDate: clickedDate, endDate: undefined };
  }

  if (clickedDate < startDate) {
    return { startDate: clickedDate, endDate: startDate };
  }

  return { startDate, endDate: clickedDate };
}

export function calculateHoverDateRange({
  startDate,
  endDate,
  hoveredDate,
}: CalculateHoverDateRangeParams): { from: Date; to: Date } | undefined {
  if (!startDate || endDate || !hoveredDate) {
    return undefined;
  }

  if (hoveredDate.getTime() === startDate.getTime()) {
    return undefined;
  }

  if (hoveredDate < startDate) {
    return { from: hoveredDate, to: startDate };
  }

  return { from: startDate, to: hoveredDate };
}

export function normalizeDateRange({
  startDate,
  endDate,
  minDate,
  maxDate,
}: NormalizeDateRangeParams): DateRange {
  const clampDate = (date: Date): Date => {
    if (minDate && date < minDate) {
      return minDate;
    }
    if (maxDate && date > maxDate) {
      return maxDate;
    }
    return date;
  };

  const normalizedStartDate = startDate ? clampDate(startDate) : undefined;
  const normalizedEndDate = endDate ? clampDate(endDate) : undefined;

  if (!normalizedStartDate && !normalizedEndDate) {
    return { startDate: undefined, endDate: undefined };
  }

  if (!normalizedStartDate && normalizedEndDate) {
    return { startDate: normalizedEndDate, endDate: undefined };
  }

  if (normalizedStartDate && !normalizedEndDate) {
    return { startDate: normalizedStartDate, endDate: undefined };
  }

  if (normalizedEndDate < normalizedStartDate) {
    return { startDate: normalizedEndDate, endDate: normalizedStartDate };
  }

  return { startDate: normalizedStartDate, endDate: normalizedEndDate };
}

export function getDateRangeDisplayText({
  startDate,
  endDate,
  dateFormatter,
  placeholderText = "Pick a date",
  pendingEndDateText = "End",
}: DateRangeDisplayTextParams): string {
  if (!startDate) {
    return placeholderText;
  }

  if (!endDate) {
    return `${dateFormatter(startDate)} - ${pendingEndDateText}`;
  }

  return `${dateFormatter(startDate)} - ${dateFormatter(endDate)}`;
}

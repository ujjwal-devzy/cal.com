"use client";

import classNames from "@calcom/ui/classNames";
import * as Popover from "@radix-ui/react-popover";
import { format } from "date-fns";
import { type HTMLAttributes, useState } from "react";
import { Button } from "../../button";
import { Calendar } from "./Calendar";
import {
  calculateHoverDateRange,
  calculateNewDateRange,
  getDateRangeDisplayText,
  normalizeDateRange,
} from "./dateRangeLogic";

type DatePickerWithRangeProps = {
  dates: { startDate?: Date; endDate?: Date };
  onDatesChange: ({ startDate, endDate }: { startDate?: Date; endDate?: Date }) => void;
  disabled?: boolean;
  minDate?: Date | null;
  maxDate?: Date;
  withoutPopover?: boolean;
  popoverModal?: boolean;
  popoverOpen?: boolean;
  onPopoverOpenChange?: (open: boolean) => void;
  "data-testid"?: string;
  strictlyBottom?: boolean;
  allowPastDates?: boolean;
  closeOnRangeComplete?: boolean;
  dateFormatter?: (date: Date) => string;
  placeholderText?: string;
  pendingEndDateText?: string;
};

export function DatePickerWithRange({
  className,
  dates,
  minDate,
  maxDate,
  onDatesChange,
  disabled,
  withoutPopover,
  popoverModal = true,
  popoverOpen,
  onPopoverOpenChange,
  "data-testid": testId,
  strictlyBottom,
  allowPastDates = false,
  closeOnRangeComplete = false,
  dateFormatter = (date) => format(date, "LLL dd, y"),
  placeholderText = "Pick a date",
  pendingEndDateText = "End",
}: HTMLAttributes<HTMLDivElement> & DatePickerWithRangeProps) {
  const [hoveredDate, setHoveredDate] = useState<Date | undefined>(undefined);
  const [internalPopoverOpen, setInternalPopoverOpen] = useState(false);

  const normalizedDates = normalizeDateRange({
    startDate: dates.startDate,
    endDate: dates.endDate,
    minDate,
    maxDate,
  });

  function setPopoverOpen(open: boolean) {
    if (popoverOpen === undefined) {
      setInternalPopoverOpen(open);
    }
    onPopoverOpenChange?.(open);
  }

  function handleDayClick(date: Date) {
    const newDates = normalizeDateRange({
      ...calculateNewDateRange({
        startDate: normalizedDates.startDate,
        endDate: normalizedDates.endDate,
        clickedDate: date,
      }),
      minDate,
      maxDate,
    });
    onDatesChange(newDates);
    setHoveredDate(undefined);

    if (closeOnRangeComplete && newDates.startDate && newDates.endDate && !withoutPopover) {
      setPopoverOpen(false);
    }
  }

  function handleDayMouseEnter(date: Date) {
    if (normalizedDates.startDate && !normalizedDates.endDate) {
      setHoveredDate(date);
    }
  }

  function handleDayMouseLeave() {
    setHoveredDate(undefined);
  }

  const fromDate = allowPastDates && minDate === null ? undefined : (minDate ?? new Date());

  const hoverRangeModifier = calculateHoverDateRange({
    startDate: normalizedDates.startDate,
    endDate: normalizedDates.endDate,
    hoveredDate,
  });

  const dateRangeDisplayText = getDateRangeDisplayText({
    startDate: normalizedDates.startDate,
    endDate: normalizedDates.endDate,
    dateFormatter,
    placeholderText,
    pendingEndDateText,
  });

  const resolvedPopoverOpen = popoverOpen ?? internalPopoverOpen;

  const calendar = (
    <Calendar
      initialFocus
      fromDate={fromDate}
      toDate={maxDate}
      mode="range"
      defaultMonth={normalizedDates.startDate}
      selected={{ from: normalizedDates.startDate, to: normalizedDates.endDate }}
      onDayClick={(day) => handleDayClick(day)}
      onDayMouseEnter={handleDayMouseEnter}
      onDayMouseLeave={handleDayMouseLeave}
      numberOfMonths={1}
      disabled={disabled}
      data-testid={testId}
      modifiers={hoverRangeModifier ? { hoverRange: hoverRangeModifier } : undefined}
      modifiersClassNames={hoverRangeModifier ? { hoverRange: "bg-emphasis" } : undefined}
    />
  );

  if (withoutPopover) {
    return calendar;
  }

  return (
    <div className={classNames("grid gap-2", className)}>
      {/* modal prop required for iOS compatibility when nested inside Dialog modals */}
      <Popover.Root modal={popoverModal} open={resolvedPopoverOpen} onOpenChange={setPopoverOpen}>
        <Popover.Trigger asChild>
          <Button
            data-testid="date-range"
            color="secondary"
            EndIcon="calendar"
            className={classNames("justify-between text-left font-normal", !normalizedDates.startDate && "text-subtle")}>
            <span>{dateRangeDisplayText}</span>
          </Button>
        </Popover.Trigger>
        <Popover.Portal>
          <Popover.Content
            className="bg-default text-emphasis z-50 w-auto rounded-md border p-0 outline-none"
            align="start"
            sideOffset={4}
            side={strictlyBottom ? "bottom" : undefined}
            avoidCollisions={!strictlyBottom}
            onInteractOutside={(event) => {
              if (normalizedDates.startDate && !normalizedDates.endDate) {
                event.preventDefault();
              }
            }}>
            {calendar}
          </Popover.Content>
        </Popover.Portal>
      </Popover.Root>
    </div>
  );
}

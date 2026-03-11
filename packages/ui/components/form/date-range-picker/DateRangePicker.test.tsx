import { fireEvent, render, screen } from "@testing-library/react";
import { useState } from "react";
import { vi } from "vitest";

import { DatePickerWithRange } from "./DateRangePicker";

describe("DatePickerWithRange", () => {
  const jan10 = new Date(2024, 0, 10);
  const jan20 = new Date(2024, 0, 20);

  test("renders default placeholder when no dates are selected", () => {
    render(<DatePickerWithRange dates={{ startDate: undefined, endDate: undefined }} onDatesChange={vi.fn()} />);

    expect(screen.getByTestId("date-range")).toHaveTextContent("Pick a date");
  });

  test("renders custom pending-end text and formatter when only start date exists", () => {
    render(
      <DatePickerWithRange
        dates={{ startDate: jan10, endDate: undefined }}
        onDatesChange={vi.fn()}
        dateFormatter={(date) => date.toISOString().slice(0, 10)}
        pendingEndDateText="Until"
      />
    );

    expect(screen.getByTestId("date-range")).toHaveTextContent("2024-01-10 - Until");
  });

  test("renders custom formatted full range", () => {
    render(
      <DatePickerWithRange
        dates={{ startDate: jan10, endDate: jan20 }}
        onDatesChange={vi.fn()}
        dateFormatter={(date) => date.toISOString().slice(0, 10)}
      />
    );

    expect(screen.getByTestId("date-range")).toHaveTextContent("2024-01-10 - 2024-01-20");
  });

  test("calls onPopoverOpenChange(false) when closeOnRangeComplete is enabled", () => {
    const onDatesChange = vi.fn();
    const onPopoverOpenChange = vi.fn();

    render(
      <DatePickerWithRange
        dates={{ startDate: jan10, endDate: undefined }}
        onDatesChange={onDatesChange}
        allowPastDates
        minDate={null}
        popoverOpen
        onPopoverOpenChange={onPopoverOpenChange}
        closeOnRangeComplete
      />
    );

    fireEvent.click(screen.getByRole("button", { name: /January 15/i }));

    expect(onDatesChange).toHaveBeenCalledTimes(1);
    expect(onPopoverOpenChange).toHaveBeenCalledWith(false);
  });

  test("does not call onPopoverOpenChange(false) when closeOnRangeComplete is disabled", () => {
    const onDatesChange = vi.fn();
    const onPopoverOpenChange = vi.fn();

    render(
      <DatePickerWithRange
        dates={{ startDate: jan10, endDate: undefined }}
        onDatesChange={onDatesChange}
        allowPastDates
        minDate={null}
        popoverOpen
        onPopoverOpenChange={onPopoverOpenChange}
      />
    );

    fireEvent.click(screen.getByRole("button", { name: /January 15/i }));

    expect(onDatesChange).toHaveBeenCalledTimes(1);
    expect(onPopoverOpenChange).not.toHaveBeenCalledWith(false);
  });

  test("normalizes invalid incoming ranges before display", () => {
    render(
      <DatePickerWithRange
        dates={{ startDate: jan20, endDate: jan10 }}
        onDatesChange={vi.fn()}
        dateFormatter={(date) => date.toISOString().slice(0, 10)}
      />
    );

    expect(screen.getByTestId("date-range")).toHaveTextContent("2024-01-10 - 2024-01-20");
  });

  test("updates displayed range after end date selection in stateful usage", () => {
    const StatefulPicker = () => {
      const [dates, setDates] = useState<{ startDate?: Date; endDate?: Date }>({ startDate: jan10 });

      return (
        <DatePickerWithRange
          dates={dates}
          onDatesChange={setDates}
          allowPastDates
          minDate={null}
          dateFormatter={(date) => date.toISOString().slice(0, 10)}
        />
      );
    };

    render(<StatefulPicker />);

    fireEvent.click(screen.getByTestId("date-range"));
    fireEvent.click(screen.getByRole("button", { name: /January 15/i }));

    expect(screen.getByTestId("date-range")).toHaveTextContent("2024-01-10 - 2024-01-15");
  });
});

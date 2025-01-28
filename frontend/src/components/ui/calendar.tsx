import * as React from "react"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { DayPicker } from "react-day-picker"

import { cn } from "../../lib/utils"
import { buttonVariants } from "./button"

export type CalendarProps = React.ComponentProps<typeof DayPicker>

function Calendar({
  className,
  classNames,
  showOutsideDays = true,
  ...props
}: CalendarProps) {
  return (
    <DayPicker
      showOutsideDays={showOutsideDays}
      className={cn("p-3", className)}
      classNames={{
        months: "flex flex-col sm:flex-row space-y-4 sm:space-x-4 sm:space-y-0",
        month: "space-y-4",
        caption: "flex justify-center pt-1 relative items-center",
        caption_label: "text-lg font-medium text-emerald-300",
        nav: "space-x-1 flex items-center",
        nav_button: cn(
          buttonVariants({ variant: "outline" }),
          "h-8 w-8 bg-emerald-800/50 border-2 border-emerald-600 hover:bg-emerald-700/50 text-emerald-300 rounded-xl"
        ),
        nav_button_previous: "absolute left-4",
        nav_button_next: "absolute right-4",
        table: "w-full border-collapse space-y-1",
        head_row: "flex",
        head_cell: "text-emerald-400 rounded-md w-8 font-normal text-[0.8rem]",
        row: "flex w-full mt-2",
        cell: cn(
          "relative p-0 text-center text-sm focus-within:relative focus-within:z-20",
          props.mode === "range"
            ? "[&:has(>.day-range-end)]:rounded-r-md [&:has(>.day-range-start)]:rounded-l-md first:[&:has([aria-selected])]:rounded-l-md last:[&:has([aria-selected])]:rounded-r-md"
            : "[&:has([aria-selected])]:rounded-md"
        ),
        day: cn(
          buttonVariants({ variant: "ghost" }),
          "h-9 w-9 p-0 font-normal bg-emerald-800/50 text-emerald-200 hover:bg-emerald-700/50"
        ),
        day_range_start: "day-range-start bg-emerald-600 text-white",
        day_range_end: "day-range-end bg-emerald-600 text-white",
        day_selected: "bg-emerald-600 text-white hover:bg-emerald-600",
        day_today: "bg-emerald-700 text-white ring-2 ring-emerald-400",
        day_outside: "text-emerald-400/50 aria-selected:bg-emerald-600/50",
        day_disabled: "text-emerald-400 opacity-50",
        day_range_middle: "aria-selected:bg-emerald-700/50 aria-selected:text-emerald-200",
        day_hidden: "invisible",
        ...classNames,
      }}
      components={{
        IconLeft: ({ className, ...props }) => (
          <ChevronLeft className={cn("h-4 w-4 text-emerald-300", className)} {...props} />
        ),
        IconRight: ({ className, ...props }) => (
          <ChevronRight className={cn("h-4 w-4 text-emerald-300", className)} {...props} />
        ),
      }}
      {...props}
    />
  )
}
Calendar.displayName = "Calendar"

export { Calendar }

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
      captionLayout="dropdown"
      fromYear={1900}
      toYear={new Date().getFullYear()}
      className={cn(
        "p-6 rounded-xl shadow-2xl bg-emarald-900/60 backdrop-blur-lg mx-auto w-fit",
        className
      )}
      classNames={{
        months: "flex flex-col sm:flex-row space-y-4 sm:space-x-6 sm:space-y-0 justify-center",
        month: "space-y-4",
        caption: "flex justify-center items-center space-x-4",
        caption_label: "hidden",
        caption_dropdowns: "flex space-x-3",
        dropdown:
          "bg-emerald-900 text-lime-100 text-sm font-medium rounded-xl px-4 py-2 border border-green-600 hover:border-green-400 transition duration-200 shadow-md",
        nav: "hidden",
        table: "w-full border-collapse space-y-1",
        head_row: "flex justify-center",
        head_cell:
          "text-lime-400 font-semibold text-[0.8rem] w-10 text-center",
        row: "flex w-full justify-center mt-2",
        cell: cn(
          "relative p-0 text-center text-sm",
          props.mode === "range"
            ? "[&:has(>.day-range-end)]:rounded-full [&:has(>.day-range-start)]:rounded-full first:[&:has([aria-selected])]:rounded-full last:[&:has([aria-selected])]:rounded-full"
            : "[&:has([aria-selected])]:rounded-full"
        ),
        day: cn(
          buttonVariants({ variant: "ghost" }),
          "h-10 w-10 p-0 font-medium text-emerald-200 bg-emerald-900/40 hover:bg-emerald-700/60 hover:text-lime-200 transition rounded-full"
        ),
        day_range_start:
          "day-range-start bg-emerald-500 text-white font-bold ring-2 ring-lime-400 shadow-md",
        day_range_end:
          "day-range-end bg-emerald-500 text-white font-bold ring-2 ring-lime-400 shadow-md",
        day_selected:
          "bg-lime-500 text-black font-semibold hover:bg-lime-400 ring-2 ring-lime-600 shadow-lg",
        day_today:
          "bg-cyan-700 text-white font-bold ring-2 ring-cyan-400 ring-offset-2 ring-offset-zinc-800",
        day_outside: "text-zinc-500/50",
        day_disabled: "text-zinc-500 opacity-50",
        day_range_middle:
          "aria-selected:bg-emerald-700/40 aria-selected:text-lime-100",
        day_hidden: "invisible",
        ...classNames,
      }}
      components={{
        IconLeft: ({ className, ...props }) => (
          <ChevronLeft
            className={cn(
              "h-5 w-5 text-emerald-300 hover:text-lime-200 transition-colors",
              className
            )}
            {...props}
          />
        ),
        IconRight: ({ className, ...props }) => (
          <ChevronRight
            className={cn(
              "h-5 w-5 text-emerald-300 hover:text-lime-200 transition-colors",
              className
            )}
            {...props}
          />
        ),
      }}
      {...props}
    />
  )
}
Calendar.displayName = "Calendar"

export { Calendar }

import { ChevronLeftIcon, ChevronRightIcon } from '@radix-ui/react-icons';
import * as React from 'react';
import { DayPicker } from 'react-day-picker';

import { buttonVariants } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export type CalendarProps = React.ComponentProps<typeof DayPicker>;

function Calendar({
  className,
  classNames,
  showOutsideDays = true,
  ...props
}: CalendarProps) {
  return (
    <DayPicker
      showOutsideDays={showOutsideDays}
      className={cn('w-full p-4', className)}
      classNames={{
        months: 'flex justify-center',
        month: 'space-y-5 w-full',

        caption: 'relative flex items-center justify-center',
        caption_label: 'text-xl font-bold',

        nav: 'flex items-center gap-2',

        nav_button: cn(
          buttonVariants({ variant: 'outline' }),
          'h-9 w-9 rounded-lg bg-transparent p-0 hover:bg-accent transition-colors'
        ),

        nav_button_previous: 'absolute left-0',
        nav_button_next: 'absolute right-0',

        table: 'w-full border-collapse',

        head_row: 'grid grid-cols-7 mb-2',

        head_cell:
          'flex h-10 items-center justify-center text-base font-bold text-muted-foreground',

        row: 'grid grid-cols-7 mt-1',

        cell: cn(
          'relative flex items-center justify-center h-10 w-10 mx-auto text-center',
          props.mode === 'range'
            ? '[&:has(>.day-range-end)]:rounded-r-md [&:has(>.day-range-start)]:rounded-l-md'
            : '[&:has([aria-selected])]:rounded-md'
        ),

        day: cn(
          buttonVariants({ variant: 'ghost' }),
          'h-10 w-10 rounded-lg p-0 text-base font-bold transition-all duration-200 hover:bg-accent hover:scale-105'
        ),

        day_selected:
          'bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground',

        day_today:
          'border-2 border-primary text-primary font-extrabold',

        day_outside:
          'text-muted-foreground opacity-40',

        day_disabled:
          'text-muted-foreground opacity-30',

        day_range_start: 'day-range-start',

        day_range_end: 'day-range-end',

        day_range_middle:
          'aria-selected:bg-accent aria-selected:text-accent-foreground',

        day_hidden: 'invisible',

        ...classNames,
      }}
      components={{
        IconLeft: () => <ChevronLeftIcon className="h-5 w-5" />,
        IconRight: () => <ChevronRightIcon className="h-5 w-5" />,
      }}
      {...props}
    />
  );
}

Calendar.displayName = 'Calendar';

export { Calendar };
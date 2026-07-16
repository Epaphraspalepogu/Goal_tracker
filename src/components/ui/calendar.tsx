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
        caption_label: 'text-lg font-semibold',

        nav: 'flex items-center gap-2',

        nav_button: cn(
          buttonVariants({ variant: 'outline' }),
          'h-9 w-9 rounded-lg bg-transparent p-0'
        ),

        nav_button_previous: 'absolute left-0',
        nav_button_next: 'absolute right-0',

        table: 'w-full border-collapse',

        head_row: 'grid grid-cols-7 mb-2',

        head_cell:
          'flex h-10 items-center justify-center text-sm font-medium text-muted-foreground',

        row: 'grid grid-cols-7 mt-1',

        cell:
          'flex items-center justify-center h-10 w-10 mx-auto text-sm relative',

        day: cn(
          buttonVariants({ variant: 'ghost' }),
          'h-10 w-10 rounded-lg p-0 font-medium hover:bg-accent'
        ),

        day_selected:
          'bg-primary text-primary-foreground hover:bg-primary',

        day_today:
          'border border-primary text-primary font-semibold',

        day_outside:
          'text-muted-foreground opacity-40',

        day_disabled:
          'opacity-30',

        day_range_start: 'day-range-start',

        day_range_end: 'day-range-end',

        day_range_middle:
          'aria-selected:bg-accent',

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
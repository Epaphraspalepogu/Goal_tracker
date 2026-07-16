import { useState, useCallback } from 'react';
import { format, addDays, subDays } from 'date-fns';

export function useDateState(initial?: Date) {
  const [date, setDate] = useState(initial ?? new Date());
  const dateISO = format(date, 'yyyy-MM-dd');

  const goPrev = useCallback(() => setDate((d) => subDays(d, 1)), []);
  const goNext = useCallback(() => setDate((d) => addDays(d, 1)), []);
  const goToday = useCallback(() => setDate(new Date()), []);
  const setSpecificDate = useCallback((d: Date) => setDate(d), []);

  return { date, dateISO, goPrev, goNext, goToday, setSpecificDate };
}

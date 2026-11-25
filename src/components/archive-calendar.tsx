"use client";

import ArrowIcon from "@/components/arrow-icon";
import { journalDate } from "@/lib/date-format";

const months = Array.from({ length: 12 }, (_, month) =>
  new Intl.DateTimeFormat("en-CA", { month: "long", timeZone: "UTC" }).format(
    new Date(Date.UTC(2000, month, 1)),
  ),
);

export default function ArchiveCalendar({
  dates,
  month,
  onMonth,
  selected,
  onSelect,
}: {
  dates: string[];
  month: string;
  onMonth: (month: string) => void;
  selected: string;
  onSelect: (date: string) => void;
}) {
  const years = [...new Set(dates.map((date) => date.slice(0, 4)))];
  const [year, monthNumber] = month.split("-").map(Number);
  const first = new Date(Date.UTC(year, monthNumber - 1, 1)).getUTCDay();
  const length = new Date(Date.UTC(year, monthNumber, 0)).getUTCDate();
  const weeks = Math.ceil((first + length) / 7);
  const available = new Set(dates);
  const shift = (step: number) =>
    onMonth(
      new Date(Date.UTC(year, monthNumber - 1 + step, 1))
        .toISOString()
        .slice(0, 7),
    );
  const monthDates = dates.filter((date) => date.startsWith(month));
  return (
    <aside className="archive-calendar" aria-label="Archive calendar">
      <div className="archive-calendar-heading">
        <button
          type="button"
          aria-label="Previous month"
          disabled={month <= dates.at(-1)!.slice(0, 7)}
          onClick={() => shift(-1)}
        >
          <ArrowIcon direction="left" />
        </button>
        <h3 aria-live="polite">
          {months[monthNumber - 1]} {year}
        </h3>
        <button
          type="button"
          aria-label="Next month"
          disabled={month >= dates[0].slice(0, 7)}
          onClick={() => shift(1)}
        >
          <ArrowIcon direction="right" />
        </button>
      </div>
      <div className="archive-calendar-selects">
        <label>
          Year
          <select
            aria-label="Year"
            value={year}
            onChange={({ target }) =>
              onMonth(
                dates
                  .find((date) => date.startsWith(target.value))!
                  .slice(0, 7),
              )
            }
          >
            {years.map((value) => (
              <option key={value}>{value}</option>
            ))}
          </select>
        </label>
        <label>
          Month
          <select
            aria-label="Month"
            value={monthNumber}
            onChange={({ target }) =>
              onMonth(`${year}-${target.value.padStart(2, "0")}`)
            }
          >
            {months.map((name, index) => (
              <option key={name} value={index + 1}>
                {name}
              </option>
            ))}
          </select>
        </label>
      </div>
      <table aria-label={`${months[monthNumber - 1]} ${year}`}>
        <thead>
          <tr>
            {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
              <th key={day} scope="col">
                {day}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {Array.from({ length: weeks }, (_, week) => (
            <tr key={week}>
              {Array.from({ length: 7 }, (_, column) => {
                const day = week * 7 + column - first + 1;
                const date = `${month}-${String(day).padStart(2, "0")}`;
                return (
                  <td key={column}>
                    {day < 1 || day > length ? null : available.has(date) ? (
                      <button
                        type="button"
                        aria-label={`${journalDate(date)}, photographs available`}
                        aria-pressed={selected === date}
                        onClick={() => onSelect(date)}
                      >
                        {day}
                      </button>
                    ) : (
                      <span>{day}</span>
                    )}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
      {!monthDates.length && <p>No photographs this month.</p>}
      <label className="archive-date-jump">
        Jump to a date
        <select
          aria-label="Jump to a date"
          value={selected}
          onChange={({ target }) => {
            if (target.value) onMonth(target.value.slice(0, 7));
            onSelect(target.value);
          }}
        >
          <option value="">Whole archive month</option>
          {dates.map((date) => (
            <option key={date} value={date}>
              {journalDate(date)}
            </option>
          ))}
        </select>
      </label>
    </aside>
  );
}

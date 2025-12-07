"use client";

import * as React from "react";

import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Card, CardContent, CardFooter } from "@/components/ui/card";

type Calendar20Props = {
  date: Date | undefined;
  onDateChange: (date: Date | undefined) => void;
  selectedTime: string | null;
  onTimeChange: (time: string) => void;
};

function timeToString(hour24: number, minute: number) {
  const hour12 = hour24 > 12 ? hour24 - 12 : hour24;
  const suffix = hour24 > 11 && hour24 != 24 ? "PM" : "AM";
  return `${hour12.toString()}:${minute.toString().padStart(2, "0")} ${suffix}`;
}

export default function Calendar20({
  date,
  onDateChange,
  selectedTime,
  onTimeChange,
}: Calendar20Props) {
  const timeSlots = Array.from({ length: 9 }, (_, i) => {
    // DO IT BASED ON ACTUAL MECHANIC AVAILABILITY
    const totalMinutes = i * 60;
    const hour = Math.floor(totalMinutes / 60) + 9; // DO THE START BASED ON ACTUAL MECHANIC AVAILABILITY
    const minute = totalMinutes % 60;
    return timeToString(hour, minute);
  });

  const bookedDates = [
    new Date(2025, 10, 26),
    new Date(2025, 10, 27),
    new Date(2025, 10, 28),
    new Date(2025, 11, 24),
    new Date(2025, 11, 25),
  ];

  return (
    <Card className="gap-0 p-0">
      <CardContent className="p-0">
        <div className="flex">
          {/* Calendar Section */}
          <div className="p-6">
            <Calendar
              mode="single"
              selected={date}
              onSelect={onDateChange}
              defaultMonth={date}
              disabled={bookedDates}
              showOutsideDays={false}
              modifiers={{
                booked: bookedDates,
              }}
              modifiersClassNames={{
                booked: "[&>button]:line-through opacity-100",
              }}
              className="bg-transparent p-0"
              formatters={{
                formatWeekdayName: (date) =>
                  date.toLocaleString("en-US", { weekday: "short" }),
              }}
            />
          </div>

          {/* Time Selector Section */}
          <div className="flex w-40 flex-col border-l">
            <div className="h-[400px] overflow-y-scroll p-4">
              <div className="grid gap-2">
                {timeSlots.map((time) => (
                  <Button
                    key={time}
                    variant={selectedTime === time ? "default" : "outline"}
                    onClick={() => onTimeChange(time)}
                    className="w-full shadow-none text-sm"
                  >
                    {time}
                  </Button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </CardContent>

      <CardFooter className="flex flex-col gap-4 border-t px-6 !py-5 md:flex-row">
        <div className="text-sm">
          {date && selectedTime ? (
            <>
              Your appointment is booked for{" "}
              <span className="font-medium">
                {date?.toLocaleDateString("en-US", {
                  weekday: "long",
                  day: "numeric",
                  month: "long",
                })}
              </span>{" "}
              at <span className="font-medium">{selectedTime}</span>.
            </>
          ) : (
            <>Select a date and time for your appointment.</>
          )}
        </div>
      </CardFooter>
    </Card>
  );
}

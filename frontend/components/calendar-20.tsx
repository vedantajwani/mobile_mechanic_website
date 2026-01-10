"use client"

import * as React from "react"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import { Card, CardContent, CardFooter } from "@/components/ui/card"

export default function Calendar20({
  onDateTimeChange,
}: {
  onDateTimeChange: (dateTime: Date | null) => void
}) {
  const [date, setDate] = React.useState<Date | undefined>(new Date())
  const [selectedTime, setSelectedTime] = React.useState<string | null>(null)

  const timeSlots = Array.from({ length: 37 }, (_, i) => {
    const totalMinutes = i * 15
    const hour = Math.floor(totalMinutes / 60) + 9
    const minute = totalMinutes % 60
    return `${hour.toString().padStart(2, "0")}:${minute
      .toString()
      .padStart(2, "0")}`
  })

  const handleDateSelect = (newDate: Date | undefined) => {
    setDate(newDate)
    updateDateTime(newDate, selectedTime)
  }

  const handleTimeSelect = (time: string) => {
    setSelectedTime(time)
    updateDateTime(date, time)
  }

  const updateDateTime = (d: Date | undefined, t: string | null) => {
    if (d && t) {
      const [hours, minutes] = t.split(":").map(Number)
      const newDateTime = new Date(d)
      newDateTime.setHours(hours, minutes, 0, 0)

      onDateTimeChange(newDateTime)
    } else {
      onDateTimeChange(null)
    }
  }

  return (
    <Card className="gap-0 p-0">
      <CardContent className="p-0">
        <div className="flex">
          {/* Calendar Selection */}
          <div className="p-6">
            <Calendar
              mode="single"
              selected={date}
              onSelect={handleDateSelect}
              showOutsideDays={false}
              className="bg-transparent p-0"
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
                    onClick={() => handleTimeSelect(time)}
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
                {date.toLocaleDateString("en-US", {
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
  )
}

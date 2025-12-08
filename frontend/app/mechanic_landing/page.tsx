"use client";
import "@radix-ui/themes/styles.css";
import React from "react";
import NavBar from "../NavBar";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import SliderDemo from "../mechanic_landing/Slider.jsx";

import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@radix-ui/react-popover";
import {
  MessageSquare,
  CalendarDays,
  CreditCard,
  Check,
  X,
  Pencil,
  Eye,
  EyeOff,
} from "lucide-react";

function MessagingButton() {
  const router = useRouter();
  return (
    <Button
      variant="outline"
      onClick={() => router.push("/messaging")}
      className="flex items-center gap-2 text-base"
    >
      <MessageSquare className="w-4 h-4" /> Messages
    </Button>
  );
}

function BookingButton() {
  const router = useRouter();
  return (
    <Button
      variant="outline"
      onClick={() => router.push("/create_booking")}
      className="flex items-center gap-2 text-base"
    >
      <CalendarDays className="w-4 h-4" /> Create Appointment
    </Button>
  );
}

function BillingButton() {
  const router = useRouter();
  return (
    <Button
      variant="outline"
      onClick={() => router.push("/billing")}
      className="flex items-center gap-2 text-base"
    >
      <CreditCard className="w-4 h-4" /> Billing
    </Button>
  );
}

function AvailabilityButton() {
  const router = useRouter();
  return (
    <Button
      variant="outline"
      onClick={() => router.push("/mechanic_availability")}
      className="flex items-center gap-2 text-base rounded-md"
    >
      <Pencil className="w-4 h-4" /> Edit Availability
    </Button>
  );
}

const API_URL = process.env.NEXT_PUBLIC_API_URL;

type BookingRow = {
  id: string;
  email: string;
  make: string;
  model: string;
  year: string | null;
  address: string;
  description: string;
  datetime: string;
};

function formatDateTime(iso: string) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) {
    return { date: iso, time: "" };
  }
  const date = d.toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });
  const time = d.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
  });
  return { date, time };
}

type Appointment = {
  id: string;
  email: string;
  date: string;
  time: string;
  address: string;
  make: string;
  model: string;
  year: string;
  issue: string;
  datetime: string;
};

export default function Customer_Landing() {
  // Upcoming and previous appointments are now arrays
  const [appointments, setAppointments] = React.useState<Appointment[]>([]);
  const [prevAppointments, setPrevAppointments] = React.useState<Appointment[]>(
    []
  );

  const [bookingsLoading, setBookingsLoading] = React.useState(false);
  const [bookingsError, setBookingsError] = React.useState<string | null>(null);

  const [editingId, setEditingId] = React.useState<string | null>(null);
  const [editedAppointment, setEditedAppointment] =
    React.useState<Appointment | null>(null);

  const [expandedIds, setExpandedIds] = React.useState<Set<string>>(
    () => new Set()
  );

  const [location, setLocation] = React.useState("Amherst, Massachusetts");
  const [draftLocation, setDraftLocation] = React.useState(location);

  const [radius, setRadius] = React.useState(25); // committed value
  const [open, setOpen] = React.useState(false); // whether or not popover is open
  const [draftRadius, setDraftRadius] = React.useState(radius); // temp user value

  const fetchBookings = React.useCallback(async () => {
    setBookingsLoading(true);
    setBookingsError(null);

    try {
      const res = await fetch(`${API_URL}/get-bookings`);

      if (!res.ok) {
        const data = await res.json().catch(() => null);
        const msg = data?.detail || "Failed to load bookings.";
        throw new Error(msg);
      }

      const json = await res.json();
      const rows: BookingRow[] = json.Bookings || json.bookings || [];

      const now = new Date();
      const upcoming: Appointment[] = [];
      const past: Appointment[] = [];

      for (const row of rows) {
        const { date, time } = formatDateTime(row.datetime);
        const base: Appointment = {
          id: String(row.id),
          email: row.email,
          date,
          time,
          address: row.address,
          make: row.make,
          model: row.model,
          year: row.year ?? "",
          issue: row.description,
          datetime: row.datetime,
        };

        const when = new Date(row.datetime);
        if (!Number.isNaN(when.getTime()) && when >= now) {
          upcoming.push(base);
        } else {
          past.push(base);
        }
      }

      upcoming.sort(
        (a, b) =>
          new Date(a.datetime).getTime() - new Date(b.datetime).getTime()
      );
      past.sort(
        (a, b) =>
          new Date(b.datetime).getTime() - new Date(a.datetime).getTime()
      );

      setAppointments(upcoming);
      setPrevAppointments(past);
    } catch (err: any) {
      console.error(err);
      setBookingsError(err.message ?? "Failed to load bookings.");
    } finally {
      setBookingsLoading(false);
    }
  }, []);

  React.useEffect(() => {
    fetchBookings();
  }, [fetchBookings]);

  // Handle edit mode toggle for a specific appointment
  const handleModify = (appointment: Appointment) => {
    setEditedAppointment({ ...appointment });
    setEditingId(appointment.id);
  };

  // Handle cancel edit
  const handleCancelEdit = () => {
    setEditingId(null);
    setEditedAppointment(null);
  };

  // Handle save edit
  const handleSaveEdit = () => {
    if (!editedAppointment || !editingId) return;

    setAppointments((prev) =>
      prev.map((appt) =>
        appt.id === editingId ? { ...editedAppointment } : appt
      )
    );
    setEditingId(null);
    setEditedAppointment(null);
  };

  // Handle input change while editing
  const handleChange = (field: keyof Appointment, value: string) => {
    if (!editedAppointment) return;
    setEditedAppointment({ ...editedAppointment, [field]: value });
  };

  // Toggle showMore for a specific appointment
  const toggleShowMore = (id: string) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <NavBar />

      <div className="max-w-5xl mx-auto p-6 space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-semibold">Admin Information</h1>
        </div>

        {/* Admin Info */}
        <Card className="bg-white p-0 rounded-md">
          <CardContent className="flex flex-col p-6 gap-3">
            <div>
              <h2 className="text-2xl font-semibold mb-2">Admin Panel</h2>
              <p>
                <span className="font-medium">Location:</span> {location}
              </p>
            </div>

            <div className="min-[900px]:flex-shrink min-[900px]:grid min-[900px]:grid-cols-[auto_auto_auto_auto_auto] min-[900px]:justify-stretch grid grid-row gap-4">
              <Popover
                open={open}
                onOpenChange={(o) => {
                  setOpen(o);
                  if (o) setDraftRadius(radius);
                }}
              >
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className="flex items-center gap-2 text-base rounded-md"
                  >
                    <Pencil className="w-4 h-4" /> Edit Location
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-80">
                  <div className="grid gap-4 bg-white outline rounded-md p-6">
                    <div className="space-y-2">
                      <h1 className="leading-none font-semibold text-lg">
                        Location
                      </h1>
                      <p className="text-muted-foreground text-sm">
                        Enter a street address, city, or zip code.
                      </p>
                      <Input
                        id="location"
                        type="text"
                        defaultValue={location}
                        className="col-span-2 h-8"
                        onChange={(e) => setDraftLocation(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            e.preventDefault();
                            setLocation(draftLocation);
                            setRadius(draftRadius);
                            setOpen(false);
                          }
                        }}
                      />
                    </div>
                    <div className="space-y-2 w-full">
                      <h1 className="leading-none font-semibold text-lg">
                        Radius
                      </h1>
                      <p className="text-muted-foreground text-sm">
                        Area of service (in miles).
                      </p>
                      <span className="w-full flex justify-between flex-row">
                        <SliderDemo
                          value={draftRadius}
                          defaultValue={radius}
                          onChange={setDraftRadius}
                          min={0}
                          max={50}
                          step={1}
                        />
                        <p>{draftRadius} mi.</p>
                      </span>
                      <div className="grid justify-stretch grid-cols-[auto_auto] gap-4">
                        <Button
                          variant="secondary"
                          onClick={() => {
                            setDraftRadius(radius);
                            setDraftLocation(location);
                            setOpen(false);
                          }}
                        >
                          <X className="w-4 h-4 mr-1" />
                          Cancel
                        </Button>
                        <Button
                          onClick={() => {
                            setRadius(draftRadius);
                            setLocation(draftLocation);
                            setOpen(false);
                          }}
                        >
                          <Check className="w-4 h-4 mr-1" />
                          Save
                        </Button>
                      </div>
                    </div>
                  </div>
                </PopoverContent>
              </Popover>
              <AvailabilityButton />
              <MessagingButton />
              <BookingButton />
              <BillingButton />
            </div>
          </CardContent>
        </Card>

        {/* Upcoming Appointments */}
        <Card className="bg-white rounded-md">
          <CardHeader>
            <CardTitle className="text-2xl font-semibold">
              Upcoming Appointments
            </CardTitle>
          </CardHeader>

          {bookingsLoading && (
            <div className="text-gray-600 text-center italic">
              Loading appointments…
            </div>
          )}

          {bookingsError && (
            <div className="text-red-600 text-center">{bookingsError}</div>
          )}

          <CardContent className="space-y-4">
            {appointments.length > 0 ? (
              appointments.map((appointment) => {
                const isEditingThis = editingId === appointment.id;
                const isExpanded = expandedIds.has(appointment.id);

                return (
                  <div
                    key={appointment.id}
                    className="border rounded-md bg-gray-50 p-5"
                  >
                    {isEditingThis && editedAppointment ? (
                      <>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700">
                              Date
                            </label>
                            <Input
                              value={editedAppointment.date}
                              onChange={(e) =>
                                handleChange("date", e.target.value)
                              }
                            />
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-gray-700">
                              Time
                            </label>
                            <Input
                              value={editedAppointment.time}
                              onChange={(e) =>
                                handleChange("time", e.target.value)
                              }
                            />
                          </div>

                          <div className="md:col-span-2">
                            <label className="block text-sm font-medium text-gray-700">
                              Address
                            </label>
                            <Input
                              value={editedAppointment.address}
                              onChange={(e) =>
                                handleChange("address", e.target.value)
                              }
                            />
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-gray-700">
                              Make
                            </label>
                            <Input
                              value={editedAppointment.make}
                              onChange={(e) =>
                                handleChange("make", e.target.value)
                              }
                            />
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-gray-700">
                              Model
                            </label>
                            <Input
                              value={editedAppointment.model}
                              onChange={(e) =>
                                handleChange("model", e.target.value)
                              }
                            />
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-gray-700">
                              Year
                            </label>
                            <Input
                              value={editedAppointment.year}
                              onChange={(e) =>
                                handleChange("year", e.target.value)
                              }
                            />
                          </div>

                          <div className="md:col-span-2">
                            <label className="block text-sm font-medium text-gray-700">
                              Issue
                            </label>
                            <Input
                              value={editedAppointment.issue}
                              onChange={(e) =>
                                handleChange("issue", e.target.value)
                              }
                            />
                          </div>
                        </div>

                        <div className="flex gap-4 mt-6">
                          <Button
                            variant="outline"
                            className="flex-1"
                            onClick={handleCancelEdit}
                          >
                            <X className="w-4 h-4 mr-1" /> Cancel
                          </Button>
                          <Button className="flex-1" onClick={handleSaveEdit}>
                            <Check className="w-4 h-4 mr-1" /> Save Changes
                          </Button>
                        </div>
                      </>
                    ) : (
                      <>
                        <p className="font-semibold text-lg mb-2">
                          {appointment.date} at {appointment.time}
                        </p>
                        <p>
                          <span className="font-medium">Address:</span>{" "}
                          {appointment.address}
                        </p>
                        <div className={isExpanded ? "" : "hidden"}>
                          <p>
                            <span className="font-medium">Make:</span>{" "}
                            {appointment.make}
                          </p>
                          <p>
                            <span className="font-medium">Model:</span>{" "}
                            {appointment.model}
                          </p>
                          <p>
                            <span className="font-medium">Year:</span>{" "}
                            {appointment.year}
                          </p>
                          <p>
                            <span className="font-medium">Issue:</span>{" "}
                            {appointment.issue}
                          </p>
                        </div>

                        <div className="flex flex-col md:flex-row gap-4 mt-4">
                          <Button
                            variant="outline"
                            className="flex-1 text-base"
                          >
                            <Eye className="w-4 h-4" />
                            View Images
                          </Button>
                          <Button
                            variant="outline"
                            className="flex-1 text-base"
                            onClick={() => toggleShowMore(appointment.id)}
                          >
                            {isExpanded ? (
                              <EyeOff className="w-4 h-4" />
                            ) : (
                              <Eye className="w-4 h-4" />
                            )}
                            {isExpanded ? "Less Info" : "More Info"}
                          </Button>

                          <Button
                            variant="outline"
                            className="flex-1 text-base"
                          >
                            <MessageSquare className="w-4 h-4" />
                            Message
                          </Button>
                          <Button
                            variant="outline"
                            className="flex-1 text-base"
                            onClick={() => handleModify(appointment)}
                          >
                            <Pencil className="w-4 h-4" />
                            Modify Booking
                          </Button>
                        </div>
                      </>
                    )}
                  </div>
                );
              })
            ) : !bookingsLoading ? (
              <div className="text-gray-600 text-center py-6 italic">
                No upcoming appointments.
              </div>
            ): null }
          </CardContent>
        </Card>

        {/* Previous Appointments */}
        <Card className="bg-white rounded-md">
          <CardHeader>
            <CardTitle className="text-2xl font-semibold">
              Previous Appointments
            </CardTitle>
          </CardHeader>

          {bookingsLoading && (
            <div className="text-gray-600 text-center italic">
              Loading appointments…
            </div>
          )}

          {bookingsError && (
            <div className="text-red-600 text-center">{bookingsError}</div>
          )}

          <CardContent className="space-y-4">
            {prevAppointments.length > 0 ? (
              prevAppointments.map((prev) => (
                <div key={prev.id} className="border rounded-md bg-gray-50 p-5">
                  <p className="font-semibold text-lg mb-2">
                    {prev.date} at {prev.time}{" "}
                  </p>
                  <p>
                    <span className="font-medium">Address:</span> {prev.address}
                  </p>
                  <p>
                    <span className="font-medium">Make:</span> {prev.make}
                  </p>
                  <p>
                    <span className="font-medium">Model:</span> {prev.model}
                  </p>
                  <p>
                    <span className="font-medium">Year:</span> {prev.year}
                  </p>
                  <p className="truncate">
                    <span className="font-medium">Issue:</span> {prev.issue}
                  </p>
                </div>
              ))
            ) : !bookingsLoading ? (
              <div className="text-gray-600 text-center py-6 italic">
                No previous appointments.
              </div>
            ) : null}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

"use client";
import React from "react";
import NavBar from "../NavBar";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  MessageSquare,
  CalendarDays,
  CreditCard,
  Check,
  X,
} from "lucide-react";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";

import { uploadImage, deleteImage } from "@/lib/storage";

import { useAuth } from "@/app/AuthContext";

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

type UiAppointment = {
  id: string;
  date: string;
  time: string;
  address: string;
  make: string;
  model: string;
  year: string;
  issue: string;
  datetime: string;
};

function formatDateTime(iso: string) {
  const d = new Date(iso);
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

export default function Customer_Landing() {
  const router = useRouter();
  const { user, loading } = useAuth();

  const profileName = user?.fullName || "Customer";
  const profileEmail = user?.email || "";
  const profilePhone = user?.phone || "";

  const [allUpcoming, setAllUpcoming] = React.useState<UiAppointment[]>([]);
  const [allPast, setAllPast] = React.useState<UiAppointment[]>([]);

  const [appointment, setAppointment] = React.useState<UiAppointment | null>(
    null
  );
  const [editedAppointment, setEditedAppointment] =
    React.useState<UiAppointment | null>(null);

  const [bookingsLoading, setBookingsLoading] = React.useState(false);
  const [bookingsError, setBookingsError] = React.useState<string | null>(null);

  const [imageDialogOpen, setImageDialogOpen] = React.useState(false);
  const [images, setImages] = React.useState<string[]>([]);
  const [uploadingImage, setUploadingImage] = React.useState(false);
  const fileInputRef = React.useRef<HTMLInputElement | null>(null);

  const [editingId, setEditingId] = React.useState<string | null>(null);

  const [activeImageId, setActiveImageId] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (!loading && !user) {
      router.push("/auth/login");
    }
  }, [loading, user, router]);

  React.useEffect(() => {
    if (!API_URL) {
      console.error("API_BASE is not defined");
      return;
    }

    if (!user || !API_URL) return;

    const email = user.email;
    const controller = new AbortController();
    let cancelled = false;

    const fetchBookings = async () => {
      setBookingsLoading(true);
      setBookingsError(null);

      try {
        const url = `${API_URL}/get-bookings?email=${encodeURIComponent(
          email
        )}`;
        const res = await fetch(url, { signal: controller.signal });

        if (!res.ok) {
          const data = await res.json().catch(() => null);
          const msg = data?.detail || "Failed to load bookings";
          throw new Error(msg);
        }

        const json = await res.json();
        const rows: BookingRow[] = json.Bookings || [];
        const now = new Date();

        const mapped: UiAppointment[] = rows.map((b) => {
          const { date, time } = formatDateTime(b.datetime);
          return {
            id: b.id,
            date,
            time,
            address: b.address,
            make: b.make,
            model: b.model,
            year: b.year ?? "",
            issue: b.description,
            datetime: b.datetime,
          };
        });

        const upcoming = mapped
          .filter((a) => new Date(a.datetime) >= now)
          .sort(
            (a, b) =>
              new Date(a.datetime).getTime() - new Date(b.datetime).getTime()
          );

        const past = mapped
          .filter((a) => new Date(a.datetime) < now)
          .sort(
            (a, b) =>
              new Date(b.datetime).getTime() - new Date(a.datetime).getTime()
          );

        if (cancelled) return;

        setAllUpcoming(upcoming);
        setAllPast(past);
        setAppointment(upcoming[0] || past[0] || null);
      } catch (err: any) {
        if (err?.name === "AbortError" || cancelled) return;
        console.error(err);
        setBookingsError(err.message ?? "Failed to load bookings");
      } finally {
        if (!cancelled) {
          setBookingsLoading(false);
        }
      }
    };

    fetchBookings();

    return () => {
      cancelled = true;
      controller.abort();
    };
  }, [user, router]);

  // Handle edit mode toggle
  const handleModify = (apt: UiAppointment) => {
    setEditedAppointment({ ...apt });
    setEditingId(apt.id);
  };

  // Handle cancel
  const handleCancel = () => {
    setEditingId(null);
    setEditedAppointment(null);
  };

  // Handle save
  const handleSave = async () => {
    if (!editedAppointment || !editingId) return;

    if (!user) {
      alert("You must be signed in to edit a booking.");
      return;
    }

    let newDateTimeIso = editedAppointment.datetime;

    if (editedAppointment.date && editedAppointment.time) {
      const combined = new Date(
        `${editedAppointment.date} ${editedAppointment.time}`
      );

      if (isNaN(combined.getTime())) {
        alert(
          "Please enter a valid date and time (e.g. 2025-12-31 and 15:00 or December 31, 2025 and 3:00 PM)."
        );
        return;
      }

      newDateTimeIso = combined.toISOString();
    }

    const payload = {
      id: editingId, 
      email: user.email, 
      make: editedAppointment.make,
      model: editedAppointment.model,
      year: editedAppointment.year || null,
      address: editedAppointment.address,
      description: editedAppointment.issue,
      datetime: newDateTimeIso, 
    };

    try {
      const res = await fetch(`${API_URL}/edit-booking`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => null);
        const msg = data?.detail || "Failed to update booking.";
        throw new Error(msg);
      }

      setAllUpcoming((prev) =>
        prev.map((a) =>
          a.id === editingId
            ? { ...a, ...editedAppointment, datetime: newDateTimeIso }
            : a
        )
      );

      setAllPast((prev) =>
        prev.map((a) =>
          a.id === editingId
            ? { ...a, ...editedAppointment, datetime: newDateTimeIso }
            : a
        )
      );

      setEditingId(null);
      setEditedAppointment(null);
    } catch (err: any) {
      console.error(err);
      alert(err.message ?? "Failed to update booking.");
    }
  };

  // Handle input change
  const handleChange = (field: keyof UiAppointment, value: string) => {
    if (!editedAppointment) return;
    setEditedAppointment({ ...editedAppointment, [field]: value });
  };

  const handleOpenImages = (apt: UiAppointment) => {
    setActiveImageId(apt.id);
    setImageDialogOpen(true);
  };

  const handleImageFileChange = async (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setUploadingImage(true);
      const { imageUrl, error } = await uploadImage({
        file,
        bucket: "booking-images",
      });

      if (error || !imageUrl) {
        console.error(error || "Image upload failed");
        alert("Image upload failed");
        return;
      }

      setImages((prev) => [...prev, imageUrl]);
    } finally {
      setUploadingImage(false);
      e.target.value = "";
    }
  };

  const handleDeleteImage = async (url: string) => {
    const { error } = await deleteImage(url);
    if (error) {
      console.error(error);
      alert("Failed to delete image");
      return;
    }

    setImages((prev) => prev.filter((u) => u !== url));
  };

  if (loading || !user) {
    return (
      <div className="min-h-screen bg-gray-50">
        <NavBar />
        <div className="max-w-5xl mx-auto p-6 bg-white text-xl text-center mt-8">
          Loading...
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <NavBar />

      <div className="max-w-5xl mx-auto p-6 space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-semibold">Account Information</h1>
        </div>

        {/* Personal Info */}
        <Card className="bg-white p-0 rounded-md">
          <CardContent className="flex flex-col md:flex-row justify-between items-start md:items-center p-6 gap-3">
            <div>
              <h2 className="text-2xl font-semibold mb-2">
                Personal Information
              </h2>
              <p>
                <span className="font-medium">Name:</span> {profileName}
              </p>
              <p>
                <span className="font-medium">Email:</span> {profileEmail}
              </p>
              {profilePhone && (
                <p>
                  <span className="font-medium">Phone Number:</span>{" "}
                  {profilePhone}
                </p>
              )}
            </div>

            <div className="flex flex-col sm:flex-row gap-4">
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

          <CardContent>
            {bookingsLoading && (
              <div className="text-gray-600 text-center italic">
                Loading appointments…
              </div>
            )}

            {bookingsError && (
              <div className="text-red-600 text-center">{bookingsError}</div>
            )}

            {allUpcoming.length != 0 ? (
              <div className="space-y-4">
                {allUpcoming.map((apt) => {
                  const isThisEditing = editingId === apt.id;
                  const current =
                    isThisEditing && editedAppointment
                      ? editedAppointment
                      : apt;

                  return (
                    <div
                      key={apt.id}
                      className="border rounded-md bg-gray-50 p-5"
                    >
                      {isThisEditing ? (
                        <>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                              <label className="block text-sm font-medium text-gray-700">
                                Date
                              </label>
                              <Input
                                value={current.date}
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
                                value={current.time}
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
                                value={current.address}
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
                                value={current.make}
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
                                value={current.model}
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
                                value={current.year}
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
                                value={current.issue}
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
                              onClick={handleCancel}
                            >
                              <X className="w-4 h-4 mr-1" /> Cancel
                            </Button>
                            <Button className="flex-1" onClick={handleSave}>
                              <Check className="w-4 h-4 mr-1" /> Save Changes
                            </Button>
                          </div>
                        </>
                      ) : (
                        <>
                          <p className="font-semibold text-lg mb-2">
                            {current.date}
                          </p>
                          <p>
                            <span className="font-medium">Time:</span>{" "}
                            {current.time}
                          </p>
                          <p>
                            <span className="font-medium">Address:</span>{" "}
                            {current.address}
                          </p>
                          <p>
                            <span className="font-medium">Make:</span>{" "}
                            {current.make}
                          </p>
                          <p>
                            <span className="font-medium">Model:</span>{" "}
                            {current.model}
                          </p>
                          {current.year && (
                            <p>
                              <span className="font-medium">Year:</span>{" "}
                              {current.year}
                            </p>
                          )}
                          <p className="truncate">
                            <span className="font-medium">Issue:</span>{" "}
                            {current.issue}
                          </p>

                          <div className="flex flex-col sm:flex-row gap-4 mt-4">
                            <Button
                              variant="outline"
                              className="flex-1 text-base"
                              onClick={() => handleOpenImages(apt)}
                            >
                              View/Upload Images
                            </Button>
                            <Button
                              variant="outline"
                              className="flex-1 text-base"
                              onClick={() => handleModify(apt)}
                            >
                              Modify Booking
                            </Button>
                          </div>
                        </>
                      )}
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-gray-600 text-center py-6 italic">
                No upcoming appointments.
              </div>
            )}
          </CardContent>
        </Card>

        {/* Past Appointments */}
        <Card className="bg-white rounded-md">
          <CardHeader>
            <CardTitle className="text-2xl font-semibold">
              Past Appointments
            </CardTitle>
          </CardHeader>

          <CardContent>
            {allPast.length === 0 ? (
              <div className="text-gray-600 text-center py-6 italic">
                No past appointments.
              </div>
            ) : (
              <div className="space-y-4">
                {allPast.map((apt) => (
                  <div
                    key={apt.id}
                    className="border rounded-md bg-gray-50 p-4"
                  >
                    <p className="font-semibold text-lg mb-2">{apt.date}</p>
                    <p>
                      <span className="font-medium">Time:</span> {apt.time}
                    </p>
                    <p>
                      <span className="font-medium">Address:</span>{" "}
                      {apt.address}
                    </p>
                    <p>
                      <span className="font-medium">Make:</span> {apt.make}
                    </p>
                    <p>
                      <span className="font-medium">Model:</span> {apt.model}
                    </p>
                    {apt.year && (
                      <p>
                        <span className="font-medium">Year:</span> {apt.year}
                      </p>
                    )}
                    <p className="">
                      <span className="font-medium">Issue:</span> {apt.issue}
                    </p>
                    {/* read-only: no buttons */}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
      <Dialog
        open={imageDialogOpen}
        onOpenChange={(open) => setImageDialogOpen(open)}
      >
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Appointment Images</DialogTitle>
            <DialogDescription>
              Upload and view images for this appointment.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {/* Hidden file input */}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleImageFileChange}
            />

            <Button
              type="button"
              variant="outline"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploadingImage}
            >
              {uploadingImage ? "Uploading..." : "Upload Image"}
            </Button>

            {/* Thumbnails */}
            {images.length === 0 ? (
              <p className="text-sm text-gray-500">No images uploaded yet.</p>
            ) : (
              <div className="flex flex-wrap gap-3">
                {images.map((url) => (
                  <div
                    key={url}
                    className="relative w-24 h-24 rounded-md overflow-hidden border"
                  >
                    <img
                      src={url}
                      alt="Appointment image"
                      className="w-full h-full object-cover"
                    />
                    <button
                      type="button"
                      className="absolute top-1 right-1 bg-white/80 rounded-full px-1 text-xs"
                      onClick={() => handleDeleteImage(url)}
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>
            )}
            <div className="flex justify-end pt-4">
              <Button
                variant="default"
                onClick={() => setImageDialogOpen(false)}
              >
                OK
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

"use client";
import NavBar from "../NavBar";
import Calendar20 from "@/components/calendar-20";
import React from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";

export default function Create_Booking() {
  const router = useRouter();

  // form state
  const [email, setEmail] = React.useState("");
  const [make, setMake] = React.useState("");
  const [model, setModel] = React.useState("");
  const [year, setYear] = React.useState("");
  const [issue, setIssue] = React.useState("");
  const [address, setAddress] = React.useState("");
  const [city, setCity] = React.useState("");
  const [zip, setZip] = React.useState("");
  const [selectedDate, setSelectedDate] = React.useState<Date | null>(new Date());
  const [image, setImage] = React.useState<string | null>(null);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    console.log("Selected datetime:", selectedDate)
  }, [selectedDate])

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  // here I assume it takes value + onChange(Date), and I think it works
  const handleDateChange = (date: Date | undefined) => {
    setSelectedDate(date ?? null);
  };

  const handleSubmit = async () => {
    try {
      setLoading(true);
      setError(null);

      if (!selectedDate) {
        setError("Please select a date.");
        setLoading(false);
        return;
      }

      // Build a full address or keep separate if your backend wants separate fields
      const fullAddress = `${address}, ${city}, ${zip}`.trim();

      const payload = {
        email,
        make,
        model,
        year: year || null,
        address: fullAddress,
        description: issue,
        datetime: selectedDate.toISOString(), // FastAPI will parse 
      };

      const apiBaseUrl = "http://127.0.0.1:8000";
      console.log("API base URL used in fetch (localhost)")

      const res = await fetch(`${apiBaseUrl}/add-new-booking`, {
          method: "POST",
          headers: {
          "Content-Type": "application/json",
        },
        // test mode example: `${apiBaseUrl}/add-new-booking?test=true`
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.detail || "Failed to create booking");
      }

      router.push("/customer_landing");
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <NavBar />

      <div className="max-w-5xl mx-auto p-6">
        <h1 className="text-3xl font-bold mb-6">Create Booking</h1>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Calendar20 onDateTimeChange={setSelectedDate} />

          <Card className="p-6">
            <h2 className="text-xl font-semibold mb-4">Vehicle Information</h2>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="make">Make</Label>
                <Input
                  id="make"
                  value={make}
                  onChange={(e) => setMake(e.target.value)}
                  placeholder="e.g., Toyota"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="model">Model</Label>
                <Input
                  id="model"
                  value={model}
                  onChange={(e) => setModel(e.target.value)}
                  placeholder="e.g., Camry"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="year">Year</Label>
                <Input
                  id="year"
                  type="number"
                  value={year}
                  onChange={(e) => setYear(e.target.value)}
                  placeholder="e.g., 2020"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="issue">Issue Description</Label>
                <Input
                  id="issue"
                  value={issue}
                  onChange={(e) => setIssue(e.target.value)}
                  placeholder="Describe the problem"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="image">Upload Image</Label>
                <Input
                  id="image"
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="file:text-muted-foreground"
                />
                {image && (
                  <div className="mt-2">
                    <img
                      src={image}
                      alt="Preview"
                      className="w-full h-32 object-cover rounded"
                    />
                  </div>
                )}
              </div>
            </div>
          </Card>

          <Card className="p-6 md:col-span-2">
            <h2 className="text-xl font-semibold mb-4">Location</h2>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="address">Address</Label>
                <Input
                  id="address"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="Street address"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="city">City</Label>
                  <Input
                    id="city"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    placeholder="City"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="zip">ZIP Code</Label>
                  <Input
                    id="zip"
                    value={zip}
                    onChange={(e) => setZip(e.target.value)}
                    placeholder="ZIP"
                  />
                </div>
              </div>
            </div>
          </Card>
        </div>

        {error && (
          <p className="mt-4 text-sm text-red-600">
            {error}
          </p>
        )}

        <div className="mt-6 flex justify-end gap-4">
          <Button
            variant="outline"
            onClick={() => router.push("/customer_landing")}
            disabled={loading}
          >
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={loading}>
            {loading ? "Submitting..." : "Submit Booking"}
          </Button>
        </div>
      </div>
    </div>
  );
}

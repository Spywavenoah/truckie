"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Spinner } from "@/components/ui/spinner";

const ASSET_TYPES = ["TRUCK", "EQUIPMENT", "MATERIAL"] as const;

const STEP_LABELS = ["Type & Category", "Basic Info", "Pricing & Location", "Images", "Review & Submit"];

interface FormData {
  type: string;
  category: string;
  title: string;
  description: string;
  make: string;
  model: string;
  year: string;
  plateNumber: string;
  capacity: string;
  unit: string;
  pricePerDay: string;
  pricePerHour: string;
  pricePerTon: string;
  location: string;
  state: string;
  lga: string;
  images: File[];
}

const initialFormData: FormData = {
  type: "",
  category: "",
  title: "",
  description: "",
  make: "",
  model: "",
  year: "",
  plateNumber: "",
  capacity: "",
  unit: "",
  pricePerDay: "",
  pricePerHour: "",
  pricePerTon: "",
  location: "",
  state: "",
  lga: "",
  images: [],
};

export default function NewListingPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [form, setForm] = useState<FormData>(initialFormData);
  const [categories, setCategories] = useState<{ id: string; name: string }[]>([]);
  const [states, setStates] = useState<{ id: string; name: string; lgas: { id: string; name: string }[] }[]>([]);
  const [selectedStateLgas, setSelectedStateLgas] = useState<{ id: string; name: string }[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const objectUrls = useRef<string[]>([]);

  function getImageUrl(file: File): string {
    const url = URL.createObjectURL(file);
    objectUrls.current.push(url);
    return url;
  }

  useEffect(() => {
    const urls = objectUrls.current;
    return () => { urls.forEach(URL.revokeObjectURL); };
  }, []);
  useEffect(() => {
    const prev = objectUrls.current;
    objectUrls.current = [];
    return () => { prev.forEach(URL.revokeObjectURL); };
  }, [form.images]);

  useEffect(() => {
    fetch("/api/content/categories")
      .then((r) => r.json())
      .then((json) => { if (json.success) setCategories(json.data); })
      .catch(() => {});
    fetch("/api/content/states")
      .then((r) => r.json())
      .then((json) => { if (json.success) setStates(json.data); })
      .catch(() => {});
  }, []);

  const update = useCallback(<K extends keyof FormData>(field: K, value: FormData[K]) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  }, []);

  const handleImageAdd = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = Array.from(e.target.files || []);
      setForm((prev) => ({ ...prev, images: [...prev.images, ...files].slice(0, 5) }));
    },
    []
  );

  const removeImage = useCallback((index: number) => {
    setForm((prev) => ({ ...prev, images: prev.images.filter((_, i) => i !== index) }));
  }, []);

  const canNext = (): boolean => {
    switch (step) {
      case 1:
        return !!form.type;
      case 2:
        return form.title.trim().length >= 3;
      case 3:
        return !!form.pricePerDay || !!form.pricePerHour || !!form.pricePerTon;
      default:
        return true;
    }
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    setError("");
    try {
      const body: Record<string, unknown> = {
        type: form.type,
        category: form.category || undefined,
        title: form.title,
        description: form.description || undefined,
        make: form.make || undefined,
        model: form.model || undefined,
        year: form.year ? parseInt(form.year) : undefined,
        plateNumber: form.plateNumber || undefined,
        capacity: form.capacity ? parseFloat(form.capacity) : undefined,
        unit: form.unit || undefined,
        pricePerDay: form.pricePerDay ? parseFloat(form.pricePerDay) : undefined,
        pricePerHour: form.pricePerHour ? parseFloat(form.pricePerHour) : undefined,
        pricePerTon: form.pricePerTon ? parseFloat(form.pricePerTon) : undefined,
        location: form.location || undefined,
        state: form.state || undefined,
        lga: form.lga || undefined,
      };

      const res = await fetch("/api/assets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || "Failed to create listing");
      }

      if (form.images.length > 0) {
        const uploadData = new FormData();
        uploadData.set("assetId", json.data.id);
        for (const file of form.images) {
          uploadData.append("files", file);
        }
        await fetch("/api/upload", { method: "POST", body: uploadData });
      }

      router.push("/dashboard/owner/listings");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setSubmitting(false);
    }
  };

  const inputClass =
    "flex h-10 w-full rounded-md border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-900 placeholder:text-neutral-400 focus:border-accent-light focus:outline-none focus:ring-1 focus:ring-accent-light disabled:cursor-not-allowed disabled:opacity-50";
  const textareaClass =
    "flex min-h-[100px] w-full rounded-md border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-900 placeholder:text-neutral-400 focus:border-accent-light focus:outline-none focus:ring-1 focus:ring-accent-light";

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-neutral-900">New Listing</h1>
        <p className="mt-1 text-sm text-neutral-500">Create a new asset listing.</p>
      </div>

      {/* Progress indicator */}
      <div className="flex items-center gap-2">
        {STEP_LABELS.map((label, i) => {
          const idx = i + 1;
          return (
            <div key={idx} className="flex items-center gap-2 flex-1">
              <div
                className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-bold ${
                  idx === step
                    ? "bg-primary text-white"
                    : idx < step
                      ? "bg-success text-white"
                      : "bg-neutral-200 text-neutral-500"
                }`}
              >
                {idx < step ? "✓" : idx}
              </div>
              <span
                className={`hidden text-xs sm:inline ${idx === step ? "font-semibold text-neutral-900" : "text-neutral-500"}`}
              >
                {label}
              </span>
              {i < STEP_LABELS.length - 1 && <div className="h-px flex-1 bg-neutral-200" />}
            </div>
          );
        })}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Step {step}: {STEP_LABELS[step - 1]}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {error && (
            <div className="rounded-md border border-danger bg-red-50 px-4 py-3 text-sm text-danger">
              {error}
            </div>
          )}

          {step === 1 && (
            <>
              <div>
                <Label>Asset Type</Label>
                <div className="mt-2 flex gap-3">
                  {ASSET_TYPES.map((t) => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => {
                        update("type", t);
                        update("category", "");
                      }}
                      className={`flex-1 rounded-md border-2 px-4 py-3 text-center text-sm font-semibold transition-colors ${
                        form.type === t
                          ? "border-accent-light bg-accent-light/10 text-accent-light"
                          : "border-neutral-200 bg-white text-neutral-600 hover:border-neutral-300"
                      }`}
                    >
                      {t.charAt(0) + t.slice(1).toLowerCase()}
                    </button>
                  ))}
                </div>
              </div>
              {form.type && (
                <div>
                  <Label htmlFor="category">Category</Label>
                  <select
                    id="category"
                    value={form.category}
                    onChange={(e) => update("category", e.target.value)}
                    className={`${inputClass} appearance-none`}
                  >
                    <option value="">Select category</option>
                    {categories.map((c) => (
                      <option key={c.id} value={c.name}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </>
          )}

          {step === 2 && (
            <>
              <div>
                <Label htmlFor="title">Title *</Label>
                <Input
                  id="title"
                  value={form.title}
                  onChange={(e) => update("title", e.target.value)}
                  placeholder="e.g. Dump Truck 20-ton"
                />
              </div>
              <div>
                <Label htmlFor="description">Description</Label>
                <textarea
                  id="description"
                  value={form.description}
                  onChange={(e) => update("description", e.target.value)}
                  placeholder="Describe the asset condition, features, etc."
                  className={textareaClass}
                />
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <Label htmlFor="make">Make</Label>
                  <Input
                    id="make"
                    value={form.make}
                    onChange={(e) => update("make", e.target.value)}
                    placeholder="e.g. Toyota"
                  />
                </div>
                <div>
                  <Label htmlFor="model">Model</Label>
                  <Input
                    id="model"
                    value={form.model}
                    onChange={(e) => update("model", e.target.value)}
                    placeholder="e.g. Hino 500"
                  />
                </div>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <Label htmlFor="year">Year</Label>
                  <Input
                    id="year"
                    type="number"
                    min={1990}
                    max={2030}
                    value={form.year}
                    onChange={(e) => update("year", e.target.value)}
                    placeholder="e.g. 2023"
                  />
                </div>
                {form.type === "TRUCK" && (
                  <div>
                    <Label htmlFor="plateNumber">Plate Number</Label>
                    <Input
                      id="plateNumber"
                      value={form.plateNumber}
                      onChange={(e) => update("plateNumber", e.target.value)}
                      placeholder="e.g. LAG 123 XYZ"
                    />
                  </div>
                )}
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <Label htmlFor="capacity">Capacity</Label>
                  <Input
                    id="capacity"
                    type="number"
                    step="any"
                    value={form.capacity}
                    onChange={(e) => update("capacity", e.target.value)}
                    placeholder="e.g. 20"
                  />
                </div>
                <div>
                  <Label htmlFor="unit">Unit</Label>
                  <Input
                    id="unit"
                    value={form.unit}
                    onChange={(e) => update("unit", e.target.value)}
                    placeholder="e.g. tons, cubic yards"
                  />
                </div>
              </div>
            </>
          )}

          {step === 3 && (
            <>
              <div className="grid gap-4 sm:grid-cols-2">
                {form.type !== "MATERIAL" && (
                  <>
                    <div>
                      <Label htmlFor="pricePerDay">Price per Day (₦)</Label>
                      <Input
                        id="pricePerDay"
                        type="number"
                        step="any"
                        value={form.pricePerDay}
                        onChange={(e) => update("pricePerDay", e.target.value)}
                        placeholder="e.g. 85000"
                      />
                    </div>
                    <div>
                      <Label htmlFor="pricePerHour">Price per Hour (₦)</Label>
                      <Input
                        id="pricePerHour"
                        type="number"
                        step="any"
                        value={form.pricePerHour}
                        onChange={(e) => update("pricePerHour", e.target.value)}
                        placeholder="e.g. 12000"
                      />
                    </div>
                  </>
                )}
                {form.type === "MATERIAL" && (
                  <div>
                    <Label htmlFor="pricePerTon">Price per Ton (₦)</Label>
                    <Input
                      id="pricePerTon"
                      type="number"
                      step="any"
                      value={form.pricePerTon}
                      onChange={(e) => update("pricePerTon", e.target.value)}
                      placeholder="e.g. 5000"
                    />
                  </div>
                )}
              </div>
              <div className="grid gap-4 sm:grid-cols-3">
                <div>
                  <Label htmlFor="location">Location</Label>
                  <Input
                    id="location"
                    value={form.location}
                    onChange={(e) => update("location", e.target.value)}
                    placeholder="e.g. Ikeja"
                  />
                </div>
                <div>
                  <Label htmlFor="state">State</Label>
                  <select
                    id="state"
                    value={form.state}
                    onChange={(e) => {
                      update("state", e.target.value);
                      update("lga", "");
                      const s = states.find((st) => st.name === e.target.value);
                      setSelectedStateLgas(s?.lgas || []);
                    }}
                    className={`${inputClass} appearance-none`}
                  >
                    <option value="">Select state</option>
                    {states.map((s) => (
                      <option key={s.id} value={s.name}>{s.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <Label htmlFor="lga">LGA</Label>
                  <select
                    id="lga"
                    value={form.lga}
                    onChange={(e) => update("lga", e.target.value)}
                    className={`${inputClass} appearance-none`}
                  >
                    <option value="">Select LGA</option>
                    {selectedStateLgas.map((l) => (
                      <option key={l.id} value={l.name}>{l.name}</option>
                    ))}
                  </select>
                </div>
              </div>
            </>
          )}

          {step === 4 && (
            <div>
              <Label>Images (up to 5)</Label>
              <div className="mt-2 flex flex-wrap gap-3">
                {form.images.map((file, i) => (
                  <div key={i} className="relative h-24 w-24 overflow-hidden rounded-md border border-neutral-200">
                    <img
                      src={getImageUrl(file)}
                      alt={`Preview ${i + 1}`}
                      className="h-full w-full object-cover"
                    />
                    <button
                      type="button"
                      onClick={() => removeImage(i)}
                      className="absolute right-1 top-1 flex h-5 w-5 items-center justify-center rounded-full bg-danger text-xs text-white"
                    >
                      ×
                    </button>
                  </div>
                ))}
                {form.images.length < 5 && (
                  <label className="flex h-24 w-24 cursor-pointer items-center justify-center rounded-md border-2 border-dashed border-neutral-300 text-neutral-400 hover:border-accent-light hover:text-accent-light">
                    <span className="text-2xl font-bold">+</span>
                    <input
                      type="file"
                      accept="image/*"
                      multiple
                      onChange={handleImageAdd}
                      className="hidden"
                    />
                  </label>
                )}
              </div>
              <p className="mt-2 text-xs text-neutral-400">
                Upload up to 5 images. First image will be the primary.
              </p>
            </div>
          )}

          {step === 5 && (
            <div className="space-y-3 text-sm">
              <h3 className="font-semibold text-neutral-900">Review your listing</h3>
              <div className="grid grid-cols-2 gap-2">
                <ReviewItem label="Type" value={form.type} />
                <ReviewItem label="Category" value={form.category} />
                <ReviewItem label="Title" value={form.title} />
                <ReviewItem label="Description" value={form.description} />
                <ReviewItem label="Make" value={form.make} />
                <ReviewItem label="Model" value={form.model} />
                <ReviewItem label="Year" value={form.year} />
                {form.type === "TRUCK" && <ReviewItem label="Plate Number" value={form.plateNumber} />}
                <ReviewItem label="Capacity" value={form.capacity ? `${form.capacity} ${form.unit || ""}` : ""} />
                <ReviewItem label="Price per Day" value={form.pricePerDay ? `₦${parseFloat(form.pricePerDay).toLocaleString()}` : ""} />
                <ReviewItem label="Price per Hour" value={form.pricePerHour ? `₦${parseFloat(form.pricePerHour).toLocaleString()}` : ""} />
                <ReviewItem label="Price per Ton" value={form.pricePerTon ? `₦${parseFloat(form.pricePerTon).toLocaleString()}` : ""} />
                <ReviewItem label="Location" value={form.location} />
                <ReviewItem label="State" value={form.state} />
                <ReviewItem label="LGA" value={form.lga} />
                <ReviewItem label="Images" value={`${form.images.length} file(s)`} />
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Navigation */}
      <div className="flex items-center justify-between">
        <Button variant="outline" onClick={() => setStep((s) => Math.max(1, s - 1))} disabled={step === 1}>
          Back
        </Button>
        {step < 5 ? (
          <Button onClick={() => setStep((s) => s + 1)} disabled={!canNext()}>
            Next
          </Button>
        ) : (
          <Button onClick={handleSubmit} disabled={submitting}>
            {submitting ? <><Spinner size="sm" className="mr-2" /> Submitting...</> : "Submit Listing"}
          </Button>
        )}
      </div>
    </div>
  );
}

function ReviewItem({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <span className="text-neutral-500">{label}:</span>{" "}
      <span className="text-neutral-900">{value || "—"}</span>
    </div>
  );
}

import { useRef, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input, Label, Select, Textarea } from "@/components/ui/input";
import type { Vehicle } from "@/data/types";
import { createVehicle, uploadVehiclePhoto } from "@/lib/api";
import { firstIssue, vehicleInputSchema } from "@/lib/vehicle-input";
import { uniqueSorted } from "@/lib/vehicles";

type Props = {
  existing: Vehicle[]; // used to suggest spellings that already exist (keeps filters tidy)
  onCreated: (vehicle: Vehicle) => void;
  onCancel: () => void;
};

export function AddVehicleForm({ existing, onCreated, onCancel }: Props) {
  const [images, setImages] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const fileInput = useRef<HTMLInputElement>(null);

  // <datalist> suggestions: typing "SU" offers the existing "SUV", so "Suv"/"suv" variants
  // don't create duplicate entries in the public search filters.
  const suggest = (pick: (v: Vehicle) => string) => uniqueSorted(existing.map(pick));

  async function onFiles(files: FileList | null) {
    if (!files?.length) return;
    setUploading(true);
    // One at a time: simpler error reporting and keeps the server's memory use low.
    for (const file of Array.from(files)) {
      try {
        const url = await uploadVehiclePhoto(file);
        setImages((prev) => [...prev, url]);
      } catch (error) {
        toast.error(`${file.name}: ${error instanceof Error ? error.message : "upload failed"}`);
      }
    }
    setUploading(false);
    if (fileInput.current) fileInput.current.value = ""; // allow re-picking the same file
  }

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const str = (key: string) => String(data.get(key) ?? "");
    const badge = str("badge");

    const parsed = vehicleInputSchema.safeParse({
      make: str("make"),
      model: str("model"),
      trim: str("trim"),
      year: str("year"),
      price: str("price"),
      mileage: str("mileage"),
      body: str("body"),
      fuel: str("fuel"),
      transmission: str("transmission"),
      drivetrain: str("drivetrain"),
      engine: str("engine"),
      color: str("color"),
      interiorColor: str("interiorColor"),
      vin: str("vin"),
      status: str("status"),
      badge: badge === "new" || badge === "reserved" ? badge : undefined,
      featured: data.get("featured") === "on",
      description: str("description"),
      horsepower: str("horsepower"),
      torque: str("torque"),
      zeroToSixty: str("zeroToSixty"),
      topSpeed: str("topSpeed"),
      images,
    });
    if (!parsed.success) {
      toast.error(firstIssue(parsed.error));
      return;
    }

    setSaving(true);
    try {
      const vehicle = await createVehicle(parsed.data);
      toast.success(`${vehicle.year} ${vehicle.name} added to the inventory.`);
      onCreated(vehicle);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not add the vehicle.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="mt-8 rounded-2xl bg-surface p-6 shadow-card md:p-8">
      <div className="flex items-center justify-between">
        <h2 className="font-serif text-2xl text-ink">Add a vehicle</h2>
        <Button type="button" variant="ghost" size="sm" onClick={onCancel}>
          Cancel
        </Button>
      </div>

      <datalist id="dl-make">{suggest((v) => v.make).map((x) => <option key={x} value={x} />)}</datalist>
      <datalist id="dl-body">{suggest((v) => v.body).map((x) => <option key={x} value={x} />)}</datalist>
      <datalist id="dl-fuel">{suggest((v) => v.fuel).map((x) => <option key={x} value={x} />)}</datalist>
      <datalist id="dl-trans">{suggest((v) => v.transmission).map((x) => <option key={x} value={x} />)}</datalist>

      <fieldset className="mt-6">
        <legend className="text-micro font-semibold tracking-mark text-muted uppercase">Photos</legend>
        <p className="mt-1 text-xs text-muted">JPG, PNG or WebP, up to 8 MB each. The first photo is the main one.</p>
        <div className="mt-3 grid grid-cols-3 gap-3 sm:grid-cols-4 lg:grid-cols-6">
          {images.map((src, index) => (
            <div key={src} className="relative overflow-hidden rounded-lg ring-1 ring-line">
              <img src={src} alt="" className="aspect-4/3 w-full object-cover" />
              {index === 0 ? (
                <span className="absolute top-1 left-1 rounded bg-navy px-1.5 py-0.5 text-[0.6rem] text-inverse">Main</span>
              ) : (
                <button
                  type="button"
                  onClick={() => setImages((prev) => [src, ...prev.filter((x) => x !== src)])}
                  className="absolute top-1 left-1 rounded bg-surface/90 px-1.5 py-0.5 text-[0.6rem] text-ink hover:bg-surface"
                >
                  Make main
                </button>
              )}
              <button
                type="button"
                aria-label="Remove photo"
                onClick={() => setImages((prev) => prev.filter((x) => x !== src))}
                className="absolute top-1 right-1 grid size-6 place-items-center rounded-full bg-surface/90 text-xs text-ink hover:bg-surface"
              >
                ✕
              </button>
            </div>
          ))}
          <button
            type="button"
            disabled={uploading || images.length >= 12}
            onClick={() => fileInput.current?.click()}
            className="grid aspect-4/3 place-items-center rounded-lg text-xs text-muted ring-1 ring-line ring-dashed hover:bg-canvas disabled:opacity-50"
          >
            {uploading ? "Uploading…" : "+ Add photos"}
          </button>
        </div>
        <input
          ref={fileInput}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          multiple
          className="hidden"
          onChange={(event) => void onFiles(event.target.files)}
        />
      </fieldset>

      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Field label="Make *"><Input name="make" list="dl-make" required maxLength={60} placeholder="Toyota" /></Field>
        <Field label="Model *"><Input name="model" required maxLength={60} placeholder="Land Cruiser" /></Field>
        <Field label="Trim / variant"><Input name="trim" maxLength={60} placeholder="V8 ZX" /></Field>
        <Field label="Year *"><Input name="year" type="number" required min={1950} max={new Date().getFullYear() + 1} placeholder="2023" /></Field>
        <Field label="Price (USD) *"><Input name="price" type="number" required min={1} step="any" placeholder="98000" /></Field>
        <Field label="Mileage (miles) *"><Input name="mileage" type="number" required min={0} placeholder="12000" /></Field>
        <Field label="Body type *"><Input name="body" list="dl-body" required maxLength={40} placeholder="SUV" /></Field>
        <Field label="Fuel *"><Input name="fuel" list="dl-fuel" required maxLength={40} placeholder="Diesel" /></Field>
        <Field label="Transmission *"><Input name="transmission" list="dl-trans" required maxLength={60} placeholder="Automatic" /></Field>
        <Field label="Drivetrain"><Input name="drivetrain" maxLength={60} placeholder="4WD" /></Field>
        <Field label="Engine"><Input name="engine" maxLength={80} placeholder="3.3L V6 Twin-Turbo" /></Field>
        <Field label="VIN / chassis no. *"><Input name="vin" required maxLength={20} placeholder="JTMXXXXXXXXXXXXXX" className="uppercase" /></Field>
        <Field label="Exterior colour *"><Input name="color" required maxLength={60} placeholder="Pearl White" /></Field>
        <Field label="Interior colour"><Input name="interiorColor" maxLength={60} placeholder="Black leather" /></Field>
        <Field label="Status *">
          <Select name="status" defaultValue="available">
            <option value="available">Available</option>
            <option value="pending">Pending</option>
            <option value="sold">Sold</option>
          </Select>
        </Field>
        <Field label="Badge">
          <Select name="badge" defaultValue="">
            <option value="">None</option>
            <option value="new">New arrival</option>
            <option value="reserved">Reserved</option>
          </Select>
        </Field>
        <label className="flex items-end gap-2 pb-3 text-sm text-ink">
          <input type="checkbox" name="featured" className="size-4 accent-[var(--color-accent)]" />
          Show on the homepage (featured)
        </label>
      </div>

      <div className="mt-4">
        <Label htmlFor="description">Description *</Label>
        <Textarea id="description" name="description" required maxLength={3000} placeholder="Condition, history, standout features…" />
      </div>

      <fieldset className="mt-6">
        <legend className="text-micro font-semibold tracking-mark text-muted uppercase">Technical details (optional)</legend>
        <div className="mt-3 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Field label="Horsepower"><Input name="horsepower" maxLength={40} placeholder="304 hp" /></Field>
          <Field label="Torque"><Input name="torque" maxLength={40} placeholder="516 lb-ft" /></Field>
          <Field label="0–60 mph"><Input name="zeroToSixty" maxLength={40} placeholder="6.7 seconds" /></Field>
          <Field label="Top speed"><Input name="topSpeed" maxLength={40} placeholder="137 mph" /></Field>
        </div>
      </fieldset>

      <div className="mt-8 flex gap-3">
        <Button type="submit" disabled={saving || uploading}>
          {saving ? "Saving…" : "Add to inventory"}
        </Button>
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
      </div>
    </form>
  );
}

// A wrapping <label> ties the text to its input for screen readers and makes the label clickable.
function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs font-medium tracking-wide text-muted">{label}</span>
      {children}
    </label>
  );
}

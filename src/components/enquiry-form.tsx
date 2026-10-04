import { useState } from "react";
import { toast } from "sonner";
import { submitInquiry } from "@/lib/api";
import { useVehicles } from "@/lib/vehicles";
import { Button } from "./ui/button";
import { Input, Label, Select, Textarea } from "./ui/input";

export function EnquiryForm({ defaultVehicle = "" }: { defaultVehicle?: string }) {
  const [pending, setPending] = useState(false);
  const vehicles = useVehicles();

  return (
    <form
      className="grid gap-4 md:grid-cols-2"
      onSubmit={async (event) => {
        event.preventDefault();
        const form = event.currentTarget;
        const data = new FormData(form);
        const payload = {
          firstName: String(data.get("firstName") ?? "").trim(),
          lastName: String(data.get("lastName") ?? "").trim(),
          email: String(data.get("email") ?? "").trim(),
          phone: String(data.get("phone") ?? "").trim(),
          vehicle: String(data.get("vehicle") ?? "").trim(),
          message: String(data.get("message") ?? "").trim(),
        };
        if (payload.message.length < 8) {
          toast.error("Please tell us a little more in your message.");
          return;
        }
        setPending(true);
        try {
          await submitInquiry(payload);
          form.reset();
          toast.success("Your enquiry is with the atelier. A curator will reply shortly.");
        } catch (error) {
          toast.error(error instanceof Error ? error.message : "Unable to send just now.");
        } finally {
          setPending(false);
        }
      }}
    >
      <div>
        <Label htmlFor="firstName">First name</Label>
        <Input id="firstName" name="firstName" required maxLength={60} autoComplete="given-name" />
      </div>
      <div>
        <Label htmlFor="lastName">Last name</Label>
        <Input id="lastName" name="lastName" required maxLength={60} autoComplete="family-name" />
      </div>
      <div>
        <Label htmlFor="email">Email address</Label>
        <Input id="email" name="email" type="email" required maxLength={120} autoComplete="email" />
      </div>
      <div>
        <Label htmlFor="phone">Phone number</Label>
        <Input id="phone" name="phone" required maxLength={32} autoComplete="tel" />
      </div>
      <div className="md:col-span-2">
        <Label htmlFor="vehicle">Vehicle of interest</Label>
        <Select id="vehicle" name="vehicle" defaultValue={defaultVehicle}>
          <option value="">General enquiry</option>
          {vehicles.map((item) => (
            <option key={item.id} value={`${item.year} ${item.name} ${item.trim}`}>
              {item.year} {item.name} {item.trim}
            </option>
          ))}
        </Select>
      </div>
      <div className="md:col-span-2">
        <Label htmlFor="message">Message</Label>
        <Textarea
          id="message"
          name="message"
          required
          minLength={8}
          maxLength={2000}
          placeholder="Tell us what you are looking for."
        />
      </div>
      <div className="md:col-span-2">
        <Button type="submit" disabled={pending} className="min-w-40">
          {pending ? "Sending…" : "Send message"}
        </Button>
      </div>
    </form>
  );
}

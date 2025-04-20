"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Package, Plus } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { createKit, updateKit } from "@/lib/services/kit-service";
import { RaceKit, RaceKitSize, RaceKitType } from "@/types/volunteer";

interface KitManagementFormProps {
  eventId: string;
  kit?: RaceKit; // Optional kit for editing mode
  onSuccess?: (kit: RaceKit) => void;
  triggerButton?: React.ReactNode;
}

const KIT_SIZES: RaceKitSize[] = ['XS', 'S', 'M', 'L', 'XL', 'XXL'];
const KIT_TYPES: RaceKitType[] = ['standard', 'premium', 'elite'];

export default function KitManagementForm({
  eventId,
  kit,
  onSuccess,
  triggerButton,
}: KitManagementFormProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form state
  const [size, setSize] = useState<RaceKitSize>('M');
  const [type, setType] = useState<RaceKitType>('standard');
  const [quantity, setQuantity] = useState(0);

  // Initialize form values when editing an existing kit
  useEffect(() => {
    if (kit) {
      setSize(kit.size);
      setType(kit.type);
      setQuantity(kit.quantity);
    }
  }, [kit]);

  // Reset form when dialog closes
  useEffect(() => {
    if (!isOpen && !kit) {
      setSize('M');
      setType('standard');
      setQuantity(0);
      setError(null);
    }
  }, [isOpen, kit]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    try {
      setIsLoading(true);

      if (quantity < 0) {
        setError("Quantity must be zero or greater.");
        return;
      }

      let result: RaceKit;

      if (kit) {
        // Update existing kit
        result = await updateKit(kit.kit_id, {
          size,
          type,
          quantity,
        });
      } else {
        // Create new kit
        result = await createKit({
          event_id: eventId,
          size,
          type,
          quantity,
        });
      }

      // Call success callback
      if (onSuccess) {
        onSuccess(result);
      }

      setIsOpen(false);
    } catch (err: any) {
      console.error("Error saving kit:", err);
      setError(err.message || "Failed to save kit");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        {triggerButton || (
          <Button size="sm">
            <Plus className="h-4 w-4 mr-1" />
            {kit ? "Edit Kit" : "Add Kit"}
          </Button>
        )}
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            <div className="flex items-center">
              <Package className="mr-2 h-5 w-5" />
              {kit ? "Edit Race Kit" : "Add New Race Kit"}
            </div>
          </DialogTitle>
          <DialogDescription>
            {kit
              ? "Update the details of this race kit."
              : "Create a new race kit for participants."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Size</label>
            <Select
              value={size}
              onValueChange={(value) => setSize(value as RaceKitSize)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select size" />
              </SelectTrigger>
              <SelectContent>
                {KIT_SIZES.map((size) => (
                  <SelectItem key={size} value={size}>
                    {size}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Type</label>
            <Select
              value={type}
              onValueChange={(value) => setType(value as RaceKitType)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select type" />
              </SelectTrigger>
              <SelectContent>
                {KIT_TYPES.map((type) => (
                  <SelectItem key={type} value={type}>
                    {type.charAt(0).toUpperCase() + type.slice(1)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Quantity</label>
            <Input
              type="number"
              min={0}
              value={quantity}
              onChange={(e) => setQuantity(parseInt(e.target.value) || 0)}
              placeholder="Enter quantity"
            />
          </div>

          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsOpen(false)}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? "Saving..." : kit ? "Update Kit" : "Create Kit"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
} 
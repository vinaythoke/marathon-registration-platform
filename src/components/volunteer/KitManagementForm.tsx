"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { AlertCircle, Package, Plus } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { createKit, updateKit } from "@/lib/services/kit-service";
import { RaceKit } from "@/types/volunteer";

interface KitManagementFormProps {
  eventId: string;
  kit?: RaceKit; // Optional kit for editing mode
  onSuccess?: (kit: RaceKit) => void;
  triggerButton?: React.ReactNode;
}

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
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [totalQuantity, setTotalQuantity] = useState(0);

  // Initialize form values when editing an existing kit
  useEffect(() => {
    if (kit) {
      setName(kit.name);
      setDescription(kit.description || "");
      setTotalQuantity(kit.total_quantity);
    }
  }, [kit]);

  // Reset form when dialog closes
  useEffect(() => {
    if (!isOpen && !kit) {
      setName("");
      setDescription("");
      setTotalQuantity(0);
      setError(null);
    }
  }, [isOpen, kit]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    try {
      setIsLoading(true);

      if (totalQuantity <= 0) {
        setError("Quantity must be greater than zero.");
        return;
      }

      let result: RaceKit;

      if (kit) {
        // Update existing kit
        result = await updateKit(kit.id, {
          name,
          description,
          total_quantity: totalQuantity,
        });
      } else {
        // Create new kit
        result = await createKit({
          event_id: eventId,
          name,
          description,
          total_quantity: totalQuantity,
          distributed_quantity: 0,
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

        <form onSubmit={handleSubmit} className="space-y-4 py-4">
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className="space-y-2">
            <Label htmlFor="name">Kit Name</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., Standard Runner Kit"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description (Optional)</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe the contents of this kit..."
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="quantity">Total Quantity</Label>
            <Input
              id="quantity"
              type="number"
              min="1"
              value={totalQuantity || ""}
              onChange={(e) => setTotalQuantity(parseInt(e.target.value) || 0)}
              required
            />
            <p className="text-xs text-muted-foreground">
              Total number of kits available for distribution
            </p>
          </div>

          <DialogFooter className="pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsOpen(false)}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading
                ? "Saving..."
                : kit
                ? "Update Kit"
                : "Create Kit"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
} 
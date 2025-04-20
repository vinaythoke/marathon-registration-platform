"use client";

import { useState, useEffect } from "react";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { 
  Table, 
  TableHeader, 
  TableBody, 
  TableHead, 
  TableRow, 
  TableCell 
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, Package, Clock, AlertCircle } from "lucide-react";
import { getKitDistributionsByRegistration } from "@/lib/services/kit-service";
import { KitDistribution, PickupStatus } from "@/types/volunteer";
import { cn } from "@/lib/utils";

interface KitDistributionListProps {
  registrationId: string;
}

export default function KitDistributionList({ registrationId }: KitDistributionListProps) {
  const [distributions, setDistributions] = useState<KitDistribution[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadKitDistributions() {
      try {
        setIsLoading(true);
        const data = await getKitDistributionsByRegistration(registrationId);
        setDistributions(data);
        setError(null);
      } catch (err: any) {
        console.error("Error loading kit distributions:", err);
        setError(err.message || "Failed to load kit distributions");
      } finally {
        setIsLoading(false);
      }
    }

    loadKitDistributions();
  }, [registrationId]);

  const getStatusBadge = (status: PickupStatus) => {
    switch (status) {
      case "PICKED_UP":
        return (
          <Badge variant="outline" className="bg-green-50 text-green-800">
            <CheckCircle className="h-3 w-3 mr-1" /> Picked Up
          </Badge>
        );
      case "READY":
        return (
          <Badge variant="outline" className="bg-blue-50 text-blue-800">
            <Package className="h-3 w-3 mr-1" /> Ready for Pickup
          </Badge>
        );
      case "PENDING":
        return (
          <Badge variant="outline" className="bg-yellow-50 text-yellow-800">
            <Clock className="h-3 w-3 mr-1" /> Pending
          </Badge>
        );
      default:
        return (
          <Badge variant="outline" className="bg-gray-50 text-gray-800">
            <AlertCircle className="h-3 w-3 mr-1" /> Unknown
          </Badge>
        );
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <Package className="h-5 w-5 text-muted-foreground" />
          <div>
            <CardTitle>Race Kit Distribution</CardTitle>
            <CardDescription>
              {distributions.length === 0
                ? "No race kits have been assigned yet"
                : "Track your race kit status and pickup details"}
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="py-4 text-center text-muted-foreground">
            Loading kit distributions...
          </div>
        ) : error ? (
          <div className="py-4 text-center text-destructive">
            {error}
          </div>
        ) : distributions.length === 0 ? (
          <div className="py-6 text-center">
            <Package className="h-12 w-12 mx-auto mb-3 text-muted-foreground/50" />
            <p className="text-muted-foreground">Your race kit has not been assigned yet.</p>
            <p className="text-xs text-muted-foreground mt-1">
              You will be notified when your race kit is ready for pickup.
            </p>
          </div>
        ) : (
          <>
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Kit Details</TableHead>
                    <TableHead>Size</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Pickup Location</TableHead>
                    <TableHead>Notes</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {distributions.map((distribution) => (
                    <TableRow key={distribution.id}>
                      <TableCell className="font-medium">
                        <div className="flex flex-col">
                          <span>{distribution.kit?.name || "Unknown Kit"}</span>
                          {distribution.pickup_date && (
                            <span className="text-xs text-muted-foreground">
                              Pickup: {new Date(distribution.pickup_date).toLocaleDateString()}
                            </span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>{distribution.kit?.size || "-"}</TableCell>
                      <TableCell>{distribution.kit?.type || "-"}</TableCell>
                      <TableCell>
                        {getStatusBadge(distribution.status)}
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col">
                          <span>{distribution.pickup_location || "-"}</span>
                          {distribution.pickup_time && (
                            <span className="text-xs text-muted-foreground">
                              Time: {distribution.pickup_time}
                            </span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="max-w-[200px]">
                        <p className="truncate" title={distribution.notes || "-"}>
                          {distribution.notes || "-"}
                        </p>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
            <div className="mt-4 space-y-2">
              <p className="text-sm text-muted-foreground">
                Please bring a valid ID when picking up your race kit.
              </p>
              <p className="text-xs text-muted-foreground">
                If you have any questions about your race kit, please contact the event organizers.
              </p>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
} 
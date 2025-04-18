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
import { CheckCircle, Package } from "lucide-react";
import { getKitDistributionsByRegistration } from "@/lib/services/kit-service";
import { KitDistribution } from "@/types/volunteer";

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

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <Package className="h-5 w-5 text-muted-foreground" />
          <div>
            <CardTitle>Race Kit Distribution</CardTitle>
            <CardDescription>
              {distributions.length === 0
                ? "No race kits have been distributed yet"
                : "Race kits that have been distributed to you"}
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
            <p className="text-muted-foreground">Your race kit is not ready for pickup yet.</p>
            <p className="text-xs text-muted-foreground mt-1">
              Race kits will be available for pickup at the event.
            </p>
          </div>
        ) : (
          <>
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Kit Type</TableHead>
                    <TableHead>Distributed Date</TableHead>
                    <TableHead>Distributed By</TableHead>
                    <TableHead>Notes</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {distributions.map((distribution) => (
                    <TableRow key={distribution.id}>
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-2">
                          {distribution.kit?.name || "Unknown Kit"}
                          <Badge variant="outline" className="bg-green-50 text-green-800">
                            <CheckCircle className="h-3 w-3 mr-1" /> Received
                          </Badge>
                        </div>
                      </TableCell>
                      <TableCell>
                        {new Date(distribution.distributed_at).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        {distribution.distributor?.name || "Unknown"}
                      </TableCell>
                      <TableCell className="max-w-[200px] truncate">
                        {distribution.notes || "-"}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
            <p className="text-xs text-muted-foreground mt-4">
              If you have any questions about your race kit, please contact the event organizers.
            </p>
          </>
        )}
      </CardContent>
    </Card>
  );
} 
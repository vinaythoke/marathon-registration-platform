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
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { AlertCircle, CheckCircle, Package, Pencil, Plus, QrCode, Search, Trash2 } from "lucide-react";
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogHeader, 
  DialogTitle,
  DialogFooter,
  DialogTrigger
} from "@/components/ui/dialog";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import QRCodeScanner from "../QRCodeScanner";
import { Progress } from "@/components/ui/progress";
import KitManagementForm from "../KitManagementForm";
import { useKitRealTimeUpdates } from "@/hooks/useKitRealTimeUpdates";

// Import service functions
import { getKits, getKitDistributions, distributeKit, deleteKit } from "@/lib/services/kit-service";
import { RaceKit, KitDistribution } from "@/types/volunteer";

interface KitDistributionTabProps {
  eventId: string;
}

export default function KitDistributionTab({ eventId }: KitDistributionTabProps) {
  const [kits, setKits] = useState<RaceKit[]>([]);
  const [distributions, setDistributions] = useState<KitDistribution[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [filteredDistributions, setFilteredDistributions] = useState<KitDistribution[]>([]);
  
  // QR code scanner state
  const [qrScannerOpen, setQrScannerOpen] = useState(false);
  const [scanMessage, setScanMessage] = useState<string | null>(null);
  const [scanSuccess, setScanSuccess] = useState(false);
  
  // Kit distribution dialog state
  const [distributionDialogOpen, setDistributionDialogOpen] = useState(false);
  const [selectedKit, setSelectedKit] = useState<RaceKit | null>(null);
  const [registrationId, setRegistrationId] = useState<string>("");
  const [processingDistribution, setProcessingDistribution] = useState(false);
  const [notes, setNotes] = useState<string>("");

  // Add state for kit management
  const [selectedKitForEdit, setSelectedKitForEdit] = useState<RaceKit | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [kitToDelete, setKitToDelete] = useState<RaceKit | null>(null);
  const [isDeletingKit, setIsDeletingKit] = useState(false);

  // Set up real-time updates
  const { isSubscribed, error: realtimeError } = useKitRealTimeUpdates(
    eventId,
    (updatedKits) => {
      setKits(updatedKits);
    },
    (updatedDistributions) => {
      setDistributions(updatedDistributions);
      setFilteredDistributions(updatedDistributions);
    }
  );

  // Load kits and distribution data
  useEffect(() => {
    async function loadData() {
      try {
        setIsLoading(true);
        
        // Fetch kits for this event
        const kitsData = await getKits(eventId);
        setKits(kitsData);
        
        // Fetch distributions for this event
        const distributionsData = await getKitDistributions(eventId);
        setDistributions(distributionsData);
        setFilteredDistributions(distributionsData);
        
        setError(null);
      } catch (err: any) {
        console.error("Error loading kit data:", err);
        setError(err.message || "Failed to load kit distribution data");
      } finally {
        setIsLoading(false);
      }
    }
    
    loadData();
  }, [eventId]);

  // Filter distributions based on search query
  useEffect(() => {
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      const filtered = distributions.filter(
        (distribution) =>
          distribution.kit?.name.toLowerCase().includes(query) ||
          distribution.registration_id.toLowerCase().includes(query) ||
          distribution.distributor?.name?.toLowerCase().includes(query)
      );
      setFilteredDistributions(filtered);
    } else {
      setFilteredDistributions(distributions);
    }
  }, [distributions, searchQuery]);

  // Handle QR code scan
  const handleQRScan = async (data: string) => {
    try {
      setScanMessage("Processing QR code...");
      setScanSuccess(false);
      
      // Parse the QR code data
      const qrData = JSON.parse(data);
      
      // Validate that this is a registration QR code
      if (qrData.type !== "registration") {
        setScanMessage("Invalid QR code: Not a registration code");
        return;
      }
      
      // Open the distribution dialog with the registration ID
      setRegistrationId(qrData.registrationId);
      setQrScannerOpen(false);
      setDistributionDialogOpen(true);
      setScanSuccess(true);
      
    } catch (err: any) {
      console.error("Error processing QR code:", err);
      setScanMessage(`Error: ${err.message}`);
    }
  };

  // Handle kit distribution
  const handleDistributeKit = async () => {
    if (!selectedKit || !registrationId) return;
    
    try {
      setProcessingDistribution(true);
      
      // Call the service function to record the kit distribution
      const newDistribution = await distributeKit(
        selectedKit.id,
        registrationId,
        notes
      );
      
      // Update local state with the new distribution
      setDistributions([newDistribution, ...distributions]);
      
      // Update the kit's distributed quantity
      setKits(
        kits.map((kit) =>
          kit.id === selectedKit.id
            ? { ...kit, distributed_quantity: kit.distributed_quantity + 1 }
            : kit
        )
      );
      
      // Reset form and close dialog
      setSelectedKit(null);
      setRegistrationId("");
      setNotes("");
      setDistributionDialogOpen(false);
      
    } catch (err: any) {
      console.error("Error distributing kit:", err);
      setError(err.message || "Failed to distribute kit");
    } finally {
      setProcessingDistribution(false);
    }
  };

  // Handle kit deletion
  const handleDeleteKit = async () => {
    if (!kitToDelete) return;
    
    try {
      setIsDeletingKit(true);
      
      await deleteKit(kitToDelete.id);
      
      // Update local state by removing the deleted kit
      setKits(kits.filter(kit => kit.id !== kitToDelete.id));
      
      setDeleteDialogOpen(false);
      setKitToDelete(null);
      
    } catch (err: any) {
      console.error("Error deleting kit:", err);
      setError(err.message || "Failed to delete kit");
    } finally {
      setIsDeletingKit(false);
    }
  };

  // Handle kit creation/update success
  const handleKitSaved = (updatedKit: RaceKit) => {
    if (selectedKitForEdit) {
      // Update kit in the list
      setKits(kits.map(kit => kit.id === updatedKit.id ? updatedKit : kit));
      setSelectedKitForEdit(null);
    } else {
      // Add new kit to the list
      setKits([...kits, updatedKit]);
    }
  };

  return (
    <div className="space-y-6">
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Real-time status indicator */}
      {isSubscribed && (
        <div className="bg-green-50 border border-green-200 text-green-800 text-xs px-3 py-1 rounded flex items-center mb-2">
          <div className="w-2 h-2 bg-green-500 rounded-full mr-2 animate-pulse"></div>
          Real-time updates active
        </div>
      )}

      {realtimeError && (
        <Alert variant="destructive" className="mb-4">
          <AlertDescription>
            Failed to connect to real-time updates: {realtimeError}
          </AlertDescription>
        </Alert>
      )}

      {/* Kit inventory section */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Race Kit Inventory</CardTitle>
            <CardDescription>
              Available race kits for this event
            </CardDescription>
          </div>
          <div>
            <KitManagementForm 
              eventId={eventId}
              onSuccess={handleKitSaved}
              kit={selectedKitForEdit}
              triggerButton={
                <Button size="sm">
                  <Plus className="h-4 w-4 mr-1" />
                  Add Kit
                </Button>
              }
            />
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="py-8 text-center">Loading kit inventory...</div>
          ) : kits.length === 0 ? (
            <div className="py-8 text-center">
              <p className="text-muted-foreground">No race kits have been added for this event yet.</p>
              <p className="text-muted-foreground text-sm mt-2">Click "Add Kit" to create race kits for distribution.</p>
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {kits.map((kit) => (
                <Card key={kit.id} className="overflow-hidden">
                  <CardHeader className="p-4 pb-2">
                    <div className="flex justify-between items-start">
                      <CardTitle className="text-base">{kit.name}</CardTitle>
                      <div className="flex space-x-1">
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-7 w-7" 
                          onClick={() => setSelectedKitForEdit(kit)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-7 w-7 text-destructive" 
                          onClick={() => {
                            setKitToDelete(kit);
                            setDeleteDialogOpen(true);
                          }}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                    <CardDescription className="text-xs line-clamp-2">
                      {kit.description || "No description provided"}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="p-4 pt-0">
                    <div className="space-y-3">
                      <div>
                        <div className="flex justify-between text-sm mb-1">
                          <span>Distribution Progress</span>
                          <span className="text-muted-foreground">
                            {kit.distributed_quantity} / {kit.total_quantity}
                          </span>
                        </div>
                        <Progress 
                          value={(kit.distributed_quantity / kit.total_quantity) * 100} 
                          className="h-2" 
                        />
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <div>
                          <Badge variant={kit.available_quantity > 0 ? "outline" : "destructive"} className="mr-2">
                            {kit.available_quantity > 0 
                              ? `${kit.available_quantity} Available` 
                              : "Out of stock"}
                          </Badge>
                        </div>
                        <Button 
                          size="sm" 
                          variant="outline"
                          disabled={kit.available_quantity <= 0}
                          onClick={() => {
                            setSelectedKit(kit);
                            setDistributionDialogOpen(true);
                          }}
                        >
                          Distribute
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Kit distribution history */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Distribution History</CardTitle>
            <CardDescription>
              Record of all distributed race kits
            </CardDescription>
          </div>
          <div className="flex gap-2">
            <Dialog open={qrScannerOpen} onOpenChange={setQrScannerOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm">
                  <QrCode className="h-4 w-4 mr-2" />
                  Scan QR
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Scan Registration QR Code</DialogTitle>
                  <DialogDescription>
                    Scan a participant's registration QR code to distribute a kit.
                  </DialogDescription>
                </DialogHeader>
                
                <QRCodeScanner onScan={handleQRScan} onError={(msg) => setScanMessage(msg)} />
                
                {scanMessage && (
                  <Alert variant={scanSuccess ? "default" : "destructive"} className="mt-4">
                    <AlertTitle>{scanSuccess ? "Success" : "Error"}</AlertTitle>
                    <AlertDescription>{scanMessage}</AlertDescription>
                  </Alert>
                )}
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          <div className="mb-4">
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Search distributions..."
                className="pl-8"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>

          {isLoading ? (
            <div className="py-8 text-center">Loading distributions...</div>
          ) : filteredDistributions.length === 0 ? (
            <div className="py-8 text-center">
              <p className="text-muted-foreground">
                {searchQuery
                  ? "No distributions found matching your search."
                  : "No kits have been distributed yet."}
              </p>
            </div>
          ) : (
            <div className="border rounded-md">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Kit Type</TableHead>
                    <TableHead>Registration ID</TableHead>
                    <TableHead className="hidden md:table-cell">Distributed By</TableHead>
                    <TableHead className="hidden sm:table-cell">Date</TableHead>
                    <TableHead>Notes</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredDistributions.map((distribution) => (
                    <TableRow key={distribution.id}>
                      <TableCell>{distribution.kit?.name || "Unknown Kit"}</TableCell>
                      <TableCell className="font-mono text-xs">
                        {distribution.registration_id.substring(0, 8)}...
                      </TableCell>
                      <TableCell className="hidden md:table-cell">
                        {distribution.distributor?.name || "Unknown"}
                      </TableCell>
                      <TableCell className="hidden sm:table-cell">
                        {new Date(distribution.distributed_at).toLocaleDateString()}
                      </TableCell>
                      <TableCell className="max-w-[150px] truncate">
                        {distribution.notes || "-"}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Kit Distribution Dialog */}
      <Dialog open={distributionDialogOpen} onOpenChange={setDistributionDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Distribute Race Kit</DialogTitle>
            <DialogDescription>
              Record a race kit distribution to a participant.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Registration ID</label>
              <Input
                value={registrationId}
                onChange={(e) => setRegistrationId(e.target.value)}
                placeholder="Enter registration ID or scan QR"
              />
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium">Kit Type</label>
              <select
                className="w-full h-10 px-3 py-2 text-sm rounded-md border border-input bg-background"
                value={selectedKit?.id || ""}
                onChange={(e) => {
                  const kitId = e.target.value;
                  const kit = kits.find((k) => k.id === kitId) || null;
                  setSelectedKit(kit);
                }}
              >
                <option value="">Select a kit type</option>
                {kits
                  .filter((kit) => kit.available_quantity > 0)
                  .map((kit) => (
                    <option key={kit.id} value={kit.id}>
                      {kit.name} ({kit.available_quantity} available)
                    </option>
                  ))}
              </select>
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium">Notes (Optional)</label>
              <Input
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Add any additional notes"
              />
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setDistributionDialogOpen(false)} disabled={processingDistribution}>
              Cancel
            </Button>
            <Button 
              onClick={handleDistributeKit} 
              disabled={!selectedKit || !registrationId || processingDistribution}
            >
              {processingDistribution ? "Processing..." : "Distribute Kit"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Kit Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Race Kit</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this race kit? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          
          {kitToDelete && (
            <div className="py-4">
              <p><span className="font-medium">Kit Name:</span> {kitToDelete.name}</p>
              <p><span className="font-medium">Total Quantity:</span> {kitToDelete.total_quantity}</p>
              <p><span className="font-medium">Distributed:</span> {kitToDelete.distributed_quantity}</p>
              
              {kitToDelete.distributed_quantity > 0 && (
                <Alert className="mt-4">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    Warning: {kitToDelete.distributed_quantity} kits have already been distributed.
                    Deleting this kit will not remove distribution records.
                  </AlertDescription>
                </Alert>
              )}
            </div>
          )}
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)} disabled={isDeletingKit}>
              Cancel
            </Button>
            <Button 
              variant="destructive" 
              onClick={handleDeleteKit} 
              disabled={isDeletingKit}
            >
              {isDeletingKit ? "Deleting..." : "Delete Kit"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* If using KitManagementForm to edit a kit that was selected earlier,
          but the user closed the dialog, we need to reset selectedKitForEdit */}
      {selectedKitForEdit && (
        <KitManagementForm 
          eventId={eventId}
          kit={selectedKitForEdit}
          onSuccess={handleKitSaved}
          triggerButton={<span className="hidden" />}
        />
      )}
    </div>
  );
} 
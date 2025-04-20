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

// Import service functions
import { 
  getEventKits, 
  getEventKitAssignments, 
  assignKit, 
  markKitAsPickedUp,
  cancelKitAssignment,
  deleteKit 
} from "@/lib/services/kit-service";
import { 
  RaceKit, 
  RaceKitWithEvent, 
  KitAssignment, 
  KitAssignmentWithDetails,
  RaceKitStatus,
  PickupStatus
} from "@/types/volunteer";

interface KitDistributionTabProps {
  eventId: string;
}

export default function KitDistributionTab({ eventId }: KitDistributionTabProps) {
  const [kits, setKits] = useState<RaceKitWithEvent[]>([]);
  const [assignments, setAssignments] = useState<KitAssignmentWithDetails[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [filteredAssignments, setFilteredAssignments] = useState<KitAssignmentWithDetails[]>([]);
  
  // QR code scanner state
  const [qrScannerOpen, setQrScannerOpen] = useState(false);
  const [scanMessage, setScanMessage] = useState<string | null>(null);
  const [scanSuccess, setScanSuccess] = useState(false);
  
  // Kit assignment dialog state
  const [assignmentDialogOpen, setAssignmentDialogOpen] = useState(false);
  const [selectedKit, setSelectedKit] = useState<RaceKit | null>(null);
  const [registrationId, setRegistrationId] = useState<string>("");
  const [processingAssignment, setProcessingAssignment] = useState(false);
  const [notes, setNotes] = useState<string>("");

  // Add state for kit management
  const [selectedKitForEdit, setSelectedKitForEdit] = useState<RaceKit | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [kitToDelete, setKitToDelete] = useState<RaceKit | null>(null);
  const [isDeletingKit, setIsDeletingKit] = useState(false);

  // Load initial data
  useEffect(() => {
    loadKitsAndAssignments();
  }, [eventId]);

  // Filter assignments when search query changes
  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredAssignments(assignments);
      return;
    }

    const query = searchQuery.toLowerCase();
    const filtered = assignments.filter((assignment) => {
      const user = assignment.registration.user;
      return (
        user.full_name.toLowerCase().includes(query) ||
        user.email.toLowerCase().includes(query) ||
        assignment.registration_id.toLowerCase().includes(query)
      );
    });

    setFilteredAssignments(filtered);
  }, [searchQuery, assignments]);

  const loadKitsAndAssignments = async () => {
    try {
      setIsLoading(true);
      const [kitsData, assignmentsData] = await Promise.all([
        getEventKits(eventId),
        getEventKitAssignments(eventId)
      ]);
      
      setKits(kitsData);
      setAssignments(assignmentsData);
      setFilteredAssignments(assignmentsData);
    } catch (err: any) {
      console.error("Error loading kits and assignments:", err);
      setError(err.message || "Failed to load kit data");
    } finally {
      setIsLoading(false);
    }
  };

  const handleQRCodeScanned = (data: string) => {
    setRegistrationId(data);
    setQrScannerOpen(false);
    setScanMessage("Registration ID scanned successfully");
    setScanSuccess(true);
  };

  const handleAssignKit = async () => {
    if (!selectedKit || !registrationId) return;
    
    try {
      setProcessingAssignment(true);
      
      await assignKit(selectedKit.kit_id, registrationId, notes);
      
      // Reload data to get updated assignments
      await loadKitsAndAssignments();
      
      setAssignmentDialogOpen(false);
      setSelectedKit(null);
      setRegistrationId("");
      setNotes("");
      
    } catch (err: any) {
      console.error("Error assigning kit:", err);
      setError(err.message || "Failed to assign kit");
    } finally {
      setProcessingAssignment(false);
    }
  };

  const handleMarkAsPickedUp = async (assignmentId: string) => {
    try {
      await markKitAsPickedUp(assignmentId);
      await loadKitsAndAssignments();
    } catch (err: any) {
      console.error("Error marking kit as picked up:", err);
      setError(err.message || "Failed to mark kit as picked up");
    }
  };

  const handleCancelAssignment = async (assignmentId: string) => {
    try {
      await cancelKitAssignment(assignmentId);
      await loadKitsAndAssignments();
    } catch (err: any) {
      console.error("Error cancelling assignment:", err);
      setError(err.message || "Failed to cancel assignment");
    }
  };

  // Handle kit deletion
  const handleDeleteKit = async () => {
    if (!kitToDelete) return;
    
    try {
      setIsDeletingKit(true);
      
      await deleteKit(kitToDelete.kit_id);
      
      // Update local state by removing the deleted kit
      setKits(kits.filter(kit => kit.kit_id !== kitToDelete.kit_id));
      
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
      setKits(kits.map(kit => kit.kit_id === updatedKit.kit_id ? updatedKit : kit));
      setSelectedKitForEdit(null);
    } else {
      // Add new kit to the list
      setKits([...kits, updatedKit]);
    }
  };

  const getStatusBadgeVariant = (status: RaceKitStatus) => {
    switch (status) {
      case 'in_stock':
        return 'success';
      case 'low_stock':
        return 'warning';
      case 'out_of_stock':
        return 'destructive';
      default:
        return 'secondary';
    }
  };

  const getPickupStatusBadgeVariant = (status: PickupStatus) => {
    switch (status) {
      case 'picked_up':
        return 'success';
      case 'pending':
        return 'warning';
      case 'cancelled':
        return 'destructive';
      default:
        return 'secondary';
    }
  };

  return (
    <div className="space-y-6">
      {/* Kit Inventory Section */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Race Kit Inventory</CardTitle>
            <CardDescription>
              Available race kits for this event
            </CardDescription>
          </div>
          <KitManagementForm 
            eventId={eventId}
            onSuccess={handleKitSaved}
            kit={selectedKitForEdit}
          />
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="py-8 text-center">Loading kit inventory...</div>
          ) : error ? (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          ) : kits.length === 0 ? (
            <div className="py-8 text-center">
              <Package className="h-12 w-12 mx-auto mb-3 text-muted-foreground/50" />
              <p className="text-muted-foreground">No race kits have been added yet.</p>
              <p className="text-xs text-muted-foreground mt-1">
                Click "Add Kit" to create race kits for distribution.
              </p>
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {kits.map((kit) => (
                <Card key={kit.kit_id} className="overflow-hidden">
                  <CardHeader className="p-4 pb-2">
                    <div className="flex justify-between items-start">
                      <div>
                        <Badge variant={getStatusBadgeVariant(kit.status)}>
                          {kit.status.replace('_', ' ')}
                        </Badge>
                        <CardTitle className="text-base mt-2">
                          {kit.type.charAt(0).toUpperCase() + kit.type.slice(1)} - {kit.size}
                        </CardTitle>
                      </div>
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
                  </CardHeader>
                  <CardContent className="p-4 pt-0">
                    <div className="mt-2">
                      <div className="flex justify-between text-sm mb-1">
                        <span>Quantity</span>
                        <span>{kit.quantity}</span>
                      </div>
                      <Progress 
                        value={kit.quantity > 0 ? (kit.quantity / 100) * 100 : 0} 
                        className="h-2"
                      />
                    </div>
                    <Button
                      className="w-full mt-4"
                      size="sm"
                      disabled={kit.status === 'out_of_stock'}
                      onClick={() => {
                        setSelectedKit(kit);
                        setAssignmentDialogOpen(true);
                      }}
                    >
                      Assign Kit
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Kit Assignments Section */}
      <Card>
        <CardHeader>
          <CardTitle>Kit Assignments</CardTitle>
          <CardDescription>
            Track and manage race kit assignments
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4 mb-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by participant name or email..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-8"
                />
              </div>
            </div>
            <Button
              size="icon"
              variant="outline"
              onClick={() => setQrScannerOpen(true)}
            >
              <QrCode className="h-4 w-4" />
            </Button>
          </div>

          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Participant</TableHead>
                  <TableHead>Kit Details</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Assigned At</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredAssignments.map((assignment) => (
                  <TableRow key={assignment.assignment_id}>
                    <TableCell>
                      <div>
                        <div className="font-medium">
                          {assignment.registration.user.full_name}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {assignment.registration.user.email}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div>
                        <div className="font-medium">
                          {assignment.kit.type.charAt(0).toUpperCase() + 
                           assignment.kit.type.slice(1)} - {assignment.kit.size}
                        </div>
                        {assignment.notes && (
                          <div className="text-sm text-muted-foreground">
                            {assignment.notes}
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={getPickupStatusBadgeVariant(assignment.pickup_status)}>
                        {assignment.pickup_status.replace('_', ' ')}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {new Date(assignment.assigned_at).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      {assignment.pickup_status === 'pending' && (
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            onClick={() => handleMarkAsPickedUp(assignment.assignment_id)}
                          >
                            <CheckCircle className="h-4 w-4 mr-1" />
                            Mark Picked Up
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleCancelAssignment(assignment.assignment_id)}
                          >
                            Cancel
                          </Button>
                        </div>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
                {filteredAssignments.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-8">
                      <Package className="h-8 w-8 mx-auto mb-2 text-muted-foreground/50" />
                      <p className="text-muted-foreground">No kit assignments found</p>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* QR Code Scanner Dialog */}
      <Dialog open={qrScannerOpen} onOpenChange={setQrScannerOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Scan Registration QR Code</DialogTitle>
            <DialogDescription>
              Position the QR code within the scanner frame
            </DialogDescription>
          </DialogHeader>
          <QRCodeScanner onScan={handleQRCodeScanned} />
        </DialogContent>
      </Dialog>

      {/* Kit Assignment Dialog */}
      <Dialog open={assignmentDialogOpen} onOpenChange={setAssignmentDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Assign Race Kit</DialogTitle>
            <DialogDescription>
              Record a race kit assignment to a participant
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Registration ID</label>
              <div className="flex gap-2">
                <Input
                  value={registrationId}
                  onChange={(e) => setRegistrationId(e.target.value)}
                  placeholder="Enter registration ID or scan QR"
                />
                <Button
                  size="icon"
                  variant="outline"
                  onClick={() => setQrScannerOpen(true)}
                >
                  <QrCode className="h-4 w-4" />
                </Button>
              </div>
            </div>
            
            {scanSuccess && (
              <Alert>
                <CheckCircle className="h-4 w-4" />
                <AlertDescription>{scanMessage}</AlertDescription>
              </Alert>
            )}
            
            <div className="space-y-2">
              <label className="text-sm font-medium">Notes (Optional)</label>
              <Input
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Add any special notes..."
              />
            </div>
          </div>
          
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setAssignmentDialogOpen(false)}
              disabled={processingAssignment}
            >
              Cancel
            </Button>
            <Button
              onClick={handleAssignKit}
              disabled={!selectedKit || !registrationId || processingAssignment}
            >
              {processingAssignment ? "Assigning..." : "Assign Kit"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
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
              <p><span className="font-medium">Type:</span> {kitToDelete.type}</p>
              <p><span className="font-medium">Size:</span> {kitToDelete.size}</p>
              <p><span className="font-medium">Quantity:</span> {kitToDelete.quantity}</p>
              
              {kitToDelete.status !== 'in_stock' && (
                <Alert className="mt-4">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    Warning: This kit is currently {kitToDelete.status.replace('_', ' ')}.
                    Deleting it may affect existing assignments.
                  </AlertDescription>
                </Alert>
              )}
            </div>
          )}
          
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDeleteDialogOpen(false)}
              disabled={isDeletingKit}
            >
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
    </div>
  );
} 
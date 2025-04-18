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
import { AlertCircle, CheckCircle, Clock, QrCode, Search, UserCheck, UserX } from "lucide-react";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

import { 
  getVolunteerAssignments, 
  updateVolunteerAssignmentStatus 
} from "@/lib/services/volunteer-service";
import { VolunteerAssignment } from "@/types/volunteer";
import QRCodeScanner from "../QRCodeScanner";

interface VolunteerAssignmentsTabProps {
  eventId: string;
  isLoading?: boolean;
  assignments?: VolunteerAssignment[];
  setAssignments?: React.Dispatch<React.SetStateAction<VolunteerAssignment[]>>;
}

export default function VolunteerAssignmentsTab({ 
  eventId,
  isLoading: externalLoading,
  assignments: externalAssignments,
  setAssignments: externalSetAssignments
}: VolunteerAssignmentsTabProps) {
  const [assignments, setAssignments] = useState<VolunteerAssignment[]>(externalAssignments || []);
  const [filteredAssignments, setFilteredAssignments] = useState<VolunteerAssignment[]>(externalAssignments || []);
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(externalLoading !== undefined ? externalLoading : true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("all");
  
  // Check-in dialog state
  const [checkInDialogOpen, setCheckInDialogOpen] = useState(false);
  const [checkOutDialogOpen, setCheckOutDialogOpen] = useState(false);
  const [selectedAssignment, setSelectedAssignment] = useState<VolunteerAssignment | null>(null);
  const [processingAction, setProcessingAction] = useState(false);
  
  // QR code scanner state
  const [qrScannerOpen, setQrScannerOpen] = useState(false);
  const [scanMessage, setScanMessage] = useState<string | null>(null);
  const [scanSuccess, setScanSuccess] = useState(false);

  // Load volunteer assignments if not provided from props
  useEffect(() => {
    async function loadAssignments() {
      if (externalAssignments && externalAssignments.length > 0) {
        setAssignments(externalAssignments);
        setFilteredAssignments(externalAssignments);
        return;
      }

      try {
        setIsLoading(true);
        const data = await getVolunteerAssignments(eventId);
        setAssignments(data);
        if (externalSetAssignments) {
          externalSetAssignments(data);
        }
        setFilteredAssignments(data);
        setError(null);
      } catch (err: any) {
        console.error("Error loading volunteer assignments:", err);
        setError(err.message || "Failed to load volunteer assignments");
      } finally {
        setIsLoading(false);
      }
    }

    if (externalLoading === undefined || externalAssignments === undefined) {
      loadAssignments();
    }
  }, [eventId, externalAssignments, externalLoading, externalSetAssignments]);

  // Update assignments when external assignments change
  useEffect(() => {
    if (externalAssignments) {
      setAssignments(externalAssignments);
      setFilteredAssignments(externalAssignments);
    }
  }, [externalAssignments]);

  // Filter assignments based on search query and active tab
  useEffect(() => {
    let filtered = assignments;
    
    // Apply search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (assignment) =>
          assignment.volunteer?.profile.name.toLowerCase().includes(query) ||
          assignment.role?.name.toLowerCase().includes(query) ||
          assignment.status.toLowerCase().includes(query)
      );
    }
    
    // Apply tab filter
    if (activeTab !== "all") {
      filtered = filtered.filter((assignment) => {
        switch (activeTab) {
          case "checkedIn":
            return assignment.check_in_time !== null && assignment.check_out_time === null;
          case "notCheckedIn":
            return assignment.check_in_time === null;
          case "completed":
            return assignment.status === "completed" || assignment.check_out_time !== null;
          default:
            return true;
        }
      });
    }
    
    setFilteredAssignments(filtered);
  }, [assignments, searchQuery, activeTab]);

  // Handle check-in
  const handleCheckIn = async () => {
    if (!selectedAssignment) return;
    
    try {
      setProcessingAction(true);
      
      const updatedAssignment = await updateVolunteerAssignmentStatus(
        selectedAssignment.id,
        "confirmed",
        new Date()
      );
      
      // Update the assignments list
      const updatedAssignments = assignments.map((assignment) =>
        assignment.id === updatedAssignment.id ? updatedAssignment : assignment
      );
      
      setAssignments(updatedAssignments);
      if (externalSetAssignments) {
        externalSetAssignments(updatedAssignments);
      }
      
      setCheckInDialogOpen(false);
      setSelectedAssignment(null);
    } catch (err: any) {
      console.error("Error checking in volunteer:", err);
      setError(err.message || "Failed to check in volunteer");
    } finally {
      setProcessingAction(false);
    }
  };

  // Handle check-out
  const handleCheckOut = async () => {
    if (!selectedAssignment) return;
    
    try {
      setProcessingAction(true);
      
      const updatedAssignment = await updateVolunteerAssignmentStatus(
        selectedAssignment.id,
        "completed",
        undefined,
        new Date()
      );
      
      // Update the assignments list
      const updatedAssignments = assignments.map((assignment) =>
        assignment.id === updatedAssignment.id ? updatedAssignment : assignment
      );
      
      setAssignments(updatedAssignments);
      if (externalSetAssignments) {
        externalSetAssignments(updatedAssignments);
      }
      
      setCheckOutDialogOpen(false);
      setSelectedAssignment(null);
    } catch (err: any) {
      console.error("Error checking out volunteer:", err);
      setError(err.message || "Failed to check out volunteer");
    } finally {
      setProcessingAction(false);
    }
  };

  // Handle QR code scan
  const handleQRScan = async (data: string) => {
    try {
      setScanMessage("Processing QR code...");
      setScanSuccess(false);
      
      // Parse the QR code data
      const qrData = JSON.parse(data);
      
      // Validate that this is a volunteer check-in QR code
      if (qrData.type !== "volunteer_check_in") {
        setScanMessage("Invalid QR code: Not a volunteer check-in code");
        return;
      }
      
      // Validate that this QR code is for the current event
      if (qrData.eventId !== eventId) {
        setScanMessage("Invalid QR code: This code is for a different event");
        return;
      }
      
      // Find the assignment for this volunteer
      const assignment = assignments.find(
        (a) => a.volunteer_id === qrData.volunteerId && (!qrData.roleId || a.role_id === qrData.roleId)
      );
      
      if (!assignment) {
        setScanMessage("No matching volunteer assignment found");
        return;
      }
      
      // Check if the volunteer is already checked in
      if (assignment.check_in_time) {
        setScanMessage(`${assignment.volunteer?.profile.name} is already checked in`);
        return;
      }
      
      // Check in the volunteer
      const updatedAssignment = await updateVolunteerAssignmentStatus(
        assignment.id,
        "confirmed",
        new Date()
      );
      
      // Update the assignments list
      const updatedAssignments = assignments.map((a) =>
        a.id === updatedAssignment.id ? updatedAssignment : a
      );
      
      setAssignments(updatedAssignments);
      if (externalSetAssignments) {
        externalSetAssignments(updatedAssignments);
      }
      
      // Set success message
      setScanMessage(`Successfully checked in ${assignment.volunteer?.profile.name}`);
      setScanSuccess(true);
      
      // Close the scanner after a delay
      setTimeout(() => {
        setQrScannerOpen(false);
        setScanMessage(null);
      }, 3000);
    } catch (err: any) {
      console.error("Error processing QR code:", err);
      setScanMessage(`Error: ${err.message}`);
    }
  };

  // Status badge component
  const StatusBadge = ({ assignment }: { assignment: VolunteerAssignment }) => {
    if (assignment.check_in_time && !assignment.check_out_time) {
      return (
        <Badge className="bg-green-100 text-green-800 hover:bg-green-200">
          <CheckCircle className="w-3 h-3 mr-1" /> Checked In
        </Badge>
      );
    } else if (assignment.check_out_time) {
      return (
        <Badge variant="outline" className="bg-gray-100">
          <Clock className="w-3 h-3 mr-1" /> Completed
        </Badge>
      );
    } else if (assignment.status === "confirmed") {
      return (
        <Badge variant="secondary">
          <UserCheck className="w-3 h-3 mr-1" /> Confirmed
        </Badge>
      );
    } else if (assignment.status === "declined") {
      return (
        <Badge variant="destructive">
          <UserX className="w-3 h-3 mr-1" /> Declined
        </Badge>
      );
    } else {
      return (
        <Badge variant="outline">
          Assigned
        </Badge>
      );
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Volunteer Assignments</CardTitle>
        <CardDescription>
          Manage volunteer assignments and check-ins for this event
        </CardDescription>
      </CardHeader>
      <CardContent>
        {error && (
          <Alert variant="destructive" className="mb-4">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <div className="flex flex-col md:flex-row items-center justify-between gap-4 mb-6">
          <Tabs
            value={activeTab}
            onValueChange={setActiveTab}
            className="w-full md:w-auto"
          >
            <TabsList>
              <TabsTrigger value="all">All</TabsTrigger>
              <TabsTrigger value="notCheckedIn">Not Checked In</TabsTrigger>
              <TabsTrigger value="checkedIn">Currently Active</TabsTrigger>
              <TabsTrigger value="completed">Completed</TabsTrigger>
            </TabsList>
          </Tabs>

          <div className="flex gap-2 w-full md:w-auto">
            <div className="relative flex-1 md:min-w-[300px]">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Search assignments..."
                className="pl-8"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            
            <Dialog open={qrScannerOpen} onOpenChange={setQrScannerOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" size="icon">
                  <QrCode className="h-4 w-4" />
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Scan QR Code for Check-In</DialogTitle>
                  <DialogDescription>
                    Scan a volunteer's QR code to check them in.
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
        </div>

        {isLoading ? (
          <div className="flex justify-center items-center py-10">
            <p>Loading volunteer assignments...</p>
          </div>
        ) : filteredAssignments.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-10 text-center">
            <h3 className="text-lg font-medium mb-2">No assignments found</h3>
            <p className="text-muted-foreground max-w-md">
              {searchQuery
                ? "Try a different search term or filter"
                : "There are no volunteer assignments for this event yet"}
            </p>
          </div>
        ) : (
          <div className="border rounded-md">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Volunteer</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead className="hidden sm:table-cell">Location</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredAssignments.map((assignment) => (
                  <TableRow key={assignment.id}>
                    <TableCell>
                      <div>
                        <p className="font-medium">{assignment.volunteer?.profile.name}</p>
                        <p className="text-xs text-muted-foreground">{assignment.volunteer?.profile.email}</p>
                      </div>
                    </TableCell>
                    <TableCell>{assignment.role?.name}</TableCell>
                    <TableCell className="hidden sm:table-cell">{assignment.role?.location || "-"}</TableCell>
                    <TableCell>
                      <StatusBadge assignment={assignment} />
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        {!assignment.check_in_time ? (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setSelectedAssignment(assignment);
                              setCheckInDialogOpen(true);
                            }}
                          >
                            Check In
                          </Button>
                        ) : !assignment.check_out_time ? (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setSelectedAssignment(assignment);
                              setCheckOutDialogOpen(true);
                            }}
                          >
                            Check Out
                          </Button>
                        ) : null}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}

        {/* Check-in Dialog */}
        <Dialog open={checkInDialogOpen} onOpenChange={setCheckInDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Check In Volunteer</DialogTitle>
              <DialogDescription>
                Confirm that this volunteer has arrived and is ready to begin their assignment.
              </DialogDescription>
            </DialogHeader>
            
            {selectedAssignment && (
              <div className="py-4">
                <p><span className="font-medium">Volunteer:</span> {selectedAssignment.volunteer?.profile.name}</p>
                <p><span className="font-medium">Role:</span> {selectedAssignment.role?.name}</p>
                <p><span className="font-medium">Location:</span> {selectedAssignment.role?.location || "Not specified"}</p>
                <p className="mt-2 text-sm text-muted-foreground">
                  The check-in time will be recorded as the current time.
                </p>
              </div>
            )}
            
            <DialogFooter>
              <Button variant="outline" onClick={() => setCheckInDialogOpen(false)} disabled={processingAction}>
                Cancel
              </Button>
              <Button onClick={handleCheckIn} disabled={processingAction}>
                {processingAction ? "Processing..." : "Confirm Check In"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Check-out Dialog */}
        <Dialog open={checkOutDialogOpen} onOpenChange={setCheckOutDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Check Out Volunteer</DialogTitle>
              <DialogDescription>
                Confirm that this volunteer has completed their assignment and is checking out.
              </DialogDescription>
            </DialogHeader>
            
            {selectedAssignment && (
              <div className="py-4">
                <p><span className="font-medium">Volunteer:</span> {selectedAssignment.volunteer?.profile.name}</p>
                <p><span className="font-medium">Role:</span> {selectedAssignment.role?.name}</p>
                <p>
                  <span className="font-medium">Check-in time:</span>{" "}
                  {selectedAssignment.check_in_time 
                    ? new Date(selectedAssignment.check_in_time).toLocaleString() 
                    : "Not checked in"}
                </p>
                <p className="mt-2 text-sm text-muted-foreground">
                  The check-out time will be recorded as the current time.
                </p>
              </div>
            )}
            
            <DialogFooter>
              <Button variant="outline" onClick={() => setCheckOutDialogOpen(false)} disabled={processingAction}>
                Cancel
              </Button>
              <Button onClick={handleCheckOut} disabled={processingAction}>
                {processingAction ? "Processing..." : "Confirm Check Out"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
} 
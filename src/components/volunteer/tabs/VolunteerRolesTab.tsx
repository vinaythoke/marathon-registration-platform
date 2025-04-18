"use client";

import { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { MoreHorizontal, Plus, Search, Users } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { getVolunteerRoles, createVolunteerRole, updateVolunteerRole, deleteVolunteerRole } from "@/lib/services/volunteer-service";
import { VolunteerRole } from "@/types/volunteer";

// Placeholder for UI components that haven't been created yet
const Table = (props: any) => <table className="w-full" {...props} />;
const TableHeader = (props: any) => <thead {...props} />;
const TableBody = (props: any) => <tbody {...props} />;
const TableRow = (props: any) => <tr className="border-b" {...props} />;
const TableHead = (props: any) => <th className="p-4 text-left font-medium" {...props} />;
const TableCell = (props: any) => <td className="p-4" {...props} />;

const DropdownMenu = (props: any) => <div {...props} />;
const DropdownMenuTrigger = (props: any) => <div {...props} />;
const DropdownMenuContent = (props: any) => <div className="absolute right-0 mt-2 bg-white border rounded-md shadow-md p-2 z-10" {...props} />;
const DropdownMenuLabel = (props: any) => <div className="px-2 py-1 font-medium" {...props} />;
const DropdownMenuItem = (props: any) => <button className="w-full text-left px-2 py-1 rounded hover:bg-slate-100" {...props} />;
const DropdownMenuSeparator = () => <div className="h-[1px] bg-slate-200 my-1" />;

const Dialog = ({ open, onOpenChange, children }: { open: boolean; onOpenChange: (open: boolean) => void; children: React.ReactNode }) => {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-white p-6 rounded-lg shadow-lg max-w-md w-full">
        {children}
      </div>
    </div>
  );
};
const DialogTrigger = ({ asChild, children }: { asChild: boolean; children: React.ReactNode }) => <>{children}</>;
const DialogContent = (props: any) => <div {...props} />;
const DialogHeader = (props: any) => <div className="mb-4" {...props} />;
const DialogTitle = (props: any) => <h2 className="text-xl font-bold" {...props} />;
const DialogDescription = (props: any) => <p className="text-sm text-gray-500" {...props} />;
const DialogFooter = (props: any) => <div className="flex justify-end gap-2 mt-4" {...props} />;

const Form = ({ ...props }: any) => <form {...props} />;
const FormField = ({ control, name, render }: any) => render({ field: { name, ...control?.register?.(name) } });
const FormItem = (props: any) => <div className="mb-2" {...props} />;
const FormLabel = (props: any) => <label className="block font-medium mb-1" {...props} />;
const FormControl = (props: any) => <div {...props} />;
const FormDescription = (props: any) => <p className="text-sm text-gray-500 mt-1" {...props} />;
const FormMessage = (props: any) => <p className="text-sm text-red-500 mt-1" {...props} />;

// Define form schema
const roleFormSchema = z.object({
  name: z.string().min(2, {
    message: "Role name must be at least 2 characters.",
  }),
  description: z.string().optional(),
  required_volunteers: z.coerce.number().min(1, {
    message: "At least 1 volunteer is required.",
  }),
  location: z.string().optional(),
  start_time: z.string().optional(),
  end_time: z.string().optional(),
});

// Define the type for the form data
type RoleFormValues = z.infer<typeof roleFormSchema>;

interface VolunteerRolesTabProps {
  eventId: string;
}

export default function VolunteerRolesTab({ eventId }: VolunteerRolesTabProps) {
  const [roles, setRoles] = useState<VolunteerRole[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingRole, setEditingRole] = useState<VolunteerRole | null>(null);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [roleToDelete, setRoleToDelete] = useState<string | null>(null);

  // Create form
  const form = useForm<RoleFormValues>({
    resolver: zodResolver(roleFormSchema),
    defaultValues: {
      name: "",
      description: "",
      required_volunteers: 1,
      location: "",
      start_time: "",
      end_time: "",
    },
  });

  // Load roles
  useEffect(() => {
    async function loadRoles() {
      try {
        setIsLoading(true);
        const data = await getVolunteerRoles(eventId);
        setRoles(data);
      } catch (error) {
        console.error("Error loading volunteer roles:", error);
      } finally {
        setIsLoading(false);
      }
    }

    loadRoles();
  }, [eventId]);

  // Filter roles based on search query
  const filteredRoles = roles.filter(
    (role) =>
      role.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (role.description &&
        role.description.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (role.location &&
        role.location.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  // Handle form submission
  const onSubmit = async (values: RoleFormValues) => {
    try {
      if (editingRole) {
        // Update existing role
        await updateVolunteerRole(editingRole.id, {
          ...values,
          event_id: eventId,
        });
        
        // Update roles list
        setRoles(
          roles.map((role) =>
            role.id === editingRole.id
              ? { ...role, ...values, event_id: eventId }
              : role
          )
        );
      } else {
        // Create new role - ensure required fields are present
        const newRoleData = {
          name: values.name,
          description: values.description,
          required_volunteers: values.required_volunteers,
          location: values.location,
          start_time: values.start_time,
          end_time: values.end_time,
          event_id: eventId,
          is_active: true
        };
        
        const newRole = await createVolunteerRole(newRoleData);
        
        // Add to roles list
        setRoles([...roles, newRole]);
      }
      
      // Close dialog and reset form
      setIsDialogOpen(false);
      setEditingRole(null);
      form.reset();
    } catch (error) {
      console.error("Error saving volunteer role:", error);
    }
  };

  // Open edit dialog
  const handleEditRole = (role: VolunteerRole) => {
    setEditingRole(role);
    form.reset({
      name: role.name,
      description: role.description || "",
      required_volunteers: role.required_volunteers,
      location: role.location || "",
      start_time: role.start_time ? new Date(role.start_time).toISOString().slice(0, 16) : "",
      end_time: role.end_time ? new Date(role.end_time).toISOString().slice(0, 16) : "",
    });
    setIsDialogOpen(true);
  };

  // Delete role
  const handleDeleteRole = async () => {
    if (!roleToDelete) return;
    
    try {
      await deleteVolunteerRole(roleToDelete);
      setRoles(roles.filter((role) => role.id !== roleToDelete));
      setDeleteConfirmOpen(false);
      setRoleToDelete(null);
    } catch (error) {
      console.error("Error deleting volunteer role:", error);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Volunteer Roles</CardTitle>
        <CardDescription>
          Manage volunteer roles for this event
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex items-center justify-between mb-4">
          <div className="relative max-w-sm">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search roles..."
              className="pl-8"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button
                onClick={() => {
                  setEditingRole(null);
                  form.reset({
                    name: "",
                    description: "",
                    required_volunteers: 1,
                    location: "",
                    start_time: "",
                    end_time: "",
                  });
                }}
              >
                <Plus className="mr-2 h-4 w-4" /> Add Role
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[550px]">
              <DialogHeader>
                <DialogTitle>
                  {editingRole ? "Edit Volunteer Role" : "Create Volunteer Role"}
                </DialogTitle>
                <DialogDescription>
                  {editingRole
                    ? "Update details for this volunteer role"
                    : "Define a new volunteer role for your event"}
                </DialogDescription>
              </DialogHeader>
              <Form {...form}>
                <form
                  onSubmit={form.handleSubmit(onSubmit)}
                  className="space-y-4"
                >
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Role Name*</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g., Registration Desk" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="description"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Description</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="Brief description of the role"
                            {...field}
                            value={field.value || ""}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="required_volunteers"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Volunteers Needed*</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              min={1}
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="location"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Location</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="e.g., Start Line"
                              {...field}
                              value={field.value || ""}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="start_time"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Start Time</FormLabel>
                          <FormControl>
                            <Input
                              type="datetime-local"
                              {...field}
                              value={field.value || ""}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="end_time"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>End Time</FormLabel>
                          <FormControl>
                            <Input
                              type="datetime-local"
                              {...field}
                              value={field.value || ""}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  <DialogFooter>
                    <Button type="submit">
                      {editingRole ? "Update Role" : "Create Role"}
                    </Button>
                  </DialogFooter>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        </div>

        {isLoading ? (
          <div className="flex justify-center items-center h-40">
            <p>Loading volunteer roles...</p>
          </div>
        ) : filteredRoles.length === 0 ? (
          <div className="flex flex-col justify-center items-center h-40 text-center">
            <Users className="h-8 w-8 text-muted-foreground mb-4" />
            <h3 className="font-medium">No volunteer roles found</h3>
            <p className="text-sm text-muted-foreground mt-1">
              {searchQuery
                ? "Try a different search term"
                : "Create your first volunteer role to get started"}
            </p>
          </div>
        ) : (
          <div className="border rounded-md">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Role Name</TableHead>
                  <TableHead>Location</TableHead>
                  <TableHead>Volunteers</TableHead>
                  <TableHead>Time</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="w-[60px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredRoles.map((role) => (
                  <TableRow key={role.id}>
                    <TableCell>
                      <div>
                        <p className="font-medium">{role.name}</p>
                        {role.description && (
                          <p className="text-sm text-muted-foreground">
                            {role.description}
                          </p>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>{role.location || "-"}</TableCell>
                    <TableCell>
                      <Badge variant={role.assigned_volunteers_count && role.assigned_volunteers_count >= role.required_volunteers ? "default" : "outline"}>
                        {role.assigned_volunteers_count || 0}/{role.required_volunteers}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {role.start_time ? (
                        <div className="text-sm">
                          <p>
                            {new Date(role.start_time).toLocaleTimeString([], {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </p>
                          {role.end_time && (
                            <p className="text-muted-foreground">
                              to{" "}
                              {new Date(role.end_time).toLocaleTimeString([], {
                                hour: "2-digit",
                                minute: "2-digit",
                              })}
                            </p>
                          )}
                        </div>
                      ) : (
                        "-"
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={role.is_active ? "default" : "secondary"}
                      >
                        {role.is_active ? "Active" : "Inactive"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            className="h-8 w-8 p-0"
                          >
                            <span className="sr-only">Open menu</span>
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuLabel>Actions</DropdownMenuLabel>
                          <DropdownMenuItem
                            onClick={() => handleEditRole(role)}
                          >
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => {
                              setRoleToDelete(role.id);
                              setDeleteConfirmOpen(true);
                            }}
                            className="text-destructive"
                          >
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Volunteer Role</DialogTitle>
            <DialogDescription>
              This will permanently delete this volunteer role and remove all
              volunteer assignments associated with it. This action cannot be
              undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDeleteConfirmOpen(false)}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteRole}
            >
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
} 
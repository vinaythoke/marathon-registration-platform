"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useRouter } from "next/navigation";
import Image from "next/image";

import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "@/components/ui/use-toast";

import { Database } from "@/database.types";
import { createRunnerProfile, updateRunnerProfile, uploadProfileImage } from "@/lib/actions/profile";

// Define the form schema with Zod
const profileFormSchema = z.object({
  // Personal Information
  address: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  postal_code: z.string().optional(),
  country: z.string().optional(),
  phone: z.string().optional(),
  date_of_birth: z.string().optional(),
  gender: z.enum(["male", "female", "non-binary", "prefer_not_to_say"]).optional(),
  
  // Health Information
  medical_conditions: z.string().optional(),
  allergies: z.string().optional(),
  medications: z.string().optional(),
  blood_type: z.enum(["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-", "unknown"]).optional(),
  
  // Emergency Contact
  emergency_contact_name: z.string().optional(),
  emergency_contact_phone: z.string().optional(),
  emergency_contact_relationship: z.string().optional(),
  
  // Running Experience
  experience_level: z.enum(["beginner", "intermediate", "advanced", "professional"]).optional(),
  years_running: z.coerce.number().min(0).optional(),
  previous_marathons: z.coerce.number().min(0).optional(),
  average_pace: z.string().optional(),
  
  // Preferences
  preferred_distance: z.array(z.string()).optional(),
  running_goals: z.string().optional(),
  t_shirt_size: z.enum(["XS", "S", "M", "L", "XL", "XXL"]).optional(),
  
  // Profile
  profile_image_url: z.string().optional(),
  bio: z.string().optional(),
});

type ProfileFormValues = z.infer<typeof profileFormSchema>;

interface ProfileFormProps {
  profile?: Database["public"]["Tables"]["runner_profiles"]["Row"] | null;
}

export function ProfileForm({ profile }: ProfileFormProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activeTab, setActiveTab] = useState("personal");
  
  // Initialize the form with existing profile data or defaults
  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(profileFormSchema),
    defaultValues: profile || {
      preferred_distance: [],
    },
  });
  
  // Handler for form submission
  async function onSubmit(data: ProfileFormValues) {
    try {
      setIsSubmitting(true);
      
      if (profile) {
        // Update existing profile
        await updateRunnerProfile(data);
        toast({
          title: "Profile Updated",
          description: "Your runner profile has been updated successfully.",
        });
      } else {
        // Create new profile - Omit id as it will be added by the server action
        await createRunnerProfile({
          ...data,
          // We don't include id here as it's handled in the server action
        });
        toast({
          title: "Profile Created",
          description: "Your runner profile has been created successfully.",
        });
      }
      
      router.refresh();
    } catch (error) {
      console.error("Error submitting profile:", error);
      toast({
        title: "Error",
        description: "There was an error saving your profile. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  // Handle profile image upload
  async function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    if (!e.target.files || e.target.files.length === 0) {
      return;
    }
    
    try {
      const file = e.target.files[0];
      const publicUrl = await uploadProfileImage(file);
      form.setValue("profile_image_url", publicUrl);
      toast({
        title: "Image Uploaded",
        description: "Your profile image has been uploaded successfully.",
      });
    } catch (error) {
      console.error("Error uploading image:", error);
      toast({
        title: "Upload Error",
        description: "There was an error uploading your image. Please try again.",
        variant: "destructive",
      });
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        <Card>
          <CardHeader>
            <CardTitle>Runner Profile</CardTitle>
            <CardDescription>
              Complete your runner profile to participate in events. Your health information helps us ensure your safety during races.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="grid grid-cols-5 mb-8">
                <TabsTrigger value="personal">Personal</TabsTrigger>
                <TabsTrigger value="health">Health</TabsTrigger>
                <TabsTrigger value="emergency">Emergency</TabsTrigger>
                <TabsTrigger value="experience">Experience</TabsTrigger>
                <TabsTrigger value="preferences">Preferences</TabsTrigger>
              </TabsList>
              
              {/* Personal Information Tab */}
              <TabsContent value="personal" className="space-y-6">
                <div className="flex flex-col md:flex-row gap-8">
                  <div className="w-full md:w-2/3 space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="address"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Address</FormLabel>
                            <FormControl>
                              <Input placeholder="Your address" {...field} value={field.value || ""} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={form.control}
                        name="city"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>City</FormLabel>
                            <FormControl>
                              <Input placeholder="City" {...field} value={field.value || ""} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={form.control}
                        name="state"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>State/Province</FormLabel>
                            <FormControl>
                              <Input placeholder="State or province" {...field} value={field.value || ""} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={form.control}
                        name="postal_code"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Postal Code</FormLabel>
                            <FormControl>
                              <Input placeholder="Postal code" {...field} value={field.value || ""} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={form.control}
                        name="country"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Country</FormLabel>
                            <FormControl>
                              <Input placeholder="Country" {...field} value={field.value || ""} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={form.control}
                        name="phone"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Phone Number</FormLabel>
                            <FormControl>
                              <Input placeholder="Phone number" {...field} value={field.value || ""} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={form.control}
                        name="date_of_birth"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Date of Birth</FormLabel>
                            <FormControl>
                              <Input type="date" {...field} value={field.value || ""} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={form.control}
                        name="gender"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Gender</FormLabel>
                            <Select 
                              onValueChange={field.onChange} 
                              defaultValue={field.value}
                            >
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select gender" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="male">Male</SelectItem>
                                <SelectItem value="female">Female</SelectItem>
                                <SelectItem value="non-binary">Non-binary</SelectItem>
                                <SelectItem value="prefer_not_to_say">Prefer not to say</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    
                    <FormField
                      control={form.control}
                      name="bio"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Bio</FormLabel>
                          <FormControl>
                            <Textarea 
                              placeholder="Tell us about yourself as a runner..." 
                              className="resize-none h-32"
                              {...field}
                              value={field.value || ""}
                            />
                          </FormControl>
                          <FormDescription>
                            Share your running journey and goals.
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  
                  <div className="w-full md:w-1/3">
                    <FormItem className="space-y-4">
                      <FormLabel>Profile Image</FormLabel>
                      <div className="flex flex-col items-center">
                        <div className="border rounded-md w-40 h-40 mb-4 flex items-center justify-center overflow-hidden">
                          {form.watch("profile_image_url") ? (
                            <Image 
                              src={form.watch("profile_image_url")} 
                              alt="Profile" 
                              width={160} 
                              height={160} 
                              className="object-cover w-full h-full"
                            />
                          ) : (
                            <div className="text-muted-foreground text-sm">No image</div>
                          )}
                        </div>
                        <Input 
                          type="file" 
                          accept="image/*"
                          className="w-full max-w-xs"
                          onChange={handleImageUpload}
                        />
                        <FormDescription className="text-center mt-2">
                          Upload a profile picture. Maximum size 2MB.
                        </FormDescription>
                      </div>
                    </FormItem>
                  </div>
                </div>
              </TabsContent>
              
              {/* Health Information Tab */}
              <TabsContent value="health" className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <FormField
                    control={form.control}
                    name="medical_conditions"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Medical Conditions</FormLabel>
                        <FormControl>
                          <Textarea 
                            placeholder="List any medical conditions..."
                            className="resize-none h-32"
                            {...field}
                            value={field.value || ""}
                          />
                        </FormControl>
                        <FormDescription>
                          Please list any medical conditions that race organizers should be aware of.
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="allergies"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Allergies</FormLabel>
                        <FormControl>
                          <Textarea 
                            placeholder="List any allergies..."
                            className="resize-none h-32"
                            {...field}
                            value={field.value || ""}
                          />
                        </FormControl>
                        <FormDescription>
                          Please list any allergies, including food, medications, or environmental.
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="medications"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Current Medications</FormLabel>
                        <FormControl>
                          <Textarea 
                            placeholder="List any medications you are currently taking..."
                            className="resize-none h-32"
                            {...field}
                            value={field.value || ""}
                          />
                        </FormControl>
                        <FormDescription>
                          Please list any medications you are currently taking that might be relevant in an emergency.
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="blood_type"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Blood Type</FormLabel>
                        <Select 
                          onValueChange={field.onChange} 
                          defaultValue={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select blood type" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="A+">A+</SelectItem>
                            <SelectItem value="A-">A-</SelectItem>
                            <SelectItem value="B+">B+</SelectItem>
                            <SelectItem value="B-">B-</SelectItem>
                            <SelectItem value="AB+">AB+</SelectItem>
                            <SelectItem value="AB-">AB-</SelectItem>
                            <SelectItem value="O+">O+</SelectItem>
                            <SelectItem value="O-">O-</SelectItem>
                            <SelectItem value="unknown">Unknown</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormDescription>
                          Your blood type can be important in emergency situations.
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </TabsContent>
              
              {/* Emergency Contact Tab */}
              <TabsContent value="emergency" className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <FormField
                    control={form.control}
                    name="emergency_contact_name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Emergency Contact Name</FormLabel>
                        <FormControl>
                          <Input placeholder="Full name" {...field} value={field.value || ""} />
                        </FormControl>
                        <FormDescription>
                          Name of someone we can contact in case of emergency.
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="emergency_contact_phone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Emergency Contact Phone</FormLabel>
                        <FormControl>
                          <Input placeholder="Phone number" {...field} value={field.value || ""} />
                        </FormControl>
                        <FormDescription>
                          Phone number where your emergency contact can be reached.
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="emergency_contact_relationship"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Relationship</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g., Spouse, Parent, Friend" {...field} value={field.value || ""} />
                        </FormControl>
                        <FormDescription>
                          Your relationship to the emergency contact.
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </TabsContent>
              
              {/* Running Experience Tab */}
              <TabsContent value="experience" className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <FormField
                    control={form.control}
                    name="experience_level"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Experience Level</FormLabel>
                        <Select 
                          onValueChange={field.onChange} 
                          defaultValue={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select experience level" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="beginner">Beginner</SelectItem>
                            <SelectItem value="intermediate">Intermediate</SelectItem>
                            <SelectItem value="advanced">Advanced</SelectItem>
                            <SelectItem value="professional">Professional</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormDescription>
                          How would you describe your running experience?
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="years_running"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Years Running</FormLabel>
                        <FormControl>
                          <Input type="number" min="0" placeholder="0" {...field} value={field.value || ""} />
                        </FormControl>
                        <FormDescription>
                          How many years have you been running?
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="previous_marathons"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Previous Marathons</FormLabel>
                        <FormControl>
                          <Input type="number" min="0" placeholder="0" {...field} value={field.value || ""} />
                        </FormControl>
                        <FormDescription>
                          How many marathons have you completed?
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="average_pace"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Average Pace</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g., 5:30/km" {...field} value={field.value || ""} />
                        </FormControl>
                        <FormDescription>
                          What is your average running pace?
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </TabsContent>
              
              {/* Preferences Tab */}
              <TabsContent value="preferences" className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Note: For preferred_distance, we would ideally use a multi-select component */}
                  {/* This is a simplified version using a textarea */}
                  <FormField
                    control={form.control}
                    name="running_goals"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Running Goals</FormLabel>
                        <FormControl>
                          <Textarea 
                            placeholder="What are your running goals?"
                            className="resize-none h-32"
                            {...field}
                            value={field.value || ""}
                          />
                        </FormControl>
                        <FormDescription>
                          Share your short and long-term running goals.
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="t_shirt_size"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>T-Shirt Size</FormLabel>
                        <Select 
                          onValueChange={field.onChange} 
                          defaultValue={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select t-shirt size" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="XS">XS</SelectItem>
                            <SelectItem value="S">S</SelectItem>
                            <SelectItem value="M">M</SelectItem>
                            <SelectItem value="L">L</SelectItem>
                            <SelectItem value="XL">XL</SelectItem>
                            <SelectItem value="XXL">XXL</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormDescription>
                          Your preferred t-shirt size for event merchandise.
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
          <CardFooter className="flex justify-between">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.push("/dashboard")}
            >
              Cancel
            </Button>
            <div className="flex gap-2">
              {activeTab !== "personal" && (
                <Button 
                  type="button" 
                  variant="outline"
                  onClick={() => {
                    const tabs = ["personal", "health", "emergency", "experience", "preferences"];
                    const currentIndex = tabs.indexOf(activeTab);
                    if (currentIndex > 0) {
                      setActiveTab(tabs[currentIndex - 1]);
                    }
                  }}
                >
                  Previous
                </Button>
              )}
              
              {activeTab !== "preferences" ? (
                <Button 
                  type="button"
                  onClick={() => {
                    const tabs = ["personal", "health", "emergency", "experience", "preferences"];
                    const currentIndex = tabs.indexOf(activeTab);
                    if (currentIndex < tabs.length - 1) {
                      setActiveTab(tabs[currentIndex + 1]);
                    }
                  }}
                >
                  Next
                </Button>
              ) : (
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? "Saving..." : profile ? "Update Profile" : "Create Profile"}
                </Button>
              )}
            </div>
          </CardFooter>
        </Card>
      </form>
    </Form>
  );
} 
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { QrCode, Search, ArrowLeft, Check, X } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { getClient } from '@/lib/db-client'

export default async function VolunteerCheckInPage() {
  // Check if we're using local DB
  const isLocalDb = process.env.IS_LOCAL_DB === 'true';
  
  if (!isLocalDb) {
    // Use Supabase for production
    const supabase = getClient();
    const { data: { session } } = await supabase.auth.getSession();

    if (!session) {
      redirect('/auth');
    }

    // Get user profile
    const { data: profile } = await supabase
      .from('users')
      .select('role')
      .eq('auth_id', session.user.id)
      .single();
      
    // Ensure user is a volunteer
    if (profile?.role !== 'volunteer') {
      redirect('/dashboard');
    }
  }
  
  return (
    <div className="container mx-auto py-10">
      <div className="mb-8">
        <Link href="/dashboard/volunteer" className="flex items-center text-muted-foreground hover:text-foreground mb-4">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Volunteer Dashboard
        </Link>
        <h1 className="text-3xl font-bold tracking-tight">Check-in Station</h1>
        <p className="text-muted-foreground mt-2">
          Scan runner QR codes or search by name to check in participants
        </p>
      </div>

      <Tabs defaultValue="qr-scan" className="space-y-6">
        <TabsList className="grid grid-cols-2 w-full max-w-md">
          <TabsTrigger value="qr-scan">QR Code Scanner</TabsTrigger>
          <TabsTrigger value="manual">Manual Search</TabsTrigger>
        </TabsList>
        
        <TabsContent value="qr-scan" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <QrCode className="mr-2 h-5 w-5" />
                Scan QR Code
              </CardTitle>
              <CardDescription>Use your camera to scan runner QR codes</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col items-center py-6">
              <div className="w-64 h-64 bg-muted rounded-lg border-2 border-dashed border-muted-foreground/50 flex flex-col items-center justify-center mb-6">
                <QrCode className="h-12 w-12 text-muted-foreground mb-2" />
                <p className="text-sm text-muted-foreground text-center px-4">
                  QR scanner will activate when you click the button below
                </p>
              </div>
              <Button className="w-full max-w-xs">
                Activate Camera
              </Button>
              <p className="text-xs text-muted-foreground mt-2">
                Note: You may need to allow camera permissions
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>Latest Scans</CardTitle>
              <CardDescription>Recent runners you've checked in</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                  <div>
                    <h4 className="font-medium">John Smith</h4>
                    <p className="text-sm text-muted-foreground">BIB #1234 • Standard Entry</p>
                  </div>
                  <div className="flex items-center text-green-500">
                    <Check className="h-5 w-5 mr-1" />
                    <span className="text-sm font-medium">Checked In</span>
                  </div>
                </div>
                <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                  <div>
                    <h4 className="font-medium">Sarah Johnson</h4>
                    <p className="text-sm text-muted-foreground">BIB #1235 • VIP Entry</p>
                  </div>
                  <div className="flex items-center text-green-500">
                    <Check className="h-5 w-5 mr-1" />
                    <span className="text-sm font-medium">Checked In</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="manual" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Search className="mr-2 h-5 w-5" />
                Manual Runner Search
              </CardTitle>
              <CardDescription>Find runners by name, email, or bib number</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex max-w-xl">
                  <Input placeholder="Search by name, email, or bib number" className="rounded-r-none" />
                  <Button className="rounded-l-none">Search</Button>
                </div>
                
                <div className="border rounded-lg">
                  <div className="p-4 border-b">
                    <h4 className="font-medium">Search Results</h4>
                  </div>
                  <div className="divide-y">
                    <div className="flex items-center justify-between p-4">
                      <div>
                        <h4 className="font-medium">Michael Wilson</h4>
                        <p className="text-sm text-muted-foreground">BIB #1236 • Early Bird Ticket</p>
                        <p className="text-xs text-muted-foreground">michael.wilson@example.com</p>
                      </div>
                      <Button variant="outline" className="text-green-600 border-green-600 hover:bg-green-50 hover:text-green-700">
                        <Check className="mr-2 h-4 w-4" />
                        Check In
                      </Button>
                    </div>
                    <div className="flex items-center justify-between p-4">
                      <div>
                        <h4 className="font-medium">Michelle Williams</h4>
                        <p className="text-sm text-muted-foreground">BIB #1237 • Standard Entry</p>
                        <p className="text-xs text-muted-foreground">michelle.williams@example.com</p>
                      </div>
                      <Button variant="outline" className="text-red-600 border-red-600 hover:bg-red-50 hover:text-red-700" disabled>
                        <X className="mr-2 h-4 w-4" />
                        Already Checked In
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
} 
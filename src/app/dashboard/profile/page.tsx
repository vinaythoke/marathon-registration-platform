import { createClient } from '@/lib/supabase/server';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';

import { getRunnerProfile } from '@/lib/actions/profile';
import { getUserVerificationStatus } from '@/lib/actions/verification';
import { ProfileForm } from '@/components/profile/profile-form';
import { AadhaarVerification } from '@/components/verification/aadhaar-verification';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

export const metadata = {
  title: 'Runner Profile | Marathon Registration',
  description: 'Manage your runner profile and personal information.',
};

export default async function ProfilePage({
  searchParams,
}: {
  searchParams: { tab?: string };
}) {
  const supabase = await createClient();
  
  // Check if user is authenticated
  const { data: { session } } = await supabase.auth.getSession();
  
  if (!session) {
    redirect('/auth');
  }
  
  // Check if user is a runner
  const { data: userData } = await supabase
    .from('users')
    .select('role, first_name, last_name')
    .eq('id', session.user.id)
    .single();
    
  if (userData?.role !== 'runner') {
    redirect('/dashboard');
  }
  
  // Get the runner profile
  const profile = await getRunnerProfile();
  
  // Get verification status
  const verificationStatus = await getUserVerificationStatus();
  
  // Format user data for verification form
  const userProfileData = {
    first_name: userData?.first_name,
    last_name: userData?.last_name,
    date_of_birth: profile?.date_of_birth,
    phone: profile?.phone
  };
  
  // Get default tab from URL params
  const defaultTab = searchParams.tab === 'verification' ? 'verification' : 'profile';
  
  return (
    <div className="container mx-auto py-10">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">Runner Profile</h1>
        <p className="text-muted-foreground">
          {profile ? 'Manage your profile information.' : 'Complete your profile to participate in events.'}
        </p>
      </div>
      
      <Tabs defaultValue={defaultTab} className="space-y-6">
        <TabsList className="grid w-full max-w-md grid-cols-2">
          <TabsTrigger value="profile">Profile Information</TabsTrigger>
          <TabsTrigger value="verification">ID Verification</TabsTrigger>
        </TabsList>
        
        <TabsContent value="profile">
          <ProfileForm profile={profile} />
        </TabsContent>
        
        <TabsContent value="verification">
          <div className="md:w-2/3 space-y-8">
            <AadhaarVerification 
              verificationStatus={verificationStatus} 
              userProfile={userProfileData} 
            />
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
} 
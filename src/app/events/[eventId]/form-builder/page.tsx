import { createClient } from '@/lib/supabase/server'
import { cookies } from 'next/headers'
import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { FormBuilderClient } from './form-builder-client'

interface FormBuilderPageProps {
  params: {
    eventId: string
  }
}

export default async function FormBuilderPage({ params }: FormBuilderPageProps) {
  const { eventId } = params
  const supabase = await createClient()
  const { data: { session } } = await supabase.auth.getSession()

  if (!session) {
    redirect('/auth')
  }

  // Get user profile with role
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', session.user.id)
    .single()

  if (!profile || profile.role !== 'organizer') {
    redirect('/dashboard')
  }

  // Get event details
  const { data: event } = await supabase
    .from('events')
    .select('id, title')
    .eq('id', eventId)
    .eq('organizer_id', session.user.id)
    .single()

  if (!event) {
    notFound()
  }

  // Get existing form schema if any
  const { data: formSchema } = await supabase
    .from('event_forms')
    .select('id, schema')
    .eq('event_id', eventId)
    .single()

  return (
    <div className="container mx-auto py-10">
      <div className="mb-8">
        <Link href={`/events/${eventId}/manage`} className="flex items-center text-sm text-muted-foreground mb-2 hover:text-foreground transition-colors">
          <ArrowLeft className="mr-1 h-4 w-4" /> Back to Event
        </Link>
        <h1 className="text-3xl font-bold tracking-tight">
          Registration Form Builder: {event.title}
        </h1>
        <p className="text-muted-foreground">
          Create a custom registration form for participants
        </p>
      </div>

      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Custom Form Builder</CardTitle>
          <CardDescription>
            Design a registration form with drag-and-drop fields. Changes are saved automatically.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <FormBuilderClient eventId={eventId} initialSchema={formSchema?.schema} />
        </CardContent>
      </Card>
    </div>
  )
} 
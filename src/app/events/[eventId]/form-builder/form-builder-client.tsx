"use client"

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from '@/components/ui/use-toast'
import { FormSchema } from '@/types/form-builder'
import { FormBuilder } from '@/components/form-builder'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { v4 as uuidv4 } from 'uuid'

interface FormBuilderClientProps {
  eventId: string
  initialSchema?: FormSchema
}

export function FormBuilderClient({ eventId, initialSchema }: FormBuilderClientProps) {
  const router = useRouter()
  const supabase = createClientComponentClient()
  const [saving, setSaving] = useState(false)

  const handleSaveForm = async (schema: FormSchema) => {
    try {
      setSaving(true)
      
      // Check if we already have a form for this event
      const { data: existingForm } = await supabase
        .from('event_forms')
        .select('id')
        .eq('event_id', eventId)
        .single()
      
      let result
      
      if (existingForm) {
        // Update existing form
        result = await supabase
          .from('event_forms')
          .update({
            schema,
            updated_at: new Date().toISOString()
          })
          .eq('id', existingForm.id)
      } else {
        // Create new form
        result = await supabase
          .from('event_forms')
          .insert({
            id: uuidv4(),
            event_id: eventId,
            schema,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          })
      }
      
      if (result.error) {
        throw result.error
      }
      
      toast({
        title: 'Form saved',
        description: 'Your registration form has been saved successfully.',
      })
      
      // Refresh the page to get the latest form data
      router.refresh()
      
    } catch (error) {
      console.error('Error saving form:', error)
      toast({
        variant: 'destructive',
        title: 'Error saving form',
        description: 'There was an error saving your form. Please try again.',
      })
    } finally {
      setSaving(false)
    }
  }

  return (
    <FormBuilder
      initialSchema={initialSchema}
      onSave={handleSaveForm}
    />
  )
} 
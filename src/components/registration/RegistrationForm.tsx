'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useRegistration } from './RegistrationContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Form } from '@/components/ui/form';
import { DynamicFormField, FieldType, FormFieldSchema } from './DynamicFormField';
import { ArrowLeft, ChevronRight, Loader2, AlertCircle } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { saveFormResponses } from '@/lib/actions/registration';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface RegistrationFormProps {
  formSchema: {
    title?: string;
    description?: string;
    fields: Array<{
      id: string;
      label: string;
      type: FieldType;
      required?: boolean;
      options?: Array<{ label: string; value: string }>;
      placeholder?: string;
    }>;
  } | null;
}

export default function RegistrationForm({ formSchema }: RegistrationFormProps) {
  const { toast } = useToast();
  const { 
    goToNextStep,
    goToPreviousStep,
    formData,
    setFormData,
    registrationId,
    stepValidationErrors,
    validateCurrentStep
  } = useRegistration();
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Function to generate validation schema based on form fields
  const generateValidationSchema = (formSchema: FormFieldSchema[]) => {
    const shape: Record<string, any> = {};
    
    formSchema.forEach(field => {
      let validator;
      
      switch (field.type) {
        case 'text':
        case 'textarea':
        case 'phone':
          validator = z.string();
          if (field.minLength) validator = validator.min(field.minLength);
          if (field.maxLength) validator = validator.max(field.maxLength);
          if (field.pattern) validator = validator.regex(new RegExp(field.pattern));
          break;
        
        case 'email':
          validator = z.string().email();
          break;
        
        case 'number':
          validator = z.number();
          if (field.min !== undefined) validator = validator.min(field.min);
          if (field.max !== undefined) validator = validator.max(field.max);
          break;
        
        case 'checkbox':
          validator = z.boolean();
          break;
        
        case 'select':
        case 'radio':
          validator = z.string();
          break;
        
        case 'multiselect':
          validator = z.array(z.string());
          break;
        
        case 'date':
          validator = z.date();
          break;
        
        default:
          validator = z.string();
      }
      
      // Make field optional if not required
      if (!field.required) {
        validator = validator.optional();
      }
      
      shape[field.id] = validator;
    });
    
    return z.object(shape);
  };

  // Convert formSchema fields to FormFieldSchema type
  const formFields: FormFieldSchema[] = formSchema?.fields.map(field => ({
    ...field,
    type: field.type as FieldType
  })) || [];

  const validationSchema = generateValidationSchema(formFields);

  const form = useForm({
    resolver: zodResolver(validationSchema),
    defaultValues: formData || {},
  });

  // Initialize form with existing data when formData changes
  useEffect(() => {
    if (formData && Object.keys(formData).length > 0) {
      Object.entries(formData).forEach(([key, value]) => {
        form.setValue(key, value);
      });
    }
  }, [formData, form]);

  // Handle form submission
  const onSubmit = async (data: any) => {
    if (!registrationId) {
      setError('Registration not found. Please start over.');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      await saveFormResponses(registrationId, data);
      setFormData(data);
      goToNextStep();
    } catch (error: any) {
      setError(error.message || 'Failed to save form responses');
      toast({
        title: 'Error',
        description: error.message || 'Failed to save form responses',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Display validation errors
  const currentErrors = stepValidationErrors['registration-form'] || [];

  // If no schema available, display a message
  if (!formSchema || !formSchema.fields || formSchema.fields.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Registration Form</CardTitle>
          <CardDescription>No registration form has been set up for this event.</CardDescription>
        </CardHeader>
        <CardFooter className="flex justify-between">
          <Button variant="outline" onClick={goToPreviousStep} className="gap-2">
            <ArrowLeft className="h-4 w-4" /> Back
          </Button>
          <Button onClick={goToNextStep}>Continue</Button>
        </CardFooter>
      </Card>
    );
  }

  return (
    <div className="space-y-6 py-4">
      {/* Display errors */}
      {(error || currentErrors.length > 0) && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            {error || currentErrors[0]}
          </AlertDescription>
        </Alert>
      )}
    
      <Card>
        <CardHeader>
          <CardTitle>{formSchema.title || "Registration Form"}</CardTitle>
          <CardDescription>
            {formSchema.description || "Please provide the following information for your registration."}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form id="registration-form" onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              {formSchema.fields.map((field) => (
                <DynamicFormField
                  key={field.id}
                  field={field}
                  form={form}
                  allValues={form.getValues()}
                />
              ))}
            </form>
          </Form>
        </CardContent>
        <CardFooter className="flex justify-between">
          <Button 
            variant="outline" 
            onClick={goToPreviousStep}
            className="gap-2"
          >
            <ArrowLeft className="h-4 w-4" /> Back
          </Button>
          <Button 
            form="registration-form" 
            type="submit"
            disabled={isSubmitting}
            className="gap-2"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" /> Saving...
              </>
            ) : (
              <>
                Continue <ChevronRight className="h-4 w-4" />
              </>
            )}
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
} 
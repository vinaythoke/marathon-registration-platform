"use client"

import React, { useState } from 'react'
import { FormSchema, FormField } from '@/types/form-builder'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardFooter, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Checkbox } from '@/components/ui/checkbox'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { format } from 'date-fns'
import { LoaderCircle } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Calendar } from '@/components/ui/calendar'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { Badge } from '@/components/ui/badge'

interface FormPreviewProps {
  schema: FormSchema
}

export function FormPreview({ schema }: FormPreviewProps) {
  const [formData, setFormData] = useState<any>({})
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)

  const handleChange = (fieldId: string, value: any) => {
    setFormData((prev: any) => ({
      ...prev,
      [fieldId]: value,
    }))
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    
    // Simulate submission
    setTimeout(() => {
      setSubmitting(false)
      setSubmitted(true)
      console.log('Form data:', formData)
      
      // Reset after showing success message
      setTimeout(() => {
        setSubmitted(false)
        setFormData({})
      }, 3000)
    }, 1500)
  }

  // Filter fields based on conditional display logic
  const visibleFields = schema.fields.filter(field => {
    if (!field.conditionalDisplay) return true
    
    const { dependsOn, showWhen } = field.conditionalDisplay
    const dependentFieldValue = formData[dependsOn]
    
    // If the dependent field hasn't been filled yet, don't show this field
    if (dependentFieldValue === undefined) return false
    
    // Check if the dependent field's value matches the showWhen condition
    if (Array.isArray(showWhen)) {
      return Array.isArray(dependentFieldValue) 
        ? dependentFieldValue.some(v => showWhen.includes(v)) 
        : showWhen.includes(dependentFieldValue)
    }
    
    return dependentFieldValue === showWhen
  })

  const renderField = (field: FormField) => {
    switch (field.type) {
      case 'text':
        return (
          <div className="space-y-2" key={field.id}>
            <Label htmlFor={field.id}>
              {field.label}
              {field.required && <span className="text-destructive ml-1">*</span>}
            </Label>
            {field.description && (
              <p className="text-sm text-muted-foreground">{field.description}</p>
            )}
            <Input
              id={field.id}
              placeholder={field.placeholder}
              value={formData[field.id] || ''}
              onChange={(e) => handleChange(field.id, e.target.value)}
            />
          </div>
        )
      
      case 'number':
        return (
          <div className="space-y-2" key={field.id}>
            <Label htmlFor={field.id}>
              {field.label}
              {field.required && <span className="text-destructive ml-1">*</span>}
            </Label>
            {field.description && (
              <p className="text-sm text-muted-foreground">{field.description}</p>
            )}
            <Input
              id={field.id}
              type="number"
              placeholder={field.placeholder}
              value={formData[field.id] || ''}
              onChange={(e) => handleChange(field.id, e.target.value ? Number(e.target.value) : '')}
              min={(field as any).min}
              max={(field as any).max}
              step={(field as any).step}
            />
          </div>
        )
      
      case 'email':
        return (
          <div className="space-y-2" key={field.id}>
            <Label htmlFor={field.id}>
              {field.label}
              {field.required && <span className="text-destructive ml-1">*</span>}
            </Label>
            {field.description && (
              <p className="text-sm text-muted-foreground">{field.description}</p>
            )}
            <Input
              id={field.id}
              type="email"
              placeholder={field.placeholder}
              value={formData[field.id] || ''}
              onChange={(e) => handleChange(field.id, e.target.value)}
            />
          </div>
        )
      
      case 'phone':
        return (
          <div className="space-y-2" key={field.id}>
            <Label htmlFor={field.id}>
              {field.label}
              {field.required && <span className="text-destructive ml-1">*</span>}
            </Label>
            {field.description && (
              <p className="text-sm text-muted-foreground">{field.description}</p>
            )}
            <Input
              id={field.id}
              type="tel"
              placeholder={field.placeholder}
              value={formData[field.id] || ''}
              onChange={(e) => handleChange(field.id, e.target.value)}
            />
          </div>
        )
      
      case 'date':
        return (
          <div className="space-y-2" key={field.id}>
            <Label htmlFor={field.id}>
              {field.label}
              {field.required && <span className="text-destructive ml-1">*</span>}
            </Label>
            {field.description && (
              <p className="text-sm text-muted-foreground">{field.description}</p>
            )}
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  id={field.id}
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !formData[field.id] && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {formData[field.id] ? (
                    format(new Date(formData[field.id]), "PPP")
                  ) : (
                    <span>{field.placeholder || "Select a date"}</span>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar
                  mode="single"
                  selected={formData[field.id] ? new Date(formData[field.id]) : undefined}
                  onSelect={(date) => handleChange(field.id, date ? date.toISOString() : undefined)}
                  disabled={(date) => {
                    if ((field as any).minDate && date < new Date((field as any).minDate)) return true
                    if ((field as any).maxDate && date > new Date((field as any).maxDate)) return true
                    return false
                  }}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>
        )
      
      case 'time':
        return (
          <div className="space-y-2" key={field.id}>
            <Label htmlFor={field.id}>
              {field.label}
              {field.required && <span className="text-destructive ml-1">*</span>}
            </Label>
            {field.description && (
              <p className="text-sm text-muted-foreground">{field.description}</p>
            )}
            <Input
              id={field.id}
              type="time"
              value={formData[field.id] || ''}
              onChange={(e) => handleChange(field.id, e.target.value)}
            />
          </div>
        )
      
      case 'select':
        return (
          <div className="space-y-2" key={field.id}>
            <Label htmlFor={field.id}>
              {field.label}
              {field.required && <span className="text-destructive ml-1">*</span>}
            </Label>
            {field.description && (
              <p className="text-sm text-muted-foreground">{field.description}</p>
            )}
            <Select
              value={formData[field.id] || ''}
              onValueChange={(value) => handleChange(field.id, value)}
            >
              <SelectTrigger id={field.id}>
                <SelectValue placeholder={field.placeholder || 'Select an option'} />
              </SelectTrigger>
              <SelectContent>
                {(field as any).options?.map((option: any, index: number) => (
                  <SelectItem key={index} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )
      
      case 'multiselect':
        return (
          <div className="space-y-2" key={field.id}>
            <Label>
              {field.label}
              {field.required && <span className="text-destructive ml-1">*</span>}
            </Label>
            {field.description && (
              <p className="text-sm text-muted-foreground">{field.description}</p>
            )}
            <div className="flex flex-wrap gap-1 mb-2">
              {(formData[field.id] || []).map((value: string) => {
                const option = (field as any).options?.find((o: any) => o.value === value)
                return (
                  <Badge key={value} variant="secondary" className="flex items-center gap-1">
                    {option?.label || value}
                    <button
                      type="button"
                      className="ml-1 rounded-full outline-none ring-offset-background focus:ring-2 focus:ring-ring focus:ring-offset-2"
                      onClick={() => {
                        const newValues = (formData[field.id] || []).filter((v: string) => v !== value)
                        handleChange(field.id, newValues)
                      }}
                    >
                      ✕
                    </button>
                  </Badge>
                )
              })}
            </div>
            <Select
              onValueChange={(value) => {
                const currentValues = formData[field.id] || []
                if (!currentValues.includes(value)) {
                  handleChange(field.id, [...currentValues, value])
                }
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder={field.placeholder || 'Select options'} />
              </SelectTrigger>
              <SelectContent>
                {(field as any).options?.map((option: any, index: number) => (
                  <SelectItem 
                    key={index} 
                    value={option.value}
                    disabled={(formData[field.id] || []).includes(option.value)}
                  >
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )
      
      case 'checkbox':
        return (
          <div className="space-y-2" key={field.id}>
            <div>
              {field.label}
              {field.required && <span className="text-destructive ml-1">*</span>}
            </div>
            {field.description && (
              <p className="text-sm text-muted-foreground">{field.description}</p>
            )}
            {(field as any).options ? (
              <div className="space-y-2">
                {(field as any).options.map((option: any, index: number) => {
                  const checkboxId = `${field.id}-${option.value}`
                  const isChecked = Array.isArray(formData[field.id]) && formData[field.id]?.includes(option.value)
                  
                  return (
                    <div key={index} className="flex items-center space-x-2">
                      <Checkbox
                        id={checkboxId}
                        checked={isChecked}
                        onCheckedChange={(checked) => {
                          const currentValues = Array.isArray(formData[field.id]) ? formData[field.id] : []
                          if (checked) {
                            handleChange(field.id, [...currentValues, option.value])
                          } else {
                            handleChange(field.id, currentValues.filter((v: string) => v !== option.value))
                          }
                        }}
                      />
                      <Label htmlFor={checkboxId}>{option.label}</Label>
                    </div>
                  )
                })}
              </div>
            ) : (
              <div className="flex items-center space-x-2">
                <Checkbox
                  id={field.id}
                  checked={formData[field.id] === true}
                  onCheckedChange={(checked) => handleChange(field.id, !!checked)}
                />
                <Label htmlFor={field.id}>{field.label}</Label>
              </div>
            )}
          </div>
        )
      
      case 'radio':
        return (
          <div className="space-y-2" key={field.id}>
            <div>
              {field.label}
              {field.required && <span className="text-destructive ml-1">*</span>}
            </div>
            {field.description && (
              <p className="text-sm text-muted-foreground">{field.description}</p>
            )}
            <RadioGroup
              value={formData[field.id] || ''}
              onValueChange={(value) => handleChange(field.id, value)}
            >
              {(field as any).options?.map((option: any, index: number) => (
                <div key={index} className="flex items-center space-x-2">
                  <RadioGroupItem value={option.value} id={`${field.id}-${option.value}`} />
                  <Label htmlFor={`${field.id}-${option.value}`}>{option.label}</Label>
                </div>
              ))}
            </RadioGroup>
          </div>
        )
      
      case 'textarea':
        return (
          <div className="space-y-2" key={field.id}>
            <Label htmlFor={field.id}>
              {field.label}
              {field.required && <span className="text-destructive ml-1">*</span>}
            </Label>
            {field.description && (
              <p className="text-sm text-muted-foreground">{field.description}</p>
            )}
            <Textarea
              id={field.id}
              placeholder={field.placeholder}
              value={formData[field.id] || ''}
              onChange={(e) => handleChange(field.id, e.target.value)}
              rows={(field as any).rows || 3}
            />
          </div>
        )
      
      default:
        return <div key={field.id}>Unsupported field type</div>
    }
  }

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>{schema.title}</CardTitle>
        {schema.description && <CardDescription>{schema.description}</CardDescription>}
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {visibleFields.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">
              This form has no fields yet. Add some fields to preview the form.
            </p>
          ) : (
            visibleFields.map(renderField)
          )}
          
          {submitted ? (
            <div className="p-4 bg-green-50 text-green-700 rounded-md">
              Form submitted successfully! Data has been logged to the console.
            </div>
          ) : (
            <Button type="submit" disabled={submitting || visibleFields.length === 0} className="w-full">
              {submitting ? (
                <>
                  <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />
                  Submitting...
                </>
              ) : (
                'Submit'
              )}
            </Button>
          )}
        </form>
      </CardContent>
    </Card>
  )
} 
"use client"

import React from 'react'
import { FormField } from '@/types/form-builder'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { 
  Command, 
  CommandEmpty, 
  CommandGroup, 
  CommandInput, 
  CommandItem 
} from '@/components/ui/command'
import { CalendarIcon } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Calendar } from '@/components/ui/calendar'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { format } from 'date-fns'

interface FieldPreviewProps {
  field: FormField
}

export function FieldPreview({ field }: FieldPreviewProps) {
  // For demo/preview only - field won't actually be functional
  
  const renderFieldPreview = () => {
    switch (field.type) {
      case 'text':
        return (
          <Input 
            placeholder={field.placeholder || 'Enter text'} 
            disabled 
          />
        )
      
      case 'number':
        return (
          <Input 
            type="number" 
            placeholder={field.placeholder || 'Enter number'} 
            disabled 
          />
        )
      
      case 'email':
        return (
          <Input 
            type="email" 
            placeholder={field.placeholder || 'Enter email'} 
            disabled 
          />
        )
      
      case 'phone':
        return (
          <Input 
            type="tel" 
            placeholder={field.placeholder || 'Enter phone number'} 
            disabled 
          />
        )
      
      case 'date':
        return (
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  "w-full justify-start text-left font-normal",
                  !field.defaultValue && "text-muted-foreground"
                )}
                disabled
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {field.defaultValue ? (
                  format(new Date(field.defaultValue as string), "PPP")
                ) : (
                  <span>{field.placeholder || "Select a date"}</span>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0">
              <Calendar
                initialFocus
                disabled
              />
            </PopoverContent>
          </Popover>
        )
      
      case 'time':
        return (
          <Input 
            type="time" 
            placeholder={field.placeholder || 'Select time'} 
            disabled 
          />
        )
      
      case 'select':
        return (
          <Select disabled>
            <SelectTrigger>
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
        )
      
      case 'multiselect':
        return (
          <Command className="border rounded-md">
            <CommandInput placeholder={field.placeholder || 'Search options...'} disabled />
            <CommandEmpty>No options found.</CommandEmpty>
            <CommandGroup>
              {(field as any).options?.map((option: any, index: number) => (
                <CommandItem key={index} disabled>
                  <Checkbox className="mr-2" disabled />
                  {option.label}
                </CommandItem>
              ))}
            </CommandGroup>
          </Command>
        )
      
      case 'checkbox':
        return (
          <div className="space-y-2">
            {(field as any).options ? (
              (field as any).options.map((option: any, index: number) => (
                <div key={index} className="flex items-center space-x-2">
                  <Checkbox id={`${field.id}-${index}`} disabled />
                  <Label htmlFor={`${field.id}-${index}`}>{option.label}</Label>
                </div>
              ))
            ) : (
              <div className="flex items-center space-x-2">
                <Checkbox id={field.id} disabled />
                <Label htmlFor={field.id}>{field.label}</Label>
              </div>
            )}
          </div>
        )
      
      case 'radio':
        return (
          <RadioGroup disabled>
            {(field as any).options?.map((option: any, index: number) => (
              <div key={index} className="flex items-center space-x-2">
                <RadioGroupItem value={option.value} id={`${field.id}-${index}`} disabled />
                <Label htmlFor={`${field.id}-${index}`}>{option.label}</Label>
              </div>
            ))}
          </RadioGroup>
        )
      
      case 'textarea':
        return (
          <Textarea 
            placeholder={field.placeholder || 'Enter text'} 
            disabled 
            rows={(field as any).rows || 3}
          />
        )
      
      default:
        return <div>Unsupported field type</div>
    }
  }

  return (
    <div className="space-y-1.5">
      {field.description && (
        <p className="text-sm text-muted-foreground">{field.description}</p>
      )}
      {renderFieldPreview()}
    </div>
  )
} 
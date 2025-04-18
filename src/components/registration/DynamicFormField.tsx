'use client';

import { useState } from 'react';
import { FormField, FormItem, FormLabel, FormControl, FormDescription, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { format } from 'date-fns';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import { CalendarIcon, ChevronDown, Check } from 'lucide-react';
import { 
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList
} from '@/components/ui/command';

// Field types that can be used in the form schema
export type FieldType = 
  | 'text'
  | 'number'
  | 'email'
  | 'phone'
  | 'date'
  | 'time'
  | 'select'
  | 'multiselect'
  | 'checkbox'
  | 'radio'
  | 'textarea';

// Interface defining a field option (for select, multiselect, radio, etc.)
export interface FieldOption {
  value: string;
  label: string;
}

// Interface defining a form field in the schema
export interface FormFieldSchema {
  id: string;
  type: FieldType;
  label: string;
  placeholder?: string;
  description?: string;
  required?: boolean;
  options?: FieldOption[];
  minLength?: number;
  maxLength?: number;
  min?: number;
  max?: number;
  pattern?: string;
  defaultValue?: any;
  conditionalOn?: {
    field: string;
    value: any;
  };
}

interface DynamicFormFieldProps {
  field: FormFieldSchema;
  form: any; // React Hook Form form instance
  allValues: Record<string, any>; // All current form values for conditional logic
}

export const DynamicFormField = ({ field, form, allValues }: DynamicFormFieldProps) => {
  const [multiSelectOpen, setMultiSelectOpen] = useState(false);
  
  // Check conditional visibility
  if (field.conditionalOn) {
    const { field: conditionField, value: conditionValue } = field.conditionalOn;
    const fieldValue = allValues[conditionField];
    
    // If condition is not met, don't render the field
    if (Array.isArray(conditionValue)) {
      if (!conditionValue.includes(fieldValue)) {
        return null;
      }
    } else if (fieldValue !== conditionValue) {
      return null;
    }
  }

  // Render different field components based on field type
  return (
    <FormField
      control={form.control}
      name={field.id}
      render={({ field: formField }) => (
        <FormItem>
          <FormLabel>
            {field.label}
            {field.required && <span className="text-red-500 ml-1">*</span>}
          </FormLabel>
          <FormControl>
            {field.type === 'text' && (
              <Input
                placeholder={field.placeholder}
                {...formField}
                value={formField.value || ''}
              />
            )}
            
            {field.type === 'email' && (
              <Input
                type="email"
                placeholder={field.placeholder}
                {...formField}
                value={formField.value || ''}
              />
            )}
            
            {field.type === 'phone' && (
              <Input
                type="tel"
                placeholder={field.placeholder || 'Enter phone number'}
                {...formField}
                value={formField.value || ''}
              />
            )}
            
            {field.type === 'number' && (
              <Input
                type="number"
                placeholder={field.placeholder}
                min={field.min}
                max={field.max}
                {...formField}
                value={formField.value ?? ''}
                onChange={e => {
                  const val = e.target.value === '' ? '' : Number(e.target.value);
                  formField.onChange(val);
                }}
              />
            )}
            
            {field.type === 'textarea' && (
              <Textarea
                placeholder={field.placeholder}
                {...formField}
                value={formField.value || ''}
              />
            )}
            
            {field.type === 'date' && (
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !formField.value && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {formField.value ? format(new Date(formField.value), 'PPP') : <span>Pick a date</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={formField.value ? new Date(formField.value) : undefined}
                    onSelect={formField.onChange}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            )}
            
            {field.type === 'select' && field.options && (
              <Select
                value={formField.value || ''}
                onValueChange={formField.onChange}
              >
                <SelectTrigger>
                  <SelectValue placeholder={field.placeholder || `Select ${field.label}`} />
                </SelectTrigger>
                <SelectContent>
                  {field.options.map(option => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
            
            {field.type === 'multiselect' && field.options && (
              <div className="w-full">
                <Popover open={multiSelectOpen} onOpenChange={setMultiSelectOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      role="combobox"
                      className="w-full justify-between"
                    >
                      {formField.value && formField.value.length > 0
                        ? `${formField.value.length} selected`
                        : field.placeholder || `Select ${field.label}`}
                      <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-full p-0">
                    <Command>
                      <CommandInput placeholder={`Search ${field.label.toLowerCase()}...`} />
                      <CommandList>
                        <CommandEmpty>No results found.</CommandEmpty>
                        <CommandGroup>
                          {field.options.map(option => {
                            const isSelected = Array.isArray(formField.value) && 
                              formField.value.includes(option.value);
                            
                            return (
                              <CommandItem
                                key={option.value}
                                value={option.value}
                                onSelect={() => {
                                  const newValues = Array.isArray(formField.value) 
                                    ? [...formField.value] 
                                    : [];
                                  
                                  if (isSelected) {
                                    formField.onChange(newValues.filter(val => val !== option.value));
                                  } else {
                                    newValues.push(option.value);
                                    formField.onChange(newValues);
                                  }
                                }}
                              >
                                <div className="flex items-center">
                                  <div className={cn(
                                    "mr-2 flex h-4 w-4 items-center justify-center rounded-sm border border-primary",
                                    isSelected ? "bg-primary text-primary-foreground" : "opacity-50"
                                  )}>
                                    {isSelected && <Check className="h-3 w-3" />}
                                  </div>
                                  {option.label}
                                </div>
                              </CommandItem>
                            );
                          })}
                        </CommandGroup>
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>
              </div>
            )}
            
            {field.type === 'checkbox' && (
              <div className="flex items-center space-x-2">
                <Checkbox
                  id={field.id}
                  checked={formField.value || false}
                  onCheckedChange={formField.onChange}
                />
                <label
                  htmlFor={field.id}
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                >
                  {field.placeholder || field.description}
                </label>
              </div>
            )}
            
            {field.type === 'radio' && field.options && (
              <RadioGroup
                value={formField.value || ''}
                onValueChange={formField.onChange}
              >
                {field.options.map(option => (
                  <div key={option.value} className="flex items-center space-x-2">
                    <RadioGroupItem value={option.value} id={`${field.id}-${option.value}`} />
                    <label
                      htmlFor={`${field.id}-${option.value}`}
                      className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                    >
                      {option.label}
                    </label>
                  </div>
                ))}
              </RadioGroup>
            )}
          </FormControl>
          {field.description && <FormDescription>{field.description}</FormDescription>}
          <FormMessage />
        </FormItem>
      )}
    />
  );
}; 
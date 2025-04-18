import { z } from 'zod'

// Field types for form builder
export type FormFieldType = 
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
  | 'textarea'

// Base field interface
export interface FormFieldBase {
  id: string;
  type: FormFieldType;
  label: string;
  placeholder?: string;
  required: boolean;
  description?: string;
  defaultValue?: string | number | boolean | string[];
  conditionalDisplay?: {
    dependsOn: string; // ID of field this depends on
    showWhen: string | number | boolean | string[]; // Value that triggers display
  };
}

// Text field
export interface TextField extends FormFieldBase {
  type: 'text';
  minLength?: number;
  maxLength?: number;
  defaultValue?: string;
}

// Number field
export interface NumberField extends FormFieldBase {
  type: 'number';
  min?: number;
  max?: number;
  step?: number;
  defaultValue?: number;
}

// Email field
export interface EmailField extends FormFieldBase {
  type: 'email';
  defaultValue?: string;
}

// Phone field
export interface PhoneField extends FormFieldBase {
  type: 'phone';
  defaultValue?: string;
}

// Date field
export interface DateField extends FormFieldBase {
  type: 'date';
  minDate?: string; // ISO string
  maxDate?: string; // ISO string
  defaultValue?: string;
}

// Time field
export interface TimeField extends FormFieldBase {
  type: 'time';
  defaultValue?: string;
}

// Option type for select, multiselect, checkbox, radio
export interface FormFieldOption {
  value: string;
  label: string;
}

// Select field
export interface SelectField extends FormFieldBase {
  type: 'select';
  options: FormFieldOption[];
  defaultValue?: string;
}

// Multiselect field
export interface MultiSelectField extends FormFieldBase {
  type: 'multiselect';
  options: FormFieldOption[];
  defaultValue?: string[];
}

// Checkbox field
export interface CheckboxField extends FormFieldBase {
  type: 'checkbox';
  options?: FormFieldOption[]; // If not provided, it's a single checkbox
  defaultValue?: boolean | string[];
}

// Radio field
export interface RadioField extends FormFieldBase {
  type: 'radio';
  options: FormFieldOption[];
  defaultValue?: string;
}

// Textarea field
export interface TextareaField extends FormFieldBase {
  type: 'textarea';
  minLength?: number;
  maxLength?: number;
  rows?: number;
  defaultValue?: string;
}

// Union type for all field types
export type FormField = 
  | TextField
  | NumberField
  | EmailField
  | PhoneField
  | DateField
  | TimeField
  | SelectField
  | MultiSelectField
  | CheckboxField
  | RadioField
  | TextareaField

// Form schema
export interface FormSchema {
  id: string;
  title: string;
  description?: string;
  fields: FormField[];
}

// Form Builder Schema with Zod
export const formFieldOptionSchema = z.object({
  value: z.string(),
  label: z.string()
})

export const conditionalDisplaySchema = z.object({
  dependsOn: z.string(),
  showWhen: z.union([z.string(), z.number(), z.boolean(), z.array(z.string())])
})

export const formFieldBaseSchema = z.object({
  id: z.string(),
  label: z.string(),
  placeholder: z.string().optional(),
  required: z.boolean().default(false),
  description: z.string().optional(),
  conditionalDisplay: conditionalDisplaySchema.optional()
})

export const textFieldSchema = formFieldBaseSchema.extend({
  type: z.literal('text'),
  minLength: z.number().optional(),
  maxLength: z.number().optional(),
  defaultValue: z.string().optional()
})

export const numberFieldSchema = formFieldBaseSchema.extend({
  type: z.literal('number'),
  min: z.number().optional(),
  max: z.number().optional(),
  step: z.number().optional(),
  defaultValue: z.number().optional()
})

export const emailFieldSchema = formFieldBaseSchema.extend({
  type: z.literal('email'),
  defaultValue: z.string().optional()
})

export const phoneFieldSchema = formFieldBaseSchema.extend({
  type: z.literal('phone'),
  defaultValue: z.string().optional()
})

export const dateFieldSchema = formFieldBaseSchema.extend({
  type: z.literal('date'),
  minDate: z.string().optional(),
  maxDate: z.string().optional(),
  defaultValue: z.string().optional()
})

export const timeFieldSchema = formFieldBaseSchema.extend({
  type: z.literal('time'),
  defaultValue: z.string().optional()
})

export const selectFieldSchema = formFieldBaseSchema.extend({
  type: z.literal('select'),
  options: z.array(formFieldOptionSchema),
  defaultValue: z.string().optional()
})

export const multiSelectFieldSchema = formFieldBaseSchema.extend({
  type: z.literal('multiselect'),
  options: z.array(formFieldOptionSchema),
  defaultValue: z.array(z.string()).optional()
})

export const checkboxFieldSchema = formFieldBaseSchema.extend({
  type: z.literal('checkbox'),
  options: z.array(formFieldOptionSchema).optional(),
  defaultValue: z.union([z.boolean(), z.array(z.string())]).optional()
})

export const radioFieldSchema = formFieldBaseSchema.extend({
  type: z.literal('radio'),
  options: z.array(formFieldOptionSchema),
  defaultValue: z.string().optional()
})

export const textareaFieldSchema = formFieldBaseSchema.extend({
  type: z.literal('textarea'),
  minLength: z.number().optional(),
  maxLength: z.number().optional(),
  rows: z.number().optional(),
  defaultValue: z.string().optional()
})

export const formFieldSchema = z.discriminatedUnion('type', [
  textFieldSchema,
  numberFieldSchema,
  emailFieldSchema,
  phoneFieldSchema,
  dateFieldSchema,
  timeFieldSchema,
  selectFieldSchema,
  multiSelectFieldSchema,
  checkboxFieldSchema,
  radioFieldSchema,
  textareaFieldSchema
])

export const formSchemaSchema = z.object({
  id: z.string(),
  title: z.string(),
  description: z.string().optional(),
  fields: z.array(formFieldSchema)
}) 
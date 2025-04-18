"use client"

import React from 'react'
import { FormField, FormFieldOption } from '@/types/form-builder'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Textarea } from '@/components/ui/textarea'
import { Plus, Trash2 } from 'lucide-react'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { v4 as uuidv4 } from 'uuid'

interface FieldSettingsProps {
  field: FormField
  onUpdate: (field: FormField) => void
  onDelete: () => void
  view?: 'properties' | 'validation' | 'advanced'
  availableFields: FormField[]
}

export function FieldSettings({ 
  field, 
  onUpdate, 
  onDelete,
  view = 'properties',
  availableFields 
}: FieldSettingsProps) {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    onUpdate({ ...field, [name]: value })
  }

  const handleSwitchChange = (name: string, checked: boolean) => {
    onUpdate({ ...field, [name]: checked })
  }

  const handleNumberChange = (name: string, value: string) => {
    onUpdate({ ...field, [name]: value === '' ? undefined : Number(value) })
  }

  const handleOptionChange = (index: number, key: 'label' | 'value', value: string) => {
    if (['select', 'multiselect', 'radio', 'checkbox'].includes(field.type)) {
      const fieldWithOptions = field as any
      const updatedOptions = [...fieldWithOptions.options]
      updatedOptions[index] = { ...updatedOptions[index], [key]: value }
      onUpdate({ ...field, options: updatedOptions })
    }
  }

  const handleAddOption = () => {
    if (['select', 'multiselect', 'radio', 'checkbox'].includes(field.type)) {
      const fieldWithOptions = field as any
      const updatedOptions = [...(fieldWithOptions.options || [])]
      updatedOptions.push({ value: `option${updatedOptions.length + 1}`, label: `Option ${updatedOptions.length + 1}` })
      onUpdate({ ...field, options: updatedOptions })
    }
  }

  const handleRemoveOption = (index: number) => {
    if (['select', 'multiselect', 'radio', 'checkbox'].includes(field.type)) {
      const fieldWithOptions = field as any
      const updatedOptions = [...fieldWithOptions.options]
      updatedOptions.splice(index, 1)
      onUpdate({ ...field, options: updatedOptions })
    }
  }

  const handleDependencyFieldChange = (fieldId: string) => {
    const conditionalDisplay = field.conditionalDisplay || { dependsOn: '', showWhen: '' }
    onUpdate({
      ...field,
      conditionalDisplay: {
        ...conditionalDisplay,
        dependsOn: fieldId,
      },
    })
  }

  const handleShowWhenChange = (value: string) => {
    const conditionalDisplay = field.conditionalDisplay || { dependsOn: '', showWhen: '' }
    onUpdate({
      ...field,
      conditionalDisplay: {
        ...conditionalDisplay,
        showWhen: value,
      },
    })
  }

  // Helper to render field properties settings
  const renderPropertiesSettings = () => (
    <div className="space-y-4">
      <div>
        <Label htmlFor="label">Field Label</Label>
        <Input
          id="label"
          name="label"
          value={field.label}
          onChange={handleChange}
          placeholder="Field Label"
        />
      </div>
      
      <div>
        <Label htmlFor="placeholder">Placeholder</Label>
        <Input
          id="placeholder"
          name="placeholder"
          value={field.placeholder || ''}
          onChange={handleChange}
          placeholder="Placeholder text"
        />
      </div>
      
      <div>
        <Label htmlFor="description">Help Text</Label>
        <Textarea
          id="description"
          name="description"
          value={field.description || ''}
          onChange={handleChange}
          placeholder="Additional description for this field"
          rows={3}
        />
      </div>
      
      <div className="flex items-center space-x-2">
        <Switch
          id="required"
          checked={field.required}
          onCheckedChange={(checked) => handleSwitchChange('required', checked)}
        />
        <Label htmlFor="required">Required field</Label>
      </div>
      
      {/* Render options for select, multiselect, radio, checkbox */}
      {['select', 'multiselect', 'radio', 'checkbox'].includes(field.type) && (
        <div className="space-y-2">
          <Label>Options</Label>
          {(field as any).options?.map((option: FormFieldOption, index: number) => (
            <div key={index} className="flex space-x-2">
              <Input
                value={option.label}
                onChange={(e) => handleOptionChange(index, 'label', e.target.value)}
                placeholder="Option Label"
              />
              <Input
                value={option.value}
                onChange={(e) => handleOptionChange(index, 'value', e.target.value)}
                placeholder="Option Value"
              />
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={() => handleRemoveOption(index)}
                title="Remove option"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          ))}
          <Button
            variant="outline"
            size="sm"
            onClick={handleAddOption}
            className="mt-2"
          >
            <Plus className="h-4 w-4 mr-2" /> Add Option
          </Button>
        </div>
      )}
      
      {/* Render rows for textarea */}
      {field.type === 'textarea' && (
        <div>
          <Label htmlFor="rows">Rows</Label>
          <Input
            id="rows"
            name="rows"
            type="number"
            value={(field as any).rows || 3}
            onChange={(e) => handleNumberChange('rows', e.target.value)}
            placeholder="Number of rows"
          />
        </div>
      )}
    </div>
  )

  // Helper to render field validation settings
  const renderValidationSettings = () => (
    <div className="space-y-4">
      {/* Min/Max length for text and textarea */}
      {['text', 'textarea'].includes(field.type) && (
        <>
          <div>
            <Label htmlFor="minLength">Minimum Length</Label>
            <Input
              id="minLength"
              name="minLength"
              type="number"
              value={(field as any).minLength || ''}
              onChange={(e) => handleNumberChange('minLength', e.target.value)}
              placeholder="Minimum character length"
            />
          </div>
          <div>
            <Label htmlFor="maxLength">Maximum Length</Label>
            <Input
              id="maxLength"
              name="maxLength"
              type="number"
              value={(field as any).maxLength || ''}
              onChange={(e) => handleNumberChange('maxLength', e.target.value)}
              placeholder="Maximum character length"
            />
          </div>
        </>
      )}
      
      {/* Min/Max for number */}
      {field.type === 'number' && (
        <>
          <div>
            <Label htmlFor="min">Minimum Value</Label>
            <Input
              id="min"
              name="min"
              type="number"
              value={(field as any).min || ''}
              onChange={(e) => handleNumberChange('min', e.target.value)}
              placeholder="Minimum value"
            />
          </div>
          <div>
            <Label htmlFor="max">Maximum Value</Label>
            <Input
              id="max"
              name="max"
              type="number"
              value={(field as any).max || ''}
              onChange={(e) => handleNumberChange('max', e.target.value)}
              placeholder="Maximum value"
            />
          </div>
          <div>
            <Label htmlFor="step">Step</Label>
            <Input
              id="step"
              name="step"
              type="number"
              value={(field as any).step || ''}
              onChange={(e) => handleNumberChange('step', e.target.value)}
              placeholder="Step increment"
            />
          </div>
        </>
      )}
      
      {/* Min/Max date for date fields */}
      {field.type === 'date' && (
        <>
          <div>
            <Label htmlFor="minDate">Minimum Date</Label>
            <Input
              id="minDate"
              name="minDate"
              type="date"
              value={(field as any).minDate || ''}
              onChange={handleChange}
              placeholder="Minimum date"
            />
          </div>
          <div>
            <Label htmlFor="maxDate">Maximum Date</Label>
            <Input
              id="maxDate"
              name="maxDate"
              type="date"
              value={(field as any).maxDate || ''}
              onChange={handleChange}
              placeholder="Maximum date"
            />
          </div>
        </>
      )}
    </div>
  )

  // Helper to render advanced settings
  const renderAdvancedSettings = () => (
    <div className="space-y-4">
      <div>
        <Label htmlFor="id">Field ID</Label>
        <Input
          id="id"
          value={field.id}
          readOnly
          disabled
        />
        <p className="text-xs text-muted-foreground mt-1">
          Unique identifier for this field
        </p>
      </div>
      
      <div>
        <Label htmlFor="defaultValue">Default Value</Label>
        <Input
          id="defaultValue"
          name="defaultValue"
          value={(field as any).defaultValue || ''}
          onChange={handleChange}
          placeholder="Default value"
        />
      </div>
      
      <div className="space-y-2">
        <Label>Conditional Display</Label>
        <p className="text-xs text-muted-foreground">
          Show this field only when another field has a specific value
        </p>
        
        <div className="space-y-2">
          <Label htmlFor="dependsOn">Depends on field</Label>
          <Select
            value={field.conditionalDisplay?.dependsOn || ''}
            onValueChange={(value) => handleDependencyFieldChange(value)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select a field" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">None</SelectItem>
              {availableFields
                .filter((f) => f.id !== field.id)
                .map((f) => (
                  <SelectItem key={f.id} value={f.id}>
                    {f.label}
                  </SelectItem>
                ))}
            </SelectContent>
          </Select>
        </div>
        
        {field.conditionalDisplay?.dependsOn && (
          <div className="space-y-2">
            <Label htmlFor="showWhen">Show when value is</Label>
            <Input
              id="showWhen"
              value={field.conditionalDisplay?.showWhen?.toString() || ''}
              onChange={(e) => handleShowWhenChange(e.target.value)}
              placeholder="Value that triggers display"
            />
          </div>
        )}
      </div>
    </div>
  )

  return (
    <div className="space-y-6 py-4">
      {view === 'properties' && renderPropertiesSettings()}
      {view === 'validation' && renderValidationSettings()}
      {view === 'advanced' && renderAdvancedSettings()}
      
      <div className="pt-4 border-t">
        <Button 
          variant="destructive" 
          onClick={onDelete}
          className="w-full"
        >
          <Trash2 className="h-4 w-4 mr-2" /> Delete Field
        </Button>
      </div>
    </div>
  )
} 
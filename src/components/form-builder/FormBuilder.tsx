"use client"

import React, { useState } from 'react'
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd'
import { Plus, Trash2, MoveVertical, Settings, Eye } from 'lucide-react'
import { v4 as uuidv4 } from 'uuid'

import { FormField, FormFieldType, FormSchema } from '@/types/form-builder'
import { Button } from '@/components/ui/button'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs'
import { Card, CardContent } from '@/components/ui/card'
import { FieldSettings } from './FieldSettings'
import { FieldPreview } from './FieldPreview'
import { FormPreview } from './FormPreview'

const FIELD_TYPES: { type: FormFieldType; label: string; icon?: React.ReactNode }[] = [
  { type: 'text', label: 'Text' },
  { type: 'number', label: 'Number' },
  { type: 'email', label: 'Email' },
  { type: 'phone', label: 'Phone' },
  { type: 'date', label: 'Date' },
  { type: 'time', label: 'Time' },
  { type: 'select', label: 'Select' },
  { type: 'multiselect', label: 'Multi Select' },
  { type: 'checkbox', label: 'Checkbox' },
  { type: 'radio', label: 'Radio' },
  { type: 'textarea', label: 'Text Area' },
]

interface FormBuilderProps {
  initialSchema?: FormSchema
  onSave: (schema: FormSchema) => void
}

export function FormBuilder({ initialSchema, onSave }: FormBuilderProps) {
  const [formSchema, setFormSchema] = useState<FormSchema>(
    initialSchema || {
      id: uuidv4(),
      title: 'New Registration Form',
      description: 'Enter the details for your registration form',
      fields: [],
    }
  )
  
  const [selectedFieldId, setSelectedFieldId] = useState<string | null>(null)
  const [isPreviewMode, setIsPreviewMode] = useState(false)
  const [isSettingsOpen, setIsSettingsOpen] = useState(false)

  const selectedField = formSchema.fields.find(field => field.id === selectedFieldId)

  const handleAddField = (type: FormFieldType) => {
    const newField: FormField = {
      id: uuidv4(),
      type,
      label: `New ${type} field`,
      required: false,
      placeholder: `Enter ${type}`,
    }

    // Add options for fields that need them
    if (['select', 'multiselect', 'radio'].includes(type)) {
      (newField as any).options = [
        { value: 'option1', label: 'Option 1' },
        { value: 'option2', label: 'Option 2' },
      ]
    }

    const updatedFields = [...formSchema.fields, newField]
    setFormSchema({ ...formSchema, fields: updatedFields })
    setSelectedFieldId(newField.id)
    setIsSettingsOpen(true)
  }

  const handleFieldUpdate = (updatedField: FormField) => {
    const updatedFields = formSchema.fields.map(field => 
      field.id === updatedField.id ? updatedField : field
    )
    setFormSchema({ ...formSchema, fields: updatedFields })
  }

  const handleFieldDelete = (id: string) => {
    const updatedFields = formSchema.fields.filter(field => field.id !== id)
    setFormSchema({ ...formSchema, fields: updatedFields })
    
    if (selectedFieldId === id) {
      setSelectedFieldId(null)
      setIsSettingsOpen(false)
    }
  }

  const handleFormTitleChange = (title: string) => {
    setFormSchema({ ...formSchema, title })
  }

  const handleFormDescriptionChange = (description: string) => {
    setFormSchema({ ...formSchema, description })
  }

  const handleDragEnd = (result: DropResult) => {
    if (!result.destination) return
    
    const sourceIndex = result.source.index
    const destinationIndex = result.destination.index
    
    const updatedFields = Array.from(formSchema.fields)
    const [removed] = updatedFields.splice(sourceIndex, 1)
    updatedFields.splice(destinationIndex, 0, removed)
    
    setFormSchema({ ...formSchema, fields: updatedFields })
  }

  const handleSave = () => {
    onSave(formSchema)
  }

  return (
    <div className="flex flex-col space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold">Custom Form Builder</h2>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => setIsPreviewMode(!isPreviewMode)}
          >
            <Eye className="h-4 w-4 mr-2" />
            {isPreviewMode ? 'Edit' : 'Preview'}
          </Button>
          <Button onClick={handleSave}>Save Form</Button>
        </div>
      </div>

      {isPreviewMode ? (
        <FormPreview schema={formSchema} />
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          <div className="lg:col-span-1 space-y-4">
            <Card>
              <CardContent className="p-4">
                <h3 className="font-medium mb-2">Add Fields</h3>
                <div className="space-y-2">
                  {FIELD_TYPES.map(({ type, label }) => (
                    <Button
                      key={type}
                      variant="outline"
                      className="w-full justify-start"
                      onClick={() => handleAddField(type)}
                    >
                      <Plus className="h-4 w-4 mr-2" /> {label}
                    </Button>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="lg:col-span-2">
            <Card>
              <CardContent className="p-4">
                <div className="mb-4">
                  <input
                    type="text"
                    className="w-full text-xl font-bold bg-transparent border-none focus:outline-none focus:ring-0"
                    value={formSchema.title}
                    onChange={e => handleFormTitleChange(e.target.value)}
                    placeholder="Form Title"
                  />
                  <textarea
                    className="w-full text-sm text-muted-foreground bg-transparent border-none focus:outline-none focus:ring-0 resize-none"
                    value={formSchema.description || ''}
                    onChange={e => handleFormDescriptionChange(e.target.value)}
                    placeholder="Form Description"
                    rows={2}
                  />
                </div>

                <DragDropContext onDragEnd={handleDragEnd}>
                  <Droppable droppableId="form-fields">
                    {(provided) => (
                      <div
                        {...provided.droppableProps}
                        ref={provided.innerRef}
                        className="space-y-4"
                      >
                        {formSchema.fields.length === 0 ? (
                          <div className="border border-dashed rounded-md p-8 text-center text-muted-foreground">
                            <p>Drag fields here or add new ones from the left panel</p>
                          </div>
                        ) : (
                          formSchema.fields.map((field, index) => (
                            <Draggable key={field.id} draggableId={field.id} index={index}>
                              {(provided) => (
                                <div
                                  ref={provided.innerRef}
                                  {...provided.draggableProps}
                                  className={`border rounded-md p-4 relative ${
                                    selectedFieldId === field.id ? 'border-primary' : ''
                                  }`}
                                  onClick={() => {
                                    setSelectedFieldId(field.id)
                                    setIsSettingsOpen(true)
                                  }}
                                >
                                  <div className="flex justify-between items-center mb-2">
                                    <span className="font-medium">
                                      {field.label}
                                      {field.required && <span className="text-destructive ml-1">*</span>}
                                    </span>
                                    <div className="flex items-center">
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        {...provided.dragHandleProps}
                                        title="Drag to reorder"
                                      >
                                        <MoveVertical className="h-4 w-4" />
                                      </Button>
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={(e) => {
                                          e.stopPropagation()
                                          setSelectedFieldId(field.id)
                                          setIsSettingsOpen(true)
                                        }}
                                        title="Field settings"
                                      >
                                        <Settings className="h-4 w-4" />
                                      </Button>
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={(e) => {
                                          e.stopPropagation()
                                          handleFieldDelete(field.id)
                                        }}
                                        title="Delete field"
                                      >
                                        <Trash2 className="h-4 w-4" />
                                      </Button>
                                    </div>
                                  </div>
                                  <FieldPreview field={field} />
                                </div>
                              )}
                            </Draggable>
                          ))
                        )}
                        {provided.placeholder}
                      </div>
                    )}
                  </Droppable>
                </DragDropContext>
              </CardContent>
            </Card>
          </div>

          <div className="lg:col-span-1">
            <Sheet open={isSettingsOpen} onOpenChange={setIsSettingsOpen}>
              <SheetContent className="w-full sm:max-w-md">
                <SheetHeader>
                  <SheetTitle>Field Settings</SheetTitle>
                  <SheetDescription>
                    Configure your field properties here
                  </SheetDescription>
                </SheetHeader>
                {selectedField && (
                  <Tabs defaultValue="properties" className="mt-4">
                    <TabsList className="w-full">
                      <TabsTrigger className="flex-1" value="properties">Properties</TabsTrigger>
                      <TabsTrigger className="flex-1" value="validation">Validation</TabsTrigger>
                      <TabsTrigger className="flex-1" value="advanced">Advanced</TabsTrigger>
                    </TabsList>
                    <TabsContent value="properties">
                      <FieldSettings 
                        field={selectedField} 
                        onUpdate={handleFieldUpdate} 
                        onDelete={() => handleFieldDelete(selectedField.id)}
                        availableFields={formSchema.fields}
                      />
                    </TabsContent>
                    <TabsContent value="validation">
                      <FieldSettings 
                        field={selectedField} 
                        onUpdate={handleFieldUpdate}
                        onDelete={() => handleFieldDelete(selectedField.id)}
                        availableFields={formSchema.fields}
                        view="validation"
                      />
                    </TabsContent>
                    <TabsContent value="advanced">
                      <FieldSettings 
                        field={selectedField} 
                        onUpdate={handleFieldUpdate}
                        onDelete={() => handleFieldDelete(selectedField.id)}
                        availableFields={formSchema.fields}
                        view="advanced"
                      />
                    </TabsContent>
                  </Tabs>
                )}
              </SheetContent>
            </Sheet>
          </div>
        </div>
      )}
    </div>
  )
} 
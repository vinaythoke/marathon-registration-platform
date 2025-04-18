import { useCallback, useState } from 'react'
import { useDropzone } from 'react-dropzone'
import { Upload, X } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface ImageUploadProps {
  value?: string
  onChange: (value: string) => void
  onUpload: (file: File) => Promise<void>
  isUploading?: boolean
}

export function ImageUpload({
  value,
  onChange,
  onUpload,
  isUploading
}: ImageUploadProps) {
  const [preview, setPreview] = useState(value)

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    const file = acceptedFiles[0]
    if (file) {
      const objectUrl = URL.createObjectURL(file)
      setPreview(objectUrl)
      await onUpload(file)
    }
  }, [onUpload])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.png', '.jpg', '.jpeg', '.gif']
    },
    maxFiles: 1,
    multiple: false
  })

  const handleRemove = useCallback(() => {
    setPreview(undefined)
    onChange('')
  }, [onChange])

  return (
    <div className="space-y-4 w-full">
      <div
        {...getRootProps()}
        className={`
          border-2 border-dashed rounded-lg p-4 hover:bg-accent/5 transition
          ${isDragActive ? 'border-primary bg-accent/5' : 'border-muted'}
          ${isUploading ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
        `}
      >
        <input {...getInputProps()} />
        <div className="flex flex-col items-center justify-center gap-2 text-center">
          <Upload className="h-8 w-8 text-muted-foreground" />
          <div className="text-sm text-muted-foreground">
            {isDragActive ? (
              <p>Drop the image here</p>
            ) : (
              <p>Drag & drop an image here, or click to select</p>
            )}
          </div>
        </div>
      </div>
      {preview && (
        <div className="relative aspect-video rounded-lg overflow-hidden">
          <div className="absolute top-2 right-2 z-10">
            <Button
              type="button"
              variant="destructive"
              size="icon"
              onClick={handleRemove}
              disabled={isUploading}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
          <img
            src={preview}
            alt="Upload preview"
            className="object-cover w-full h-full"
          />
        </div>
      )}
    </div>
  )
} 
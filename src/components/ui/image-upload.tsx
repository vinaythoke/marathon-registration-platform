import React, { useCallback, useEffect, useState } from 'react'
import { useDropzone } from 'react-dropzone'
import { Upload, X } from 'lucide-react'

import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'

export interface ImageUploadProps {
  onImageUpload: (file: File | null) => void
  initialImage?: string
  className?: string
}

export function ImageUpload({
  onImageUpload,
  initialImage,
  className,
}: ImageUploadProps) {
  const [preview, setPreview] = useState<string | null>(initialImage || null)
  const [error, setError] = useState<string | null>(null)

  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      if (acceptedFiles.length === 0) return

      const file = acceptedFiles[0]
      if (file.size > 5 * 1024 * 1024) {
        setError("File size must be less than 5MB")
        return
      }

      const previewUrl = URL.createObjectURL(file)
      setPreview(previewUrl)
      setError(null)
      onImageUpload(file)
    },
    [onImageUpload]
  )

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/jpeg': ['.jpg', '.jpeg'],
      'image/png': ['.png'],
      'image/gif': ['.gif']
    },
    maxFiles: 1
  })

  const handleRemove = useCallback(() => {
    setPreview(null)
    onImageUpload(null)
  }, [onImageUpload])

  useEffect(() => {
    // Cleanup preview URL when component unmounts
    return () => {
      if (preview && !initialImage) {
        URL.revokeObjectURL(preview)
      }
    }
  }, [preview, initialImage])

  return (
    <div className={cn('relative', className)}>
      {preview ? (
        <div className="relative aspect-video w-full overflow-hidden rounded-lg">
          <img
            src={preview}
            alt="Preview"
            className="h-full w-full object-cover"
          />
          <button
            onClick={handleRemove}
            className="absolute right-2 top-2 rounded-full bg-black/50 p-1 text-white hover:bg-black/70"
            type="button"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={1.5}
              stroke="currentColor"
              className="h-5 w-5"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>
      ) : (
        <div
          {...getRootProps()}
          className={cn(
            'flex aspect-video w-full cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed p-4 transition-colors',
            isDragActive ? 'border-primary bg-primary/10' : 'border-border hover:bg-accent',
            error && 'border-destructive'
          )}
        >
          <input {...getInputProps()} />
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={1.5}
            stroke="currentColor"
            className="mb-2 h-8 w-8"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5zm10.5-11.25h.008v.008h-.008V8.25zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z"
            />
          </svg>
          <p className="text-sm text-muted-foreground">
            {isDragActive ? 'Drop the image here' : 'Drag & drop an image, or click to select'}
          </p>
          {error && (
            <p className="mt-2 text-sm text-destructive">{error}</p>
          )}
        </div>
      )}
    </div>
  )
} 
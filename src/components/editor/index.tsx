import { useEditor, EditorContent, Editor as TiptapEditor } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Image from '@tiptap/extension-image'
import Link from '@tiptap/extension-link'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Bold,
  Italic,
  List,
  ListOrdered,
  Image as ImageIcon,
  Link as LinkIcon,
  Heading1,
  Heading2,
  Undo,
  Redo,
  Quote,
  Code,
} from 'lucide-react'
import { useState } from 'react'
import { ImageUpload } from '@/components/image-upload'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { useToast } from '@/components/ui/use-toast'

interface EditorProps {
  content?: string
  onChange?: (content: string) => void
  placeholder?: string
}

interface LinkDialogProps {
  editor: TiptapEditor | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

interface ImageDialogProps {
  editor: TiptapEditor | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

const LinkDialog = ({ editor, open, onOpenChange }: LinkDialogProps) => {
  const [url, setUrl] = useState('')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (editor && url) {
      editor
        .chain()
        .focus()
        .setLink({ href: url, target: '_blank' })
        .run()
      setUrl('')
      onOpenChange(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add Link</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="url">URL</Label>
            <Input
              id="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://example.com"
              type="url"
            />
          </div>
          <DialogFooter>
            <Button type="submit">Add Link</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

const ImageDialog = ({ editor, open, onOpenChange }: ImageDialogProps) => {
  const supabase = createClientComponentClient()
  const { toast } = useToast()
  const [isUploading, setIsUploading] = useState(false)

  const handleImageUpload = async (file: File) => {
    try {
      setIsUploading(true)
      
      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        throw new Error('File size must be less than 5MB')
      }

      // Validate file type
      const allowedTypes = ['image/jpeg', 'image/png', 'image/gif']
      if (!allowedTypes.includes(file.type)) {
        throw new Error('File type must be JPEG, PNG, or GIF')
      }

      const fileExt = file.name.split('.').pop()
      const fileName = `${Math.random().toString(36).substring(2)}.${fileExt}`
      const filePath = `editor-images/${fileName}`

      const { error: uploadError } = await supabase.storage
        .from('events')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false
        })

      if (uploadError) {
        throw uploadError
      }

      const { data: { publicUrl } } = supabase.storage
        .from('events')
        .getPublicUrl(filePath)

      if (editor) {
        editor
          .chain()
          .focus()
          .setImage({ src: publicUrl, alt: file.name })
          .run()
      }

      onOpenChange(false)
      toast({
        title: 'Image uploaded successfully',
        description: 'Your image has been added to the content.',
      })
    } catch (error) {
      console.error('Error uploading image:', error)
      toast({
        variant: 'destructive',
        title: 'Error uploading image',
        description: error instanceof Error ? error.message : 'Failed to upload image',
      })
    } finally {
      setIsUploading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add Image</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <ImageUpload
            onUpload={handleImageUpload}
            onChange={() => {}}
            value=""
            isUploading={isUploading}
          />
        </div>
      </DialogContent>
    </Dialog>
  )
}

const MenuBar = ({ editor }: { editor: TiptapEditor | null }) => {
  const [linkDialogOpen, setLinkDialogOpen] = useState(false)
  const [imageDialogOpen, setImageDialogOpen] = useState(false)

  if (!editor) {
    return null
  }

  return (
    <>
      <div className="flex flex-wrap gap-2 p-2 border-b">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => editor.chain().focus().toggleBold().run()}
          className={editor.isActive('bold') ? 'bg-accent' : ''}
        >
          <Bold className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => editor.chain().focus().toggleItalic().run()}
          className={editor.isActive('italic') ? 'bg-accent' : ''}
        >
          <Italic className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
          className={editor.isActive('heading', { level: 1 }) ? 'bg-accent' : ''}
        >
          <Heading1 className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
          className={editor.isActive('heading', { level: 2 }) ? 'bg-accent' : ''}
        >
          <Heading2 className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          className={editor.isActive('bulletList') ? 'bg-accent' : ''}
        >
          <List className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          className={editor.isActive('orderedList') ? 'bg-accent' : ''}
        >
          <ListOrdered className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => editor.chain().focus().toggleBlockquote().run()}
          className={editor.isActive('blockquote') ? 'bg-accent' : ''}
        >
          <Quote className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => editor.chain().focus().toggleCode().run()}
          className={editor.isActive('code') ? 'bg-accent' : ''}
        >
          <Code className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setImageDialogOpen(true)}
        >
          <ImageIcon className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setLinkDialogOpen(true)}
          className={editor.isActive('link') ? 'bg-accent' : ''}
        >
          <LinkIcon className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => editor.chain().focus().undo().run()}
        >
          <Undo className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => editor.chain().focus().redo().run()}
        >
          <Redo className="h-4 w-4" />
        </Button>
      </div>
      <LinkDialog
        editor={editor}
        open={linkDialogOpen}
        onOpenChange={setLinkDialogOpen}
      />
      <ImageDialog
        editor={editor}
        open={imageDialogOpen}
        onOpenChange={setImageDialogOpen}
      />
    </>
  )
}

export function Editor({ content = '', onChange, placeholder }: EditorProps) {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: {
          levels: [1, 2],
        },
        codeBlock: false,
        horizontalRule: false,
      }),
      Image.configure({
        HTMLAttributes: {
          class: 'rounded-lg max-w-full h-auto',
        },
      }),
      Link.configure({
        openOnClick: true,
        HTMLAttributes: {
          target: '_blank',
          rel: 'noopener noreferrer',
          class: 'text-primary underline hover:text-primary/80',
        },
        validate: href => /^https?:\/\//.test(href),
      }),
    ],
    content,
    onUpdate: ({ editor }) => {
      // Sanitize content before calling onChange
      const sanitizedContent = editor.getHTML()
        .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '') // Remove script tags
        .replace(/on\w+="[^"]*"/g, '') // Remove event handlers
        .replace(/javascript:/gi, '') // Remove javascript: URLs
      
      onChange?.(sanitizedContent)
    },
    editorProps: {
      attributes: {
        class: 'prose prose-sm sm:prose lg:prose-lg xl:prose-2xl mx-auto focus:outline-none',
      },
    },
  })

  return (
    <div className="w-full border rounded-md">
      <MenuBar editor={editor} />
      <div className="p-4">
        <EditorContent
          editor={editor}
          className="min-h-[200px]"
        />
      </div>
    </div>
  )
} 
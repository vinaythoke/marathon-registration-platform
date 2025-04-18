"use client";

import { useState } from 'react';
import { useOfflineData } from '@/hooks/useOfflineData';
import { useOffline } from '@/context/OfflineContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, Plus, Trash2, RefreshCw, Edit } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { SyncStatus } from '@/components/ui/sync-status';

// Note type for the offline demo
interface Note {
  id: string;
  title: string;
  content: string;
  createdAt: string;
}

export default function OfflineTestPage() {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const { isOffline, syncNow } = useOffline();
  
  // Use our offline data hook
  const {
    items: notes,
    isLoading,
    error,
    refresh,
    createItem,
    updateItem,
    deleteItem
  } = useOfflineData<Note>('notes', 'notes');
  
  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!title.trim() || !content.trim()) return;
    
    if (editingId) {
      // Update existing note
      await updateItem(editingId, {
        title,
        content,
      });
      
      // Reset form
      setEditingId(null);
    } else {
      // Create new note
      await createItem({
        title,
        content,
        createdAt: new Date().toISOString(),
      });
    }
    
    // Clear form
    setTitle('');
    setContent('');
  };
  
  // Handle edit
  const handleEdit = (note: Note) => {
    setTitle(note.title);
    setContent(note.content);
    setEditingId(note.id);
  };
  
  // Format date
  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleString();
    } catch (e) {
      return dateString;
    }
  };
  
  return (
    <div className="container mx-auto py-8 px-4">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold">Offline Notes</h1>
          <p className="text-muted-foreground mt-1">
            Create and manage notes that work offline
          </p>
        </div>
        <SyncStatus showForceSync={true} />
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Form */}
        <div className="lg:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle>{editingId ? 'Edit Note' : 'Create Note'}</CardTitle>
              <CardDescription>
                {isOffline 
                  ? 'Your note will be saved locally and synced when you reconnect'
                  : 'Your note will be saved immediately'}
              </CardDescription>
            </CardHeader>
            <form onSubmit={handleSubmit}>
              <CardContent className="space-y-4">
                <div>
                  <label className="text-sm font-medium mb-1 block">Title</label>
                  <Input
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Note title"
                    required
                  />
                </div>
                <div>
                  <label className="text-sm font-medium mb-1 block">Content</label>
                  <Textarea
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    placeholder="Note content"
                    required
                    rows={5}
                  />
                </div>
              </CardContent>
              <CardFooter className="flex justify-between">
                {editingId && (
                  <Button 
                    type="button" 
                    variant="outline"
                    onClick={() => {
                      setEditingId(null);
                      setTitle('');
                      setContent('');
                    }}
                  >
                    Cancel
                  </Button>
                )}
                <Button type="submit" className="ml-auto">
                  {editingId ? (
                    <>
                      <Edit className="h-4 w-4 mr-2" />
                      Update Note
                    </>
                  ) : (
                    <>
                      <Plus className="h-4 w-4 mr-2" />
                      Add Note
                    </>
                  )}
                </Button>
              </CardFooter>
            </form>
          </Card>
        </div>
        
        {/* Notes List */}
        <div className="lg:col-span-2">
          <div className="flex justify-between mb-4">
            <h2 className="text-xl font-semibold">Your Notes</h2>
            <Button
              variant="outline"
              size="sm"
              onClick={refresh}
              disabled={isLoading}
            >
              {isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <RefreshCw className="h-4 w-4 mr-2" />
              )}
              Refresh
            </Button>
          </div>
          
          {isLoading ? (
            <div className="flex justify-center p-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : error ? (
            <Card className="bg-red-50 border-red-200">
              <CardContent className="pt-6">
                <p className="text-red-600">{error.message}</p>
              </CardContent>
            </Card>
          ) : notes.length === 0 ? (
            <Card>
              <CardContent className="pt-6 text-center text-muted-foreground">
                <p>No notes yet. Create your first note!</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {notes.map((note) => (
                <Card key={note.id} className="relative">
                  {note.id.startsWith('temp_') && (
                    <Badge className="absolute top-2 right-2 bg-amber-100 text-amber-800 border-amber-300">
                      Pending sync
                    </Badge>
                  )}
                  <CardHeader>
                    <CardTitle>{note.title}</CardTitle>
                    <CardDescription>
                      Created: {formatDate(note.createdAt)}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <p className="whitespace-pre-wrap">{note.content}</p>
                  </CardContent>
                  <CardFooter className="flex justify-end space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEdit(note)}
                    >
                      <Edit className="h-4 w-4 mr-2" />
                      Edit
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => deleteItem(note.id)}
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Delete
                    </Button>
                  </CardFooter>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 
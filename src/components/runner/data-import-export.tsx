"use client";

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Download, Upload, FileText, FileCog, Check, X } from 'lucide-react';
import { RunStatistics } from '@/lib/services/statistics-service';

interface DataImportExportProps {
  userId: string;
  statistics: RunStatistics[];
  onDataImport?: (data: RunStatistics[]) => Promise<void>;
}

export default function DataImportExport({ userId, statistics, onDataImport }: DataImportExportProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [importErrors, setImportErrors] = useState<string[]>([]);
  const [importSuccess, setImportSuccess] = useState(false);
  const [showImportDialog, setShowImportDialog] = useState(false);
  
  // Handle file selection
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    setSelectedFile(file);
    setImportErrors([]);
    setImportSuccess(false);
  };
  
  // Export data to JSON file
  const handleExportJson = () => {
    if (!statistics.length) return;
    
    const data = JSON.stringify(statistics, null, 2);
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = `running-stats-${userId}-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };
  
  // Export data to CSV file
  const handleExportCsv = () => {
    if (!statistics.length) return;
    
    // Define CSV headers
    const headers = [
      'id',
      'event_date',
      'distance',
      'time_seconds',
      'pace_per_km',
      'elevation_gain',
      'average_heart_rate',
      'notes'
    ];
    
    // Convert data to CSV rows
    const rows = statistics.map(stat => [
      stat.id,
      stat.event_date,
      stat.distance,
      stat.time_seconds,
      stat.pace_per_km,
      stat.elevation_gain,
      stat.average_heart_rate || '',
      stat.notes ? `"${stat.notes.replace(/"/g, '""')}"` : ''
    ]);
    
    // Create CSV content
    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.join(','))
    ].join('\n');
    
    // Download CSV file
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = `running-stats-${userId}-${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };
  
  // Import data from JSON file
  const handleImportData = async () => {
    if (!selectedFile || !onDataImport) return;
    
    try {
      setImportErrors([]);
      
      // Read the file
      const reader = new FileReader();
      
      reader.onload = async (e) => {
        try {
          const content = e.target?.result as string;
          const importedData = JSON.parse(content);
          
          // Validate data structure
          if (!Array.isArray(importedData)) {
            setImportErrors(['Invalid data format: The imported file must contain an array of run statistics']);
            return;
          }
          
          // Validate each entry
          const errors: string[] = [];
          const validEntries: RunStatistics[] = [];
          
          importedData.forEach((entry, index) => {
            if (typeof entry !== 'object' || entry === null) {
              errors.push(`Entry at position ${index + 1} is not a valid object`);
              return;
            }
            
            // Check required fields
            if (!entry.distance || typeof entry.distance !== 'number') {
              errors.push(`Entry at position ${index + 1} is missing valid distance value`);
              return;
            }
            
            if (!entry.time_seconds || typeof entry.time_seconds !== 'number') {
              errors.push(`Entry at position ${index + 1} is missing valid time_seconds value`);
              return;
            }
            
            if (!entry.event_date) {
              errors.push(`Entry at position ${index + 1} is missing event_date`);
              return;
            }
            
            // Make sure to set the correct user ID on import
            validEntries.push({
              ...entry,
              user_id: userId,
              // Ensure any missing fields have appropriate default values
              pace_per_km: entry.pace_per_km || entry.time_seconds / (entry.distance * 60),
              elevation_gain: entry.elevation_gain || 0,
            } as RunStatistics);
          });
          
          if (errors.length > 0) {
            setImportErrors(errors);
            return;
          }
          
          // Process valid entries
          await onDataImport(validEntries);
          setImportSuccess(true);
          setTimeout(() => {
            setShowImportDialog(false);
            setSelectedFile(null);
            setImportSuccess(false);
          }, 1500);
        } catch (err) {
          console.error('Error parsing imported file:', err);
          setImportErrors(['Failed to parse the imported file. Please ensure it\'s a valid JSON file.']);
        }
      };
      
      reader.readAsText(selectedFile);
    } catch (err) {
      console.error('Import error:', err);
      setImportErrors(['An unexpected error occurred during import.']);
    }
  };
  
  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center">
          <FileCog className="mr-2 h-5 w-5 text-primary" />
          Data Management
        </CardTitle>
        <CardDescription>Import and export your running statistics</CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="export">
          <TabsList className="mb-4">
            <TabsTrigger value="export">Export Data</TabsTrigger>
            <TabsTrigger value="import">Import Data</TabsTrigger>
          </TabsList>
          
          <TabsContent value="export" className="space-y-4">
            <div className="text-sm text-muted-foreground mb-4">
              Export your running data to use in other apps or create a backup
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base font-medium flex items-center">
                    <FileText className="mr-2 h-4 w-4" />
                    Export as JSON
                  </CardTitle>
                  <CardDescription className="text-xs">
                    Full data backup for re-importing
                  </CardDescription>
                </CardHeader>
                <CardContent className="pt-0 text-sm">
                  <p className="mb-4">Exports all your running data in JSON format for complete backups.</p>
                  <Button 
                    onClick={handleExportJson} 
                    disabled={!statistics.length}
                    size="sm"
                  >
                    <Download className="mr-2 h-4 w-4" />
                    Download JSON
                  </Button>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base font-medium flex items-center">
                    <FileText className="mr-2 h-4 w-4" />
                    Export as CSV
                  </CardTitle>
                  <CardDescription className="text-xs">
                    Spreadsheet-compatible format
                  </CardDescription>
                </CardHeader>
                <CardContent className="pt-0 text-sm">
                  <p className="mb-4">Exports your running data as CSV for use in spreadsheet applications.</p>
                  <Button 
                    onClick={handleExportCsv} 
                    disabled={!statistics.length}
                    size="sm"
                  >
                    <Download className="mr-2 h-4 w-4" />
                    Download CSV
                  </Button>
                </CardContent>
              </Card>
            </div>
            
            {!statistics.length && (
              <Alert variant="default" className="mt-4">
                <AlertTitle>No data to export</AlertTitle>
                <AlertDescription>
                  You don't have any running statistics data to export yet.
                </AlertDescription>
              </Alert>
            )}
          </TabsContent>
          
          <TabsContent value="import" className="space-y-4">
            <div className="text-sm text-muted-foreground mb-4">
              Import running data from backups or other applications
            </div>
            
            <Dialog open={showImportDialog} onOpenChange={setShowImportDialog}>
              <DialogTrigger asChild>
                <Button variant="outline">
                  <Upload className="mr-2 h-4 w-4" />
                  Import Data
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Import Running Data</DialogTitle>
                  <DialogDescription>
                    Upload a JSON file containing your running statistics.
                  </DialogDescription>
                </DialogHeader>
                
                <div className="space-y-4 py-4">
                  {!importSuccess && (
                    <div className="grid w-full max-w-sm items-center gap-1.5">
                      <Label htmlFor="dataFile">Select File</Label>
                      <Input 
                        id="dataFile" 
                        type="file" 
                        accept=".json" 
                        onChange={handleFileChange}
                      />
                      <p className="text-xs text-muted-foreground">
                        Supported format: JSON (exported from this application)
                      </p>
                    </div>
                  )}
                  
                  {importErrors.length > 0 && (
                    <div className="border border-destructive p-3 rounded-md bg-destructive/10">
                      <div className="font-medium text-destructive flex items-center mb-2">
                        <X className="h-4 w-4 mr-2" />
                        Import Failed
                      </div>
                      <ul className="text-sm text-destructive list-disc pl-5 space-y-1">
                        {importErrors.map((error, index) => (
                          <li key={index}>{error}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                  
                  {importSuccess && (
                    <div className="text-center py-8">
                      <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-green-100 mb-4">
                        <Check className="h-6 w-6 text-green-600" />
                      </div>
                      <h3 className="font-medium text-lg mb-1">Import Successful</h3>
                      <p className="text-sm text-muted-foreground">
                        Your running data has been successfully imported
                      </p>
                    </div>
                  )}
                </div>
                
                <DialogFooter>
                  {!importSuccess && (
                    <>
                      <Button variant="outline" onClick={() => setShowImportDialog(false)}>
                        Cancel
                      </Button>
                      <Button
                        onClick={handleImportData}
                        disabled={!selectedFile || importSuccess}
                      >
                        Import
                      </Button>
                    </>
                  )}
                </DialogFooter>
              </DialogContent>
            </Dialog>
            
            <div className="border rounded-md p-4">
              <h3 className="font-medium mb-2">Import Guidelines</h3>
              <ul className="list-disc text-sm pl-5 space-y-2 text-muted-foreground">
                <li>Import will add new entries without replacing existing ones</li>
                <li>The JSON file should contain an array of running activities</li>
                <li>Each entry must have distance, time, and date fields</li>
                <li>You can import data exported from this application</li>
                <li>Importing large datasets may take a few moments</li>
              </ul>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
} 
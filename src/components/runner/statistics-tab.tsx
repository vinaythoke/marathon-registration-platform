import { useState, useEffect } from 'react';
import { 
  Activity, Award, Calendar, Clock, ArrowUp, 
  TrendingUp, Route, Medal, Download, Plus, FileCog
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger
} from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { createClient } from '@/lib/supabase/client';
import { 
  getUserStatisticsSummary, 
  StatisticsSummary,
  formatTime,
  formatPace,
  addRunStatistic,
  importRunStatistics
} from '@/lib/services/statistics-service';

// Import our new components
import PerformanceCharts from './performance-charts';
import AchievementsAndGoals from './achievements-goals';
import DataImportExport from './data-import-export';

interface StatisticsTabProps {
  userId: string;
}

export default function StatisticsTab({ userId }: StatisticsTabProps) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statistics, setStatistics] = useState<StatisticsSummary | null>(null);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [activeTab, setActiveTab] = useState('summary');

  const fetchStatistics = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const summary = await getUserStatisticsSummary(userId);
      setStatistics(summary);
    } catch (err) {
      console.error('Error fetching statistics:', err);
      setError('Failed to load your running statistics. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (userId) {
      fetchStatistics();
    }
  }, [userId]);

  const handleAddRun = async (runData: any) => {
    try {
      // Calculate pace automatically if not provided
      if (!runData.pace_per_km && runData.distance && runData.time_seconds) {
        runData.pace_per_km = runData.time_seconds / (runData.distance * 60);
      }
      
      await addRunStatistic({
        user_id: userId,
        ...runData
      });
      
      await fetchStatistics();
      setShowAddDialog(false);
    } catch (error) {
      console.error('Error adding run:', error);
      throw error;
    }
  };

  const handleImportData = async (data: any[]) => {
    try {
      // Make sure all imported data has the correct user ID
      const preparedData = data.map(item => ({
        ...item,
        user_id: userId
      }));
      
      await importRunStatistics(preparedData);
      await fetchStatistics();
      return Promise.resolve();
    } catch (error) {
      console.error('Error importing data:', error);
      return Promise.reject(error);
    }
  };

  if (loading) {
    return <StatisticsSkeleton />;
  }

  if (error) {
    return (
      <Card>
        <CardContent className="py-10">
          <div className="text-center">
            <p className="text-destructive mb-4">{error}</p>
            <Button onClick={fetchStatistics}>Try Again</Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!statistics || statistics.totalRuns === 0) {
    return <EmptyStatisticsState setShowAddDialog={setShowAddDialog} />;
  }

  return (
    <div className="space-y-6">
      <Tabs defaultValue="summary" value={activeTab} onValueChange={setActiveTab}>
        <div className="flex justify-between items-center mb-4">
          <TabsList>
            <TabsTrigger value="summary">
              <Activity className="h-4 w-4 mr-2" />
              Summary
            </TabsTrigger>
            <TabsTrigger value="performance">
              <TrendingUp className="h-4 w-4 mr-2" />
              Performance
            </TabsTrigger>
            <TabsTrigger value="achievements">
              <Award className="h-4 w-4 mr-2" />
              Goals & Achievements
            </TabsTrigger>
            <TabsTrigger value="data">
              <FileCog className="h-4 w-4 mr-2" />
              Data
            </TabsTrigger>
          </TabsList>
          <Button size="sm" onClick={() => setShowAddDialog(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Add Run
          </Button>
        </div>
        
        <TabsContent value="summary">
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Total Runs Card */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    Total Runs
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-baseline justify-between">
                    <div className="text-3xl font-bold">{statistics.totalRuns}</div>
                    <Activity className="h-5 w-5 text-primary" />
                  </div>
                </CardContent>
              </Card>

              {/* Total Distance Card */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    Total Distance
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-baseline justify-between">
                    <div className="text-3xl font-bold">{statistics.totalDistance.toFixed(1)} km</div>
                    <Route className="h-5 w-5 text-primary" />
                  </div>
                </CardContent>
              </Card>

              {/* Average Pace Card */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    Average Pace
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-baseline justify-between">
                    <div className="text-3xl font-bold">{formatPace(statistics.averagePace)}</div>
                    <TrendingUp className="h-5 w-5 text-primary" />
                  </div>
                  <p className="text-xs text-muted-foreground">min/km</p>
                </CardContent>
              </Card>

              {/* Total Duration Card */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    Total Time
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-baseline justify-between">
                    <div className="text-3xl font-bold">{formatTime(statistics.totalTimeSeconds)}</div>
                    <Clock className="h-5 w-5 text-primary" />
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Personal Bests */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Award className="mr-2 h-5 w-5 text-primary" />
                  Personal Bests
                </CardTitle>
                <CardDescription>Your top running achievements</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* Fastest Pace */}
                  <div className="p-4 border rounded-lg">
                    <div className="flex items-center mb-2">
                      <TrendingUp className="h-4 w-4 mr-2 text-primary" />
                      <span className="text-sm font-medium">Fastest Pace</span>
                    </div>
                    <p className="text-2xl font-bold">
                      {statistics.personalBests.fastestPace
                        ? formatPace(statistics.personalBests.fastestPace)
                        : '-'} 
                    </p>
                    <p className="text-xs text-muted-foreground">min/km</p>
                  </div>

                  {/* Longest Run */}
                  <div className="p-4 border rounded-lg">
                    <div className="flex items-center mb-2">
                      <Route className="h-4 w-4 mr-2 text-primary" />
                      <span className="text-sm font-medium">Longest Run</span>
                    </div>
                    <p className="text-2xl font-bold">
                      {statistics.personalBests.longestRun
                        ? `${statistics.personalBests.longestRun.toFixed(1)} km`
                        : '-'}
                    </p>
                  </div>

                  {/* Most Elevation */}
                  <div className="p-4 border rounded-lg">
                    <div className="flex items-center mb-2">
                      <ArrowUp className="h-4 w-4 mr-2 text-primary" />
                      <span className="text-sm font-medium">Most Elevation Gain</span>
                    </div>
                    <p className="text-2xl font-bold">
                      {statistics.personalBests.mostElevationGain
                        ? `${statistics.personalBests.mostElevationGain.toFixed(0)} m`
                        : '-'}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Recent Runs */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Activity className="mr-2 h-5 w-5 text-primary" />
                  Recent Runs
                </CardTitle>
                <CardDescription>Your latest running activities</CardDescription>
              </CardHeader>
              <CardContent>
                {statistics.recentRuns.length === 0 ? (
                  <p className="text-muted-foreground text-center py-4">No recent runs found.</p>
                ) : (
                  <div className="space-y-4">
                    {statistics.recentRuns.map((run) => (
                      <div key={run.id} className="flex items-center justify-between border-b pb-4 last:border-b-0 last:pb-0">
                        <div className="flex items-center">
                          <div className="bg-primary/10 p-2 rounded-full mr-4">
                            <Route className="h-5 w-5 text-primary" />
                          </div>
                          <div>
                            <p className="font-medium">
                              {run.event_id ? 'Event Run' : 'Training Run'}
                            </p>
                            <div className="flex text-sm text-muted-foreground space-x-4">
                              <span className="flex items-center">
                                <Calendar className="h-3 w-3 mr-1" />
                                {new Date(run.event_date).toLocaleDateString()}
                              </span>
                              <span className="flex items-center">
                                <Route className="h-3 w-3 mr-1" />
                                {run.distance.toFixed(1)} km
                              </span>
                              <span className="flex items-center">
                                <Clock className="h-3 w-3 mr-1" />
                                {formatTime(run.time_seconds)}
                              </span>
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-medium">{formatPace(run.pace_per_km)}</p>
                          <p className="text-xs text-muted-foreground">min/km</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
              <CardFooter className="flex justify-between">
                <Button variant="outline" size="sm" onClick={() => setShowAddDialog(true)}>
                  <Plus className="h-4 w-4 mr-1" />
                  Add Run
                </Button>
              </CardFooter>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="performance">
          <div className="space-y-6">
            {/* Performance charts component */}
            <PerformanceCharts runData={statistics.recentRuns} />

            {/* Run distance distribution */}
            {statistics.runCountByDistance && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Route className="mr-2 h-5 w-5 text-primary" />
                    Distance Distribution
                  </CardTitle>
                  <CardDescription>
                    Distribution of runs by distance
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {statistics.runCountByDistance.map((item) => (
                      <div key={item.range} className="space-y-2">
                        <div className="flex justify-between">
                          <div className="text-sm font-medium">{item.range}</div>
                          <div className="text-sm text-muted-foreground">{item.count} runs</div>
                        </div>
                        <Progress
                          value={(item.count / statistics.totalRuns) * 100}
                          className="h-2"
                        />
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>

        <TabsContent value="achievements">
          <div className="space-y-6">
            {/* Achievements & Goals component */}
            <AchievementsAndGoals
              statistics={statistics}
              onAddGoal={async (goal) => {
                // This would connect to the goal service in a real implementation
                console.log('Adding goal:', goal);
                return Promise.resolve();
              }}
            />
          </div>
        </TabsContent>

        <TabsContent value="data">
          <div className="space-y-6">
            {/* Data Import/Export component */}
            <DataImportExport
              userId={userId}
              statistics={statistics.recentRuns}
              onDataImport={handleImportData}
            />

            {/* Run history */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Activity className="mr-2 h-5 w-5 text-primary" />
                  Full Run History
                </CardTitle>
                <CardDescription>
                  Complete history of all your runs
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="rounded-md border">
                  <div className="grid grid-cols-[120px_1fr_120px_120px_100px] font-medium border-b">
                    <div className="p-3 border-r">Date</div>
                    <div className="p-3 border-r">Details</div>
                    <div className="p-3 border-r text-right">Distance</div>
                    <div className="p-3 border-r text-right">Time</div>
                    <div className="p-3 text-right">Pace</div>
                  </div>
                  <div className="max-h-[400px] overflow-y-auto">
                    {statistics.recentRuns.map((run) => (
                      <div key={run.id} className="grid grid-cols-[120px_1fr_120px_120px_100px] border-b last:border-b-0 text-sm">
                        <div className="p-3 border-r">
                          {new Date(run.event_date).toLocaleDateString()}
                        </div>
                        <div className="p-3 border-r truncate">
                          {run.event_id ? 'Event Run' : 'Training Run'}
                          {run.notes && <span className="ml-2 text-muted-foreground">{run.notes}</span>}
                        </div>
                        <div className="p-3 border-r text-right">
                          {run.distance.toFixed(1)} km
                        </div>
                        <div className="p-3 border-r text-right">
                          {formatTime(run.time_seconds)}
                        </div>
                        <div className="p-3 text-right">
                          {formatPace(run.pace_per_km)}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* Add Run Dialog */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Add New Run</DialogTitle>
            <DialogDescription>
              Record details of your run to track your progress
            </DialogDescription>
          </DialogHeader>
          <AddRunForm onSubmit={handleAddRun} onCancel={() => setShowAddDialog(false)} />
        </DialogContent>
      </Dialog>
    </div>
  );
}

function EmptyStatisticsState({ setShowAddDialog }: { setShowAddDialog: (show: boolean) => void }) {
  return (
    <Card>
      <CardContent className="py-10">
        <div className="text-center">
          <Activity className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-xl font-medium mb-2">No Running Data Yet</h3>
          <p className="text-muted-foreground mb-6">
            Start tracking your runs to see statistics and visualizations
          </p>
          <Button onClick={() => setShowAddDialog(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Add Your First Run
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

function StatisticsSkeleton() {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <Card key={i}>
            <CardHeader className="pb-2">
              <Skeleton className="h-4 w-24" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-8 w-16" />
            </CardContent>
          </Card>
        ))}
      </div>
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-32 mb-2" />
          <Skeleton className="h-4 w-48" />
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="p-4 border rounded-lg">
                <Skeleton className="h-4 w-24 mb-2" />
                <Skeleton className="h-8 w-16" />
                <Skeleton className="h-3 w-12 mt-1" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-32 mb-2" />
          <Skeleton className="h-4 w-48" />
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="flex items-center justify-between border-b pb-4">
                <div className="flex items-center">
                  <Skeleton className="h-10 w-10 rounded-full mr-4" />
                  <div>
                    <Skeleton className="h-5 w-24 mb-2" />
                    <div className="flex space-x-4">
                      <Skeleton className="h-3 w-16" />
                      <Skeleton className="h-3 w-16" />
                    </div>
                  </div>
                </div>
                <Skeleton className="h-5 w-16" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function AddRunForm({ onSubmit, onCancel }: { onSubmit: (data: any) => Promise<void>, onCancel: () => void }) {
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [distance, setDistance] = useState('');
  const [hours, setHours] = useState('');
  const [minutes, setMinutes] = useState('');
  const [seconds, setSeconds] = useState('');
  const [elevationGain, setElevationGain] = useState('');
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!date || !distance) {
      setError('Please fill in all required fields');
      return;
    }
    
    const totalSeconds = 
      (parseInt(hours || '0') * 3600) + 
      (parseInt(minutes || '0') * 60) + 
      parseInt(seconds || '0');
    
    if (totalSeconds === 0) {
      setError('Please enter a valid time');
      return;
    }
    
    setError(null);
    setIsSubmitting(true);
    
    try {
      const runData = {
        event_date: date,
        distance: parseFloat(distance),
        time_seconds: totalSeconds,
        elevation_gain: elevationGain ? parseFloat(elevationGain) : 0,
        notes: notes || null,
        achievements: {},
        metadata: {}
      };
      
      await onSubmit(runData);
    } catch (err) {
      console.error('Error submitting run:', err);
      setError('Failed to add run. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <div className="grid gap-4 py-4">
        <div className="grid grid-cols-4 items-center gap-4">
          <label htmlFor="date" className="text-right text-sm">
            Date*
          </label>
          <input
            id="date"
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="col-span-3 flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            required
          />
        </div>
        <div className="grid grid-cols-4 items-center gap-4">
          <label htmlFor="distance" className="text-right text-sm">
            Distance (km)*
          </label>
          <input
            id="distance"
            type="number"
            step="0.01"
            min="0"
            value={distance}
            onChange={(e) => setDistance(e.target.value)}
            className="col-span-3 flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            required
          />
        </div>
        <div className="grid grid-cols-4 items-center gap-4">
          <label className="text-right text-sm">
            Time*
          </label>
          <div className="col-span-3 flex space-x-2">
            <div className="grid grid-cols-3 gap-2 items-center">
              <input
                type="number"
                min="0"
                placeholder="h"
                value={hours}
                onChange={(e) => setHours(e.target.value)}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              />
              <input
                type="number"
                min="0"
                max="59"
                placeholder="m"
                value={minutes}
                onChange={(e) => setMinutes(e.target.value)}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              />
              <input
                type="number"
                min="0"
                max="59"
                placeholder="s"
                value={seconds}
                onChange={(e) => setSeconds(e.target.value)}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              />
            </div>
          </div>
        </div>
        <div className="grid grid-cols-4 items-center gap-4">
          <label htmlFor="elevation" className="text-right text-sm">
            Elevation (m)
          </label>
          <input
            id="elevation"
            type="number"
            min="0"
            value={elevationGain}
            onChange={(e) => setElevationGain(e.target.value)}
            className="col-span-3 flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
          />
        </div>
        <div className="grid grid-cols-4 items-center gap-4">
          <label htmlFor="notes" className="text-right text-sm">
            Notes
          </label>
          <textarea
            id="notes"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="col-span-3 flex h-20 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
          />
        </div>
      </div>
      
      {error && (
        <Alert variant="destructive" className="my-4">
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      
      <DialogFooter>
        <Button type="button" variant="outline" onClick={onCancel} disabled={isSubmitting}>
          Cancel
        </Button>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? 'Adding...' : 'Add Run'}
        </Button>
      </DialogFooter>
    </form>
  );
} 
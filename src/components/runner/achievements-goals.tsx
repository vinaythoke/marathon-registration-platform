"use client";

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  Tabs, TabsContent, TabsList, TabsTrigger
} from '@/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Award, Target, Plus, Medal, Clock, Trophy, Route, TrendingUp } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { StatisticsSummary } from '@/lib/services/statistics-service';

interface AchievementsAndGoalsProps {
  statistics: StatisticsSummary;
  isLoading?: boolean;
  onAddGoal?: (goal: any) => Promise<void>;
}

interface Goal {
  id: string;
  type: 'distance' | 'pace' | 'time' | 'runs';
  target: number;
  timeframe: 'weekly' | 'monthly' | 'yearly' | 'total';
  startDate: string;
  endDate?: string;
  progress: number;
  label: string;
}

interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  unlockedAt?: string;
  isUnlocked: boolean;
  progress?: number;
  progressTarget?: number;
  category: 'distance' | 'pace' | 'runs' | 'events' | 'other';
}

export default function AchievementsAndGoals({ 
  statistics, 
  isLoading = false,
  onAddGoal
}: AchievementsAndGoalsProps) {
  const [newGoalType, setNewGoalType] = useState<'distance' | 'pace' | 'time' | 'runs'>('distance');
  const [newGoalTarget, setNewGoalTarget] = useState('');
  const [newGoalTimeframe, setNewGoalTimeframe] = useState<'weekly' | 'monthly' | 'yearly' | 'total'>('weekly');
  const [showAddGoalDialog, setShowAddGoalDialog] = useState(false);

  // Sample goals data - in a real app, this would come from the database
  const goals: Goal[] = [
    {
      id: '1',
      type: 'distance',
      target: 50,
      timeframe: 'monthly',
      startDate: new Date().toISOString(),
      progress: 23.5,
      label: 'Run 50 km this month'
    },
    {
      id: '2',
      type: 'pace',
      target: 5.5,
      timeframe: 'total',
      startDate: new Date().toISOString(),
      progress: 6.2,
      label: 'Achieve a 5:30 min/km pace'
    },
    {
      id: '3',
      type: 'runs',
      target: 12,
      timeframe: 'monthly',
      startDate: new Date().toISOString(),
      progress: 5,
      label: 'Complete 12 runs this month'
    }
  ];

  // Sample achievements data - in a real app, this would come from the database
  const achievements: Achievement[] = [
    {
      id: '1',
      title: 'First Timer',
      description: 'Completed your first run',
      icon: 'Award',
      isUnlocked: statistics.totalRuns > 0,
      unlockedAt: statistics.totalRuns > 0 ? new Date().toISOString() : undefined,
      category: 'runs'
    },
    {
      id: '2',
      title: 'Marathon Ready',
      description: 'Completed a 20+ km run',
      icon: 'Trophy',
      isUnlocked: false,
      progress: statistics.personalBests.longestRun || 0,
      progressTarget: 20,
      category: 'distance'
    },
    {
      id: '3',
      title: 'Speed Demon',
      description: 'Maintained a pace under 5:00 min/km',
      icon: 'TrendingUp',
      isUnlocked: statistics.personalBests.fastestPace ? statistics.personalBests.fastestPace < 5 : false,
      category: 'pace'
    },
    {
      id: '4',
      title: 'Consistent Runner',
      description: 'Completed 10 runs in a single month',
      icon: 'Clock',
      isUnlocked: false,
      progress: 3,
      progressTarget: 10,
      category: 'runs'
    },
    {
      id: '5',
      title: 'Century Club',
      description: 'Ran a total of 100 km',
      icon: 'Route',
      isUnlocked: statistics.totalDistance >= 100,
      progress: statistics.totalDistance,
      progressTarget: 100,
      category: 'distance'
    },
  ];

  const handleAddGoal = () => {
    if (!newGoalTarget) return;
    
    const goalData = {
      type: newGoalType,
      target: parseFloat(newGoalTarget),
      timeframe: newGoalTimeframe,
      startDate: new Date().toISOString()
    };
    
    if (onAddGoal) {
      onAddGoal(goalData)
        .then(() => {
          setNewGoalTarget('');
          setShowAddGoalDialog(false);
        })
        .catch(error => {
          console.error('Failed to add goal:', error);
        });
    }
  };

  const getIconComponent = (iconName: string) => {
    switch (iconName) {
      case 'Award':
        return <Award className="h-6 w-6" />;
      case 'Trophy':
        return <Trophy className="h-6 w-6" />;
      case 'Clock':
        return <Clock className="h-6 w-6" />;
      case 'Route':
        return <Route className="h-6 w-6" />;
      case 'TrendingUp':
        return <TrendingUp className="h-6 w-6" />;
      default:
        return <Medal className="h-6 w-6" />;
    }
  };

  const getGoalProgressColor = (goal: Goal) => {
    const percentage = (goal.progress / goal.target) * 100;
    if (percentage >= 100) return 'bg-green-500';
    if (percentage >= 75) return 'bg-emerald-500';
    if (percentage >= 50) return 'bg-blue-500';
    if (percentage >= 25) return 'bg-amber-500';
    return 'bg-rose-500';
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Loading...</CardTitle>
        </CardHeader>
        <CardContent className="min-h-[200px] flex items-center justify-center">
          <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full">
      <CardHeader className="pb-2">
        <Tabs defaultValue="goals">
          <div className="flex justify-between items-center">
            <CardTitle>Your Running Journey</CardTitle>
            <TabsList>
              <TabsTrigger value="goals">
                <Target className="h-4 w-4 mr-2" />
                Goals
              </TabsTrigger>
              <TabsTrigger value="achievements">
                <Award className="h-4 w-4 mr-2" />
                Achievements
              </TabsTrigger>
            </TabsList>
          </div>
          <CardDescription>Track your goals and celebrate achievements</CardDescription>
          
          <TabsContent value="goals" className="mt-4 space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-medium">Current Goals</h3>
              <Dialog open={showAddGoalDialog} onOpenChange={setShowAddGoalDialog}>
                <DialogTrigger asChild>
                  <Button size="sm" variant="outline">
                    <Plus className="h-4 w-4 mr-2" />
                    Add Goal
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Set a New Running Goal</DialogTitle>
                    <DialogDescription>
                      Define a new goal to help track your running progress.
                    </DialogDescription>
                  </DialogHeader>
                  
                  <div className="grid gap-4 py-4">
                    <div className="grid grid-cols-4 items-center gap-4">
                      <Label htmlFor="goalType" className="text-right">
                        Goal Type
                      </Label>
                      <select 
                        id="goalType"
                        className="col-span-3 flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                        value={newGoalType}
                        onChange={(e) => setNewGoalType(e.target.value as any)}
                      >
                        <option value="distance">Distance</option>
                        <option value="pace">Pace</option>
                        <option value="time">Total Time</option>
                        <option value="runs">Number of Runs</option>
                      </select>
                    </div>
                    
                    <div className="grid grid-cols-4 items-center gap-4">
                      <Label htmlFor="goalTarget" className="text-right">
                        Target
                      </Label>
                      <Input
                        id="goalTarget"
                        type="number"
                        value={newGoalTarget}
                        onChange={(e) => setNewGoalTarget(e.target.value)}
                        placeholder={newGoalType === 'distance' ? 'Kilometers' : 
                                    newGoalType === 'pace' ? 'Min/km' : 
                                    newGoalType === 'time' ? 'Minutes' : 'Runs'}
                        className="col-span-3"
                      />
                    </div>
                    
                    <div className="grid grid-cols-4 items-center gap-4">
                      <Label htmlFor="goalTimeframe" className="text-right">
                        Timeframe
                      </Label>
                      <select 
                        id="goalTimeframe"
                        className="col-span-3 flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                        value={newGoalTimeframe}
                        onChange={(e) => setNewGoalTimeframe(e.target.value as any)}
                      >
                        <option value="weekly">Weekly</option>
                        <option value="monthly">Monthly</option>
                        <option value="yearly">Yearly</option>
                        <option value="total">Overall (No time limit)</option>
                      </select>
                    </div>
                  </div>
                  
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setShowAddGoalDialog(false)}>
                      Cancel
                    </Button>
                    <Button onClick={handleAddGoal}>
                      Set Goal
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>
            
            {goals.length === 0 ? (
              <div className="text-center py-12 border rounded-md">
                <Target className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium mb-1">No Goals Set</h3>
                <p className="text-muted-foreground mb-4 max-w-md mx-auto">
                  Set goals to keep yourself motivated and track your progress
                </p>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => setShowAddGoalDialog(true)}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Your First Goal
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                {goals.map((goal) => (
                  <div key={goal.id} className="border rounded-md p-4">
                    <div className="flex justify-between items-start mb-2">
                      <div className="flex items-center">
                        {goal.type === 'distance' && <Route className="h-5 w-5 mr-2 text-blue-500" />}
                        {goal.type === 'pace' && <TrendingUp className="h-5 w-5 mr-2 text-green-500" />}
                        {goal.type === 'time' && <Clock className="h-5 w-5 mr-2 text-amber-500" />}
                        {goal.type === 'runs' && <Target className="h-5 w-5 mr-2 text-purple-500" />}
                        <h4 className="font-medium">{goal.label}</h4>
                      </div>
                      <Badge variant={goal.progress >= goal.target ? "default" : "outline"}>
                        {goal.timeframe}
                      </Badge>
                    </div>
                    
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>{goal.progress} / {goal.target} {
                          goal.type === 'distance' ? 'km' :
                          goal.type === 'pace' ? 'min/km' :
                          goal.type === 'time' ? 'min' : 'runs'
                        }</span>
                        <span>{Math.round((goal.progress / goal.target) * 100)}%</span>
                      </div>
                      <Progress 
                        value={(goal.progress / goal.target) * 100} 
                        className="h-2"
                        indicatorClassName={getGoalProgressColor(goal)}
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </TabsContent>
          
          <TabsContent value="achievements" className="mt-4 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {achievements.map((achievement) => (
                <div 
                  key={achievement.id} 
                  className={`border rounded-md p-4 flex ${
                    achievement.isUnlocked 
                      ? 'bg-green-50 dark:bg-green-950/20 border-green-200 dark:border-green-800'
                      : ''
                  }`}
                >
                  <div className={`mr-4 p-2 rounded-full ${
                    achievement.isUnlocked
                      ? 'bg-green-100 text-green-700 dark:bg-green-900/50 dark:text-green-400'
                      : 'bg-muted text-muted-foreground'
                  }`}>
                    {getIconComponent(achievement.icon)}
                  </div>
                  
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <h4 className="font-medium">{achievement.title}</h4>
                      {achievement.isUnlocked && (
                        <Badge variant="success" className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300">
                          Unlocked
                        </Badge>
                      )}
                    </div>
                    
                    <p className="text-sm text-muted-foreground mb-2">
                      {achievement.description}
                    </p>
                    
                    {!achievement.isUnlocked && achievement.progress !== undefined && (
                      <div className="space-y-1">
                        <div className="flex justify-between text-xs">
                          <span>Progress</span>
                          <span>{achievement.progress} / {achievement.progressTarget}</span>
                        </div>
                        <Progress 
                          value={(achievement.progress / (achievement.progressTarget || 1)) * 100} 
                          className="h-1"
                        />
                      </div>
                    )}
                    
                    {achievement.isUnlocked && achievement.unlockedAt && (
                      <p className="text-xs text-muted-foreground mt-1">
                        Achieved on {new Date(achievement.unlockedAt).toLocaleDateString()}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </CardHeader>
    </Card>
  );
} 
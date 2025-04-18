import { createClient } from '@/lib/supabase/client';
import { Database } from '@/database.types';

export type RunStatistics = Database['public']['Tables']['run_statistics']['Row'];
export type RunStatisticsInsert = Database['public']['Tables']['run_statistics']['Insert'];

export interface StatisticsSummary {
  totalRuns: number;
  totalDistance: number;
  totalTimeSeconds: number;
  averagePace: number;
  personalBests: {
    fastestPace: number | null;
    longestRun: number | null;
    mostElevationGain: number | null;
  };
  recentRuns: RunStatistics[];
  // Additional fields for enhanced statistics
  trends?: {
    paceByMonth: { month: string, pace: number }[];
    distanceByMonth: { month: string, distance: number }[];
    runsCompleted: { month: string, count: number }[];
  };
  runCountByDistance?: { range: string, count: number }[];
}

export interface RunGoal {
  id: string;
  userId: string;
  type: 'distance' | 'pace' | 'time' | 'runs';
  target: number;
  timeframe: 'weekly' | 'monthly' | 'yearly' | 'total';
  startDate: string;
  endDate?: string;
  progress: number;
  status: 'active' | 'completed' | 'failed';
  createdAt: string;
  updatedAt: string;
}

/**
 * Get all run statistics for a specific user
 */
export async function getUserRunStatistics(userId: string): Promise<RunStatistics[]> {
  const supabase = createClient();
  
  const { data, error } = await supabase
    .from('run_statistics')
    .select('*')
    .eq('user_id', userId)
    .order('event_date', { ascending: false });
    
  if (error) {
    console.error('Error fetching user run statistics:', error);
    throw new Error('Failed to fetch run statistics');
  }
  
  return data || [];
}

/**
 * Get a summary of user's running statistics including totals and personal bests
 */
export async function getUserStatisticsSummary(userId: string): Promise<StatisticsSummary> {
  const statistics = await getUserRunStatistics(userId);
  
  if (statistics.length === 0) {
    return {
      totalRuns: 0,
      totalDistance: 0,
      totalTimeSeconds: 0,
      averagePace: 0,
      personalBests: {
        fastestPace: null,
        longestRun: null,
        mostElevationGain: null,
      },
      recentRuns: [],
    };
  }
  
  // Calculate summary stats
  const totalRuns = statistics.length;
  const totalDistance = statistics.reduce((sum, stat) => sum + stat.distance, 0);
  const totalTimeSeconds = statistics.reduce((sum, stat) => sum + stat.time_seconds, 0);
  const averagePace = totalDistance > 0 ? totalTimeSeconds / (totalDistance * 60) : 0;
  
  // Find personal bests
  const fastestPace = statistics.length > 0 
    ? Math.min(...statistics.map(stat => stat.pace_per_km))
    : null;
    
  const longestRun = statistics.length > 0
    ? Math.max(...statistics.map(stat => stat.distance))
    : null;
    
  const mostElevationGain = statistics.length > 0
    ? Math.max(...statistics.map(stat => stat.elevation_gain))
    : null;
  
  // Get 5 most recent runs
  const recentRuns = statistics.slice(0, 5);
  
  // Calculate advanced stats for enhanced statistics
  const trends = calculateTrends(statistics);
  const runCountByDistance = calculateRunCountByDistance(statistics);
  
  return {
    totalRuns,
    totalDistance,
    totalTimeSeconds,
    averagePace,
    personalBests: {
      fastestPace,
      longestRun,
      mostElevationGain,
    },
    recentRuns,
    trends,
    runCountByDistance
  };
}

/**
 * Calculate trend data from statistics
 */
function calculateTrends(statistics: RunStatistics[]) {
  if (!statistics.length) return undefined;
  
  // Group data by month
  const byMonth = statistics.reduce((acc, stat) => {
    const date = new Date(stat.event_date);
    const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    
    if (!acc[monthKey]) {
      acc[monthKey] = {
        totalDistance: 0,
        totalTimeSeconds: 0,
        count: 0,
        month: monthKey,
      };
    }
    
    acc[monthKey].totalDistance += stat.distance;
    acc[monthKey].totalTimeSeconds += stat.time_seconds;
    acc[monthKey].count += 1;
    
    return acc;
  }, {} as Record<string, { 
    totalDistance: number,
    totalTimeSeconds: number,
    count: number,
    month: string
  }>);
  
  // Sort by month (oldest to newest)
  const sortedMonths = Object.values(byMonth).sort((a, b) => 
    a.month.localeCompare(b.month)
  );
  
  // Calculate average pace per month
  const paceByMonth = sortedMonths.map(m => ({
    month: m.month,
    pace: m.totalDistance > 0 ? m.totalTimeSeconds / (m.totalDistance * 60) : 0
  }));
  
  // Calculate total distance per month
  const distanceByMonth = sortedMonths.map(m => ({
    month: m.month,
    distance: m.totalDistance
  }));
  
  // Calculate runs completed per month
  const runsCompleted = sortedMonths.map(m => ({
    month: m.month,
    count: m.count
  }));
  
  return {
    paceByMonth,
    distanceByMonth,
    runsCompleted
  };
}

/**
 * Calculate run count by distance range
 */
function calculateRunCountByDistance(statistics: RunStatistics[]) {
  if (!statistics.length) return undefined;
  
  const ranges = [
    { min: 0, max: 5, label: '0-5 km' },
    { min: 5, max: 10, label: '5-10 km' },
    { min: 10, max: 15, label: '10-15 km' },
    { min: 15, max: 21.1, label: '15-21.1 km' },
    { min: 21.1, max: 30, label: '21.1-30 km' },
    { min: 30, max: 42.2, label: '30-42.2 km' },
    { min: 42.2, max: Infinity, label: '42.2+ km' }
  ];
  
  return ranges.map(range => {
    const count = statistics.filter(stat => 
      stat.distance > range.min && stat.distance <= range.max
    ).length;
    
    return { range: range.label, count };
  });
}

/**
 * Add a new run statistic record
 */
export async function addRunStatistic(statistic: RunStatisticsInsert): Promise<RunStatistics> {
  const supabase = createClient();
  
  const { data, error } = await supabase
    .from('run_statistics')
    .insert(statistic)
    .select()
    .single();
    
  if (error) {
    console.error('Error adding run statistic:', error);
    throw new Error('Failed to add run statistic');
  }
  
  return data;
}

/**
 * Update an existing run statistic record
 */
export async function updateRunStatistic(
  id: string,
  updates: Partial<Omit<RunStatisticsInsert, 'id' | 'user_id'>>
): Promise<RunStatistics> {
  const supabase = createClient();
  
  const { data, error } = await supabase
    .from('run_statistics')
    .update(updates)
    .eq('id', id)
    .select()
    .single();
    
  if (error) {
    console.error('Error updating run statistic:', error);
    throw new Error('Failed to update run statistic');
  }
  
  return data;
}

/**
 * Delete a run statistic record
 */
export async function deleteRunStatistic(id: string): Promise<void> {
  const supabase = createClient();
  
  const { error } = await supabase
    .from('run_statistics')
    .delete()
    .eq('id', id);
    
  if (error) {
    console.error('Error deleting run statistic:', error);
    throw new Error('Failed to delete run statistic');
  }
}

/**
 * Import multiple run statistics in a batch
 */
export async function importRunStatistics(statistics: RunStatisticsInsert[]): Promise<void> {
  if (!statistics.length) return;
  
  const supabase = createClient();
  
  // Process in batches of 50 to avoid potential request size limitations
  const batchSize = 50;
  const batches = [];
  
  for (let i = 0; i < statistics.length; i += batchSize) {
    batches.push(statistics.slice(i, i + batchSize));
  }
  
  for (const batch of batches) {
    const { error } = await supabase
      .from('run_statistics')
      .insert(batch);
      
    if (error) {
      console.error('Error importing run statistics batch:', error);
      throw new Error('Failed to import run statistics');
    }
  }
}

/**
 * Get user's running goals
 */
export async function getUserGoals(userId: string): Promise<RunGoal[]> {
  const supabase = createClient();
  
  const { data, error } = await supabase
    .from('run_goals')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });
    
  if (error) {
    console.error('Error fetching user goals:', error);
    throw new Error('Failed to fetch running goals');
  }
  
  return data || [];
}

/**
 * Add a new running goal
 */
export async function addRunGoal(userId: string, goal: Omit<RunGoal, 'id' | 'userId' | 'progress' | 'status' | 'createdAt' | 'updatedAt'>): Promise<RunGoal> {
  const supabase = createClient();
  
  const { data, error } = await supabase
    .from('run_goals')
    .insert({
      user_id: userId,
      type: goal.type,
      target: goal.target,
      timeframe: goal.timeframe,
      start_date: goal.startDate,
      end_date: goal.endDate,
      progress: 0,
      status: 'active'
    })
    .select()
    .single();
    
  if (error) {
    console.error('Error adding run goal:', error);
    throw new Error('Failed to add running goal');
  }
  
  return data;
}

/**
 * Update an existing running goal
 */
export async function updateRunGoal(
  id: string,
  updates: Partial<Omit<RunGoal, 'id' | 'userId' | 'createdAt' | 'updatedAt'>>
): Promise<RunGoal> {
  const supabase = createClient();
  
  const { data, error } = await supabase
    .from('run_goals')
    .update(updates)
    .eq('id', id)
    .select()
    .single();
    
  if (error) {
    console.error('Error updating run goal:', error);
    throw new Error('Failed to update running goal');
  }
  
  return data;
}

/**
 * Delete a running goal
 */
export async function deleteRunGoal(id: string): Promise<void> {
  const supabase = createClient();
  
  const { error } = await supabase
    .from('run_goals')
    .delete()
    .eq('id', id);
    
  if (error) {
    console.error('Error deleting run goal:', error);
    throw new Error('Failed to delete running goal');
  }
}

/**
 * Format seconds into human-readable time (HH:MM:SS)
 */
export function formatTime(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const remainingSeconds = Math.floor(seconds % 60);
  
  return [
    hours > 0 ? hours.toString().padStart(2, '0') : null,
    minutes.toString().padStart(2, '0'),
    remainingSeconds.toString().padStart(2, '0')
  ]
    .filter(Boolean)
    .join(':');
}

/**
 * Format pace (minutes per km) to MM:SS
 */
export function formatPace(pacePerKm: number): string {
  const minutes = Math.floor(pacePerKm);
  const seconds = Math.round((pacePerKm - minutes) * 60);
  
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
} 
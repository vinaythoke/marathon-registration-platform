"use client";

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { TrendingUp, Route, Calendar, Activity } from 'lucide-react';
import { RunStatistics } from '@/lib/services/statistics-service';

// We'll mock the recharts library for the charts - this would be imported in a real implementation
// import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

interface PerformanceChartsProps {
  runData: RunStatistics[];
  isLoading?: boolean;
}

export default function PerformanceCharts({ runData, isLoading = false }: PerformanceChartsProps) {
  const [timeRange, setTimeRange] = useState<'1m' | '3m' | '6m' | '1y' | 'all'>('3m');
  
  // Filter data based on selected time range
  const getFilteredData = () => {
    if (timeRange === 'all' || !runData.length) return runData;
    
    const now = new Date();
    let pastDate = new Date();
    
    switch(timeRange) {
      case '1m':
        pastDate.setMonth(now.getMonth() - 1);
        break;
      case '3m':
        pastDate.setMonth(now.getMonth() - 3);
        break;
      case '6m':
        pastDate.setMonth(now.getMonth() - 6);
        break;
      case '1y':
        pastDate.setFullYear(now.getFullYear() - 1);
        break;
    }
    
    return runData.filter(run => new Date(run.event_date) >= pastDate);
  };
  
  const filteredData = getFilteredData();
  
  // Prepare data for visualization
  const paceData = filteredData.map(run => ({
    date: new Date(run.event_date).toLocaleDateString(),
    pace: run.pace_per_km,
    distance: run.distance
  })).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  
  const distanceData = filteredData.map(run => ({
    date: new Date(run.event_date).toLocaleDateString(),
    distance: run.distance,
  })).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  
  // Calculate trends
  const calculateTrend = (data: {date: string, pace?: number, distance?: number}[], key: 'pace' | 'distance') => {
    if (data.length < 2) return 'stable';
    
    // Use first and last points to determine overall trend
    const firstValue = data[0][key];
    const lastValue = data[data.length - 1][key];
    
    if (!firstValue || !lastValue) return 'stable';
    
    // For pace, lower is better
    if (key === 'pace') {
      if (lastValue < firstValue * 0.98) return 'improving'; // 2% improvement
      if (lastValue > firstValue * 1.02) return 'declining';
      return 'stable';
    }
    
    // For distance, higher is better
    if (lastValue > firstValue * 1.05) return 'improving'; // 5% improvement
    if (lastValue < firstValue * 0.95) return 'declining';
    return 'stable';
  };
  
  const paceTrend = calculateTrend(paceData, 'pace');
  const distanceTrend = calculateTrend(distanceData, 'distance');
  
  // Get trend color
  const getTrendColor = (trend: string, metric: 'pace' | 'distance') => {
    if (trend === 'improving') return 'text-green-500';
    if (trend === 'declining') return metric === 'pace' ? 'text-red-500' : 'text-orange-500';
    return 'text-blue-500';
  };
  
  // Get trend text
  const getTrendText = (trend: string, metric: 'pace' | 'distance') => {
    if (trend === 'improving') return metric === 'pace' ? 'Pace Improving' : 'Distance Increasing';
    if (trend === 'declining') return metric === 'pace' ? 'Pace Slowing' : 'Distance Decreasing';
    return 'Maintaining Consistent ' + (metric === 'pace' ? 'Pace' : 'Distance');
  };

  if (isLoading) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="flex items-center">
            <TrendingUp className="mr-2 h-5 w-5 text-primary" />
            Performance Trends
          </CardTitle>
          <CardDescription>Loading your performance data...</CardDescription>
        </CardHeader>
        <CardContent className="min-h-[300px] flex items-center justify-center">
          <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
        </CardContent>
      </Card>
    );
  }
  
  if (!runData.length) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="flex items-center">
            <TrendingUp className="mr-2 h-5 w-5 text-primary" />
            Performance Trends
          </CardTitle>
          <CardDescription>Track your progress over time</CardDescription>
        </CardHeader>
        <CardContent className="min-h-[300px] flex flex-col items-center justify-center text-center">
          <Activity className="h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-medium mb-1">No Run Data Available</h3>
          <p className="text-muted-foreground mb-4 max-w-md">
            Add your run data to start tracking your performance trends and improvements
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <div>
          <CardTitle className="flex items-center">
            <TrendingUp className="mr-2 h-5 w-5 text-primary" />
            Performance Trends
          </CardTitle>
          <CardDescription>Track your progress over time</CardDescription>
        </div>
        <div>
          <Select 
            defaultValue={timeRange} 
            onValueChange={(value) => setTimeRange(value as any)}
          >
            <SelectTrigger className="w-[120px]">
              <SelectValue placeholder="Time range" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="1m">Last Month</SelectItem>
              <SelectItem value="3m">Last 3 Months</SelectItem>
              <SelectItem value="6m">Last 6 Months</SelectItem>
              <SelectItem value="1y">Last Year</SelectItem>
              <SelectItem value="all">All Time</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="pace">
          <TabsList className="mb-4">
            <TabsTrigger value="pace">Pace</TabsTrigger>
            <TabsTrigger value="distance">Distance</TabsTrigger>
            <TabsTrigger value="timeline">Run Timeline</TabsTrigger>
          </TabsList>
          
          <TabsContent value="pace" className="space-y-4">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-lg font-medium">Your Pace Trend</h3>
                <p className={`text-sm ${getTrendColor(paceTrend, 'pace')}`}>
                  {getTrendText(paceTrend, 'pace')}
                </p>
              </div>
            </div>
            
            {/* For actual implementation, use recharts library for better visualization */}
            <div className="h-[300px] w-full border rounded-md p-4 flex items-center justify-center">
              <div className="text-center text-muted-foreground">
                <p className="mb-2">Pace Chart Visualization</p>
                <p className="text-xs">This would be replaced with an actual chart in production</p>
                <div className="mt-4 border-t pt-4">
                  <p className="font-medium">Data Summary:</p>
                  <p className="text-sm">
                    {paceData.length} runs between {paceData[0]?.date} and {paceData[paceData.length-1]?.date}
                  </p>
                </div>
              </div>
            </div>
          </TabsContent>
          
          <TabsContent value="distance" className="space-y-4">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-lg font-medium">Your Distance Progression</h3>
                <p className={`text-sm ${getTrendColor(distanceTrend, 'distance')}`}>
                  {getTrendText(distanceTrend, 'distance')}
                </p>
              </div>
            </div>
            
            {/* For actual implementation, use recharts library for better visualization */}
            <div className="h-[300px] w-full border rounded-md p-4 flex items-center justify-center">
              <div className="text-center text-muted-foreground">
                <p className="mb-2">Distance Chart Visualization</p>
                <p className="text-xs">This would be replaced with an actual chart in production</p>
                <div className="mt-4 border-t pt-4">
                  <p className="font-medium">Data Summary:</p>
                  <p className="text-sm">
                    Total: {distanceData.reduce((sum, item) => sum + (item.distance || 0), 0).toFixed(1)} km over {distanceData.length} runs
                  </p>
                </div>
              </div>
            </div>
          </TabsContent>
          
          <TabsContent value="timeline" className="space-y-4">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-lg font-medium">Your Running Timeline</h3>
                <p className="text-sm text-muted-foreground">
                  Visual history of all your runs
                </p>
              </div>
            </div>
            
            {/* For actual implementation, use recharts for better visualization */}
            <div className="h-[300px] w-full border rounded-md p-4 flex items-center justify-center">
              <div className="text-center text-muted-foreground">
                <p className="mb-2">Run Timeline Visualization</p>
                <p className="text-xs">This would be replaced with an actual timeline chart in production</p>
                <div className="mt-4 border-t pt-4">
                  <p className="font-medium">Timeline Summary:</p>
                  <p className="text-sm">
                    {filteredData.length} runs from {filteredData.length ? new Date(filteredData[filteredData.length-1].event_date).toLocaleDateString() : 'N/A'} 
                    to {filteredData.length ? new Date(filteredData[0].event_date).toLocaleDateString() : 'N/A'}
                  </p>
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
} 
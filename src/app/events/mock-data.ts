// Mock events data for development and testing purposes
export const mockEvents = [
  {
    id: 'mock-1',
    title: 'City Marathon 2023',
    description: 'The biggest marathon event in the city with multiple categories. Join thousands of runners from around the world in this iconic race through the heart of the city. Features full marathon, half marathon, and 10K options for all levels of runners.',
    event_date: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString(),
    location: 'Central Park, New York',
    status: 'published',
    banner_url: 'https://images.unsplash.com/photo-1564352969906-8b7f46a8f3cc?w=800&auto=format&fit=crop',
    organizer_id: 'mock-organizer-1'
  },
  {
    id: 'mock-2',
    title: 'Half Marathon Challenge',
    description: 'A challenging half marathon route through scenic trails and beautiful landscapes. This event is perfect for intermediate runners looking to challenge themselves on varied terrain. Includes aid stations every 3km and post-race refreshments.',
    event_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
    location: 'Mountain View Park',
    status: 'published',
    banner_url: 'https://images.unsplash.com/photo-1594882645126-14020914d58d?w=800&auto=format&fit=crop',
    organizer_id: 'mock-organizer-2'
  },
  {
    id: 'mock-3',
    title: '5K Fun Run',
    description: 'Family-friendly 5K run for all ages and experience levels. This inclusive event welcomes runners, joggers, and walkers. Bring the whole family for a day of fitness and fun. Kids under 10 can participate for free!',
    event_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    location: 'Downtown River Trail',
    status: 'published',
    banner_url: 'https://images.unsplash.com/photo-1598091383021-15ddea10925d?w=800&auto=format&fit=crop',
    organizer_id: 'mock-organizer-1'
  },
  {
    id: 'mock-4',
    title: 'Trail Running Series',
    description: 'A series of trail runs through beautiful natural parks. Each event in the series gets progressively more challenging. Complete all four events to earn a special finisher medal. Great way to improve your trail running skills over time.',
    event_date: new Date(Date.now() + 21 * 24 * 60 * 60 * 1000).toISOString(),
    location: 'National Forest Park',
    status: 'published',
    banner_url: 'https://images.unsplash.com/photo-1590043815348-c5cabecf4b1d?w=800&auto=format&fit=crop',
    organizer_id: 'mock-organizer-3'
  },
  {
    id: 'mock-5',
    title: 'Charity Marathon',
    description: 'Run for a cause! All proceeds from this marathon go to supporting local children\'s hospitals. Your participation helps make a difference in the lives of children in need. Choose from 5K, 10K, or half marathon distances.',
    event_date: new Date(Date.now() + 45 * 24 * 60 * 60 * 1000).toISOString(),
    location: 'Riverside Park',
    status: 'published',
    banner_url: 'https://images.unsplash.com/photo-1534311586647-b5f25c511ce9?w=800&auto=format&fit=crop',
    organizer_id: 'mock-organizer-2'
  }
]; 
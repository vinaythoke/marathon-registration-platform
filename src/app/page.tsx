import React from 'react';
import Link from 'next/link';

export default function HomePage() {
  return (
    <div className="container mx-auto py-24 px-6">
      <div className="text-center mb-16">
        <h1 className="text-4xl font-bold mb-6">Marathon Registration Platform</h1>
        <p className="text-xl text-gray-600 max-w-3xl mx-auto">
          A comprehensive platform for marathon registrations, ticket management, and runner tracking.
        </p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
        <div className="bg-white p-8 rounded-lg shadow-md">
          <h2 className="text-xl font-semibold mb-4">For Organizers</h2>
          <p className="text-gray-600 mb-6">Create and manage events, handle ticketing, and track participants.</p>
          <Link 
            href="/auth/login?role=organizer" 
            className="block text-center py-2 px-4 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Organizer Dashboard
          </Link>
        </div>
        
        <div className="bg-white p-8 rounded-lg shadow-md">
          <h2 className="text-xl font-semibold mb-4">For Runners</h2>
          <p className="text-gray-600 mb-6">Register for events, manage your tickets, and track your participation.</p>
          <Link 
            href="/auth/login?role=runner" 
            className="block text-center py-2 px-4 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Runner Login
          </Link>
        </div>
        
        <div className="bg-white p-8 rounded-lg shadow-md">
          <h2 className="text-xl font-semibold mb-4">For Volunteers</h2>
          <p className="text-gray-600 mb-6">Check in runners, distribute race kits, and coordinate activities.</p>
          <Link 
            href="/auth/login?role=volunteer" 
            className="block text-center py-2 px-4 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Volunteer Login
          </Link>
        </div>
      </div>
      
      <div className="mt-16 text-center">
        <Link
          href="/events"
          className="inline-block py-3 px-6 bg-gray-800 text-white rounded-lg hover:bg-gray-900"
        >
          Browse Events
        </Link>
      </div>
    </div>
  );
} 
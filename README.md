# Marathon Registration Platform

A comprehensive event management system for marathon registrations built with Next.js and Supabase.

## Features

- **User Authentication**: Secure login, registration, and profile management
- **Event Management**: Create, update, and manage marathon events
- **Ticket Management**: Create different ticket types with pricing tiers
- **Registration System**: Smooth registration process for runners
- **Runner Profiles**: Detailed profiles with running statistics and medical information
- **Admin Dashboard**: Comprehensive tools for event organizers
- **PWA Support**: Offline access and native-like experience
- **Responsive Design**: Works on desktop, tablet, and mobile devices

## Tech Stack

- **Frontend**: 
  - Next.js (App Router)
  - React
  - TypeScript
  - Tailwind CSS
  - Shadcn UI Components

- **Backend**: 
  - Supabase (PostgreSQL, Auth, Storage)
  - Row Level Security for data protection
  - Real-time subscriptions

- **Other Tools**:
  - Next-PWA for Progressive Web App capabilities
  - QR code generation for registration tickets
  - Payment integration with Cashfree

## Getting Started

### Prerequisites

- Node.js (v18.17 or higher)
- npm or yarn
- Supabase account (for database and authentication)

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/yourusername/marathon-registration.git
   cd marathon-registration
   ```

2. Install dependencies:
   ```bash
   npm install
   # or
   yarn install
   ```

3. Set up environment variables:
   ```bash
   cp .env.local.example .env.local
   ```
   Fill in your Supabase credentials in the `.env.local` file

4. Set up the database:
   - Run the database initialization script in Supabase:
     ```sql
     -- Use init_db_schema_safe.sql in Supabase SQL Editor
     ```
   - Register test users (if needed):
     ```bash
     node register_test_users_safe.js
     ```
   - Seed test data (if needed):
     ```sql
     -- Use seed_data_safe.sql in Supabase SQL Editor
     ```

5. Start the development server:
   ```bash
   npm run dev
   # or
   yarn dev
   ```

6. Open [http://localhost:3000](http://localhost:3000) in your browser to see the application

## Database Schema

The application uses a PostgreSQL database with the following main tables:

- `users`: User accounts with authentication links
- `events`: Marathon events with details
- `tickets`: Ticket types for events
- `registrations`: User registrations for events
- `runner_profiles`: Extended user profiles for runners
- `verifications`: User verification records
- `run_statistics`: Running statistics and achievements

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## Acknowledgements

- [Next.js](https://nextjs.org/)
- [Supabase](https://supabase.io/)
- [Tailwind CSS](https://tailwindcss.com/)
- [Shadcn UI](https://ui.shadcn.com/)

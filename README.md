# First Step School - Fee Management System

A comprehensive web application for managing student fee payments and generating shareable receipts for WhatsApp distribution.

## Features

- **Student Management**: Select students by class and view their details
- **Fee Payment Recording**: Record fee payments with multiple payment methods
- **Receipt Generation**: Generate unique, shareable receipts for each payment
- **WhatsApp Integration**: Share receipts directly via WhatsApp
- **Mobile-Friendly**: Responsive design optimized for mobile devices
- **Print Support**: Print receipts directly from the browser

## Tech Stack

- **Frontend**: Next.js 15, React, TypeScript, Tailwind CSS
- **Backend**: Next.js API Routes
- **Database**: Supabase (PostgreSQL)
- **Form Handling**: React Hook Form with Zod validation
- **Icons**: Lucide React
- **Date Handling**: date-fns

## Setup Instructions

### 1. Prerequisites

- Node.js 18+ installed
- A Supabase account and project

### 2. Clone and Install

```bash
git clone <your-repo-url>
cd first-step-school-fee-management
npm install
```

### 3. Supabase Setup

1. Create a new Supabase project at [supabase.com](https://supabase.com)
2. Go to Project Settings > API to get your credentials
3. Run the database schema from `database/schema.sql` in your Supabase SQL editor

### 4. Environment Configuration

Copy `.env.local` and update with your Supabase credentials:

```bash
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

# Application Configuration
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_SCHOOL_NAME="First Step School"
NEXT_PUBLIC_SCHOOL_ADDRESS="Your School Address Here"
NEXT_PUBLIC_SCHOOL_WEBSITE="www.firststepschool.com"
```

### 5. Database Setup

Run the SQL schema in your Supabase project:

1. Go to your Supabase dashboard
2. Navigate to SQL Editor
3. Copy and paste the contents of `database/schema.sql`
4. Execute the query

### 6. Seed Sample Data (Optional)

To add sample student data for testing:

```bash
node scripts/seed-data.js
```

### 7. Run the Application

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to view the application.

## Usage

### Recording Fee Payments

1. Select a class from the dropdown
2. Choose a student from the filtered list
3. Enter payment details (amount, date, method, etc.)
4. Add any additional notes
5. Submit to generate a receipt

### Sharing Receipts

1. After recording a payment, a unique receipt URL is generated
2. Use the "Share on WhatsApp" button to send the receipt link
3. Recipients can view and print the receipt without login

### Receipt Features

- Unique receipt ID for tracking
- Complete student and payment information
- Professional formatting for printing
- Mobile-responsive design
- Shareable URLs that work on any device

## Database Schema

### Students Table
- Student information (name, class, parent details, contact numbers)
- Support for student and parent photos

### Fee Payments Table
- Payment records linked to students
- Payment method, amount, date, status tracking
- Balance remaining and notes
- Unique receipt URLs for sharing
- **NEW: Month/year tracking for better organization**
- **NEW: Update tracking with has_updates flag**

### Fee History Update Table
- **NEW: Complete audit trail for all fee record changes**
- Tracks field-level changes with before/after values
- Records update timestamps and user information
- Stores update reasons for accountability

## Enhanced Features

### Pending Fees Logic
- **Improved Logic**: Now checks for outstanding balances AND missing monthly payments
- **Smart Detection**: Identifies students with:
  - Outstanding balance from previous payments
  - No payment record for current/selected month
  - Partial payments with remaining balance
- **Month/Year Filtering**: View pending fees for specific time periods
- **Detailed Reasons**: Shows why each student has pending fees

### Fee Record Updates
- **In-line Editing**: Edit fee records directly in the table view
- **Mandatory Update Reasons**: All changes require explanation
- **Complete History**: View all changes made to any fee record
- **Visual Indicators**: Updated records are clearly marked

## API Endpoints

- `GET /api/classes` - Get all available classes
- `GET /api/students?class=<className>` - Get students by class
- `POST /api/payments` - Create a new fee payment record
- **NEW: `PUT /api/payments`** - Update existing fee payment record
- **NEW: `GET /api/pending-fees?month=X&year=Y`** - Get pending fees for specific month/year
- **NEW: `GET /api/fee-history?fee_payment_id=X`** - Get update history for a payment record
- `GET /receipt/[id]` - View receipt by unique ID

## Deployment

### Vercel (Recommended)

1. Push your code to GitHub
2. Connect your repository to Vercel
3. Add environment variables in Vercel dashboard
4. Deploy

### Other Platforms

The application can be deployed on any platform that supports Next.js:
- Netlify
- Railway
- DigitalOcean App Platform
- AWS Amplify

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## Support

For issues or questions:
1. Check the existing issues on GitHub
2. Create a new issue with detailed information
3. Contact the development team

## License

This project is licensed under the MIT License.

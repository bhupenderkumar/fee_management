# Birthday Management System

## Overview
A comprehensive birthday management system for First Step School that tracks student birthdays, generates beautiful birthday pamphlets, and enables WhatsApp sharing with parents.

## Features

### 🎂 **Birthday Tracking**
- **Today's Birthdays**: Highlights students celebrating today
- **This Week**: Shows upcoming birthdays in the current week
- **This Month**: Displays all birthdays in the current month
- **All Birthdays**: Complete list sorted by upcoming birthdays

### 🎨 **Birthday Pamphlets**
- **Professional Design**: Beautiful gradient backgrounds with birthday decorations
- **Student Photos**: Displays child, father, and mother photos
- **School Branding**: First Step School logo and information
- **Personalized Content**: Age, birthday date, and family details
- **Print Ready**: Optimized for printing and sharing

### 📱 **WhatsApp Integration**
- **Separate Parent Buttons**: Individual buttons for father and mother
- **WhatsApp Business Support**: Tries app first, falls back to web
- **Professional Messages**: Formatted birthday greetings with emojis
- **Message Tracking**: Logs sent messages for analytics

## Components

### 1. **BirthdayManagement.tsx**
Main component that handles:
- Birthday data fetching and filtering
- Student grid display with photos
- Filter controls (Today/Week/Month/All)
- Search functionality
- WhatsApp sharing integration
- Pamphlet generation

### 2. **BirthdayPamphletModal**
Modal component for pamphlet generation:
- Beautiful birthday card design
- Student and parent photos
- School branding and decorations
- Print and download functionality

## API Endpoints

### **GET /api/birthdays**
Fetches birthday data with filtering options.

**Query Parameters:**
- `filter`: 'today' | 'week' | 'month' | 'all' | 'upcoming'

**Response:**
```json
[
  {
    "id": "uuid",
    "student_name": "John Doe",
    "father_name": "Mr. Doe",
    "mother_name": "Mrs. Doe",
    "father_mobile": "+91 98765 43210",
    "mother_mobile": "+91 98765 43211",
    "student_photo_url": "https://...",
    "father_photo_url": "https://...",
    "mother_photo_url": "https://...",
    "date_of_birth": "2015-03-15",
    "age": 9,
    "daysUntilBirthday": 0,
    "isToday": true,
    "isThisWeek": true,
    "isThisMonth": true
  }
]
```

### **POST /api/birthdays**
Logs birthday message sending.

**Request Body:**
```json
{
  "student_id": "uuid",
  "birthday_message": "Happy Birthday message...",
  "sent_to": "father" | "mother" | "both"
}
```

## Database Schema

### **school.birthday_messages**
Tracks birthday greetings sent to parents.

```sql
CREATE TABLE school.birthday_messages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  student_id UUID NOT NULL REFERENCES school.IDCard(id),
  message_content TEXT NOT NULL,
  sent_to VARCHAR(20) NOT NULL CHECK (sent_to IN ('father', 'mother', 'both')),
  phone_number VARCHAR(20),
  sent_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

## WhatsApp Message Template

### **Birthday Greeting**
```
🎉🎂 HAPPY BIRTHDAY JOHN DOE! 🎂🎉

Dear Mr. Doe,

Today is a very special day! 🌟

John Doe is celebrating their 9th birthday today (March 15)! 🎈

On behalf of everyone at First Step School, we want to wish John Doe a wonderful birthday filled with joy, laughter, and lots of cake! 🍰

May this new year of life bring:
🌟 Amazing adventures
📚 Exciting learning experiences  
🤗 Wonderful friendships
💫 Dreams coming true

We feel so blessed to have John Doe as part of our school family. Watching them grow and learn has been such a joy! 

Have a fantastic celebration! 🎊

With warm birthday wishes,
First Step School Family 💝

#HappyBirthday #FirstStepSchool #SpecialDay
```

## UI Features

### **Dashboard Stats**
- Today's birthdays count
- This week's birthdays count
- This month's birthdays count
- Total students with birthday data

### **Filter Buttons**
- Today (with count)
- This Week (with count)
- This Month (with count)
- All Birthdays (with count)

### **Student Cards**
- Student photo with birthday badge
- Age display
- Parent contact information
- Generate Pamphlet button
- Separate WhatsApp buttons for father/mother

### **Birthday Pamphlet**
- Gradient background design
- School header with decorations
- Student photo in circular frame
- Birthday details and age
- Parent photos (if available)
- Personalized birthday message
- Decorative emojis and elements
- Print-ready layout

## Technical Implementation

### **Birthday Calculation**
```typescript
const age = differenceInYears(currentDate, birthDate)
const thisYearBirthday = new Date(currentYear, birthDate.getMonth(), birthDate.getDate())
const daysUntilBirthday = differenceInDays(nextBirthday, currentDate)
```

### **Photo Display**
- Fallback to placeholder if no photo available
- Circular frames for all photos
- Responsive sizing for different screen sizes
- Border styling for visual appeal

### **WhatsApp Integration**
- Phone number validation before sharing
- Formatted phone number display
- Professional message templates
- App detection and fallback handling

## Usage Instructions

### **For School Staff**

1. **Navigate to Birthdays Tab**
   - Click on the "Birthdays" tab in the main dashboard

2. **View Today's Birthdays**
   - Default view shows today's birthdays
   - Red "TODAY!" badge highlights current birthdays

3. **Filter Birthdays**
   - Use filter buttons to view different time periods
   - Search for specific students using the search bar

4. **Generate Pamphlets**
   - Click "Generate Pamphlet" on any student card
   - Print or download the birthday pamphlet
   - Share digitally or print for physical distribution

5. **Send WhatsApp Greetings**
   - Click "Father" or "Mother" WhatsApp buttons
   - Professional birthday message opens in WhatsApp
   - Send to appropriate parent

### **For Parents**
- Receive beautiful birthday greetings via WhatsApp
- View and download birthday pamphlets
- Share celebration photos with school

## Benefits

### 👨‍👩‍👧‍👦 **For Families**
- Personalized birthday recognition
- Professional birthday pamphlets
- Strengthened school-family connection
- Memorable keepsakes

### 🏫 **For School**
- Enhanced parent engagement
- Professional communication
- Streamlined birthday management
- Brand building and community feel

### 📊 **For Administration**
- Birthday tracking and analytics
- Message delivery tracking
- Parent communication logs
- Student engagement metrics

## Future Enhancements
- 📧 Email birthday greetings
- 🎵 Birthday song integration
- 📅 Birthday calendar export
- 🎁 Gift suggestion system
- 📈 Birthday analytics dashboard
- 🎪 Birthday party planning tools

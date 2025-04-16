# Journal AI Mobile - Your AI-powered Journaling Companion

<div align="center">
  <p><em>Reflect, grow, and thrive with AI-assisted journaling - now on your mobile device</em></p>
  
  [![React Native](https://img.shields.io/badge/React_Native-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)](https://reactnative.dev/)
  [![Expo](https://img.shields.io/badge/Expo-000020?style=for-the-badge&logo=expo&logoColor=white)](https://expo.dev/)
  [![Supabase](https://img.shields.io/badge/Supabase-3ECF8E?style=for-the-badge&logo=supabase&logoColor=white)](https://supabase.com/)
  [![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
</div>

## 📝 Introduction

Journal AI Mobile is a modern, AI-powered journaling application that helps users reflect on their thoughts and feelings while providing intelligent insights and reminders. The application uses natural language processing to analyze journal entries, offer personalized suggestions, and set meaningful reminders to help users develop healthy habits and improve their well-being.

With Journal AI Mobile, users can:
- Write and store journal entries in a secure, private environment
- Receive AI-powered analysis and insights based on their entries
- Set and manage reminders for self-care, mindfulness, and personal growth
- Track their journaling history and emotional patterns over time

## 🏗️ Project Structure

The application is organized into the following key directories:

### Core Directories
| Directory | Description |
|-----------|-------------|
| `app/` | Expo Router with screen components |
| `components/` | Reusable UI components |
| `lib/` | Utility functions and helpers |
| `context/` | React Context providers |
| `hooks/` | Custom React hooks |
| `assets/` | Static assets (images, fonts, etc.) |
| `types/` | TypeScript type definitions |
| `supabase/` | Supabase functions and migrations |

### App Directory (Expo Router)
| File | Purpose |
|------|---------|
| `index.tsx` | Home/Dashboard screen |
| `history.tsx` | Journal history screen |
| `journal-entry/` | Journal entry screens |
| `reminder.tsx` | Reminders management screen |
| `settings.tsx` | User settings screen |
| `_layout.tsx` | App layout and navigation structure |

### Components
| Component | Purpose |
|-----------|---------|
| `ChatBubble.tsx` | Chat UI components |
| `AIResponseBubble.tsx` | AI response display |
| `JournalEntryItem.tsx` | Journal entry list item |
| `NotificationInfoCard.tsx` | Notification display |
| `TimePickerModal.tsx` | Time picker for reminders |

### Library
| File | Purpose |
|------|---------|
| `supabase.ts` | Supabase client |
| `openai.ts` | OpenAI integration |
| `notifications.ts` | Push notification handling |
| `notificationHelpers.ts` | Helper functions for notifications |
| `utils.ts` | Utility functions |

## 🛠️ Setup Instructions

### Prerequisites

- Node.js 18.x or later
- npm, yarn, or pnpm
- Expo CLI (`npm install -g expo-cli`)
- Supabase account (for database and authentication)
- OpenAI API key
- Supabase CLI (`npm install -g supabase`)

### Step 1: Supabase Setup

1. Create a new Supabase project

2. Set up the following tables in your Supabase database:

#### journal_entries
```sql
create table journal_entries (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references auth.users not null,
  content text not null,
  processed boolean default false,
  created_at timestamp with time zone default now(),
  processed_at timestamptz,
  ai_cost numeric
);

-- Enable RLS
alter table journal_entries enable row level security;

-- Create policies
create policy "Users can create their own journal entries"
  on journal_entries for insert
  with check (auth.uid() = user_id);

create policy "Users can view their own journal entries"
  on journal_entries for select
  using (auth.uid() = user_id);

create policy "Users can update their own journal entries"
  on journal_entries for update
  using (auth.uid() = user_id);
```

#### suggestions
```sql
create table suggestions (
  id uuid default uuid_generate_v4() primary key,
  entry_id uuid references journal_entries not null,
  type text not null,
  response_text text not null,
  created_at timestamp with time zone default now()
);

-- Add index and cascading delete
create index on suggestions(entry_id);
alter table suggestions
  add constraint fk_journal_entries
  foreign key (entry_id) references journal_entries(id)
  on delete cascade;

-- Enable RLS
alter table suggestions enable row level security;

-- Create policies
create policy "Users can view suggestions for their entries"
  on suggestions for select
  using (auth.uid() = (select user_id from journal_entries where id = entry_id));

create policy "Users can create suggestions for their entries"
  on suggestions for insert
  with check (auth.uid() = (select user_id from journal_entries where id = entry_id));

create policy "Users can update suggestions for their entries"
  on suggestions for update
  using (auth.uid() = (select user_id from journal_entries where id = entry_id));
```

#### reminders
```sql
create table reminders (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references auth.users not null,
  title text not null,
  body text not null,
  time timestamp with time zone not null,
  status text default 'active',
  type text not null,
  notification_id text,
  created_at timestamp with time zone default now()
);

-- Enable RLS
alter table reminders enable row level security;

-- Create policies
create policy "Users can create their own reminders"
  on reminders for insert
  with check (auth.uid() = user_id);

create policy "Users can view their own reminders"
  on reminders for select
  using (auth.uid() = user_id);

create policy "Users can update their own reminders"
  on reminders for update
  using (auth.uid() = user_id);
```

#### profiles
```sql
create table profiles (
  id uuid references auth.users primary key,
  email text not null,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

-- Enable RLS
alter table profiles enable row level security;

-- Create policies
create policy "Users can view their own profile"
  on profiles for select
  using (auth.uid() = id);

create policy "Users can update their own profile"
  on profiles for update
  using (auth.uid() = id);
```

### Step 2: Environment and Secrets Management

1. Set up OpenAI API key using Supabase CLI:

```bash
# Login to Supabase
supabase login

# Set your OpenAI API key securely (never store in Git)
supabase secrets set OPENAI_API_KEY="your_openai_key_here"
```

2. Create a local environment file:

```bash
# Create a .env.local file in the project root
cp .env.example .env.local
```

3. Add these variables to your `.env.local` file:

```
EXPO_PUBLIC_SUPABASE_URL=your_supabase_url
EXPO_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
EXPO_PUBLIC_FUNCTIONS_URL=https://<project-ref>.functions.supabase.co
EXPO_PUBLIC_OPENAI_API_KEY=your_openai_api_key
```

### Step 3: Edge Function Deployment

1. Prepare your edge function:

```
supabase/
├── functions/
│   └── analyze-journal/
│       └── index.ts       # Main function
```

2. Deploy the edge function:

```bash
# For local development with live environment
supabase functions serve --env-file .env.local

# For production deployment
supabase functions deploy analyze-journal
```

3. Verify the function is deployed by checking the Functions tab in your Supabase dashboard.

### Step 4: Install Dependencies

```bash
# Using npm
npm install

# Using yarn
yarn install

# Using pnpm
pnpm install
```

## 🚀 How to Run

### Development Mode

Start the Expo development server:

```bash
# Using npm
npm start

# Using yarn
yarn start

# Using pnpm
pnpm start
```

Then:
- Use the Expo Go app on your physical device to scan the QR code
- Press 'a' to open in an Android emulator
- Press 'i' to open in an iOS simulator

## ✨ Features

### 📓 Journaling
- **Clean, Mobile-Optimized Editor**: Write journal entries with a distraction-free interface
- **Auto-save**: Entries are automatically saved as you type
- **History View**: Browse and search through past journal entries
- **Offline Support**: Write entries even without an internet connection

### 🤖 AI Analysis
- **Sentiment Analysis**: AI analyzes the emotional tone of your entries
- **Personalized Insights**: Receive tailored suggestions based on your journal content
- **Pattern Recognition**: The AI identifies recurring themes and patterns in your writing

### ⏰ Smart Reminders
- **Contextual Reminders**: AI suggests reminders based on your journal content
- **Flexible Scheduling**: Set reminders for specific times or intervals
- **Push Notifications**: Receive notifications even when the app is closed
- **Reminder Management**: View, complete, and delete reminders

### 📊 Dashboard
- **Entry Statistics**: Track your journaling streak and total entries
- **Active Reminders**: View upcoming reminders
- **Quick Access**: Easily start a new journal entry or view history

### 🔒 Security & Privacy
- **Secure Authentication**: Email/password authentication via Supabase
- **Row-Level Security**: Database security rules ensure users can only access their own data
- **Private by Design**: Your journal entries are private and secure
- **Biometric Authentication**: Optional fingerprint or Face ID login

## 💻 Technologies Used

### Mobile App
- **React Native**: Cross-platform mobile framework
- **Expo**: Development platform for React Native
- **TypeScript**: Type-safe JavaScript
- **Expo Router**: File-based routing for Expo applications
- **AsyncStorage**: Local storage for React Native
- **Expo Notifications**: Push notification handling

### Backend & Infrastructure
- **Supabase**: Backend-as-a-Service for database, authentication, and storage
- **PostgreSQL**: Relational database for data storage
- **Row-Level Security**: Database security policies
- **Edge Functions**: Serverless functions for AI processing

### AI & Machine Learning
- **Natural Language Processing**: For analyzing journal entries
- **Sentiment Analysis**: To understand emotional content
- **Contextual Suggestions**: AI-generated recommendations

## 🧠 AI Integration

Journal AI Mobile uses advanced natural language processing to analyze journal entries and provide personalized insights. The AI can:

1. Identify emotional states and patterns
2. Recognize topics of interest or concern
3. Suggest appropriate reminders based on content
4. Provide thoughtful responses to user entries

The AI processing happens securely via Supabase Edge Functions, ensuring user data remains private.

## 📱 Push Notifications

The application uses Expo Notifications to deliver reminders even when the user isn't actively using the app. Notifications are:

- Permission-based (users must opt-in)
- Scheduled based on user preferences
- Actionable (users can complete reminders directly from notifications)
- Supported offline through local scheduling

## 🔄 Offline Support

Journal AI Mobile works offline with these capabilities:
- Write journal entries without an internet connection
- View past entries and insights while offline
- Scheduled reminders continue to function
- Data syncs automatically when connection is restored

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License.

## 🙏 Acknowledgements

- [React Native](https://reactnative.dev/)
- [Expo](https://expo.dev/)
- [Supabase](https://supabase.com/)
- [TypeScript](https://www.typescriptlang.org/)
- [Expo Router](https://docs.expo.dev/router/introduction/)
- [OpenAI](https://openai.com/)

<br>
<br>

---

Made by Saymon Araújo
<div>
 <p> Feel free to get in touch, it will be a pleasure to chat.</p>
  <a href="https://www.linkedin.com/in/saymon-araujo/" target="_blank"><img src="https://img.shields.io/badge/LinkedIn-0077B5?style=for-the-badge&logo=linkedin&logoColor=white" target="_blank"></a>
  <a href="mailto:saymonbrandon@gmail.com?subject=Hello%20Saymon,%20From%20Github"><img src="https://img.shields.io/badge/gmail-%23D14836.svg?&style=for-the-badge&logo=gmail&logoColor=white" /></a>
  <a href="https://t.me/saymon_araujo_dev"><img src="https://img.shields.io/badge/Telegram-2CA5E0?style=for-the-badge&logo=telegram&logoColor=white" /></a>&nbsp;&nbsp;&nbsp;&nbsp;
</div>

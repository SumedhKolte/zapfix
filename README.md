# Zapfix

**Diagnosed First. Fixed Right.**

Zapfix is an AI-powered home appliance repair platform connecting customers with verified professionals. Built with React Native (Expo), Supabase, and Groq (Llama 4 Scout).

## Features

- **AI Diagnosis**: Upload photos/videos for instant fault detection
- **Pro Matching**: Smart algorithm matches customers with nearby pros
- **Real-time Tracking**: Live job status updates
- **Secure Payments**: Razorpay integration with escrow
- **Warranty System**: 90-day warranty on all repairs
- **Pro Verification**: AI-powered skill assessment and toolkit verification

## Tech Stack

- **Frontend**: React Native + Expo
- **Backend**: Supabase (PostgreSQL + PostGIS + pgvector)
- **AI**: Groq (Llama 4 Scout)
- **Payments**: Razorpay
- **Maps**: Google Maps API
- **State Management**: Zustand
- **Styling**: NativeWind (Tailwind CSS)

## Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn
- Expo CLI
- Android Studio (for Android development)
- Xcode (for iOS development, macOS only)

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/SumedhKolte/zapfix.git
   cd zapfix
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**

   Copy `.env.local` and fill in your API keys:
   ```bash
   cp .env.local .env.local.example  # Create example file
   # Edit .env.local with your keys
   ```

   Required environment variables:
   - `EXPO_PUBLIC_SUPABASE_URL` - Your Supabase project URL
   - `EXPO_PUBLIC_SUPABASE_ANON_KEY` - Supabase anon key
   - `EXPO_PUBLIC_GOOGLE_MAPS_API_KEY` - Google Maps API key
   - `EXPO_PUBLIC_RAZORPAY_KEY_ID` - Razorpay key ID
   - `GROQ_API_KEY` - Groq API key

4. **Set up Supabase**

   - Create a new Supabase project
   - Run the SQL schema from `supabase/schema.sql` in the SQL Editor
   - Enable phone authentication in Authentication > Providers
   - Configure SMS provider (Twilio/AWS SNS)
   - Deploy Edge Functions: `supabase functions deploy`

5. **Start the development server**
   ```bash
   npx expo start --dev-client
   ```

6. **Run on device/emulator**
   ```bash
   # Android
   npm run android

   # iOS (macOS only)
   npm run ios

   # Web
   npm run web
   ```

## Project Structure

```
zapfix/
├── app/                    # Expo Router pages
│   ├── (auth)/            # Authentication screens
│   ├── (customer)/        # Customer app screens
│   └── (pro)/             # Pro app screens
├── components/            # Reusable UI components
├── services/              # API service functions
├── stores/                # Zustand state stores
├── lib/                   # Utility libraries
├── constants/             # App constants
├── types/                 # TypeScript type definitions
├── supabase/              # Database schema & functions
└── assets/                # Images and icons
```

## Database Schema

The database uses 18 tables with Row Level Security (RLS) enabled. Key tables:

- `profiles` - User profiles (customers & pros)
- `jobs` - Repair job transactions
- `pro_details` - Professional information
- `earnings` - Pro payout tracking
- `catalog_skills` - Service skill catalog
- `catalog_parts` - Parts inventory catalog

## API Endpoints

### Authentication
- Phone OTP signup/signin via Supabase Auth

### Jobs
- Create job with AI diagnosis
- Match with nearby pros
- Real-time status updates

### Payments
- Razorpay order creation
- Escrow management
- Pro payouts

## Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature-name`
3. Commit changes: `git commit -m 'Add feature'`
4. Push to branch: `git push origin feature-name`
5. Open a Pull Request

## License

This project is private and proprietary.

## Support

For questions or issues, please contact the development team.
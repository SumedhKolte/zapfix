# Zapfix Project Architecture and Interview Notes

## 1. Project Overview

Zapfix is an AI-powered home appliance repair platform built as a mobile app. Customers can upload a photo, short video, text description, or voice note describing an appliance issue. The system diagnoses the problem, estimates the service category, and then helps the user book a verified professional.

The project combines:

- Mobile frontend for customers and service professionals
- Supabase backend for auth, database, storage, and edge functions
- AI services for appliance diagnosis, voice transcription, and pro interview grading
- Payment integration for collecting booking payments

## 2. Tech Stack

### Frontend

- React Native
- Expo
- Expo Router
- TypeScript
- NativeWind
- React Query
- Zustand

### Mobile capabilities

- expo-image-picker
- expo-camera
- expo-audio
- expo-location
- expo-notifications
- expo-video-thumbnails

### Backend

- Supabase Auth
- Supabase PostgreSQL
- Supabase Edge Functions
- Supabase Storage

### Database extensions

- PostGIS for geo-spatial location data
- pgvector for skill embeddings

### AI and model services

- Gemini 2.5 Flash for appliance diagnosis
- Groq Whisper Large v3 Turbo for audio transcription
- Groq Llama 4 Scout for pro interview grading

### Payments

- Cashfree SDK and Cashfree-backed edge functions

## 3. High-Level Architecture

The mobile app talks to Supabase for authentication and persistent data. AI-heavy workflows run through Supabase Edge Functions so API keys stay on the server. Different AI models are used for different tasks instead of forcing one model to do everything.

Main layers:

- Mobile app
- Supabase backend
- AI services
- Payments and location services

## 4. How the Diagnosis Model Works

The diagnosis flow is the core intelligence in the project.

### Input options

The customer can provide:

- A photo
- A short video
- A typed problem description
- A voice note that gets transcribed to text

### Client-side preprocessing

Before the AI call:

- Images are resized and compressed
- Videos are sampled into multiple frames
- Audio is converted to base64 and sent for transcription
- Requests include the Supabase auth token

### Server-side diagnosis flow

The app sends the prepared input to the Supabase Edge Function named `diagnose`.

That function:

1. Verifies the current user using Supabase Auth
2. Accepts either image base64, video frames, storage path, or text-only input
3. Builds a structured prompt for Gemini 2.5 Flash
4. Sends image frames and text together for multimodal reasoning
5. Forces a JSON-only response using a strict schema
6. Normalizes the result
7. Computes pricing on the server using fixed category pricing
8. Saves diagnosis data back to the `jobs` table and related media tables

### Why this model design is strong

The project intentionally separates:

- AI for diagnosis
- Backend logic for pricing and business rules

This reduces hallucinated prices and keeps behavior consistent.

### Model output fields

The diagnosis response includes:

- `fault_detected`
- `fault_name`
- `fault_description`
- `confidence`
- `required_parts`
- `required_skill`
- `urgency`

The backend then maps `required_skill` to a fixed category price.

## 5. Voice-to-Text Flow

If the user records a voice note:

1. The app records audio using Expo Audio
2. The app converts the file to base64
3. The request goes to the Supabase `transcribe` edge function
4. That function calls Groq Whisper Large v3 Turbo
5. The transcript is returned and used as problem description input

## 6. Other AI Flows

The project uses multiple models for specialized tasks.

### Diagnosis

- Gemini 2.5 Flash
- Multimodal image plus text diagnosis

### Audio transcription

- Groq Whisper Large v3 Turbo
- Converts recorded customer audio into text

### Pro interview grading

- Groq Llama 4 Scout
- Scores onboarding interview answers for service professionals

## 7. Database Design

Important tables include:

- `profiles`
- `pro_details`
- `jobs`
- `customer_addresses`
- `pro_skills`
- `pro_inventory`
- `media_assets`
- `notifications`
- `earnings`

Interesting schema features:

- `current_location geography(Point, 4326)`
- `job_location geography(Point, 4326)`
- `skill_vector vector(1536)`

This means the system is ready for:

- location-aware matching
- structured job lifecycle tracking
- smarter future skill matching with embeddings

## 8. End-to-End Booking Flow

1. Customer uploads image, video, text, or voice note
2. AI diagnosis is generated
3. Diagnosis is shown in the app
4. User confirms booking details
5. Payment is created and verified through Cashfree
6. Job is scheduled and moved into matching flow
7. Pro accepts and completes the job lifecycle

## 9. Important Implementation Notes

The current code differs from the README in a few places:

- Diagnosis currently uses Gemini, not Groq
- Payments currently use Cashfree, not Razorpay

When explaining the project, it is better to describe the stack based on the current implementation in code.

## 10. Interview-Ready Explanation

### Detailed version

I built Zapfix, an AI-powered appliance repair platform using React Native and Expo on the frontend, with Supabase for authentication, database, storage, and edge functions. The main feature is an AI diagnosis flow where users can upload a photo, short video, typed description, or voice note describing an appliance issue.

On the client side, I preprocess images and sample frames from videos before sending them securely to a Supabase Edge Function. That function authenticates the user, builds a structured multimodal prompt, and sends it to Gemini 2.5 Flash for diagnosis. I constrained the model output with a strict JSON schema so the result is reliable and easy to consume in the UI. I also kept pricing logic out of the model and computed fixed category-based pricing on the backend for consistency and business control.

For voice input, I integrated Groq Whisper for speech-to-text so users can describe issues naturally. For onboarding service professionals, I used Groq Llama to grade interview responses and store the results in Supabase. On the data side, I used PostgreSQL with PostGIS for geo-aware workflows and pgvector to support future skill-based matching features.

Overall, the project combines mobile app development, AI integration, serverless backend design, structured model outputs, payments, and location-aware service workflows.

### Short version

I built a React Native and Supabase app for appliance repair booking where AI diagnoses faults from photos, video frames, and voice or text input. Gemini handles structured diagnosis, Groq handles transcription and interview grading, and Supabase manages auth, storage, database, and edge functions. I designed the flow so the model handles diagnosis while pricing and business logic stay deterministic on the backend.

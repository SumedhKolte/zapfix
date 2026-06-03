const fs = require('fs');
const path = require('path');
const PDFDocument = require('pdfkit');

const outDir = path.join(process.cwd(), 'docs');
const outPath = path.join(outDir, 'Zapfix-Architecture-and-Interview-Notes.pdf');

if (!fs.existsSync(outDir)) {
  fs.mkdirSync(outDir, { recursive: true });
}

const doc = new PDFDocument({
  size: 'A4',
  margins: { top: 50, bottom: 50, left: 50, right: 50 },
  bufferPages: true,
});

doc.pipe(fs.createWriteStream(outPath));

const palette = {
  navy: '#0F2057',
  blue: '#1B6FE8',
  amber: '#F5B800',
  text: '#1B1F2A',
  muted: '#5A647C',
  border: '#D9DFEC',
  bg: '#F7F9FC',
  green: '#1A7A4A',
};

function addHeaderFooter() {
  const range = doc.bufferedPageRange();
  for (let i = 0; i < range.count; i += 1) {
    doc.switchToPage(i);
    const pageNumber = i + 1;
    doc
      .fontSize(9)
      .fillColor(palette.muted)
      .text('Zapfix Project Architecture and Interview Notes', 50, 24, {
        align: 'left',
      });
    doc
      .fontSize(9)
      .fillColor(palette.muted)
      .text(`Page ${pageNumber}`, 50, 800, {
        align: 'right',
      });
  }
}

function ensureSpace(height = 60) {
  if (doc.y + height > doc.page.height - doc.page.margins.bottom) {
    doc.addPage();
  }
}

function title(text) {
  ensureSpace(90);
  doc.moveDown(0.2);
  doc.font('Helvetica-Bold').fontSize(22).fillColor(palette.navy).text(text);
  doc.moveDown(0.2);
}

function section(text) {
  ensureSpace(60);
  doc.moveDown(0.6);
  doc.font('Helvetica-Bold').fontSize(15).fillColor(palette.navy).text(text);
  doc.moveDown(0.25);
}

function paragraph(text) {
  doc.font('Helvetica').fontSize(10.5).fillColor(palette.text).text(text, {
    lineGap: 3,
  });
  doc.moveDown(0.45);
}

function bullet(text, indent = 16) {
  const x = doc.x;
  const y = doc.y;
  ensureSpace(24);
  doc.circle(x + 4, y + 7, 2).fill(palette.blue);
  doc.fillColor(palette.text).font('Helvetica').fontSize(10.5).text(text, x + indent, y, {
    width: 470,
    lineGap: 2,
  });
  doc.moveDown(0.2);
}

function codeLine(text) {
  ensureSpace(18);
  doc.font('Helvetica-Oblique').fontSize(10).fillColor(palette.green).text(text);
}

function drawBox(x, y, w, h, label, options = {}) {
  const fill = options.fill || '#FFFFFF';
  const stroke = options.stroke || palette.navy;
  doc.roundedRect(x, y, w, h, 8).fillAndStroke(fill, stroke);
  doc
    .fillColor(options.text || palette.text)
    .font(options.bold ? 'Helvetica-Bold' : 'Helvetica')
    .fontSize(options.fontSize || 10)
    .text(label, x + 8, y + 10, {
      width: w - 16,
      align: 'center',
    });
}

function arrow(x1, y1, x2, y2, color = palette.blue) {
  doc.save();
  doc.strokeColor(color).lineWidth(1.5).moveTo(x1, y1).lineTo(x2, y2).stroke();
  const angle = Math.atan2(y2 - y1, x2 - x1);
  const size = 6;
  doc
    .moveTo(x2, y2)
    .lineTo(x2 - size * Math.cos(angle - Math.PI / 6), y2 - size * Math.sin(angle - Math.PI / 6))
    .lineTo(x2 - size * Math.cos(angle + Math.PI / 6), y2 - size * Math.sin(angle + Math.PI / 6))
    .lineTo(x2, y2)
    .fill(color);
  doc.restore();
}

function architectureDiagram() {
  ensureSpace(270);
  const left = 60;
  const top = doc.y + 10;

  drawBox(left, top, 150, 54, 'Mobile App\nReact Native + Expo', { fill: '#EEF4FF', bold: true });
  drawBox(left + 185, top - 5, 140, 44, 'Supabase Auth', { fill: '#F8FAFD' });
  drawBox(left + 185, top + 55, 140, 44, 'Supabase DB\nPostgreSQL + Storage', { fill: '#F8FAFD' });
  drawBox(left + 185, top + 115, 140, 44, 'Edge Functions', { fill: '#F8FAFD', bold: true });

  drawBox(left + 360, top - 10, 145, 44, 'Gemini 2.5 Flash\nDiagnosis', { fill: '#FFF7E0' });
  drawBox(left + 360, top + 55, 145, 44, 'Groq Whisper\nTranscription', { fill: '#FFF7E0' });
  drawBox(left + 360, top + 120, 145, 44, 'Groq Llama 4 Scout\nInterview Grading', { fill: '#FFF7E0' });

  arrow(left + 150, top + 27, left + 185, top + 17);
  arrow(left + 150, top + 27, left + 185, top + 77);
  arrow(left + 150, top + 27, left + 185, top + 137);
  arrow(left + 325, top + 137, left + 360, top + 12);
  arrow(left + 325, top + 137, left + 360, top + 77);
  arrow(left + 325, top + 137, left + 360, top + 142);

  doc.y = top + 185;
  paragraph('Architecture summary: the app handles UX and capture, Supabase handles auth, storage, and orchestration, and specialized AI models handle diagnosis, transcription, and interview scoring.');
}

function diagnosisFlowDiagram() {
  ensureSpace(320);
  const x = 74;
  let y = doc.y + 8;
  const w = 450;
  const h = 34;
  const gap = 18;

  const steps = [
    '1. User adds photo, video, text, or voice note',
    '2. App preprocesses image or samples video frames',
    '3. Request goes to Supabase Edge Function /diagnose',
    '4. User auth is verified on the server',
    '5. Prompt and JSON schema are assembled',
    '6. Gemini 2.5 Flash performs multimodal diagnosis',
    '7. Server normalizes output and computes fixed price',
    '8. Diagnosis is stored in jobs and returned to the app',
  ];

  for (let i = 0; i < steps.length; i += 1) {
    drawBox(x, y, w, h, steps[i], {
      fill: i % 2 === 0 ? '#F8FAFD' : '#EEF4FF',
      stroke: palette.border,
      text: palette.text,
    });
    if (i < steps.length - 1) {
      arrow(x + w / 2, y + h, x + w / 2, y + h + gap - 4);
    }
    y += h + gap;
  }
  doc.y = y + 6;
}

function modelResponsibilityDiagram() {
  ensureSpace(200);
  const y = doc.y + 10;
  drawBox(70, y, 145, 62, 'Gemini 2.5 Flash\nFault detection\nStructured JSON output', {
    fill: '#FFF7E0',
    bold: true,
  });
  drawBox(235, y, 145, 62, 'Backend Logic\nPricing\nValidation\nPersistence', {
    fill: '#EEF4FF',
    bold: true,
  });
  drawBox(400, y, 125, 62, 'UI Result\nDiagnosis card\nBooking flow', {
    fill: '#F8FAFD',
    bold: true,
  });
  arrow(215, y + 31, 235, y + 31);
  arrow(380, y + 31, 400, y + 31);
  doc.y = y + 88;
}

title('Zapfix Project Architecture and Interview Notes');
paragraph('This PDF summarizes the actual code-backed architecture of the Zapfix project, explains how the diagnosis model works, lists the technologies in use, and includes interview-ready explanations.');

section('1. Project Overview');
paragraph('Zapfix is an AI-powered home appliance repair platform built as a mobile app. Customers can report an issue using a photo, short video, text description, or voice note. The app diagnoses the issue, estimates the service category, and helps the user move into booking and professional matching.');

section('2. Tech Stack');
bullet('Frontend: React Native, Expo, Expo Router, TypeScript, NativeWind, React Query, Zustand');
bullet('Mobile capabilities: expo-image-picker, expo-camera, expo-audio, expo-location, expo-notifications, expo-video-thumbnails');
bullet('Backend: Supabase Auth, Supabase PostgreSQL, Supabase Edge Functions, Supabase Storage');
bullet('Database extensions: PostGIS for geo-spatial data and pgvector for skill embeddings');
bullet('AI services: Gemini 2.5 Flash for diagnosis, Groq Whisper for transcription, Groq Llama 4 Scout for interview grading');
bullet('Payments: Cashfree SDK and Cashfree-backed edge functions');

section('3. High-Level Architecture');
architectureDiagram();

section('4. Diagnosis Model Working');
paragraph('The diagnosis flow is the core model-driven feature in the project. The customer can provide a photo, short video, typed description, or a voice note. If the input is an image, the app compresses and resizes it before upload. If the input is a video, the app samples several still frames so the model can reason across the clip without being sent a raw video file.');
paragraph('The prepared input is sent to the Supabase Edge Function named diagnose. That function authenticates the user, builds a structured multimodal prompt, includes the image frames and customer description, and sends the request to Gemini 2.5 Flash.');
paragraph('The function enforces a strict JSON response schema so the model returns structured fields such as fault name, confidence, required parts, required skill, and urgency. The server then normalizes the output and computes pricing separately using fixed category-based rules.');

section('5. Diagnosis Flowchart');
diagnosisFlowDiagram();

section('6. Why the Model Design is Good');
paragraph('A strong implementation choice in this project is that the LLM is used for diagnosis, not pricing. The model decides what the likely fault is and which service category is needed, but pricing stays deterministic on the backend. That makes the system much more predictable and easier to trust.');
modelResponsibilityDiagram();
bullet('The model handles fault classification and structured extraction.');
bullet('The backend handles pricing, validation, persistence, and business rules.');
bullet('The UI consumes a stable response shape for rendering and booking.');

section('7. Voice-to-Text Flow');
paragraph('If the user records a voice note, the mobile app captures audio using Expo Audio and sends it to the Supabase transcribe edge function. That function forwards the audio to Groq Whisper Large v3 Turbo, receives the transcript, and returns plain text to the app. The transcript is then reused as the problem description for diagnosis.');

section('8. Other AI Flows');
bullet('Diagnosis: Gemini 2.5 Flash for multimodal appliance diagnosis.');
bullet('Audio transcription: Groq Whisper Large v3 Turbo for speech-to-text.');
bullet('Pro interview grading: Groq Llama 4 Scout for structured onboarding assessment.');

section('9. Database Design');
paragraph('The Supabase schema includes core business entities such as profiles, pro_details, jobs, customer_addresses, pro_skills, pro_inventory, media_assets, notifications, and earnings. The schema also includes geo-spatial points for service locations and vector fields for future skill-based intelligence.');
codeLine('current_location geography(Point, 4326)');
codeLine('job_location geography(Point, 4326)');
codeLine('skill_vector vector(1536)');
paragraph('This prepares the system for location-aware dispatching, richer job lifecycle handling, and future smart matching improvements.');

section('10. End-to-End Flow');
bullet('Customer uploads media or provides text or voice input.');
bullet('AI diagnosis is generated and shown in the app.');
bullet('User confirms details and continues to booking.');
bullet('Payment is created and verified using Cashfree.');
bullet('Job is stored, scheduled, and moved into the matching workflow.');
bullet('A pro accepts the job and the service lifecycle continues.');

section('11. Important Notes from the Codebase');
bullet('The README is slightly behind the implementation.');
bullet('Diagnosis currently uses Gemini, not Groq.');
bullet('Payments currently use Cashfree, not Razorpay.');
bullet('For presentations or interviews, the current code implementation is the most accurate source of truth.');

section('12. Interview-Ready Explanation');
paragraph('Detailed version: I built Zapfix, an AI-powered appliance repair platform using React Native and Expo on the frontend, with Supabase for authentication, database, storage, and edge functions. The main feature is an AI diagnosis flow where users can upload a photo, short video, typed description, or voice note describing an appliance issue. On the client side, I preprocess images and sample frames from videos before sending them securely to a Supabase Edge Function. That function authenticates the user, builds a structured multimodal prompt, and sends it to Gemini 2.5 Flash for diagnosis. I constrained the model output with a strict JSON schema so the result is reliable and easy to consume in the UI. I also kept pricing logic out of the model and computed fixed category-based pricing on the backend for consistency and business control. For voice input, I integrated Groq Whisper for speech-to-text so users can describe issues naturally. For onboarding service professionals, I used Groq Llama to grade interview responses and store the results in Supabase. On the data side, I used PostgreSQL with PostGIS for geo-aware workflows and pgvector to support future skill-based matching features.');
paragraph('Short version: I built a React Native and Supabase app for appliance repair booking where AI diagnoses faults from photos, video frames, and voice or text input. Gemini handles structured diagnosis, Groq handles transcription and interview grading, and Supabase manages auth, storage, database, and edge functions. I designed the flow so the model handles diagnosis while pricing and business logic stay deterministic on the backend.');

addHeaderFooter();
doc.end();

console.log(`PDF generated at: ${outPath}`);

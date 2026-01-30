# DocOps Copilot - AI-Powered Document Intelligence

Transform unstructured documents into actionable intelligence with AI-powered analysis, intelligent routing, and workflow automation.

## Features

- **Universal Document Processing**: Upload PDFs, DOCX, or TXT files, or paste text directly
- **AI-Powered Analysis**: Automatic classification, entity extraction, and summarization
- **Smart Routing**: Documents are automatically classified and assigned to the right team
- **Risk Detection**: Identify missing information, compliance issues, and potential risks
- **Workflow Automation**: Auto-generated checklists, draft emails, and action items
- **Full Audit Trail**: Complete history of all changes and actions
- **Case Management**: Track, filter, and manage all document cases

## Tech Stack

- **Frontend**: Next.js 14 (App Router), TypeScript, Tailwind CSS, shadcn/ui
- **Backend**: Next.js API Routes, Prisma ORM
- **Database**: PostgreSQL (Supabase)
- **AI**: Groq API (llama-3.3-70b-versatile) with fallback mock mode
- **OCR**: PyTesseract for PDF text extraction

## Quick Start

### Prerequisites

- Node.js 18+
- npm or yarn
- Python 3.8+
- Tesseract OCR (for PDF text extraction)
- Poppler (for PDF to image conversion)
- Supabase account (free tier works fine)

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd docops-copilot
```

2. Install Node.js dependencies:
```bash
npm install
```

3. Install system dependencies for OCR:

**macOS:**
```bash
brew install tesseract poppler
```

**Ubuntu/Debian:**
```bash
sudo apt-get update
sudo apt-get install tesseract-ocr poppler-utils
```

**Windows:**
- Tesseract: https://github.com/UB-Mannheim/tesseract/wiki
- Poppler: https://github.com/oschwartz10612/poppler-windows/releases

4. Install Python dependencies for OCR:
```bash
cd python-services
pip3 install -r requirements.txt
cd ..
```

5. Set up environment variables:
```bash
cp .env.example .env
```

Edit `.env` and add your credentials:
```env
# Groq API Key (get from https://console.groq.com)
GROQ_API_KEY="your_groq_api_key_here"

# Supabase Database URLs (see SUPABASE_SETUP.md for details)
DATABASE_URL="postgresql://postgres:[PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres?pgbouncer=true"
DIRECT_URL="postgresql://postgres:[PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres"

# Optional Settings
MOCK_AI="false"
NEXT_PUBLIC_BASE_URL="http://localhost:3000"
```

**📚 See "Supabase Database Setup" section below for detailed instructions**

6. Initialize the database:
```bash
# Generate Prisma client
npm run db:generate

# Push schema to Supabase
npm run db:push
```

7. (Optional) Seed with sample data:
```bash
npm run seed
```

8. Start the development server:
```bash
npm run dev
```

9. Open [http://localhost:3000](http://localhost:3000)

## Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `DATABASE_URL` | Supabase PostgreSQL connection string (pooled) | Yes |
| `DIRECT_URL` | Supabase PostgreSQL direct connection (for migrations) | Yes |
| `GROQ_API_KEY` | Groq API key for AI analysis | No (uses mock mode) |
| `MOCK_AI` | Force mock AI mode | No (default: false) |
| `NEXT_PUBLIC_BASE_URL` | Base URL for OCR API calls | No (default: http://localhost:3000) |

## Supabase Database Setup

### 1. Create a Supabase Project

1. Go to https://supabase.com
2. Sign up or log in
3. Click "New Project"
4. Choose your organization
5. Enter project details:
   - **Name**: docops-copilot (or your choice)
   - **Database Password**: Generate a strong password (SAVE THIS!)
   - **Region**: Choose closest to you
   - **Pricing Plan**: Free tier works fine for development
6. Click "Create new project"
7. Wait 2-3 minutes for project to be provisioned

### 2. Get Database Connection Strings

1. In your Supabase project dashboard, go to **Settings** (gear icon)
2. Click **Database** in the left sidebar
3. Scroll to "Connection string" section
4. You'll see two types of connection strings:

#### Connection Pooling (DATABASE_URL)
- Click on **"URI"** tab
- Copy the connection string that looks like:
  ```
  postgresql://postgres.xxxxx:password@aws-0-region.pooler.supabase.com:5432/postgres
  ```
- This uses connection pooling (recommended for Next.js/Vercel)

#### Direct Connection (DIRECT_URL)
- Click on **"Direct connection"** 
- Copy the connection string that looks like:
  ```
  postgresql://postgres:password@db.xxxxx.supabase.co:5432/postgres
  ```
- This is used for migrations

### 3. Configure Your .env File

Update your `.env` file in the project root:

```env
# Groq API Key
GROQ_API_KEY=your_groq_api_key_here

# Supabase Database URLs
# Replace [YOUR-PASSWORD] with your database password
# Replace [YOUR-PROJECT-REF] with your project reference
DATABASE_URL="postgresql://postgres:[YOUR-PASSWORD]@db.[YOUR-PROJECT-REF].supabase.co:5432/postgres?pgbouncer=true"
DIRECT_URL="postgresql://postgres:[YOUR-PASSWORD]@db.[YOUR-PROJECT-REF].supabase.co:5432/postgres"

# Optional Settings
MOCK_AI=false
NEXT_PUBLIC_BASE_URL=http://localhost:3000
```

**Important**: Replace the placeholders:
- `[YOUR-PASSWORD]` = Your database password
- `[YOUR-PROJECT-REF]` = Your project reference (e.g., `abcdefghijklmnop`)

### 4. Run Database Migrations

```bash
# Generate Prisma client for PostgreSQL
npm run db:generate

# Push schema to Supabase
npm run db:push

# Or use migrations (recommended for production)
npx prisma migrate dev --name init
```

### 5. Seed the Database (Optional)

```bash
npm run seed
```

This will create 10 sample cases for testing.

### 6. Verify Connection

```bash
# Open Prisma Studio to view your data
npm run db:studio
```

You should see your Supabase database with the Case, AuditEvent, CaseNote, and Attachment tables.

### Supabase Troubleshooting

#### "Can't reach database server"
- Check your DATABASE_URL is correct
- Verify your database password
- Make sure your Supabase project is running (green indicator in dashboard)

#### "Connection pool timeout"
- Use DIRECT_URL for migrations
- Use DATABASE_URL (with pooling) for the application

#### "SSL/TLS connection required"
- Supabase requires SSL by default (already included in the connection strings)

#### "Too many connections"
- Supabase free tier has connection limits
- Make sure you're using connection pooling (DATABASE_URL)
- Close unused connections

### Supabase Dashboard Features

- **Table Editor**: View and edit data directly
- **SQL Editor**: Run custom SQL queries
- **Database**: Manage tables, triggers, functions
- **Storage**: File storage (for future file uploads)
- **Auth**: User authentication (if needed later)
- **API**: Auto-generated REST and GraphQL APIs

### Free Tier Limits

- 500 MB database space
- 2 GB bandwidth per month
- 50,000 monthly active users
- Unlimited API requests
- Automatic backups (7 days)

Perfect for development and small production deployments!

## Project Structure

```
/src
  /app                    # Next.js app directory
    /api                  # API route handlers
      /analyze            # Document analysis endpoint
      /cases              # Case CRUD endpoints
      /stats              # Dashboard statistics
    /cases                # Cases pages
      /[id]               # Case detail page
    page.tsx              # Home/upload page
    layout.tsx            # Root layout

  /components             # React components
    /ui                   # shadcn/ui components
    /document             # Document-related components
    /case                 # Case-related components
    /layout               # Layout components

  /lib                    # Utilities
    /ai                   # AI integration (analyzer, mock)
    /db                   # Prisma client
    types.ts              # TypeScript types
    utils.ts              # Helper functions

/prisma
  schema.prisma           # Database schema
  seed.ts                 # Seed data script
  /migrations             # Database migrations
```

## Demo Script

1. **Upload a Document**
   - Navigate to the home page
   - Drag and drop a PDF, DOCX, or TXT file, or paste text directly
   - Click "Analyze Document"

2. **Review Analysis Results**
   - See the AI-generated classification, summary, and entities
   - Review risk flags and missing information
   - Check the recommended checklist and draft email

3. **Create a Case**
   - Click "Save as Case" to create a case from the analysis
   - You'll be redirected to the case detail page

4. **Manage Cases**
   - Navigate to the Cases dashboard
   - Filter by team, priority, or status
   - Search for specific cases

5. **Work on a Case**
   - Open a case to see full details
   - Mark checklist items as complete
   - Add notes and track progress
   - View the complete audit trail

## Sample Documents

The seed data includes 10 diverse sample documents:

1. **Disputed Invoice** - AP team, missing PO number
2. **NDA Contract** - Legal team, missing signatures
3. **Software Engineer Resume** - HR team, urgent
4. **IT Incident Report** - IT team, security critical
5. **Sales Meeting Notes** - Sales team, follow-up actions
6. **Privacy Policy Update** - Legal team, GDPR compliance
7. **Purchase Order** - Procurement, pending approval
8. **Customer Support Escalation** - Support team, SLA breach
9. **Expense Report** - Finance team, missing receipts
10. **Partnership Proposal** - Sales/Legal, requires review

## Available Scripts

| Script | Description |
|--------|-------------|
| `npm run dev` | Start development server |
| `npm run build` | Build for production |
| `npm run start` | Start production server |
| `npm run seed` | Seed database with sample data |
| `npm run db:migrate` | Run database migrations |
| `npm run db:studio` | Open Prisma Studio (database GUI) |
| `npm run db:generate` | Generate Prisma client |
| `npm run lint` | Run ESLint |

## API Endpoints

### Document Analysis
```
POST /api/analyze
- Content-Type: multipart/form-data (file upload) or application/json (text)
- Returns: AI analysis results

POST /api/ocr
- Content-Type: multipart/form-data (PDF file upload)
- Returns: Extracted text using OCR
```

### Cases
```
GET    /api/cases          # List cases (with filters)
POST   /api/cases          # Create case
GET    /api/cases/[id]     # Get case details
PATCH  /api/cases/[id]     # Update case
DELETE /api/cases/[id]     # Delete case
```

### Notes
```
GET    /api/cases/[id]/notes    # Get case notes
POST   /api/cases/[id]/notes    # Add note
```

### Audit
```
GET    /api/cases/[id]/audit    # Get audit events
POST   /api/cases/[id]/audit    # Create audit event
```

### Statistics
```
GET    /api/stats          # Get dashboard statistics
```

## AI Mock Mode

When running without a Groq API key (or with `MOCK_AI=true`), the system uses intelligent mock responses:

- Document type detection based on keyword analysis
- Entity extraction using regex patterns
- Team assignment based on document classification
- Priority detection from urgency indicators
- Pre-defined templates for each document type

This allows full demo functionality without API costs.

## OCR Text Extraction

The system uses PyTesseract for OCR text extraction from PDF files:

1. **Standard PDF extraction** is tried first (fast, works for text-based PDFs)
2. **OCR extraction** is used as fallback for scanned/image-based PDFs
3. PDFs are converted to images at 300 DPI for optimal OCR accuracy
4. Text is extracted page by page and combined

To test OCR directly:
```bash
python3 python-services/ocr_service.py path/to/document.pdf
```

## Troubleshooting

### Database issues
```bash
# Reset database (Supabase)
npx prisma migrate reset

# Or just push schema changes
npm run db:push

# Re-seed data
npm run seed
```

### Prisma client issues
```bash
npm run db:generate
```

### Missing modules
```bash
rm -rf node_modules
npm install
```

## License

MIT
# DVHacks

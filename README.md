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
- **Database**: SQLite (zero-config, file-based)
- **AI**: OpenAI GPT-4 with fallback mock mode

## Quick Start

### Prerequisites

- Node.js 18+
- npm or yarn

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd docops-copilot
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
cp .env.example .env
```

Edit `.env` and optionally add your OpenAI API key:
```env
# Database
DATABASE_URL="file:./dev.db"

# OpenAI API Key (optional - uses mock AI if not provided)
OPENAI_API_KEY=""

# Force mock AI mode even if API key is provided
MOCK_AI="true"
```

4. Initialize the database:
```bash
npm run db:migrate
```

5. (Optional) Seed with sample data:
```bash
npm run seed
```

6. Start the development server:
```bash
npm run dev
```

7. Open [http://localhost:3000](http://localhost:3000)

## Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `DATABASE_URL` | SQLite database path | Yes |
| `OPENAI_API_KEY` | OpenAI API key for AI analysis | No (uses mock mode) |
| `MOCK_AI` | Force mock AI mode | No (default: true) |

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

When running without an OpenAI API key (or with `MOCK_AI=true`), the system uses intelligent mock responses:

- Document type detection based on keyword analysis
- Entity extraction using regex patterns
- Team assignment based on document classification
- Priority detection from urgency indicators
- Pre-defined templates for each document type

This allows full demo functionality without API costs.

## Troubleshooting

### Database issues
```bash
# Reset database
rm prisma/dev.db
npm run db:migrate
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

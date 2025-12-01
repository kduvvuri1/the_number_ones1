# br.AI.nstorm - AI Video Note Taker
## Project Planning Document
Version 1.0

---

## Project Overview
**br.AI.nstorm** is a planned AI-powered video collaboration platform that automatically generates structured notes and summaries from video meetings, interviews, and discussions.

**Current Status**: Planning Phase 

---

## Technology Stack (Planned)

| Component | Proposed Tools / Frameworks | Status |
|-----------|----------------------------|---------|
| **Frontend** | Next.js 14 (App Router), Tailwind CSS |  Selected |
| **Authentication** | Clerk.js |  Selected |
| **Video Infrastructure** | Stream API |  Evaluating |
| **Backend/API** | Next.js API Routes + Python FastAPI |  Planning |
| **Database** | PostgreSQL / Supabase |  Evaluating |
| **AI Engine** | Google Gemini API  |  Researching |

---

## Getting Started (Development Plan)

### Phase 1: Foundation Setup
```bash
# Initialize Next.js project (Completed)
npx create-next-app@latest br.AI.nstorm

# Set up shadcn/ui components (Planned)
npx shadcn@latest init

# Install core UI components (Planned)
npx shadcn@latest add alert-dialog button card dialog
npx shadcn@latest add dropdown-menu input sheet sonner textarea
```

### Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) to view the development environment.

---

## Project Architecture (Proposed)

### Planned Component Structure
```plaintext
br.AI.nstorm/
├── app/                 # Next.js App Router
├── components/          # Reusable UI components
├── lib/                # Utilities & configurations
├── hooks/              # Custom React hooks
├── types/              # TypeScript definitions
├── services/           # API & external service integrations
└── ai/                 # AI processing pipelines
```

### Key Modules to Develop
1. **User Authentication System** (Clerk.js integration)
2. **Video Meeting Interface** (Stream API integration)
3. **AI Processing Pipeline** (OpenAI integration)
4. **Note Management System**
5. **Export & Sharing Module**

---

## Development Roadmap

###  Phase 1: MVP (Weeks 1-4)
-  Next.js project setup with TypeScript
-  Basic authentication with Clerk.js
-  UI component library implementation
-  Basic meeting interface prototype

###  Phase 2: Core Features (Weeks 5-8)
-  Video call integration (Stream API)
-  Basic recording functionality
-  Database schema implementation
-  User profile management

###  Phase 3: AI Integration (Weeks 9-12)
-  Audio transcription service
-  AI note generation pipeline
-  Note organization system
-  Search functionality

###  Phase 4: Polish & Scale (Weeks 13-16)
-  Export & sharing features
-  Performance optimization
-  Security implementation
-  Production deployment

---

## Planned User Roles & Features

| User Role | Planned Use Cases |
|-----------|-------------------|
| **Student** | Join study sessions, access AI-generated notes, search past materials |
| **Professional** | Team meetings, decision tracking, action item generation |
| **Researcher** | Interview recording, structured note organization, data export |

---

## Technical Considerations

### Key Decisions Pending
1. **Database Selection**: PostgreSQL vs Firebase Firestore
2. **Backend Architecture**: Monolithic vs Microservices
3. **AI Service**: OpenAI API vs self-hosted models
4. **File Storage**: AWS S3 vs Cloudinary vs Vercel Blob

### Development Standards
- **Styling**: Tailwind CSS + shadcn/ui components
- **State Management**: React Context + Zustand (planned)
- **API Design**: RESTful + potential GraphQL endpoints
- **Testing**: Jest + React Testing Library

---

## Next Steps
1. Finalize technology stack decisions
2. Set up development environment
3. Create detailed component specifications
4. Begin Phase 1 implementation

---

**Document Version**: 1.0  
**Last Updated**: 10/14/2025  
**Project Status**: Planning Phase  
**Team**: Development Team

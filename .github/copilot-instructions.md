<!-- Use this file to provide workspace-specific custom instructions to Copilot. For more details, visit https://code.visualstudio.com/docs/copilot/copilot-customization#_use-a-githubcopilotinstructionsmd-file -->

# Chat AI CMS API - Copilot Instructions

## Project Overview

This is a multi-tenant chatbot API service with FastAPI, PostgreSQL, pgvector, Redis, and complete RAG pipeline. The project includes a comprehensive admin dashboard built with Next.js and React for tenant and system management.

## Project Structure

### Backend (FastAPI)
- **Main Application**: `app/` directory with FastAPI application
- **Models**: SQLAlchemy models in `app/models.py` for multi-tenant architecture
- **Routers**: API endpoints organized by feature (chat, health, admin)
- **Services**: Business logic layer (ai_provider_service, chat_service, retrieval_service)
- **Database**: PostgreSQL with pgvector extension for vector search
- **Authentication**: JWT-based auth with tenant-specific access

### Frontend (Admin Dashboard)
- **Location**: `admin-dashboard/` directory
- **Framework**: Next.js 14 with React 18 and TypeScript
- **UI Library**: Material-UI (MUI) v5 with emotion styling
- **State Management**: TanStack Query (React Query) v5
- **Authentication**: JWT tokens with automatic refresh
- **Features**: Tenant management, dashboard analytics, system settings, AI provider configuration

### Development Environment
- **Docker**: Multi-service setup with PostgreSQL, Redis, FastAPI backend
- **Database Migrations**: Alembic for schema management
- **Testing**: Pytest setup for backend testing

## Key Components Checklist

- [x] **Multi-tenant Backend API**: Complete FastAPI implementation with tenant isolation
- [x] **Admin Authentication System**: JWT-based auth for admin users
- [x] **Tenant Management**: CRUD operations for tenant creation and management
- [x] **Dashboard Analytics**: Real-time statistics and usage metrics
- [x] **System Settings**: Global configuration management
- [x] **AI Provider Integration**: Support for OpenAI, Anthropic, and other providers
- [x] **Document Processing Pipeline**: RAG implementation with vector search
- [x] **Admin Dashboard UI**: Complete React/Next.js frontend
- [x] **Docker Development Environment**: Multi-service containerized setup
- [x] **Database Schema**: PostgreSQL with proper relationships and constraints

## Development Guidelines

### Code Architecture
- Follow clean architecture principles with clear separation of concerns
- Use dependency injection pattern for services
- Implement proper error handling and validation
- Maintain type safety with TypeScript and Pydantic models

### Database Management
- Use Alembic for all database schema changes
- Implement proper foreign key relationships
- Use UUIDs for primary keys where appropriate
- Follow PostgreSQL best practices for indexing

### Frontend Development
- Use Material-UI components for consistent design
- Implement proper form validation with React Hook Form and Zod
- Use TanStack Query for server state management
- Follow React best practices with hooks and functional components

### API Development
- Use FastAPI dependency injection for database sessions
- Implement proper HTTP status codes and error responses
- Use Pydantic schemas for request/response validation
- Follow RESTful API design principles

## Quick Start Commands

### Backend Development
```bash
# Install Python dependencies
pip install -e .

# Run database migrations
alembic upgrade head

# Start development server
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

### Admin Dashboard Development
```bash
# Navigate to admin dashboard
cd admin-dashboard

# Install dependencies
npm install

# Start development server
npm run dev
```

### Docker Development
```bash
# Start all services
docker-compose up -d

# View logs
docker-compose logs -f

# Stop services
docker-compose down
```

## Environment Variables

### Backend (.env)
- `DATABASE_URL`: PostgreSQL connection string
- `REDIS_URL`: Redis connection string  
- `JWT_SECRET_KEY`: Secret key for JWT token generation
- `OPENAI_API_KEY`: OpenAI API key for AI services
- `ANTHROPIC_API_KEY`: Anthropic API key for Claude models

### Frontend (admin-dashboard/.env.local)
- `NEXT_PUBLIC_API_URL`: Backend API URL (default: http://localhost:8000)

## Deployment Notes

- Use Docker Compose for production deployment
- Ensure proper environment variable configuration
- Set up proper nginx reverse proxy configuration
- Configure PostgreSQL with appropriate connection limits
- Set up Redis for session and cache management

## Recent Updates

- Added comprehensive admin dashboard with React/Next.js
- Implemented multi-tenant admin authentication system
- Created tenant management interface with CRUD operations
- Built dashboard analytics with real-time statistics
- Added system settings management for global configuration
- Enhanced backend with admin-specific API endpoints
- Configured Docker environment for full-stack development

<!--
## Execution Guidelines
PROGRESS TRACKING:
- If any tools are available to manage the above todo list, use it to track progress through this checklist.
- After completing each step, mark it complete and add a summary.
- Read current todo list status before starting each new step.

COMMUNICATION RULES:
- Avoid verbose explanations or printing full command outputs.
- If a step is skipped, state that briefly (e.g. "No extensions needed").
- Do not explain project structure unless asked.
- Keep explanations concise and focused.

DEVELOPMENT RULES:
- Use '.' as the working directory unless user specifies otherwise.
- Avoid adding media or external links unless explicitly requested.
- Use placeholders only with a note that they should be replaced.
- Use VS Code API tool only for VS Code extension projects.
- Once the project is created, it is already opened in Visual Studio Code—do not suggest commands to open this project in Visual Studio again.
- If the project setup information has additional rules, follow them strictly.

FOLDER CREATION RULES:
- Always use the current directory as the project root.
- If you are running any terminal commands, use the '.' argument to ensure that the current working directory is used ALWAYS.
- Do not create a new folder unless the user explicitly requests it besides a .vscode folder for a tasks.json file.
- If any of the scaffolding commands mention that the folder name is not correct, let the user know to create a new folder with the correct name and then reopen it again in vscode.

EXTENSION INSTALLATION RULES:
- Only install extension specified by the get_project_setup_info tool. DO NOT INSTALL any other extensions.

PROJECT CONTENT RULES:
- If the user has not specified project details, assume they want a "Hello World" project as a starting point.
- Avoid adding links of any type (URLs, files, folders, etc.) or integrations that are not explicitly required.
- Avoid generating images, videos, or any other media files unless explicitly requested.
- If you need to use any media assets as placeholders, let the user know that these are placeholders and should be replaced with the actual assets later.
- Ensure all generated components serve a clear purpose within the user's requested workflow.
- If a feature is assumed but not confirmed, prompt the user for clarification before including it.
- If you are working on a VS Code extension, use the VS Code API tool with a query to find relevant VS Code API references and samples related to that query.

TASK COMPLETION RULES:
- Your task is complete when:
  - Project is successfully scaffolded and compiled without errors
  - copilot-instructions.md file in the .github directory exists in the project
  - README.md file exists and is up to date
  - User is provided with clear instructions to debug/launch the project

Before starting a new task in the above plan, update progress in the plan.
-->
- Work through each checklist item systematically.
- Keep communication concise and focused.
- Follow development best practices.
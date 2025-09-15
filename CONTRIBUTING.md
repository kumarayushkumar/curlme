# Contributing to curlme

Thanks for your interest in improving this project. This guide explains how to set up your environment, make changes safely, and submit a high-quality pull request.

### Repo layout (monorepo)
- apps/frontend:
- apps/api: Express + TypeScript + PostgreSQL + Redis
- apps/cli: TypeScript CLI
- docker-compose.yml: local infra (PostgreSQL, Redis, API, Caddy)

## Getting Started

### Fork and Clone

1. Fork the repository on GitHub
2. Clone your fork locally
3. Add the upstream remote:

## 🛠️ Development Setup

### 1. Install Dependencies

```bash
# Install all workspace dependencies
npm install

# Or with yarn (if you prefer)
yarn install
```

### 2. Database Setup

```bash
cd apps/api

# Generate Prisma client
npx prisma generate

# Push schema to database (for development)
npx prisma db push

# Or create and run migrations (for production)
npx prisma migrate dev --name init
```

### 3. GitHub OAuth App Setup

1. Go to [GitHub Developer Settings](https://github.com/settings/developers)
2. Create a new OAuth App:
   - **Application name**: `curlme-dev`
   - **Homepage URL**: `http://localhost:3000`
   - **Authorization callback URL**: `http://localhost:3000`
3. Copy Client ID and Secret to your `.env`

### 4. Start Development Servers

```bash
# Start both API and CLI in watch mode
npm run dev

# Or individually
cd apps/api && npm run dev    # API server on :3000
cd apps/cli && npm run dev    # CLI in watch mode
```

## Development Workflow

### Workflow Steps

1. **Create a branch**:
   ```bash
   git checkout -b feature/your-feature-name
   ```

2. **Make changes**: Follow our coding standards

3. **Test your changes**:
   ```bash
   npm run build        # Build all packages
   npm run check-types  # Type checking
   npm run lint         # Linting
   npm run format       # Code formatting
   ```

4. **Commit your changes**:
   ```bash
   git add .
   git commit -m "feat: add amazing new feature"
   ```

5. **Push and create PR**:
   ```bash
   git push origin feature/your-feature-name
   ```

## 📏 Coding Standards

### TypeScript Guidelines

- **Use TypeScript strictly** - no `any` types
- **Define interfaces** for all data structures
- **Use Zod schemas** for validation
- **Export types** from dedicated type files

```typescript
// Good
interface CreatePostRequest {
  content: string;
}

// Bad
function createPost(data: any) { ... }
```

### File Naming

- **kebab-case** for files: `create-post.controller.ts`
- **PascalCase** for types: `CreatePostRequest`
- **camelCase** for functions: `createPost`
- **UPPER_CASE** for constants: `POST_LIMIT`

### API Design

- **RESTful endpoints**: Use appropriate HTTP methods
- **Consistent responses**: Always return `{ success, data, message }`
- **Error handling**: Use consistent error codes
- **Validation**: Use Zod schemas

### Database

- **Use transactions** for multi-step operations
- **Add proper indexes** for performance
- **Use meaningful names** for tables and columns
- **Handle cascade deletes** properly

### Caching

- **Cache expensive queries** (feed, user profiles)
- **Invalidate cache** when data changes
- **Use TTL** appropriately
- **Handle cache misses** gracefully

---

Thank you for contributing to curlme!

*Every contribution, no matter how small, makes a difference.*

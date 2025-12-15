# Copilot Instructions for famosofluxo

## Project Overview
- **Framework**: Next.js 16 (App Router) with React 19.
- **Language**: TypeScript.
- **Styling**: Tailwind CSS with Shadcn UI.
- **Package Manager**: pnpm.

## Architecture & Structure
- **App Router**: All routes are defined in `app/`. Use `page.tsx` for routes and `layout.tsx` for layouts.
- **Components**:
  - UI primitives (Shadcn): `components/ui/`. Do not modify these unless necessary for global styling changes.
  - Feature components: `components/`.
- **Utilities**: Common helpers in `lib/utils.ts`.
- **Hooks**: Custom hooks in `hooks/`.

## Development Conventions

### Styling
- Use Tailwind CSS for all styling.
- Use the `cn()` utility from `@/lib/utils` to merge Tailwind classes conditionally.
  ```tsx
  import { cn } from "@/lib/utils"
  // ...
  <div className={cn("base-class", condition && "conditional-class")} />
  ```
- Follow the `new-york` style from Shadcn UI.

### Components
- Prefer Server Components (RSC) by default. Add `"use client"` only when interactivity (state, effects, event listeners) is needed.
- Use `lucide-react` for icons.
- When creating new UI components, follow the pattern of existing Shadcn components (using `cva` for variants if needed).

### Forms & Validation
- Use `react-hook-form` for form handling.
- Use `zod` for schema validation.
- Use `@hookform/resolvers/zod` to integrate Zod with React Hook Form.
- Define schemas in a separate file or co-located with the form component if small.

### Data Fetching & State
- Fetch data in Server Components where possible.
- Use Server Actions for mutations.

### Key Files
- `components.json`: Shadcn UI configuration.
- `lib/utils.ts`: Contains the `cn` helper.
- `app/globals.css`: Global styles and Tailwind directives.

## Commands
- **Dev Server**: `pnpm dev`
- **Build**: `pnpm build`
- **Lint**: `pnpm lint`
- **Add Shadcn Component**: `pnpm dlx shadcn@latest add [component-name]`

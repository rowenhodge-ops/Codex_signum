# VS Code Configuration for Kore

This folder contains workspace-specific settings, tasks, and prompt files to improve code quality, consistency, and debugging workflows.

## 📁 Contents

### Configuration Files

- **`settings.json`** - Workspace settings for formatting, TypeScript, and extensions
- **`launch.json`** - Debugging configurations for Next.js and Genkit
- **`tasks.json`** - Common development tasks (build, test, clean cache)

### Prompt Files (`prompts/`)

These are structured guides for AI-assisted development:

- **`planning.md`** - Feature planning checklist and architecture decisions
- **`debugging.md`** - Systematic debugging workflow (prevents going in circles)
- **`code-review.md`** - Pre-commit quality checklist
- **`ui-consistency.md`** - Design system reference and component patterns

### Documentation

- **`extensions.md`** - Recommended VS Code extensions with installation commands

## 🚀 Quick Start

### 1. Install Recommended Extensions

Open Command Palette (`Ctrl+Shift+P`) and run:

```
Extensions: Show Recommended Extensions
```

Or install via terminal:

```powershell
code --install-extension esbenp.prettier-vscode
code --install-extension dbaeumer.vscode-eslint
code --install-extension bradlc.vscode-tailwindcss
code --install-extension usernamehw.errorlens
```

See `extensions.md` for complete list.

### 2. Reload VS Code

After installing extensions:

```
Ctrl+Shift+P → "Developer: Reload Window"
```

### 3. Verify Setup

- Open any `.tsx` file and save (`Ctrl+S`) - should auto-format with Prettier
- Type errors should appear inline (Error Lens)
- Tailwind classes should autocomplete

## 🛠️ Available Tasks

Run tasks via `Ctrl+Shift+P` → "Tasks: Run Task":

| Task                     | Command                    | Description                          |
| ------------------------ | -------------------------- | ------------------------------------ |
| **Dev Server**           | `npm run dev`              | Start Next.js dev server (port 9002) |
| **Genkit Dev UI**        | `npm run genkit:dev`       | Test AI flows in Genkit UI           |
| **Type Check**           | `npm run typecheck`        | Verify TypeScript types              |
| **Build**                | `npm run build`            | Production build                     |
| **Lint**                 | `npm run lint`             | Run ESLint                           |
| **Clean Next.js Cache**  | Delete `.next` folder      | Fix cache issues                     |
| **Full Clean & Restart** | Clean + restart dev server | Nuclear option                       |

**Default build task**: `Ctrl+Shift+B` runs Dev Server

## 🐛 Debugging

### Debug Configurations (F5)

1. **Next.js: Debug Server** - Debug server-side code
2. **Next.js: Debug Client** - Debug browser/React code
3. **Next.js: Debug Full Stack** - Debug both simultaneously
4. **Genkit Dev UI** - Debug AI flows

### Breakpoints

- Set breakpoints in `.ts` or `.tsx` files
- Press `F5` to start debugging
- Use Debug Console to inspect variables

### Common Debugging Scenarios

#### React Component Errors

1. Open Debug Console (`Ctrl+Shift+Y`)
2. Check React DevTools (browser extension)
3. Use Error Lens to see inline errors
4. Reference `prompts/debugging.md` for systematic approach

#### Server Action Errors

1. Check terminal output (server logs)
2. Use `console.log` in server actions
3. Verify Firestore rules if permission errors

#### TypeScript Errors

1. Run `npm run typecheck` to see all errors
2. Fix from bottom to top (dependencies first)
3. Restart TS Server: `Ctrl+Shift+P` → "TypeScript: Restart TS Server"

## 📋 Using Prompt Files

### When Starting a New Feature

1. Read `prompts/planning.md`
2. Fill out the checklist sections
3. Share with AI assistant: `@prompts/planning.md I want to add [feature]`

### When Debugging Issues

1. Open `prompts/debugging.md`
2. Follow the step-by-step framework
3. If stuck >15 minutes, start fresh chat with different AI model
4. Provide full context: error messages, file contents, stack traces

### Before Committing Code

1. Review `prompts/code-review.md`
2. Check all quality checklist items
3. Run: `npm run typecheck` and `npm run lint`
4. Verify UI matches design system (`prompts/ui-consistency.md`)

## 🎨 Design System

### Quick Reference

Import design tokens in your components:

```typescript
import { COLORS, SPACING, TYPOGRAPHY } from '@/styles/design-tokens';

// Use in className
<h1 className={TYPOGRAPHY.pageTitle}>Title</h1>
<div className={`p-${SPACING.card} ${COLOR_CLASSES.cardBg}`}>
  Content
</div>
```

### Color Palette

- Primary: `#90AFC5` (soft-blue) - headers, links, primary actions
- Background: `#F0F4F8` (light-gray) - page background
- Accent: `#A2BCA2` (muted-green) - success states, positive metrics

### Fonts

- **Belleza**: Headers and titles
- **Alegreya**: Body text

### Spacing

Use multiples of 4: `p-2` (8px), `p-4` (16px), `p-6` (24px), `p-8` (32px)

See `prompts/ui-consistency.md` for complete design system guide.

## 🔧 Troubleshooting

### Prettier Not Working

- Check `.prettierrc` exists in project root
- Verify "Format On Save" enabled: `Ctrl+,` → search "format on save"
- Check default formatter: `Ctrl+,` → search "default formatter"

### TypeScript Errors Not Showing

- Run: `npm run typecheck`
- Restart TS Server: `Ctrl+Shift+P` → "TypeScript: Restart TS Server"
- Check TypeScript version: Should use workspace version

### Port Already in Use

```powershell
# Find process using port 9002
netstat -ano | findstr :9002

# Kill process (replace PID)
taskkill /PID <PID> /F
```

### Dev Server Won't Start

1. Clear cache: Run "Clean Next.js Cache" task
2. Reinstall: Run "Reinstall Dependencies" task
3. Check for syntax errors: `npm run typecheck`

## 📚 Additional Resources

- [Next.js Documentation](https://nextjs.org/docs)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [Tailwind CSS Docs](https://tailwindcss.com/docs)
- [Genkit Documentation](https://firebase.google.com/docs/genkit)
- [Shadcn/ui Components](https://ui.shadcn.com/)

## 💡 Tips

1. **Use Error Lens**: Catch issues immediately as you type
2. **Run Type Check Often**: `Ctrl+Shift+P` → "Tasks: Run Task" → "Type Check"
3. **Reference Prompts**: Use `@prompts/` in AI chats for context
4. **Consistent Styling**: Always check `ui-consistency.md` before creating new components
5. **Debug Systematically**: Follow `debugging.md` framework to avoid wasting time

## 🤝 Contributing

When adding new configurations:

1. Update this README
2. Document in relevant prompt file
3. Test with clean workspace
4. Commit with descriptive message

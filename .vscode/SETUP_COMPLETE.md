# VS Code Setup Complete! 🎉

## What Was Configured

### ✅ Prompt Files (`.vscode/prompts/`)

Structured guides for AI-assisted development:

1. **`planning.md`** - Feature planning checklist

   - Requirements analysis
   - Technical design breakdown
   - Implementation steps
   - Quality checks & testing strategy

2. **`debugging.md`** - Systematic debugging framework

   - Step-by-step error resolution
   - Common Next.js/React issues & fixes
   - When to escalate to different AI models
   - Debugging tools reference

3. **`code-review.md`** - Pre-commit quality checklist

   - TypeScript, React, performance checks
   - UI consistency validation
   - Accessibility & security
   - Project-specific checks

4. **`ui-consistency.md`** - Design system reference

   - Color palette & typography rules
   - Spacing system (multiples of 4)
   - Component patterns & examples
   - Chart styling guidelines

5. **`workflow.md`** - Regression prevention & best practices
   - Pre-commit workflow
   - Testing checklist
   - High-quality debugging workflow
   - Using multiple AI models effectively

### ✅ Configuration Files

1. **`.vscode/settings.json`** - Workspace settings

   - Format on save with Prettier
   - Auto-organize imports
   - TypeScript strict mode
   - Error visibility enhancements
   - Tailwind IntelliSense config

2. **`.vscode/launch.json`** - Debugging configs

   - Next.js: Debug Server
   - Next.js: Debug Client
   - Next.js: Debug Full Stack
   - Genkit Dev UI debugging

3. **`.vscode/tasks.json`** - Common tasks

   - Dev Server (`Ctrl+Shift+B`)
   - Genkit Dev UI
   - Type Check
   - Build, Lint, Clean Cache

4. **`.prettierrc`** - Code formatting rules

   - Single quotes, semicolons
   - 120 character line width
   - Tab width: 2 spaces

5. **`.eslintrc.json`** - Linting rules

   - Strict TypeScript (no `any`)
   - React best practices
   - Console.log warnings

6. **`.vscode/extensions.json`** - Recommended extensions
   - Auto-prompts to install when opening workspace

### ✅ Design System Files

1. **`src/styles/design-tokens.ts`** - Centralized UI constants
   - Color palette & classes
   - Typography tokens
   - Spacing scale
   - Grid layouts
   - Component patterns
   - Chart colors

## Next Steps

### 1. Install Recommended Extensions

VS Code should prompt you automatically. If not:

**Option A**: Via Command Palette

1. Press `Ctrl+Shift+P`
2. Type "Extensions: Show Recommended Extensions"
3. Click "Install All"

**Option B**: Via Terminal

```powershell
code --install-extension esbenp.prettier-vscode
code --install-extension dbaeumer.vscode-eslint
code --install-extension bradlc.vscode-tailwindcss
code --install-extension usernamehw.errorlens
code --install-extension yoavbls.pretty-ts-errors
code --install-extension eamodio.gitlens
code --install-extension naumovs.color-highlight
code --install-extension formulahendry.auto-rename-tag
code --install-extension christian-kohler.path-intellisense
code --install-extension wix.vscode-import-cost
```

### 2. Reload VS Code

```
Ctrl+Shift+P → "Developer: Reload Window"
```

### 3. Verify Setup

**Test Auto-Formatting:**

1. Open any `.tsx` file
2. Make some formatting changes (add extra spaces)
3. Save (`Ctrl+S`)
4. Should auto-format with Prettier ✅

**Test Error Visibility:**

1. Add an intentional TypeScript error
2. Should see red inline error (Error Lens) ✅

**Test Tailwind IntelliSense:**

1. In a className, type `bg-`
2. Should see autocomplete suggestions ✅

### 4. Run Type Check

```powershell
npm run typecheck
```

If errors appear, fix them before continuing development.

## How to Use This Setup

### When Starting a New Feature

1. **Plan First** 📋

   ```
   Open: .vscode/prompts/planning.md
   Read: Feature planning checklist
   Share with AI: "@planning.md I want to add [feature]"
   ```

2. **Code with Consistency** 🎨

   ```typescript
   // Import design tokens
   import { TYPOGRAPHY, SPACING, COLOR_CLASSES } from '@/styles/design-tokens';

   // Use in components
   <h1 className={TYPOGRAPHY.pageTitle}>Title</h1>;
   ```

3. **Test Thoroughly** ✅
   ```
   Check: .vscode/prompts/code-review.md
   Run: npm run typecheck
   Run: npm run lint
   Verify: UI matches design system
   ```

### When Debugging Issues

1. **Follow Framework** 🔍

   ```
   Open: .vscode/prompts/debugging.md
   Follow: Step-by-step process
   Time limit: 15 minutes per approach
   ```

2. **If Stuck, Escalate** 🆘

   ```
   - STOP if going in circles >15 min
   - Start fresh chat with different AI
   - Provide full context (error + code + attempts)
   - Ask for root cause, not quick fixes
   ```

3. **Use Right AI Model** 🤖
   ```
   TypeScript issues → Claude Sonnet 4.5
   React debugging → GPT-4 Turbo
   Quick fixes → GitHub Copilot
   ```

### Before Every Commit

1. **Quality Gates** ✅

   ```powershell
   npm run typecheck  # Must pass
   npm run lint       # No warnings
   npm run build      # Must succeed
   ```

2. **Code Review Checklist** 📝

   ```
   Check: .vscode/prompts/code-review.md
   Verify: All items checked
   Document: Changes made
   ```

3. **Test Multi-Sensor** 🌐
   ```
   Test with: Back Deck (171509)
   Test with: Dining (173264)
   Test with: Office (171637)
   Verify: Real-time updates work
   ```

## Keyboard Shortcuts

| Action           | Shortcut       |
| ---------------- | -------------- |
| Command Palette  | `Ctrl+Shift+P` |
| Quick Open       | `Ctrl+P`       |
| Run Build Task   | `Ctrl+Shift+B` |
| Start Debugging  | `F5`           |
| Toggle Terminal  | `` Ctrl+` ``   |
| Problems Panel   | `Ctrl+Shift+M` |
| Format Document  | `Shift+Alt+F`  |
| Go to Definition | `F12`          |
| Find References  | `Shift+F12`    |
| Rename Symbol    | `F2`           |

## Common Tasks

### Run Dev Server

```powershell
Ctrl+Shift+B → "Dev Server"
# Or: npm run dev
```

### Debug Application

```powershell
F5 → Select "Next.js: Debug Full Stack"
```

### Test AI Flows

```powershell
Ctrl+Shift+P → "Tasks: Run Task" → "Genkit Dev UI"
# Or: npm run genkit:dev
```

### Fix Errors

```powershell
# See all errors
Ctrl+Shift+M

# Type check
npm run typecheck

# Lint
npm run lint
```

### Clean & Restart

```powershell
Ctrl+Shift+P → "Tasks: Run Task" → "Full Clean & Restart"
```

## Design System Quick Reference

### Colors

```typescript
// Headers & primary actions
className = 'text-soft-blue';

// Body text
className = 'text-muted-foreground';

// Success/positive
className = 'text-muted-green';

// Background
className = 'bg-light-gray';
```

### Typography

```typescript
// Page title
className={TYPOGRAPHY.pageTitle}  // 4xl Belleza soft-blue

// Section header
className={TYPOGRAPHY.sectionHeader}  // 2xl Belleza

// Body text
className={TYPOGRAPHY.body}  // base Alegreya muted

// Metric display
className={TYPOGRAPHY.metric}  // 3xl bold tabular
```

### Spacing

```typescript
// Card padding
className = 'p-6'; // 24px

// Content spacing
className = 'space-y-4'; // 16px vertical

// Grid gaps
className = 'gap-6'; // 24px

// Section margins
className = 'mb-8'; // 32px
```

### Responsive Grid

```typescript
// Three columns
className={GRID_LAYOUTS.threeColumn}
// → grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6
```

## Troubleshooting

### Extensions Not Working

```powershell
# Reload window
Ctrl+Shift+P → "Developer: Reload Window"

# Check extensions installed
Ctrl+Shift+X

# Reinstall if needed
```

### Prettier Not Formatting

```powershell
# Check default formatter
Ctrl+, → search "default formatter"
# Should be: Prettier - Code formatter

# Check format on save
Ctrl+, → search "format on save"
# Should be: checked ✅
```

### TypeScript Errors Not Showing

```powershell
# Restart TypeScript server
Ctrl+Shift+P → "TypeScript: Restart TS Server"

# Check TypeScript version
Ctrl+Shift+P → "TypeScript: Select TypeScript Version"
# Select: Use Workspace Version
```

### Dev Server Won't Start

```powershell
# Clear Next.js cache
Remove-Item -Recurse -Force .next

# Or use task
Ctrl+Shift+P → "Tasks: Run Task" → "Clean Next.js Cache"

# Restart dev server
npm run dev
```

## Additional Resources

### Documentation Files

- `.vscode/README.md` - Complete VS Code setup guide
- `.vscode/extensions.md` - Extension details & installation
- `.vscode/prompts/*.md` - All prompt files

### Design System

- `src/styles/design-tokens.ts` - Centralized UI constants
- `.vscode/prompts/ui-consistency.md` - Design system guide

### Project Docs

- `docs/advanced-analytics-guide.md` - SPC implementation
- `docs/sensor-locations.md` - Multi-sensor setup
- `.github/copilot-instructions.md` - Project overview

## Success Metrics

✅ **You're set up correctly if:**

- Code auto-formats on save
- Errors appear inline as you type
- Tailwind classes autocomplete
- TypeScript provides helpful suggestions
- `npm run typecheck` passes
- `npm run build` succeeds

🎯 **Improved workflow:**

- Fewer bugs (Error Lens catches early)
- Consistent code style (Prettier)
- Faster debugging (systematic process)
- Better UI consistency (design tokens)
- Prevented regressions (quality gates)

## Getting Help

1. **VS Code Issues**: Check `.vscode/README.md`
2. **Debugging Help**: Follow `.vscode/prompts/debugging.md`
3. **Design Questions**: Reference `.vscode/prompts/ui-consistency.md`
4. **Workflow Questions**: Check `.vscode/prompts/workflow.md`

## What Changed

Before:

- ❌ Manual formatting (inconsistent)
- ❌ Errors discovered late
- ❌ Debugging in circles
- ❌ Inconsistent UI
- ❌ Frequent regressions

After:

- ✅ Auto-formatting on save
- ✅ Instant error feedback
- ✅ Systematic debugging process
- ✅ Design system enforced
- ✅ Quality gates prevent regressions

---

**Ready to code!** 🚀

Open any file and start coding. VS Code will guide you with:

- Inline errors (Error Lens)
- Auto-formatting (Prettier)
- Type hints (TypeScript)
- Tailwind autocomplete
- Design token suggestions

Happy coding! 🎨✨

# VS Code Extensions for Kore

## Essential Extensions (Install These First)

### Code Quality & Formatting

- **Prettier - Code formatter** (`esbenp.prettier-vscode`)
  - Auto-formats code on save
  - Ensures consistent style across team
- **ESLint** (`dbaeumer.vscode-eslint`)
  - Catches errors and enforces code quality rules
  - Works with TypeScript and React

### TypeScript & React

- **TypeScript Vue Plugin (Volar)** (`Vue.vscode-typescript-vue-plugin`)
  - Better TypeScript IntelliSense
- **Pretty TypeScript Errors** (`yoavbls.pretty-ts-errors`)
  - Makes TypeScript errors easier to read

### Tailwind CSS

- **Tailwind CSS IntelliSense** (`bradlc.vscode-tailwindcss`)
  - Autocomplete for Tailwind classes
  - Shows color previews
  - Linting for invalid classes

### Git & Version Control

- **GitLens** (`eamodio.gitlens`)
  - Enhanced Git features
  - Inline blame annotations
  - Commit history visualization

### Debugging & Error Handling

- **Error Lens** (`usernamehw.errorlens`)
  - Shows errors inline in editor (CRITICAL for catching issues early)
  - Highlights problems immediately
- **Console Ninja** (`WallabyJs.console-ninja`)
  - Better console.log debugging
  - Shows values inline

### AI & Productivity

- **GitHub Copilot** (`GitHub.copilot`)
  - Already installed, ensure enabled
- **GitHub Copilot Chat** (`GitHub.copilot-chat`)
  - Chat interface for debugging

### UI/UX Development

- **Color Highlight** (`naumovs.color-highlight`)
  - Highlights color values in code
- **Auto Rename Tag** (`formulahendry.auto-rename-tag`)
  - Automatically renames paired HTML/JSX tags

### Markdown & Documentation

- **Markdown All in One** (`yzhang.markdown-all-in-one`)
  - Better markdown editing
  - Table of contents generation
- **markdownlint** (`DavidAnson.vscode-markdownlint`)
  - Linting for markdown files

### Testing & Quality

- **Import Cost** (`wix.vscode-import-cost`)
  - Shows bundle size impact of imports
- **Path Intellisense** (`christian-kohler.path-intellisense`)
  - Autocompletes file paths

## Optional (Nice to Have)

### Themes & Icons

- **Material Icon Theme** (`PKief.material-icon-theme`)
  - Better file icons in explorer
- **GitHub Theme** (`GitHub.github-vscode-theme`)
  - Clean, professional theme

### Advanced Debugging

- **Debugger for Chrome** (Built-in to VS Code)
  - Already configured in launch.json

### Database

- **Firebase** (`toba.vsfire`)
  - Firestore schema validation
  - Security rules syntax highlighting

## Installation Commands

Run these in VS Code terminal or Command Palette:

```bash
# Install all essential extensions at once
code --install-extension esbenp.prettier-vscode
code --install-extension dbaeumer.vscode-eslint
code --install-extension bradlc.vscode-tailwindcss
code --install-extension eamodio.gitlens
code --install-extension usernamehw.errorlens
code --install-extension yoavbls.pretty-ts-errors
code --install-extension naumovs.color-highlight
code --install-extension formulahendry.auto-rename-tag
code --install-extension yzhang.markdown-all-in-one
code --install-extension DavidAnson.vscode-markdownlint
code --install-extension wix.vscode-import-cost
code --install-extension christian-kohler.path-intellisense
```

## After Installation

1. **Reload VS Code**: Press `Ctrl+Shift+P` → "Developer: Reload Window"
2. **Configure Prettier**: Already set as default formatter in `.vscode/settings.json`
3. **Enable Error Lens**: It will show errors inline immediately
4. **Check Tailwind IntelliSense**: Should now autocomplete classes

## Troubleshooting

### Prettier Not Formatting

- Check `.prettierrc` exists in project root
- Verify "Format On Save" is enabled: `Ctrl+,` → search "format on save"
- Check default formatter: `Ctrl+,` → search "default formatter" → should be "Prettier"

### ESLint Not Working

- Run: `npm install` to ensure dependencies are installed
- Check `.eslintrc.json` exists
- Restart ESLint server: `Ctrl+Shift+P` → "ESLint: Restart ESLint Server"

### Tailwind IntelliSense Not Working

- Check `tailwind.config.ts` exists
- Verify content paths include your files
- Restart VS Code

### TypeScript Errors Not Showing

- Check TypeScript version: `Ctrl+Shift+P` → "TypeScript: Select TypeScript Version" → Use workspace version
- Run: `npm run typecheck` to see all errors in terminal

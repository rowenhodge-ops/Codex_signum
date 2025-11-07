# Planning Mode Setup - Complete Guide

## ✅ Installation Complete!

I've set up multiple ways for you to access **Planning Mode** and other specialized AI prompts in VS Code.

---

## 🎯 How to Use Planning Mode

### **Method 1: Using Hashtags in Copilot Chat** (Recommended)

Simply type these hashtags in GitHub Copilot Chat:

- **`#plan`** → Feature planning and architecture
- **`#debug`** → Systematic debugging workflow
- **`#review`** → Pre-commit code review
- **`#ui`** → UI/design system guidelines
- **`#workflow`** → Best practices

**Example:**

```
#plan I want to add a new analytics component that shows PM2.5 trends over the last 30 days
```

Copilot will automatically load the planning checklist from `.vscode/prompts/planning.md` and guide you through:

1. Requirements analysis
2. Technical design
3. Implementation steps
4. Quality checks
5. Testing strategy

---

### **Method 2: Keyboard Shortcuts** (Fast Access)

| Shortcut                     | Mode   | Description                           |
| ---------------------------- | ------ | ------------------------------------- |
| `Ctrl+Shift+P` then `Ctrl+P` | Plan   | Opens chat with planning prompt       |
| `Ctrl+Shift+P` then `Ctrl+D` | Debug  | Opens chat with debugging framework   |
| `Ctrl+Shift+P` then `Ctrl+R` | Review | Opens chat with code review checklist |
| `Ctrl+Shift+P` then `Ctrl+U` | UI     | Opens chat with design system guide   |

**How to use:**

1. Press `Ctrl+Shift+P` (Command Palette)
2. Immediately press the second key (e.g., `Ctrl+P` for Plan mode)
3. Copilot Chat opens with the planning prompt loaded

---

### **Method 3: Direct File Access**

You can also open the prompt files directly:

- `.vscode/prompts/planning.md` - Feature planning checklist
- `.vscode/prompts/debugging.md` - Debugging framework
- `.vscode/prompts/code-review.md` - Code review checklist
- `.vscode/prompts/ui-consistency.md` - Design system guide
- `.vscode/prompts/workflow.md` - Best practices

Copy the relevant sections and paste them into your Copilot Chat.

---

## 📋 What Each Mode Does

### **#plan - Planning Mode**

Perfect for:

- Planning new features
- Designing new applications
- Breaking down complex work into steps
- Architecture decisions

**What you get:**

- Requirements analysis checklist
- Technical design breakdown
- Implementation step-by-step plan
- Quality assurance checklist
- Testing strategy

### **#debug - Debug Mode**

Perfect for:

- Troubleshooting errors
- Systematic problem solving
- Root cause analysis
- Preventing circular debugging

**What you get:**

- Error collection framework
- Context analysis questions
- Binary search isolation technique
- Common Next.js/React issues & solutions

### **#review - Review Mode**

Perfect for:

- Pre-commit checks
- Code quality validation
- Consistency verification
- Security & accessibility review

**What you get:**

- TypeScript strict mode checks
- React best practices
- Performance optimization tips
- Project-specific validation

### **#ui - UI Mode**

Perfect for:

- Component development
- Design consistency
- Styling decisions
- Responsive layouts

**What you get:**

- Color palette & typography rules
- Spacing system guidelines
- Component pattern examples
- Chart styling conventions

---

## 🔧 Technical Details

### Files Created/Modified:

1. **`.vscode/copilot-prompts.json`** - Defines custom prompt modes
2. **`.vscode/keybindings.json`** - Keyboard shortcuts for each mode
3. **`.vscode/settings.json`** - Enabled custom instructions
4. **`.github/copilot-instructions.md`** - Updated with hashtag shortcuts

### How It Works:

1. When you type `#plan` in Copilot Chat, the global instructions (`.github/copilot-instructions.md`) detect the hashtag
2. Copilot is instructed to read the corresponding file from `.vscode/prompts/`
3. The planning checklist is loaded into the conversation context
4. Copilot guides you through the structured planning process

---

## 💡 Example Usage

### Planning a New Feature:

**You type:**

```
#plan Add a weather overlay to the analytics charts that shows temperature
and wind speed correlated with PM2.5 levels
```

**Copilot will respond with:**

```
Let's plan this feature using the planning checklist:

### 1. Requirements Analysis
- User need: Correlate weather conditions with air quality data
- Sensor locations: All 3 locations (Back Deck, Dining, Office)
- Data sources: Weather API + existing AirGradient data
- Dependencies: Need weather API integration

### 2. Technical Design
Affected layers:
✓ UI Components - New WeatherOverlay component
✓ Server Actions - Fetch weather data
✓ Types - Add WeatherData interface
✓ Analytics - Update chart components

[... continues with full planning checklist ...]
```

---

## 🎨 Customization

### Want to modify a prompt?

1. Open `.vscode/prompts/planning.md` (or any other prompt file)
2. Edit the checklist to match your workflow
3. Save the file
4. The next time you use `#plan`, your changes will be loaded

### Want to add a new mode?

1. Create a new file in `.vscode/prompts/` (e.g., `testing.md`)
2. Add the hashtag shortcut to `.github/copilot-instructions.md`:
   ```markdown
   - **#test** → Load `.vscode/prompts/testing.md` - Testing strategies
   ```
3. Optionally add a keyboard shortcut in `.vscode/keybindings.json`

---

## 🚀 Next Steps

1. **Try it now**: Open Copilot Chat and type `#plan test message`
2. **Reload VS Code** if hashtags don't work immediately (may need restart)
3. **Customize prompts** to match your specific workflow

---

## ❓ Troubleshooting

**Hashtags not working?**

- Restart VS Code (`Ctrl+Shift+P` → "Reload Window")
- Make sure GitHub Copilot Chat extension is updated
- Check that `.github/copilot-instructions.md` exists

**Keyboard shortcuts not working?**

- Check if keybindings are conflicting: `Ctrl+K Ctrl+S` to open keybindings
- You can reassign shortcuts in `.vscode/keybindings.json`

**Want to use different hashtags?**

- Edit `.github/copilot-instructions.md` and change the hashtag names
- Example: Change `#plan` to `#architect` or `#design`

---

## 📚 Related Documentation

- `.vscode/prompts/MAINTENANCE.md` - How to update prompt files
- `.vscode/README.md` - Complete VS Code setup guide
- `.vscode/SETUP_COMPLETE.md` - Quick start guide

---

## 🎉 You're Ready!

Try starting a new chat with:

```
#plan I want to build a new feature
```

Copilot will guide you through the entire planning process!

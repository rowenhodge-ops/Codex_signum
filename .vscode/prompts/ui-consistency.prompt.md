# UI Consistency Guide

## Design System Reference

### Design Philosophy

Kore uses a **black background with modern, minimal Perplexity-inspired aesthetic**. The design emphasizes:
- Clean, distraction-free interface
- High contrast for readability
- Subtle animations and interactions
- Component-based architecture with Shadcn/ui

### Color Palette

**Base Colors:**
- Background: Black or very dark gray
- Text: White or light gray for high contrast
- Accent: Subtle colors for interactive elements
- Borders: Dark gray for subtle separation

**Usage Rules:**
- Use Shadcn/ui's default dark theme variants
- High contrast for text readability
- Subtle borders to define component boundaries
- Minimal color accents to draw attention

### Typography

Kore uses system fonts and Tailwind's default typography scale:

```css
/* Scale */
- Hero/Page Title: text-4xl (36px)
- Section Header: text-2xl (24px)
- Card Title: text-xl (20px)
- Body: text-base (16px)
- Small/Metadata: text-sm (14px)
- Micro/Labels: text-xs (12px)
```

**Usage Rules:**
- Page headers: `className="text-4xl font-bold"`
- Section headers: `className="text-2xl font-semibold"`
- Body text: `className="text-base"`
- Use `font-mono` for code snippets and technical content

### Spacing System
**Rule**: Use multiples of 4 (Tailwind default)

```css
/* Spacing Scale */
gap-2 / space-y-2 / p-2 = 8px   // Tight (within cards)
gap-4 / space-y-4 / p-4 = 16px  // Default (most common)
gap-6 / space-y-6 / p-6 = 24px  // Comfortable (between sections)
gap-8 / space-y-8 / p-8 = 32px  // Loose (major sections)
```

**Common Patterns:**
- Card padding: `p-6`
- Card content spacing: `space-y-4`
- Grid gaps: `gap-6`
- Section margins: `mb-8`
- Form field spacing: `space-y-4`

### Component Patterns

#### Card Layout
```tsx
<Card>
  <CardHeader>
    <CardTitle className="text-2xl font-semibold">
      Section Title
    </CardTitle>
    <CardDescription>
      Optional description
    </CardDescription>
  </CardHeader>
  <CardContent className="space-y-4">
    {/* Content with consistent 16px spacing */}
  </CardContent>
</Card>
```

#### Button Hierarchy
```tsx
// Primary action
<Button variant="default">
  Primary Action
</Button>

// Secondary action
<Button variant="outline">
  Secondary Action
</Button>

// Tertiary/subtle
<Button variant="ghost">
  Tertiary Action
</Button>

// Destructive
<Button variant="destructive">
  Delete
</Button>
```

#### Status Indicators
```tsx
// Success/Normal
<Badge variant="default">
  Active
</Badge>

// Warning
<Badge variant="secondary">
  Pending
</Badge>

// Error/Alert
<Badge variant="destructive">
  Error
</Badge>
```

### Layout Consistency

#### Page Structure
```tsx
<div className="container mx-auto p-6 space-y-8">
  {/* Page Header */}
  <div className="mb-8">
    <h1 className="text-4xl font-bold mb-2">
      Page Title
    </h1>
    <p className="text-lg text-muted-foreground">
      Page description
    </p>
  </div>

  {/* Filters/Controls */}
  <div className="flex flex-wrap gap-4 items-center">
    {/* Selects, buttons */}
  </div>

  {/* Main Content Grid */}
  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
    {/* Cards */}
  </div>
</div>
```

#### Responsive Breakpoints
```tsx
// Mobile-first approach
<div className="
  grid 
  grid-cols-1       // 1 column on mobile
  md:grid-cols-2    // 2 columns on tablet (768px+)
  lg:grid-cols-3    // 3 columns on desktop (1024px+)
  gap-4 md:gap-6    // Smaller gaps on mobile
">
```


## Component Customization Best Practices

### Consistent Loading States
```tsx
// Skeleton pattern
{loading ? (
  <Card className="p-6">
    <Skeleton className="h-8 w-48 mb-4" />  {/* Title */}
    <Skeleton className="h-64 w-full" />     {/* Content */}
  </Card>
) : (
  <ActualComponent />
)}
```

### Consistent Empty States
```tsx
{data.length === 0 ? (
  <Card className="p-12 text-center">
    <p className="text-muted-foreground">
      No data available
    </p>
    <Button variant="outline" className="mt-4" onClick={handleRetry}>
      Refresh Data
    </Button>
  </Card>
) : (
  <DataDisplay />
)}
```

## Icons

Use **Lucide React** for all icons:

```tsx
import { Icon } from 'lucide-react';

<Icon className="h-4 w-4" />  // Standard size
<Icon className="h-6 w-6" />  // Larger size
```

Common icons:
- Navigation: `ChevronRight`, `ArrowLeft`, `Menu`
- Actions: `Plus`, `Edit`, `Trash2`, `Save`
- Status: `Check`, `X`, `AlertCircle`, `Info`
- Content: `FileText`, `MessageSquare`, `Share2`

## Quality Checklist

Before committing UI changes:
- [ ] Black background with high contrast
- [ ] Typography follows Tailwind scale
- [ ] Spacing is multiples of 4 (4, 8, 16, 24, 32)
- [ ] Cards have consistent padding (`p-6`)
- [ ] Responsive on mobile/tablet/desktop
- [ ] Loading and empty states handled
- [ ] Shadcn/ui components used (no custom primitives)
- [ ] No inline styles (use Tailwind classes)
- [ ] Lucide React icons used
- [ ] Matches existing page layouts
- [ ] Uses `cn()` utility for conditional classes

## Anti-Patterns

❌ **DON'T:**
- Use random custom colors without justification
- Mix font families inconsistently
- Use odd spacing: `mt-3`, `gap-5`, `p-7`
- Create custom buttons/inputs (use Shadcn)
- Hardcode dimensions: `w-[347px]`
- Use inline styles: `style={{ color: 'blue' }}`

✅ **DO:**
- Use Shadcn/ui default theme variants
- Consistent system fonts
- Standard spacing: `mt-4`, `gap-6`, `p-8`
- Shadcn components: `<Button>`, `<Input>`, `<Card>`
- Responsive widths: `w-full`, `max-w-md`
- Tailwind classes: `className="..."`
- Use `cn()` for conditional styling

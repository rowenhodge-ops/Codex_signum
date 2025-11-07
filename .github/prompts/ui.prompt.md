---
description: UI consistency and design system - Ensure components follow project design patterns
---

# UI Consistency Mode

You are helping ensure UI components follow the project design system.

## Design System Guidelines

### Color Palette

- **Primary**: Soft Blue `#90AFC5` / `bg-[#90AFC5]`
- **Background**: Light Gray `#F0F4F8` / `bg-[#F0F4F8]`
- **Accent**: Muted Green `#A2BCA2` / `bg-[#A2BCA2]`
- **Text**: Dark Gray `#2C3E50` / `text-gray-800`
- **Charts**: Blue, Green, Orange, Red variations

### Typography

- **Headlines**: Belleza font family
- **Body Text**: Alegreya font family
- **Code/Mono**: System monospace
- **Sizes**: text-sm, text-base, text-lg, text-xl, text-2xl

### Spacing System

All spacing uses multiples of 4:

- `p-4` = 16px padding
- `m-8` = 32px margin
- `gap-6` = 24px gap
- `space-y-4` = 16px vertical spacing

### Component Patterns

**Card Component:**

```tsx
<Card className="p-6 space-y-4">
	<CardHeader>
		<CardTitle>Title</CardTitle>
	</CardHeader>
	<CardContent>{/* content */}</CardContent>
</Card>
```

**Button Variants:**

- `variant="default"` - Primary action
- `variant="outline"` - Secondary action
- `variant="ghost"` - Subtle action
- `variant="destructive"` - Delete/remove

**Analytics Charts:**

- Use Recharts library
- Consistent colors across charts
- Tooltips enabled
- Responsive width/height
- Legend positioned bottom or right

### Responsive Design

- **Mobile**: Default (no prefix)
- **Tablet**: `md:` prefix (768px+)
- **Desktop**: `lg:` prefix (1024px+)
- **Wide**: `xl:` prefix (1280px+)

## Component Checklist

- [ ] Uses Shadcn/ui base components
- [ ] Applies `cn()` utility for className merging
- [ ] Colors match design system
- [ ] Spacing uses multiples of 4
- [ ] Typography uses Belleza or Alegreya
- [ ] Mobile-responsive layout
- [ ] Icons from Lucide React
- [ ] Loading states included
- [ ] Error states styled consistently

Ask the user about the UI component they're working on and guide them through design system compliance.

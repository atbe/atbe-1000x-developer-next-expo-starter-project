# UI Components Summary

This document provides an overview of the reusable UI components available in the `@ui` directory. These components are designed for use in Next.js (Pages Router) and Expo React projects, and are built with accessibility, composability, and modern design in mind.

---

## Component List

### 1. **Dropdown Menu**
- **Components:** `DropdownMenu`, `DropdownMenuTrigger`, `DropdownMenuContent`, `DropdownMenuItem`, `DropdownMenuCheckboxItem`, `DropdownMenuRadioItem`, `DropdownMenuLabel`, `DropdownMenuSeparator`, `DropdownMenuShortcut`, `DropdownMenuGroup`, `DropdownMenuPortal`, `DropdownMenuSub`, `DropdownMenuSubContent`, `DropdownMenuSubTrigger`, `DropdownMenuRadioGroup`
- **Description:** Fully featured dropdown menu system using Radix primitives. Supports groups, submenus, checkboxes, radio items, keyboard shortcuts, and more. Highly customizable and accessible.

### 2. **Input**
- **Component:** `Input`
- **Description:** Styled input field supporting all standard HTML input props. Includes focus, disabled, and file input styles.

### 3. **Label**
- **Component:** `Label`
- **Description:** Accessible label component, compatible with form fields. Supports variants for different visual styles.

### 4. **Popover**
- **Components:** `Popover`, `PopoverTrigger`, `PopoverContent`
- **Description:** Accessible popover/dialog system for overlays, tooltips, or custom dropdowns. Built on Radix primitives.

### 5. **Progress**
- **Component:** `Progress`
- **Description:** Animated progress bar with customizable value and styles. Uses Radix for accessibility.

### 6. **Select**
- **Components:** `Select`, `SelectGroup`, `SelectValue`, `SelectTrigger`, `SelectContent`, `SelectLabel`, `SelectItem`, `SelectSeparator`, `SelectScrollUpButton`, `SelectScrollDownButton`
- **Description:** Custom select/dropdown input with keyboard navigation, grouping, and full accessibility. Built on Radix.

### 7. **Switch**
- **Component:** `Switch`
- **Description:** Accessible toggle switch for boolean values. Styled and animated, built on Radix.

### 8. **Table**
- **Components:** `Table`, `TableHeader`, `TableBody`, `TableFooter`, `TableHead`, `TableRow`, `TableCell`, `TableCaption`
- **Description:** Composable table primitives for building accessible, styled tables with headers, footers, and captions.

### 9. **Toast**
- **Components:** `ToastProvider`, `ToastViewport`, `Toast`, `ToastTitle`, `ToastDescription`, `ToastClose`, `ToastAction`
- **Description:** Toast notification system with support for actions, variants (default, destructive), and accessibility. Built on Radix.

### 10. **Toaster**
- **Component:** `Toaster`
- **Description:** Wrapper for rendering and managing toasts using the above toast primitives and a custom hook.

### 11. **Avatar**
- **Components:** `Avatar`, `AvatarImage`, `AvatarFallback`
- **Description:** User avatar component with image and fallback support. Built on Radix for accessibility.

### 12. **Badge**
- **Component:** `Badge`
- **Description:** Small badge for status, labels, or counts. Supports multiple visual variants.

### 13. **Button**
- **Component:** `Button`
- **Description:** Highly customizable button supporting variants (default, destructive, outline, secondary, ghost, link), sizes, loading state, and asChild rendering.

### 14. **Card**
- **Components:** `Card`, `CardHeader`, `CardFooter`, `CardTitle`, `CardDescription`, `CardContent`
- **Description:** Card layout primitives for building flexible, styled card UIs with headers, footers, and content sections.

### 15. **Collapsible**
- **Components:** `Collapsible`, `CollapsibleTrigger`, `CollapsibleContent`
- **Description:** Expand/collapse primitive for hiding and showing content. Built on Radix for accessibility.

---

## Usage
- All components are functional, idiomatic React components.
- Most are built on top of [Radix UI](https://www.radix-ui.com/) primitives for accessibility and composability.
- Styles are consistent with the design system and support dark mode.
- Import components directly from the `@ui` alias or relative path as needed.

---

## Example Import
```tsx
import { Button, Card, DropdownMenu } from '@ui';
```

---

For detailed props and usage, refer to the source code or component documentation.

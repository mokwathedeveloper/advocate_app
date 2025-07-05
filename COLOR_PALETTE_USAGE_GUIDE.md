# Color Palette Usage Guide - LegalPro v1.0.1

## 🎨 **Professional Color System Overview**

The LegalPro color system is designed to convey trust, professionalism, and accessibility while maintaining visual hierarchy and brand consistency across all touchpoints.

### **Design Principles**
- **Trust & Authority**: Deep blues establish credibility
- **Premium Quality**: Gold accents suggest excellence
- **Accessibility First**: All colors meet WCAG AA standards
- **Semantic Clarity**: Colors have consistent meanings
- **Modern Aesthetic**: Contemporary, clean color relationships

## 🎯 **Color Categories & Usage**

### **1. Primary Brand Colors**

#### **Primary Blue - Professional Trust**
```css
/* Use for: Main actions, primary buttons, links, brand elements */
primary-50: #eff8ff   /* Very light backgrounds, hover states */
primary-100: #dbeafe  /* Light backgrounds, disabled states */
primary-200: #bfdbfe  /* Subtle backgrounds, borders */
primary-300: #93c5fd  /* Disabled text, inactive elements */
primary-400: #60a5fa  /* Secondary actions, icons */
primary-500: #3b82f6  /* Default primary color */
primary-600: #2563eb  /* Primary buttons, active links */
primary-700: #1d4ed8  /* Hover states, pressed buttons */
primary-800: #1e40af  /* Dark primary, headings */
primary-900: #1e3a8a  /* Darkest primary, emphasis */
```

**Usage Examples:**
- Primary buttons: `bg-primary-600 hover:bg-primary-700`
- Links: `text-primary-600 hover:text-primary-700`
- Brand logo: `text-primary-800`
- Focus rings: `ring-primary-500`

#### **Secondary Gold - Premium Accent**
```css
/* Use for: Highlights, success states, premium features, CTAs */
secondary-50: #fffbeb   /* Light backgrounds, subtle highlights */
secondary-100: #fef3c7  /* Success backgrounds */
secondary-200: #fde68a  /* Hover backgrounds */
secondary-300: #fcd34d  /* Disabled gold states */
secondary-400: #fbbf24  /* Text highlights, icons */
secondary-500: #f59e0b  /* Default secondary color */
secondary-600: #d97706  /* Secondary buttons, active states */
secondary-700: #b45309  /* Hover states, pressed buttons */
secondary-800: #92400e  /* Dark secondary */
secondary-900: #78350f  /* Darkest secondary */
```

**Usage Examples:**
- Secondary buttons: `bg-secondary-500 hover:bg-secondary-600`
- Highlights: `text-secondary-600`
- Success indicators: `bg-secondary-100 text-secondary-800`
- Premium badges: `bg-secondary-500 text-white`

### **2. Semantic Colors**

#### **Success Green - Positive Actions**
```css
/* Use for: Success messages, completed states, positive feedback */
success-500: #22c55e   /* Default success color */
success-600: #16a34a   /* Success buttons, confirmations */
success-100: #dcfce7   /* Success backgrounds */
success-800: #166534   /* Dark success text */
```

**Usage Examples:**
- Success messages: `bg-success-100 text-success-800`
- Success buttons: `bg-success-600 hover:bg-success-700`
- Status indicators: `text-success-600`

#### **Error Red - Warnings & Errors**
```css
/* Use for: Error messages, warnings, destructive actions */
error-500: #ef4444     /* Default error color */
error-600: #dc2626     /* Error buttons, alerts */
error-100: #fee2e2     /* Error backgrounds */
error-800: #991b1b     /* Dark error text */
```

**Usage Examples:**
- Error messages: `bg-error-100 text-error-800`
- Delete buttons: `bg-error-600 hover:bg-error-700`
- Form validation: `border-error-500 text-error-600`

#### **Warning Orange - Cautions**
```css
/* Use for: Warning messages, pending states, cautions */
warning-500: #f59e0b   /* Default warning color */
warning-600: #d97706   /* Warning buttons, alerts */
warning-100: #fef3c7   /* Warning backgrounds */
warning-800: #92400e   /* Dark warning text */
```

**Usage Examples:**
- Warning messages: `bg-warning-100 text-warning-800`
- Pending status: `text-warning-600`
- Caution buttons: `bg-warning-500 hover:bg-warning-600`

### **3. Neutral Colors**

#### **Gray Scale - Text & Backgrounds**
```css
/* Use for: Text hierarchy, backgrounds, borders, surfaces */
neutral-50: #f9fafb    /* Lightest backgrounds */
neutral-100: #f3f4f6   /* Light backgrounds, cards */
neutral-200: #e5e7eb   /* Subtle borders, dividers */
neutral-300: #d1d5db   /* Light borders, inactive */
neutral-400: #9ca3af   /* Disabled text, placeholders */
neutral-500: #6b7280   /* Secondary text, captions */
neutral-600: #4b5563   /* Primary text, body copy */
neutral-700: #374151   /* Dark text, headings */
neutral-800: #1f2937   /* Darker text, emphasis */
neutral-900: #111827   /* Darkest text, high emphasis */
```

**Usage Examples:**
- Primary text: `text-neutral-900`
- Secondary text: `text-neutral-600`
- Disabled text: `text-neutral-400`
- Card backgrounds: `bg-neutral-100`
- Borders: `border-neutral-200`

## 🎨 **Component-Specific Usage**

### **Button Components**
```tsx
// Primary Action
<Button variant="primary">   // bg-primary-600 text-white
// Secondary Action  
<Button variant="secondary"> // bg-secondary-500 text-white
// Success Action
<Button variant="success">   // bg-success-600 text-white
// Destructive Action
<Button variant="error">     // bg-error-600 text-white
// Outline Style
<Button variant="outline">   // border-primary-600 text-primary-600
// Ghost Style
<Button variant="ghost">     // text-primary-600 hover:bg-primary-50
```

### **Card Components**
```tsx
// Default Card
<Card variant="default">     // bg-white border-neutral-200
// Elevated Card
<Card variant="elevated">    // bg-white shadow-lg
// Outlined Card
<Card variant="outlined">    // border-2 border-neutral-300
// Filled Card
<Card variant="filled">      // bg-neutral-50
```

### **Input Components**
```tsx
// Default Input
<Input variant="default">    // border-neutral-300 focus:border-primary-500
// Filled Input
<Input variant="filled">     // bg-neutral-100 border-0
// Outlined Input
<Input variant="outlined">   // border-2 border-neutral-300
// Error State
<Input error="message">      // border-error-500 focus:ring-error-500
```

## 🌙 **Dark Mode Implementation**

### **Dark Theme Colors**
```css
/* Dark mode overrides */
.dark {
  --surface-primary: #1f2937;     /* Dark card backgrounds */
  --surface-secondary: #111827;   /* Dark page backgrounds */
  --text-primary: #f9fafb;        /* Light text on dark */
  --text-secondary: #d1d5db;      /* Secondary text on dark */
  --border-default: #374151;      /* Dark borders */
}
```

### **Usage in Components**
```tsx
// Dark mode aware classes
className="bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100"
className="border-neutral-200 dark:border-neutral-700"
className="hover:bg-neutral-100 dark:hover:bg-neutral-700"
```

## 📐 **Spacing & Layout Guidelines**

### **Color Relationships**
- **Adjacent Colors**: Use colors from the same family (e.g., primary-100 with primary-600)
- **Contrast Pairs**: Ensure sufficient contrast (4.5:1 minimum)
- **Hierarchy**: Use color intensity to show importance
- **Consistency**: Same colors for same meanings across the app

### **Background Hierarchies**
```css
/* Page background */
bg-neutral-50

/* Card/surface background */
bg-white dark:bg-neutral-800

/* Elevated surface */
bg-white shadow-lg dark:bg-neutral-800

/* Interactive hover */
hover:bg-neutral-100 dark:hover:bg-neutral-700
```

## ♿ **Accessibility Guidelines**

### **Contrast Requirements**
- **Normal Text**: Minimum 4.5:1 contrast ratio
- **Large Text**: Minimum 3:1 contrast ratio
- **Interactive Elements**: Minimum 3:1 contrast ratio
- **Focus Indicators**: High contrast, clearly visible

### **Color Independence**
- **Never rely on color alone** to convey information
- **Use icons, text, or patterns** alongside color
- **Provide alternative indicators** for color-blind users
- **Test with color blindness simulators**

### **Focus Management**
```css
/* Standard focus ring */
focus:ring-2 focus:ring-primary-500 focus:ring-offset-2

/* Dark mode focus ring */
dark:focus:ring-offset-neutral-800

/* High contrast focus */
focus-visible:ring-2 focus-visible:ring-primary-500
```

## 🎯 **Best Practices**

### **Do's**
✅ Use semantic colors consistently (success = green, error = red)
✅ Maintain color hierarchy (primary > secondary > tertiary)
✅ Test all color combinations for accessibility
✅ Use the same color for the same meaning across components
✅ Provide sufficient contrast for all text
✅ Use neutral colors for most text and backgrounds

### **Don'ts**
❌ Don't use colors outside the defined palette
❌ Don't rely solely on color to convey information
❌ Don't use low contrast color combinations
❌ Don't use too many colors in a single interface
❌ Don't ignore dark mode considerations
❌ Don't forget to test with assistive technologies

## 🔧 **Implementation Examples**

### **Status Indicators**
```tsx
// Success status
<div className="bg-success-100 text-success-800 px-3 py-1 rounded-full">
  <CheckIcon className="w-4 h-4 mr-1" />
  Completed
</div>

// Error status  
<div className="bg-error-100 text-error-800 px-3 py-1 rounded-full">
  <XIcon className="w-4 h-4 mr-1" />
  Failed
</div>

// Warning status
<div className="bg-warning-100 text-warning-800 px-3 py-1 rounded-full">
  <AlertIcon className="w-4 h-4 mr-1" />
  Pending
</div>
```

### **Interactive Elements**
```tsx
// Primary link
<a className="text-primary-600 hover:text-primary-700 underline">
  Learn more
</a>

// Secondary action
<button className="text-secondary-600 hover:text-secondary-700">
  View details
</button>

// Destructive action
<button className="text-error-600 hover:text-error-700">
  Delete item
</button>
```

This comprehensive color system ensures consistency, accessibility, and professional appearance across the entire LegalPro application.

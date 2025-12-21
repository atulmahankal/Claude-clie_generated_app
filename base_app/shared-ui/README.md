# @jam/shared-ui

Shared UI component library for JAM Stack micro-frontends.

## Installation

```bash
npm install @jam/shared-ui
```

## Components

### Button
Versatile button component with multiple variants and sizes.

```tsx
import { Button } from '@jam/shared-ui'

<Button variant="default">Click me</Button>
<Button variant="outline" size="sm">Small button</Button>
```

### Input
Form input component with label and error states.

```tsx
import { Input } from '@jam/shared-ui'

<Input
  label="Email"
  type="email"
  placeholder="Enter your email"
  error="Invalid email"
/>
```

### Card
Composable card component for content grouping.

```tsx
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@jam/shared-ui'

<Card>
  <CardHeader>
    <CardTitle>Card Title</CardTitle>
    <CardDescription>Card description</CardDescription>
  </CardHeader>
  <CardContent>
    Content goes here
  </CardContent>
  <CardFooter>
    Footer content
  </CardFooter>
</Card>
```

### Alert
Alert component with multiple variants for different message types.

```tsx
import { Alert } from '@jam/shared-ui'

<Alert variant="success">Operation successful!</Alert>
<Alert variant="error">An error occurred</Alert>
```

## Utilities

### cn(...inputs)
Merge Tailwind CSS classes intelligently.

```tsx
import { cn } from '@jam/shared-ui'

const className = cn('base-class', condition && 'conditional-class')
```

### formatDate(date)
Format dates to readable strings.

### isValidEmail(email)
Validate email format.

### generatePassword(length)
Generate strong random passwords.

### checkPasswordStrength(password)
Check password strength and get feedback.

## Development

```bash
# Build
npm run build

# Watch mode
npm run dev

# Clean
npm run clean
```

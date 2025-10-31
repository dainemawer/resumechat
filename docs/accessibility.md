# Accessibility Guidelines

## Overview

ResumeChat is committed to WCAG 2.1 Level AA compliance to ensure our platform is accessible to all users, including those with disabilities.

## Core Principles (POUR)

### Perceivable
- Information and UI components must be presentable to users in ways they can perceive

### Operable
- UI components and navigation must be operable by all users

### Understandable
- Information and operation of UI must be understandable

### Robust
- Content must be robust enough for interpretation by various user agents and assistive technologies

## Implementation Standards

### Semantic HTML

```tsx
// ✅ Good
<nav aria-label="Main navigation">
	<ul>
		<li><a href="/dashboard">Dashboard</a></li>
	</ul>
</nav>

// ❌ Bad
<div className="nav">
	<div className="link">Dashboard</div>
</div>
```

### ARIA Labels

```tsx
// Button without visible text
<button aria-label="Close dialog">
	<XIcon />
</button>

// Form inputs
<label htmlFor="email">Email Address</label>
<input 
	id="email" 
	type="email"
	aria-required="true"
	aria-invalid={hasError}
	aria-describedby="email-error"
/>
{hasError && (
	<p id="email-error" role="alert">Please enter a valid email</p>
)}
```

### Keyboard Navigation

All interactive elements must be keyboard accessible:
- Tab navigation
- Enter/Space to activate
- Escape to close modals
- Arrow keys for menus

```tsx
// Keyboard event handling
<div
	role="button"
	tabIndex={0}
	onClick={handleClick}
	onKeyDown={(e) => {
		if (e.key === 'Enter' || e.key === ' ') {
			handleClick();
		}
	}}
>
	Action
</div>
```

### Focus Management

```tsx
// Visible focus indicators
button:focus-visible {
	outline: 2px solid var(--color-primary);
	outline-offset: 2px;
}

// Trap focus in modals
import { useFocusTrap } from '@/hooks/useFocusTrap';

function Modal({ isOpen, onClose }) {
	const modalRef = useFocusTrap(isOpen);
	return <div ref={modalRef}>...</div>;
}
```

### Color Contrast

Minimum contrast ratios (WCAG AA):
- Normal text: 4.5:1
- Large text (18pt+): 3:1
- UI components: 3:1

Tools:
- Chrome DevTools: Lighthouse
- [WebAIM Contrast Checker](https://webaim.org/resources/contrastchecker/)

### Screen Readers

#### Live Regions

```tsx
// Announce chat messages
<div aria-live="polite" aria-atomic="true" className="sr-only">
	{latestMessage}
</div>

// Critical announcements
<div aria-live="assertive" role="alert">
	Your subscription has expired
</div>
```

#### Skip Links

```tsx
// First element in layout
<a href="#main-content" className="skip-link">
	Skip to main content
</a>
```

### Form Accessibility

```tsx
<form>
	<fieldset>
		<legend>Upload Resume</legend>
		
		<label htmlFor="resume-file">
			Choose file (PDF or DOCX, max 5MB)
		</label>
		
		<input
			id="resume-file"
			type="file"
			accept=".pdf,.docx"
			aria-describedby="file-hint"
			required
		/>
		
		<p id="file-hint" className="text-muted">
			Supported formats: PDF, DOCX
		</p>
		
		{error && (
			<p role="alert" className="text-destructive">
				{error}
			</p>
		)}
		
		<button type="submit">
			Upload
		</button>
	</fieldset>
</form>
```

## Component Patterns

### Dialog/Modal

```tsx
<Dialog open={isOpen} onOpenChange={setIsOpen}>
	<DialogContent 
		aria-labelledby="dialog-title"
		aria-describedby="dialog-description"
	>
		<DialogTitle id="dialog-title">
			Delete Resume
		</DialogTitle>
		<DialogDescription id="dialog-description">
			This action cannot be undone.
		</DialogDescription>
		<DialogFooter>
			<Button onClick={onCancel}>Cancel</Button>
			<Button onClick={onConfirm}>Delete</Button>
		</DialogFooter>
	</DialogContent>
</Dialog>
```

### Loading States

```tsx
{isLoading ? (
	<div role="status" aria-live="polite">
		<Spinner aria-hidden="true" />
		<span className="sr-only">Loading...</span>
	</div>
) : (
	<content />
)}
```

### Error States

```tsx
{error && (
	<Alert role="alert">
		<AlertCircle aria-hidden="true" />
		<AlertTitle>Error</AlertTitle>
		<AlertDescription>{error.message}</AlertDescription>
	</Alert>
)}
```

## Testing Checklist

### Automated Testing
- [ ] Lighthouse accessibility score 100
- [ ] axe DevTools: 0 violations
- [ ] WAVE: No errors
- [ ] Pa11y CI integration

### Manual Testing
- [ ] Keyboard-only navigation
- [ ] Screen reader testing (NVDA, VoiceOver)
- [ ] 200% zoom test
- [ ] Color blindness simulation
- [ ] High contrast mode

### Screen Readers

**VoiceOver (Mac):**
```bash
Cmd + F5 to enable
```

**NVDA (Windows):**
```bash
Install from nvaccess.org
```

**Testing Script:**
1. Navigate with Tab key only
2. Activate all interactive elements
3. Fill out all forms
4. Upload a resume
5. Use chat interface
6. Access dashboard
7. Verify all announcements

## Common Issues & Fixes

### Missing Alt Text
```tsx
// ❌ Bad
<img src="/logo.png" />

// ✅ Good
<img src="/logo.png" alt="ResumeChat logo" />

// Decorative images
<img src="/decoration.png" alt="" aria-hidden="true" />
```

### Non-Semantic Buttons
```tsx
// ❌ Bad
<div onClick={handleClick}>Click me</div>

// ✅ Good
<button onClick={handleClick}>Click me</button>
```

### Poor Heading Structure
```tsx
// ❌ Bad
<h1>Dashboard</h1>
<h3>Recent Activity</h3>

// ✅ Good
<h1>Dashboard</h1>
<h2>Recent Activity</h2>
```

### Inaccessible Modals
```tsx
// ❌ Bad
<div className="modal">Content</div>

// ✅ Good
<div 
	role="dialog" 
	aria-modal="true"
	aria-labelledby="modal-title"
>
	<h2 id="modal-title">Modal Title</h2>
	Content
</div>
```

## Resources

- [WCAG 2.1 Guidelines](https://www.w3.org/WAI/WCAG21/quickref/)
- [A11y Project Checklist](https://www.a11yproject.com/checklist/)
- [Radix UI](https://www.radix-ui.com/) - Accessible primitives
- [MDN Accessibility](https://developer.mozilla.org/en-US/docs/Web/Accessibility)
- [WebAIM](https://webaim.org/)

## Tools

- [axe DevTools](https://www.deque.com/axe/devtools/)
- [WAVE](https://wave.webaim.org/)
- [Lighthouse](https://developers.google.com/web/tools/lighthouse)
- [Pa11y](https://pa11y.org/)
- [Color Contrast Analyzer](https://www.tpgi.com/color-contrast-checker/)

## Reporting Accessibility Issues

If you encounter accessibility barriers:
1. Document the issue with screenshots
2. Specify the assistive technology used
3. Describe expected vs. actual behavior
4. Submit via GitHub Issues with "accessibility" label


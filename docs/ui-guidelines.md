# UI Guidelines

## Overview

This document outlines the UI guidelines for the task management application. All UI work should adhere to these principles to ensure a consistent and inclusive user experience.

## Accessibility

- The UI must be accessible to all users, including those using assistive technologies such as screen readers.
- All interactive elements (buttons, inputs, links) must be keyboard-navigable and focusable.
- Use semantic HTML elements (`<button>`, `<label>`, `<nav>`, etc.) to convey meaning and structure.
- All images and icons must include descriptive `alt` text or `aria-label` attributes.
- Colour contrast ratios must meet WCAG 2.1 AA standards (minimum 4.5:1 for normal text, 3:1 for large text).
- Do not rely on colour alone to convey information; use additional indicators such as icons or labels.

## Typography

- Use clear, legible fonts at sizes that are comfortable to read (minimum 16px for body text).
- Maintain sufficient line spacing (at least 1.5× the font size) to improve readability.
- Avoid long lines of text; keep line lengths between 60–80 characters where possible.
- Use font weight and size to establish visual hierarchy — headings should be clearly distinguishable from body text.

## Layout and Sections

- Organise the UI into well-defined, clearly labelled sections so users can quickly identify where to take action.
- Use consistent spacing and alignment throughout the interface to create a clean, structured layout.
- Group related elements together visually using whitespace, borders, or background colour differences.
- Each section should have a clear heading or label that describes its purpose.
- Avoid cluttering the interface — present only the information and actions relevant to the current context.

## Colour and Visual Design

- Use a limited, consistent colour palette throughout the application.
- Reserve high-contrast or accent colours for primary actions and important information.
- Ensure the interface is usable in both light and dark environments where applicable.
- The primary accent colour is `#6c63ff` (violet). Use it for interactive elements, focus states, badges, and section headings.
- The page background uses a diagonal gradient: `linear-gradient(135deg, #667eea 0%, #764ba2 100%)`.
- Content areas use white (`#fff`) card panels with `border-radius: 16px` and a soft drop shadow (`0 4px 24px rgba(0,0,0,0.12)`).
- Task rows use a light tinted card background (`#f8f8ff`) with a `2px` border that highlights to `#d4d0ff` on hover.
- Button colours must communicate intent: violet for primary actions, green-tinted for save/confirm, red-tinted for destructive actions, and grey-tinted for cancel/neutral actions. All buttons fill with a solid colour on hover.
- Due dates are displayed as a small pill badge with a calendar emoji prefix and a violet tint.
- Error messages are displayed as a red-tinted box, not plain text.

## Feedback and Interactivity

- Provide clear visual feedback for all user interactions (e.g., hover states, focus rings, loading indicators).
- Display confirmation or error messages in a prominent but non-intrusive manner.
- Avoid unexpected or disruptive UI changes; transitions and updates should feel smooth and predictable.
- All interactive elements must have a `transition` on colour and shadow properties (use `0.2s ease`).
- Buttons must have a subtle `scale(0.97)` press effect on `:active`.
- Input focus states must show a `3px` coloured box-shadow ring using the primary accent colour at 15% opacity alongside a solid accent border.
- Disabled controls (e.g., reorder buttons at list boundaries) must have `opacity: 0.25` and `cursor: not-allowed`.

## Spacing and Shape

- Use `border-radius: 10px` for inputs and action buttons; `border-radius: 12px` for task item cards; `border-radius: 16px` for section panels.
- Section headings use `uppercase` text with `0.06em` letter-spacing and the primary accent colour to create clear visual hierarchy.
- Form fields and their labels are grouped vertically with a small gap (`4–5px`); label text is uppercase, small (`0.78rem`), and muted (`#888`).

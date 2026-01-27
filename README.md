# Mog Design Tokens

A design token system that transforms Figma design tokens into CSS custom properties and Tailwind CSS theme variables.

## Project Overview

This project uses **Style Dictionary** to convert design tokens exported from Figma (in JSON format) into usable CSS files:

- `build/css/globals.css` - All primitive design tokens (colors, spacing, typography, etc.)
- `build/css/theme-light.css` - Light theme semantic tokens
- `build/css/theme-dark.css` - Dark theme semantic tokens
- `build/css/tailwind.css` - Tailwind CSS theme integration

## Getting Started

### Prerequisites

- Node.js (v18+)
- npm

### Installation

```bash
npm install
```

### Build Commands

```bash
# Build all CSS files (globals + themes)
npm run build:dev

# Build Tailwind CSS
node tailwind.config.js
```

## Token Structure

### Source Files (`/tokens`)

| File | Description |
|------|-------------|
| `Primitives.json` | Base design tokens: colors, spacing, typography, radius |
| `Themes.json` | Semantic tokens with Light/Dark mode values |
| `Spacing.json` | Component-specific spacing tokens |
| `Typography.json` | Typography semantic tokens |
| `Radius.json` | Border radius semantic tokens |
| `Widths.json` | Width tokens for containers |
| `containers.json` | Container layout tokens |

### Output Files (`/build/css`)

| File | Description |
|------|-------------|
| `globals.css` | All primitive tokens as CSS custom properties in `:root` |
| `theme-light.css` | Light theme under `:root, [data-theme="light"]` |
| `theme-dark.css` | Dark theme under `[data-theme="dark"]` |
| `tailwind.css` | Tailwind `@theme` block + utility definitions |

## Token Naming Conventions

### Primitives (globals.css)

```css
/* Colors */
--color-{category}-{shade}
/* Examples: --color-neutral-500, --color-primary-sa-flag-600-primary */

/* Spacing */
--spacing-{value}
/* Examples: --spacing-4, --spacing-0_5 (for 0.5) */

/* Typography */
--typography-font-family-{name}
--typography-font-weight-{weight}
--typography-text-size-{size}
--typography-line-hight-{height}

/* Radius */
--radius-{size}
/* Examples: --radius-0, --radius-8, --radius-9999 */
```

### Themes (theme-light.css / theme-dark.css)

Semantic tokens organized by category with consistent prefixes:

```css
/* Backgrounds */
--background-{context}
/* Examples: --background-white, --background-primary, --background-card */

/* Text */
--text-{context}
/* Examples: --text-primary, --text-default, --text-form-label */

/* Borders */
--border-{context}
/* Examples: --border-primary, --border-error, --border-form-default */

/* Icons */
--icon-{context}
/* Examples: --icon-primary, --icon-success, --icon-button-transparent */

/* Buttons */
--background-button-{variant}-{state}
/* Examples: --background-button-primary-default, --background-button-danger-hovered */
```

### Tailwind (tailwind.css)

The Tailwind file:
1. Imports `tailwindcss`, `globals.css`, and theme files
2. Defines `@theme` block with all tokens mapped to Tailwind's naming
3. Provides custom utilities for semantic token usage

## Configuration Files

### `config.js`

Main Style Dictionary configuration that:
- Formats primitive token names (removes redundant prefixes)
- Handles spacing decimals (`0.5` → `0_5`)
- Converts font-weight names to CSS values (Bold → 700)
- Generates separate Light/Dark theme files
- Formats reference values to proper CSS variable syntax

Key formatting rules:
- Removes `primitives-` prefix from primitive tokens
- Removes duplicated words (e.g., `spacing-card-card-` → `spacing-card-`)
- Converts Figma font weights to CSS numeric values

### `tailwind.config.js`

Tailwind-specific configuration that:
- Generates `@theme` block with CSS variable references
- Reorganizes token names for Tailwind utility patterns
- Adds category prefixes (text-, background-, icon-, etc.)
- Skips alpha tokens (available in color-alpha-*)

## Usage Examples

### CSS Custom Properties

```css
/* Direct usage */
.card {
  background-color: var(--background-card);
  border-radius: var(--radius-8);
  padding: var(--spacing-4);
}

/* Theme-aware colors */
.heading {
  color: var(--text-primary);  /* Switches based on [data-theme] */
}
```

### Tailwind CSS

```html
<!-- Using generated theme -->
<div class="bg-primary text-default rounded-8 p-4">
  Content
</div>
```

### Theme Switching

```html
<!-- Light theme (default) -->
<html data-theme="light">

<!-- Dark theme -->
<html data-theme="dark">
```

## Token Value Types

| Type | Primitives | Themes |
|------|-----------|--------|
| Colors | Hex values (`#ffffff`) | `var(--color-*)` references |
| Spacing | Pixel values (`16`) | `var(--spacing-*)` references |
| Typography | Direct values | `var(--typography-*)` references |
| Font Weights | Numeric (400, 500, 600, 700) | References to primitives |

## Development Notes

### Adding New Tokens

1. Add tokens to the appropriate JSON file in `/tokens`
2. Run `npm run build:dev` to regenerate CSS
3. If needed for Tailwind, also run `node tailwind.config.js`

### Token Naming Guidelines

- Use kebab-case for all token names
- Avoid redundant words in paths
- Follow existing category patterns
- Use semantic names for theme tokens (e.g., `primary`, `success`, `error`)

### Decimal Values

Decimal values in token names (like spacing `0.5`) are converted to underscores:
- `--spacing-0_5` (not `--spacing-0.5`)
- `--spacing-1_5`

This ensures valid CSS property names.

## File Structure

```
Mog/
├── tokens/                   # Source design tokens (JSON)
│   ├── Primitives.json
│   ├── Themes.json
│   ├── Spacing.json
│   ├── Typography.json
│   ├── Radius.json
│   ├── Widths.json
│   └── containers.json
├── build/css/                # Generated CSS files
│   ├── globals.css
│   ├── theme-light.css
│   ├── theme-dark.css
│   └── tailwind.css
├── config.js                 # Style Dictionary config
├── tailwind.config.js        # Tailwind generation config
├── package.json
├── userinput.py              # Prompt loop utility
└── README.md                 # This file
```

## Troubleshooting

### Missing Token Values

If a token shows `var(--[object Object])`, check that the source JSON has the correct value format.

### Circular References

Ensure theme tokens reference primitives, not themselves. The build will output self-referential tokens if the reference path is incorrect.

### Duplicate Tokens

Alpha tokens from Themes are skipped in Tailwind to avoid duplicating `color-alpha-*` primitives.

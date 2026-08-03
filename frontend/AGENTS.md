<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

<!-- BEGIN:shadcn-components -->
## Component Usage

**CRITICAL: Always prefer shadcn/ui or reactbits components before creating custom ones.**

1. **First, check available components:**
   - shadcn: `src/components/ui/` (Button, Card, Input, Dialog, Sheet, Badge, etc.)
   - reactbits: configured in `components.json` under registries

2. **Import path:** `@/components/ui/{component-name}`

3. **Only create custom components when:**
   - No shadcn/reactbits equivalent exists
   - You need to extend an existing shadcn component

4. **Never write raw HTML elements for common UI patterns** like buttons, cards, inputs, modals, dropdowns, or navigation — use shadcn equivalents instead.

5. **When customizing shadcn components:**
   - Use the `className` prop for styling
   - Use shadcn variants (Button has `variant`, `size`)
   - Don't modify the base component source unless absolutely necessary
<!-- END:shadcn-components -->

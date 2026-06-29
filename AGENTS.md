<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.

## Dependency handling
- Treat `node_modules/` as read-only reference material.
- Never edit, write, patch, or generate files inside `node_modules/`.
- Exclude `node_modules/` from AI-assisted search/edit scope unless a user explicitly requests SDK or package reference inspection.
<!-- END:nextjs-agent-rules -->

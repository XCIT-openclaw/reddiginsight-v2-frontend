<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->


## Code Editing Rule

**Always use Node.js temp scripts for editing files.** Node REPL (`mcp__node_repl__js`) is READ-ONLY for workspace files ? use it for reading/analyzing code. For writes: create a temp `.js` script via shell_command with `Set-Content -Encoding ASCII`, then execute it with `node`. Node's `fs.writeFileSync` writes clean UTF-8 without BOM. After every write: immediately `readFileSync` in the same script to verify. It has built-in `fs` module and can read/write project files directly. Never use PowerShell `Set-Content` - it adds UTF-8 BOM which breaks `'use client'` directives and corrupts Unicode characters.

After every write: immediately `readFileSync` to verify the change actually landed.

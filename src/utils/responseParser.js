/**
 * Parses agent responses for file creation/edit blocks and terminal commands.
 *
 * Supports multiple formats to be resilient to LLM behaviors:
 *
 * Format A (explicit):
 *   ===FILE: relative/path/to/file===
 *   content here
 *   ===END FILE===
 *
 * Format B (markdown code blocks with path):
 *   ```language:relative/path/to/file
 *   content here
 *   ```
 *
 * Format C (standard markdown header):
 *   **relative/path/to/file**
 *   ```language
 *   content here
 *   ```
 */

const FILE_REGEX_A = /===FILE:\s*(.+?)\s*===\n([\s\S]*?)===END FILE===/g
const FILE_REGEX_B = /```\w*:([^\n`]+)\n([\s\S]*?)```/g
const FILE_REGEX_C = /(?:(?:\*\*|###|`)\s*([a-zA-Z0-9_.\-/]+)\s*(?:\*\*|`|:)*\s*\n+)\s*```\w*\n([\s\S]*?)```/g
const TERMINAL_REGEX_A = /===TERMINAL===\n([\s\S]*?)===END TERMINAL===/g

export function parseAgentActions(responseText) {
  const actions = []

  let match

  // Format A: ===FILE: path===
  const regA = new RegExp(FILE_REGEX_A.source, 'g')
  while ((match = regA.exec(responseText)) !== null) {
    let content = match[2]
    // Clean up if LLM wrapped the inner content in markdown code blocks
    const innerBlockMatch = /^\s*```\w*\n([\s\S]*?)```\s*$/.exec(content)
    if (innerBlockMatch) {
      content = innerBlockMatch[1]
    }
    if (content.trim()) {
      actions.push({ type: 'file', path: match[1].trim(), content })
    }
  }

  // Format B: ```lang:path
  const regB = new RegExp(FILE_REGEX_B.source, 'g')
  while ((match = regB.exec(responseText)) !== null) {
    const filePath = match[1].trim()
    const content = match[2]
    if (content.trim() && !actions.some(a => a.path === filePath)) {
      actions.push({ type: 'file', path: filePath, content })
    }
  }

  // Format C: Standard markdown header e.g. **src/index.js**\n```js\n...```
  const regC = new RegExp(FILE_REGEX_C.source, 'g')
  while ((match = regC.exec(responseText)) !== null) {
    const filePath = match[1].trim()
    const content = match[2]
    if (content.trim() && !actions.some(a => a.path === filePath)) {
      actions.push({ type: 'file', path: filePath, content })
    }
  }

  // Terminal actions
  const termRegA = new RegExp(TERMINAL_REGEX_A.source, 'g')
  while ((match = termRegA.exec(responseText)) !== null) {
    const cmd = match[1].trim()
    if (cmd) actions.push({ type: 'terminal', command: cmd })
  }

  return actions
}

export function getActionFormatInstructions() {
  return `
=== FILE GENERATION & CHAT BEHAVIOR ===
1. DO NOT dump full source code into the chat. The user does not want to see long code blocks.
2. Instead, you must CREATE physical files silently using the format below.
3. In your visible chat response, ONLY write compact execution summaries like:
   - "Creating project structure..."
   - "Writing index.html..."
   - "Creating components/Navbar.jsx..."

To CREATE or MODIFY a file, use EXACTLY this format (you MUST include the === markers):
===FILE: relative/path/to/file===
file content here
===END FILE===

Example of a PERFECT response:
I am setting up your React application.
- Creating index.html
- Creating App.jsx

===FILE: index.html===
<!DOCTYPE html>...
===END FILE===

===FILE: src/App.jsx===
export default function App() {...
===END FILE===

To RUN a terminal command:
===TERMINAL===
npm install
===END TERMINAL===

Always use these exact formats. The === blocks will be stripped from the UI and executed directly in the user's workspace.
`
}

export function buildWorkspaceContext(workspacePath, fileList, fileContents = {}) {
  if (!workspacePath) return ''

  let ctx = `\n\n--- WORKSPACE CONTEXT ---\nProject path: ${workspacePath}\n`

  if (fileList && fileList.length > 0) {
    ctx += `\nProject files (${fileList.length}):\n`
    for (const f of fileList.slice(0, 200)) {
      ctx += `  ${f}\n`
    }
    if (fileList.length > 200) ctx += `  ... and ${fileList.length - 200} more files\n`
  }

  const contentEntries = Object.entries(fileContents)
  if (contentEntries.length > 0) {
    ctx += `\n--- KEY FILE CONTENTS ---\n`
    for (const [path, content] of contentEntries) {
      ctx += `\n--- ${path} ---\n${content.slice(0, 3000)}\n`
      if (content.length > 3000) ctx += `... (truncated, ${content.length} chars total)\n`
    }
  }

  ctx += `\n--- END WORKSPACE CONTEXT ---\n`
  return ctx
}

export function getDisplayText(responseText) {
  let text = responseText
    .replace(new RegExp(FILE_REGEX_A.source, 'g'), '')
    .replace(new RegExp(FILE_REGEX_B.source, 'g'), '')
    .replace(new RegExp(FILE_REGEX_C.source, 'g'), '')
    .replace(new RegExp(TERMINAL_REGEX_A.source, 'g'), '')
    .trim()
  return text
}

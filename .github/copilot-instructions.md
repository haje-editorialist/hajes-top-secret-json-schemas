# GitHub Copilot Instructions

## CRITICAL RULES - Read Before Every Task

### Schema Versioning (MOST IMPORTANT)
**NEVER edit an existing schema file. Always create a new version for ANY change.**

When making schema changes:
1. Create new file: `v2.json`, `v3.json`, etc.
2. Leave existing versions unchanged for backward compatibility
3. Update prompts to reference new version

### Repository Structure
```
schemas/
  <schema-name>/
    v1.json, v2.json, v3.json
    prompts.md (NOT committed - in .gitignore)
```

### Prompts
- Never commit prompt files - they go in `.gitignore`
- Store `prompts.md` in schema folder alongside JSON files
- Don't include JSON structure in prompts (that's what schemas are for)
- Input data passed as separate files, not embedded in prompts

### Schema Design
- Use `"type": "string"` NOT `"format": "uri"` (OpenAI doesn't support it)
- Boolean fields over status strings: `is_fashion_related: boolean`
- Confidence scores: 0-100 numeric range
- First names only: "Sarah", "Haje" (not full names)

### Prompt Design Philosophy
1. **Anti-hallucination first** - strict rules to prevent fabrication
2. **Conservative extraction** - better to miss than hallucinate
3. **Explicit evidence only** - no inference or assumptions
4. **Flag ambiguity** - mark as "Unclear" rather than guess
5. **Meeting context** - Haje is the default organizer/requester

### Quick Reference
- Base URL: `https://raw.githubusercontent.com/haje-editorialist/hajes-top-secret-json-schemas/main/schemas/<name>/v1.json`
- Check README.md for full design preferences
- Always upversion on schema changes ⚠️

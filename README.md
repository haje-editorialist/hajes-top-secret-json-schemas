# JSON Schemas

Base URL for published schemas:
https://raw.githubusercontent.com/haje-editorialist/hajes-top-secret-json-schemas/main/

## Repository Structure

Schemas are organized by name with version files:
```
schemas/
  <schema-name>/
    v1.json
    v2.json
    prompts.md (not committed)
```

Example URLs:
- `https://raw.githubusercontent.com/haje-editorialist/hajes-top-secret-json-schemas/main/schemas/action-items/v1.json`
- `https://raw.githubusercontent.com/haje-editorialist/hajes-top-secret-json-schemas/main/schemas/rss-fashion-classifier/v1.json`

## Design Preferences (for AI assistants)

When working with this repository, follow these guidelines:

### Schema Organization
- **Folder structure**: `schemas/<schema-name>/v1.json` not `schemas/v1/<schema-name>.json`
- **Versioning**: Each schema versions independently (v1.json, v2.json, etc.)
- **Backward compatibility**: Copy schemas to new structure instead of moving to avoid breaking existing integrations

### Prompts
- **Never commit prompts**: All prompt files (*.md in schema folders) should be in `.gitignore`
- **Location**: Store `prompts.md` in the same folder as the schema it supports
- **Schema references**: Don't include JSON structure examples in prompts - that's what the schema is for
- **Input handling**: When prompts reference input data (like transcripts), they will be passed as separate markdown files

### Prompt Design Philosophy
- **Anti-hallucination first**: Always include strict rules to prevent fabrication
- **Conservative extraction**: Better to miss something than to hallucinate
- **Be specific**: Require explicit evidence from input, not inference
- **Flag ambiguity**: When uncertain, mark as "Unclear" with explanation rather than guessing
- **No assumptions**: Don't add implied deadlines, inferred assignments, or assumed context

### Data Formatting
- **Names**: Use first names only (e.g., "Sarah", "Haje") not full names
- **Meeting context**: Haje is the default meeting organizer/requester
- **Booleans over strings**: Prefer `is_fashion_related: boolean` over status strings
- **Confidence scores**: Use 0-100 scale for classification confidence

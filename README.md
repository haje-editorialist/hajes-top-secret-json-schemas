# JSON Schemas

Base URL for published schemas:
https://raw.githubusercontent.com/haje-editorialist/hajes-top-secret-json-schemas/main/

## Zapier + OpenAI Structured Outputs Postmortem (2026-09-09)

### Symptom

The ChatGPT step in the "Saved slack message -> Airtable todo" Zap returned:

- `status: incomplete`
- `incomplete_details.reason: max_output_tokens`
- No `output_json`, so downstream Airtable mapping had nothing to write.

### Root Cause

The failure came from string length and regex constraints in a `strict: true` JSON schema.

This schema shape caused the issue:

```json
"short_description": { "minLength": 1, "maxLength": 200, "pattern": "^\\S+(?:\\s+\\S+){3,9}$" },
"long_description":  { "minLength": 1, "maxLength": 4000 },
"waiting_on_person": { "maxLength": 80, "pattern": "^(|[A-Za-z][A-Za-z'\\-]{0,79})$" },
"claude_prompt":     { "minLength": 1, "maxLength": 12000 }
```

With strict mode, OpenAI compiles the schema into a decoding grammar before generation. In this case, the character bounds and regex combination was expensive enough to fail before token generation began.

Important: this was not real output truncation despite the `max_output_tokens` reason text.

### Decisive Signal

`Usage Input Tokens: 0`.

Rule: read usage before error text. The error says where execution stopped, not always why.

Interpretation guide:

| Usage Pattern | Meaning |
| --- | --- |
| High output tokens + `incomplete` | Real truncation, raise `max_output_tokens`. |
| Zero input and zero output + has `resp_` id | Failed before generation, suspect schema/request construction. |
| No `resp_` id | Request never reached API, suspect auth/model access. |
| High reasoning tokens + low visible output | Reasoning consumed budget, lower `reasoning_effort`. |

### False Leads (Rejected)

1. Sample-data truncation in Zapier test records: real behavior, but display-only and irrelevant to empty output.
2. Zapier test-mode preamble (brevity/time constraint): real and can shorten responses, but does not explain empty output.
3. `max_output_tokens` too low: increasing 2000 -> 20000 did not change outcome.
4. `reasoning_effort: medium` budget burn: plausible generally, but reasoning tokens were zero.
5. Model alias issues: some aliases are invalid/incompatible with structured outputs, but selected model was reachable in this case.
6. Stale test records: repeated config echo is expected; changing `resp_` ids proved runs were live.

### What Worked

Removing all `minLength`, `maxLength`, and `pattern` constraints resolved the issue while keeping `strict: true`.

Validated working shape:

```json
{
	"title": "SlackToTodo",
	"type": "object",
	"properties": {
		"short_description": { "type": "string", "description": "..." },
		"long_description": { "type": "string", "description": "..." },
		"todo_type": {
			"type": "string",
			"enum": ["Action for Haje", "Waiting on someone else", "Reference"],
			"description": "..."
		},
		"waiting_on_person": { "type": "string", "description": "..." },
		"claude_prompt": { "type": "string", "description": "..." }
	},
	"required": ["short_description", "long_description", "todo_type", "waiting_on_person", "claude_prompt"],
	"additionalProperties": false
}
```

Result in test: `completed` in about 3 seconds with all expected keys present.

Keep:

- `enum`
- `required`
- `additionalProperties: false`
- `strict: true`

Do not rely on `$schema` for behavior in this integration path.

### Prevention Checklist

1. Start with a minimum viable schema: types, descriptions, enums, required, `additionalProperties: false`.
2. Put style/word-count/phrasing rules in prompts, not schema regex/length constraints.
3. Bisect schema changes before prompt changes when debugging structured outputs.
4. Change one variable per test run.
5. Trust usage block over error label.
6. Treat Zapier editor test mode as diagnostic only; validate with a published live replay.

### Open Issues To Recheck

1. Reattach `short_description` mapping in Airtable title field (if title is only `" (via Slack)"`, mapping is broken).
2. Enforce `waiting_on_person` fallback in prompt: if unknown, return empty string, not placeholders like `"Unknown"`.
3. Re-test Action vs Waiting-on classification (especially direct questions to Haje) with final instructions and `reasoning_effort: low`.
4. If stricter validation is needed, consider a downstream validation step before Airtable write instead of heavy schema constraints.

<!-- CBI-MCP-BEGIN -->
# CODEBASE INTELLIGENCE RULES (CBI-MCP) - qtdyentho-credit

CBI-MCP is the primary codebase intelligence brain for qtdyentho-credit.

## Pre-Modification Protocol:
1. Call cbi_context to generate a token-bounded Evidence Packet.
2. Call cbi_symbol to locate canonical definitions.
3. Call cbi_impact and cbi_callers to check blast radius.

## Post-Modification Protocol:
1. Call cbi_diff_impact to verify changes.
2. Run tests (`npm run build`, live GAS verification).
3. If Google Sheets Schema changes: strictly follow 5-step End-to-End Audit (SchemaSetup -> Controllers -> api.js/mockData -> dual-push deploy -> update docs).
<!-- CBI-MCP-END -->
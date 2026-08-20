<!-- CBI-MCP-BEGIN -->
# CODEBASE & SECURITY INTELLIGENCE RULES (CBI-MCP) - qtdyentho-credit

CBI-MCP is the primary codebase and security intelligence engine for CreditCores.

## Pre-Modification Protocol:
1. Call `cbi_context_packet` or `cbi_context` to generate a token-bounded Evidence Packet.
2. Call `cbi_symbol` and `cbi_search` to locate canonical definitions.
3. Call `cbi_impact` and `cbi_change_risk` to check blast radius.
4. Call `cbi_security_impact` to assess security boundaries (`AUTHENTICATION`, `AUTHORIZATION`, `FINANCIAL_TRANSACTION`).
5. Call `cbi_architecture_guard` to verify layer constraints.

## Post-Modification Protocol:
1. Call `cbi_diff_impact` to verify changes.
2. Run tests (`npm run build`, live GAS verification).
3. If Google Sheets Schema changes: strictly follow the 5-step End-to-End Audit (SchemaSetup -> Controllers -> api.js/mockData -> dual-push deploy -> update docs).
4. Run `cbi security scan` to ensure no security regressions.
<!-- CBI-MCP-END -->
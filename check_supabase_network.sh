#!/bin/bash
ANON_KEY=$(grep "NEXT_PUBLIC_SUPABASE_ANON_KEY" dsc-fms-portal/.env.local | cut -d'"' -f2)

echo "=== Network Diagnostics ==="
echo "Time: $(date '+%Y-%m-%d %H:%M:%S %Z')"
echo ""

# Try DNS with different resolver
echo "DNS Resolution (using 1.1.1.1):"
timeout 5 curl -s "https://1.1.1.1/dns-query?name=nxwqxqpzukyqxygpplkt.supabase.co&type=A" -H "accept: application/dns-json" 2>&1 | head -3 || echo "Failed"
echo ""

# Try with explicit DNS via host file or alternative
echo "Trying curl with resolver:"
timeout 5 curl --resolve nxwqxqpzukyqxygpplkt.supabase.co:443:34.110.197.77 \
  -s "https://nxwqxqpzukyqxygpplkt.supabase.co/rest/v1/asset_import_batches?select=1&limit=1" \
  -H "Authorization: Bearer $ANON_KEY" \
  -H "Content-Type: application/json" \
  -w "\nHTTP Status: %{http_code}\n" 2>&1 || echo "Failed with direct IP"

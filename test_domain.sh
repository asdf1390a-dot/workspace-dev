#!/bin/bash
echo "Testing various endpoints:"

# Test base Supabase domain
echo "1. Testing supabase.co:"
timeout 3 curl -s "https://supabase.co" -w "HTTP: %{http_code}\n" 2>&1 | tail -1

# Test official Supabase status
echo "2. Testing Supabase Status:"
timeout 3 curl -s "https://status.supabase.com" -w "HTTP: %{http_code}\n" 2>&1 | tail -1

# Test if localhost/network is working
echo "3. Testing local DNS:"
getent hosts nxwqxqpzukyqxygpplkt.supabase.co || echo "Not in hosts"

# Test with Google DNS
echo "4. Testing with Google DNS 8.8.8.8:"
timeout 3 bash -c 'exec 3<>/dev/tcp/8.8.8.8/53 && echo "8.8.8.8 responsive" || echo "8.8.8.8 not responsive"' 2>&1

# Check if we're in an isolated network
echo "5. Network interface status:"
ip route 2>/dev/null || echo "No routing table"

# Manual Testing Guide - Client Signing SDK

## Quick Start

### 1. Environment Setup

```bash
# Navigate to project root
cd /Users/adamrobbie/Code/ArkSwap

# Build the client package
npm run build --workspace=packages/client

# Start Docker environment
cd docker
docker compose up -d

# Wait for services to be healthy (~30 seconds)
docker compose ps
```

### 2. Fund Your Wallet

```bash
# Get your wallet address from the web UI or logs
# Then fund it via Bitcoin CLI
docker exec arkswap-bitcoind-1 bitcoin-cli -regtest -rpcwallet=asp \
  sendtoaddress <YOUR_WALLET_ADDRESS> 1.0

# Mine a block to confirm
docker exec arkswap-bitcoind-1 bitcoin-cli -regtest generatetoaddress 1 <YOUR_WALLET_ADDRESS>
```

## Test Scenarios

### ✅ Test 1: Koi Showcase (Pond Entry)

**What it tests**: `signPondEntry` → `coreSign` with BIP-86 Taproot signing

**Steps**:
1. Open `http://localhost:3000`
2. Navigate to "Koi Showcase" or "My Koi" page
3. Click "Enter Pond" on any VTXO
4. Observe the signature being generated
5. Click "Confirm"

**Expected Result**:
- ✓ Transaction  succeeds
- ✓ Pond entry appears in UI
- ✓ ASP logs show: `Pond entry verified`

**Verification**:
```bash
# Check ASP logs
docker logs arkswap-asp-1 --tail=50 | grep -i pond

# Query pond entries via indexer
curl -s http://localhost:3002/pond/entries | jq '.[] | {address, txid, timestamp}'
```

**Troubleshooting**:
- If signature fails: Check browser console for errors
- If ASP rejects: Verify wallet is funded and synced

---

### ✅ Test 2: Koi Breeding

**What it tests**: `signBreedMessage` → `coreSign` with raw signing (no tweaks)

**Steps**:
1. Navigate to "Breed" page
2. Select two parent Koi (requires at least 2 VTXOs with Koi metadata)
3. Click "Breed Koi"
4. Sign the breeding message
5. Wait for confirmation

**Expected Result**:
- ✓ New Gen1+ Koi appears in wallet
- ✓ Parent Koi cooldowns updated
- ✓ DNA properly mixed from parents

**Verification**:
```bash
# Check breeding logs
docker logs arkswap-asp-1 --tail=50 | grep -i breed

# List your Koi with generation info
curl -s http://localhost:3002/vtxos/<YOUR_ADDRESS> | \
  jq '.[] | select(.metadata) | {tokenId: .metadata.tokenId, generation: .metadata.generation, dna: .metadata.dna}'
```

---

### ✅ Test 3: Koi Feeding

**What it tests**: `signFeedMessage` → `coreSign` with asset + Taproot tweaking

**Steps**:
1. Navigate to a specific Koi details page
2. Click "Feed Koi" (requires Koi to be off cooldown)
3. Sign the feeding transaction
4. Observe XP increase

**Expected Result**:
- ✓ Koi XP increases
- ✓ `lastFedBlock` and `cooldownBlock` updated
- ✓ Signature uses correct asset-tweaked key

**Verification**:
```bash
# Check Koi stats before and after
curl -s http://localhost:3002/vtxos/<YOUR_ADDRESS> | \
  jq '.[] | select(.metadata.tokenId == "TARGET_TOKEN") | {xp, lastFedBlock, cooldownBlock}'
```

---

### ✅ Test 4: Asset VTXO Transfer (Koi Trade)

**What it tests**: `signInput` → `coreSign` with asset + Taproot for spending

**Steps**:
1. Navigate to "Send" page
2. Select an Asset VTXO (e.g., a Koi)
3. Enter recipient address
4. Click "Send"
5. Sign the transaction

**Expected Result**:
- ✓ Koi transfers to recipient
- ✓ Transaction appears in mempool
- ✓ Recipient sees Koi in their wallet

**Verification**:
```bash
# Check mempool
docker exec arkswap-bitcoind-1 bitcoin-cli -regtest getrawmempool

# Verify recipient's VTXOs
curl -s http://localhost:3002/vtxos/<RECIPIENT_ADDRESS> | \
  jq '.[] | select(.metadata.tokenId == "TRANSFERRED_TOKEN")'
```

---

### ✅ Test 5: Base VTXO Transfer

**What it tests**: Standard BIP-86 signing fo non-asset transfers

**Steps**:
1. Navigate to "Send" page
2. Select a base VTXO (no Koi metadata)
3. Enter recipient address
4. Sign and send

**Expected Result**:
- ✓ Standard Taproot transaction succeeds
- ✓ Recipient receives VTXO

---

## Common Issues & Solutions

### Issue: "Cannot read properties of undefined"
**Solution**: Ensure wallet is created and VTXOs are loaded
```javascript
// In browser console
await client.createWallet()
client.getVtxos(walletAddress)
```

### Issue: Signature verification fails
**Solution**: Check that `@arkswap/protocol` is correctly built
```bash
cd packages/protocol
npm run build
```

### Issue: ASP rejects signature
**Solution**: Verify clock sync between client and server
```bash
# Check Docker container time
docker exec arkswap-asp-1 date
```

## Performance Benchmarks

Expected signing performance on modern hardware:
- **Single signature**: < 5ms
- **100 signatures**: < 500ms
- **Memory usage**: Stable (no leaks)

Run performance test:
```bash
npm test -- sign-production.spec.ts -t "edge case hashes"
```

## Next Steps After Manual Testing

1. ✅ Verify all 5 scenarios work
2. ✅ Check ASP/Indexer logs for errors
3. ✅ Confirm signatures are accepted
4. 📝 Document any issues in GitHub
5. 🚀 Ready for PR review!

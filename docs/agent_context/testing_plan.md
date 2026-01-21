# Client Signing SDK - Production Testing Plan

## Current Test Coverage ✓

### Unit Tests (9/9 passing)
- **Pond Entry Signing**: 5 tests validating signature generation, determinism, and server-side verification
- **Breed Message Signing**: 1 test confirming raw key signing without tweaks
- **Unified `sign()` Method**: 3 tests covering all tweak behaviors (BIP-86, Asset, Raw)

## Additional Unit Tests Needed

### 1. Error Handling & Edge Cases

```typescript
describe('sign() - error handling', () => {
  it('should throw error when asset metadata is missing for asset tweak', async () => {
    await expect(
      client.sign(hash, { tweakBehavior: 'asset' })
    ).rejects.toThrow('Asset metadata required');
  });

  it('should handle empty hash buffer', async () => {
    await expect(
      client.sign(Buffer.alloc(0))
    ).rejects.toThrow();
  });

  it('should handle invalid hash length', async () => {
    const invalidHash = Buffer.alloc(16); // Should be 32 bytes
    await expect(
      client.sign(invalidHash)
    ).rejects.toThrow();
  });
});
```

### 2. Backwards Compatibility Tests

Verify that refactored methods produce **identical** signatures to the original implementation:

```typescript
describe('Backwards compatibility', () => {
  it('signPondEntry produces same signature as pre-refactor', async () => {
    // Use known test vectors from production data
    const knownVtxo = { txid: '...', ... };
    const { signature } = await client.signPondEntry(knownVtxo.txid);
    
    // Compare against known-good signature
    expect(signature).toBe(EXPECTED_SIGNATURE);
  });
});
```

### 3. Cross-Method Consistency

```typescript
describe('Method consistency', () => {
  it('sign() with bip86 matches signPondEntry for base VTXO', async () => {
    const message = `Showcase ${mockVtxo.txid}`;
    const hash = createHash('sha256').update(message).digest();
    
    const manualSig = await client.sign(hash, { tweakBehavior: 'bip86' });
    const { signature: pondSig } = await client.signPondEntry(mockVtxo.txid);
    
    expect(manualSig.toString('hex')).toBe(pondSig);
  });
});
```

## Manual Testing Checklist

### Environment Setup
- [ ] Build the project: `npm run build`
- [ ] Start Docker environment: `cd docker && docker compose up`
- [ ] Start web UI: Navigate to `http://localhost:3000`

### Test Scenarios

#### 1. Koi Showcase (Pond Entry) ✓
**Purpose**: Verify `signPondEntry` → `coreSign` with BIP-86 tweak

**Steps**:
1. Navigate to Koi Showcase page
2. Click "Enter Pond" on a VTXO
3. Sign the transaction
4. **Expected**: Signature accepted by ASP, entry recorded

**Verification**:
```bash
# Check ASP logs for signature verification
docker logs arkswap-asp-1 | grep "Pond entry"

# Query indexer for pond entries
curl http://localhost:3002/pond/entries | jq
```

#### 2. Koi Breeding ✓
**Purpose**: Verify `signBreedMessage` → `coreSign` with raw signing

**Steps**:
1. Navigate to Breeding page
2. Select two parent Koi
3. Click "Breed"
4. Sign the breeding message
5. **Expected**: Breeding request accepted, new Koi generated

**Verification**:
```bash
# Check ASP logs for breeding
docker logs arkswap-asp-1 | grep "Breed"

# Verify new Koi in wallet
curl http://localhost:3002/vtxos/user-address | jq '.[] | select(.metadata.generation > 0)'
```

#### 3. Koi Feeding ✓
**Purpose**: Verify `signFeedMessage` → `coreSign` with asset tweak

**Steps**:
1. Navigate to Koi details page
2. Click "Feed Koi"
3. Sign the feeding message
4. **Expected**: Koi XP increases, cooldown updated

**Verification**:
```bash
# Check updated XP and cooldown
curl http://localhost:3002/vtxos/user-address | jq '.[] | select(.txid == "TARGET_TXID") | {xp, lastFedBlock, cooldownBlock}'
```

#### 4. Asset VTXO Transfer ✓
**Purpose**: Verify `signInput` → `coreSign` with asset + Taproot tweak

**Steps**:
1. Navigate to Send page
2. Select an Asset VTXO (Koi)
3. Enter recipient address
4. Sign and send
5. **Expected**: Transaction succeeds, recipient receives Koi

**Verification**:
```bash
# Check transaction in mempool/blockchain
bitcoin-cli -regtest getrawmempool

# Verify recipient's VTXO
curl http://localhost:3002/vtxos/recipient-address | jq
```

#### 5. Base VTXO Transfer ✓
**Purpose**: Verify standard BIP-86 signing for non-asset transfers

**Steps**:
1. Navigate to Send page
2. Select a base VTXO (no metadata)
3. Enter recipient address
4. Sign and send
5. **Expected**: Transaction succeeds

## Integration Test Strategy

### Test Against Real ASP
```bash
# 1. Start local ASP
cd docker && docker compose up

# 2. Fund wallet
bitcoin-cli -regtest sendtoaddress <wallet-address> 1.0

# 3. Run integration test suite
npm run test:integration
```

### Cross-Client Verification
If the server has independent signature verification:
1. Sign a message with the SDK
2. Send signature + message to server
3. Verify server accepts it
4. **This confirms client/server cryptographic compatibility**

## Performance & Regression Testing

### Benchmark Signing Performance
```typescript
it('should sign 1000 messages in < 1 second', async () => {
  const start = Date.now();
  for (let i = 0; i < 1000; i++) {
    const hash = crypto.randomBytes(32);
    await client.sign(hash);
  }
  const duration = Date.now() - start;
  expect(duration).toBeLessThan(1000);
});
```

### Memory Leak Detection
```bash
# Run tests with memory profiling
node --expose-gc --max-old-space-size=100 node_modules/.bin/jest --detectLeaks
```

## Production Readiness Checklist

- [x] All existing tests pass (9/9)
- [ ] Edge case tests added
- [ ] Backwards compatibility verified
- [ ] Cross-method consistency validated
- [ ] Manual UI testing completed across all flows
- [ ] Integration tests with live ASP pass
- [ ] Performance benchmarks meet requirements
- [ ] No memory leaks detected
- [ ] Code review completed
- [ ] Documentation updated

## Known Limitations & Future Work

1. **Deterministic Signing**: Currently uses randomness. Consider RFC 6979 for deterministic k-value
2. **Hardware Wallet Support**: Future integration with Ledger/Trezor
3. **Multi-Sig**: Not yet supported, future enhancement

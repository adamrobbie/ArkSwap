# ArkWatch Solvency Engine Implementation Plan

## Goal Description
Implement the Solvency Engine for ArkWatch (Indexer). This involves tracking the Total Value Locked (TVL) in the ASP Pool and detecting Unilateral Exits (users forcing their funds out of L2 to L1).

## User Review Required
- **Database Schema Changes**: We will need to store `TVL` and `ExitEvents` in the database.
- **ASP Pool Identification**: I need to confirm how to identify the ASP's pool address on-chain.

## Proposed Changes

### Database (`packages/database`)
- Add `SolvencyMetric` model to `schema.prisma` to store TVL snapshots.
- Add `ExitEvent` model to store detected unilateral exits.

### Indexer (`apps/watch-indexer`)
#### `ScannerService` / `ParserService`
- **TVL Tracking**:
    - Identify the ASP Pool UTXOs.
    - Calculate the sum of values for these UTXOs at each block.
- **Unilateral Exit Detection**:
    - Monitor inputs of standard transactions.
    - If an input is a known VTXO (or matches VTXO logic) but the transaction is NOT an Ark Round (no `ARK` marker), flag it as a Unilateral Exit.

## Verification Plan
### Automated Tests
- Create unit tests for `ParserService` that simulate:
    - A standard Ark Round (should NOT match exit).
    - A Unilateral Exit tx (should MATCH exit).
    - TVL calculation updates.

### Manual Verification
- **Simulate Traffic**: Run the `traffic-gen` or manually create swaps.
- **Force Exit**: Use the "Simulate Backend Crash" feature in the UI -> Wait -> Claim Refund.
- **Verify**: Check `http://localhost:3002/watch/metrics` (new endpoint) to see TVL and Exit counts.

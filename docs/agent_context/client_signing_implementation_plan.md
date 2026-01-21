# Client Signing SDK Implementation Plan

## Goal Description
Implement the missing `sign()` method in `MockArkClient` and unify the fragmented signing logic across the SDK. This will resolve the "Identity Crisis" roadblock where different contexts (Pond, Breeding, Transfers) required manual, duplicated cryptographic tweaking.

## User Review Required
> [!IMPORTANT]
> The unified `sign()` method will take optional `Context` parameters to determine which tweaks (Asset, Taproot) to apply. This is a departure from the generic `sign(hash)` interface but is required for Ark's multi-layered security model.

## Proposed Changes

### Client SDK (`packages/client`)

#### [MODIFY] [index.ts](file:///Users/adamrobbie/Code/ArkSwap/packages/client/src/index.ts)
- **Implement `coreSign` (Private)**:
    - Centralize BIP-86 TapTweak logic.
    - Centralize Asset Tweak logic (for Koi assets).
    - Handle all parity checks and private key negations in one place.
- **Implement `sign` (Public)**:
    - Expose `sign(hash: Buffer, options?: SignOptions)`.
    - Default to standard Taproot (BIP-86) signing.
- **Refactor Specialized Signers**:
    - Update `signInput`, `signPondEntry`, and `signBreedMessage` to call `coreSign` instead of re-implementing math.

## Verification Plan

### Automated Tests
- **Expanded `client.spec.ts`**:
    - Add test cases for the new public `sign()` method.
    - Verify that `sign()` produces identical signatures to the refactored specialized methods.
    - Validate signatures against `bitcoinjs-lib` and `@bitcoinerlab/secp256k1` verification logic.

### Manual Verification
- **Web UI Test**: Run the local web app and perform a "Koi Showcase" or "Breed" action to ensure the UI-layer signing remains functional.

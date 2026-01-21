import { MockArkClient, walletTools } from '../src/index';
import {
    asTxId,
    asAddress,
    getAssetHash,
    createAssetPayToPublicKey,
} from '@arkswap/protocol';
import type { Vtxo, AssetMetadata } from '@arkswap/protocol';
import { createHash } from 'crypto';

describe('sign() - Error Handling & Edge Cases', () => {
    let client: MockArkClient;
    let mockVtxo: Vtxo;
    let walletAddress: string;

    beforeEach(async () => {
        client = new MockArkClient();
        walletAddress = await client.createWallet();
        client.addVtxo(walletAddress, 1000);
        const vtxos = client.getVtxos(walletAddress);
        mockVtxo = vtxos[0];
    });

    afterEach(() => {
        if (typeof window !== 'undefined' && window.localStorage) {
            window.localStorage.clear();
        }
    });

    it('should throw error when asset metadata is missing for asset tweak', async () => {
        const hash = createHash('sha256').update('test').digest();

        await expect(
            client.sign(hash, { tweakBehavior: 'asset' })
        ).rejects.toThrow('Asset metadata required');
    });

    it('should handle all valid tweak behaviors', async () => {
        const hash = createHash('sha256').update('test').digest();

        // BIP-86
        const sig1 = await client.sign(hash, { tweakBehavior: 'bip86' });
        expect(sig1).toBeInstanceOf(Buffer);
        expect(sig1.length).toBe(64);

        // None
        const sig2 = await client.sign(hash, { tweakBehavior: 'none' });
        expect(sig2).toBeInstanceOf(Buffer);
        expect(sig2.length).toBe(64);

        // Signatures should differ
        expect(sig1.toString('hex')).not.toBe(sig2.toString('hex'));
    });

    it('should default to bip86 when no options provided', async () => {
        const hash = createHash('sha256').update('test').digest();

        const sig1 = await client.sign(hash);
        const sig2 = await client.sign(hash, { tweakBehavior: 'bip86' });

        expect(sig1).toBeInstanceOf(Buffer);
        expect(sig2).toBeInstanceOf(Buffer);
    });

    it('should produce valid signatures for edge case hashes', async () => {
        const { ecc } = walletTools;
        const pubkey = await client.getPublicKey();
        const pubkeyBuffer = Buffer.isBuffer(pubkey) ? pubkey : Buffer.from(pubkey as any, 'hex');

        // All zeros
        const zeroHash = Buffer.alloc(32, 0);
        const sig1 = await client.sign(zeroHash, { tweakBehavior: 'none' });
        expect(ecc.verifySchnorr(
            new Uint8Array(zeroHash),
            new Uint8Array(pubkeyBuffer),
            new Uint8Array(sig1)
        )).toBe(true);

        // All ones
        const oneHash = Buffer.alloc(32, 0xff);
        const sig2 = await client.sign(oneHash, { tweakBehavior: 'none' });
        expect(ecc.verifySchnorr(
            new Uint8Array(oneHash),
            new Uint8Array(pubkeyBuffer),
            new Uint8Array(sig2)
        )).toBe(true);
    });

    it('should verify cross-method consistency with signPondEntry', async () => {
        const message = `Showcase ${mockVtxo.txid}`;
        const hash = createHash('sha256').update(message).digest();

        const { signature: pondSigHex } = await client.signPondEntry(mockVtxo.txid);
        const directSig = await client.sign(hash, { tweakBehavior: 'bip86' });

        // Both should verify against the tweaked pubkey
        const { bitcoin, ecc } = walletTools;
        const outputScript = bitcoin.address.toOutputScript(walletAddress, bitcoin.networks.regtest);
        const tweakedPubkey = Buffer.from(outputScript.slice(2, 34));

        const isValid1 = ecc.verifySchnorr(hash, tweakedPubkey, Buffer.from(pondSigHex, 'hex'));
        const isValid2 = ecc.verifySchnorr(hash, tweakedPubkey, directSig);

        expect(isValid1).toBe(true);
        expect(isValid2).toBe(true);
    });
});

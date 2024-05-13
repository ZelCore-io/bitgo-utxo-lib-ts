"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const assert = require("assert");
const bs58check = require("bs58check");
const address_1 = require("../../../src/address");
const outputScripts_1 = require("../../../src/bitgo/outputScripts");
const testutil_1 = require("../../../src/testutil");
const src_1 = require("../../../src");
const bitgo_1 = require("../../../src/bitgo");
const PsbtOutputs_1 = require("../../../src/bitgo/wallet/psbt/PsbtOutputs");
const network = src_1.networks.bitcoin;
const rootWalletKeys = (0, testutil_1.getDefaultWalletKeys)();
describe('psbt internal and wallet outputs', function () {
    const value = BigInt(1e8);
    const fee = BigInt(1000);
    const externalAddress = (0, address_1.fromOutputScript)((0, outputScripts_1.createOutputScriptP2shP2pk)(testutil_1.replayProtectionKeyPair.publicKey).scriptPubKey, src_1.networks.bitcoin);
    describe('success', function () {
        it(`Find indices of psbt wallet & internal outputs`, function () {
            const psbt = src_1.testutil.constructPsbt([
                { scriptType: 'p2wsh', value: BigInt(value + value) },
                { scriptType: 'p2shP2wsh', value: BigInt(value) },
                { scriptType: 'p2trMusig2', value: BigInt(value) },
                { scriptType: 'p2tr', value: BigInt(value) },
                { scriptType: 'p2sh', value: BigInt(value) },
            ], [
                { scriptType: 'p2sh', value: BigInt(value) },
                { scriptType: 'p2shP2wsh', value: BigInt(value) },
                { scriptType: 'p2wsh', value: BigInt(value) },
                {
                    address: externalAddress,
                    value: BigInt(value - fee),
                },
                { scriptType: 'p2tr', value: BigInt(value), isInternalAddress: true },
                { scriptType: 'p2trMusig2', value: BigInt(value), isInternalAddress: true },
            ], network, rootWalletKeys, 'unsigned');
            const expected = [0, 1, 2, 4, 5];
            assert.deepEqual((0, PsbtOutputs_1.findWalletOutputIndices)(psbt, rootWalletKeys.triple), expected);
            (0, bitgo_1.addXpubsToPsbt)(psbt, rootWalletKeys);
            assert.deepEqual((0, PsbtOutputs_1.findInternalOutputIndices)(psbt), expected);
        });
        outputScripts_1.scriptTypes2Of3.forEach((scriptType) => {
            const psbt = src_1.testutil.constructPsbt([
                { scriptType: scriptType, value: BigInt(value) },
                { scriptType: 'p2wsh', value: BigInt(value) },
                { scriptType: 'p2shP2wsh', value: BigInt(value) },
                { scriptType: 'p2trMusig2', value: BigInt(value) },
                { scriptType: 'p2tr', value: BigInt(value) },
                { scriptType: 'p2sh', value: BigInt(value) },
            ], [
                { scriptType: 'p2sh', value: BigInt(value) },
                { scriptType: 'p2shP2wsh', value: BigInt(value) },
                { scriptType: 'p2wsh', value: BigInt(value) },
                {
                    address: externalAddress,
                    value: BigInt(value - fee),
                },
                { scriptType: 'p2tr', value: BigInt(value), isInternalAddress: true },
                { scriptType: 'p2trMusig2', value: BigInt(value), isInternalAddress: true },
            ], network, rootWalletKeys, 'unsigned');
            (0, bitgo_1.addXpubsToPsbt)(psbt, rootWalletKeys);
            const totalInternalAmount = value * BigInt(psbt.inputCount - 1);
            it(`PSBT with ${scriptType} input and globalXpub`, function () {
                assert.strictEqual((0, PsbtOutputs_1.getTotalAmountOfInternalOutputs)(psbt), totalInternalAmount);
            });
            it(`Cloned PSBT with ${scriptType} input and globalXpub`, function () {
                assert.strictEqual((0, PsbtOutputs_1.getTotalAmountOfInternalOutputs)(psbt.clone()), totalInternalAmount);
            });
            it(`PSBT with ${scriptType} input and ordered rootNodes`, function () {
                assert.strictEqual((0, PsbtOutputs_1.getTotalAmountOfWalletOutputs)(psbt, rootWalletKeys.triple), totalInternalAmount);
            });
        });
        it(`PSBT with p2shP2pk as first input`, function () {
            const psbt = src_1.testutil.constructPsbt([
                { scriptType: 'p2shP2pk', value: BigInt(value) },
                { scriptType: 'p2wsh', value: BigInt(value) },
            ], [
                { scriptType: 'p2sh', value: BigInt(value) },
                {
                    address: externalAddress,
                    value: BigInt(value - fee),
                },
            ], network, rootWalletKeys, 'unsigned');
            (0, bitgo_1.addXpubsToPsbt)(psbt, rootWalletKeys);
            assert.strictEqual((0, PsbtOutputs_1.getTotalAmountOfInternalOutputs)(psbt), value);
        });
        it(`PSBT with outputs of external wallet root nodes`, function () {
            const psbt = src_1.testutil.constructPsbt([{ scriptType: 'p2wsh', value: BigInt(value) }], [{ scriptType: 'p2sh', value: BigInt(value) }], network, rootWalletKeys, 'unsigned');
            const externalAmount = BigInt(8888);
            const externalRootWalletKeys = new bitgo_1.RootWalletKeys((0, testutil_1.getKeyTriple)('dummy'));
            const indices = [0, 1];
            indices.forEach((index) => (0, bitgo_1.addWalletOutputToPsbt)(psbt, externalRootWalletKeys, (0, bitgo_1.getExternalChainCode)('p2wsh'), index, externalAmount));
            assert.strictEqual((0, PsbtOutputs_1.getTotalAmountOfWalletOutputs)(psbt, externalRootWalletKeys.triple), externalAmount * BigInt(indices.length));
        });
        it(`PSBT with no outputs of external wallet root nodes`, function () {
            const psbt = src_1.testutil.constructPsbt([{ scriptType: 'p2wsh', value: BigInt(value) }], [{ scriptType: 'p2sh', value: BigInt(value) }], network, rootWalletKeys, 'unsigned');
            assert.strictEqual((0, PsbtOutputs_1.getTotalAmountOfWalletOutputs)(psbt, new bitgo_1.RootWalletKeys((0, testutil_1.getKeyTriple)('dummy')).triple), BigInt(0));
        });
        it(`PSBT with no internal output`, function () {
            const psbt = src_1.testutil.constructPsbt([{ scriptType: 'p2wsh', value: BigInt(value) }], [
                {
                    address: externalAddress,
                    value: BigInt(value - fee),
                },
            ], network, rootWalletKeys, 'unsigned');
            (0, bitgo_1.addXpubsToPsbt)(psbt, rootWalletKeys);
            assert.strictEqual((0, PsbtOutputs_1.getTotalAmountOfInternalOutputs)(psbt), BigInt(0));
        });
    });
    describe('failure', function () {
        it('PSBT without globalXpub', function () {
            const psbt = src_1.testutil.constructPsbt([], [], network, rootWalletKeys, 'unsigned');
            assert.throws(() => (0, PsbtOutputs_1.getTotalAmountOfInternalOutputs)(psbt), (e) => e.message === 'Could not find root nodes in PSBT');
        });
        it('PSBT with invalid number of globalXpub', function () {
            const psbt = src_1.testutil.constructPsbt([], [], network, rootWalletKeys, 'unsigned');
            const globalXpub = [
                {
                    extendedPubkey: bs58check.decode(rootWalletKeys.triple[0].neutered().toBase58()),
                    masterFingerprint: rootWalletKeys.triple[0].fingerprint,
                    path: 'm',
                },
            ];
            psbt.updateGlobal({ globalXpub });
            assert.throws(() => (0, PsbtOutputs_1.getTotalAmountOfInternalOutputs)(psbt), (e) => e.message === 'Invalid globalXpubs in PSBT. Expected 3 or none. Got 1');
        });
        it('PSBT without input scriptPubKey', function () {
            const psbt = src_1.testutil.constructPsbt([{ scriptType: 'p2wsh', value: BigInt(value) }], [
                {
                    address: externalAddress,
                    value: BigInt(value - fee),
                },
            ], network, rootWalletKeys, 'unsigned');
            psbt.data.inputs[0].witnessUtxo = undefined;
            (0, bitgo_1.addXpubsToPsbt)(psbt, rootWalletKeys);
            assert.throws(() => (0, PsbtOutputs_1.getTotalAmountOfInternalOutputs)(psbt), (e) => e.message === 'Input scriptPubKey can not be found');
        });
        it('PSBT without input Bip32Derivation', function () {
            const psbt = src_1.testutil.constructPsbt([{ scriptType: 'p2wsh', value: BigInt(value) }], [
                {
                    address: externalAddress,
                    value: BigInt(value - fee),
                },
            ], network, rootWalletKeys, 'unsigned');
            psbt.data.inputs[0].bip32Derivation = undefined;
            (0, bitgo_1.addXpubsToPsbt)(psbt, rootWalletKeys);
            assert.throws(() => (0, PsbtOutputs_1.getTotalAmountOfInternalOutputs)(psbt), (e) => e.message === 'Input Bip32Derivation can not be found');
        });
    });
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiUHNidE91dHB1dHMuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi90ZXN0L2JpdGdvL3BzYnQvUHNidE91dHB1dHMudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7QUFBQSxpQ0FBaUM7QUFFakMsdUNBQXVDO0FBRXZDLGtEQUF3RDtBQUN4RCxvRUFBK0Y7QUFDL0Ysb0RBQW9HO0FBQ3BHLHNDQUFrRDtBQUNsRCw4Q0FBaUg7QUFDakgsNEVBS29EO0FBR3BELE1BQU0sT0FBTyxHQUFHLGNBQVEsQ0FBQyxPQUFPLENBQUM7QUFDakMsTUFBTSxjQUFjLEdBQUcsSUFBQSwrQkFBb0IsR0FBRSxDQUFDO0FBRTlDLFFBQVEsQ0FBQyxrQ0FBa0MsRUFBRTtJQUMzQyxNQUFNLEtBQUssR0FBRyxNQUFNLENBQUMsR0FBRyxDQUFDLENBQUM7SUFDMUIsTUFBTSxHQUFHLEdBQUcsTUFBTSxDQUFDLElBQUksQ0FBQyxDQUFDO0lBQ3pCLE1BQU0sZUFBZSxHQUFHLElBQUEsMEJBQWdCLEVBQ3RDLElBQUEsMENBQTBCLEVBQUMsa0NBQXVCLENBQUMsU0FBUyxDQUFDLENBQUMsWUFBWSxFQUMxRSxjQUFRLENBQUMsT0FBTyxDQUNqQixDQUFDO0lBRUYsUUFBUSxDQUFDLFNBQVMsRUFBRTtRQUNsQixFQUFFLENBQUMsZ0RBQWdELEVBQUU7WUFDbkQsTUFBTSxJQUFJLEdBQUcsY0FBUSxDQUFDLGFBQWEsQ0FDakM7Z0JBQ0UsRUFBRSxVQUFVLEVBQUUsT0FBTyxFQUFFLEtBQUssRUFBRSxNQUFNLENBQUMsS0FBSyxHQUFHLEtBQUssQ0FBQyxFQUFFO2dCQUNyRCxFQUFFLFVBQVUsRUFBRSxXQUFXLEVBQUUsS0FBSyxFQUFFLE1BQU0sQ0FBQyxLQUFLLENBQUMsRUFBRTtnQkFDakQsRUFBRSxVQUFVLEVBQUUsWUFBWSxFQUFFLEtBQUssRUFBRSxNQUFNLENBQUMsS0FBSyxDQUFDLEVBQUU7Z0JBQ2xELEVBQUUsVUFBVSxFQUFFLE1BQU0sRUFBRSxLQUFLLEVBQUUsTUFBTSxDQUFDLEtBQUssQ0FBQyxFQUFFO2dCQUM1QyxFQUFFLFVBQVUsRUFBRSxNQUFNLEVBQUUsS0FBSyxFQUFFLE1BQU0sQ0FBQyxLQUFLLENBQUMsRUFBRTthQUM3QyxFQUNEO2dCQUNFLEVBQUUsVUFBVSxFQUFFLE1BQU0sRUFBRSxLQUFLLEVBQUUsTUFBTSxDQUFDLEtBQUssQ0FBQyxFQUFFO2dCQUM1QyxFQUFFLFVBQVUsRUFBRSxXQUFXLEVBQUUsS0FBSyxFQUFFLE1BQU0sQ0FBQyxLQUFLLENBQUMsRUFBRTtnQkFDakQsRUFBRSxVQUFVLEVBQUUsT0FBTyxFQUFFLEtBQUssRUFBRSxNQUFNLENBQUMsS0FBSyxDQUFDLEVBQUU7Z0JBQzdDO29CQUNFLE9BQU8sRUFBRSxlQUFlO29CQUN4QixLQUFLLEVBQUUsTUFBTSxDQUFDLEtBQUssR0FBRyxHQUFHLENBQUM7aUJBQzNCO2dCQUNELEVBQUUsVUFBVSxFQUFFLE1BQU0sRUFBRSxLQUFLLEVBQUUsTUFBTSxDQUFDLEtBQUssQ0FBQyxFQUFFLGlCQUFpQixFQUFFLElBQUksRUFBRTtnQkFDckUsRUFBRSxVQUFVLEVBQUUsWUFBWSxFQUFFLEtBQUssRUFBRSxNQUFNLENBQUMsS0FBSyxDQUFDLEVBQUUsaUJBQWlCLEVBQUUsSUFBSSxFQUFFO2FBQzVFLEVBQ0QsT0FBTyxFQUNQLGNBQWMsRUFDZCxVQUFVLENBQ1gsQ0FBQztZQUNGLE1BQU0sUUFBUSxHQUFHLENBQUMsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDO1lBQ2pDLE1BQU0sQ0FBQyxTQUFTLENBQUMsSUFBQSxxQ0FBdUIsRUFBQyxJQUFJLEVBQUUsY0FBYyxDQUFDLE1BQU0sQ0FBQyxFQUFFLFFBQVEsQ0FBQyxDQUFDO1lBQ2pGLElBQUEsc0JBQWMsRUFBQyxJQUFJLEVBQUUsY0FBYyxDQUFDLENBQUM7WUFDckMsTUFBTSxDQUFDLFNBQVMsQ0FBQyxJQUFBLHVDQUF5QixFQUFDLElBQUksQ0FBQyxFQUFFLFFBQVEsQ0FBQyxDQUFDO1FBQzlELENBQUMsQ0FBQyxDQUFDO1FBRUgsK0JBQWUsQ0FBQyxPQUFPLENBQUMsQ0FBQyxVQUFVLEVBQUUsRUFBRTtZQUNyQyxNQUFNLElBQUksR0FBRyxjQUFRLENBQUMsYUFBYSxDQUNqQztnQkFDRSxFQUFFLFVBQVUsRUFBRSxVQUFVLEVBQUUsS0FBSyxFQUFFLE1BQU0sQ0FBQyxLQUFLLENBQUMsRUFBRTtnQkFDaEQsRUFBRSxVQUFVLEVBQUUsT0FBTyxFQUFFLEtBQUssRUFBRSxNQUFNLENBQUMsS0FBSyxDQUFDLEVBQUU7Z0JBQzdDLEVBQUUsVUFBVSxFQUFFLFdBQVcsRUFBRSxLQUFLLEVBQUUsTUFBTSxDQUFDLEtBQUssQ0FBQyxFQUFFO2dCQUNqRCxFQUFFLFVBQVUsRUFBRSxZQUFZLEVBQUUsS0FBSyxFQUFFLE1BQU0sQ0FBQyxLQUFLLENBQUMsRUFBRTtnQkFDbEQsRUFBRSxVQUFVLEVBQUUsTUFBTSxFQUFFLEtBQUssRUFBRSxNQUFNLENBQUMsS0FBSyxDQUFDLEVBQUU7Z0JBQzVDLEVBQUUsVUFBVSxFQUFFLE1BQU0sRUFBRSxLQUFLLEVBQUUsTUFBTSxDQUFDLEtBQUssQ0FBQyxFQUFFO2FBQzdDLEVBQ0Q7Z0JBQ0UsRUFBRSxVQUFVLEVBQUUsTUFBTSxFQUFFLEtBQUssRUFBRSxNQUFNLENBQUMsS0FBSyxDQUFDLEVBQUU7Z0JBQzVDLEVBQUUsVUFBVSxFQUFFLFdBQVcsRUFBRSxLQUFLLEVBQUUsTUFBTSxDQUFDLEtBQUssQ0FBQyxFQUFFO2dCQUNqRCxFQUFFLFVBQVUsRUFBRSxPQUFPLEVBQUUsS0FBSyxFQUFFLE1BQU0sQ0FBQyxLQUFLLENBQUMsRUFBRTtnQkFDN0M7b0JBQ0UsT0FBTyxFQUFFLGVBQWU7b0JBQ3hCLEtBQUssRUFBRSxNQUFNLENBQUMsS0FBSyxHQUFHLEdBQUcsQ0FBQztpQkFDM0I7Z0JBQ0QsRUFBRSxVQUFVLEVBQUUsTUFBTSxFQUFFLEtBQUssRUFBRSxNQUFNLENBQUMsS0FBSyxDQUFDLEVBQUUsaUJBQWlCLEVBQUUsSUFBSSxFQUFFO2dCQUNyRSxFQUFFLFVBQVUsRUFBRSxZQUFZLEVBQUUsS0FBSyxFQUFFLE1BQU0sQ0FBQyxLQUFLLENBQUMsRUFBRSxpQkFBaUIsRUFBRSxJQUFJLEVBQUU7YUFDNUUsRUFDRCxPQUFPLEVBQ1AsY0FBYyxFQUNkLFVBQVUsQ0FDWCxDQUFDO1lBRUYsSUFBQSxzQkFBYyxFQUFDLElBQUksRUFBRSxjQUFjLENBQUMsQ0FBQztZQUVyQyxNQUFNLG1CQUFtQixHQUFHLEtBQUssR0FBRyxNQUFNLENBQUMsSUFBSSxDQUFDLFVBQVUsR0FBRyxDQUFDLENBQUMsQ0FBQztZQUVoRSxFQUFFLENBQUMsYUFBYSxVQUFVLHVCQUF1QixFQUFFO2dCQUNqRCxNQUFNLENBQUMsV0FBVyxDQUFDLElBQUEsNkNBQStCLEVBQUMsSUFBSSxDQUFDLEVBQUUsbUJBQW1CLENBQUMsQ0FBQztZQUNqRixDQUFDLENBQUMsQ0FBQztZQUVILEVBQUUsQ0FBQyxvQkFBb0IsVUFBVSx1QkFBdUIsRUFBRTtnQkFDeEQsTUFBTSxDQUFDLFdBQVcsQ0FBQyxJQUFBLDZDQUErQixFQUFDLElBQUksQ0FBQyxLQUFLLEVBQUUsQ0FBQyxFQUFFLG1CQUFtQixDQUFDLENBQUM7WUFDekYsQ0FBQyxDQUFDLENBQUM7WUFFSCxFQUFFLENBQUMsYUFBYSxVQUFVLDhCQUE4QixFQUFFO2dCQUN4RCxNQUFNLENBQUMsV0FBVyxDQUFDLElBQUEsMkNBQTZCLEVBQUMsSUFBSSxFQUFFLGNBQWMsQ0FBQyxNQUFNLENBQUMsRUFBRSxtQkFBbUIsQ0FBQyxDQUFDO1lBQ3RHLENBQUMsQ0FBQyxDQUFDO1FBQ0wsQ0FBQyxDQUFDLENBQUM7UUFFSCxFQUFFLENBQUMsbUNBQW1DLEVBQUU7WUFDdEMsTUFBTSxJQUFJLEdBQUcsY0FBUSxDQUFDLGFBQWEsQ0FDakM7Z0JBQ0UsRUFBRSxVQUFVLEVBQUUsVUFBVSxFQUFFLEtBQUssRUFBRSxNQUFNLENBQUMsS0FBSyxDQUFDLEVBQUU7Z0JBQ2hELEVBQUUsVUFBVSxFQUFFLE9BQU8sRUFBRSxLQUFLLEVBQUUsTUFBTSxDQUFDLEtBQUssQ0FBQyxFQUFFO2FBQzlDLEVBQ0Q7Z0JBQ0UsRUFBRSxVQUFVLEVBQUUsTUFBTSxFQUFFLEtBQUssRUFBRSxNQUFNLENBQUMsS0FBSyxDQUFDLEVBQUU7Z0JBQzVDO29CQUNFLE9BQU8sRUFBRSxlQUFlO29CQUN4QixLQUFLLEVBQUUsTUFBTSxDQUFDLEtBQUssR0FBRyxHQUFHLENBQUM7aUJBQzNCO2FBQ0YsRUFDRCxPQUFPLEVBQ1AsY0FBYyxFQUNkLFVBQVUsQ0FDWCxDQUFDO1lBQ0YsSUFBQSxzQkFBYyxFQUFDLElBQUksRUFBRSxjQUFjLENBQUMsQ0FBQztZQUNyQyxNQUFNLENBQUMsV0FBVyxDQUFDLElBQUEsNkNBQStCLEVBQUMsSUFBSSxDQUFDLEVBQUUsS0FBSyxDQUFDLENBQUM7UUFDbkUsQ0FBQyxDQUFDLENBQUM7UUFFSCxFQUFFLENBQUMsaURBQWlELEVBQUU7WUFDcEQsTUFBTSxJQUFJLEdBQUcsY0FBUSxDQUFDLGFBQWEsQ0FDakMsQ0FBQyxFQUFFLFVBQVUsRUFBRSxPQUFPLEVBQUUsS0FBSyxFQUFFLE1BQU0sQ0FBQyxLQUFLLENBQUMsRUFBRSxDQUFDLEVBQy9DLENBQUMsRUFBRSxVQUFVLEVBQUUsTUFBTSxFQUFFLEtBQUssRUFBRSxNQUFNLENBQUMsS0FBSyxDQUFDLEVBQUUsQ0FBQyxFQUM5QyxPQUFPLEVBQ1AsY0FBYyxFQUNkLFVBQVUsQ0FDWCxDQUFDO1lBQ0YsTUFBTSxjQUFjLEdBQUcsTUFBTSxDQUFDLElBQUksQ0FBQyxDQUFDO1lBQ3BDLE1BQU0sc0JBQXNCLEdBQUcsSUFBSSxzQkFBYyxDQUFDLElBQUEsdUJBQVksRUFBQyxPQUFPLENBQUMsQ0FBQyxDQUFDO1lBQ3pFLE1BQU0sT0FBTyxHQUFHLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDO1lBQ3ZCLE9BQU8sQ0FBQyxPQUFPLENBQUMsQ0FBQyxLQUFLLEVBQUUsRUFBRSxDQUN4QixJQUFBLDZCQUFxQixFQUFDLElBQUksRUFBRSxzQkFBc0IsRUFBRSxJQUFBLDRCQUFvQixFQUFDLE9BQU8sQ0FBQyxFQUFFLEtBQUssRUFBRSxjQUFjLENBQUMsQ0FDMUcsQ0FBQztZQUNGLE1BQU0sQ0FBQyxXQUFXLENBQ2hCLElBQUEsMkNBQTZCLEVBQUMsSUFBSSxFQUFFLHNCQUFzQixDQUFDLE1BQU0sQ0FBQyxFQUNsRSxjQUFjLEdBQUcsTUFBTSxDQUFDLE9BQU8sQ0FBQyxNQUFNLENBQUMsQ0FDeEMsQ0FBQztRQUNKLENBQUMsQ0FBQyxDQUFDO1FBRUgsRUFBRSxDQUFDLG9EQUFvRCxFQUFFO1lBQ3ZELE1BQU0sSUFBSSxHQUFHLGNBQVEsQ0FBQyxhQUFhLENBQ2pDLENBQUMsRUFBRSxVQUFVLEVBQUUsT0FBTyxFQUFFLEtBQUssRUFBRSxNQUFNLENBQUMsS0FBSyxDQUFDLEVBQUUsQ0FBQyxFQUMvQyxDQUFDLEVBQUUsVUFBVSxFQUFFLE1BQU0sRUFBRSxLQUFLLEVBQUUsTUFBTSxDQUFDLEtBQUssQ0FBQyxFQUFFLENBQUMsRUFDOUMsT0FBTyxFQUNQLGNBQWMsRUFDZCxVQUFVLENBQ1gsQ0FBQztZQUNGLE1BQU0sQ0FBQyxXQUFXLENBQ2hCLElBQUEsMkNBQTZCLEVBQUMsSUFBSSxFQUFFLElBQUksc0JBQWMsQ0FBQyxJQUFBLHVCQUFZLEVBQUMsT0FBTyxDQUFDLENBQUMsQ0FBQyxNQUFNLENBQUMsRUFDckYsTUFBTSxDQUFDLENBQUMsQ0FBQyxDQUNWLENBQUM7UUFDSixDQUFDLENBQUMsQ0FBQztRQUVILEVBQUUsQ0FBQyw4QkFBOEIsRUFBRTtZQUNqQyxNQUFNLElBQUksR0FBRyxjQUFRLENBQUMsYUFBYSxDQUNqQyxDQUFDLEVBQUUsVUFBVSxFQUFFLE9BQU8sRUFBRSxLQUFLLEVBQUUsTUFBTSxDQUFDLEtBQUssQ0FBQyxFQUFFLENBQUMsRUFDL0M7Z0JBQ0U7b0JBQ0UsT0FBTyxFQUFFLGVBQWU7b0JBQ3hCLEtBQUssRUFBRSxNQUFNLENBQUMsS0FBSyxHQUFHLEdBQUcsQ0FBQztpQkFDM0I7YUFDRixFQUNELE9BQU8sRUFDUCxjQUFjLEVBQ2QsVUFBVSxDQUNYLENBQUM7WUFDRixJQUFBLHNCQUFjLEVBQUMsSUFBSSxFQUFFLGNBQWMsQ0FBQyxDQUFDO1lBQ3JDLE1BQU0sQ0FBQyxXQUFXLENBQUMsSUFBQSw2Q0FBK0IsRUFBQyxJQUFJLENBQUMsRUFBRSxNQUFNLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztRQUN2RSxDQUFDLENBQUMsQ0FBQztJQUNMLENBQUMsQ0FBQyxDQUFDO0lBRUgsUUFBUSxDQUFDLFNBQVMsRUFBRTtRQUNsQixFQUFFLENBQUMseUJBQXlCLEVBQUU7WUFDNUIsTUFBTSxJQUFJLEdBQUcsY0FBUSxDQUFDLGFBQWEsQ0FBQyxFQUFFLEVBQUUsRUFBRSxFQUFFLE9BQU8sRUFBRSxjQUFjLEVBQUUsVUFBVSxDQUFDLENBQUM7WUFDakYsTUFBTSxDQUFDLE1BQU0sQ0FDWCxHQUFHLEVBQUUsQ0FBQyxJQUFBLDZDQUErQixFQUFDLElBQUksQ0FBQyxFQUMzQyxDQUFDLENBQU0sRUFBRSxFQUFFLENBQUMsQ0FBQyxDQUFDLE9BQU8sS0FBSyxtQ0FBbUMsQ0FDOUQsQ0FBQztRQUNKLENBQUMsQ0FBQyxDQUFDO1FBRUgsRUFBRSxDQUFDLHdDQUF3QyxFQUFFO1lBQzNDLE1BQU0sSUFBSSxHQUFHLGNBQVEsQ0FBQyxhQUFhLENBQUMsRUFBRSxFQUFFLEVBQUUsRUFBRSxPQUFPLEVBQUUsY0FBYyxFQUFFLFVBQVUsQ0FBQyxDQUFDO1lBQ2pGLE1BQU0sVUFBVSxHQUFpQjtnQkFDL0I7b0JBQ0UsY0FBYyxFQUFFLFNBQVMsQ0FBQyxNQUFNLENBQUMsY0FBYyxDQUFDLE1BQU0sQ0FBQyxDQUFDLENBQUMsQ0FBQyxRQUFRLEVBQUUsQ0FBQyxRQUFRLEVBQUUsQ0FBQztvQkFDaEYsaUJBQWlCLEVBQUUsY0FBYyxDQUFDLE1BQU0sQ0FBQyxDQUFDLENBQUMsQ0FBQyxXQUFXO29CQUN2RCxJQUFJLEVBQUUsR0FBRztpQkFDVjthQUNGLENBQUM7WUFDRixJQUFJLENBQUMsWUFBWSxDQUFDLEVBQUUsVUFBVSxFQUFFLENBQUMsQ0FBQztZQUNsQyxNQUFNLENBQUMsTUFBTSxDQUNYLEdBQUcsRUFBRSxDQUFDLElBQUEsNkNBQStCLEVBQUMsSUFBSSxDQUFDLEVBQzNDLENBQUMsQ0FBTSxFQUFFLEVBQUUsQ0FBQyxDQUFDLENBQUMsT0FBTyxLQUFLLHdEQUF3RCxDQUNuRixDQUFDO1FBQ0osQ0FBQyxDQUFDLENBQUM7UUFFSCxFQUFFLENBQUMsaUNBQWlDLEVBQUU7WUFDcEMsTUFBTSxJQUFJLEdBQUcsY0FBUSxDQUFDLGFBQWEsQ0FDakMsQ0FBQyxFQUFFLFVBQVUsRUFBRSxPQUFPLEVBQUUsS0FBSyxFQUFFLE1BQU0sQ0FBQyxLQUFLLENBQUMsRUFBRSxDQUFDLEVBQy9DO2dCQUNFO29CQUNFLE9BQU8sRUFBRSxlQUFlO29CQUN4QixLQUFLLEVBQUUsTUFBTSxDQUFDLEtBQUssR0FBRyxHQUFHLENBQUM7aUJBQzNCO2FBQ0YsRUFDRCxPQUFPLEVBQ1AsY0FBYyxFQUNkLFVBQVUsQ0FDWCxDQUFDO1lBQ0YsSUFBSSxDQUFDLElBQUksQ0FBQyxNQUFNLENBQUMsQ0FBQyxDQUFDLENBQUMsV0FBVyxHQUFHLFNBQVMsQ0FBQztZQUM1QyxJQUFBLHNCQUFjLEVBQUMsSUFBSSxFQUFFLGNBQWMsQ0FBQyxDQUFDO1lBQ3JDLE1BQU0sQ0FBQyxNQUFNLENBQ1gsR0FBRyxFQUFFLENBQUMsSUFBQSw2Q0FBK0IsRUFBQyxJQUFJLENBQUMsRUFDM0MsQ0FBQyxDQUFNLEVBQUUsRUFBRSxDQUFDLENBQUMsQ0FBQyxPQUFPLEtBQUsscUNBQXFDLENBQ2hFLENBQUM7UUFDSixDQUFDLENBQUMsQ0FBQztRQUVILEVBQUUsQ0FBQyxvQ0FBb0MsRUFBRTtZQUN2QyxNQUFNLElBQUksR0FBRyxjQUFRLENBQUMsYUFBYSxDQUNqQyxDQUFDLEVBQUUsVUFBVSxFQUFFLE9BQU8sRUFBRSxLQUFLLEVBQUUsTUFBTSxDQUFDLEtBQUssQ0FBQyxFQUFFLENBQUMsRUFDL0M7Z0JBQ0U7b0JBQ0UsT0FBTyxFQUFFLGVBQWU7b0JBQ3hCLEtBQUssRUFBRSxNQUFNLENBQUMsS0FBSyxHQUFHLEdBQUcsQ0FBQztpQkFDM0I7YUFDRixFQUNELE9BQU8sRUFDUCxjQUFjLEVBQ2QsVUFBVSxDQUNYLENBQUM7WUFDRixJQUFJLENBQUMsSUFBSSxDQUFDLE1BQU0sQ0FBQyxDQUFDLENBQUMsQ0FBQyxlQUFlLEdBQUcsU0FBUyxDQUFDO1lBQ2hELElBQUEsc0JBQWMsRUFBQyxJQUFJLEVBQUUsY0FBYyxDQUFDLENBQUM7WUFDckMsTUFBTSxDQUFDLE1BQU0sQ0FDWCxHQUFHLEVBQUUsQ0FBQyxJQUFBLDZDQUErQixFQUFDLElBQUksQ0FBQyxFQUMzQyxDQUFDLENBQU0sRUFBRSxFQUFFLENBQUMsQ0FBQyxDQUFDLE9BQU8sS0FBSyx3Q0FBd0MsQ0FDbkUsQ0FBQztRQUNKLENBQUMsQ0FBQyxDQUFDO0lBQ0wsQ0FBQyxDQUFDLENBQUM7QUFDTCxDQUFDLENBQUMsQ0FBQyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCAqIGFzIGFzc2VydCBmcm9tICdhc3NlcnQnO1xyXG5cclxuaW1wb3J0ICogYXMgYnM1OGNoZWNrIGZyb20gJ2JzNThjaGVjayc7XHJcblxyXG5pbXBvcnQgeyBmcm9tT3V0cHV0U2NyaXB0IH0gZnJvbSAnLi4vLi4vLi4vc3JjL2FkZHJlc3MnO1xyXG5pbXBvcnQgeyBjcmVhdGVPdXRwdXRTY3JpcHRQMnNoUDJwaywgc2NyaXB0VHlwZXMyT2YzIH0gZnJvbSAnLi4vLi4vLi4vc3JjL2JpdGdvL291dHB1dFNjcmlwdHMnO1xyXG5pbXBvcnQgeyBnZXREZWZhdWx0V2FsbGV0S2V5cywgZ2V0S2V5VHJpcGxlLCByZXBsYXlQcm90ZWN0aW9uS2V5UGFpciB9IGZyb20gJy4uLy4uLy4uL3NyYy90ZXN0dXRpbCc7XHJcbmltcG9ydCB7IG5ldHdvcmtzLCB0ZXN0dXRpbCB9IGZyb20gJy4uLy4uLy4uL3NyYyc7XHJcbmltcG9ydCB7IGFkZFdhbGxldE91dHB1dFRvUHNidCwgYWRkWHB1YnNUb1BzYnQsIGdldEV4dGVybmFsQ2hhaW5Db2RlLCBSb290V2FsbGV0S2V5cyB9IGZyb20gJy4uLy4uLy4uL3NyYy9iaXRnbyc7XHJcbmltcG9ydCB7XHJcbiAgZmluZEludGVybmFsT3V0cHV0SW5kaWNlcyxcclxuICBmaW5kV2FsbGV0T3V0cHV0SW5kaWNlcyxcclxuICBnZXRUb3RhbEFtb3VudE9mSW50ZXJuYWxPdXRwdXRzLFxyXG4gIGdldFRvdGFsQW1vdW50T2ZXYWxsZXRPdXRwdXRzLFxyXG59IGZyb20gJy4uLy4uLy4uL3NyYy9iaXRnby93YWxsZXQvcHNidC9Qc2J0T3V0cHV0cyc7XHJcbmltcG9ydCB7IEdsb2JhbFhwdWIgfSBmcm9tICdiaXAxNzQvc3JjL2xpYi9pbnRlcmZhY2VzJztcclxuXHJcbmNvbnN0IG5ldHdvcmsgPSBuZXR3b3Jrcy5iaXRjb2luO1xyXG5jb25zdCByb290V2FsbGV0S2V5cyA9IGdldERlZmF1bHRXYWxsZXRLZXlzKCk7XHJcblxyXG5kZXNjcmliZSgncHNidCBpbnRlcm5hbCBhbmQgd2FsbGV0IG91dHB1dHMnLCBmdW5jdGlvbiAoKSB7XHJcbiAgY29uc3QgdmFsdWUgPSBCaWdJbnQoMWU4KTtcclxuICBjb25zdCBmZWUgPSBCaWdJbnQoMTAwMCk7XHJcbiAgY29uc3QgZXh0ZXJuYWxBZGRyZXNzID0gZnJvbU91dHB1dFNjcmlwdChcclxuICAgIGNyZWF0ZU91dHB1dFNjcmlwdFAyc2hQMnBrKHJlcGxheVByb3RlY3Rpb25LZXlQYWlyLnB1YmxpY0tleSkuc2NyaXB0UHViS2V5LFxyXG4gICAgbmV0d29ya3MuYml0Y29pblxyXG4gICk7XHJcblxyXG4gIGRlc2NyaWJlKCdzdWNjZXNzJywgZnVuY3Rpb24gKCkge1xyXG4gICAgaXQoYEZpbmQgaW5kaWNlcyBvZiBwc2J0IHdhbGxldCAmIGludGVybmFsIG91dHB1dHNgLCBmdW5jdGlvbiAoKSB7XHJcbiAgICAgIGNvbnN0IHBzYnQgPSB0ZXN0dXRpbC5jb25zdHJ1Y3RQc2J0KFxyXG4gICAgICAgIFtcclxuICAgICAgICAgIHsgc2NyaXB0VHlwZTogJ3Ayd3NoJywgdmFsdWU6IEJpZ0ludCh2YWx1ZSArIHZhbHVlKSB9LFxyXG4gICAgICAgICAgeyBzY3JpcHRUeXBlOiAncDJzaFAyd3NoJywgdmFsdWU6IEJpZ0ludCh2YWx1ZSkgfSxcclxuICAgICAgICAgIHsgc2NyaXB0VHlwZTogJ3AydHJNdXNpZzInLCB2YWx1ZTogQmlnSW50KHZhbHVlKSB9LFxyXG4gICAgICAgICAgeyBzY3JpcHRUeXBlOiAncDJ0cicsIHZhbHVlOiBCaWdJbnQodmFsdWUpIH0sXHJcbiAgICAgICAgICB7IHNjcmlwdFR5cGU6ICdwMnNoJywgdmFsdWU6IEJpZ0ludCh2YWx1ZSkgfSxcclxuICAgICAgICBdLFxyXG4gICAgICAgIFtcclxuICAgICAgICAgIHsgc2NyaXB0VHlwZTogJ3Ayc2gnLCB2YWx1ZTogQmlnSW50KHZhbHVlKSB9LFxyXG4gICAgICAgICAgeyBzY3JpcHRUeXBlOiAncDJzaFAyd3NoJywgdmFsdWU6IEJpZ0ludCh2YWx1ZSkgfSxcclxuICAgICAgICAgIHsgc2NyaXB0VHlwZTogJ3Ayd3NoJywgdmFsdWU6IEJpZ0ludCh2YWx1ZSkgfSxcclxuICAgICAgICAgIHtcclxuICAgICAgICAgICAgYWRkcmVzczogZXh0ZXJuYWxBZGRyZXNzLFxyXG4gICAgICAgICAgICB2YWx1ZTogQmlnSW50KHZhbHVlIC0gZmVlKSxcclxuICAgICAgICAgIH0sXHJcbiAgICAgICAgICB7IHNjcmlwdFR5cGU6ICdwMnRyJywgdmFsdWU6IEJpZ0ludCh2YWx1ZSksIGlzSW50ZXJuYWxBZGRyZXNzOiB0cnVlIH0sXHJcbiAgICAgICAgICB7IHNjcmlwdFR5cGU6ICdwMnRyTXVzaWcyJywgdmFsdWU6IEJpZ0ludCh2YWx1ZSksIGlzSW50ZXJuYWxBZGRyZXNzOiB0cnVlIH0sXHJcbiAgICAgICAgXSxcclxuICAgICAgICBuZXR3b3JrLFxyXG4gICAgICAgIHJvb3RXYWxsZXRLZXlzLFxyXG4gICAgICAgICd1bnNpZ25lZCdcclxuICAgICAgKTtcclxuICAgICAgY29uc3QgZXhwZWN0ZWQgPSBbMCwgMSwgMiwgNCwgNV07XHJcbiAgICAgIGFzc2VydC5kZWVwRXF1YWwoZmluZFdhbGxldE91dHB1dEluZGljZXMocHNidCwgcm9vdFdhbGxldEtleXMudHJpcGxlKSwgZXhwZWN0ZWQpO1xyXG4gICAgICBhZGRYcHVic1RvUHNidChwc2J0LCByb290V2FsbGV0S2V5cyk7XHJcbiAgICAgIGFzc2VydC5kZWVwRXF1YWwoZmluZEludGVybmFsT3V0cHV0SW5kaWNlcyhwc2J0KSwgZXhwZWN0ZWQpO1xyXG4gICAgfSk7XHJcblxyXG4gICAgc2NyaXB0VHlwZXMyT2YzLmZvckVhY2goKHNjcmlwdFR5cGUpID0+IHtcclxuICAgICAgY29uc3QgcHNidCA9IHRlc3R1dGlsLmNvbnN0cnVjdFBzYnQoXHJcbiAgICAgICAgW1xyXG4gICAgICAgICAgeyBzY3JpcHRUeXBlOiBzY3JpcHRUeXBlLCB2YWx1ZTogQmlnSW50KHZhbHVlKSB9LFxyXG4gICAgICAgICAgeyBzY3JpcHRUeXBlOiAncDJ3c2gnLCB2YWx1ZTogQmlnSW50KHZhbHVlKSB9LFxyXG4gICAgICAgICAgeyBzY3JpcHRUeXBlOiAncDJzaFAyd3NoJywgdmFsdWU6IEJpZ0ludCh2YWx1ZSkgfSxcclxuICAgICAgICAgIHsgc2NyaXB0VHlwZTogJ3AydHJNdXNpZzInLCB2YWx1ZTogQmlnSW50KHZhbHVlKSB9LFxyXG4gICAgICAgICAgeyBzY3JpcHRUeXBlOiAncDJ0cicsIHZhbHVlOiBCaWdJbnQodmFsdWUpIH0sXHJcbiAgICAgICAgICB7IHNjcmlwdFR5cGU6ICdwMnNoJywgdmFsdWU6IEJpZ0ludCh2YWx1ZSkgfSxcclxuICAgICAgICBdLFxyXG4gICAgICAgIFtcclxuICAgICAgICAgIHsgc2NyaXB0VHlwZTogJ3Ayc2gnLCB2YWx1ZTogQmlnSW50KHZhbHVlKSB9LFxyXG4gICAgICAgICAgeyBzY3JpcHRUeXBlOiAncDJzaFAyd3NoJywgdmFsdWU6IEJpZ0ludCh2YWx1ZSkgfSxcclxuICAgICAgICAgIHsgc2NyaXB0VHlwZTogJ3Ayd3NoJywgdmFsdWU6IEJpZ0ludCh2YWx1ZSkgfSxcclxuICAgICAgICAgIHtcclxuICAgICAgICAgICAgYWRkcmVzczogZXh0ZXJuYWxBZGRyZXNzLFxyXG4gICAgICAgICAgICB2YWx1ZTogQmlnSW50KHZhbHVlIC0gZmVlKSxcclxuICAgICAgICAgIH0sXHJcbiAgICAgICAgICB7IHNjcmlwdFR5cGU6ICdwMnRyJywgdmFsdWU6IEJpZ0ludCh2YWx1ZSksIGlzSW50ZXJuYWxBZGRyZXNzOiB0cnVlIH0sXHJcbiAgICAgICAgICB7IHNjcmlwdFR5cGU6ICdwMnRyTXVzaWcyJywgdmFsdWU6IEJpZ0ludCh2YWx1ZSksIGlzSW50ZXJuYWxBZGRyZXNzOiB0cnVlIH0sXHJcbiAgICAgICAgXSxcclxuICAgICAgICBuZXR3b3JrLFxyXG4gICAgICAgIHJvb3RXYWxsZXRLZXlzLFxyXG4gICAgICAgICd1bnNpZ25lZCdcclxuICAgICAgKTtcclxuXHJcbiAgICAgIGFkZFhwdWJzVG9Qc2J0KHBzYnQsIHJvb3RXYWxsZXRLZXlzKTtcclxuXHJcbiAgICAgIGNvbnN0IHRvdGFsSW50ZXJuYWxBbW91bnQgPSB2YWx1ZSAqIEJpZ0ludChwc2J0LmlucHV0Q291bnQgLSAxKTtcclxuXHJcbiAgICAgIGl0KGBQU0JUIHdpdGggJHtzY3JpcHRUeXBlfSBpbnB1dCBhbmQgZ2xvYmFsWHB1YmAsIGZ1bmN0aW9uICgpIHtcclxuICAgICAgICBhc3NlcnQuc3RyaWN0RXF1YWwoZ2V0VG90YWxBbW91bnRPZkludGVybmFsT3V0cHV0cyhwc2J0KSwgdG90YWxJbnRlcm5hbEFtb3VudCk7XHJcbiAgICAgIH0pO1xyXG5cclxuICAgICAgaXQoYENsb25lZCBQU0JUIHdpdGggJHtzY3JpcHRUeXBlfSBpbnB1dCBhbmQgZ2xvYmFsWHB1YmAsIGZ1bmN0aW9uICgpIHtcclxuICAgICAgICBhc3NlcnQuc3RyaWN0RXF1YWwoZ2V0VG90YWxBbW91bnRPZkludGVybmFsT3V0cHV0cyhwc2J0LmNsb25lKCkpLCB0b3RhbEludGVybmFsQW1vdW50KTtcclxuICAgICAgfSk7XHJcblxyXG4gICAgICBpdChgUFNCVCB3aXRoICR7c2NyaXB0VHlwZX0gaW5wdXQgYW5kIG9yZGVyZWQgcm9vdE5vZGVzYCwgZnVuY3Rpb24gKCkge1xyXG4gICAgICAgIGFzc2VydC5zdHJpY3RFcXVhbChnZXRUb3RhbEFtb3VudE9mV2FsbGV0T3V0cHV0cyhwc2J0LCByb290V2FsbGV0S2V5cy50cmlwbGUpLCB0b3RhbEludGVybmFsQW1vdW50KTtcclxuICAgICAgfSk7XHJcbiAgICB9KTtcclxuXHJcbiAgICBpdChgUFNCVCB3aXRoIHAyc2hQMnBrIGFzIGZpcnN0IGlucHV0YCwgZnVuY3Rpb24gKCkge1xyXG4gICAgICBjb25zdCBwc2J0ID0gdGVzdHV0aWwuY29uc3RydWN0UHNidChcclxuICAgICAgICBbXHJcbiAgICAgICAgICB7IHNjcmlwdFR5cGU6ICdwMnNoUDJwaycsIHZhbHVlOiBCaWdJbnQodmFsdWUpIH0sXHJcbiAgICAgICAgICB7IHNjcmlwdFR5cGU6ICdwMndzaCcsIHZhbHVlOiBCaWdJbnQodmFsdWUpIH0sXHJcbiAgICAgICAgXSxcclxuICAgICAgICBbXHJcbiAgICAgICAgICB7IHNjcmlwdFR5cGU6ICdwMnNoJywgdmFsdWU6IEJpZ0ludCh2YWx1ZSkgfSxcclxuICAgICAgICAgIHtcclxuICAgICAgICAgICAgYWRkcmVzczogZXh0ZXJuYWxBZGRyZXNzLFxyXG4gICAgICAgICAgICB2YWx1ZTogQmlnSW50KHZhbHVlIC0gZmVlKSxcclxuICAgICAgICAgIH0sXHJcbiAgICAgICAgXSxcclxuICAgICAgICBuZXR3b3JrLFxyXG4gICAgICAgIHJvb3RXYWxsZXRLZXlzLFxyXG4gICAgICAgICd1bnNpZ25lZCdcclxuICAgICAgKTtcclxuICAgICAgYWRkWHB1YnNUb1BzYnQocHNidCwgcm9vdFdhbGxldEtleXMpO1xyXG4gICAgICBhc3NlcnQuc3RyaWN0RXF1YWwoZ2V0VG90YWxBbW91bnRPZkludGVybmFsT3V0cHV0cyhwc2J0KSwgdmFsdWUpO1xyXG4gICAgfSk7XHJcblxyXG4gICAgaXQoYFBTQlQgd2l0aCBvdXRwdXRzIG9mIGV4dGVybmFsIHdhbGxldCByb290IG5vZGVzYCwgZnVuY3Rpb24gKCkge1xyXG4gICAgICBjb25zdCBwc2J0ID0gdGVzdHV0aWwuY29uc3RydWN0UHNidChcclxuICAgICAgICBbeyBzY3JpcHRUeXBlOiAncDJ3c2gnLCB2YWx1ZTogQmlnSW50KHZhbHVlKSB9XSxcclxuICAgICAgICBbeyBzY3JpcHRUeXBlOiAncDJzaCcsIHZhbHVlOiBCaWdJbnQodmFsdWUpIH1dLFxyXG4gICAgICAgIG5ldHdvcmssXHJcbiAgICAgICAgcm9vdFdhbGxldEtleXMsXHJcbiAgICAgICAgJ3Vuc2lnbmVkJ1xyXG4gICAgICApO1xyXG4gICAgICBjb25zdCBleHRlcm5hbEFtb3VudCA9IEJpZ0ludCg4ODg4KTtcclxuICAgICAgY29uc3QgZXh0ZXJuYWxSb290V2FsbGV0S2V5cyA9IG5ldyBSb290V2FsbGV0S2V5cyhnZXRLZXlUcmlwbGUoJ2R1bW15JykpO1xyXG4gICAgICBjb25zdCBpbmRpY2VzID0gWzAsIDFdO1xyXG4gICAgICBpbmRpY2VzLmZvckVhY2goKGluZGV4KSA9PlxyXG4gICAgICAgIGFkZFdhbGxldE91dHB1dFRvUHNidChwc2J0LCBleHRlcm5hbFJvb3RXYWxsZXRLZXlzLCBnZXRFeHRlcm5hbENoYWluQ29kZSgncDJ3c2gnKSwgaW5kZXgsIGV4dGVybmFsQW1vdW50KVxyXG4gICAgICApO1xyXG4gICAgICBhc3NlcnQuc3RyaWN0RXF1YWwoXHJcbiAgICAgICAgZ2V0VG90YWxBbW91bnRPZldhbGxldE91dHB1dHMocHNidCwgZXh0ZXJuYWxSb290V2FsbGV0S2V5cy50cmlwbGUpLFxyXG4gICAgICAgIGV4dGVybmFsQW1vdW50ICogQmlnSW50KGluZGljZXMubGVuZ3RoKVxyXG4gICAgICApO1xyXG4gICAgfSk7XHJcblxyXG4gICAgaXQoYFBTQlQgd2l0aCBubyBvdXRwdXRzIG9mIGV4dGVybmFsIHdhbGxldCByb290IG5vZGVzYCwgZnVuY3Rpb24gKCkge1xyXG4gICAgICBjb25zdCBwc2J0ID0gdGVzdHV0aWwuY29uc3RydWN0UHNidChcclxuICAgICAgICBbeyBzY3JpcHRUeXBlOiAncDJ3c2gnLCB2YWx1ZTogQmlnSW50KHZhbHVlKSB9XSxcclxuICAgICAgICBbeyBzY3JpcHRUeXBlOiAncDJzaCcsIHZhbHVlOiBCaWdJbnQodmFsdWUpIH1dLFxyXG4gICAgICAgIG5ldHdvcmssXHJcbiAgICAgICAgcm9vdFdhbGxldEtleXMsXHJcbiAgICAgICAgJ3Vuc2lnbmVkJ1xyXG4gICAgICApO1xyXG4gICAgICBhc3NlcnQuc3RyaWN0RXF1YWwoXHJcbiAgICAgICAgZ2V0VG90YWxBbW91bnRPZldhbGxldE91dHB1dHMocHNidCwgbmV3IFJvb3RXYWxsZXRLZXlzKGdldEtleVRyaXBsZSgnZHVtbXknKSkudHJpcGxlKSxcclxuICAgICAgICBCaWdJbnQoMClcclxuICAgICAgKTtcclxuICAgIH0pO1xyXG5cclxuICAgIGl0KGBQU0JUIHdpdGggbm8gaW50ZXJuYWwgb3V0cHV0YCwgZnVuY3Rpb24gKCkge1xyXG4gICAgICBjb25zdCBwc2J0ID0gdGVzdHV0aWwuY29uc3RydWN0UHNidChcclxuICAgICAgICBbeyBzY3JpcHRUeXBlOiAncDJ3c2gnLCB2YWx1ZTogQmlnSW50KHZhbHVlKSB9XSxcclxuICAgICAgICBbXHJcbiAgICAgICAgICB7XHJcbiAgICAgICAgICAgIGFkZHJlc3M6IGV4dGVybmFsQWRkcmVzcyxcclxuICAgICAgICAgICAgdmFsdWU6IEJpZ0ludCh2YWx1ZSAtIGZlZSksXHJcbiAgICAgICAgICB9LFxyXG4gICAgICAgIF0sXHJcbiAgICAgICAgbmV0d29yayxcclxuICAgICAgICByb290V2FsbGV0S2V5cyxcclxuICAgICAgICAndW5zaWduZWQnXHJcbiAgICAgICk7XHJcbiAgICAgIGFkZFhwdWJzVG9Qc2J0KHBzYnQsIHJvb3RXYWxsZXRLZXlzKTtcclxuICAgICAgYXNzZXJ0LnN0cmljdEVxdWFsKGdldFRvdGFsQW1vdW50T2ZJbnRlcm5hbE91dHB1dHMocHNidCksIEJpZ0ludCgwKSk7XHJcbiAgICB9KTtcclxuICB9KTtcclxuXHJcbiAgZGVzY3JpYmUoJ2ZhaWx1cmUnLCBmdW5jdGlvbiAoKSB7XHJcbiAgICBpdCgnUFNCVCB3aXRob3V0IGdsb2JhbFhwdWInLCBmdW5jdGlvbiAoKSB7XHJcbiAgICAgIGNvbnN0IHBzYnQgPSB0ZXN0dXRpbC5jb25zdHJ1Y3RQc2J0KFtdLCBbXSwgbmV0d29yaywgcm9vdFdhbGxldEtleXMsICd1bnNpZ25lZCcpO1xyXG4gICAgICBhc3NlcnQudGhyb3dzKFxyXG4gICAgICAgICgpID0+IGdldFRvdGFsQW1vdW50T2ZJbnRlcm5hbE91dHB1dHMocHNidCksXHJcbiAgICAgICAgKGU6IGFueSkgPT4gZS5tZXNzYWdlID09PSAnQ291bGQgbm90IGZpbmQgcm9vdCBub2RlcyBpbiBQU0JUJ1xyXG4gICAgICApO1xyXG4gICAgfSk7XHJcblxyXG4gICAgaXQoJ1BTQlQgd2l0aCBpbnZhbGlkIG51bWJlciBvZiBnbG9iYWxYcHViJywgZnVuY3Rpb24gKCkge1xyXG4gICAgICBjb25zdCBwc2J0ID0gdGVzdHV0aWwuY29uc3RydWN0UHNidChbXSwgW10sIG5ldHdvcmssIHJvb3RXYWxsZXRLZXlzLCAndW5zaWduZWQnKTtcclxuICAgICAgY29uc3QgZ2xvYmFsWHB1YjogR2xvYmFsWHB1YltdID0gW1xyXG4gICAgICAgIHtcclxuICAgICAgICAgIGV4dGVuZGVkUHVia2V5OiBiczU4Y2hlY2suZGVjb2RlKHJvb3RXYWxsZXRLZXlzLnRyaXBsZVswXS5uZXV0ZXJlZCgpLnRvQmFzZTU4KCkpLFxyXG4gICAgICAgICAgbWFzdGVyRmluZ2VycHJpbnQ6IHJvb3RXYWxsZXRLZXlzLnRyaXBsZVswXS5maW5nZXJwcmludCxcclxuICAgICAgICAgIHBhdGg6ICdtJyxcclxuICAgICAgICB9LFxyXG4gICAgICBdO1xyXG4gICAgICBwc2J0LnVwZGF0ZUdsb2JhbCh7IGdsb2JhbFhwdWIgfSk7XHJcbiAgICAgIGFzc2VydC50aHJvd3MoXHJcbiAgICAgICAgKCkgPT4gZ2V0VG90YWxBbW91bnRPZkludGVybmFsT3V0cHV0cyhwc2J0KSxcclxuICAgICAgICAoZTogYW55KSA9PiBlLm1lc3NhZ2UgPT09ICdJbnZhbGlkIGdsb2JhbFhwdWJzIGluIFBTQlQuIEV4cGVjdGVkIDMgb3Igbm9uZS4gR290IDEnXHJcbiAgICAgICk7XHJcbiAgICB9KTtcclxuXHJcbiAgICBpdCgnUFNCVCB3aXRob3V0IGlucHV0IHNjcmlwdFB1YktleScsIGZ1bmN0aW9uICgpIHtcclxuICAgICAgY29uc3QgcHNidCA9IHRlc3R1dGlsLmNvbnN0cnVjdFBzYnQoXHJcbiAgICAgICAgW3sgc2NyaXB0VHlwZTogJ3Ayd3NoJywgdmFsdWU6IEJpZ0ludCh2YWx1ZSkgfV0sXHJcbiAgICAgICAgW1xyXG4gICAgICAgICAge1xyXG4gICAgICAgICAgICBhZGRyZXNzOiBleHRlcm5hbEFkZHJlc3MsXHJcbiAgICAgICAgICAgIHZhbHVlOiBCaWdJbnQodmFsdWUgLSBmZWUpLFxyXG4gICAgICAgICAgfSxcclxuICAgICAgICBdLFxyXG4gICAgICAgIG5ldHdvcmssXHJcbiAgICAgICAgcm9vdFdhbGxldEtleXMsXHJcbiAgICAgICAgJ3Vuc2lnbmVkJ1xyXG4gICAgICApO1xyXG4gICAgICBwc2J0LmRhdGEuaW5wdXRzWzBdLndpdG5lc3NVdHhvID0gdW5kZWZpbmVkO1xyXG4gICAgICBhZGRYcHVic1RvUHNidChwc2J0LCByb290V2FsbGV0S2V5cyk7XHJcbiAgICAgIGFzc2VydC50aHJvd3MoXHJcbiAgICAgICAgKCkgPT4gZ2V0VG90YWxBbW91bnRPZkludGVybmFsT3V0cHV0cyhwc2J0KSxcclxuICAgICAgICAoZTogYW55KSA9PiBlLm1lc3NhZ2UgPT09ICdJbnB1dCBzY3JpcHRQdWJLZXkgY2FuIG5vdCBiZSBmb3VuZCdcclxuICAgICAgKTtcclxuICAgIH0pO1xyXG5cclxuICAgIGl0KCdQU0JUIHdpdGhvdXQgaW5wdXQgQmlwMzJEZXJpdmF0aW9uJywgZnVuY3Rpb24gKCkge1xyXG4gICAgICBjb25zdCBwc2J0ID0gdGVzdHV0aWwuY29uc3RydWN0UHNidChcclxuICAgICAgICBbeyBzY3JpcHRUeXBlOiAncDJ3c2gnLCB2YWx1ZTogQmlnSW50KHZhbHVlKSB9XSxcclxuICAgICAgICBbXHJcbiAgICAgICAgICB7XHJcbiAgICAgICAgICAgIGFkZHJlc3M6IGV4dGVybmFsQWRkcmVzcyxcclxuICAgICAgICAgICAgdmFsdWU6IEJpZ0ludCh2YWx1ZSAtIGZlZSksXHJcbiAgICAgICAgICB9LFxyXG4gICAgICAgIF0sXHJcbiAgICAgICAgbmV0d29yayxcclxuICAgICAgICByb290V2FsbGV0S2V5cyxcclxuICAgICAgICAndW5zaWduZWQnXHJcbiAgICAgICk7XHJcbiAgICAgIHBzYnQuZGF0YS5pbnB1dHNbMF0uYmlwMzJEZXJpdmF0aW9uID0gdW5kZWZpbmVkO1xyXG4gICAgICBhZGRYcHVic1RvUHNidChwc2J0LCByb290V2FsbGV0S2V5cyk7XHJcbiAgICAgIGFzc2VydC50aHJvd3MoXHJcbiAgICAgICAgKCkgPT4gZ2V0VG90YWxBbW91bnRPZkludGVybmFsT3V0cHV0cyhwc2J0KSxcclxuICAgICAgICAoZTogYW55KSA9PiBlLm1lc3NhZ2UgPT09ICdJbnB1dCBCaXAzMkRlcml2YXRpb24gY2FuIG5vdCBiZSBmb3VuZCdcclxuICAgICAgKTtcclxuICAgIH0pO1xyXG4gIH0pO1xyXG59KTtcclxuIl19
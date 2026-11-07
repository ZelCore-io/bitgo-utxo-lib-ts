import * as assert from 'assert';
import { crypto, payments, script as bscript, Transaction, networks, ECPair } from '../../../src';
import {
  getDefaultConsensusBranchIdForVersion,
  ZcashTransaction,
  ZcashTransactionBuilder,
  ZcashPrevOutput,
} from '../../../src/bitgo';
import { getSignatureDigest } from '../../../src/bitgo/zcash/hashZip0244';

const NU7_BRANCH_ID = 0x77190ad9;
const NU6_3_BRANCH_ID = 0x37a5165b;

// throwaway test key, derived from a fixed string; never used on any network
const keyPair = ECPair.fromPrivateKey(crypto.sha256(Buffer.from('bitgo-utxo-lib zip244 e2e throwaway key')));
const p2pkh = payments.p2pkh({ pubkey: keyPair.publicKey, network: networks.zcash }).output as Buffer;
const otherScript = payments.p2pkh({
  pubkey: ECPair.fromPrivateKey(crypto.sha256(Buffer.from('bitgo-utxo-lib zip244 e2e other key'))).publicKey,
  network: networks.zcash,
}).output as Buffer;

const prevOutputs: (ZcashPrevOutput & { txid: Buffer; vout: number })[] = [
  { txid: crypto.sha256(Buffer.from('prev tx a')), vout: 0, script: p2pkh, value: 100_000 },
  { txid: crypto.sha256(Buffer.from('prev tx b')), vout: 3, script: p2pkh, value: 250_000 },
];

function newV5Builder(version = ZcashTransaction.VERSION5_BRANCH_NU7): ZcashTransactionBuilder<number> {
  const txb = new ZcashTransactionBuilder<number>(networks.zcash);
  txb.setDefaultsForVersion(networks.zcash, version);
  txb.setExpiryHeight(3_543_500);
  return txb;
}

function buildSigned(txb = newV5Builder()): ZcashTransaction<number> {
  prevOutputs.forEach(({ txid, vout, script, value }) => txb.addInput(txid, vout, 0xfffffffe, script, value));
  txb.addOutput(otherScript, 300_000);
  txb.addOutput(p2pkh, 40_000);
  prevOutputs.forEach((_, vin) => txb.sign({ prevOutScriptType: 'p2pkh', vin, keyPair }));
  return txb.build();
}

function verifyInputs(tx: ZcashTransaction<number>, prevOuts: ZcashPrevOutput[]): boolean[] {
  return tx.ins.map((input, i) => {
    const [sigBuffer, pubkey] = bscript.decompile(input.script) as Buffer[];
    const { signature, hashType } = bscript.signature.decode(sigBuffer);
    assert.strictEqual(hashType, Transaction.SIGHASH_ALL);
    assert.ok(pubkey.equals(keyPair.publicKey));
    // recompute with the digest function verified against the official ZIP 244 vectors
    const digest = getSignatureDigest(tx, i, hashType, prevOuts);
    assert.ok(digest.equals(tx.hashForSignatureByNetwork(i, prevOuts[i].script, prevOuts[i].value, hashType)));
    return ECPair.fromPublicKey(pubkey).verify(digest, signature);
  });
}

describe('Zcash v5 (NU7) transparent signing, end to end', function () {
  it('uses the NU7 consensus branch id by default for v5', function () {
    assert.strictEqual(ZcashTransaction.VERSION5_BRANCH_NU7, 560);
    assert.strictEqual(getDefaultConsensusBranchIdForVersion(networks.zcash, 5), NU7_BRANCH_ID);
    assert.strictEqual(
      getDefaultConsensusBranchIdForVersion(networks.zcash, ZcashTransaction.VERSION5_BRANCH_NU7),
      NU7_BRANCH_ID
    );
    // v4 defaults are unchanged
    assert.strictEqual(getDefaultConsensusBranchIdForVersion(networks.zcash, 4), NU6_3_BRANCH_ID);
    assert.strictEqual(
      getDefaultConsensusBranchIdForVersion(networks.zcash, ZcashTransaction.VERSION5_BRANCH_NU6_3),
      NU6_3_BRANCH_ID
    );
    assert.strictEqual(newV5Builder().tx.consensusBranchId, NU7_BRANCH_ID);
  });

  it('builds, signs, parses back and verifies a v5 transaction', function () {
    const built = buildSigned();
    const parsed = ZcashTransaction.fromBuffer<number>(built.toBuffer(), false, 'number', networks.zcash);
    assert.strictEqual(parsed.version, 5);
    assert.strictEqual(parsed.consensusBranchId, NU7_BRANCH_ID);
    assert.strictEqual(parsed.getId(), built.getId());
    assert.strictEqual(parsed.ins.length, 2);
    assert.strictEqual(parsed.outs.length, 2);

    // a parsed transaction carries no prevout data
    assert.strictEqual(parsed.getPrevOutputs(), undefined);
    assert.throws(() => parsed.hashForSignatureByNetwork(0, p2pkh, 100_000, Transaction.SIGHASH_ALL), /ZIP 244/);

    parsed.setPrevOutputs(prevOutputs.map(({ script, value }) => ({ script, value })));
    assert.deepStrictEqual(verifyInputs(parsed, prevOutputs), [true, true]);

    // the built transaction keeps the builder's prevout data
    assert.deepStrictEqual(verifyInputs(built, built.getPrevOutputs() as ZcashPrevOutput[]), [true, true]);
  });

  it('commits to the amount and scriptPubKey of every input', function () {
    const parsed = ZcashTransaction.fromBuffer<number>(buildSigned().toBuffer(), false, 'number', networks.zcash);
    // a wrong amount of the other input invalidates the signature of input 0
    parsed.setPrevOutputs([prevOutputs[0], { script: p2pkh, value: 250_001 }]);
    assert.strictEqual(verifyInputs(parsed, parsed.getPrevOutputs() as ZcashPrevOutput[])[0], false);
    // a wrong scriptPubKey of the other input invalidates the signature of input 0
    parsed.setPrevOutputs([prevOutputs[0], { script: otherScript, value: 250_000 }]);
    assert.strictEqual(verifyInputs(parsed, parsed.getPrevOutputs() as ZcashPrevOutput[])[0], false);
  });

  it('commits to the consensus branch id (setConsensusBranchId still works)', function () {
    const txb = newV5Builder();
    txb.setConsensusBranchId(NU6_3_BRANCH_ID);
    const tx = buildSigned(txb);
    assert.strictEqual(tx.consensusBranchId, NU6_3_BRANCH_ID);
    assert.deepStrictEqual(verifyInputs(tx, prevOutputs), [true, true]);
    const nu7 = ZcashTransaction.fromBuffer<number>(tx.toBuffer(), false, 'number', networks.zcash);
    nu7.consensusBranchId = NU7_BRANCH_ID;
    nu7.setPrevOutputs(prevOutputs);
    assert.deepStrictEqual(verifyInputs(nu7, prevOutputs), [false, false]);
  });

  it('refuses to sign a v5 input when another input has no prevout data', function () {
    const txb = newV5Builder();
    txb.addInput(prevOutputs[0].txid, prevOutputs[0].vout, 0xfffffffe, p2pkh, 100_000);
    txb.addInput(prevOutputs[1].txid, prevOutputs[1].vout, 0xfffffffe);
    txb.addOutput(otherScript, 90_000);
    assert.throws(
      () => txb.sign({ prevOutScriptType: 'p2pkh', vin: 0, keyPair }),
      /ZIP 244.*input 1 has no scriptPubKey/
    );
  });

  it('refuses a value that differs from the prevout data', function () {
    const parsed = ZcashTransaction.fromBuffer<number>(buildSigned().toBuffer(), false, 'number', networks.zcash);
    parsed.setPrevOutputs(prevOutputs);
    assert.throws(() => parsed.hashForSignatureByNetwork(0, p2pkh, 99_999, Transaction.SIGHASH_ALL), /does not match/);
  });

  it('refuses undefined hash types and SIGHASH_SINGLE without a corresponding output', function () {
    const txb = newV5Builder();
    prevOutputs.forEach(({ txid, vout, script, value }) => txb.addInput(txid, vout, 0xfffffffe, script, value));
    txb.addOutput(otherScript, 300_000);
    const tx = txb.buildIncomplete();
    assert.throws(() => tx.hashForSignatureByNetwork(0, p2pkh, 100_000, 0x04), /invalid ZIP 244 hash_type/);
    assert.throws(
      () => tx.hashForSignatureByNetwork(1, p2pkh, 250_000, Transaction.SIGHASH_SINGLE),
      /SIGHASH_SINGLE requires an output/
    );
    assert.strictEqual(tx.hashForSignatureByNetwork(0, p2pkh, 100_000, Transaction.SIGHASH_SINGLE).length, 32);
  });
});

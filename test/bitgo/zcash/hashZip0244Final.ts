import * as assert from 'assert';
import * as vectors from './fixtures/vectorsZip0244Final.json';
import { UnsupportedTransactionError, ZcashTransaction } from '../../../src/bitgo';
import { Transaction, networks } from '../../../src';

/*
 * Official final ZIP 244 vectors, see ./fixtures/README.md for the source and commit.
 * https://zips.z.cash/zip-0244#signature-digest
 */
type FinalVector = [
  tx: string,
  txid: string,
  authDigest: string,
  amounts: number[],
  scriptPubKeys: string[],
  transparentInput: number | null,
  sighashShielded: string,
  sighashAll: string | null,
  sighashNone: string | null,
  sighashSingle: string | null,
  sighashAllAnyone: string | null,
  sighashNoneAnyone: string | null,
  sighashSingleAnyone: string | null
];

const hashTypes: [string, number][] = [
  ['SIGHASH_ALL', Transaction.SIGHASH_ALL],
  ['SIGHASH_NONE', Transaction.SIGHASH_NONE],
  ['SIGHASH_SINGLE', Transaction.SIGHASH_SINGLE],
  ['SIGHASH_ALL|SIGHASH_ANYONECANPAY', Transaction.SIGHASH_ALL | Transaction.SIGHASH_ANYONECANPAY],
  ['SIGHASH_NONE|SIGHASH_ANYONECANPAY', Transaction.SIGHASH_NONE | Transaction.SIGHASH_ANYONECANPAY],
  ['SIGHASH_SINGLE|SIGHASH_ANYONECANPAY', Transaction.SIGHASH_SINGLE | Transaction.SIGHASH_ANYONECANPAY],
];

function parse(txHex: string): ZcashTransaction | undefined {
  try {
    return ZcashTransaction.fromBuffer(Buffer.from(txHex, 'hex'), false, 'number', networks.zcash);
  } catch (e) {
    if (e instanceof UnsupportedTransactionError) {
      return undefined;
    }
    throw e;
  }
}

describe('ZcashTransaction ZIP-0244 (final spec vectors)', function () {
  const rows = (vectors as unknown[]).filter((v) => Array.isArray(v) && v.length > 1) as FinalVector[];
  const parsed = rows.map((v) => parse(v[0]));

  it('parses the transparent-only vectors', function () {
    // vectors 2, 3, 4, 5 and 8 of commit 423d323 carry no shielded bundles
    assert.deepStrictEqual(
      parsed.flatMap((tx, i) => (tx ? [i] : [])),
      [2, 3, 4, 5, 8]
    );
  });

  rows.forEach((v, i) => {
    const [txHex, txid, , amounts, scriptPubKeys, transparentInput, sighashShielded, ...sighashes] = v;
    const tx = parsed[i];
    if (!tx) {
      return;
    }

    describe(`Vector ${i}, txid=${txid}`, function () {
      function withPrevOutputs(): ZcashTransaction {
        const clone = ZcashTransaction.fromBuffer<number>(Buffer.from(txHex, 'hex'), false, 'number', networks.zcash);
        clone.setPrevOutputs(amounts.map((value, j) => ({ value, script: Buffer.from(scriptPubKeys[j], 'hex') })));
        return clone;
      }

      it('has expected txid', function () {
        assert.strictEqual(tx.getHash().toString('hex'), txid);
      });

      it('has expected shielded signature hash (no transparent input signed)', function () {
        assert.strictEqual(
          withPrevOutputs()
            .hashForSignatureByNetwork(undefined, Buffer.of(), 0, Transaction.SIGHASH_ALL)
            .toString('hex'),
          sighashShielded
        );
      });

      if (transparentInput === null) {
        return;
      }

      hashTypes.forEach(([name, hashType], j) => {
        const expected = sighashes[j];
        if (expected === null) {
          return;
        }
        it(`has expected signature hash for ${name}`, function () {
          const hash = withPrevOutputs().hashForSignatureByNetwork(
            transparentInput,
            Buffer.from(scriptPubKeys[transparentInput], 'hex'),
            amounts[transparentInput],
            hashType
          );
          assert.strictEqual(hash.toString('hex'), expected);
        });
      });

      it('refuses to compute a v5 signature hash without the prevout data of every input', function () {
        const bare = ZcashTransaction.fromBuffer<number>(Buffer.from(txHex, 'hex'), false, 'number', networks.zcash);
        assert.throws(
          () =>
            bare.hashForSignatureByNetwork(
              transparentInput,
              Buffer.from(scriptPubKeys[transparentInput], 'hex'),
              amounts[transparentInput],
              Transaction.SIGHASH_ALL
            ),
          /ZIP 244/
        );
      });
    });
  });
});

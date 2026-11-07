import * as assert from 'assert';
import * as vectors from './fixtures/vectorsZip0244.json';
import { UnsupportedTransactionError, ZcashTransaction } from '../../../src/bitgo';
import { Transaction, networks } from '../../../src';

/*
 * DRAFT-SPEC VECTORS, KEPT FOR HISTORY.
 *
 * ./fixtures/vectorsZip0244.json was generated from a pre-2022 draft of ZIP 244 (see ./fixtures/README.md).
 * Its txids still match final ZIP 244, so they are still asserted.
 * Its signature hashes for a transparent input follow the draft signature digest, which omitted hash_type,
 * amounts_sig_digest and scriptpubkeys_sig_digest and is rejected by the Zcash network. Those columns are no longer
 * asserted here; the final-spec vectors in ./hashZip0244Final.ts replace them.
 * The signature hashes for transactions without transparent inputs (transparent_input = null) are the same under
 * the draft and the final spec, and are still asserted.
 */

type Vector = [
  tx: string,
  txid: string,
  auth_digest: string,
  transparent_input: number | null,
  script_code: string,
  amount: number,
  sighash_all: string,
  sighash_none: string,
  sighash_single: string,
  sighash_all_anyone: string,
  sighash_none_anyone: string,
  sighash_single_anyone: string
];

function parseHashType(hashTypeStr: string): number {
  return hashTypeStr.split('|').reduce((v, str) => {
    if (str in Transaction) {
      return v | Transaction[str];
    }
    throw new Error(`invalid hashType ${str}`);
  }, 0);
}

function runVector(v: Vector, i: number) {
  const [
    txHex,
    txid,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    authDigest,
    transparentInput,
    pubScriptHex,
    amount,
    ...sigHashHex /* sighash_all, sighash_none, sighash_single, sighash_all_anyone, sighash_none_anyone, sighash_single_anyone */
  ] = v;

  describe(`Vector ${i}, txid=${txid}`, function () {
    let tx: ZcashTransaction;
    before('parse', function () {
      try {
        tx = ZcashTransaction.fromBuffer(Buffer.from(txHex, 'hex'), false, 'number', networks.zcash);
      } catch (e) {
        if (e instanceof UnsupportedTransactionError) {
          this.skip();
        }
        throw e;
      }
    });

    it('has expected txid', function () {
      // getId() returns the reversed hash
      assert.strictEqual(tx.getHash().toString('hex'), txid);
    });

    if (transparentInput !== null) {
      // draft-spec signature digest, superseded by final ZIP 244 (see the note at the top of this file)
      return;
    }

    [
      'SIGHASH_ALL',
      'SIGHASH_NONE',
      'SIGHASH_SINGLE',
      'SIGHASH_ALL|SIGHASH_ANYONECANPAY',
      'SIGHASH_NONE|SIGHASH_ANYONECANPAY',
      'SIGHASH_SINGLE|SIGHASH_ANYONECANPAY',
    ].forEach((hashTypeStr, i) => {
      if (sigHashHex[i] === null) {
        return;
      }
      const hashType = parseHashType(hashTypeStr);
      it(`has expected value for ${hashTypeStr} ${hashType}`, function () {
        assert.strictEqual(
          tx
            .hashForSignatureByNetwork(
              transparentInput ?? undefined,
              pubScriptHex ? Buffer.from(pubScriptHex, 'hex') : Buffer.of(),
              amount,
              hashType
            )
            .toString('hex'),
          sigHashHex[i]
        );
      });
    });
  });
}

describe('ZcashTransaction ZIP-0244 (pre-2022 draft vectors, kept for history)', function () {
  vectors
    .filter((v) => v.length > 1)
    .forEach((v, i) => {
      runVector(v as Vector, i);
    });
});

# Zcash ZIP 244 test vectors

## `vectorsZip0244Final.json` (final ZIP 244)

Official vectors for the final ZIP 244 (https://zips.z.cash/zip-0244), copied
byte for byte from:

- repository: https://github.com/zcash/zcash-test-vectors
- file: `test-vectors/json/zip_0244.json`
- commit: `423d323728a9c986297e6c477b03f10efbbdf64d`
  ("Update NU5 consensus branch ID in ZIP 244 test vectors")
- URL: https://github.com/zcash/zcash-test-vectors/blob/423d323728a9c986297e6c477b03f10efbbdf64d/test-vectors/json/zip_0244.json
- SHA-256 of the file: `0f6fccbb5d0d5ddb57f00d78ef34430b2ee8fec0686e9acce42548a3dd8e6c00`

Columns: `tx, txid, auth_digest, amounts, script_pubkeys, transparent_input,
sighash_shielded, sighash_all, sighash_none, sighash_single, sighash_all_anyone,
sighash_none_anyone, sighash_single_anyone`.

This commit is used because later revisions of the file contain no
transparent-only transactions that this library can parse (it does not support
shielded bundles). Used by `test/bitgo/zcash/hashZip0244Final.ts`.

## `vectorsZip0244.json` (pre-2022 draft, kept for history)

Vectors generated from an early draft of ZIP 244
(zcash-hackworks/zcash-test-vectors `zip_0244.py` around commit `dd8fdb`). The
draft signature digest omitted `hash_type`, `amounts_sig_digest` and
`scriptpubkeys_sig_digest`, and ordered the `txin_sig_digest` fields
differently. Its sighash columns therefore do not match the final ZIP 244 that
the Zcash network enforces, and are no longer asserted. The txid digest did not
change between the draft and the final spec, so `test/bitgo/zcash/hashZip0244.ts`
still checks the txids of this file.

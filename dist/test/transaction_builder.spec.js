"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const assert = require("assert");
const mocha_1 = require("mocha");
const src_1 = require("../src");
console.warn = () => {
    return;
}; // Silence the Deprecation Warning
const txb_fixtures = require("./fixtures/transaction_builder.json");
const txb_big_fixtures = require("./fixtures/transaction_builder_bigint.json");
function toAmount(v, t) {
    if (v === undefined) {
        return v;
    }
    if (t === 'number') {
        return Number(v);
    }
    if (t === 'bigint') {
        return BigInt(v);
    }
    throw new Error();
}
function constructSign(f, txb, params) {
    const network = src_1.networks[f.network];
    const stages = f.stages && f.stages.concat();
    f.inputs.forEach((input, index) => {
        if (!input.signs)
            return;
        input.signs.forEach((sign) => {
            const keyPair = src_1.ECPair.fromWIF(sign.keyPair, network);
            let redeemScript;
            let witnessScript;
            let witnessValue;
            let controlBlock;
            if (sign.redeemScript) {
                redeemScript = src_1.script.fromASM(sign.redeemScript);
            }
            if (sign.value) {
                witnessValue = toAmount(sign.value, params.amountType);
            }
            if (sign.witnessScript) {
                witnessScript = src_1.script.fromASM(sign.witnessScript);
            }
            if (sign.controlBlock) {
                controlBlock = Buffer.from(sign.controlBlock, 'hex');
            }
            if (params.useOldSignArgs) {
                // DEPRECATED: v6 will remove this interface
                txb.sign(index, keyPair, redeemScript, sign.hashType, toAmount(witnessValue, params.amountType), witnessScript, controlBlock);
            }
            else {
                // prevOutScriptType is required, see /ts_src/transaction_builder.ts
                // The PREVOUT_TYPES constant is a Set with all possible values.
                txb.sign({
                    prevOutScriptType: sign.prevOutScriptType,
                    vin: index,
                    keyPair,
                    redeemScript,
                    hashType: sign.hashType,
                    witnessValue: toAmount(witnessValue, params.amountType),
                    witnessScript,
                    controlBlock,
                });
            }
            if (sign.stage) {
                const tx = txb.buildIncomplete();
                assert.strictEqual(tx.toHex(), stages.shift());
                txb = src_1.TransactionBuilder.fromTransaction(tx, network);
            }
        });
    });
    return txb;
}
function construct(f, params) {
    const network = src_1.networks[f.network];
    const txb = new src_1.TransactionBuilder(network);
    if (Number.isFinite(f.version))
        txb.setVersion(f.version);
    if (f.locktime !== undefined)
        txb.setLockTime(f.locktime);
    f.inputs.forEach((input) => {
        let prevTx;
        if (input.txRaw) {
            const constructed = construct(input.txRaw, {
                amountType: params.amountType,
            });
            if (input.txRaw.incomplete)
                prevTx = constructed.buildIncomplete();
            else
                prevTx = constructed.build();
        }
        else if (input.txHex) {
            prevTx = src_1.Transaction.fromHex(input.txHex, params.amountType);
        }
        else {
            prevTx = input.txId;
        }
        let prevTxScript;
        if (input.prevTxScript) {
            prevTxScript = src_1.script.fromASM(input.prevTxScript);
        }
        txb.addInput(prevTx, input.vout, input.sequence, prevTxScript, toAmount(input.value, params.amountType));
    });
    f.outputs.forEach((output) => {
        if (output.address) {
            txb.addOutput(output.address, toAmount(output.value, params.amountType));
        }
        else {
            txb.addOutput(src_1.script.fromASM(output.script), toAmount(output.value, params.amountType));
        }
    });
    if (params.dontSign)
        return txb;
    return constructSign(f, txb, params);
}
function runTest(fixtures, testName, params) {
    // Search for "useOldSignArgs"
    // to find the second part of this console.warn replace
    let consoleWarn;
    if (params.useOldSignArgs) {
        consoleWarn = console.warn;
        // Silence console.warn during these tests
        console.warn = () => undefined;
    }
    (0, mocha_1.describe)(testName, () => {
        // constants
        const keyPair = src_1.ECPair.fromPrivateKey(Buffer.from('0000000000000000000000000000000000000000000000000000000000000001', 'hex'));
        const scripts = ['1BgGZ9tcN4rm9KBzDn7KprQz87SZ26SAMH', '1cMh228HTCiwS8ZsaakH8A8wze1JR5ZsP'].map((x) => {
            return src_1.address.toOutputScript(x, src_1.networks.bitcoin);
        });
        const txHash = Buffer.from('0e7cea811c0be9f73c0aca591034396e7264473fc25c1ca45195d7417b36cbe2', 'hex');
        (0, mocha_1.describe)('fromTransaction', () => {
            fixtures.valid.build.forEach((f) => {
                (0, mocha_1.it)('returns TransactionBuilder, with ' + f.description, () => {
                    const network = src_1.networks[f.network || 'bitcoin'];
                    const tx = src_1.Transaction.fromHex(f.txHex, params.amountType);
                    const txb = src_1.TransactionBuilder.fromTransaction(tx, network);
                    const txAfter = f.incomplete ? txb.buildIncomplete() : txb.build();
                    assert.strictEqual(txAfter.toHex(), f.txHex);
                    assert.strictEqual(txb.network, network);
                });
            });
            fixtures.valid.fromTransaction.forEach((f) => {
                (0, mocha_1.it)('returns TransactionBuilder, with ' + f.description, () => {
                    const tx = new src_1.Transaction();
                    f.inputs.forEach((input) => {
                        const txHash2 = Buffer.from(input.txId, 'hex').reverse();
                        tx.addInput(txHash2, input.vout, undefined, src_1.script.fromASM(input.scriptSig));
                    });
                    f.outputs.forEach((output) => {
                        tx.addOutput(src_1.script.fromASM(output.script), toAmount(output.value, params.amountType));
                    });
                    const txb = src_1.TransactionBuilder.fromTransaction(tx);
                    const txAfter = f.incomplete ? txb.buildIncomplete() : txb.build();
                    txAfter.ins.forEach((input, i) => {
                        assert.strictEqual(src_1.script.toASM(input.script), f.inputs[i].scriptSigAfter);
                    });
                    txAfter.outs.forEach((output, i) => {
                        assert.strictEqual(src_1.script.toASM(output.script), f.outputs[i].script);
                    });
                });
            });
            fixtures.valid.fromTransactionSequential.forEach((f) => {
                (0, mocha_1.it)('with ' + f.description, () => {
                    const network = src_1.networks[f.network];
                    const tx = src_1.Transaction.fromHex(f.txHex, params.amountType);
                    const txb = src_1.TransactionBuilder.fromTransaction(tx, network);
                    tx.ins.forEach((input, i) => {
                        assert.strictEqual(src_1.script.toASM(input.script), f.inputs[i].scriptSig);
                    });
                    constructSign(f, txb, params);
                    const txAfter = f.incomplete ? txb.buildIncomplete() : txb.build();
                    txAfter.ins.forEach((input, i) => {
                        assert.strictEqual(src_1.script.toASM(input.script), f.inputs[i].scriptSigAfter);
                    });
                    assert.strictEqual(txAfter.toHex(), f.txHexAfter);
                });
            });
            (0, mocha_1.it)('classifies transaction inputs', () => {
                const tx = src_1.Transaction.fromHex(fixtures.valid.classification.hex, params.amountType);
                const txb = src_1.TransactionBuilder.fromTransaction(tx);
                txb.__INPUTS.forEach((i) => {
                    assert.strictEqual(i.prevOutType, 'scripthash');
                    assert.strictEqual(i.redeemScriptType, 'multisig');
                });
            });
            fixtures.invalid.fromTransaction.forEach((f) => {
                (0, mocha_1.it)('throws ' + f.exception, () => {
                    const tx = src_1.Transaction.fromHex(f.txHex, params.amountType);
                    assert.throws(() => {
                        src_1.TransactionBuilder.fromTransaction(tx);
                    }, new RegExp(f.exception));
                });
            });
        });
        (0, mocha_1.describe)('addInput', () => {
            let txb;
            (0, mocha_1.beforeEach)(() => {
                txb = new src_1.TransactionBuilder();
            });
            (0, mocha_1.it)('accepts a txHash, index [and sequence number]', () => {
                const vin = txb.addInput(txHash, 1, 54);
                assert.strictEqual(vin, 0);
                const txIn = txb.__TX.ins[0];
                assert.strictEqual(txIn.hash, txHash);
                assert.strictEqual(txIn.index, 1);
                assert.strictEqual(txIn.sequence, 54);
                assert.strictEqual(txb.__INPUTS[0].prevOutScript, undefined);
            });
            (0, mocha_1.it)('accepts a txHash, index [, sequence number and scriptPubKey]', () => {
                const vin = txb.addInput(txHash, 1, 54, scripts[1]);
                assert.strictEqual(vin, 0);
                const txIn = txb.__TX.ins[0];
                assert.strictEqual(txIn.hash, txHash);
                assert.strictEqual(txIn.index, 1);
                assert.strictEqual(txIn.sequence, 54);
                assert.strictEqual(txb.__INPUTS[0].prevOutScript, scripts[1]);
            });
            (0, mocha_1.it)('accepts a prevTx, index [and sequence number]', () => {
                const prevTx = new src_1.Transaction();
                prevTx.addOutput(scripts[0], toAmount(0, params.amountType));
                prevTx.addOutput(scripts[1], toAmount(1, params.amountType));
                const vin = txb.addInput(prevTx, 1, 54);
                assert.strictEqual(vin, 0);
                const txIn = txb.__TX.ins[0];
                assert.deepStrictEqual(txIn.hash, prevTx.getHash());
                assert.strictEqual(txIn.index, 1);
                assert.strictEqual(txIn.sequence, 54);
                assert.strictEqual(txb.__INPUTS[0].prevOutScript, scripts[1]);
            });
            (0, mocha_1.it)('returns the input index', () => {
                assert.strictEqual(txb.addInput(txHash, 0), 0);
                assert.strictEqual(txb.addInput(txHash, 1), 1);
            });
            (0, mocha_1.it)('throws if SIGHASH_ALL has been used to sign any existing scriptSigs', () => {
                txb.addInput(txHash, 0);
                txb.addOutput(scripts[0], toAmount(1000, params.amountType));
                txb.sign({
                    prevOutScriptType: 'p2pkh',
                    vin: 0,
                    keyPair,
                });
                assert.throws(() => {
                    txb.addInput(txHash, 0);
                }, /No, this would invalidate signatures/);
            });
        });
        (0, mocha_1.describe)('addOutput', () => {
            let txb;
            (0, mocha_1.beforeEach)(() => {
                txb = new src_1.TransactionBuilder();
            });
            (0, mocha_1.it)('accepts an address string and value', () => {
                const { address } = src_1.payments.p2pkh({ pubkey: keyPair.publicKey });
                const vout = txb.addOutput(address, toAmount(1000, params.amountType));
                assert.strictEqual(vout, 0);
                const txout = txb.__TX.outs[0];
                assert.deepStrictEqual(txout.script, scripts[0]);
                assert.strictEqual(txout.value, toAmount(1000, params.amountType));
            });
            (0, mocha_1.it)('accepts a ScriptPubKey and value', () => {
                const vout = txb.addOutput(scripts[0], toAmount(1000, params.amountType));
                assert.strictEqual(vout, 0);
                const txout = txb.__TX.outs[0];
                assert.deepStrictEqual(txout.script, scripts[0]);
                assert.strictEqual(txout.value, toAmount(1000, params.amountType));
            });
            (0, mocha_1.it)('throws if address is of the wrong network', () => {
                assert.throws(() => {
                    txb.addOutput('2NGHjvjw83pcVFgMcA7QvSMh2c246rxLVz9', toAmount(1000, params.amountType));
                }, /2NGHjvjw83pcVFgMcA7QvSMh2c246rxLVz9 has no matching Script/);
            });
            (0, mocha_1.it)('add second output after signed first input with SIGHASH_NONE', () => {
                txb.addInput(txHash, 0);
                txb.addOutput(scripts[0], toAmount(2000, params.amountType));
                txb.sign({
                    prevOutScriptType: 'p2pkh',
                    vin: 0,
                    keyPair,
                    hashType: src_1.Transaction.SIGHASH_NONE,
                });
                assert.strictEqual(txb.addOutput(scripts[1], toAmount(9000, params.amountType)), 1);
            });
            (0, mocha_1.it)('add first output after signed first input with SIGHASH_NONE', () => {
                txb.addInput(txHash, 0);
                txb.sign({
                    prevOutScriptType: 'p2pkh',
                    vin: 0,
                    keyPair,
                    hashType: src_1.Transaction.SIGHASH_NONE,
                });
                assert.strictEqual(txb.addOutput(scripts[0], toAmount(2000, params.amountType)), 0);
            });
            (0, mocha_1.it)('add second output after signed first input with SIGHASH_SINGLE', () => {
                txb.addInput(txHash, 0);
                txb.addOutput(scripts[0], toAmount(2000, params.amountType));
                txb.sign({
                    prevOutScriptType: 'p2pkh',
                    vin: 0,
                    keyPair,
                    hashType: src_1.Transaction.SIGHASH_SINGLE,
                });
                assert.strictEqual(txb.addOutput(scripts[1], toAmount(9000, params.amountType)), 1);
            });
            (0, mocha_1.it)('add first output after signed first input with SIGHASH_SINGLE', () => {
                txb.addInput(txHash, 0);
                txb.sign({
                    prevOutScriptType: 'p2pkh',
                    vin: 0,
                    keyPair,
                    hashType: src_1.Transaction.SIGHASH_SINGLE,
                });
                assert.throws(() => {
                    txb.addOutput(scripts[0], toAmount(2000, params.amountType));
                }, /No, this would invalidate signatures/);
            });
            (0, mocha_1.it)('throws if SIGHASH_ALL has been used to sign any existing scriptSigs', () => {
                txb.addInput(txHash, 0);
                txb.addOutput(scripts[0], toAmount(2000, params.amountType));
                txb.sign({
                    prevOutScriptType: 'p2pkh',
                    vin: 0,
                    keyPair,
                });
                assert.throws(() => {
                    txb.addOutput(scripts[1], toAmount(9000, params.amountType));
                }, /No, this would invalidate signatures/);
            });
        });
        (0, mocha_1.describe)('setLockTime', () => {
            (0, mocha_1.it)('throws if if there exist any scriptSigs', () => {
                const txb = new src_1.TransactionBuilder();
                txb.addInput(txHash, 0);
                txb.addOutput(scripts[0], toAmount(100, params.amountType));
                txb.sign({
                    prevOutScriptType: 'p2pkh',
                    vin: 0,
                    keyPair,
                });
                assert.throws(() => {
                    txb.setLockTime(65535);
                }, /No, this would invalidate signatures/);
            });
        });
        (0, mocha_1.describe)('sign', () => {
            (0, mocha_1.it)('supports the alternative abstract interface { publicKey, sign }', () => {
                const innerKeyPair = {
                    publicKey: src_1.ECPair.makeRandom({
                        rng: () => {
                            return Buffer.alloc(32, 1);
                        },
                    }).publicKey,
                    sign: () => {
                        return Buffer.alloc(64, 0x5f);
                    },
                    signSchnorr: () => {
                        return Buffer.alloc(64, 0x4f);
                    },
                };
                const txb = new src_1.TransactionBuilder();
                txb.setVersion(1);
                txb.addInput('ffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff', 1);
                txb.addOutput('1111111111111111111114oLvT2', toAmount(100000, params.amountType));
                txb.sign({
                    prevOutScriptType: 'p2pkh',
                    vin: 0,
                    keyPair: innerKeyPair,
                });
                assert.strictEqual(txb.build().toHex(), '0100000001ffffffffffffffffffffffffffffffffffffffffffffffffffffffff' +
                    'ffffffff010000006a47304402205f5f5f5f5f5f5f5f5f5f5f5f5f5f5f5f5f5f5f' +
                    '5f5f5f5f5f5f5f5f5f5f5f5f5f02205f5f5f5f5f5f5f5f5f5f5f5f5f5f5f5f5f5f' +
                    '5f5f5f5f5f5f5f5f5f5f5f5f5f5f0121031b84c5567b126440995d3ed5aaba0565' +
                    'd71e1834604819ff9c17f5e9d5dd078fffffffff01a0860100000000001976a914' +
                    '000000000000000000000000000000000000000088ac00000000');
            });
            (0, mocha_1.it)('supports low R signature signing', () => {
                let txb = new src_1.TransactionBuilder();
                txb.setVersion(1);
                txb.addInput('ffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff', 1);
                txb.addOutput('1111111111111111111114oLvT2', toAmount(100000, params.amountType));
                txb.sign({
                    prevOutScriptType: 'p2pkh',
                    vin: 0,
                    keyPair,
                });
                // high R
                assert.strictEqual(txb.build().toHex(), '0100000001ffffffffffffffffffffffffffffffffffffffffffffffffffffffff' +
                    'ffffffff010000006b483045022100b872677f35c9c14ad9c41d83649fb049250f' +
                    '32574e0b2547d67e209ed14ff05d022059b36ad058be54e887a1a311d5c393cb49' +
                    '41f6b93a0b090845ec67094de8972b01210279be667ef9dcbbac55a06295ce870b' +
                    '07029bfcdb2dce28d959f2815b16f81798ffffffff01a0860100000000001976a9' +
                    '14000000000000000000000000000000000000000088ac00000000');
                txb = new src_1.TransactionBuilder();
                txb.setVersion(1);
                txb.addInput('ffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff', 1);
                txb.addOutput('1111111111111111111114oLvT2', toAmount(100000, params.amountType));
                txb.setLowR();
                txb.sign({
                    prevOutScriptType: 'p2pkh',
                    vin: 0,
                    keyPair,
                });
                // low R
                assert.strictEqual(txb.build().toHex(), '0100000001ffffffffffffffffffffffffffffffffffffffffffffffffffffffff' +
                    'ffffffff010000006a473044022012a601efa8756ebe83e9ac7a7db061c3147e3b' +
                    '49d8be67685799fe51a4c8c62f02204d568d301d5ce14af390d566d4fd50e7b8ee' +
                    '48e71ec67786c029e721194dae3601210279be667ef9dcbbac55a06295ce870b07' +
                    '029bfcdb2dce28d959f2815b16f81798ffffffff01a0860100000000001976a914' +
                    '000000000000000000000000000000000000000088ac00000000');
            });
            (0, mocha_1.it)('fails when missing required arguments', () => {
                const txb = new src_1.TransactionBuilder();
                txb.setVersion(1);
                txb.addInput('ffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff', 1);
                txb.addOutput('1111111111111111111114oLvT2', toAmount(100000, params.amountType));
                assert.throws(() => {
                    txb.sign();
                }, /TransactionBuilder sign first arg must be TxbSignArg or number/);
                assert.throws(() => {
                    txb.sign({
                        prevOutScriptType: 'p2pkh',
                        vin: 1,
                        keyPair,
                    });
                }, /No input at index: 1/);
                assert.throws(() => {
                    txb.sign({
                        prevOutScriptType: 'p2pkh',
                        keyPair,
                    });
                }, /sign must include vin parameter as Number \(input index\)/);
                assert.throws(() => {
                    txb.sign({
                        prevOutScriptType: 'p2pkh',
                        vin: 0,
                        keyPair: {},
                    });
                }, /sign must include keyPair parameter as Signer interface/);
                assert.throws(() => {
                    txb.sign({
                        prevOutScriptType: 'p2pkh',
                        vin: 0,
                        keyPair,
                        hashType: 'string',
                    });
                }, /sign hashType parameter must be a number/);
                if (params.useOldSignArgs) {
                    assert.throws(() => {
                        txb.sign(0);
                    }, /sign requires keypair/);
                }
            });
            fixtures.invalid.sign.forEach((f) => {
                (0, mocha_1.it)('throws ' + f.exception + (f.description ? ' (' + f.description + ')' : ''), () => {
                    const txb = construct(f, {
                        dontSign: true,
                        amountType: params.amountType,
                    });
                    let threw = false;
                    f.inputs.forEach((input, index) => {
                        input.signs.forEach((sign) => {
                            const keyPairNetwork = src_1.networks[sign.network || f.network];
                            const keyPair2 = src_1.ECPair.fromWIF(sign.keyPair, keyPairNetwork);
                            let redeemScript;
                            let witnessScript;
                            let witnessValue;
                            if (sign.redeemScript) {
                                redeemScript = src_1.script.fromASM(sign.redeemScript);
                            }
                            if (sign.witnessScript) {
                                witnessScript = src_1.script.fromASM(sign.witnessScript);
                            }
                            if (sign.value) {
                                witnessValue = toAmount(sign.value, params.amountType);
                            }
                            if (sign.throws) {
                                assert.throws(() => {
                                    txb.sign({
                                        prevOutScriptType: sign.prevOutScriptType,
                                        vin: index,
                                        keyPair: keyPair2,
                                        redeemScript,
                                        hashType: sign.hashType,
                                        witnessValue,
                                        witnessScript,
                                    });
                                }, new RegExp(f.exception));
                                threw = true;
                            }
                            else {
                                txb.sign({
                                    prevOutScriptType: sign.prevOutScriptType,
                                    vin: index,
                                    keyPair: keyPair2,
                                    redeemScript,
                                    hashType: sign.hashType,
                                    witnessValue,
                                    witnessScript,
                                });
                            }
                        });
                    });
                    assert.strictEqual(threw, true);
                });
            });
        });
        (0, mocha_1.describe)('build', () => {
            fixtures.valid.build.forEach((f) => {
                (0, mocha_1.it)('builds "' + f.description + '"', () => {
                    const txb = construct(f, params);
                    const tx = f.incomplete ? txb.buildIncomplete() : txb.build();
                    assert.strictEqual(tx.toHex(), f.txHex);
                });
            });
            // TODO: remove duplicate test code
            fixtures.invalid.build.forEach((f) => {
                (0, mocha_1.describe)('for ' + (f.description || f.exception), () => {
                    (0, mocha_1.it)('throws ' + f.exception, () => {
                        assert.throws(() => {
                            let txb;
                            if (f.txHex) {
                                txb = src_1.TransactionBuilder.fromTransaction(src_1.Transaction.fromHex(f.txHex, params.amountType));
                            }
                            else {
                                txb = construct(f, params);
                            }
                            txb.build();
                        }, new RegExp(f.exception));
                    });
                    // if throws on incomplete too, enforce that
                    if (f.incomplete) {
                        (0, mocha_1.it)('throws ' + f.exception, () => {
                            assert.throws(() => {
                                let txb;
                                if (f.txHex) {
                                    txb = src_1.TransactionBuilder.fromTransaction(src_1.Transaction.fromHex(f.txHex, params.amountType));
                                }
                                else {
                                    txb = construct(f, params);
                                }
                                txb.buildIncomplete();
                            }, new RegExp(f.exception));
                        });
                    }
                    else {
                        (0, mocha_1.it)('does not throw if buildIncomplete', () => {
                            let txb;
                            if (f.txHex) {
                                txb = src_1.TransactionBuilder.fromTransaction(src_1.Transaction.fromHex(f.txHex, params.amountType));
                            }
                            else {
                                txb = construct(f, params);
                            }
                            txb.buildIncomplete();
                        });
                    }
                });
            });
            (0, mocha_1.it)('for incomplete with 0 signatures', () => {
                const randomTxData = '010000000001010001000000000000000000000000000000000000000000000000' +
                    '0000000000000000000000ffffffff01e8030000000000001976a9144c9c3dfac4' +
                    '207d5d8cb89df5722cb3d712385e3f88ac02483045022100aa5d8aa40a90f23ce2' +
                    'c3d11bc845ca4a12acd99cbea37de6b9f6d86edebba8cb022022dedc2aa0a255f7' +
                    '4d04c0b76ece2d7c691f9dd11a64a8ac49f62a99c3a05f9d01232103596d345102' +
                    '5c19dbbdeb932d6bf8bfb4ad499b95b6f88db8899efac102e5fc71ac00000000';
                const randomAddress = '1BgGZ9tcN4rm9KBzDn7KprQz87SZ26SAMH';
                const randomTx = src_1.Transaction.fromHex(randomTxData, params.amountType);
                const txb = new src_1.TransactionBuilder();
                txb.addInput(randomTx, 0);
                txb.addOutput(randomAddress, toAmount(1000, params.amountType));
                const tx = txb.buildIncomplete();
                assert(tx);
            });
            (0, mocha_1.it)('for incomplete P2SH with 0 signatures', () => {
                const inp = Buffer.from('010000000173120703f67318aef51f7251272a6816d3f7523bb25e34b136d80be9' +
                    '59391c100000000000ffffffff0100c817a80400000017a91471a8ec07ff69c6c4' +
                    'fee489184c462a9b1b9237488700000000', 'hex'); // arbitrary P2SH input
                const inpTx = src_1.Transaction.fromBuffer(inp, undefined, params.amountType);
                const txb = new src_1.TransactionBuilder(src_1.networks.testnet);
                txb.addInput(inpTx, 0);
                txb.addOutput('2NAkqp5xffoomp5RLBcakuGpZ12GU4twdz4', toAmount(1e8, params.amountType)); // arbitrary output
                txb.buildIncomplete();
            });
            (0, mocha_1.it)('for incomplete P2WPKH with 0 signatures', () => {
                const inp = Buffer.from('010000000173120703f67318aef51f7251272a6816d3f7523bb25e34b136d80be9' +
                    '59391c100000000000ffffffff0100c817a8040000001600141a15805e1f4040c9' +
                    'f68ccc887fca2e63547d794b00000000', 'hex');
                const inpTx = src_1.Transaction.fromBuffer(inp, undefined, params.amountType);
                const txb = new src_1.TransactionBuilder(src_1.networks.testnet);
                txb.addInput(inpTx, 0);
                txb.addOutput('2NAkqp5xffoomp5RLBcakuGpZ12GU4twdz4', toAmount(1e8, params.amountType)); // arbitrary output
                txb.buildIncomplete();
            });
            (0, mocha_1.it)('for incomplete P2WSH with 0 signatures', () => {
                const inpTx = src_1.Transaction.fromBuffer(Buffer.from('010000000173120703f67318aef51f7251272a6816d3f7523bb25e34b136d80b' +
                    'e959391c100000000000ffffffff0100c817a80400000022002072df76fcc0b2' +
                    '31b94bdf7d8c25d7eef4716597818d211e19ade7813bff7a250200000000', 'hex'), undefined, params.amountType);
                const txb = new src_1.TransactionBuilder(src_1.networks.testnet);
                txb.addInput(inpTx, 0);
                txb.addOutput('2NAkqp5xffoomp5RLBcakuGpZ12GU4twdz4', toAmount(1e8, params.amountType)); // arbitrary output
                txb.buildIncomplete();
            });
        });
        (0, mocha_1.describe)('multisig', () => {
            fixtures.valid.multisig.forEach((f) => {
                (0, mocha_1.it)(f.description, () => {
                    const network = src_1.networks[f.network];
                    let txb = construct(f, {
                        dontSign: true,
                        amountType: params.amountType,
                    });
                    let tx;
                    f.inputs.forEach((input, i) => {
                        const redeemScript = src_1.script.fromASM(input.redeemScript);
                        input.signs.forEach((sign) => {
                            // rebuild the transaction each-time after the first
                            if (tx) {
                                // manually override the scriptSig?
                                if (sign.scriptSigBefore) {
                                    tx.ins[i].script = src_1.script.fromASM(sign.scriptSigBefore);
                                }
                                // rebuild
                                txb = src_1.TransactionBuilder.fromTransaction(tx, network);
                            }
                            const keyPair2 = src_1.ECPair.fromWIF(sign.keyPair, network);
                            txb.sign({
                                prevOutScriptType: sign.prevOutScriptType,
                                vin: i,
                                keyPair: keyPair2,
                                redeemScript,
                                hashType: sign.hashType,
                            });
                            // update the tx
                            tx = txb.buildIncomplete();
                            // now verify the serialized scriptSig is as expected
                            assert.strictEqual(src_1.script.toASM(tx.ins[i].script), sign.scriptSig);
                        });
                    });
                    tx = txb.build();
                    assert.strictEqual(tx.toHex(), f.txHex);
                });
            });
        });
        (0, mocha_1.describe)('various edge case', () => {
            const network = src_1.networks.testnet;
            (0, mocha_1.it)('should warn of high fee for segwit transaction based on VSize, not Size', () => {
                const rawtx = '01000000000104fdaac89627208b4733484ca56bc291f4cf4fa8d7c5f29893c52b46788a0a' +
                    '1df90000000000fffffffffdaac89627208b4733484ca56bc291f4cf4fa8d7c5f29893c52b46788a0a1df9' +
                    '0100000000ffffffffa2ef7aaab316a3e5b5b0a78d1d35c774b95a079f9f0c762277a49caf1f26bca40000' +
                    '000000ffffffffa2ef7aaab316a3e5b5b0a78d1d35c774b95a079f9f0c762277a49caf1f26bca401000000' +
                    '00ffffffff0100040000000000001976a914cf307285359ab7ef6a2daa0522c7908ddf5fe7a988ac024730' +
                    '440220113324438816338406841775e079b04c50d04f241da652a4035b1017ea1ecf5502205802191eb49c' +
                    '54bf2a5667aea72e51c3ca92085efc60f12d1ebda3a64aff343201210283409659355b6d1cc3c32decd5d5' +
                    '61abaac86c37a353b52895a5e6c196d6f44802483045022100dc2892874e6d8708e3f5a058c5c9263cdf03' +
                    '969492270f89ee4933caf6daf8bb0220391dfe61a002709b63b9d64422d3db09b727839d1287e10a128a5d' +
                    'b52a82309301210283409659355b6d1cc3c32decd5d561abaac86c37a353b52895a5e6c196d6f448024830' +
                    '450221009e3ed3a6ae93a018f443257b43e47b55cf7f7f3547d8807178072234686b22160220576121cfe6' +
                    '77c7eddf5575ea0a7c926247df6eca723c4f85df306e8bc08ea2df01210283409659355b6d1cc3c32decd5' +
                    'd561abaac86c37a353b52895a5e6c196d6f44802473044022007be81ffd4297441ab10e740fc9bab9545a2' +
                    '194a565cd6aa4cc38b8eaffa343402201c5b4b61d73fa38e49c1ee68cc0e6dfd2f5dae453dd86eb142e87a' +
                    '0bafb1bc8401210283409659355b6d1cc3c32decd5d561abaac86c37a353b52895a5e6c196d6f44800000000';
                const txb = src_1.TransactionBuilder.fromTransaction(src_1.Transaction.fromHex(rawtx, params.amountType));
                txb.__INPUTS[0].value = toAmount(241530, params.amountType);
                txb.__INPUTS[1].value = toAmount(241530, params.amountType);
                txb.__INPUTS[2].value = toAmount(248920, params.amountType);
                txb.__INPUTS[3].value = toAmount(248920, params.amountType);
                assert.throws(() => {
                    txb.build();
                }, new RegExp('Transaction has absurd fees'));
            });
            (0, mocha_1.it)('should classify witness inputs with witness = true during multisigning', () => {
                const innerKeyPair = src_1.ECPair.fromWIF('cRAwuVuVSBZMPu7hdrYvMCZ8eevzmkExjFbaBLhqnDdrezxN3nTS', network);
                const witnessScript = Buffer.from('522102bbbd6eb01efcbe4bd9664b886f26f69de5afcb2e479d72596c8bf21929e3' +
                    '52e22102d9c3f7180ef13ec5267723c9c2ffab56a4215241f837502ea8977c8532' +
                    'b9ea1952ae', 'hex');
                const redeemScript = Buffer.from('002024376a0a9abab599d0e028248d48ebe817bc899efcffa1cd2984d67289daf5af', 'hex');
                const scriptPubKey = Buffer.from('a914b64f1a3eacc1c8515592a6f10457e8ff90e4db6a87', 'hex');
                const txb = new src_1.TransactionBuilder(network);
                txb.setVersion(1);
                txb.addInput('a4696c4b0cd27ec2e173ab1fa7d1cc639a98ee237cec95a77ca7ff4145791529', 1, 0xffffffff, scriptPubKey);
                txb.addOutput(scriptPubKey, toAmount(99000, params.amountType));
                txb.sign({
                    prevOutScriptType: 'p2sh-p2wsh-p2ms',
                    vin: 0,
                    keyPair: innerKeyPair,
                    redeemScript,
                    witnessValue: toAmount(100000, params.amountType),
                    witnessScript,
                });
                // 2-of-2 signed only once
                const tx = txb.buildIncomplete();
                // Only input is segwit, so txid should be accurate with the final tx
                assert.strictEqual(tx.getId(), 'f15d0a65b21b4471405b21a099f8b18e1ae4d46d55efbd0f4766cf11ad6cb821');
                const txHex = tx.toHex();
                src_1.TransactionBuilder.fromTransaction(src_1.Transaction.fromHex(txHex, params.amountType));
            });
            (0, mocha_1.it)('should handle badly pre-filled OP_0s', () => {
                // OP_0 is used where a signature is missing
                const redeemScripSig = src_1.script.fromASM('OP_0 OP_0 3045022100daf0f4f3339d9fbab42b098045c1e4958ee3b308f4ae17' +
                    'be80b63808558d0adb02202f07e3d1f79dc8da285ae0d7f68083d769c11f5621eb' +
                    'd9691d6b48c0d4283d7d01 52410479be667ef9dcbbac55a06295ce870b07029bf' +
                    'cdb2dce28d959f2815b16f81798483ada7726a3c4655da4fbfc0e1108a8fd17b44' +
                    '8a68554199c47d08ffb10d4b84104c6047f9441ed7d6d3045406e95c07cd85c778' +
                    'e4b8cef3ca7abac09b95c709ee51ae168fea63dc339a3c58419466ceaeef7f6326' +
                    '53266d0e1236431a950cfe52a4104f9308a019258c31049344f85f89d5229b531c' +
                    '845836f99b08601f113bce036f9388f7b0f632de8140fe337e62a37f3566500a99' +
                    '934c2231b6cb9fd7584b8e67253ae');
                const redeemScript = src_1.script.fromASM('OP_2 0479be667ef9dcbbac55a06295ce870b07029bfcdb2dce28d959f2815b16f' +
                    '81798483ada7726a3c4655da4fbfc0e1108a8fd17b448a68554199c47d08ffb10d' +
                    '4b8 04c6047f9441ed7d6d3045406e95c07cd85c778e4b8cef3ca7abac09b95c70' +
                    '9ee51ae168fea63dc339a3c58419466ceaeef7f632653266d0e1236431a950cfe5' +
                    '2a 04f9308a019258c31049344f85f89d5229b531c845836f99b08601f113bce03' +
                    '6f9388f7b0f632de8140fe337e62a37f3566500a99934c2231b6cb9fd7584b8e67' +
                    '2 OP_3 OP_CHECKMULTISIG');
                const tx = new src_1.Transaction();
                tx.addInput(Buffer.from('cff58855426469d0ef16442ee9c644c4fb13832467bcbc3173168a7916f07149', 'hex'), 0, undefined, redeemScripSig);
                tx.addOutput(Buffer.from('76a914aa4d7985c57e011a8b3dd8e0e5a73aaef41629c588ac', 'hex'), toAmount(1000, params.amountType));
                // now import the Transaction
                const txb = src_1.TransactionBuilder.fromTransaction(tx, src_1.networks.testnet);
                const keyPair2 = src_1.ECPair.fromWIF('91avARGdfge8E4tZfYLoxeJ5sGBdNJQH4kvjJoQFacbgx3cTMqe', network);
                txb.sign({
                    prevOutScriptType: 'p2sh-p2ms',
                    vin: 0,
                    keyPair: keyPair2,
                    redeemScript,
                });
                const tx2 = txb.build();
                assert.strictEqual(tx2.getId(), 'eab59618a564e361adef6d918bd792903c3d41bcf1220137364fb847880467f9');
                assert.strictEqual(src_1.script.toASM(tx2.ins[0].script), 'OP_0 3045022100daf0f4f3339d9fbab42b098045c1e4958ee3b308f4ae17be80b' +
                    '63808558d0adb02202f07e3d1f79dc8da285ae0d7f68083d769c11f5621ebd9691' +
                    'd6b48c0d4283d7d01 3045022100a346c61738304eac5e7702188764d19cdf68f4' +
                    '466196729db096d6c87ce18cdd022018c0e8ad03054b0e7e235cda6bedecf35881' +
                    'd7aa7d94ff425a8ace7220f38af001 52410479be667ef9dcbbac55a06295ce870' +
                    'b07029bfcdb2dce28d959f2815b16f81798483ada7726a3c4655da4fbfc0e1108a' +
                    '8fd17b448a68554199c47d08ffb10d4b84104c6047f9441ed7d6d3045406e95c07' +
                    'cd85c778e4b8cef3ca7abac09b95c709ee51ae168fea63dc339a3c58419466ceae' +
                    'ef7f632653266d0e1236431a950cfe52a4104f9308a019258c31049344f85f89d5' +
                    '229b531c845836f99b08601f113bce036f9388f7b0f632de8140fe337e62a37f35' +
                    '66500a99934c2231b6cb9fd7584b8e67253ae');
            });
            (0, mocha_1.it)('should not classify blank scripts as nonstandard', () => {
                let txb = new src_1.TransactionBuilder();
                txb.setVersion(1);
                txb.addInput('aa94ab02c182214f090e99a0d57021caffd0f195a81c24602b1028b130b63e31', 0);
                const incomplete = txb.buildIncomplete().toHex();
                const innerKeyPair = src_1.ECPair.fromWIF('L1uyy5qTuGrVXrmrsvHWHgVzW9kKdrp27wBC7Vs6nZDTF2BRUVwy');
                // sign, as expected
                txb.addOutput('1Gokm82v6DmtwKEB8AiVhm82hyFSsEvBDK', toAmount(15000, params.amountType));
                txb.sign({
                    prevOutScriptType: 'p2pkh',
                    vin: 0,
                    keyPair: innerKeyPair,
                });
                const txId = txb.build().getId();
                assert.strictEqual(txId, '54f097315acbaedb92a95455da3368eb45981cdae5ffbc387a9afc872c0f29b3');
                // and, repeat
                txb = src_1.TransactionBuilder.fromTransaction(src_1.Transaction.fromHex(incomplete, params.amountType));
                txb.addOutput('1Gokm82v6DmtwKEB8AiVhm82hyFSsEvBDK', toAmount(15000, params.amountType));
                txb.sign({
                    prevOutScriptType: 'p2pkh',
                    vin: 0,
                    keyPair: innerKeyPair,
                });
                const txId2 = txb.build().getId();
                assert.strictEqual(txId, txId2);
                // TODO: Remove me in v6
                if (params.useOldSignArgs) {
                    console.warn = consoleWarn;
                }
            });
        });
    });
}
// TODO: Remove loop in v6
for (const useOldSignArgs of [false, true]) {
    runTest(txb_fixtures, `TransactionBuilder: useOldSignArgs === ${useOldSignArgs}, amountType === number, testFixture === transaction_builder.json`, { useOldSignArgs, amountType: 'number' });
    runTest(txb_fixtures, `TransactionBuilder: useOldSignArgs === ${useOldSignArgs}, amountType === bigint, testFixture === transaction_builder.json`, { useOldSignArgs, amountType: 'bigint' });
    runTest(txb_big_fixtures, `TransactionBuilder: useOldSignArgs === ${useOldSignArgs}, amountType === bigint, testFixture === transaction_builder_bigint.json`, { useOldSignArgs, amountType: 'bigint' });
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidHJhbnNhY3Rpb25fYnVpbGRlci5zcGVjLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vdGVzdC90cmFuc2FjdGlvbl9idWlsZGVyLnNwZWMudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7QUFDQSxpQ0FBaUM7QUFDakMsaUNBQWlEO0FBQ2pELGdDQVFnQjtBQUVoQixPQUFPLENBQUMsSUFBSSxHQUFHLEdBQVMsRUFBRTtJQUN4QixPQUFPO0FBQ1QsQ0FBQyxDQUFDLENBQUMsa0NBQWtDO0FBRXJDLG9FQUFvRTtBQUNwRSwrRUFBK0U7QUFFL0UsU0FBUyxRQUFRLENBQUMsQ0FBa0IsRUFBRSxDQUFzQjtJQUMxRCxJQUFJLENBQUMsS0FBSyxTQUFTLEVBQUU7UUFDbkIsT0FBTyxDQUFDLENBQUM7S0FDVjtJQUNELElBQUksQ0FBQyxLQUFLLFFBQVEsRUFBRTtRQUNsQixPQUFPLE1BQU0sQ0FBQyxDQUFDLENBQUMsQ0FBQztLQUNsQjtJQUNELElBQUksQ0FBQyxLQUFLLFFBQVEsRUFBRTtRQUNsQixPQUFPLE1BQU0sQ0FBQyxDQUFDLENBQUMsQ0FBQztLQUNsQjtJQUNELE1BQU0sSUFBSSxLQUFLLEVBQUUsQ0FBQztBQUNwQixDQUFDO0FBRUQsU0FBUyxhQUFhLENBQ3BCLENBQU0sRUFDTixHQUFnQyxFQUNoQyxNQUdDO0lBRUQsTUFBTSxPQUFPLEdBQUksY0FBZ0IsQ0FBQyxDQUFDLENBQUMsT0FBTyxDQUFDLENBQUM7SUFDN0MsTUFBTSxNQUFNLEdBQUcsQ0FBQyxDQUFDLE1BQU0sSUFBSSxDQUFDLENBQUMsTUFBTSxDQUFDLE1BQU0sRUFBRSxDQUFDO0lBRTdDLENBQUMsQ0FBQyxNQUFNLENBQUMsT0FBTyxDQUFDLENBQUMsS0FBVSxFQUFFLEtBQWEsRUFBRSxFQUFFO1FBQzdDLElBQUksQ0FBQyxLQUFLLENBQUMsS0FBSztZQUFFLE9BQU87UUFDekIsS0FBSyxDQUFDLEtBQUssQ0FBQyxPQUFPLENBQUMsQ0FBQyxJQUFTLEVBQUUs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QU8sQ0FDTCxZQUFZLEVBQ1osMENBQTBDLGNBQWMsbUVBQW1FLEVBQzNILEVBQUUsY0FBYyxFQUFFLFVBQVUsRUFBRSxRQUFRLEVBQUUsQ0FDekMsQ0FBQztJQUNGLE9BQU8sQ0FDTCxnQkFBZ0IsRUFDaEIsMENBQTBDLGNBQWMsMEVBQTBFLEVBQ2xJLEVBQUUsY0FBYyxFQUFFLFVBQVUsRUFBRSxRQUFRLEVBQUUsQ0FDekMsQ0FBQztDQUNIIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0ICogYXMgYml0Y29pbmpzIGZyb20gJ2JpdGNvaW5qcy1saWInO1xyXG5pbXBvcnQgKiBhcyBhc3NlcnQgZnJvbSAnYXNzZXJ0JztcclxuaW1wb3J0IHsgYmVmb3JlRWFjaCwgZGVzY3JpYmUsIGl0IH0gZnJvbSAnbW9jaGEnO1xyXG5pbXBvcnQge1xyXG4gIGFkZHJlc3MgYXMgYmFkZHJlc3MsXHJcbiAgbmV0d29ya3MgYXMgTkVUV09SS1MsXHJcbiAgcGF5bWVudHMsXHJcbiAgc2NyaXB0IGFzIGJzY3JpcHQsXHJcbiAgVHJhbnNhY3Rpb24sXHJcbiAgVHJhbnNhY3Rpb25CdWlsZGVyLFxyXG4gIEVDUGFpcixcclxufSBmcm9tICcuLi9zcmMnO1xyXG5cclxuY29uc29sZS53YXJuID0gKCk6IHZvaWQgPT4ge1xyXG4gIHJldHVybjtcclxufTsgLy8gU2lsZW5jZSB0aGUgRGVwcmVjYXRpb24gV2FybmluZ1xyXG5cclxuaW1wb3J0ICogYXMgdHhiX2ZpeHR1cmVzIGZyb20gJy4vZml4dHVyZXMvdHJhbnNhY3Rpb25fYnVpbGRlci5qc29uJztcclxuaW1wb3J0ICogYXMgdHhiX2JpZ19maXh0dXJlcyBmcm9tICcuL2ZpeHR1cmVzL3RyYW5zYWN0aW9uX2J1aWxkZXJfYmlnaW50Lmpzb24nO1xyXG5cclxuZnVuY3Rpb24gdG9BbW91bnQodjogYW55IHwgdW5kZWZpbmVkLCB0OiAnbnVtYmVyJyB8ICdiaWdpbnQnKTogbnVtYmVyIHwgYmlnaW50IHwgdW5kZWZpbmVkIHtcclxuICBpZiAodiA9PT0gdW5kZWZpbmVkKSB7XHJcbiAgICByZXR1cm4gdjtcclxuICB9XHJcbiAgaWYgKHQgPT09ICdudW1iZXInKSB7XHJcbiAgICByZXR1cm4gTnVtYmVyKHYpO1xyXG4gIH1cclxuICBpZiAodCA9PT0gJ2JpZ2ludCcpIHtcclxuICAgIHJldHVybiBCaWdJbnQodik7XHJcbiAgfVxyXG4gIHRocm93IG5ldyBFcnJvcigpO1xyXG59XHJcblxyXG5mdW5jdGlvbiBjb25zdHJ1Y3RTaWduPFROdW1iZXIgZXh0ZW5kcyBudW1iZXIgfCBiaWdpbnQ+KFxyXG4gIGY6IGFueSxcclxuICB0eGI6IFRyYW5zYWN0aW9uQnVpbGRlcjxUTnVtYmVyPixcclxuICBwYXJhbXM6IHtcclxuICAgIHVzZU9sZFNpZ25BcmdzPzogYm9vbGVhbjtcclxuICAgIGFtb3VudFR5cGU6ICdudW1iZXInIHwgJ2JpZ2ludCc7XHJcbiAgfVxyXG4pOiBUcmFuc2FjdGlvbkJ1aWxkZXI8VE51bWJlcj4ge1xyXG4gIGNvbnN0IG5ldHdvcmsgPSAoTkVUV09SS1MgYXMgYW55KVtmLm5ldHdvcmtdO1xyXG4gIGNvbnN0IHN0YWdlcyA9IGYuc3RhZ2VzICYmIGYuc3RhZ2VzLmNvbmNhdCgpO1xyXG5cclxuICBmLmlucHV0cy5mb3JFYWNoKChpbnB1dDogYW55LCBpbmRleDogbnVtYmVyKSA9PiB7XHJcbiAgICBpZiAoIWlucHV0LnNpZ25zKSByZXR1cm47XHJcbiAgICBpbnB1dC5zaWducy5mb3JFYWNoKChzaWduOiBhbnkpID0+IHtcclxuICAgICAgY29uc3Qga2V5UGFpciA9IEVDUGFpci5mcm9tV0lGKHNpZ24ua2V5UGFpciwgbmV0d29yayk7XHJcbiAgICAgIGxldCByZWRlZW1TY3JpcHQ7XHJcbiAgICAgIGxldCB3aXRuZXNzU2NyaXB0O1xyXG4gICAgICBsZXQgd2l0bmVzc1ZhbHVlO1xyXG4gICAgICBsZXQgY29udHJvbEJsb2NrO1xyXG5cclxuICAgICAgaWYgKHNpZ24ucmVkZWVtU2NyaXB0KSB7XHJcbiAgICAgICAgcmVkZWVtU2NyaXB0ID0gYnNjcmlwdC5mcm9tQVNNKHNpZ24ucmVkZWVtU2NyaXB0KTtcclxuICAgICAgfVxyXG5cclxuICAgICAgaWYgKHNpZ24udmFsdWUpIHtcclxuICAgICAgICB3aXRuZXNzVmFsdWUgPSB0b0Ftb3VudChzaWduLnZhbHVlLCBwYXJhbXMuYW1vdW50VHlwZSk7XHJcbiAgICAgIH1cclxuXHJcbiAgICAgIGlmIChzaWduLndpdG5lc3NTY3JpcHQpIHtcclxuICAgICAgICB3aXRuZXNzU2NyaXB0ID0gYnNjcmlwdC5mcm9tQVNNKHNpZ24ud2l0bmVzc1NjcmlwdCk7XHJcbiAgICAgIH1cclxuXHJcbiAgICAgIGlmIChzaWduLmNvbnRyb2xCbG9jaykge1xyXG4gICAgICAgIGNvbnRyb2xCbG9jayA9IEJ1ZmZlci5mcm9tKHNpZ24uY29udHJvbEJsb2NrLCAnaGV4Jyk7XHJcbiAgICAgIH1cclxuXHJcbiAgICAgIGlmIChwYXJhbXMudXNlT2xkU2lnbkFyZ3MpIHtcclxuICAgICAgICAvLyBERVBSRUNBVEVEOiB2NiB3aWxsIHJlbW92ZSB0aGlzIGludGVyZmFjZVxyXG4gICAgICAgIHR4Yi5zaWduKFxyXG4gICAgICAgICAgaW5kZXgsXHJcbiAgICAgICAgICBrZXlQYWlyLFxyXG4gICAgICAgICAgcmVkZWVtU2NyaXB0LFxyXG4gICAgICAgICAgc2lnbi5oYXNoVHlwZSxcclxuICAgICAgICAgIHRvQW1vdW50KHdpdG5lc3NWYWx1ZSwgcGFyYW1zLmFtb3VudFR5cGUpIGFzIFROdW1iZXIsXHJcbiAgICAgICAgICB3aXRuZXNzU2NyaXB0LFxyXG4gICAgICAgICAgY29udHJvbEJsb2NrXHJcbiAgICAgICAgKTtcclxuICAgICAgfSBlbHNlIHtcclxuICAgICAgICAvLyBwcmV2T3V0U2NyaXB0VHlwZSBpcyByZXF1aXJlZCwgc2VlIC90c19zcmMvdHJhbnNhY3Rpb25fYnVpbGRlci50c1xyXG4gICAgICAgIC8vIFRoZSBQUkVWT1VUX1RZUEVTIGNvbnN0YW50IGlzIGEgU2V0IHdpdGggYWxsIHBvc3NpYmxlIHZhbHVlcy5cclxuICAgICAgICB0eGIuc2lnbih7XHJcbiAgICAgICAgICBwcmV2T3V0U2NyaXB0VHlwZTogc2lnbi5wcmV2T3V0U2NyaXB0VHlwZSxcclxuICAgICAgICAgIHZpbjogaW5kZXgsXHJcbiAgICAgICAgICBrZXlQYWlyLFxyXG4gICAgICAgICAgcmVkZWVtU2NyaXB0LFxyXG4gICAgICAgICAgaGFzaFR5cGU6IHNpZ24uaGFzaFR5cGUsXHJcbiAgICAgICAgICB3aXRuZXNzVmFsdWU6IHRvQW1vdW50KHdpdG5lc3NWYWx1ZSwgcGFyYW1zLmFtb3VudFR5cGUpIGFzIFROdW1iZXIsXHJcbiAgICAgICAgICB3aXRuZXNzU2NyaXB0LFxyXG4gICAgICAgICAgY29udHJvbEJsb2NrLFxyXG4gICAgICAgIH0pO1xyXG4gICAgICB9XHJcblxyXG4gICAgICBpZiAoc2lnbi5zdGFnZSkge1xyXG4gICAgICAgIGNvbnN0IHR4ID0gdHhiLmJ1aWxkSW5jb21wbGV0ZSgpO1xyXG4gICAgICAgIGFzc2VydC5zdHJpY3RFcXVhbCh0eC50b0hleCgpLCBzdGFnZXMuc2hpZnQoKSk7XHJcbiAgICAgICAgdHhiID0gVHJhbnNhY3Rpb25CdWlsZGVyLmZyb21UcmFuc2FjdGlvbih0eCwgbmV0d29yayk7XHJcbiAgICAgIH1cclxuICAgIH0pO1xyXG4gIH0pO1xyXG5cclxuICByZXR1cm4gdHhiO1xyXG59XHJcblxyXG5mdW5jdGlvbiBjb25zdHJ1Y3Q8VE51bWJlciBleHRlbmRzIG51bWJlciB8IGJpZ2ludD4oXHJcbiAgZjogYW55LFxyXG4gIHBhcmFtczoge1xyXG4gICAgYW1vdW50VHlwZTogJ251bWJlcicgfCAnYmlnaW50JztcclxuICAgIGRvbnRTaWduPzogYm9vbGVhbjtcclxuICAgIHVzZU9sZFNpZ25BcmdzPzogYm9vbGVhbjtcclxuICB9XHJcbik6IFRyYW5zYWN0aW9uQnVpbGRlcjxUTnVtYmVyPiB7XHJcbiAgY29uc3QgbmV0d29yayA9IChORVRXT1JLUyBhcyBhbnkpW2YubmV0d29ya107XHJcbiAgY29uc3QgdHhiID0gbmV3IFRyYW5zYWN0aW9uQnVpbGRlcjxUTnVtYmVyPihuZXR3b3JrKTtcclxuXHJcbiAgaWYgKE51bWJlci5pc0Zpbml0ZShmLnZlcnNpb24pKSB0eGIuc2V0VmVyc2lvbihmLnZlcnNpb24pO1xyXG4gIGlmIChmLmxvY2t0aW1lICE9PSB1bmRlZmluZWQpIHR4Yi5zZXRMb2NrVGltZShmLmxvY2t0aW1lKTtcclxuXHJcbiAgZi5pbnB1dHMuZm9yRWFjaCgoaW5wdXQ6IGFueSkgPT4ge1xyXG4gICAgbGV0IHByZXZUeDtcclxuICAgIGlmIChpbnB1dC50eFJhdykge1xyXG4gICAgICBjb25zdCBjb25zdHJ1Y3RlZCA9IGNvbnN0cnVjdChpbnB1dC50eFJhdywge1xyXG4gICAgICAgIGFtb3VudFR5cGU6IHBhcmFtcy5hbW91bnRUeXBlLFxyXG4gICAgICB9KTtcclxuICAgICAgaWYgKGlucHV0LnR4UmF3LmluY29tcGxldGUpIHByZXZUeCA9IGNvbnN0cnVjdGVkLmJ1aWxkSW5jb21wbGV0ZSgpO1xyXG4gICAgICBlbHNlIHByZXZUeCA9IGNvbnN0cnVjdGVkLmJ1aWxkKCk7XHJcbiAgICB9IGVsc2UgaWYgKGlucHV0LnR4SGV4KSB7XHJcbiAgICAgIHByZXZUeCA9IFRyYW5zYWN0aW9uLmZyb21IZXg8VE51bWJlcj4oaW5wdXQudHhIZXgsIHBhcmFtcy5hbW91bnRUeXBlKTtcclxuICAgIH0gZWxzZSB7XHJcbiAgICAgIHByZXZUeCA9IGlucHV0LnR4SWQ7XHJcbiAgICB9XHJcblxyXG4gICAgbGV0IHByZXZUeFNjcmlwdDtcclxuICAgIGlmIChpbnB1dC5wcmV2VHhTY3JpcHQpIHtcclxuICAgICAgcHJldlR4U2NyaXB0ID0gYnNjcmlwdC5mcm9tQVNNKGlucHV0LnByZXZUeFNjcmlwdCk7XHJcbiAgICB9XHJcblxyXG4gICAgdHhiLmFkZElucHV0KHByZXZUeCwgaW5wdXQudm91dCwgaW5wdXQuc2VxdWVuY2UsIHByZXZUeFNjcmlwdCwgdG9BbW91bnQoaW5wdXQudmFsdWUsIHBhcmFtcy5hbW91bnRUeXBlKSBhcyBUTnVtYmVyKTtcclxuICB9KTtcclxuXHJcbiAgZi5vdXRwdXRzLmZvckVhY2goKG91dHB1dDogYW55KSA9PiB7XHJcbiAgICBpZiAob3V0cHV0LmFkZHJlc3MpIHtcclxuICAgICAgdHhiLmFkZE91dHB1dChvdXRwdXQuYWRkcmVzcywgdG9BbW91bnQob3V0cHV0LnZhbHVlLCBwYXJhbXMuYW1vdW50VHlwZSkgYXMgVE51bWJlcik7XHJcbiAgICB9IGVsc2Uge1xyXG4gICAgICB0eGIuYWRkT3V0cHV0KGJzY3JpcHQuZnJvbUFTTShvdXRwdXQuc2NyaXB0KSwgdG9BbW91bnQob3V0cHV0LnZhbHVlLCBwYXJhbXMuYW1vdW50VHlwZSkgYXMgVE51bWJlcik7XHJcbiAgICB9XHJcbiAgfSk7XHJcblxyXG4gIGlmIChwYXJhbXMuZG9udFNpZ24pIHJldHVybiB0eGI7XHJcbiAgcmV0dXJuIGNvbnN0cnVjdFNpZ24oZiwgdHhiLCBwYXJhbXMpO1xyXG59XHJcblxyXG5mdW5jdGlvbiBydW5UZXN0PFROdW1iZXIgZXh0ZW5kcyBudW1iZXIgfCBiaWdpbnQ+KFxyXG4gIGZpeHR1cmVzOiBhbnksXHJcbiAgdGVzdE5hbWU6IHN0cmluZyxcclxuICBwYXJhbXM6IHtcclxuICAgIHVzZU9sZFNpZ25BcmdzOiBib29sZWFuO1xyXG4gICAgYW1vdW50VHlwZTogJ251bWJlcicgfCAnYmlnaW50JztcclxuICB9XHJcbik6IHZvaWQge1xyXG4gIC8vIFNlYXJjaCBmb3IgXCJ1c2VPbGRTaWduQXJnc1wiXHJcbiAgLy8gdG8gZmluZCB0aGUgc2Vjb25kIHBhcnQgb2YgdGhpcyBjb25zb2xlLndhcm4gcmVwbGFjZVxyXG4gIGxldCBjb25zb2xlV2FybjogYW55O1xyXG4gIGlmIChwYXJhbXMudXNlT2xkU2lnbkFyZ3MpIHtcclxuICAgIGNvbnNvbGVXYXJuID0gY29uc29sZS53YXJuO1xyXG4gICAgLy8gU2lsZW5jZSBjb25zb2xlLndhcm4gZHVyaW5nIHRoZXNlIHRlc3RzXHJcbiAgICBjb25zb2xlLndhcm4gPSAoKTogdW5kZWZpbmVkID0+IHVuZGVmaW5lZDtcclxuICB9XHJcbiAgZGVzY3JpYmUodGVzdE5hbWUsICgpID0+IHtcclxuICAgIC8vIGNvbnN0YW50c1xyXG4gICAgY29uc3Qga2V5UGFpciA9IEVDUGFpci5mcm9tUHJpdmF0ZUtleShcclxuICAgICAgQnVmZmVyLmZyb20oJzAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDEnLCAnaGV4JylcclxuICAgICk7XHJcbiAgICBjb25zdCBzY3JpcHRzID0gWycxQmdHWjl0Y040cm05S0J6RG43S3ByUXo4N1NaMjZTQU1IJywgJzFjTWgyMjhIVENpd1M4WnNhYWtIOEE4d3plMUpSNVpzUCddLm1hcCgoeCkgPT4ge1xyXG4gICAgICByZXR1cm4gYmFkZHJlc3MudG9PdXRwdXRTY3JpcHQoeCwgTkVUV09SS1MuYml0Y29pbik7XHJcbiAgICB9KTtcclxuICAgIGNvbnN0IHR4SGFzaCA9IEJ1ZmZlci5mcm9tKCcwZTdjZWE4MTFjMGJlOWY3M2MwYWNhNTkxMDM0Mzk2ZTcyNjQ0NzNmYzI1YzFjYTQ1MTk1ZDc0MTdiMzZjYmUyJywgJ2hleCcpO1xyXG5cclxuICAgIGRlc2NyaWJlKCdmcm9tVHJhbnNhY3Rpb24nLCAoKSA9PiB7XHJcbiAgICAgIGZpeHR1cmVzLnZhbGlkLmJ1aWxkLmZvckVhY2goKGY6IGFueSkgPT4ge1xyXG4gICAgICAgIGl0KCdyZXR1cm5zIFRyYW5zYWN0aW9uQnVpbGRlciwgd2l0aCAnICsgZi5kZXNjcmlwdGlvbiwgKCkgPT4ge1xyXG4gICAgICAgICAgY29uc3QgbmV0d29yayA9IChORVRXT1JLUyBhcyBhbnkpW2YubmV0d29yayB8fCAnYml0Y29pbiddO1xyXG5cclxuICAgICAgICAgIGNvbnN0IHR4ID0gVHJhbnNhY3Rpb24uZnJvbUhleDxUTnVtYmVyPihmLnR4SGV4LCBwYXJhbXMuYW1vdW50VHlwZSk7XHJcbiAgICAgICAgICBjb25zdCB0eGIgPSBUcmFuc2FjdGlvbkJ1aWxkZXIuZnJvbVRyYW5zYWN0aW9uPFROdW1iZXI+KHR4LCBuZXR3b3JrKTtcclxuICAgICAgICAgIGNvbnN0IHR4QWZ0ZXIgPSBmLmluY29tcGxldGUgPyB0eGIuYnVpbGRJbmNvbXBsZXRlKCkgOiB0eGIuYnVpbGQoKTtcclxuXHJcbiAgICAgICAgICBhc3NlcnQuc3RyaWN0RXF1YWwodHhBZnRlci50b0hleCgpLCBmLnR4SGV4KTtcclxuICAgICAgICAgIGFzc2VydC5zdHJpY3RFcXVhbCh0eGIubmV0d29yaywgbmV0d29yayk7XHJcbiAgICAgICAgfSk7XHJcbiAgICAgIH0pO1xyXG5cclxuICAgICAgZml4dHVyZXMudmFsaWQuZnJvbVRyYW5zYWN0aW9uLmZvckVhY2goKGY6IGFueSkgPT4ge1xyXG4gICAgICAgIGl0KCdyZXR1cm5zIFRyYW5zYWN0aW9uQnVpbGRlciwgd2l0aCAnICsgZi5kZXNjcmlwdGlvbiwgKCkgPT4ge1xyXG4gICAgICAgICAgY29uc3QgdHggPSBuZXcgVHJhbnNhY3Rpb248VE51bWJlcj4oKTtcclxuXHJcbiAgICAgICAgICBmLmlucHV0cy5mb3JFYWNoKChpbnB1dDogYW55KSA9PiB7XHJcbiAgICAgICAgICAgIGNvbnN0IHR4SGFzaDIgPSBCdWZmZXIuZnJvbShpbnB1dC50eElkLCAnaGV4JykucmV2ZXJzZSgpIGFzIEJ1ZmZlcjtcclxuXHJcbiAgICAgICAgICAgIHR4LmFkZElucHV0KHR4SGFzaDIsIGlucHV0LnZvdXQsIHVuZGVmaW5lZCwgYnNjcmlwdC5mcm9tQVNNKGlucHV0LnNjcmlwdFNpZykpO1xyXG4gICAgICAgICAgfSk7XHJcblxyXG4gICAgICAgICAgZi5vdXRwdXRzLmZvckVhY2goKG91dHB1dDogYW55KSA9PiB7XHJcbiAgICAgICAgICAgIHR4LmFkZE91dHB1dChic2NyaXB0LmZyb21BU00ob3V0cHV0LnNjcmlwdCksIHRvQW1vdW50KG91dHB1dC52YWx1ZSwgcGFyYW1zLmFtb3VudFR5cGUpIGFzIFROdW1iZXIpO1xyXG4gICAgICAgICAgfSk7XHJcblxyXG4gICAgICAgICAgY29uc3QgdHhiID0gVHJhbnNhY3Rpb25CdWlsZGVyLmZyb21UcmFuc2FjdGlvbjxUTnVtYmVyPih0eCk7XHJcbiAgICAgICAgICBjb25zdCB0eEFmdGVyID0gZi5pbmNvbXBsZXRlID8gdHhiLmJ1aWxkSW5jb21wbGV0ZSgpIDogdHhiLmJ1aWxkKCk7XHJcblxyXG4gICAgICAgICAgdHhBZnRlci5pbnMuZm9yRWFjaCgoaW5wdXQsIGkpID0+IHtcclxuICAgICAgICAgICAgYXNzZXJ0LnN0cmljdEVxdWFsKGJzY3JpcHQudG9BU00oaW5wdXQuc2NyaXB0KSwgZi5pbnB1dHNbaV0uc2NyaXB0U2lnQWZ0ZXIpO1xyXG4gICAgICAgICAgfSk7XHJcblxyXG4gICAgICAgICAgdHhBZnRlci5vdXRzLmZvckVhY2goKG91dHB1dCwgaSkgPT4ge1xyXG4gICAgICAgICAgICBhc3NlcnQuc3RyaWN0RXF1YWwoYnNjcmlwdC50b0FTTShvdXRwdXQuc2NyaXB0KSwgZi5vdXRwdXRzW2ldLnNjcmlwdCk7XHJcbiAgICAgICAgICB9KTtcclxuICAgICAgICB9KTtcclxuICAgICAgfSk7XHJcblxyXG4gICAgICBmaXh0dXJlcy52YWxpZC5mcm9tVHJhbnNhY3Rpb25TZXF1ZW50aWFsLmZvckVhY2goKGY6IGFueSkgPT4ge1xyXG4gICAgICAgIGl0KCd3aXRoICcgKyBmLmRlc2NyaXB0aW9uLCAoKSA9PiB7XHJcbiAgICAgICAgICBjb25zdCBuZXR3b3JrID0gKE5FVFdPUktTIGFzIGFueSlbZi5uZXR3b3JrXTtcclxuICAgICAgICAgIGNvbnN0IHR4ID0gVHJhbnNhY3Rpb24uZnJvbUhleDxUTnVtYmVyPihmLnR4SGV4LCBwYXJhbXMuYW1vdW50VHlwZSk7XHJcbiAgICAgICAgICBjb25zdCB0eGIgPSBUcmFuc2FjdGlvbkJ1aWxkZXIuZnJvbVRyYW5zYWN0aW9uPFROdW1iZXI+KHR4LCBuZXR3b3JrKTtcclxuXHJcbiAgICAgICAgICB0eC5pbnMuZm9yRWFjaCgoaW5wdXQsIGkpID0+IHtcclxuICAgICAgICAgICAgYXNzZXJ0LnN0cmljdEVxdWFsKGJzY3JpcHQudG9BU00oaW5wdXQuc2NyaXB0KSwgZi5pbnB1dHNbaV0uc2NyaXB0U2lnKTtcclxuICAgICAgICAgIH0pO1xyXG5cclxuICAgICAgICAgIGNvbnN0cnVjdFNpZ24oZiwgdHhiLCBwYXJhbXMpO1xyXG4gICAgICAgICAgY29uc3QgdHhBZnRlciA9IGYuaW5jb21wbGV0ZSA/IHR4Yi5idWlsZEluY29tcGxldGUoKSA6IHR4Yi5idWlsZCgpO1xyXG5cclxuICAgICAgICAgIHR4QWZ0ZXIuaW5zLmZvckVhY2goKGlucHV0LCBpKSA9PiB7XHJcbiAgICAgICAgICAgIGFzc2VydC5zdHJpY3RFcXVhbChic2NyaXB0LnRvQVNNKGlucHV0LnNjcmlwdCksIGYuaW5wdXRzW2ldLnNjcmlwdFNpZ0FmdGVyKTtcclxuICAgICAgICAgIH0pO1xyXG5cclxuICAgICAgICAgIGFzc2VydC5zdHJpY3RFcXVhbCh0eEFmdGVyLnRvSGV4KCksIGYudHhIZXhBZnRlcik7XHJcbiAgICAgICAgfSk7XHJcbiAgICAgIH0pO1xyXG5cclxuICAgICAgaXQoJ2NsYXNzaWZpZXMgdHJhbnNhY3Rpb24gaW5wdXRzJywgKCkgPT4ge1xyXG4gICAgICAgIGNvbnN0IHR4ID0gVHJhbnNhY3Rpb24uZnJvbUhleDxUTnVtYmVyPihmaXh0dXJlcy52YWxpZC5jbGFzc2lmaWNhdGlvbi5oZXgsIHBhcmFtcy5hbW91bnRUeXBlKTtcclxuICAgICAgICBjb25zdCB0eGIgPSBUcmFuc2FjdGlvbkJ1aWxkZXIuZnJvbVRyYW5zYWN0aW9uPFROdW1iZXI+KHR4KTtcclxuXHJcbiAgICAgICAgKHR4YiBhcyBhbnkpLl9fSU5QVVRTLmZvckVhY2goKGk6IGFueSkgPT4ge1xyXG4gICAgICAgICAgYXNzZXJ0LnN0cmljdEVxdWFsKGkucHJldk91dFR5cGUsICdzY3JpcHRoYXNoJyk7XHJcbiAgICAgICAgICBhc3NlcnQuc3RyaWN0RXF1YWwoaS5yZWRlZW1TY3JpcHRUeXBlLCAnbXVsdGlzaWcnKTtcclxuICAgICAgICB9KTtcclxuICAgICAgfSk7XHJcblxyXG4gICAgICBmaXh0dXJlcy5pbnZhbGlkLmZyb21UcmFuc2FjdGlvbi5mb3JFYWNoKChmOiBhbnkpID0+IHtcclxuICAgICAgICBpdCgndGhyb3dzICcgKyBmLmV4Y2VwdGlvbiwgKCkgPT4ge1xyXG4gICAgICAgICAgY29uc3QgdHggPSBUcmFuc2FjdGlvbi5mcm9tSGV4PFROdW1iZXI+KGYudHhIZXgsIHBhcmFtcy5hbW91bnRUeXBlKTtcclxuXHJcbiAgICAgICAgICBhc3NlcnQudGhyb3dzKCgpID0+IHtcclxuICAgICAgICAgICAgVHJhbnNhY3Rpb25CdWlsZGVyLmZyb21UcmFuc2FjdGlvbjxUTnVtYmVyPih0eCk7XHJcbiAgICAgICAgICB9LCBuZXcgUmVnRXhwKGYuZXhjZXB0aW9uKSk7XHJcbiAgICAgICAgfSk7XHJcbiAgICAgIH0pO1xyXG4gICAgfSk7XHJcblxyXG4gICAgZGVzY3JpYmUoJ2FkZElucHV0JywgKCkgPT4ge1xyXG4gICAgICBsZXQgdHhiOiBUcmFuc2FjdGlvbkJ1aWxkZXI8VE51bWJlcj47XHJcbiAgICAgIGJlZm9yZUVhY2goKCkgPT4ge1xyXG4gICAgICAgIHR4YiA9IG5ldyBUcmFuc2FjdGlvbkJ1aWxkZXI8VE51bWJlcj4oKTtcclxuICAgICAgfSk7XHJcblxyXG4gICAgICBpdCgnYWNjZXB0cyBhIHR4SGFzaCwgaW5kZXggW2FuZCBzZXF1ZW5jZSBudW1iZXJdJywgKCkgPT4ge1xyXG4gICAgICAgIGNvbnN0IHZpbiA9IHR4Yi5hZGRJbnB1dCh0eEhhc2gsIDEsIDU0KTtcclxuICAgICAgICBhc3NlcnQuc3RyaWN0RXF1YWwodmluLCAwKTtcclxuXHJcbiAgICAgICAgY29uc3QgdHhJbiA9ICh0eGIgYXMgYW55KS5fX1RYLmluc1swXTtcclxuICAgICAgICBhc3NlcnQuc3RyaWN0RXF1YWwodHhJbi5oYXNoLCB0eEhhc2gpO1xyXG4gICAgICAgIGFzc2VydC5zdHJpY3RFcXVhbCh0eEluLmluZGV4LCAxKTtcclxuICAgICAgICBhc3NlcnQuc3RyaWN0RXF1YWwodHhJbi5zZXF1ZW5jZSwgNTQpO1xyXG4gICAgICAgIGFzc2VydC5zdHJpY3RFcXVhbCgodHhiIGFzIGFueSkuX19JTlBVVFNbMF0ucHJldk91dFNjcmlwdCwgdW5kZWZpbmVkKTtcclxuICAgICAgfSk7XHJcblxyXG4gICAgICBpdCgnYWNjZXB0cyBhIHR4SGFzaCwgaW5kZXggWywgc2VxdWVuY2UgbnVtYmVyIGFuZCBzY3JpcHRQdWJLZXldJywgKCkgPT4ge1xyXG4gICAgICAgIGNvbnN0IHZpbiA9IHR4Yi5hZGRJbnB1dCh0eEhhc2gsIDEsIDU0LCBzY3JpcHRzWzFdKTtcclxuICAgICAgICBhc3NlcnQuc3RyaWN0RXF1YWwodmluLCAwKTtcclxuXHJcbiAgICAgICAgY29uc3QgdHhJbiA9ICh0eGIgYXMgYW55KS5fX1RYLmluc1swXTtcclxuICAgICAgICBhc3NlcnQuc3RyaWN0RXF1YWwodHhJbi5oYXNoLCB0eEhhc2gpO1xyXG4gICAgICAgIGFzc2VydC5zdHJpY3RFcXVhbCh0eEluLmluZGV4LCAxKTtcclxuICAgICAgICBhc3NlcnQuc3RyaWN0RXF1YWwodHhJbi5zZXF1ZW5jZSwgNTQpO1xyXG4gICAgICAgIGFzc2VydC5zdHJpY3RFcXVhbCgodHhiIGFzIGFueSkuX19JTlBVVFNbMF0ucHJldk91dFNjcmlwdCwgc2NyaXB0c1sxXSk7XHJcbiAgICAgIH0pO1xyXG5cclxuICAgICAgaXQoJ2FjY2VwdHMgYSBwcmV2VHgsIGluZGV4IFthbmQgc2VxdWVuY2UgbnVtYmVyXScsICgpID0+IHtcclxuICAgICAgICBjb25zdCBwcmV2VHggPSBuZXcgVHJhbnNhY3Rpb248VE51bWJlcj4oKTtcclxuICAgICAgICBwcmV2VHguYWRkT3V0cHV0KHNjcmlwdHNbMF0sIHRvQW1vdW50KDAsIHBhcmFtcy5hbW91bnRUeXBlKSBhcyBUTnVtYmVyKTtcclxuICAgICAgICBwcmV2VHguYWRkT3V0cHV0KHNjcmlwdHNbMV0sIHRvQW1vdW50KDEsIHBhcmFtcy5hbW91bnRUeXBlKSBhcyBUTnVtYmVyKTtcclxuXHJcbiAgICAgICAgY29uc3QgdmluID0gdHhiLmFkZElucHV0KHByZXZUeCwgMSwgNTQpO1xyXG4gICAgICAgIGFzc2VydC5zdHJpY3RFcXVhbCh2aW4sIDApO1xyXG5cclxuICAgICAgICBjb25zdCB0eEluID0gKHR4YiBhcyBhbnkpLl9fVFguaW5zWzBdO1xyXG4gICAgICAgIGFzc2VydC5kZWVwU3RyaWN0RXF1YWwodHhJbi5oYXNoLCBwcmV2VHguZ2V0SGFzaCgpKTtcclxuICAgICAgICBhc3NlcnQuc3RyaWN0RXF1YWwodHhJbi5pbmRleCwgMSk7XHJcbiAgICAgICAgYXNzZXJ0LnN0cmljdEVxdWFsKHR4SW4uc2VxdWVuY2UsIDU0KTtcclxuICAgICAgICBhc3NlcnQuc3RyaWN0RXF1YWwoKHR4YiBhcyBhbnkpLl9fSU5QVVRTWzBdLnByZXZPdXRTY3JpcHQsIHNjcmlwdHNbMV0pO1xyXG4gICAgICB9KTtcclxuXHJcbiAgICAgIGl0KCdyZXR1cm5zIHRoZSBpbnB1dCBpbmRleCcsICgpID0+IHtcclxuICAgICAgICBhc3NlcnQuc3RyaWN0RXF1YWwodHhiLmFkZElucHV0KHR4SGFzaCwgMCksIDApO1xyXG4gICAgICAgIGFzc2VydC5zdHJpY3RFcXVhbCh0eGIuYWRkSW5wdXQodHhIYXNoLCAxKSwgMSk7XHJcbiAgICAgIH0pO1xyXG5cclxuICAgICAgaXQoJ3Rocm93cyBpZiBTSUdIQVNIX0FMTCBoYXMgYmVlbiB1c2VkIHRvIHNpZ24gYW55IGV4aXN0aW5nIHNjcmlwdFNpZ3MnLCAoKSA9PiB7XHJcbiAgICAgICAgdHhiLmFkZElucHV0KHR4SGFzaCwgMCk7XHJcbiAgICAgICAgdHhiLmFkZE91dHB1dChzY3JpcHRzWzBdLCB0b0Ftb3VudCgxMDAwLCBwYXJhbXMuYW1vdW50VHlwZSkgYXMgVE51bWJlcik7XHJcbiAgICAgICAgdHhiLnNpZ24oe1xyXG4gICAgICAgICAgcHJldk91dFNjcmlwdFR5cGU6ICdwMnBraCcsXHJcbiAgICAgICAgICB2aW46IDAsXHJcbiAgICAgICAgICBrZXlQYWlyLFxyXG4gICAgICAgIH0pO1xyXG5cclxuICAgICAgICBhc3NlcnQudGhyb3dzKCgpID0+IHtcclxuICAgICAgICAgIHR4Yi5hZGRJbnB1dCh0eEhhc2gsIDApO1xyXG4gICAgICAgIH0sIC9ObywgdGhpcyB3b3VsZCBpbnZhbGlkYXRlIHNpZ25hdHVyZXMvKTtcclxuICAgICAgfSk7XHJcbiAgICB9KTtcclxuXHJcbiAgICBkZXNjcmliZSgnYWRkT3V0cHV0JywgKCkgPT4ge1xyXG4gICAgICBsZXQgdHhiOiBUcmFuc2FjdGlvbkJ1aWxkZXI8VE51bWJlcj47XHJcbiAgICAgIGJlZm9yZUVhY2goKCkgPT4ge1xyXG4gICAgICAgIHR4YiA9IG5ldyBUcmFuc2FjdGlvbkJ1aWxkZXI8VE51bWJlcj4oKTtcclxuICAgICAgfSk7XHJcblxyXG4gICAgICBpdCgnYWNjZXB0cyBhbiBhZGRyZXNzIHN0cmluZyBhbmQgdmFsdWUnLCAoKSA9PiB7XHJcbiAgICAgICAgY29uc3QgeyBhZGRyZXNzIH0gPSBwYXltZW50cy5wMnBraCh7IHB1YmtleToga2V5UGFpci5wdWJsaWNLZXkgfSk7XHJcbiAgICAgICAgY29uc3Qgdm91dCA9IHR4Yi5hZGRPdXRwdXQoYWRkcmVzcyEsIHRvQW1vdW50KDEwMDAsIHBhcmFtcy5hbW91bnRUeXBlKSBhcyBUTnVtYmVyKTtcclxuICAgICAgICBhc3NlcnQuc3RyaWN0RXF1YWwodm91dCwgMCk7XHJcblxyXG4gICAgICAgIGNvbnN0IHR4b3V0ID0gKHR4YiBhcyBhbnkpLl9fVFgub3V0c1swXTtcclxuICAgICAgICBhc3NlcnQuZGVlcFN0cmljdEVxdWFsKHR4b3V0LnNjcmlwdCwgc2NyaXB0c1swXSk7XHJcbiAgICAgICAgYXNzZXJ0LnN0cmljdEVxdWFsKHR4b3V0LnZhbHVlLCB0b0Ftb3VudCgxMDAwLCBwYXJhbXMuYW1vdW50VHlwZSkgYXMgVE51bWJlcik7XHJcbiAgICAgIH0pO1xyXG5cclxuICAgICAgaXQoJ2FjY2VwdHMgYSBTY3JpcHRQdWJLZXkgYW5kIHZhbHVlJywgKCkgPT4ge1xyXG4gICAgICAgIGNvbnN0IHZvdXQgPSB0eGIuYWRkT3V0cHV0KHNjcmlwdHNbMF0sIHRvQW1vdW50KDEwMDAsIHBhcmFtcy5hbW91bnRUeXBlKSBhcyBUTnVtYmVyKTtcclxuICAgICAgICBhc3NlcnQuc3RyaWN0RXF1YWwodm91dCwgMCk7XHJcblxyXG4gICAgICAgIGNvbnN0IHR4b3V0ID0gKHR4YiBhcyBhbnkpLl9fVFgub3V0c1swXTtcclxuICAgICAgICBhc3NlcnQuZGVlcFN0cmljdEVxdWFsKHR4b3V0LnNjcmlwdCwgc2NyaXB0c1swXSk7XHJcbiAgICAgICAgYXNzZXJ0LnN0cmljdEVxdWFsKHR4b3V0LnZhbHVlLCB0b0Ftb3VudCgxMDAwLCBwYXJhbXMuYW1vdW50VHlwZSkgYXMgVE51bWJlcik7XHJcbiAgICAgIH0pO1xyXG5cclxuICAgICAgaXQoJ3Rocm93cyBpZiBhZGRyZXNzIGlzIG9mIHRoZSB3cm9uZyBuZXR3b3JrJywgKCkgPT4ge1xyXG4gICAgICAgIGFzc2VydC50aHJvd3MoKCkgPT4ge1xyXG4gICAgICAgICAgdHhiLmFkZE91dHB1dCgnMk5HSGp2anc4M3BjVkZnTWNBN1F2U01oMmMyNDZyeExWejknLCB0b0Ftb3VudCgxMDAwLCBwYXJhbXMuYW1vdW50VHlwZSkgYXMgVE51bWJlcik7XHJcbiAgICAgICAgfSwgLzJOR0hqdmp3ODNwY1ZGZ01jQTdRdlNNaDJjMjQ2cnhMVno5IGhhcyBubyBtYXRjaGluZyBTY3JpcHQvKTtcclxuICAgICAgfSk7XHJcblxyXG4gICAgICBpdCgnYWRkIHNlY29uZCBvdXRwdXQgYWZ0ZXIgc2lnbmVkIGZpcnN0IGlucHV0IHdpdGggU0lHSEFTSF9OT05FJywgKCkgPT4ge1xyXG4gICAgICAgIHR4Yi5hZGRJbnB1dCh0eEhhc2gsIDApO1xyXG4gICAgICAgIHR4Yi5hZGRPdXRwdXQoc2NyaXB0c1swXSwgdG9BbW91bnQoMjAwMCwgcGFyYW1zLmFtb3VudFR5cGUpIGFzIFROdW1iZXIpO1xyXG4gICAgICAgIHR4Yi5zaWduKHtcclxuICAgICAgICAgIHByZXZPdXRTY3JpcHRUeXBlOiAncDJwa2gnLFxyXG4gICAgICAgICAgdmluOiAwLFxyXG4gICAgICAgICAga2V5UGFpcixcclxuICAgICAgICAgIGhhc2hUeXBlOiBUcmFuc2FjdGlvbi5TSUdIQVNIX05PTkUsXHJcbiAgICAgICAgfSk7XHJcbiAgICAgICAgYXNzZXJ0LnN0cmljdEVxdWFsKHR4Yi5hZGRPdXRwdXQoc2NyaXB0c1sxXSwgdG9BbW91bnQoOTAwMCwgcGFyYW1zLmFtb3VudFR5cGUpIGFzIFROdW1iZXIpLCAxKTtcclxuICAgICAgfSk7XHJcblxyXG4gICAgICBpdCgnYWRkIGZpcnN0IG91dHB1dCBhZnRlciBzaWduZWQgZmlyc3QgaW5wdXQgd2l0aCBTSUdIQVNIX05PTkUnLCAoKSA9PiB7XHJcbiAgICAgICAgdHhiLmFkZElucHV0KHR4SGFzaCwgMCk7XHJcbiAgICAgICAgdHhiLnNpZ24oe1xyXG4gICAgICAgICAgcHJldk91dFNjcmlwdFR5cGU6ICdwMnBraCcsXHJcbiAgICAgICAgICB2aW46IDAsXHJcbiAgICAgICAgICBrZXlQYWlyLFxyXG4gICAgICAgICAgaGFzaFR5cGU6IFRyYW5zYWN0aW9uLlNJR0hBU0hfTk9ORSxcclxuICAgICAgICB9KTtcclxuICAgICAgICBhc3NlcnQuc3RyaWN0RXF1YWwodHhiLmFkZE91dHB1dChzY3JpcHRzWzBdLCB0b0Ftb3VudCgyMDAwLCBwYXJhbXMuYW1vdW50VHlwZSkgYXMgVE51bWJlciksIDApO1xyXG4gICAgICB9KTtcclxuXHJcbiAgICAgIGl0KCdhZGQgc2Vjb25kIG91dHB1dCBhZnRlciBzaWduZWQgZmlyc3QgaW5wdXQgd2l0aCBTSUdIQVNIX1NJTkdMRScsICgpID0+IHtcclxuICAgICAgICB0eGIuYWRkSW5wdXQodHhIYXNoLCAwKTtcclxuICAgICAgICB0eGIuYWRkT3V0cHV0KHNjcmlwdHNbMF0sIHRvQW1vdW50KDIwMDAsIHBhcmFtcy5hbW91bnRUeXBlKSBhcyBUTnVtYmVyKTtcclxuICAgICAgICB0eGIuc2lnbih7XHJcbiAgICAgICAgICBwcmV2T3V0U2NyaXB0VHlwZTogJ3AycGtoJyxcclxuICAgICAgICAgIHZpbjogMCxcclxuICAgICAgICAgIGtleVBhaXIsXHJcbiAgICAgICAgICBoYXNoVHlwZTogVHJhbnNhY3Rpb24uU0lHSEFTSF9TSU5HTEUsXHJcbiAgICAgICAgfSk7XHJcbiAgICAgICAgYXNzZXJ0LnN0cmljdEVxdWFsKHR4Yi5hZGRPdXRwdXQoc2NyaXB0c1sxXSwgdG9BbW91bnQoOTAwMCwgcGFyYW1zLmFtb3VudFR5cGUpIGFzIFROdW1iZXIpLCAxKTtcclxuICAgICAgfSk7XHJcblxyXG4gICAgICBpdCgnYWRkIGZpcnN0IG91dHB1dCBhZnRlciBzaWduZWQgZmlyc3QgaW5wdXQgd2l0aCBTSUdIQVNIX1NJTkdMRScsICgpID0+IHtcclxuICAgICAgICB0eGIuYWRkSW5wdXQodHhIYXNoLCAwKTtcclxuICAgICAgICB0eGIuc2lnbih7XHJcbiAgICAgICAgICBwcmV2T3V0U2NyaXB0VHlwZTogJ3AycGtoJyxcclxuICAgICAgICAgIHZpbjogMCxcclxuICAgICAgICAgIGtleVBhaXIsXHJcbiAgICAgICAgICBoYXNoVHlwZTogVHJhbnNhY3Rpb24uU0lHSEFTSF9TSU5HTEUsXHJcbiAgICAgICAgfSk7XHJcbiAgICAgICAgYXNzZXJ0LnRocm93cygoKSA9PiB7XHJcbiAgICAgICAgICB0eGIuYWRkT3V0cHV0KHNjcmlwdHNbMF0sIHRvQW1vdW50KDIwMDAsIHBhcmFtcy5hbW91bnRUeXBlKSBhcyBUTnVtYmVyKTtcclxuICAgICAgICB9LCAvTm8sIHRoaXMgd291bGQgaW52YWxpZGF0ZSBzaWduYXR1cmVzLyk7XHJcbiAgICAgIH0pO1xyXG5cclxuICAgICAgaXQoJ3Rocm93cyBpZiBTSUdIQVNIX0FMTCBoYXMgYmVlbiB1c2VkIHRvIHNpZ24gYW55IGV4aXN0aW5nIHNjcmlwdFNpZ3MnLCAoKSA9PiB7XHJcbiAgICAgICAgdHhiLmFkZElucHV0KHR4SGFzaCwgMCk7XHJcbiAgICAgICAgdHhiLmFkZE91dHB1dChzY3JpcHRzWzBdLCB0b0Ftb3VudCgyMDAwLCBwYXJhbXMuYW1vdW50VHlwZSkgYXMgVE51bWJlcik7XHJcbiAgICAgICAgdHhiLnNpZ24oe1xyXG4gICAgICAgICAgcHJldk91dFNjcmlwdFR5cGU6ICdwMnBraCcsXHJcbiAgICAgICAgICB2aW46IDAsXHJcbiAgICAgICAgICBrZXlQYWlyLFxyXG4gICAgICAgIH0pO1xyXG5cclxuICAgICAgICBhc3NlcnQudGhyb3dzKCgpID0+IHtcclxuICAgICAgICAgIHR4Yi5hZGRPdXRwdXQoc2NyaXB0c1sxXSwgdG9BbW91bnQoOTAwMCwgcGFyYW1zLmFtb3VudFR5cGUpIGFzIFROdW1iZXIpO1xyXG4gICAgICAgIH0sIC9ObywgdGhpcyB3b3VsZCBpbnZhbGlkYXRlIHNpZ25hdHVyZXMvKTtcclxuICAgICAgfSk7XHJcbiAgICB9KTtcclxuXHJcbiAgICBkZXNjcmliZSgnc2V0TG9ja1RpbWUnLCAoKSA9PiB7XHJcbiAgICAgIGl0KCd0aHJvd3MgaWYgaWYgdGhlcmUgZXhpc3QgYW55IHNjcmlwdFNpZ3MnLCAoKSA9PiB7XHJcbiAgICAgICAgY29uc3QgdHhiID0gbmV3IFRyYW5zYWN0aW9uQnVpbGRlcjxUTnVtYmVyPigpO1xyXG4gICAgICAgIHR4Yi5hZGRJbnB1dCh0eEhhc2gsIDApO1xyXG4gICAgICAgIHR4Yi5hZGRPdXRwdXQoc2NyaXB0c1swXSwgdG9BbW91bnQoMTAwLCBwYXJhbXMuYW1vdW50VHlwZSkgYXMgVE51bWJlcik7XHJcbiAgICAgICAgdHhiLnNpZ24oe1xyXG4gICAgICAgICAgcHJldk91dFNjcmlwdFR5cGU6ICdwMnBraCcsXHJcbiAgICAgICAgICB2aW46IDAsXHJcbiAgICAgICAgICBrZXlQYWlyLFxyXG4gICAgICAgIH0pO1xyXG5cclxuICAgICAgICBhc3NlcnQudGhyb3dzKCgpID0+IHtcclxuICAgICAgICAgIHR4Yi5zZXRMb2NrVGltZSg2NTUzNSk7XHJcbiAgICAgICAgfSwgL05vLCB0aGlzIHdvdWxkIGludmFsaWRhdGUgc2lnbmF0dXJlcy8pO1xyXG4gICAgICB9KTtcclxuICAgIH0pO1xyXG5cclxuICAgIGRlc2NyaWJlKCdzaWduJywgKCkgPT4ge1xyXG4gICAgICBpdCgnc3VwcG9ydHMgdGhlIGFsdGVybmF0aXZlIGFic3RyYWN0IGludGVyZmFjZSB7IHB1YmxpY0tleSwgc2lnbiB9JywgKCkgPT4ge1xyXG4gICAgICAgIGNvbnN0IGlubmVyS2V5UGFpciA9IHtcclxuICAgICAgICAgIHB1YmxpY0tleTogRUNQYWlyLm1ha2VSYW5kb20oe1xyXG4gICAgICAgICAgICBybmc6ICgpOiBCdWZmZXIgPT4ge1xyXG4gICAgICAgICAgICAgIHJldHVybiBCdWZmZXIuYWxsb2MoMzIsIDEpO1xyXG4gICAgICAgICAgICB9LFxyXG4gICAgICAgICAgfSkucHVibGljS2V5LFxyXG4gICAgICAgICAgc2lnbjogKCk6IEJ1ZmZlciA9PiB7XHJcbiAgICAgICAgICAgIHJldHVybiBCdWZmZXIuYWxsb2MoNjQsIDB4NWYpO1xyXG4gICAgICAgICAgfSxcclxuICAgICAgICAgIHNpZ25TY2hub3JyOiAoKTogQnVmZmVyID0+IHtcclxuICAgICAgICAgICAgcmV0dXJuIEJ1ZmZlci5hbGxvYyg2NCwgMHg0Zik7XHJcbiAgICAgICAgICB9LFxyXG4gICAgICAgIH07XHJcblxyXG4gICAgICAgIGNvbnN0IHR4YiA9IG5ldyBUcmFuc2FjdGlvbkJ1aWxkZXI8VE51bWJlcj4oKTtcclxuICAgICAgICB0eGIuc2V0VmVyc2lvbigxKTtcclxuICAgICAgICB0eGIuYWRkSW5wdXQoJ2ZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmYnLCAxKTtcclxuICAgICAgICB0eGIuYWRkT3V0cHV0KCcxMTExMTExMTExMTExMTExMTExMTE0b0x2VDInLCB0b0Ftb3VudCgxMDAwMDAsIHBhcmFtcy5hbW91bnRUeXBlKSBhcyBUTnVtYmVyKTtcclxuICAgICAgICB0eGIuc2lnbih7XHJcbiAgICAgICAgICBwcmV2T3V0U2NyaXB0VHlwZTogJ3AycGtoJyxcclxuICAgICAgICAgIHZpbjogMCxcclxuICAgICAgICAgIGtleVBhaXI6IGlubmVyS2V5UGFpcixcclxuICAgICAgICB9KTtcclxuICAgICAgICBhc3NlcnQuc3RyaWN0RXF1YWwoXHJcbiAgICAgICAgICB0eGIuYnVpbGQoKS50b0hleCgpLFxyXG4gICAgICAgICAgJzAxMDAwMDAwMDFmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZicgK1xyXG4gICAgICAgICAgICAnZmZmZmZmZmYwMTAwMDAwMDZhNDczMDQ0MDIyMDVmNWY1ZjVmNWY1ZjVmNWY1ZjVmNWY1ZjVmNWY1ZjVmNWY1ZjVmJyArXHJcbiAgICAgICAgICAgICc1ZjVmNWY1ZjVmNWY1ZjVmNWY1ZjVmNWY1ZjAyMjA1ZjVmNWY1ZjVmNWY1ZjVmNWY1ZjVmNWY1ZjVmNWY1ZjVmNWYnICtcclxuICAgICAgICAgICAgJzVmNWY1ZjVmNWY1ZjVmNWY1ZjVmNWY1ZjVmNWYwMTIxMDMxYjg0YzU1NjdiMTI2NDQwOTk1ZDNlZDVhYWJhMDU2NScgK1xyXG4gICAgICAgICAgICAnZDcxZTE4MzQ2MDQ4MTlmZjljMTdmNWU5ZDVkZDA3OGZmZmZmZmZmZjAxYTA4NjAxMDAwMDAwMDAwMDE5NzZhOTE0JyArXHJcbiAgICAgICAgICAgICcwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwODhhYzAwMDAwMDAwJ1xyXG4gICAgICAgICk7XHJcbiAgICAgIH0pO1xyXG5cclxuICAgICAgaXQoJ3N1cHBvcnRzIGxvdyBSIHNpZ25hdHVyZSBzaWduaW5nJywgKCkgPT4ge1xyXG4gICAgICAgIGxldCB0eGIgPSBuZXcgVHJhbnNhY3Rpb25CdWlsZGVyPFROdW1iZXI+KCk7XHJcbiAgICAgICAgdHhiLnNldFZlcnNpb24oMSk7XHJcbiAgICAgICAgdHhiLmFkZElucHV0KCdmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmJywgMSk7XHJcbiAgICAgICAgdHhiLmFkZE91dHB1dCgnMTExMTExMTExMTExMTExMTExMTExNG9MdlQyJywgdG9BbW91bnQoMTAwMDAwLCBwYXJhbXMuYW1vdW50VHlwZSkgYXMgVE51bWJlcik7XHJcbiAgICAgICAgdHhiLnNpZ24oe1xyXG4gICAgICAgICAgcHJldk91dFNjcmlwdFR5cGU6ICdwMnBraCcsXHJcbiAgICAgICAgICB2aW46IDAsXHJcbiAgICAgICAgICBrZXlQYWlyLFxyXG4gICAgICAgIH0pO1xyXG4gICAgICAgIC8vIGhpZ2ggUlxyXG4gICAgICAgIGFzc2VydC5zdHJpY3RFcXVhbChcclxuICAgICAgICAgIHR4Yi5idWlsZCgpLnRvSGV4KCksXHJcbiAgICAgICAgICAnMDEwMDAwMDAwMWZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmJyArXHJcbiAgICAgICAgICAgICdmZmZmZmZmZjAxMDAwMDAwNmI0ODMwNDUwMjIxMDBiODcyNjc3ZjM1YzljMTRhZDljNDFkODM2NDlmYjA0OTI1MGYnICtcclxuICAgICAgICAgICAgJzMyNTc0ZTBiMjU0N2Q2N2UyMDllZDE0ZmYwNWQwMjIwNTliMzZhZDA1OGJlNTRlODg3YTFhMzExZDVjMzkzY2I0OScgK1xyXG4gICAgICAgICAgICAnNDFmNmI5M2EwYjA5MDg0NWVjNjcwOTRkZTg5NzJiMDEyMTAyNzliZTY2N2VmOWRjYmJhYzU1YTA2Mjk1Y2U4NzBiJyArXHJcbiAgICAgICAgICAgICcwNzAyOWJmY2RiMmRjZTI4ZDk1OWYyODE1YjE2ZjgxNzk4ZmZmZmZmZmYwMWEwODYwMTAwMDAwMDAwMDAxOTc2YTknICtcclxuICAgICAgICAgICAgJzE0MDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDg4YWMwMDAwMDAwMCdcclxuICAgICAgICApO1xyXG5cclxuICAgICAgICB0eGIgPSBuZXcgVHJhbnNhY3Rpb25CdWlsZGVyPFROdW1iZXI+KCk7XHJcbiAgICAgICAgdHhiLnNldFZlcnNpb24oMSk7XHJcbiAgICAgICAgdHhiLmFkZElucHV0KCdmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmJywgMSk7XHJcbiAgICAgICAgdHhiLmFkZE91dHB1dCgnMTExMTExMTExMTExMTExMTExMTExNG9MdlQyJywgdG9BbW91bnQoMTAwMDAwLCBwYXJhbXMuYW1vdW50VHlwZSkgYXMgVE51bWJlcik7XHJcbiAgICAgICAgdHhiLnNldExvd1IoKTtcclxuICAgICAgICB0eGIuc2lnbih7XHJcbiAgICAgICAgICBwcmV2T3V0U2NyaXB0VHlwZTogJ3AycGtoJyxcclxuICAgICAgICAgIHZpbjogMCxcclxuICAgICAgICAgIGtleVBhaXIsXHJcbiAgICAgICAgfSk7XHJcbiAgICAgICAgLy8gbG93IFJcclxuICAgICAgICBhc3NlcnQuc3RyaWN0RXF1YWwoXHJcbiAgICAgICAgICB0eGIuYnVpbGQoKS50b0hleCgpLFxyXG4gICAgICAgICAgJzAxMDAwMDAwMDFmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZicgK1xyXG4gICAgICAgICAgICAnZmZmZmZmZmYwMTAwMDAwMDZhNDczMDQ0MDIyMDEyYTYwMWVmYTg3NTZlYmU4M2U5YWM3YTdkYjA2MWMzMTQ3ZTNiJyArXHJcbiAgICAgICAgICAgICc0OWQ4YmU2NzY4NTc5OWZlNTFhNGM4YzYyZjAyMjA0ZDU2OGQzMDFkNWNlMTRhZjM5MGQ1NjZkNGZkNTBlN2I4ZWUnICtcclxuICAgICAgICAgICAgJzQ4ZTcxZWM2Nzc4NmMwMjllNzIxMTk0ZGFlMzYwMTIxMDI3OWJlNjY3ZWY5ZGNiYmFjNTVhMDYyOTVjZTg3MGIwNycgK1xyXG4gICAgICAgICAgICAnMDI5YmZjZGIyZGNlMjhkOTU5ZjI4MTViMTZmODE3OThmZmZmZmZmZjAxYTA4NjAxMDAwMDAwMDAwMDE5NzZhOTE0JyArXHJcbiAgICAgICAgICAgICcwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwODhhYzAwMDAwMDAwJ1xyXG4gICAgICAgICk7XHJcbiAgICAgIH0pO1xyXG5cclxuICAgICAgaXQoJ2ZhaWxzIHdoZW4gbWlzc2luZyByZXF1aXJlZCBhcmd1bWVudHMnLCAoKSA9PiB7XHJcbiAgICAgICAgY29uc3QgdHhiID0gbmV3IFRyYW5zYWN0aW9uQnVpbGRlcjxUTnVtYmVyPigpO1xyXG4gICAgICAgIHR4Yi5zZXRWZXJzaW9uKDEpO1xyXG4gICAgICAgIHR4Yi5hZGRJbnB1dCgnZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZicsIDEpO1xyXG4gICAgICAgIHR4Yi5hZGRPdXRwdXQoJzExMTExMTExMTExMTExMTExMTExMTRvTHZUMicsIHRvQW1vdW50KDEwMDAwMCwgcGFyYW1zLmFtb3VudFR5cGUpIGFzIFROdW1iZXIpO1xyXG4gICAgICAgIGFzc2VydC50aHJvd3MoKCkgPT4ge1xyXG4gICAgICAgICAgKHR4YiBhcyBhbnkpLnNpZ24oKTtcclxuICAgICAgICB9LCAvVHJhbnNhY3Rpb25CdWlsZGVyIHNpZ24gZmlyc3QgYXJnIG11c3QgYmUgVHhiU2lnbkFyZyBvciBudW1iZXIvKTtcclxuICAgICAgICBhc3NlcnQudGhyb3dzKCgpID0+IHtcclxuICAgICAgICAgIHR4Yi5zaWduKHtcclxuICAgICAgICAgICAgcHJldk91dFNjcmlwdFR5cGU6ICdwMnBraCcsXHJcbiAgICAgICAgICAgIHZpbjogMSxcclxuICAgICAgICAgICAga2V5UGFpcixcclxuICAgICAgICAgIH0pO1xyXG4gICAgICAgIH0sIC9ObyBpbnB1dCBhdCBpbmRleDogMS8pO1xyXG4gICAgICAgIGFzc2VydC50aHJvd3MoKCkgPT4ge1xyXG4gICAgICAgICAgKHR4YiBhcyBhbnkpLnNpZ24oe1xyXG4gICAgICAgICAgICBwcmV2T3V0U2NyaXB0VHlwZTogJ3AycGtoJyxcclxuICAgICAgICAgICAga2V5UGFpcixcclxuICAgICAgICAgIH0pO1xyXG4gICAgICAgIH0sIC9zaWduIG11c3QgaW5jbHVkZSB2aW4gcGFyYW1ldGVyIGFzIE51bWJlciBcXChpbnB1dCBpbmRleFxcKS8pO1xyXG4gICAgICAgIGFzc2VydC50aHJvd3MoKCkgPT4ge1xyXG4gICAgICAgICAgKHR4YiBhcyBhbnkpLnNpZ24oe1xyXG4gICAgICAgICAgICBwcmV2T3V0U2NyaXB0VHlwZTogJ3AycGtoJyxcclxuICAgICAgICAgICAgdmluOiAwLFxyXG4gICAgICAgICAgICBrZXlQYWlyOiB7fSxcclxuICAgICAgICAgIH0pO1xyXG4gICAgICAgIH0sIC9zaWduIG11c3QgaW5jbHVkZSBrZXlQYWlyIHBhcmFtZXRlciBhcyBTaWduZXIgaW50ZXJmYWNlLyk7XHJcbiAgICAgICAgYXNzZXJ0LnRocm93cygoKSA9PiB7XHJcbiAgICAgICAgICAodHhiIGFzIGFueSkuc2lnbih7XHJcbiAgICAgICAgICAgIHByZXZPdXRTY3JpcHRUeXBlOiAncDJwa2gnLFxyXG4gICAgICAgICAgICB2aW46IDAsXHJcbiAgICAgICAgICAgIGtleVBhaXIsXHJcbiAgICAgICAgICAgIGhhc2hUeXBlOiAnc3RyaW5nJyxcclxuICAgICAgICAgIH0pO1xyXG4gICAgICAgIH0sIC9zaWduIGhhc2hUeXBlIHBhcmFtZXRlciBtdXN0IGJlIGEgbnVtYmVyLyk7XHJcbiAgICAgICAgaWYgKHBhcmFtcy51c2VPbGRTaWduQXJncykge1xyXG4gICAgICAgICAgYXNzZXJ0LnRocm93cygoKSA9PiB7XHJcbiAgICAgICAgICAgIHR4Yi5zaWduKDApO1xyXG4gICAgICAgICAgfSwgL3NpZ24gcmVxdWlyZXMga2V5cGFpci8pO1xyXG4gICAgICAgIH1cclxuICAgICAgfSk7XHJcblxyXG4gICAgICBmaXh0dXJlcy5pbnZhbGlkLnNpZ24uZm9yRWFjaCgoZjogYW55KSA9PiB7XHJcbiAgICAgICAgaXQoJ3Rocm93cyAnICsgZi5leGNlcHRpb24gKyAoZi5kZXNjcmlwdGlvbiA/ICcgKCcgKyBmLmRlc2NyaXB0aW9uICsgJyknIDogJycpLCAoKSA9PiB7XHJcbiAgICAgICAgICBjb25zdCB0eGIgPSBjb25zdHJ1Y3QoZiwge1xyXG4gICAgICAgICAgICBkb250U2lnbjogdHJ1ZSxcclxuICAgICAgICAgICAgYW1vdW50VHlwZTogcGFyYW1zLmFtb3VudFR5cGUsXHJcbiAgICAgICAgICB9KTtcclxuXHJcbiAgICAgICAgICBsZXQgdGhyZXcgPSBmYWxzZTtcclxuICAgICAgICAgIChmLmlucHV0cyBhcyBhbnkpLmZvckVhY2goKGlucHV0OiBhbnksIGluZGV4OiBudW1iZXIpOiB2b2lkID0+IHtcclxuICAgICAgICAgICAgaW5wdXQuc2lnbnMuZm9yRWFjaCgoc2lnbjogYW55KSA9PiB7XHJcbiAgICAgICAgICAgICAgY29uc3Qga2V5UGFpck5ldHdvcmsgPSAoTkVUV09SS1MgYXMgYW55KVtzaWduLm5ldHdvcmsgfHwgZi5uZXR3b3JrXTtcclxuICAgICAgICAgICAgICBjb25zdCBrZXlQYWlyMiA9IEVDUGFpci5mcm9tV0lGKHNpZ24ua2V5UGFpciwga2V5UGFpck5ldHdvcmspO1xyXG4gICAgICAgICAgICAgIGxldCByZWRlZW1TY3JpcHQ6IEJ1ZmZlciB8IHVuZGVmaW5lZDtcclxuICAgICAgICAgICAgICBsZXQgd2l0bmVzc1NjcmlwdDogQnVmZmVyIHwgdW5kZWZpbmVkO1xyXG4gICAgICAgICAgICAgIGxldCB3aXRuZXNzVmFsdWU6IFROdW1iZXIgfCB1bmRlZmluZWQ7XHJcblxyXG4gICAgICAgICAgICAgIGlmIChzaWduLnJlZGVlbVNjcmlwdCkge1xyXG4gICAgICAgICAgICAgICAgcmVkZWVtU2NyaXB0ID0gYnNjcmlwdC5mcm9tQVNNKHNpZ24ucmVkZWVtU2NyaXB0KTtcclxuICAgICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICAgIGlmIChzaWduLndpdG5lc3NTY3JpcHQpIHtcclxuICAgICAgICAgICAgICAgIHdpdG5lc3NTY3JpcHQgPSBic2NyaXB0LmZyb21BU00oc2lnbi53aXRuZXNzU2NyaXB0KTtcclxuICAgICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICAgIGlmIChzaWduLnZhbHVlKSB7XHJcbiAgICAgICAgICAgICAgICB3aXRuZXNzVmFsdWUgPSB0b0Ftb3VudChzaWduLnZhbHVlLCBwYXJhbXMuYW1vdW50VHlwZSkgYXMgVE51bWJlcjtcclxuICAgICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICAgIGlmIChzaWduLnRocm93cykge1xyXG4gICAgICAgICAgICAgICAgYXNzZXJ0LnRocm93cygoKSA9PiB7XHJcbiAgICAgICAgICAgICAgICAgIHR4Yi5zaWduKHtcclxuICAgICAgICAgICAgICAgICAgICBwcmV2T3V0U2NyaXB0VHlwZTogc2lnbi5wcmV2T3V0U2NyaXB0VHlwZSxcclxuICAgICAgICAgICAgICAgICAgICB2aW46IGluZGV4LFxyXG4gICAgICAgICAgICAgICAgICAgIGtleVBhaXI6IGtleVBhaXIyLFxyXG4gICAgICAgICAgICAgICAgICAgIHJlZGVlbVNjcmlwdCxcclxuICAgICAgICAgICAgICAgICAgICBoYXNoVHlwZTogc2lnbi5oYXNoVHlwZSxcclxuICAgICAgICAgICAgICAgICAgICB3aXRuZXNzVmFsdWUsXHJcbiAgICAgICAgICAgICAgICAgICAgd2l0bmVzc1NjcmlwdCxcclxuICAgICAgICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgICAgICAgICB9LCBuZXcgUmVnRXhwKGYuZXhjZXB0aW9uKSk7XHJcbiAgICAgICAgICAgICAgICB0aHJldyA9IHRydWU7XHJcbiAgICAgICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgICAgIHR4Yi5zaWduKHtcclxuICAgICAgICAgICAgICAgICAgcHJldk91dFNjcmlwdFR5cGU6IHNpZ24ucHJldk91dFNjcmlwdFR5cGUsXHJcbiAgICAgICAgICAgICAgICAgIHZpbjogaW5kZXgsXHJcbiAgICAgICAgICAgICAgICAgIGtleVBhaXI6IGtleVBhaXIyLFxyXG4gICAgICAgICAgICAgICAgICByZWRlZW1TY3JpcHQsXHJcbiAgICAgICAgICAgICAgICAgIGhhc2hUeXBlOiBzaWduLmhhc2hUeXBlLFxyXG4gICAgICAgICAgICAgICAgICB3aXRuZXNzVmFsdWUsXHJcbiAgICAgICAgICAgICAgICAgIHdpdG5lc3NTY3JpcHQsXHJcbiAgICAgICAgICAgICAgICB9KTtcclxuICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH0pO1xyXG4gICAgICAgICAgfSk7XHJcblxyXG4gICAgICAgICAgYXNzZXJ0LnN0cmljdEVxdWFsKHRocmV3LCB0cnVlKTtcclxuICAgICAgICB9KTtcclxuICAgICAgfSk7XHJcbiAgICB9KTtcclxuXHJcbiAgICBkZXNjcmliZSgnYnVpbGQnLCAoKSA9PiB7XHJcbiAgICAgIGZpeHR1cmVzLnZhbGlkLmJ1aWxkLmZvckVhY2goKGY6IGFueSkgPT4ge1xyXG4gICAgICAgIGl0KCdidWlsZHMgXCInICsgZi5kZXNjcmlwdGlvbiArICdcIicsICgpID0+IHtcclxuICAgICAgICAgIGNvbnN0IHR4YiA9IGNvbnN0cnVjdChmLCBwYXJhbXMpO1xyXG4gICAgICAgICAgY29uc3QgdHggPSBmLmluY29tcGxldGUgPyB0eGIuYnVpbGRJbmNvbXBsZXRlKCkgOiB0eGIuYnVpbGQoKTtcclxuXHJcbiAgICAgICAgICBhc3NlcnQuc3RyaWN0RXF1YWwodHgudG9IZXgoKSwgZi50eEhleCk7XHJcbiAgICAgICAgfSk7XHJcbiAgICAgIH0pO1xyXG5cclxuICAgICAgLy8gVE9ETzogcmVtb3ZlIGR1cGxpY2F0ZSB0ZXN0IGNvZGVcclxuICAgICAgZml4dHVyZXMuaW52YWxpZC5idWlsZC5mb3JFYWNoKChmOiBhbnkpID0+IHtcclxuICAgICAgICBkZXNjcmliZSgnZm9yICcgKyAoZi5kZXNjcmlwdGlvbiB8fCBmLmV4Y2VwdGlvbiksICgpID0+IHtcclxuICAgICAgICAgIGl0KCd0aHJvd3MgJyArIGYuZXhjZXB0aW9uLCAoKSA9PiB7XHJcbiAgICAgICAgICAgIGFzc2VydC50aHJvd3MoKCkgPT4ge1xyXG4gICAgICAgICAgICAgIGxldCB0eGI7XHJcbiAgICAgICAgICAgICAgaWYgKGYudHhIZXgpIHtcclxuICAgICAgICAgICAgICAgIHR4YiA9IFRyYW5zYWN0aW9uQnVpbGRlci5mcm9tVHJhbnNhY3Rpb248VE51bWJlcj4oXHJcbiAgICAgICAgICAgICAgICAgIFRyYW5zYWN0aW9uLmZyb21IZXg8VE51bWJlcj4oZi50eEhleCwgcGFyYW1zLmFtb3VudFR5cGUpXHJcbiAgICAgICAgICAgICAgICApO1xyXG4gICAgICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgICAgICB0eGIgPSBjb25zdHJ1Y3QoZiwgcGFyYW1zKTtcclxuICAgICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICAgIHR4Yi5idWlsZCgpO1xyXG4gICAgICAgICAgICB9LCBuZXcgUmVnRXhwKGYuZXhjZXB0aW9uKSk7XHJcbiAgICAgICAgICB9KTtcclxuXHJcbiAgICAgICAgICAvLyBpZiB0aHJvd3Mgb24gaW5jb21wbGV0ZSB0b28sIGVuZm9yY2UgdGhhdFxyXG4gICAgICAgICAgaWYgKGYuaW5jb21wbGV0ZSkge1xyXG4gICAgICAgICAgICBpdCgndGhyb3dzICcgKyBmLmV4Y2VwdGlvbiwgKCkgPT4ge1xyXG4gICAgICAgICAgICAgIGFzc2VydC50aHJvd3MoKCkgPT4ge1xyXG4gICAgICAgICAgICAgICAgbGV0IHR4YjtcclxuICAgICAgICAgICAgICAgIGlmIChmLnR4SGV4KSB7XHJcbiAgICAgICAgICAgICAgICAgIHR4YiA9IFRyYW5zYWN0aW9uQnVpbGRlci5mcm9tVHJhbnNhY3Rpb248VE51bWJlcj4oXHJcbiAgICAgICAgICAgICAgICAgICAgVHJhbnNhY3Rpb24uZnJvbUhleDxUTnVtYmVyPihmLnR4SGV4LCBwYXJhbXMuYW1vdW50VHlwZSlcclxuICAgICAgICAgICAgICAgICAgKTtcclxuICAgICAgICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgICAgICAgIHR4YiA9IGNvbnN0cnVjdChmLCBwYXJhbXMpO1xyXG4gICAgICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgICAgIHR4Yi5idWlsZEluY29tcGxldGUoKTtcclxuICAgICAgICAgICAgICB9LCBuZXcgUmVnRXhwKGYuZXhjZXB0aW9uKSk7XHJcbiAgICAgICAgICAgIH0pO1xyXG4gICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgaXQoJ2RvZXMgbm90IHRocm93IGlmIGJ1aWxkSW5jb21wbGV0ZScsICgpID0+IHtcclxuICAgICAgICAgICAgICBsZXQgdHhiO1xyXG4gICAgICAgICAgICAgIGlmIChmLnR4SGV4KSB7XHJcbiAgICAgICAgICAgICAgICB0eGIgPSBUcmFuc2FjdGlvbkJ1aWxkZXIuZnJvbVRyYW5zYWN0aW9uPFROdW1iZXI+KFxyXG4gICAgICAgICAgICAgICAgICBUcmFuc2FjdGlvbi5mcm9tSGV4PFROdW1iZXI+KGYudHhIZXgsIHBhcmFtcy5hbW91bnRUeXBlKVxyXG4gICAgICAgICAgICAgICAgKTtcclxuICAgICAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgdHhiID0gY29uc3RydWN0KGYsIHBhcmFtcyk7XHJcbiAgICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgICB0eGIuYnVpbGRJbmNvbXBsZXRlKCk7XHJcbiAgICAgICAgICAgIH0pO1xyXG4gICAgICAgICAgfVxyXG4gICAgICAgIH0pO1xyXG4gICAgICB9KTtcclxuXHJcbiAgICAgIGl0KCdmb3IgaW5jb21wbGV0ZSB3aXRoIDAgc2lnbmF0dXJlcycsICgpID0+IHtcclxuICAgICAgICBjb25zdCByYW5kb21UeERhdGEgPVxyXG4gICAgICAgICAgJzAxMDAwMDAwMDAwMTAxMDAwMTAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMCcgK1xyXG4gICAgICAgICAgJzAwMDAwMDAwMDAwMDAwMDAwMDAwMDBmZmZmZmZmZjAxZTgwMzAwMDAwMDAwMDAwMDE5NzZhOTE0NGM5YzNkZmFjNCcgK1xyXG4gICAgICAgICAgJzIwN2Q1ZDhjYjg5ZGY1NzIyY2IzZDcxMjM4NWUzZjg4YWMwMjQ4MzA0NTAyMjEwMGFhNWQ4YWE0MGE5MGYyM2NlMicgK1xyXG4gICAgICAgICAgJ2MzZDExYmM4NDVjYTRhMTJhY2Q5OWNiZWEzN2RlNmI5ZjZkODZlZGViYmE4Y2IwMjIwMjJkZWRjMmFhMGEyNTVmNycgK1xyXG4gICAgICAgICAgJzRkMDRjMGI3NmVjZTJkN2M2OTFmOWRkMTFhNjRhOGFjNDlmNjJhOTljM2EwNWY5ZDAxMjMyMTAzNTk2ZDM0NTEwMicgK1xyXG4gICAgICAgICAgJzVjMTlkYmJkZWI5MzJkNmJmOGJmYjRhZDQ5OWI5NWI2Zjg4ZGI4ODk5ZWZhYzEwMmU1ZmM3MWFjMDAwMDAwMDAnO1xyXG4gICAgICAgIGNvbnN0IHJhbmRvbUFkZHJlc3MgPSAnMUJnR1o5dGNONHJtOUtCekRuN0twclF6ODdTWjI2U0FNSCc7XHJcblxyXG4gICAgICAgIGNvbnN0IHJhbmRvbVR4ID0gVHJhbnNhY3Rpb24uZnJvbUhleDxUTnVtYmVyPihyYW5kb21UeERhdGEsIHBhcmFtcy5hbW91bnRUeXBlKTtcclxuICAgICAgICBjb25zdCB0eGIgPSBuZXcgVHJhbnNhY3Rpb25CdWlsZGVyPFROdW1iZXI+KCk7XHJcbiAgICAgICAgdHhiLmFkZElucHV0KHJhbmRvbVR4LCAwKTtcclxuICAgICAgICB0eGIuYWRkT3V0cHV0KHJhbmRvbUFkZHJlc3MsIHRvQW1vdW50KDEwMDAsIHBhcmFtcy5hbW91bnRUeXBlKSBhcyBUTnVtYmVyKTtcclxuICAgICAgICBjb25zdCB0eCA9IHR4Yi5idWlsZEluY29tcGxldGUoKTtcclxuICAgICAgICBhc3NlcnQodHgpO1xyXG4gICAgICB9KTtcclxuXHJcbiAgICAgIGl0KCdmb3IgaW5jb21wbGV0ZSBQMlNIIHdpdGggMCBzaWduYXR1cmVzJywgKCkgPT4ge1xyXG4gICAgICAgIGNvbnN0IGlucCA9IEJ1ZmZlci5mcm9tKFxyXG4gICAgICAgICAgJzAxMDAwMDAwMDE3MzEyMDcwM2Y2NzMxOGFlZjUxZjcyNTEyNzJhNjgxNmQzZjc1MjNiYjI1ZTM0YjEzNmQ4MGJlOScgK1xyXG4gICAgICAgICAgICAnNTkzOTFjMTAwMDAwMDAwMDAwZmZmZmZmZmYwMTAwYzgxN2E4MDQwMDAwMDAxN2E5MTQ3MWE4ZWMwN2ZmNjljNmM0JyArXHJcbiAgICAgICAgICAgICdmZWU0ODkxODRjNDYyYTliMWI5MjM3NDg4NzAwMDAwMDAwJyxcclxuICAgICAgICAgICdoZXgnXHJcbiAgICAgICAgKTsgLy8gYXJiaXRyYXJ5IFAyU0ggaW5wdXRcclxuICAgICAgICBjb25zdCBpbnBUeCA9IFRyYW5zYWN0aW9uLmZyb21CdWZmZXI8VE51bWJlcj4oaW5wLCB1bmRlZmluZWQsIHBhcmFtcy5hbW91bnRUeXBlKTtcclxuXHJcbiAgICAgICAgY29uc3QgdHhiID0gbmV3IFRyYW5zYWN0aW9uQnVpbGRlcjxUTnVtYmVyPihORVRXT1JLUy50ZXN0bmV0KTtcclxuICAgICAgICB0eGIuYWRkSW5wdXQoaW5wVHgsIDApO1xyXG4gICAgICAgIHR4Yi5hZGRPdXRwdXQoJzJOQWtxcDV4ZmZvb21wNVJMQmNha3VHcFoxMkdVNHR3ZHo0JywgdG9BbW91bnQoMWU4LCBwYXJhbXMuYW1vdW50VHlwZSkgYXMgVE51bWJlcik7IC8vIGFyYml0cmFyeSBvdXRwdXRcclxuXHJcbiAgICAgICAgdHhiLmJ1aWxkSW5jb21wbGV0ZSgpO1xyXG4gICAgICB9KTtcclxuXHJcbiAgICAgIGl0KCdmb3IgaW5jb21wbGV0ZSBQMldQS0ggd2l0aCAwIHNpZ25hdHVyZXMnLCAoKSA9PiB7XHJcbiAgICAgICAgY29uc3QgaW5wID0gQnVmZmVyLmZyb20oXHJcbiAgICAgICAgICAnMDEwMDAwMDAwMTczMTIwNzAzZjY3MzE4YWVmNTFmNzI1MTI3MmE2ODE2ZDNmNzUyM2JiMjVlMzRiMTM2ZDgwYmU5JyArXHJcbiAgICAgICAgICAgICc1OTM5MWMxMDAwMDAwMDAwMDBmZmZmZmZmZjAxMDBjODE3YTgwNDAwMDAwMDE2MDAxNDFhMTU4MDVlMWY0MDQwYzknICtcclxuICAgICAgICAgICAgJ2Y2OGNjYzg4N2ZjYTJlNjM1NDdkNzk0YjAwMDAwMDAwJyxcclxuICAgICAgICAgICdoZXgnXHJcbiAgICAgICAgKTtcclxuICAgICAgICBjb25zdCBpbnBUeCA9IFRyYW5zYWN0aW9uLmZyb21CdWZmZXI8VE51bWJlcj4oaW5wLCB1bmRlZmluZWQsIHBhcmFtcy5hbW91bnRUeXBlKTtcclxuXHJcbiAgICAgICAgY29uc3QgdHhiID0gbmV3IFRyYW5zYWN0aW9uQnVpbGRlcjxUTnVtYmVyPihORVRXT1JLUy50ZXN0bmV0KTtcclxuICAgICAgICB0eGIuYWRkSW5wdXQoaW5wVHgsIDApO1xyXG4gICAgICAgIHR4Yi5hZGRPdXRwdXQoJzJOQWtxcDV4ZmZvb21wNVJMQmNha3VHcFoxMkdVNHR3ZHo0JywgdG9BbW91bnQoMWU4LCBwYXJhbXMuYW1vdW50VHlwZSkgYXMgVE51bWJlcik7IC8vIGFyYml0cmFyeSBvdXRwdXRcclxuXHJcbiAgICAgICAgdHhiLmJ1aWxkSW5jb21wbGV0ZSgpO1xyXG4gICAgICB9KTtcclxuXHJcbiAgICAgIGl0KCdmb3IgaW5jb21wbGV0ZSBQMldTSCB3aXRoIDAgc2lnbmF0dXJlcycsICgpID0+IHtcclxuICAgICAgICBjb25zdCBpbnBUeCA9IFRyYW5zYWN0aW9uLmZyb21CdWZmZXI8VE51bWJlcj4oXHJcbiAgICAgICAgICBCdWZmZXIuZnJvbShcclxuICAgICAgICAgICAgJzAxMDAwMDAwMDE3MzEyMDcwM2Y2NzMxOGFlZjUxZjcyNTEyNzJhNjgxNmQzZjc1MjNiYjI1ZTM0YjEzNmQ4MGInICtcclxuICAgICAgICAgICAgICAnZTk1OTM5MWMxMDAwMDAwMDAwMDBmZmZmZmZmZjAxMDBjODE3YTgwNDAwMDAwMDIyMDAyMDcyZGY3NmZjYzBiMicgK1xyXG4gICAgICAgICAgICAgICczMWI5NGJkZjdkOGMyNWQ3ZWVmNDcxNjU5NzgxOGQyMTFlMTlhZGU3ODEzYmZmN2EyNTAyMDAwMDAwMDAnLFxyXG4gICAgICAgICAgICAnaGV4J1xyXG4gICAgICAgICAgKSxcclxuICAgICAgICAgIHVuZGVmaW5lZCxcclxuICAgICAgICAgIHBhcmFtcy5hbW91bnRUeXBlXHJcbiAgICAgICAgKTtcclxuXHJcbiAgICAgICAgY29uc3QgdHhiID0gbmV3IFRyYW5zYWN0aW9uQnVpbGRlcjxUTnVtYmVyPihORVRXT1JLUy50ZXN0bmV0KTtcclxuICAgICAgICB0eGIuYWRkSW5wdXQoaW5wVHgsIDApO1xyXG4gICAgICAgIHR4Yi5hZGRPdXRwdXQoJzJOQWtxcDV4ZmZvb21wNVJMQmNha3VHcFoxMkdVNHR3ZHo0JywgdG9BbW91bnQoMWU4LCBwYXJhbXMuYW1vdW50VHlwZSkgYXMgVE51bWJlcik7IC8vIGFyYml0cmFyeSBvdXRwdXRcclxuXHJcbiAgICAgICAgdHhiLmJ1aWxkSW5jb21wbGV0ZSgpO1xyXG4gICAgICB9KTtcclxuICAgIH0pO1xyXG5cclxuICAgIGRlc2NyaWJlKCdtdWx0aXNpZycsICgpID0+IHtcclxuICAgICAgZml4dHVyZXMudmFsaWQubXVsdGlzaWcuZm9yRWFjaCgoZjogYW55KSA9PiB7XHJcbiAgICAgICAgaXQoZi5kZXNjcmlwdGlvbiwgKCkgPT4ge1xyXG4gICAgICAgICAgY29uc3QgbmV0d29yayA9IChORVRXT1JLUyBhcyBhbnkpW2YubmV0d29ya107XHJcbiAgICAgICAgICBsZXQgdHhiID0gY29uc3RydWN0PFROdW1iZXI+KGYsIHtcclxuICAgICAgICAgICAgZG9udFNpZ246IHRydWUsXHJcbiAgICAgICAgICAgIGFtb3VudFR5cGU6IHBhcmFtcy5hbW91bnRUeXBlLFxyXG4gICAgICAgICAgfSk7XHJcbiAgICAgICAgICBsZXQgdHg6IFRyYW5zYWN0aW9uPFROdW1iZXI+O1xyXG5cclxuICAgICAgICAgIGYuaW5wdXRzLmZvckVhY2goKGlucHV0OiBhbnksIGk6IG51bWJlcikgPT4ge1xyXG4gICAgICAgICAgICBjb25zdCByZWRlZW1TY3JpcHQgPSBic2NyaXB0LmZyb21BU00oaW5wdXQucmVkZWVtU2NyaXB0KTtcclxuXHJcbiAgICAgICAgICAgIGlucHV0LnNpZ25zLmZvckVhY2goKHNpZ246IGFueSkgPT4ge1xyXG4gICAgICAgICAgICAgIC8vIHJlYnVpbGQgdGhlIHRyYW5zYWN0aW9uIGVhY2gtdGltZSBhZnRlciB0aGUgZmlyc3RcclxuICAgICAgICAgICAgICBpZiAodHgpIHtcclxuICAgICAgICAgICAgICAgIC8vIG1hbnVhbGx5IG92ZXJyaWRlIHRoZSBzY3JpcHRTaWc/XHJcbiAgICAgICAgICAgICAgICBpZiAoc2lnbi5zY3JpcHRTaWdCZWZvcmUpIHtcclxuICAgICAgICAgICAgICAgICAgdHguaW5zW2ldLnNjcmlwdCA9IGJzY3JpcHQuZnJvbUFTTShzaWduLnNjcmlwdFNpZ0JlZm9yZSk7XHJcbiAgICAgICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICAgICAgLy8gcmVidWlsZFxyXG4gICAgICAgICAgICAgICAgdHhiID0gVHJhbnNhY3Rpb25CdWlsZGVyLmZyb21UcmFuc2FjdGlvbjxUTnVtYmVyPih0eCwgbmV0d29yayk7XHJcbiAgICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgICBjb25zdCBrZXlQYWlyMiA9IEVDUGFpci5mcm9tV0lGKHNpZ24ua2V5UGFpciwgbmV0d29yayk7XHJcbiAgICAgICAgICAgICAgdHhiLnNpZ24oe1xyXG4gICAgICAgICAgICAgICAgcHJldk91dFNjcmlwdFR5cGU6IHNpZ24ucHJldk91dFNjcmlwdFR5cGUsXHJcbiAgICAgICAgICAgICAgICB2aW46IGksXHJcbiAgICAgICAgICAgICAgICBrZXlQYWlyOiBrZXlQYWlyMixcclxuICAgICAgICAgICAgICAgIHJlZGVlbVNjcmlwdCxcclxuICAgICAgICAgICAgICAgIGhhc2hUeXBlOiAoc2lnbiBhcyBhbnkpLmhhc2hUeXBlLFxyXG4gICAgICAgICAgICAgIH0pO1xyXG5cclxuICAgICAgICAgICAgICAvLyB1cGRhdGUgdGhlIHR4XHJcbiAgICAgICAgICAgICAgdHggPSB0eGIuYnVpbGRJbmNvbXBsZXRlKCk7XHJcblxyXG4gICAgICAgICAgICAgIC8vIG5vdyB2ZXJpZnkgdGhlIHNlcmlhbGl6ZWQgc2NyaXB0U2lnIGlzIGFzIGV4cGVjdGVkXHJcbiAgICAgICAgICAgICAgYXNzZXJ0LnN0cmljdEVxdWFsKGJzY3JpcHQudG9BU00odHguaW5zW2ldLnNjcmlwdCksIHNpZ24uc2NyaXB0U2lnKTtcclxuICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgICB9KTtcclxuXHJcbiAgICAgICAgICB0eCA9IHR4Yi5idWlsZCgpO1xyXG4gICAgICAgICAgYXNzZXJ0LnN0cmljdEVxdWFsKHR4LnRvSGV4KCksIGYudHhIZXgpO1xyXG4gICAgICAgIH0pO1xyXG4gICAgICB9KTtcclxuICAgIH0pO1xyXG5cclxuICAgIGRlc2NyaWJlKCd2YXJpb3VzIGVkZ2UgY2FzZScsICgpID0+IHtcclxuICAgICAgY29uc3QgbmV0d29yayA9IE5FVFdPUktTLnRlc3RuZXQ7XHJcblxyXG4gICAgICBpdCgnc2hvdWxkIHdhcm4gb2YgaGlnaCBmZWUgZm9yIHNlZ3dpdCB0cmFuc2FjdGlvbiBiYXNlZCBvbiBWU2l6ZSwgbm90IFNpemUnLCAoKSA9PiB7XHJcbiAgICAgICAgY29uc3QgcmF3dHggPVxyXG4gICAgICAgICAgJzAxMDAwMDAwMDAwMTA0ZmRhYWM4OTYyNzIwOGI0NzMzNDg0Y2E1NmJjMjkxZjRjZjRmYThkN2M1ZjI5ODkzYzUyYjQ2Nzg4YTBhJyArXHJcbiAgICAgICAgICAnMWRmOTAwMDAwMDAwMDBmZmZmZmZmZmZkYWFjODk2MjcyMDhiNDczMzQ4NGNhNTZiYzI5MWY0Y2Y0ZmE4ZDdjNWYyOTg5M2M1MmI0Njc4OGEwYTFkZjknICtcclxuICAgICAgICAgICcwMTAwMDAwMDAwZmZmZmZmZmZhMmVmN2FhYWIzMTZhM2U1YjViMGE3OGQxZDM1Yzc3NGI5NWEwNzlmOWYwYzc2MjI3N2E0OWNhZjFmMjZiY2E0MDAwMCcgK1xyXG4gICAgICAgICAgJzAwMDAwMGZmZmZmZmZmYTJlZjdhYWFiMzE2YTNlNWI1YjBhNzhkMWQzNWM3NzRiOTVhMDc5ZjlmMGM3NjIyNzdhNDljYWYxZjI2YmNhNDAxMDAwMDAwJyArXHJcbiAgICAgICAgICAnMDBmZmZmZmZmZjAxMDAwNDAwMDAwMDAwMDAwMDE5NzZhOTE0Y2YzMDcyODUzNTlhYjdlZjZhMmRhYTA1MjJjNzkwOGRkZjVmZTdhOTg4YWMwMjQ3MzAnICtcclxuICAgICAgICAgICc0NDAyMjAxMTMzMjQ0Mzg4MTYzMzg0MDY4NDE3NzVlMDc5YjA0YzUwZDA0ZjI0MWRhNjUyYTQwMzViMTAxN2VhMWVjZjU1MDIyMDU4MDIxOTFlYjQ5YycgK1xyXG4gICAgICAgICAgJzU0YmYyYTU2NjdhZWE3MmU1MWMzY2E5MjA4NWVmYzYwZjEyZDFlYmRhM2E2NGFmZjM0MzIwMTIxMDI4MzQwOTY1OTM1NWI2ZDFjYzNjMzJkZWNkNWQ1JyArXHJcbiAgICAgICAgICAnNjFhYmFhYzg2YzM3YTM1M2I1Mjg5NWE1ZTZjMTk2ZDZmNDQ4MDI0ODMwNDUwMjIxMDBkYzI4OTI4NzRlNmQ4NzA4ZTNmNWEwNThjNWM5MjYzY2RmMDMnICtcclxuICAgICAgICAgICc5Njk0OTIyNzBmODllZTQ5MzNjYWY2ZGFmOGJiMDIyMDM5MWRmZTYxYTAwMjcwOWI2M2I5ZDY0NDIyZDNkYjA5YjcyNzgzOWQxMjg3ZTEwYTEyOGE1ZCcgK1xyXG4gICAgICAgICAgJ2I1MmE4MjMwOTMwMTIxMDI4MzQwOTY1OTM1NWI2ZDFjYzNjMzJkZWNkNWQ1NjFhYmFhYzg2YzM3YTM1M2I1Mjg5NWE1ZTZjMTk2ZDZmNDQ4MDI0ODMwJyArXHJcbiAgICAgICAgICAnNDUwMjIxMDA5ZTNlZDNhNmFlOTNhMDE4ZjQ0MzI1N2I0M2U0N2I1NWNmN2Y3ZjM1NDdkODgwNzE3ODA3MjIzNDY4NmIyMjE2MDIyMDU3NjEyMWNmZTYnICtcclxuICAgICAgICAgICc3N2M3ZWRkZjU1NzVlYTBhN2M5MjYyNDdkZjZlY2E3MjNjNGY4NWRmMzA2ZThiYzA4ZWEyZGYwMTIxMDI4MzQwOTY1OTM1NWI2ZDFjYzNjMzJkZWNkNScgK1xyXG4gICAgICAgICAgJ2Q1NjFhYmFhYzg2YzM3YTM1M2I1Mjg5NWE1ZTZjMTk2ZDZmNDQ4MDI0NzMwNDQwMjIwMDdiZTgxZmZkNDI5NzQ0MWFiMTBlNzQwZmM5YmFiOTU0NWEyJyArXHJcbiAgICAgICAgICAnMTk0YTU2NWNkNmFhNGNjMzhiOGVhZmZhMzQzNDAyMjAxYzViNGI2MWQ3M2ZhMzhlNDljMWVlNjhjYzBlNmRmZDJmNWRhZTQ1M2RkODZlYjE0MmU4N2EnICtcclxuICAgICAgICAgICcwYmFmYjFiYzg0MDEyMTAyODM0MDk2NTkzNTViNmQxY2MzYzMyZGVjZDVkNTYxYWJhYWM4NmMzN2EzNTNiNTI4OTVhNWU2YzE5NmQ2ZjQ0ODAwMDAwMDAwJztcclxuICAgICAgICBjb25zdCB0eGIgPSBUcmFuc2FjdGlvbkJ1aWxkZXIuZnJvbVRyYW5zYWN0aW9uPFROdW1iZXI+KFRyYW5zYWN0aW9uLmZyb21IZXg8VE51bWJlcj4ocmF3dHgsIHBhcmFtcy5hbW91bnRUeXBlKSk7XHJcbiAgICAgICAgKHR4YiBhcyBhbnkpLl9fSU5QVVRTWzBdLnZhbHVlID0gdG9BbW91bnQoMjQxNTMwLCBwYXJhbXMuYW1vdW50VHlwZSkgYXMgVE51bWJlcjtcclxuICAgICAgICAodHhiIGFzIGFueSkuX19JTlBVVFNbMV0udmFsdWUgPSB0b0Ftb3VudCgyNDE1MzAsIHBhcmFtcy5hbW91bnRUeXBlKSBhcyBUTnVtYmVyO1xyXG4gICAgICAgICh0eGIgYXMgYW55KS5fX0lOUFVUU1syXS52YWx1ZSA9IHRvQW1vdW50KDI0ODkyMCwgcGFyYW1zLmFtb3VudFR5cGUpIGFzIFROdW1iZXI7XHJcbiAgICAgICAgKHR4YiBhcyBhbnkpLl9fSU5QVVRTWzNdLnZhbHVlID0gdG9BbW91bnQoMjQ4OTIwLCBwYXJhbXMuYW1vdW50VHlwZSkgYXMgVE51bWJlcjtcclxuXHJcbiAgICAgICAgYXNzZXJ0LnRocm93cygoKSA9PiB7XHJcbiAgICAgICAgICB0eGIuYnVpbGQoKTtcclxuICAgICAgICB9LCBuZXcgUmVnRXhwKCdUcmFuc2FjdGlvbiBoYXMgYWJzdXJkIGZlZXMnKSk7XHJcbiAgICAgIH0pO1xyXG5cclxuICAgICAgaXQoJ3Nob3VsZCBjbGFzc2lmeSB3aXRuZXNzIGlucHV0cyB3aXRoIHdpdG5lc3MgPSB0cnVlIGR1cmluZyBtdWx0aXNpZ25pbmcnLCAoKSA9PiB7XHJcbiAgICAgICAgY29uc3QgaW5uZXJLZXlQYWlyID0gRUNQYWlyLmZyb21XSUYoXHJcbiAgICAgICAgICAnY1JBd3VWdVZTQlpNUHU3aGRyWXZNQ1o4ZWV2em1rRXhqRmJhQkxocW5EZHJlenhOM25UUycsXHJcbiAgICAgICAgICBuZXR3b3JrIGFzIGJpdGNvaW5qcy5OZXR3b3JrXHJcbiAgICAgICAgKTtcclxuICAgICAgICBjb25zdCB3aXRuZXNzU2NyaXB0ID0gQnVmZmVyLmZyb20oXHJcbiAgICAgICAgICAnNTIyMTAyYmJiZDZlYjAxZWZjYmU0YmQ5NjY0Yjg4NmYyNmY2OWRlNWFmY2IyZTQ3OWQ3MjU5NmM4YmYyMTkyOWUzJyArXHJcbiAgICAgICAgICAgICc1MmUyMjEwMmQ5YzNmNzE4MGVmMTNlYzUyNjc3MjNjOWMyZmZhYjU2YTQyMTUyNDFmODM3NTAyZWE4OTc3Yzg1MzInICtcclxuICAgICAgICAgICAgJ2I5ZWExOTUyYWUnLFxyXG4gICAgICAgICAgJ2hleCdcclxuICAgICAgICApO1xyXG4gICAgICAgIGNvbnN0IHJlZGVlbVNjcmlwdCA9IEJ1ZmZlci5mcm9tKCcwMDIwMjQzNzZhMGE5YWJhYjU5OWQwZTAyODI0OGQ0OGViZTgxN2JjODk5ZWZjZmZhMWNkMjk4NGQ2NzI4OWRhZjVhZicsICdoZXgnKTtcclxuICAgICAgICBjb25zdCBzY3JpcHRQdWJLZXkgPSBCdWZmZXIuZnJvbSgnYTkxNGI2NGYxYTNlYWNjMWM4NTE1NTkyYTZmMTA0NTdlOGZmOTBlNGRiNmE4NycsICdoZXgnKTtcclxuICAgICAgICBjb25zdCB0eGIgPSBuZXcgVHJhbnNhY3Rpb25CdWlsZGVyPFROdW1iZXI+KG5ldHdvcmspO1xyXG4gICAgICAgIHR4Yi5zZXRWZXJzaW9uKDEpO1xyXG4gICAgICAgIHR4Yi5hZGRJbnB1dCgnYTQ2OTZjNGIwY2QyN2VjMmUxNzNhYjFmYTdkMWNjNjM5YTk4ZWUyMzdjZWM5NWE3N2NhN2ZmNDE0NTc5MTUyOScsIDEsIDB4ZmZmZmZmZmYsIHNjcmlwdFB1YktleSk7XHJcbiAgICAgICAgdHhiLmFkZE91dHB1dChzY3JpcHRQdWJLZXksIHRvQW1vdW50KDk5MDAwLCBwYXJhbXMuYW1vdW50VHlwZSkgYXMgVE51bWJlcik7XHJcbiAgICAgICAgdHhiLnNpZ24oe1xyXG4gICAgICAgICAgcHJldk91dFNjcmlwdFR5cGU6ICdwMnNoLXAyd3NoLXAybXMnLFxyXG4gICAgICAgICAgdmluOiAwLFxyXG4gICAgICAgICAga2V5UGFpcjogaW5uZXJLZXlQYWlyLFxyXG4gICAgICAgICAgcmVkZWVtU2NyaXB0LFxyXG4gICAgICAgICAgd2l0bmVzc1ZhbHVlOiB0b0Ftb3VudCgxMDAwMDAsIHBhcmFtcy5hbW91bnRUeXBlKSBhcyBUTnVtYmVyLFxyXG4gICAgICAgICAgd2l0bmVzc1NjcmlwdCxcclxuICAgICAgICB9KTtcclxuXHJcbiAgICAgICAgLy8gMi1vZi0yIHNpZ25lZCBvbmx5IG9uY2VcclxuICAgICAgICBjb25zdCB0eCA9IHR4Yi5idWlsZEluY29tcGxldGUoKTtcclxuXHJcbiAgICAgICAgLy8gT25seSBpbnB1dCBpcyBzZWd3aXQsIHNvIHR4aWQgc2hvdWxkIGJlIGFjY3VyYXRlIHdpdGggdGhlIGZpbmFsIHR4XHJcbiAgICAgICAgYXNzZXJ0LnN0cmljdEVxdWFsKHR4LmdldElkKCksICdmMTVkMGE2NWIyMWI0NDcxNDA1YjIxYTA5OWY4YjE4ZTFhZTRkNDZkNTVlZmJkMGY0NzY2Y2YxMWFkNmNiODIxJyk7XHJcblxyXG4gICAgICAgIGNvbnN0IHR4SGV4ID0gdHgudG9IZXgoKTtcclxuICAgICAgICBUcmFuc2FjdGlvbkJ1aWxkZXIuZnJvbVRyYW5zYWN0aW9uPFROdW1iZXI+KFRyYW5zYWN0aW9uLmZyb21IZXg8VE51bWJlcj4odHhIZXgsIHBhcmFtcy5hbW91bnRUeXBlKSk7XHJcbiAgICAgIH0pO1xyXG5cclxuICAgICAgaXQoJ3Nob3VsZCBoYW5kbGUgYmFkbHkgcHJlLWZpbGxlZCBPUF8wcycsICgpID0+IHtcclxuICAgICAgICAvLyBPUF8wIGlzIHVzZWQgd2hlcmUgYSBzaWduYXR1cmUgaXMgbWlzc2luZ1xyXG4gICAgICAgIGNvbnN0IHJlZGVlbVNjcmlwU2lnID0gYnNjcmlwdC5mcm9tQVNNKFxyXG4gICAgICAgICAgJ09QXzAgT1BfMCAzMDQ1MDIyMTAwZGFmMGY0ZjMzMzlkOWZiYWI0MmIwOTgwNDVjMWU0OTU4ZWUzYjMwOGY0YWUxNycgK1xyXG4gICAgICAgICAgICAnYmU4MGI2MzgwODU1OGQwYWRiMDIyMDJmMDdlM2QxZjc5ZGM4ZGEyODVhZTBkN2Y2ODA4M2Q3NjljMTFmNTYyMWViJyArXHJcbiAgICAgICAgICAgICdkOTY5MWQ2YjQ4YzBkNDI4M2Q3ZDAxIDUyNDEwNDc5YmU2NjdlZjlkY2JiYWM1NWEwNjI5NWNlODcwYjA3MDI5YmYnICtcclxuICAgICAgICAgICAgJ2NkYjJkY2UyOGQ5NTlmMjgxNWIxNmY4MTc5ODQ4M2FkYTc3MjZhM2M0NjU1ZGE0ZmJmYzBlMTEwOGE4ZmQxN2I0NCcgK1xyXG4gICAgICAgICAgICAnOGE2ODU1NDE5OWM0N2QwOGZmYjEwZDRiODQxMDRjNjA0N2Y5NDQxZWQ3ZDZkMzA0NTQwNmU5NWMwN2NkODVjNzc4JyArXHJcbiAgICAgICAgICAgICdlNGI4Y2VmM2NhN2FiYWMwOWI5NWM3MDllZTUxYWUxNjhmZWE2M2RjMzM5YTNjNTg0MTk0NjZjZWFlZWY3ZjYzMjYnICtcclxuICAgICAgICAgICAgJzUzMjY2ZDBlMTIzNjQzMWE5NTBjZmU1MmE0MTA0ZjkzMDhhMDE5MjU4YzMxMDQ5MzQ0Zjg1Zjg5ZDUyMjliNTMxYycgK1xyXG4gICAgICAgICAgICAnODQ1ODM2Zjk5YjA4NjAxZjExM2JjZTAzNmY5Mzg4ZjdiMGY2MzJkZTgxNDBmZTMzN2U2MmEzN2YzNTY2NTAwYTk5JyArXHJcbiAgICAgICAgICAgICc5MzRjMjIzMWI2Y2I5ZmQ3NTg0YjhlNjcyNTNhZSdcclxuICAgICAgICApO1xyXG4gICAgICAgIGNvbnN0IHJlZGVlbVNjcmlwdCA9IGJzY3JpcHQuZnJvbUFTTShcclxuICAgICAgICAgICdPUF8yIDA0NzliZTY2N2VmOWRjYmJhYzU1YTA2Mjk1Y2U4NzBiMDcwMjliZmNkYjJkY2UyOGQ5NTlmMjgxNWIxNmYnICtcclxuICAgICAgICAgICAgJzgxNzk4NDgzYWRhNzcyNmEzYzQ2NTVkYTRmYmZjMGUxMTA4YThmZDE3YjQ0OGE2ODU1NDE5OWM0N2QwOGZmYjEwZCcgK1xyXG4gICAgICAgICAgICAnNGI4IDA0YzYwNDdmOTQ0MWVkN2Q2ZDMwNDU0MDZlOTVjMDdjZDg1Yzc3OGU0YjhjZWYzY2E3YWJhYzA5Yjk1YzcwJyArXHJcbiAgICAgICAgICAgICc5ZWU1MWFlMTY4ZmVhNjNkYzMzOWEzYzU4NDE5NDY2Y2VhZWVmN2Y2MzI2NTMyNjZkMGUxMjM2NDMxYTk1MGNmZTUnICtcclxuICAgICAgICAgICAgJzJhIDA0ZjkzMDhhMDE5MjU4YzMxMDQ5MzQ0Zjg1Zjg5ZDUyMjliNTMxYzg0NTgzNmY5OWIwODYwMWYxMTNiY2UwMycgK1xyXG4gICAgICAgICAgICAnNmY5Mzg4ZjdiMGY2MzJkZTgxNDBmZTMzN2U2MmEzN2YzNTY2NTAwYTk5OTM0YzIyMzFiNmNiOWZkNzU4NGI4ZTY3JyArXHJcbiAgICAgICAgICAgICcyIE9QXzMgT1BfQ0hFQ0tNVUxUSVNJRydcclxuICAgICAgICApO1xyXG5cclxuICAgICAgICBjb25zdCB0eCA9IG5ldyBUcmFuc2FjdGlvbjxUTnVtYmVyPigpO1xyXG4gICAgICAgIHR4LmFkZElucHV0KFxyXG4gICAgICAgICAgQnVmZmVyLmZyb20oJ2NmZjU4ODU1NDI2NDY5ZDBlZjE2NDQyZWU5YzY0NGM0ZmIxMzgzMjQ2N2JjYmMzMTczMTY4YTc5MTZmMDcxNDknLCAnaGV4JyksXHJcbiAgICAgICAgICAwLFxyXG4gICAgICAgICAgdW5kZWZpbmVkLFxyXG4gICAgICAgICAgcmVkZWVtU2NyaXBTaWdcclxuICAgICAgICApO1xyXG4gICAgICAgIHR4LmFkZE91dHB1dChcclxuICAgICAgICAgIEJ1ZmZlci5mcm9tKCc3NmE5MTRhYTRkNzk4NWM1N2UwMTFhOGIzZGQ4ZTBlNWE3M2FhZWY0MTYyOWM1ODhhYycsICdoZXgnKSxcclxuICAgICAgICAgIHRvQW1vdW50KDEwMDAsIHBhcmFtcy5hbW91bnRUeXBlKSBhcyBUTnVtYmVyXHJcbiAgICAgICAgKTtcclxuXHJcbiAgICAgICAgLy8gbm93IGltcG9ydCB0aGUgVHJhbnNhY3Rpb25cclxuICAgICAgICBjb25zdCB0eGIgPSBUcmFuc2FjdGlvbkJ1aWxkZXIuZnJvbVRyYW5zYWN0aW9uPFROdW1iZXI+KHR4LCBORVRXT1JLUy50ZXN0bmV0KTtcclxuXHJcbiAgICAgICAgY29uc3Qga2V5UGFpcjIgPSBFQ1BhaXIuZnJvbVdJRihcclxuICAgICAgICAgICc5MWF2QVJHZGZnZThFNHRaZllMb3hlSjVzR0JkTkpRSDRrdmpKb1FGYWNiZ3gzY1RNcWUnLFxyXG4gICAgICAgICAgbmV0d29yayBhcyBiaXRjb2luanMuTmV0d29ya1xyXG4gICAgICAgICk7XHJcbiAgICAgICAgdHhiLnNpZ24oe1xyXG4gICAgICAgICAgcHJldk91dFNjcmlwdFR5cGU6ICdwMnNoLXAybXMnLFxyXG4gICAgICAgICAgdmluOiAwLFxyXG4gICAgICAgICAga2V5UGFpcjoga2V5UGFpcjIsXHJcbiAgICAgICAgICByZWRlZW1TY3JpcHQsXHJcbiAgICAgICAgfSk7XHJcblxyXG4gICAgICAgIGNvbnN0IHR4MiA9IHR4Yi5idWlsZCgpO1xyXG4gICAgICAgIGFzc2VydC5zdHJpY3RFcXVhbCh0eDIuZ2V0SWQoKSwgJ2VhYjU5NjE4YTU2NGUzNjFhZGVmNmQ5MThiZDc5MjkwM2MzZDQxYmNmMTIyMDEzNzM2NGZiODQ3ODgwNDY3ZjknKTtcclxuICAgICAgICBhc3NlcnQuc3RyaWN0RXF1YWwoXHJcbiAgICAgICAgICBic2NyaXB0LnRvQVNNKHR4Mi5pbnNbMF0uc2NyaXB0KSxcclxuICAgICAgICAgICdPUF8wIDMwNDUwMjIxMDBkYWYwZjRmMzMzOWQ5ZmJhYjQyYjA5ODA0NWMxZTQ5NThlZTNiMzA4ZjRhZTE3YmU4MGInICtcclxuICAgICAgICAgICAgJzYzODA4NTU4ZDBhZGIwMjIwMmYwN2UzZDFmNzlkYzhkYTI4NWFlMGQ3ZjY4MDgzZDc2OWMxMWY1NjIxZWJkOTY5MScgK1xyXG4gICAgICAgICAgICAnZDZiNDhjMGQ0MjgzZDdkMDEgMzA0NTAyMjEwMGEzNDZjNjE3MzgzMDRlYWM1ZTc3MDIxODg3NjRkMTljZGY2OGY0JyArXHJcbiAgICAgICAgICAgICc0NjYxOTY3MjlkYjA5NmQ2Yzg3Y2UxOGNkZDAyMjAxOGMwZThhZDAzMDU0YjBlN2UyMzVjZGE2YmVkZWNmMzU4ODEnICtcclxuICAgICAgICAgICAgJ2Q3YWE3ZDk0ZmY0MjVhOGFjZTcyMjBmMzhhZjAwMSA1MjQxMDQ3OWJlNjY3ZWY5ZGNiYmFjNTVhMDYyOTVjZTg3MCcgK1xyXG4gICAgICAgICAgICAnYjA3MDI5YmZjZGIyZGNlMjhkOTU5ZjI4MTViMTZmODE3OTg0ODNhZGE3NzI2YTNjNDY1NWRhNGZiZmMwZTExMDhhJyArXHJcbiAgICAgICAgICAgICc4ZmQxN2I0NDhhNjg1NTQxOTljNDdkMDhmZmIxMGQ0Yjg0MTA0YzYwNDdmOTQ0MWVkN2Q2ZDMwNDU0MDZlOTVjMDcnICtcclxuICAgICAgICAgICAgJ2NkODVjNzc4ZTRiOGNlZjNjYTdhYmFjMDliOTVjNzA5ZWU1MWFlMTY4ZmVhNjNkYzMzOWEzYzU4NDE5NDY2Y2VhZScgK1xyXG4gICAgICAgICAgICAnZWY3ZjYzMjY1MzI2NmQwZTEyMzY0MzFhOTUwY2ZlNTJhNDEwNGY5MzA4YTAxOTI1OGMzMTA0OTM0NGY4NWY4OWQ1JyArXHJcbiAgICAgICAgICAgICcyMjliNTMxYzg0NTgzNmY5OWIwODYwMWYxMTNiY2UwMzZmOTM4OGY3YjBmNjMyZGU4MTQwZmUzMzdlNjJhMzdmMzUnICtcclxuICAgICAgICAgICAgJzY2NTAwYTk5OTM0YzIyMzFiNmNiOWZkNzU4NGI4ZTY3MjUzYWUnXHJcbiAgICAgICAgKTtcclxuICAgICAgfSk7XHJcblxyXG4gICAgICBpdCgnc2hvdWxkIG5vdCBjbGFzc2lmeSBibGFuayBzY3JpcHRzIGFzIG5vbnN0YW5kYXJkJywgKCkgPT4ge1xyXG4gICAgICAgIGxldCB0eGIgPSBuZXcgVHJhbnNhY3Rpb25CdWlsZGVyPFROdW1iZXI+KCk7XHJcbiAgICAgICAgdHhiLnNldFZlcnNpb24oMSk7XHJcbiAgICAgICAgdHhiLmFkZElucHV0KCdhYTk0YWIwMmMxODIyMTRmMDkwZTk5YTBkNTcwMjFjYWZmZDBmMTk1YTgxYzI0NjAyYjEwMjhiMTMwYjYzZTMxJywgMCk7XHJcblxyXG4gICAgICAgIGNvbnN0IGluY29tcGxldGUgPSB0eGIuYnVpbGRJbmNvbXBsZXRlKCkudG9IZXgoKTtcclxuICAgICAgICBjb25zdCBpbm5lcktleVBhaXIgPSBFQ1BhaXIuZnJvbVdJRignTDF1eXk1cVR1R3JWWHJtcnN2SFdIZ1Z6VzlrS2RycDI3d0JDN1ZzNm5aRFRGMkJSVVZ3eScpO1xyXG5cclxuICAgICAgICAvLyBzaWduLCBhcyBleHBlY3RlZFxyXG4gICAgICAgIHR4Yi5hZGRPdXRwdXQoJzFHb2ttODJ2NkRtdHdLRUI4QWlWaG04Mmh5RlNzRXZCREsnLCB0b0Ftb3VudCgxNTAwMCwgcGFyYW1zLmFtb3VudFR5cGUpIGFzIFROdW1iZXIpO1xyXG4gICAgICAgIHR4Yi5zaWduKHtcclxuICAgICAgICAgIHByZXZPdXRTY3JpcHRUeXBlOiAncDJwa2gnLFxyXG4gICAgICAgICAgdmluOiAwLFxyXG4gICAgICAgICAga2V5UGFpcjogaW5uZXJLZXlQYWlyLFxyXG4gICAgICAgIH0pO1xyXG4gICAgICAgIGNvbnN0IHR4SWQgPSB0eGIuYnVpbGQoKS5nZXRJZCgpO1xyXG4gICAgICAgIGFzc2VydC5zdHJpY3RFcXVhbCh0eElkLCAnNTRmMDk3MzE1YWNiYWVkYjkyYTk1NDU1ZGEzMzY4ZWI0NTk4MWNkYWU1ZmZiYzM4N2E5YWZjODcyYzBmMjliMycpO1xyXG5cclxuICAgICAgICAvLyBhbmQsIHJlcGVhdFxyXG4gICAgICAgIHR4YiA9IFRyYW5zYWN0aW9uQnVpbGRlci5mcm9tVHJhbnNhY3Rpb248VE51bWJlcj4oVHJhbnNhY3Rpb24uZnJvbUhleDxUTnVtYmVyPihpbmNvbXBsZXRlLCBwYXJhbXMuYW1vdW50VHlwZSkpO1xyXG4gICAgICAgIHR4Yi5hZGRPdXRwdXQoJzFHb2ttODJ2NkRtdHdLRUI4QWlWaG04Mmh5RlNzRXZCREsnLCB0b0Ftb3VudCgxNTAwMCwgcGFyYW1zLmFtb3VudFR5cGUpIGFzIFROdW1iZXIpO1xyXG4gICAgICAgIHR4Yi5zaWduKHtcclxuICAgICAgICAgIHByZXZPdXRTY3JpcHRUeXBlOiAncDJwa2gnLFxyXG4gICAgICAgICAgdmluOiAwLFxyXG4gICAgICAgICAga2V5UGFpcjogaW5uZXJLZXlQYWlyLFxyXG4gICAgICAgIH0pO1xyXG4gICAgICAgIGNvbnN0IHR4SWQyID0gdHhiLmJ1aWxkKCkuZ2V0SWQoKTtcclxuICAgICAgICBhc3NlcnQuc3RyaWN0RXF1YWwodHhJZCwgdHhJZDIpO1xyXG4gICAgICAgIC8vIFRPRE86IFJlbW92ZSBtZSBpbiB2NlxyXG4gICAgICAgIGlmIChwYXJhbXMudXNlT2xkU2lnbkFyZ3MpIHtcclxuICAgICAgICAgIGNvbnNvbGUud2FybiA9IGNvbnNvbGVXYXJuO1xyXG4gICAgICAgIH1cclxuICAgICAgfSk7XHJcbiAgICB9KTtcclxuICB9KTtcclxufVxyXG5cclxuLy8gVE9ETzogUmVtb3ZlIGxvb3AgaW4gdjZcclxuZm9yIChjb25zdCB1c2VPbGRTaWduQXJncyBvZiBbZmFsc2UsIHRydWVdKSB7XHJcbiAgcnVuVGVzdDxudW1iZXI+KFxyXG4gICAgdHhiX2ZpeHR1cmVzLFxyXG4gICAgYFRyYW5zYWN0aW9uQnVpbGRlcjogdXNlT2xkU2lnbkFyZ3MgPT09ICR7dXNlT2xkU2lnbkFyZ3N9LCBhbW91bnRUeXBlID09PSBudW1iZXIsIHRlc3RGaXh0dXJlID09PSB0cmFuc2FjdGlvbl9idWlsZGVyLmpzb25gLFxyXG4gICAgeyB1c2VPbGRTaWduQXJncywgYW1vdW50VHlwZTogJ251bWJlcicgfVxyXG4gICk7XHJcbiAgcnVuVGVzdDxiaWdpbnQ+KFxyXG4gICAgdHhiX2ZpeHR1cmVzLFxyXG4gICAgYFRyYW5zYWN0aW9uQnVpbGRlcjogdXNlT2xkU2lnbkFyZ3MgPT09ICR7dXNlT2xkU2lnbkFyZ3N9LCBhbW91bnRUeXBlID09PSBiaWdpbnQsIHRlc3RGaXh0dXJlID09PSB0cmFuc2FjdGlvbl9idWlsZGVyLmpzb25gLFxyXG4gICAgeyB1c2VPbGRTaWduQXJncywgYW1vdW50VHlwZTogJ2JpZ2ludCcgfVxyXG4gICk7XHJcbiAgcnVuVGVzdDxiaWdpbnQ+KFxyXG4gICAgdHhiX2JpZ19maXh0dXJlcyxcclxuICAgIGBUcmFuc2FjdGlvbkJ1aWxkZXI6IHVzZU9sZFNpZ25BcmdzID09PSAke3VzZU9sZFNpZ25BcmdzfSwgYW1vdW50VHlwZSA9PT0gYmlnaW50LCB0ZXN0Rml4dHVyZSA9PT0gdHJhbnNhY3Rpb25fYnVpbGRlcl9iaWdpbnQuanNvbmAsXHJcbiAgICB7IHVzZU9sZFNpZ25BcmdzLCBhbW91bnRUeXBlOiAnYmlnaW50JyB9XHJcbiAgKTtcclxufVxyXG4iXX0=
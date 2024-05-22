/// <reference types="node" />
import { Network } from 'bitcoinjs-lib/src/networks';
import { TapTree } from 'bip174/src/lib/interfaces';
import { TinySecp256k1Interface } from 'bitcoinjs-lib/src/types';
import { p2data as embed } from 'bitcoinjs-lib/src/payments/embed';
import { p2ms } from 'bitcoinjs-lib/src/payments/p2ms';
import { p2pk } from 'bitcoinjs-lib/src/payments/p2pk';
import { p2pkh } from './p2pkh';
import { p2sh } from './p2sh';
import { p2tr } from 'bitcoinjs-lib/src/payments/p2tr';
import { p2tr_ns } from 'bitcoinjs-lib/src/payments/p2tr_ns';
import { p2wpkh } from 'bitcoinjs-lib/src/payments/p2wpkh';
import { p2wsh } from 'bitcoinjs-lib/src/payments/p2wsh';
import * as lazy from 'bitcoinjs-lib/src/payments/lazy';
export interface Payment {
    name?: string;
    network?: Network;
    output?: Buffer;
    data?: Buffer[];
    m?: number;
    n?: number;
    pubkeys?: Buffer[];
    input?: Buffer;
    signatures?: Buffer[];
    pubkey?: Buffer;
    taptreeRoot?: Buffer;
    internalPubkey?: Buffer;
    signature?: Buffer;
    address?: string;
    hash?: Buffer;
    redeem?: Payment;
    redeems?: Payment[];
    redeemIndex?: number;
    witness?: Buffer[];
    weight?: number;
    depth?: number;
    controlBlock?: Buffer;
    tapTree?: TapTree;
    annex?: Buffer;
}
export declare type PaymentCreator = (a: Payment, opts?: PaymentOpts) => Payment;
export declare type PaymentFunction = () => Payment;
export interface PaymentOpts {
    validate?: boolean;
    allowIncomplete?: boolean;
    eccLib?: TinySecp256k1Interface;
}
export declare type StackElement = Buffer | number;
export declare type Stack = StackElement[];
export declare type StackFunction = () => Stack;
export { embed, p2ms, p2pk, p2pkh, p2sh, p2tr, p2tr_ns, p2wpkh, p2wsh, lazy };
//# sourceMappingURL=index.d.ts.map
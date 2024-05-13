/// <reference types="node" />
import { Network } from '../../src';
import { AddressFormat } from '../../src/addressFormat';
export declare type TestVector = {
    /** address network */
    network: Network;
    /** network-specific address format */
    format: AddressFormat;
    /** hash (p2sh or p2pkh) */
    payload: Buffer;
    /** address parseable with `format` */
    input: string;
    /**
     * Address formatted with `format`.
     *
     * Certain formats allow non-canonical representations
     * (for instance cashaddr allows uppercase and unprefixed addresses)
     * in these cases `input` and `output` can be different for the same format.
     */
    output: string;
};
//# sourceMappingURL=addressFormat.d.ts.map
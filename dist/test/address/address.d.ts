/// <reference types="node" />
import * as utxolib from '../../src';
import { ScriptType } from '../integration_local_rpc/generate/outputScripts.util';
export declare type AddressTestVector = [scriptType: ScriptType, outputScriptHex: string, address: string];
export declare function readFixture<T>(network: utxolib.Network, suffix: string, defaultValue: T): Promise<T>;
export declare function getOutputScripts(network: utxolib.Network): [ScriptType, Buffer][];
//# sourceMappingURL=address.d.ts.map
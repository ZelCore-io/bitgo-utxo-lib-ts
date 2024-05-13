import { Network } from '../../../src/networks';
export interface Node {
    stop(): Promise<void>;
}
export declare function getRegtestNode(network: Network): Promise<Node>;
export declare function getRegtestNodeHelp(network: Network): Promise<{
    stdout: string;
    stderr: string;
}>;
export declare function getRegtestNodeUrl(network: Network): string;
//# sourceMappingURL=regtestNode.d.ts.map
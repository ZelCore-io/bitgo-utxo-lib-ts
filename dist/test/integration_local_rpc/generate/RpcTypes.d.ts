export declare type RpcInput = {
    txid: string;
};
export declare type RpcOutput = {
    value: number;
    scriptPubKey: {
        hex: string;
    };
};
export declare type RpcTransaction = {
    txid: string;
    version: number;
    locktime: number;
    size: number;
    hex: string;
    vin: RpcInput[];
    vout: RpcOutput[];
};
//# sourceMappingURL=RpcTypes.d.ts.map
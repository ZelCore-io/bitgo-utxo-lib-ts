"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getTestVectorsBitcoinCashAddressTranslations = void 0;
const src_1 = require("../../../src");
const address_1 = require("../../../src/address");
function getTestVectorsBitcoinCashAddressTranslations(network, modify) {
    if (modify === undefined) {
        return [
            ...getTestVectorsBitcoinCashAddressTranslations(network, (v) => v),
            ...getTestVectorsBitcoinCashAddressTranslations(network, (v) => {
                // Unfortunately, the cashaddr format is not very well specified.
                // While the spec[0] states that every address must have a prefix, some sources say that it is
                // optional[1]. Our libraries will always create prefixed addresses.
                // 0: https://github.com/bitcoincashorg/bitcoincash.org/blob/master/spec/cashaddr.md
                // 1: https://www.bitcoinabc.org/cashaddr/
                v.input = v.input.split(':')[1];
                return v;
            }),
            ...getTestVectorsBitcoinCashAddressTranslations(network, (v) => {
                // https://github.com/bitcoincashorg/bitcoincash.org/blob/master/spec/cashaddr.md#uppercaselowercase
                // ``
                //   Lower case is preferred for cashaddr, but uppercase is accepted. A mixture of lower case and uppercase must be rejected.
                //    Allowing for uppercase ensures that the address can be encoded efficiently in QR codes using the alphanumeric mode[3].
                // ``
                v.input = v.input.toUpperCase();
                return v;
            }),
        ];
    }
    function fromBase58Ref(base58, input, network = src_1.networks.bitcoincash) {
        return {
            network,
            format: 'cashaddr',
            input,
            output: input,
            payload: (0, address_1.toOutputScript)(base58, network),
        };
    }
    function fromOutputScriptRef({ size, type }, payloadHex, input, network = src_1.networks.bitcoincash) {
        return {
            network,
            format: 'cashaddr',
            payload: Buffer.from(payloadHex, 'hex'),
            input,
            output: input,
        };
    }
    return [
        // https://github.com/bitcoincashorg/bitcoincash.org/blob/master/spec/cashaddr.md?plain=1#L142-L149
        fromBase58Ref('1BpEi6DfDAUFd7GtittLSdBeYJvcoaVggu', 'bitcoincash:qpm2qsznhks23z7629mms6s4cwef74vcwvy22gdx6a'),
        fromBase58Ref('1KXrWXciRDZUpQwQmuM1DbwsKDLYAYsVLR', 'bitcoincash:qr95sy3j9xwd2ap32xkykttr4cvcu7as4y0qverfuy'),
        fromBase58Ref('16w1D5WRVKJuZUsSRzdLp9w3YGcgoxDXb', 'bitcoincash:qqq3728yw0y47sqn6l2na30mcw6zm78dzqre909m2r'),
        fromBase58Ref('3CWFddi6m4ndiGyKqzYvsFYagqDLPVMTzC', 'bitcoincash:ppm2qsznhks23z7629mms6s4cwef74vcwvn0h829pq'),
        fromBase58Ref('3LDsS579y7sruadqu11beEJoTjdFiFCdX4', 'bitcoincash:pr95sy3j9xwd2ap32xkykttr4cvcu7as4yc93ky28e'),
        fromBase58Ref('31nwvkZwyPdgzjBJZXfDmSWsC4ZLKpYyUw', 'bitcoincash:pqq3728yw0y47sqn6l2na30mcw6zm78dzq5ucqzc37'),
        // https://github.com/bitcoincashorg/bitcoincash.org/blob/master/spec/cashaddr.md?plain=1#L158-L159
        fromOutputScriptRef({ size: 20, type: 0 }, 'F5BF48B397DAE70BE82B3CCA4793F8EB2B6CDAC9', 'bitcoincash:qr6m7j9njldwwzlg9v7v53unlr4jkmx6eylep8ekg2'),
        fromOutputScriptRef({ size: 20, type: 1 }, 'F5BF48B397DAE70BE82B3CCA4793F8EB2B6CDAC9', 'bchtest:pr6m7j9njldwwzlg9v7v53unlr4jkmx6eyvwc0uz5t', src_1.networks.bitcoincashTestnet),
    ]
        .filter((v) => v.network === network)
        .map(modify);
}
exports.getTestVectorsBitcoinCashAddressTranslations = getTestVectorsBitcoinCashAddressTranslations;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZml4dHVyZXMuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi90ZXN0L2FkZHJlc3MvYml0Y29pbmNhc2gvZml4dHVyZXMudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7O0FBQUEsc0NBQWlEO0FBQ2pELGtEQUFzRDtBQUd0RCxTQUFnQiw0Q0FBNEMsQ0FDMUQsT0FBZ0IsRUFDaEIsTUFBc0M7SUFFdEMsSUFBSSxNQUFNLEtBQUssU0FBUyxFQUFFO1FBQ3hCLE9BQU87WUFDTCxHQUFHLDRDQUE0QyxDQUFDLE9BQU8sRUFBRSxDQUFDLENBQUMsRUFBRSxFQUFFLENBQUMsQ0FBQyxDQUFDO1lBQ2xFLEdBQUcsNENBQTRDLENBQUMsT0FBTyxFQUFFLENBQUMsQ0FBQyxFQUFFLEVBQUU7Z0JBQzdELGlFQUFpRTtnQkFDakUsOEZBQThGO2dCQUM5RixvRUFBb0U7Z0JBQ3BFLG9GQUFvRjtnQkFDcEYsMENBQTBDO2dCQUMxQyxDQUFDLENBQUMsS0FBSyxHQUFHLENBQUMsQ0FBQyxLQUFLLENBQUMsS0FBSyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO2dCQUNoQyxPQUFPLENBQUMsQ0FBQztZQUNYLENBQUMsQ0FBQztZQUNGLEdBQUcsNENBQTRDLENBQUMsT0FBTyxFQUFFLENBQUMsQ0FBQyxFQUFFLEVBQUU7Z0JBQzdELG9HQUFvRztnQkFDcEcsS0FBSztnQkFDTCw2SEFBNkg7Z0JBQzdILDRIQUE0SDtnQkFDNUgsS0FBSztnQkFDTCxDQUFDLENBQUMsS0FBSyxHQUFHLENBQUMsQ0FBQyxLQUFLLENBQUMsV0FBVyxFQUFFLENBQUM7Z0JBQ2hDLE9BQU8sQ0FBQyxDQUFDO1lBQ1gsQ0FBQyxDQUFDO1NBQ0gsQ0FBQztLQUNIO0lBRUQsU0FBUyxhQUFhLENBQUMsTUFBYyxFQUFFLEtBQWEsRUFBRSxPQUFPLEdBQUcsY0FBUSxDQUFDLFdBQVc7UUFDbEYsT0FBTztZQUNMLE9BQU87WUFDUCxNQUFNLEVBQUUsVUFBVTtZQUNsQixLQUFLO1lBQ0wsTUFBTSxFQUFFLEtBQUs7WUFDYixPQUFPLEVBQUUsSUFBQSx3QkFBYyxFQUFDLE1BQU0sRUFBRSxPQUFPLENBQUM7U0FDekMsQ0FBQztJQUNKLENBQUM7SUFFRCxTQUFTLG1CQUFtQixDQUMxQixFQUFFLElBQUksRUFBRSxJQUFJLEVBQWtDLEVBQzlDLFVBQWtCLEVBQ2xCLEtBQWEsRUFDYixPQUFPLEdBQUcsY0FBUSxDQUFDLFdBQVc7UUFFOUIsT0FBTztZQUNMLE9BQU87WUFDUCxNQUFNLEVBQUUsVUFBVTtZQUNsQixPQUFPLEVBQUUsTUFBTSxDQUFDLElBQUksQ0FBQyxVQUFVLEVBQUUsS0FBSyxDQUFDO1lBQ3ZDLEtBQUs7WUFDTCxNQUFNLEVBQUUsS0FBSztTQUNkLENBQUM7SUFDSixDQUFDO0lBRUQsT0FBTztRQUNMLG1HQUFtRztRQUNuRyxhQUFhLENBQUMsb0NBQW9DLEVBQUUsd0RBQXdELENBQUM7UUFDN0csYUFBYSxDQUFDLG9DQUFvQyxFQUFFLHdEQUF3RCxDQUFDO1FBQzdHLGFBQWEsQ0FBQyxtQ0FBbUMsRUFBRSx3REFBd0QsQ0FBQztRQUM1RyxhQUFhLENBQUMsb0NBQW9DLEVBQUUsd0RBQXdELENBQUM7UUFDN0csYUFBYSxDQUFDLG9DQUFvQyxFQUFFLHdEQUF3RCxDQUFDO1FBQzdHLGFBQWEsQ0FBQyxvQ0FBb0MsRUFBRSx3REFBd0QsQ0FBQztRQUU3RyxtR0FBbUc7UUFDbkcsbUJBQW1CLENBQ2pCLEVBQUUsSUFBSSxFQUFFLEVBQUUsRUFBRSxJQUFJLEVBQUUsQ0FBQyxFQUFFLEVBQ3JCLDBDQUEwQyxFQUMxQyx3REFBd0QsQ0FDekQ7UUFDRCxtQkFBbUIsQ0FDakIsRUFBRSxJQUFJLEVBQUUsRUFBRSxFQUFFLElBQUksRUFBRSxDQUFDLEVBQUUsRUFDckIsMENBQTBDLEVBQzFDLG9EQUFvRCxFQUNwRCxjQUFRLENBQUMsa0JBQWtCLENBQzVCO0tBQ0Y7U0FDRSxNQUFNLENBQUMsQ0FBQyxDQUFDLEVBQUUsRUFBRSxDQUFDLENBQUMsQ0FBQyxPQUFPLEtBQUssT0FBTyxDQUFDO1NBQ3BDLEdBQUcsQ0FBQyxNQUFNLENBQUMsQ0FBQztBQUNqQixDQUFDO0FBN0VELG9HQTZFQyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7IE5ldHdvcmssIG5ldHdvcmtzIH0gZnJvbSAnLi4vLi4vLi4vc3JjJztcclxuaW1wb3J0IHsgdG9PdXRwdXRTY3JpcHQgfSBmcm9tICcuLi8uLi8uLi9zcmMvYWRkcmVzcyc7XHJcbmltcG9ydCB7IFRlc3RWZWN0b3IgfSBmcm9tICcuLi9hZGRyZXNzRm9ybWF0JztcclxuXHJcbmV4cG9ydCBmdW5jdGlvbiBnZXRUZXN0VmVjdG9yc0JpdGNvaW5DYXNoQWRkcmVzc1RyYW5zbGF0aW9ucyhcclxuICBuZXR3b3JrOiBOZXR3b3JrLFxyXG4gIG1vZGlmeT86ICh2OiBUZXN0VmVjdG9yKSA9PiBUZXN0VmVjdG9yXHJcbik6IFRlc3RWZWN0b3JbXSB7XHJcbiAgaWYgKG1vZGlmeSA9PT0gdW5kZWZpbmVkKSB7XHJcbiAgICByZXR1cm4gW1xyXG4gICAgICAuLi5nZXRUZXN0VmVjdG9yc0JpdGNvaW5DYXNoQWRkcmVzc1RyYW5zbGF0aW9ucyhuZXR3b3JrLCAodikgPT4gdiksXHJcbiAgICAgIC4uLmdldFRlc3RWZWN0b3JzQml0Y29pbkNhc2hBZGRyZXNzVHJhbnNsYXRpb25zKG5ldHdvcmssICh2KSA9PiB7XHJcbiAgICAgICAgLy8gVW5mb3J0dW5hdGVseSwgdGhlIGNhc2hhZGRyIGZvcm1hdCBpcyBub3QgdmVyeSB3ZWxsIHNwZWNpZmllZC5cclxuICAgICAgICAvLyBXaGlsZSB0aGUgc3BlY1swXSBzdGF0ZXMgdGhhdCBldmVyeSBhZGRyZXNzIG11c3QgaGF2ZSBhIHByZWZpeCwgc29tZSBzb3VyY2VzIHNheSB0aGF0IGl0IGlzXHJcbiAgICAgICAgLy8gb3B0aW9uYWxbMV0uIE91ciBsaWJyYXJpZXMgd2lsbCBhbHdheXMgY3JlYXRlIHByZWZpeGVkIGFkZHJlc3Nlcy5cclxuICAgICAgICAvLyAwOiBodHRwczovL2dpdGh1Yi5jb20vYml0Y29pbmNhc2hvcmcvYml0Y29pbmNhc2gub3JnL2Jsb2IvbWFzdGVyL3NwZWMvY2FzaGFkZHIubWRcclxuICAgICAgICAvLyAxOiBodHRwczovL3d3dy5iaXRjb2luYWJjLm9yZy9jYXNoYWRkci9cclxuICAgICAgICB2LmlucHV0ID0gdi5pbnB1dC5zcGxpdCgnOicpWzFdO1xyXG4gICAgICAgIHJldHVybiB2O1xyXG4gICAgICB9KSxcclxuICAgICAgLi4uZ2V0VGVzdFZlY3RvcnNCaXRjb2luQ2FzaEFkZHJlc3NUcmFuc2xhdGlvbnMobmV0d29yaywgKHYpID0+IHtcclxuICAgICAgICAvLyBodHRwczovL2dpdGh1Yi5jb20vYml0Y29pbmNhc2hvcmcvYml0Y29pbmNhc2gub3JnL2Jsb2IvbWFzdGVyL3NwZWMvY2FzaGFkZHIubWQjdXBwZXJjYXNlbG93ZXJjYXNlXHJcbiAgICAgICAgLy8gYGBcclxuICAgICAgICAvLyAgIExvd2VyIGNhc2UgaXMgcHJlZmVycmVkIGZvciBjYXNoYWRkciwgYnV0IHVwcGVyY2FzZSBpcyBhY2NlcHRlZC4gQSBtaXh0dXJlIG9mIGxvd2VyIGNhc2UgYW5kIHVwcGVyY2FzZSBtdXN0IGJlIHJlamVjdGVkLlxyXG4gICAgICAgIC8vICAgIEFsbG93aW5nIGZvciB1cHBlcmNhc2UgZW5zdXJlcyB0aGF0IHRoZSBhZGRyZXNzIGNhbiBiZSBlbmNvZGVkIGVmZmljaWVudGx5IGluIFFSIGNvZGVzIHVzaW5nIHRoZSBhbHBoYW51bWVyaWMgbW9kZVszXS5cclxuICAgICAgICAvLyBgYFxyXG4gICAgICAgIHYuaW5wdXQgPSB2LmlucHV0LnRvVXBwZXJDYXNlKCk7XHJcbiAgICAgICAgcmV0dXJuIHY7XHJcbiAgICAgIH0pLFxyXG4gICAgXTtcclxuICB9XHJcblxyXG4gIGZ1bmN0aW9uIGZyb21CYXNlNThSZWYoYmFzZTU4OiBzdHJpbmcsIGlucHV0OiBzdHJpbmcsIG5ldHdvcmsgPSBuZXR3b3Jrcy5iaXRjb2luY2FzaCk6IFRlc3RWZWN0b3Ige1xyXG4gICAgcmV0dXJuIHtcclxuICAgICAgbmV0d29yayxcclxuICAgICAgZm9ybWF0OiAnY2FzaGFkZHInLFxyXG4gICAgICBpbnB1dCxcclxuICAgICAgb3V0cHV0OiBpbnB1dCxcclxuICAgICAgcGF5bG9hZDogdG9PdXRwdXRTY3JpcHQoYmFzZTU4LCBuZXR3b3JrKSxcclxuICAgIH07XHJcbiAgfVxyXG5cclxuICBmdW5jdGlvbiBmcm9tT3V0cHV0U2NyaXB0UmVmKFxyXG4gICAgeyBzaXplLCB0eXBlIH06IHsgc2l6ZTogbnVtYmVyOyB0eXBlOiBudW1iZXIgfSxcclxuICAgIHBheWxvYWRIZXg6IHN0cmluZyxcclxuICAgIGlucHV0OiBzdHJpbmcsXHJcbiAgICBuZXR3b3JrID0gbmV0d29ya3MuYml0Y29pbmNhc2hcclxuICApOiBUZXN0VmVjdG9yIHtcclxuICAgIHJldHVybiB7XHJcbiAgICAgIG5ldHdvcmssXHJcbiAgICAgIGZvcm1hdDogJ2Nhc2hhZGRyJyxcclxuICAgICAgcGF5bG9hZDogQnVmZmVyLmZyb20ocGF5bG9hZEhleCwgJ2hleCcpLFxyXG4gICAgICBpbnB1dCxcclxuICAgICAgb3V0cHV0OiBpbnB1dCxcclxuICAgIH07XHJcbiAgfVxyXG5cclxuICByZXR1cm4gW1xyXG4gICAgLy8gaHR0cHM6Ly9naXRodWIuY29tL2JpdGNvaW5jYXNob3JnL2JpdGNvaW5jYXNoLm9yZy9ibG9iL21hc3Rlci9zcGVjL2Nhc2hhZGRyLm1kP3BsYWluPTEjTDE0Mi1MMTQ5XHJcbiAgICBmcm9tQmFzZTU4UmVmKCcxQnBFaTZEZkRBVUZkN0d0aXR0TFNkQmVZSnZjb2FWZ2d1JywgJ2JpdGNvaW5jYXNoOnFwbTJxc3puaGtzMjN6NzYyOW1tczZzNGN3ZWY3NHZjd3Z5MjJnZHg2YScpLFxyXG4gICAgZnJvbUJhc2U1OFJlZignMUtYcldYY2lSRFpVcFF3UW11TTFEYndzS0RMWUFZc1ZMUicsICdiaXRjb2luY2FzaDpxcjk1c3kzajl4d2QyYXAzMnhreWt0dHI0Y3ZjdTdhczR5MHF2ZXJmdXknKSxcclxuICAgIGZyb21CYXNlNThSZWYoJzE2dzFENVdSVktKdVpVc1NSemRMcDl3M1lHY2dveERYYicsICdiaXRjb2luY2FzaDpxcXEzNzI4eXcweTQ3c3FuNmwybmEzMG1jdzZ6bTc4ZHpxcmU5MDltMnInKSxcclxuICAgIGZyb21CYXNlNThSZWYoJzNDV0ZkZGk2bTRuZGlHeUtxell2c0ZZYWdxRExQVk1UekMnLCAnYml0Y29pbmNhc2g6cHBtMnFzem5oa3MyM3o3NjI5bW1zNnM0Y3dlZjc0dmN3dm4waDgyOXBxJyksXHJcbiAgICBmcm9tQmFzZTU4UmVmKCczTERzUzU3OXk3c3J1YWRxdTExYmVFSm9UamRGaUZDZFg0JywgJ2JpdGNvaW5jYXNoOnByOTVzeTNqOXh3ZDJhcDMyeGt5a3R0cjRjdmN1N2FzNHljOTNreTI4ZScpLFxyXG4gICAgZnJvbUJhc2U1OFJlZignMzFud3ZrWnd5UGRnempCSlpYZkRtU1dzQzRaTEtwWXlVdycsICdiaXRjb2luY2FzaDpwcXEzNzI4eXcweTQ3c3FuNmwybmEzMG1jdzZ6bTc4ZHpxNXVjcXpjMzcnKSxcclxuXHJcbiAgICAvLyBodHRwczovL2dpdGh1Yi5jb20vYml0Y29pbmNhc2hvcmcvYml0Y29pbmNhc2gub3JnL2Jsb2IvbWFzdGVyL3NwZWMvY2FzaGFkZHIubWQ/cGxhaW49MSNMMTU4LUwxNTlcclxuICAgIGZyb21PdXRwdXRTY3JpcHRSZWYoXHJcbiAgICAgIHsgc2l6ZTogMjAsIHR5cGU6IDAgfSxcclxuICAgICAgJ0Y1QkY0OEIzOTdEQUU3MEJFODJCM0NDQTQ3OTNGOEVCMkI2Q0RBQzknLFxyXG4gICAgICAnYml0Y29pbmNhc2g6cXI2bTdqOW5qbGR3d3psZzl2N3Y1M3VubHI0amtteDZleWxlcDhla2cyJ1xyXG4gICAgKSxcclxuICAgIGZyb21PdXRwdXRTY3JpcHRSZWYoXHJcbiAgICAgIHsgc2l6ZTogMjAsIHR5cGU6IDEgfSxcclxuICAgICAgJ0Y1QkY0OEIzOTdEQUU3MEJFODJCM0NDQTQ3OTNGOEVCMkI2Q0RBQzknLFxyXG4gICAgICAnYmNodGVzdDpwcjZtN2o5bmpsZHd3emxnOXY3djUzdW5scjRqa214NmV5dndjMHV6NXQnLFxyXG4gICAgICBuZXR3b3Jrcy5iaXRjb2luY2FzaFRlc3RuZXRcclxuICAgICksXHJcbiAgXVxyXG4gICAgLmZpbHRlcigodikgPT4gdi5uZXR3b3JrID09PSBuZXR3b3JrKVxyXG4gICAgLm1hcChtb2RpZnkpO1xyXG59XHJcbiJdfQ==
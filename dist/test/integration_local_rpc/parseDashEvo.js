"use strict";
/*

Despite the location of this file, the fixtures are in fact not created via `local_rpc` but a
modified dash unit test:

https://github.com/OttoAllmendinger/bitcoin/commit/0845a546e1bd97ac2037647f7398c6e20cfb7153

However the generated fixtures have the same format as the RPC responses so we will put the code here.

*/
Object.defineProperty(exports, "__esModule", { value: true });
exports.readDashEvoTransactions = void 0;
const fs = require("fs-extra");
const assert = require("assert");
const compare_1 = require("./compare");
const transaction_util_1 = require("../transaction_util");
const src_1 = require("../../src");
async function readDashEvoTransactions() {
    const rootDir = `test/integration_local_rpc/fixtures/dashTestExtra/`;
    const files = await fs.readdir(rootDir);
    return Promise.all(files.sort().map(async (filename) => JSON.parse(await fs.readFile(`${rootDir}/${filename}`, 'utf8'))));
}
exports.readDashEvoTransactions = readDashEvoTransactions;
describe('Dash', function () {
    const network = src_1.networks.dashTest;
    let txs;
    before('read fixtures', async function () {
        txs = await readDashEvoTransactions();
    });
    it(`parses Evolution (EVO) special transactions`, function () {
        assert.strictEqual(txs.length, 29);
        txs.forEach((transaction) => {
            const buf = Buffer.from(transaction.hex, 'hex');
            const tx = (0, transaction_util_1.parseTransactionRoundTrip)(buf, network);
            assert.deepStrictEqual((0, compare_1.normalizeParsedTransaction)(tx, network), (0, compare_1.normalizeRpcTransaction)(transaction, network));
        });
    });
    it(`Calculates correct sighash`, function () {
        const txsExtraPayload = txs
            .map((transaction) => (0, transaction_util_1.parseTransactionRoundTrip)(Buffer.from(transaction.hex, 'hex'), network))
            .filter((tx) => tx.extraPayload && tx.extraPayload.length > 0);
        const txsNormalizedHashes = txsExtraPayload.map((tx) => 
        // https://github.com/bitcoin/bitcoin/pull/3656/files
        tx.hashForSignature(0, Buffer.alloc(0), src_1.Transaction.SIGHASH_ALL).toString('hex'));
        assert.deepStrictEqual(txsNormalizedHashes, [
            '6af1aa2b82798cfba54961445132ddd612642f5fd32bfb3cafaa30eeff204d29',
            'dbe20a989766a4fed6438b109fa64191d0ccc6f560f1a8920ebbbc0254fa2e98',
            '66f9f8c5cc628e429006c462e711571f4b3246d89e8977b2fa11005769f44c00',
            '51a0f90eba51615374a27f91d21fd02232449e9ad7c0baa35099c5444a274fe9',
            'b7a411ad3541c7a9cda8c6185f2ab957d462a2fba063ccefded70b7d5b5c1ea9',
            'b1e5d0b87e7dcc6fa0c7896ab36a68b3f8211d669a9ce0eb8a32ec984d66aa95',
            '766668a5925a5858dbb263ddcc58d104e33bb6700189e38984dcc239d0a87878',
            '82464689bcfae77ba24f8453f2c3bb50fa25fb022eb02a3aea2b550e45810649',
            'fab147b2e788bb7ff8734a2c8cf7bebfdc7d324edf70896001cb5ea98918ecdd',
            '2e4f49ad4c867d5702e1ca10526d86cd73bf77322728b408d9fe2685063e8c51',
            '8b6c400dbae12d5e814b1871c3b794ae9cca23bfdc3f6ebe54cccbd7e5577579',
            '5cb8e125c9ad5cb2f4f2a494ebf3411711ac4331f3284c3c05d3696775c1398f',
            'b196f24d479d995b674e61b786505d89f4b0513f0bc4f981495efc5d17b5eb46',
            'f27f3ad3ace5a9682a3cca54af759e78295a94c75126f6062d086380f41a5fab',
            '6cc89ea666304705ba494992e81546fb7d4a4cc2d24d1b13c7091d18c3c32730',
            'a6d458a269c18a0f2a453f1f5ea5e033f217959d75dcd8aac9415e8586c81418',
            'df5463da5fd164444378232f8e050406fc42ea48c4db02170a2eef224100131b',
            'c092e8bb800616448efd56817f7cc1ccc8b1bcb4378fc3ab48951f4fc76a1ea2',
            '13376fc808ebf8ee5bdec5d61d02ea5b8961e0377891a22c3b170fcf2d16d6e2',
            '192f9db5d71817a04bb1a601a6368eda95fc16a6018da9366c89f37c9ab2de29',
            '4fa5ea402103dafc4c15beec91b69875df5687edc3c005af8a6064f55f71eefa',
            '9da4657761b7b8c476d5cebc9dfc4477604d7ed6972c5f34af27a6a3cdcab4f2',
            '62b23def8d6a172d345d6bea68f26eb56a9f41b679a98e46c019a51e15f5e0bb',
            'c5054c1af1ad9f0279c546d7b4125cc505c8b75392afba4fd0267dc9f39e51db',
            '2db5d36542d3bf6d98d5896d58f1723548090fe82247c9483ac32b4c78607e82',
            '5204293f35c482ab7ce592b6d65dab2aaeecd506ed70c942e8034dea3adde593',
        ]);
    });
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicGFyc2VEYXNoRXZvLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vdGVzdC9pbnRlZ3JhdGlvbl9sb2NhbF9ycGMvcGFyc2VEYXNoRXZvLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7QUFBQTs7Ozs7Ozs7O0VBU0U7OztBQUVGLCtCQUErQjtBQUMvQixpQ0FBaUM7QUFHakMsdUNBQWdGO0FBRWhGLDBEQUFnRTtBQUVoRSxtQ0FBa0Q7QUFHM0MsS0FBSyxVQUFVLHVCQUF1QjtJQUMzQyxNQUFNLE9BQU8sR0FBRyxvREFBb0QsQ0FBQztJQUNyRSxNQUFNLEtBQUssR0FBRyxNQUFNLEVBQUUsQ0FBQyxPQUFPLENBQUMsT0FBTyxDQUFDLENBQUM7SUFDeEMsT0FBTyxPQUFPLENBQUMsR0FBRyxDQUNoQixLQUFLLENBQUMsSUFBSSxFQUFFLENBQUMsR0FBRyxDQUFDLEtBQUssRUFBRSxRQUFRLEVBQUUsRUFBRSxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUMsTUFBTSxFQUFFLENBQUMsUUFBUSxDQUFDLEdBQUcsT0FBTyxJQUFJLFFBQVEsRUFBRSxFQUFFLE1BQU0sQ0FBQyxDQUFDLENBQUMsQ0FDdEcsQ0FBQztBQUNKLENBQUM7QUFORCwwREFNQztBQUVELFFBQVEsQ0FBQyxNQUFNLEVBQUU7SUFDZixNQUFNLE9BQU8sR0FBRyxjQUFRLENBQUMsUUFBUSxDQUFDO0lBQ2xDLElBQUksR0FBcUIsQ0FBQztJQUUxQixNQUFNLENBQUMsZUFBZSxFQUFFLEtBQUs7UUFDM0IsR0FBRyxHQUFHLE1BQU0sdUJBQXVCLEVBQUUsQ0FBQztJQUN4QyxDQUFDLENBQUMsQ0FBQztJQUVILEVBQUUsQ0FBQyw2Q0FBNkMsRUFBRTtRQUNoRCxNQUFNLENBQUMsV0FBVyxDQUFDLEdBQUcsQ0FBQyxNQUFNLEVBQUUsRUFBRSxDQUFDLENBQUM7UUFFbkMsR0FBRyxDQUFDLE9BQU8sQ0FBQyxDQUFDLFdBQVcsRUFBRSxFQUFFO1lBQzFCLE1BQU0sR0FBRyxHQUFHLE1BQU0sQ0FBQyxJQUFJLENBQUMsV0FBVyxDQUFDLEdBQUcsRUFBRSxLQUFLLENBQUMsQ0FBQztZQUNoRCxNQUFNLEVBQUUsR0FBRyxJQUFBLDRDQUF5QixFQUFDLEdBQUcsRUFBRSxPQUFPLENBQUMsQ0FBQztZQUNuRCxNQUFNLENBQUMsZUFBZSxDQUFDLElBQUEsb0NBQTBCLEVBQUMsRUFBRSxFQUFFLE9BQU8sQ0FBQyxFQUFFLElBQUEsaUNBQXVCLEVBQUMsV0FBVyxFQUFFLE9BQU8sQ0FBQyxDQUFDLENBQUM7UUFDakgsQ0FBQyxDQUFDLENBQUM7SUFDTCxDQUFDLENBQUMsQ0FBQztJQUVILEVBQUUsQ0FBQyw0QkFBNEIsRUFBRTtRQUMvQixNQUFNLGVBQWUsR0FBRyxHQUFHO2FBQ3hCLEdBQUcsQ0FBQyxDQUFDLFdBQVcsRUFBRSxFQUFFLENBQ25CLElBQUEsNENBQXlCLEVBQTBCLE1BQU0sQ0FBQyxJQUFJLENBQUMsV0FBVyxDQUFDLEdBQUcsRUFBRSxLQUFLLENBQUMsRUFBRSxPQUFPLENBQUMsQ0FDakc7YUFDQSxNQUFNLENBQUMsQ0FBQyxFQUFFLEVBQUUsRUFBRSxDQUFDLEVBQUUsQ0FBQyxZQUFZLElBQUksRUFBRSxDQUFDLFlBQVksQ0FBQyxNQUFNLEdBQUcsQ0FBQyxDQUFDLENBQUM7UUFDakUsTUFBTSxtQkFBbUIsR0FBRyxlQUFlLENBQUMsR0FBRyxDQUFDLENBQUMsRUFBRSxFQUFFLEVBQUU7UUFDckQscURBQXFEO1FBQ3JELEVBQUUsQ0FBQyxnQkFBZ0IsQ0FBQyxDQUFDLEVBQUUsTUFBTSxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUMsRUFBRSxpQkFBVyxDQUFDLFdBQVcsQ0FBQyxDQUFDLFFBQVEsQ0FBQyxLQUFLLENBQUMsQ0FDakYsQ0FBQztRQUNGLE1BQU0sQ0FBQyxlQUFlLENBQUMsbUJBQW1CLEVBQUU7WUFDMUMsa0VBQWtFO1lBQ2xFLGtFQUFrRTtZQUNsRSxrRUFBa0U7WUFDbEUsa0VBQWtFO1lBQ2xFLGtFQUFrRTtZQUNsRSxrRUFBa0U7WUFDbEUsa0VBQWtFO1lBQ2xFLGtFQUFrRTtZQUNsRSxrRUFBa0U7WUFDbEUsa0VBQWtFO1lBQ2xFLGtFQUFrRTtZQUNsRSxrRUFBa0U7WUFDbEUsa0VBQWtFO1lBQ2xFLGtFQUFrRTtZQUNsRSxrRUFBa0U7WUFDbEUsa0VBQWtFO1lBQ2xFLGtFQUFrRTtZQUNsRSxrRUFBa0U7WUFDbEUsa0VBQWtFO1lBQ2xFLGtFQUFrRTtZQUNsRSxrRUFBa0U7WUFDbEUsa0VBQWtFO1lBQ2xFLGtFQUFrRTtZQUNsRSxrRUFBa0U7WUFDbEUsa0VBQWtFO1lBQ2xFLGtFQUFrRTtTQUNuRSxDQUFDLENBQUM7SUFDTCxDQUFDLENBQUMsQ0FBQztBQUNMLENBQUMsQ0FBQyxDQUFDIiwic291cmNlc0NvbnRlbnQiOlsiLypcclxuXHJcbkRlc3BpdGUgdGhlIGxvY2F0aW9uIG9mIHRoaXMgZmlsZSwgdGhlIGZpeHR1cmVzIGFyZSBpbiBmYWN0IG5vdCBjcmVhdGVkIHZpYSBgbG9jYWxfcnBjYCBidXQgYVxyXG5tb2RpZmllZCBkYXNoIHVuaXQgdGVzdDpcclxuXHJcbmh0dHBzOi8vZ2l0aHViLmNvbS9PdHRvQWxsbWVuZGluZ2VyL2JpdGNvaW4vY29tbWl0LzA4NDVhNTQ2ZTFiZDk3YWMyMDM3NjQ3ZjczOThjNmUyMGNmYjcxNTNcclxuXHJcbkhvd2V2ZXIgdGhlIGdlbmVyYXRlZCBmaXh0dXJlcyBoYXZlIHRoZSBzYW1lIGZvcm1hdCBhcyB0aGUgUlBDIHJlc3BvbnNlcyBzbyB3ZSB3aWxsIHB1dCB0aGUgY29kZSBoZXJlLlxyXG5cclxuKi9cclxuXHJcbmltcG9ydCAqIGFzIGZzIGZyb20gJ2ZzLWV4dHJhJztcclxuaW1wb3J0ICogYXMgYXNzZXJ0IGZyb20gJ2Fzc2VydCc7XHJcblxyXG5pbXBvcnQgeyBScGNUcmFuc2FjdGlvbiB9IGZyb20gJy4vZ2VuZXJhdGUvUnBjVHlwZXMnO1xyXG5pbXBvcnQgeyBub3JtYWxpemVQYXJzZWRUcmFuc2FjdGlvbiwgbm9ybWFsaXplUnBjVHJhbnNhY3Rpb24gfSBmcm9tICcuL2NvbXBhcmUnO1xyXG5cclxuaW1wb3J0IHsgcGFyc2VUcmFuc2FjdGlvblJvdW5kVHJpcCB9IGZyb20gJy4uL3RyYW5zYWN0aW9uX3V0aWwnO1xyXG5cclxuaW1wb3J0IHsgbmV0d29ya3MsIFRyYW5zYWN0aW9uIH0gZnJvbSAnLi4vLi4vc3JjJztcclxuaW1wb3J0IHsgRGFzaFRyYW5zYWN0aW9uIH0gZnJvbSAnLi4vLi4vc3JjL2JpdGdvJztcclxuXHJcbmV4cG9ydCBhc3luYyBmdW5jdGlvbiByZWFkRGFzaEV2b1RyYW5zYWN0aW9ucygpOiBQcm9taXNlPFJwY1RyYW5zYWN0aW9uW10+IHtcclxuICBjb25zdCByb290RGlyID0gYHRlc3QvaW50ZWdyYXRpb25fbG9jYWxfcnBjL2ZpeHR1cmVzL2Rhc2hUZXN0RXh0cmEvYDtcclxuICBjb25zdCBmaWxlcyA9IGF3YWl0IGZzLnJlYWRkaXIocm9vdERpcik7XHJcbiAgcmV0dXJuIFByb21pc2UuYWxsKFxyXG4gICAgZmlsZXMuc29ydCgpLm1hcChhc3luYyAoZmlsZW5hbWUpID0+IEpTT04ucGFyc2UoYXdhaXQgZnMucmVhZEZpbGUoYCR7cm9vdERpcn0vJHtmaWxlbmFtZX1gLCAndXRmOCcpKSlcclxuICApO1xyXG59XHJcblxyXG5kZXNjcmliZSgnRGFzaCcsIGZ1bmN0aW9uICgpIHtcclxuICBjb25zdCBuZXR3b3JrID0gbmV0d29ya3MuZGFzaFRlc3Q7XHJcbiAgbGV0IHR4czogUnBjVHJhbnNhY3Rpb25bXTtcclxuXHJcbiAgYmVmb3JlKCdyZWFkIGZpeHR1cmVzJywgYXN5bmMgZnVuY3Rpb24gKCkge1xyXG4gICAgdHhzID0gYXdhaXQgcmVhZERhc2hFdm9UcmFuc2FjdGlvbnMoKTtcclxuICB9KTtcclxuXHJcbiAgaXQoYHBhcnNlcyBFdm9sdXRpb24gKEVWTykgc3BlY2lhbCB0cmFuc2FjdGlvbnNgLCBmdW5jdGlvbiAoKSB7XHJcbiAgICBhc3NlcnQuc3RyaWN0RXF1YWwodHhzLmxlbmd0aCwgMjkpO1xyXG5cclxuICAgIHR4cy5mb3JFYWNoKCh0cmFuc2FjdGlvbikgPT4ge1xyXG4gICAgICBjb25zdCBidWYgPSBCdWZmZXIuZnJvbSh0cmFuc2FjdGlvbi5oZXgsICdoZXgnKTtcclxuICAgICAgY29uc3QgdHggPSBwYXJzZVRyYW5zYWN0aW9uUm91bmRUcmlwKGJ1ZiwgbmV0d29yayk7XHJcbiAgICAgIGFzc2VydC5kZWVwU3RyaWN0RXF1YWwobm9ybWFsaXplUGFyc2VkVHJhbnNhY3Rpb24odHgsIG5ldHdvcmspLCBub3JtYWxpemVScGNUcmFuc2FjdGlvbih0cmFuc2FjdGlvbiwgbmV0d29yaykpO1xyXG4gICAgfSk7XHJcbiAgfSk7XHJcblxyXG4gIGl0KGBDYWxjdWxhdGVzIGNvcnJlY3Qgc2lnaGFzaGAsIGZ1bmN0aW9uICgpIHtcclxuICAgIGNvbnN0IHR4c0V4dHJhUGF5bG9hZCA9IHR4c1xyXG4gICAgICAubWFwKCh0cmFuc2FjdGlvbikgPT5cclxuICAgICAgICBwYXJzZVRyYW5zYWN0aW9uUm91bmRUcmlwPG51bWJlciwgRGFzaFRyYW5zYWN0aW9uPihCdWZmZXIuZnJvbSh0cmFuc2FjdGlvbi5oZXgsICdoZXgnKSwgbmV0d29yaylcclxuICAgICAgKVxyXG4gICAgICAuZmlsdGVyKCh0eCkgPT4gdHguZXh0cmFQYXlsb2FkICYmIHR4LmV4dHJhUGF5bG9hZC5sZW5ndGggPiAwKTtcclxuICAgIGNvbnN0IHR4c05vcm1hbGl6ZWRIYXNoZXMgPSB0eHNFeHRyYVBheWxvYWQubWFwKCh0eCkgPT5cclxuICAgICAgLy8gaHR0cHM6Ly9naXRodWIuY29tL2JpdGNvaW4vYml0Y29pbi9wdWxsLzM2NTYvZmlsZXNcclxuICAgICAgdHguaGFzaEZvclNpZ25hdHVyZSgwLCBCdWZmZXIuYWxsb2MoMCksIFRyYW5zYWN0aW9uLlNJR0hBU0hfQUxMKS50b1N0cmluZygnaGV4JylcclxuICAgICk7XHJcbiAgICBhc3NlcnQuZGVlcFN0cmljdEVxdWFsKHR4c05vcm1hbGl6ZWRIYXNoZXMsIFtcclxuICAgICAgJzZhZjFhYTJiODI3OThjZmJhNTQ5NjE0NDUxMzJkZGQ2MTI2NDJmNWZkMzJiZmIzY2FmYWEzMGVlZmYyMDRkMjknLFxyXG4gICAgICAnZGJlMjBhOTg5NzY2YTRmZWQ2NDM4YjEwOWZhNjQxOTFkMGNjYzZmNTYwZjFhODkyMGViYmJjMDI1NGZhMmU5OCcsXHJcbiAgICAgICc2NmY5ZjhjNWNjNjI4ZTQyOTAwNmM0NjJlNzExNTcxZjRiMzI0NmQ4OWU4OTc3YjJmYTExMDA1NzY5ZjQ0YzAwJyxcclxuICAgICAgJzUxYTBmOTBlYmE1MTYxNTM3NGEyN2Y5MWQyMWZkMDIyMzI0NDllOWFkN2MwYmFhMzUwOTljNTQ0NGEyNzRmZTknLFxyXG4gICAgICAnYjdhNDExYWQzNTQxYzdhOWNkYThjNjE4NWYyYWI5NTdkNDYyYTJmYmEwNjNjY2VmZGVkNzBiN2Q1YjVjMWVhOScsXHJcbiAgICAgICdiMWU1ZDBiODdlN2RjYzZmYTBjNzg5NmFiMzZhNjhiM2Y4MjExZDY2OWE5Y2UwZWI4YTMyZWM5ODRkNjZhYTk1JyxcclxuICAgICAgJzc2NjY2OGE1OTI1YTU4NThkYmIyNjNkZGNjNThkMTA0ZTMzYmI2NzAwMTg5ZTM4OTg0ZGNjMjM5ZDBhODc4NzgnLFxyXG4gICAgICAnODI0NjQ2ODliY2ZhZTc3YmEyNGY4NDUzZjJjM2JiNTBmYTI1ZmIwMjJlYjAyYTNhZWEyYjU1MGU0NTgxMDY0OScsXHJcbiAgICAgICdmYWIxNDdiMmU3ODhiYjdmZjg3MzRhMmM4Y2Y3YmViZmRjN2QzMjRlZGY3MDg5NjAwMWNiNWVhOTg5MThlY2RkJyxcclxuICAgICAgJzJlNGY0OWFkNGM4NjdkNTcwMmUxY2ExMDUyNmQ4NmNkNzNiZjc3MzIyNzI4YjQwOGQ5ZmUyNjg1MDYzZThjNTEnLFxyXG4gICAgICAnOGI2YzQwMGRiYWUxMmQ1ZTgxNGIxODcxYzNiNzk0YWU5Y2NhMjNiZmRjM2Y2ZWJlNTRjY2NiZDdlNTU3NzU3OScsXHJcbiAgICAgICc1Y2I4ZTEyNWM5YWQ1Y2IyZjRmMmE0OTRlYmYzNDExNzExYWM0MzMxZjMyODRjM2MwNWQzNjk2Nzc1YzEzOThmJyxcclxuICAgICAgJ2IxOTZmMjRkNDc5ZDk5NWI2NzRlNjFiNzg2NTA1ZDg5ZjRiMDUxM2YwYmM0Zjk4MTQ5NWVmYzVkMTdiNWViNDYnLFxyXG4gICAgICAnZjI3ZjNhZDNhY2U1YTk2ODJhM2NjYTU0YWY3NTllNzgyOTVhOTRjNzUxMjZmNjA2MmQwODYzODBmNDFhNWZhYicsXHJcbiAgICAgICc2Y2M4OWVhNjY2MzA0NzA1YmE0OTQ5OTJlODE1NDZmYjdkNGE0Y2MyZDI0ZDFiMTNjNzA5MWQxOGMzYzMyNzMwJyxcclxuICAgICAgJ2E2ZDQ1OGEyNjljMThhMGYyYTQ1M2YxZjVlYTVlMDMzZjIxNzk1OWQ3NWRjZDhhYWM5NDE1ZTg1ODZjODE0MTgnLFxyXG4gICAgICAnZGY1NDYzZGE1ZmQxNjQ0NDQzNzgyMzJmOGUwNTA0MDZmYzQyZWE0OGM0ZGIwMjE3MGEyZWVmMjI0MTAwMTMxYicsXHJcbiAgICAgICdjMDkyZThiYjgwMDYxNjQ0OGVmZDU2ODE3ZjdjYzFjY2M4YjFiY2I0Mzc4ZmMzYWI0ODk1MWY0ZmM3NmExZWEyJyxcclxuICAgICAgJzEzMzc2ZmM4MDhlYmY4ZWU1YmRlYzVkNjFkMDJlYTViODk2MWUwMzc3ODkxYTIyYzNiMTcwZmNmMmQxNmQ2ZTInLFxyXG4gICAgICAnMTkyZjlkYjVkNzE4MTdhMDRiYjFhNjAxYTYzNjhlZGE5NWZjMTZhNjAxOGRhOTM2NmM4OWYzN2M5YWIyZGUyOScsXHJcbiAgICAgICc0ZmE1ZWE0MDIxMDNkYWZjNGMxNWJlZWM5MWI2OTg3NWRmNTY4N2VkYzNjMDA1YWY4YTYwNjRmNTVmNzFlZWZhJyxcclxuICAgICAgJzlkYTQ2NTc3NjFiN2I4YzQ3NmQ1Y2ViYzlkZmM0NDc3NjA0ZDdlZDY5NzJjNWYzNGFmMjdhNmEzY2RjYWI0ZjInLFxyXG4gICAgICAnNjJiMjNkZWY4ZDZhMTcyZDM0NWQ2YmVhNjhmMjZlYjU2YTlmNDFiNjc5YTk4ZTQ2YzAxOWE1MWUxNWY1ZTBiYicsXHJcbiAgICAgICdjNTA1NGMxYWYxYWQ5ZjAyNzljNTQ2ZDdiNDEyNWNjNTA1YzhiNzUzOTJhZmJhNGZkMDI2N2RjOWYzOWU1MWRiJyxcclxuICAgICAgJzJkYjVkMzY1NDJkM2JmNmQ5OGQ1ODk2ZDU4ZjE3MjM1NDgwOTBmZTgyMjQ3Yzk0ODNhYzMyYjRjNzg2MDdlODInLFxyXG4gICAgICAnNTIwNDI5M2YzNWM0ODJhYjdjZTU5MmI2ZDY1ZGFiMmFhZWVjZDUwNmVkNzBjOTQyZTgwMzRkZWEzYWRkZTU5MycsXHJcbiAgICBdKTtcclxuICB9KTtcclxufSk7XHJcbiJdfQ==
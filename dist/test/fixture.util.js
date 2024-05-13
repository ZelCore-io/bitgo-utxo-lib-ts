"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.assertEqualJSON = exports.readFixture = void 0;
const assert = require("assert");
const mpath = require("path");
const fs = require("fs-extra");
function bufferAsHex(v) {
    if (v && v.type === 'Buffer') {
        return Buffer.from(v.data).toString('hex');
    }
    return v;
}
function toPrettyJSON(v) {
    return JSON.stringify(v, (k, v) => bufferAsHex(v), 2);
}
async function readFixture(path, defaultValue) {
    try {
        await fs.access(mpath.dirname(path));
    }
    catch (e) {
        await fs.mkdirp(mpath.dirname(path));
    }
    try {
        return JSON.parse(await fs.readFile(path, 'utf8'));
    }
    catch (e) {
        if (e.code === 'ENOENT') {
            await fs.writeFile(path, toPrettyJSON(defaultValue));
            throw new Error(`wrote defaults, please check contents and re-run tests`);
        }
        throw e;
    }
}
exports.readFixture = readFixture;
/**
 * @param a
 * @param b
 * @throws error iff `a` and `b` are different under JSON.parse(JSON.stringify(v))
 */
function assertEqualJSON(a, b) {
    assert.deepStrictEqual(JSON.parse(toPrettyJSON(a)), JSON.parse(toPrettyJSON(b)));
}
exports.assertEqualJSON = assertEqualJSON;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZml4dHVyZS51dGlsLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vdGVzdC9maXh0dXJlLnV0aWwudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7O0FBQUEsaUNBQWlDO0FBQ2pDLDhCQUE4QjtBQUM5QiwrQkFBK0I7QUFFL0IsU0FBUyxXQUFXLENBQUMsQ0FBVTtJQUk3QixJQUFJLENBQUMsSUFBSyxDQUFTLENBQUMsSUFBSSxLQUFLLFFBQVEsRUFBRTtRQUNyQyxPQUFPLE1BQU0sQ0FBQyxJQUFJLENBQUUsQ0FBUyxDQUFDLElBQUksQ0FBQyxDQUFDLFFBQVEsQ0FBQyxLQUFLLENBQUMsQ0FBQztLQUNyRDtJQUNELE9BQU8sQ0FBQyxDQUFDO0FBQ1gsQ0FBQztBQUVELFNBQVMsWUFBWSxDQUFDLENBQVU7SUFDOUIsT0FBTyxJQUFJLENBQUMsU0FBUyxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsRUFBRSxDQUFDLEVBQUUsRUFBRSxDQUFDLFdBQVcsQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQztBQUN4RCxDQUFDO0FBRU0sS0FBSyxVQUFVLFdBQVcsQ0FBSSxJQUFZLEVBQUUsWUFBZTtJQUNoRSxJQUFJO1FBQ0YsTUFBTSxFQUFFLENBQUMsTUFBTSxDQUFDLEtBQUssQ0FBQyxPQUFPLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQztLQUN0QztJQUFDLE9BQU8sQ0FBQyxFQUFFO1FBQ1YsTUFBTSxFQUFFLENBQUMsTUFBTSxDQUFDLEtBQUssQ0FBQyxPQUFPLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQztLQUN0QztJQUVELElBQUk7UUFDRixPQUFPLElBQUksQ0FBQyxLQUFLLENBQUMsTUFBTSxFQUFFLENBQUMsUUFBUSxDQUFDLElBQUksRUFBRSxNQUFNLENBQUMsQ0FBTSxDQUFDO0tBQ3pEO0lBQUMsT0FBTyxDQUFDLEVBQUU7UUFDVixJQUFJLENBQUMsQ0FBQyxJQUFJLEtBQUssUUFBUSxFQUFFO1lBQ3ZCLE1BQU0sRUFBRSxDQUFDLFNBQVMsQ0FBQyxJQUFJLEVBQUUsWUFBWSxDQUFDLFlBQVksQ0FBQyxDQUFDLENBQUM7WUFDckQsTUFBTSxJQUFJLEtBQUssQ0FBQyx3REFBd0QsQ0FBQyxDQUFDO1NBQzNFO1FBRUQsTUFBTSxDQUFDLENBQUM7S0FDVDtBQUNILENBQUM7QUFqQkQsa0NBaUJDO0FBRUQ7Ozs7R0FJRztBQUNILFNBQWdCLGVBQWUsQ0FBSSxDQUFJLEVBQUUsQ0FBSTtJQUMzQyxNQUFNLENBQUMsZUFBZSxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUMsWUFBWSxDQUFDLENBQUMsQ0FBQyxDQUFDLEVBQUUsSUFBSSxDQUFDLEtBQUssQ0FBQyxZQUFZLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO0FBQ25GLENBQUM7QUFGRCwwQ0FFQyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCAqIGFzIGFzc2VydCBmcm9tICdhc3NlcnQnO1xyXG5pbXBvcnQgKiBhcyBtcGF0aCBmcm9tICdwYXRoJztcclxuaW1wb3J0ICogYXMgZnMgZnJvbSAnZnMtZXh0cmEnO1xyXG5cclxuZnVuY3Rpb24gYnVmZmVyQXNIZXgodjogdW5rbm93bik6IHVua25vd24ge1xyXG4gIC8vIFlvdSB3b3VsZCB0aGluayB0aGF0IHlvdSBjb3VsZCB1c2UgYEJ1ZmZlci5pc0J1ZmZlcih2KWAgaGVyZSBidXQgeW91IHdvdWxkIGJlIG1pc3Rha2VuXHJcbiAgLy8gaHR0cHM6Ly9naXRodWIuY29tL25vZGVqcy9ub2RlLXYwLngtYXJjaGl2ZS9pc3N1ZXMvNTExMFxyXG4gIHR5cGUgQnVmID0geyB0eXBlOiBzdHJpbmc7IGRhdGE6IG51bWJlcltdIH07XHJcbiAgaWYgKHYgJiYgKHYgYXMgQnVmKS50eXBlID09PSAnQnVmZmVyJykge1xyXG4gICAgcmV0dXJuIEJ1ZmZlci5mcm9tKCh2IGFzIEJ1ZikuZGF0YSkudG9TdHJpbmcoJ2hleCcpO1xyXG4gIH1cclxuICByZXR1cm4gdjtcclxufVxyXG5cclxuZnVuY3Rpb24gdG9QcmV0dHlKU09OKHY6IHVua25vd24pOiBzdHJpbmcge1xyXG4gIHJldHVybiBKU09OLnN0cmluZ2lmeSh2LCAoaywgdikgPT4gYnVmZmVyQXNIZXgodiksIDIpO1xyXG59XHJcblxyXG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gcmVhZEZpeHR1cmU8VD4ocGF0aDogc3RyaW5nLCBkZWZhdWx0VmFsdWU6IFQpOiBQcm9taXNlPFQ+IHtcclxuICB0cnkge1xyXG4gICAgYXdhaXQgZnMuYWNjZXNzKG1wYXRoLmRpcm5hbWUocGF0aCkpO1xyXG4gIH0gY2F0Y2ggKGUpIHtcclxuICAgIGF3YWl0IGZzLm1rZGlycChtcGF0aC5kaXJuYW1lKHBhdGgpKTtcclxuICB9XHJcblxyXG4gIHRyeSB7XHJcbiAgICByZXR1cm4gSlNPTi5wYXJzZShhd2FpdCBmcy5yZWFkRmlsZShwYXRoLCAndXRmOCcpKSBhcyBUO1xyXG4gIH0gY2F0Y2ggKGUpIHtcclxuICAgIGlmIChlLmNvZGUgPT09ICdFTk9FTlQnKSB7XHJcbiAgICAgIGF3YWl0IGZzLndyaXRlRmlsZShwYXRoLCB0b1ByZXR0eUpTT04oZGVmYXVsdFZhbHVlKSk7XHJcbiAgICAgIHRocm93IG5ldyBFcnJvcihgd3JvdGUgZGVmYXVsdHMsIHBsZWFzZSBjaGVjayBjb250ZW50cyBhbmQgcmUtcnVuIHRlc3RzYCk7XHJcbiAgICB9XHJcblxyXG4gICAgdGhyb3cgZTtcclxuICB9XHJcbn1cclxuXHJcbi8qKlxyXG4gKiBAcGFyYW0gYVxyXG4gKiBAcGFyYW0gYlxyXG4gKiBAdGhyb3dzIGVycm9yIGlmZiBgYWAgYW5kIGBiYCBhcmUgZGlmZmVyZW50IHVuZGVyIEpTT04ucGFyc2UoSlNPTi5zdHJpbmdpZnkodikpXHJcbiAqL1xyXG5leHBvcnQgZnVuY3Rpb24gYXNzZXJ0RXF1YWxKU09OPFQ+KGE6IFQsIGI6IFQpOiB2b2lkIHtcclxuICBhc3NlcnQuZGVlcFN0cmljdEVxdWFsKEpTT04ucGFyc2UodG9QcmV0dHlKU09OKGEpKSwgSlNPTi5wYXJzZSh0b1ByZXR0eUpTT04oYikpKTtcclxufVxyXG4iXX0=
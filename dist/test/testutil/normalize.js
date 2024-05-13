"use strict";
/*
 Some normalization helpers for use in `assert.deepStrictEqual
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.normDefault = void 0;
function normBufferToHex(v) {
    if (Buffer.isBuffer(v)) {
        return v.toString('hex');
    }
    if (typeof v === 'object' && v !== null) {
        if (Array.isArray(v)) {
            return v.map((e) => normBufferToHex(e));
        }
        return Object.fromEntries(Object.entries(v).map(([k, v]) => [k, normBufferToHex(v)]));
    }
    return v;
}
function normOmitUndefined(v) {
    if (typeof v === 'object' && v !== null) {
        if (Array.isArray(v)) {
            return v.map((e) => normOmitUndefined(e));
        }
        return Object.fromEntries(Object.entries(v).flatMap(([k, v]) => (v === undefined ? [] : [[k, normOmitUndefined(v)]])));
    }
    return v;
}
/**
 * @param v
 */
function normDefault(v) {
    return normOmitUndefined(normBufferToHex(v));
}
exports.normDefault = normDefault;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibm9ybWFsaXplLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vdGVzdC90ZXN0dXRpbC9ub3JtYWxpemUudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IjtBQUFBOztHQUVHOzs7QUFFSCxTQUFTLGVBQWUsQ0FBQyxDQUFtQjtJQUMxQyxJQUFJLE1BQU0sQ0FBQyxRQUFRLENBQUMsQ0FBQyxDQUFDLEVBQUU7UUFDdEIsT0FBTyxDQUFDLENBQUMsUUFBUSxDQUFDLEtBQUssQ0FBQyxDQUFDO0tBQzFCO0lBRUQsSUFBSSxPQUFPLENBQUMsS0FBSyxRQUFRLElBQUksQ0FBQyxLQUFLLElBQUksRUFBRTtRQUN2QyxJQUFJLEtBQUssQ0FBQyxPQUFPLENBQUMsQ0FBQyxDQUFDLEVBQUU7WUFDcEIsT0FBTyxDQUFDLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxFQUFFLEVBQUUsQ0FBQyxlQUFlLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztTQUN6QztRQUVELE9BQU8sTUFBTSxDQUFDLFdBQVcsQ0FBQyxNQUFNLENBQUMsT0FBTyxDQUFDLENBQUMsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxFQUFFLEVBQUUsQ0FBQyxDQUFDLENBQUMsRUFBRSxlQUFlLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7S0FDdkY7SUFFRCxPQUFPLENBQUMsQ0FBQztBQUNYLENBQUM7QUFFRCxTQUFTLGlCQUFpQixDQUFDLENBQVU7SUFDbkMsSUFBSSxPQUFPLENBQUMsS0FBSyxRQUFRLElBQUksQ0FBQyxLQUFLLElBQUksRUFBRTtRQUN2QyxJQUFJLEtBQUssQ0FBQyxPQUFPLENBQUMsQ0FBQyxDQUFDLEVBQUU7WUFDcEIsT0FBTyxDQUFDLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxFQUFFLEVBQUUsQ0FBQyxpQkFBaUIsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO1NBQzNDO1FBRUQsT0FBTyxNQUFNLENBQUMsV0FBVyxDQUN2QixNQUFNLENBQUMsT0FBTyxDQUFDLENBQUMsQ0FBQyxDQUFDLE9BQU8sQ0FBQyxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxFQUFFLEVBQUUsQ0FBQyxDQUFDLENBQUMsS0FBSyxTQUFTLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsRUFBRSxpQkFBaUIsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUM1RixDQUFDO0tBQ0g7SUFFRCxPQUFPLENBQUMsQ0FBQztBQUNYLENBQUM7QUFFRDs7R0FFRztBQUNILFNBQWdCLFdBQVcsQ0FBQyxDQUFVO0lBQ3BDLE9BQU8saUJBQWlCLENBQUMsZUFBZSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7QUFDL0MsQ0FBQztBQUZELGtDQUVDIiwic291cmNlc0NvbnRlbnQiOlsiLypcclxuIFNvbWUgbm9ybWFsaXphdGlvbiBoZWxwZXJzIGZvciB1c2UgaW4gYGFzc2VydC5kZWVwU3RyaWN0RXF1YWxcclxuICovXHJcblxyXG5mdW5jdGlvbiBub3JtQnVmZmVyVG9IZXgodjogQnVmZmVyIHwgdW5rbm93bikge1xyXG4gIGlmIChCdWZmZXIuaXNCdWZmZXIodikpIHtcclxuICAgIHJldHVybiB2LnRvU3RyaW5nKCdoZXgnKTtcclxuICB9XHJcblxyXG4gIGlmICh0eXBlb2YgdiA9PT0gJ29iamVjdCcgJiYgdiAhPT0gbnVsbCkge1xyXG4gICAgaWYgKEFycmF5LmlzQXJyYXkodikpIHtcclxuICAgICAgcmV0dXJuIHYubWFwKChlKSA9PiBub3JtQnVmZmVyVG9IZXgoZSkpO1xyXG4gICAgfVxyXG5cclxuICAgIHJldHVybiBPYmplY3QuZnJvbUVudHJpZXMoT2JqZWN0LmVudHJpZXModikubWFwKChbaywgdl0pID0+IFtrLCBub3JtQnVmZmVyVG9IZXgodildKSk7XHJcbiAgfVxyXG5cclxuICByZXR1cm4gdjtcclxufVxyXG5cclxuZnVuY3Rpb24gbm9ybU9taXRVbmRlZmluZWQodjogdW5rbm93bikge1xyXG4gIGlmICh0eXBlb2YgdiA9PT0gJ29iamVjdCcgJiYgdiAhPT0gbnVsbCkge1xyXG4gICAgaWYgKEFycmF5LmlzQXJyYXkodikpIHtcclxuICAgICAgcmV0dXJuIHYubWFwKChlKSA9PiBub3JtT21pdFVuZGVmaW5lZChlKSk7XHJcbiAgICB9XHJcblxyXG4gICAgcmV0dXJuIE9iamVjdC5mcm9tRW50cmllcyhcclxuICAgICAgT2JqZWN0LmVudHJpZXModikuZmxhdE1hcCgoW2ssIHZdKSA9PiAodiA9PT0gdW5kZWZpbmVkID8gW10gOiBbW2ssIG5vcm1PbWl0VW5kZWZpbmVkKHYpXV0pKVxyXG4gICAgKTtcclxuICB9XHJcblxyXG4gIHJldHVybiB2O1xyXG59XHJcblxyXG4vKipcclxuICogQHBhcmFtIHZcclxuICovXHJcbmV4cG9ydCBmdW5jdGlvbiBub3JtRGVmYXVsdCh2OiB1bmtub3duKTogdW5rbm93biB7XHJcbiAgcmV0dXJuIG5vcm1PbWl0VW5kZWZpbmVkKG5vcm1CdWZmZXJUb0hleCh2KSk7XHJcbn1cclxuIl19
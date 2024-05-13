"use strict";
// key path spend - {signature}
// script path spend - [...stack elements] {tapscript} {control block}
// https://github.com/bitcoin/bips/blob/master/bip-0341.mediawiki
Object.defineProperty(exports, "__esModule", { value: true });
exports.check = void 0;
const __1 = require("../../");
function check(chunks) {
    try {
        // check whether parsing the witness as a taproot witness fails
        // this indicates whether `chunks` is a valid taproot input
        __1.taproot.parseTaprootWitness(chunks);
        return true;
    }
    catch {
        return false;
    }
}
exports.check = check;
check.toJSON = () => {
    return 'taproot input';
};
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5wdXQuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi9zcmMvdGVtcGxhdGVzL3RhcHJvb3QvaW5wdXQudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IjtBQUFBLCtCQUErQjtBQUMvQixzRUFBc0U7QUFDdEUsaUVBQWlFOzs7QUFFakUsOEJBQWlDO0FBRWpDLFNBQWdCLEtBQUssQ0FBQyxNQUFnQjtJQUNwQyxJQUFJO1FBQ0YsK0RBQStEO1FBQy9ELDJEQUEyRDtRQUMzRCxXQUFPLENBQUMsbUJBQW1CLENBQUMsTUFBTSxDQUFDLENBQUM7UUFDcEMsT0FBTyxJQUFJLENBQUM7S0FDYjtJQUFDLE1BQU07UUFDTixPQUFPLEtBQUssQ0FBQztLQUNkO0FBQ0gsQ0FBQztBQVRELHNCQVNDO0FBQ0QsS0FBSyxDQUFDLE1BQU0sR0FBRyxHQUFXLEVBQUU7SUFDMUIsT0FBTyxlQUFlLENBQUM7QUFDekIsQ0FBQyxDQUFDIiwic291cmNlc0NvbnRlbnQiOlsiLy8ga2V5IHBhdGggc3BlbmQgLSB7c2lnbmF0dXJlfVxyXG4vLyBzY3JpcHQgcGF0aCBzcGVuZCAtIFsuLi5zdGFjayBlbGVtZW50c10ge3RhcHNjcmlwdH0ge2NvbnRyb2wgYmxvY2t9XHJcbi8vIGh0dHBzOi8vZ2l0aHViLmNvbS9iaXRjb2luL2JpcHMvYmxvYi9tYXN0ZXIvYmlwLTAzNDEubWVkaWF3aWtpXHJcblxyXG5pbXBvcnQgeyB0YXByb290IH0gZnJvbSAnLi4vLi4vJztcclxuXHJcbmV4cG9ydCBmdW5jdGlvbiBjaGVjayhjaHVua3M6IEJ1ZmZlcltdKTogYm9vbGVhbiB7XHJcbiAgdHJ5IHtcclxuICAgIC8vIGNoZWNrIHdoZXRoZXIgcGFyc2luZyB0aGUgd2l0bmVzcyBhcyBhIHRhcHJvb3Qgd2l0bmVzcyBmYWlsc1xyXG4gICAgLy8gdGhpcyBpbmRpY2F0ZXMgd2hldGhlciBgY2h1bmtzYCBpcyBhIHZhbGlkIHRhcHJvb3QgaW5wdXRcclxuICAgIHRhcHJvb3QucGFyc2VUYXByb290V2l0bmVzcyhjaHVua3MpO1xyXG4gICAgcmV0dXJuIHRydWU7XHJcbiAgfSBjYXRjaCB7XHJcbiAgICByZXR1cm4gZmFsc2U7XHJcbiAgfVxyXG59XHJcbmNoZWNrLnRvSlNPTiA9ICgpOiBzdHJpbmcgPT4ge1xyXG4gIHJldHVybiAndGFwcm9vdCBpbnB1dCc7XHJcbn07XHJcbiJdfQ==
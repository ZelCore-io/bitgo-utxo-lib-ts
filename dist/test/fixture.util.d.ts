export declare function readFixture<T>(path: string, defaultValue: T): Promise<T>;
/**
 * @param a
 * @param b
 * @throws error iff `a` and `b` are different under JSON.parse(JSON.stringify(v))
 */
export declare function assertEqualJSON<T>(a: T, b: T): void;
//# sourceMappingURL=fixture.util.d.ts.map
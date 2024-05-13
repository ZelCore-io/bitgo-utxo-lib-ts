"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RootWalletKeys = exports.DerivedWalletKeys = exports.WalletKeys = exports.eqPublicKey = void 0;
function eqPublicKey(a, b) {
    return a.publicKey.equals(b.publicKey);
}
exports.eqPublicKey = eqPublicKey;
/**
 * Base class for RootWalletKeys and DerivedWalletKeys.
 * Keys can be either public keys or private keys.
 */
class WalletKeys {
    /**
     * @param triple - bip32 key triple
     */
    constructor(triple) {
        this.triple = triple;
        triple.forEach((a, i) => {
            triple.forEach((b, j) => {
                if (eqPublicKey(a, b) && i !== j) {
                    throw new Error(`wallet keys must be distinct`);
                }
            });
        });
        this.publicKeys = this.triple.map((k) => k.publicKey);
    }
    get user() {
        return this.triple[0];
    }
    get backup() {
        return this.triple[1];
    }
    get bitgo() {
        return this.triple[2];
    }
}
exports.WalletKeys = WalletKeys;
/**
 * Set of WalletKeys derived from RootWalletKeys. Suitable for signing transaction inputs.
 * Contains reference to the RootWalletKeys this was derived from as well as the paths used
 * for derivation.
 */
class DerivedWalletKeys extends WalletKeys {
    /**
     * @param parent - wallet keys to derive from
     * @param paths - paths to derive with
     */
    constructor(parent, paths) {
        super(parent.triple.map((k, i) => k.derivePath(paths[i])));
        this.parent = parent;
        this.paths = paths;
    }
}
exports.DerivedWalletKeys = DerivedWalletKeys;
/**
 * Set of root wallet keys, typically instantiated using the wallet xpub triple.
 */
class RootWalletKeys extends WalletKeys {
    /**
     * @param triple - bip32 key triple
     * @param derivationPrefixes - Certain v1 wallets or their migrated v2 counterparts
     *                             can have a nonstandard prefix.
     */
    constructor(triple, derivationPrefixes = [
        RootWalletKeys.defaultPrefix,
        RootWalletKeys.defaultPrefix,
        RootWalletKeys.defaultPrefix,
    ]) {
        super(triple);
        this.derivationPrefixes = derivationPrefixes;
        derivationPrefixes.forEach((p) => {
            if (p.startsWith('/') || p.endsWith('/')) {
                throw new Error(`derivation prefix must not start or end with a slash`);
            }
        });
    }
    /**
     * @param key
     * @param chain
     * @param index
     * @return full derivation path for key, including key-specific prefix
     */
    getDerivationPath(key, chain, index) {
        if (!this.derivationPrefixes) {
            throw new Error(`no derivation prefixes`);
        }
        const prefix = this.derivationPrefixes.find((prefix, i) => eqPublicKey(key, this.triple[i]));
        if (prefix === undefined) {
            throw new Error(`key not in walletKeys`);
        }
        return `${prefix}/${chain}/${index}`;
    }
    /**
     * @param chain
     * @param index
     * @return walletKeys for a particular address identified by (chain, index)
     */
    deriveForChainAndIndex(chain, index) {
        return new DerivedWalletKeys(this, this.triple.map((k) => this.getDerivationPath(k, chain, index)));
    }
}
exports.RootWalletKeys = RootWalletKeys;
RootWalletKeys.defaultPrefix = '0/0';
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiV2FsbGV0S2V5cy5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uL3NyYy9iaXRnby93YWxsZXQvV2FsbGV0S2V5cy50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7QUFpQkEsU0FBZ0IsV0FBVyxDQUFDLENBQWlCLEVBQUUsQ0FBaUI7SUFDOUQsT0FBTyxDQUFDLENBQUMsU0FBUyxDQUFDLE1BQU0sQ0FBQyxDQUFDLENBQUMsU0FBUyxDQUFDLENBQUM7QUFDekMsQ0FBQztBQUZELGtDQUVDO0FBRUQ7OztHQUdHO0FBQ0gsTUFBYSxVQUFVO0lBR3JCOztPQUVHO0lBQ0gsWUFBNEIsTUFBOEI7UUFBOUIsV0FBTSxHQUFOLE1BQU0sQ0FBd0I7UUFDeEQsTUFBTSxDQUFDLE9BQU8sQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLEVBQUUsRUFBRTtZQUN0QixNQUFNLENBQUMsT0FBTyxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsRUFBRSxFQUFFO2dCQUN0QixJQUFJLFdBQVcsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUMsRUFBRTtvQkFDaEMsTUFBTSxJQUFJLEtBQUssQ0FBQyw4QkFBOEIsQ0FBQyxDQUFDO2lCQUNqRDtZQUNILENBQUMsQ0FBQyxDQUFDO1FBQ0wsQ0FBQyxDQUFDLENBQUM7UUFFSCxJQUFJLENBQUMsVUFBVSxHQUFHLElBQUksQ0FBQyxNQUFNLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxFQUFFLEVBQUUsQ0FBQyxDQUFDLENBQUMsU0FBUyxDQUFtQixDQUFDO0lBQzFFLENBQUM7SUFFRCxJQUFJLElBQUk7UUFDTixPQUFPLElBQUksQ0FBQyxNQUFNLENBQUMsQ0FBQyxDQUFDLENBQUM7SUFDeEIsQ0FBQztJQUVELElBQUksTUFBTTtRQUNSLE9BQU8sSUFBSSxDQUFDLE1BQU0sQ0FBQyxDQUFDLENBQUMsQ0FBQztJQUN4QixDQUFDO0lBRUQsSUFBSSxLQUFLO1FBQ1AsT0FBTyxJQUFJLENBQUMsTUFBTSxDQUFDLENBQUMsQ0FBQyxDQUFDO0lBQ3hCLENBQUM7Q0FDRjtBQTdCRCxnQ0E2QkM7QUFFRDs7OztHQUlHO0FBQ0gsTUFBYSxpQkFBa0IsU0FBUSxVQUFVO0lBQy9DOzs7T0FHRztJQUNILFlBQW1CLE1BQXNCLEVBQVMsS0FBcUI7UUFDckUsS0FBSyxDQUFDLE1BQU0sQ0FBQyxNQUFNLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsRUFBRSxFQUFFLENBQUMsQ0FBQyxDQUFDLFVBQVUsQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBMkIsQ0FBQyxDQUFDO1FBRHBFLFdBQU0sR0FBTixNQUFNLENBQWdCO1FBQVMsVUFBSyxHQUFMLEtBQUssQ0FBZ0I7SUFFdkUsQ0FBQztDQUNGO0FBUkQsOENBUUM7QUFFRDs7R0FFRztBQUNILE1BQWEsY0FBZSxTQUFRLFVBQVU7SUFHNUM7Ozs7T0FJRztJQUNILFlBQ0UsTUFBOEIsRUFDZCxxQkFBcUM7UUFDbkQsY0FBYyxDQUFDLGFBQWE7UUFDNUIsY0FBYyxDQUFDLGFBQWE7UUFDNUIsY0FBYyxDQUFDLGFBQWE7S0FDN0I7UUFFRCxLQUFLLENBQUMsTUFBTSxDQUFDLENBQUM7UUFORSx1QkFBa0IsR0FBbEIsa0JBQWtCLENBSWpDO1FBSUQsa0JBQWtCLENBQUMsT0FBTyxDQUFDLENBQUMsQ0FBQyxFQUFFLEVBQUU7WUFDL0IsSUFBSSxDQUFDLENBQUMsVUFBVSxDQUFDLEdBQUcsQ0FBQyxJQUFJLENBQUMsQ0FBQyxRQUFRLENBQUMsR0FBRyxDQUFDLEVBQUU7Z0JBQ3hDLE1BQU0sSUFBSSxLQUFLLENBQUMsc0RBQXNELENBQUMsQ0FBQzthQUN6RTtRQUNILENBQUMsQ0FBQyxDQUFDO0lBQ0wsQ0FBQztJQUVEOzs7OztPQUtHO0lBQ0gsaUJBQWlCLENBQUMsR0FBbUIsRUFBRSxLQUFhLEVBQUUsS0FBYTtRQUNqRSxJQUFJLENBQUMsSUFBSSxDQUFDLGtCQUFrQixFQUFFO1lBQzVCLE1BQU0sSUFBSSxLQUFLLENBQUMsd0JBQXdCLENBQUMsQ0FBQztTQUMzQztRQUNELE1BQU0sTUFBTSxHQUFHLElBQUksQ0FBQyxrQkFBa0IsQ0FBQyxJQUFJLENBQUMsQ0FBQyxNQUFNLEVBQUUsQ0FBQyxFQUFFLEVBQUUsQ0FBQyxXQUFXLENBQUMsR0FBRyxFQUFFLElBQUksQ0FBQyxNQUFNLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO1FBQzdGLElBQUksTUFBTSxLQUFLLFNBQVMsRUFBRTtZQUN4QixNQUFNLElBQUksS0FBSyxDQUFDLHVCQUF1QixDQUFDLENBQUM7U0FDMUM7UUFDRCxPQUFPLEdBQUcsTUFBTSxJQUFJLEtBQUssSUFBSSxLQUFLLEVBQUUsQ0FBQztJQUN2QyxDQUFDO0lBRUQ7Ozs7T0FJRztJQUNILHNCQUFzQixDQUFDLEtBQWEsRUFBRSxLQUFhO1FBQ2pELE9BQU8sSUFBSSxpQkFBaUIsQ0FDMUIsSUFBSSxFQUNKLElBQUksQ0FBQyxNQUFNLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxFQUFFLEVBQUUsQ0FBQyxJQUFJLENBQUMsaUJBQWlCLENBQUMsQ0FBQyxFQUFFLEtBQUssRUFBRSxLQUFLLENBQUMsQ0FBbUIsQ0FDbEYsQ0FBQztJQUNKLENBQUM7O0FBcERILHdDQXFEQztBQXBEaUIsNEJBQWEsR0FBRyxLQUFLLENBQUMiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcclxuICogQ2xhc3NlcyBmb3IgZGVyaXZpbmcga2V5IHRyaXBsZXMgZm9yIHdhbGxldCBhZGRyZXNzZXMuXHJcbiAqXHJcbiAqIEJ5IGRlZmF1bHQsIEJpdEdvIHdhbGxldHMgY29uc2lzdCBvZiBhIHRyaXBsZSBvZiBiaXAzMiBleHRlbmQga2V5cGFpcnMuXHJcbiAqIEV2ZXJ5IHdhbGxldCBhZGRyZXNzIGNhbiBiZSBpZGVudGlmaWVkIGJ5IF8oY2hhaW46IG51bWJlciwgaW5kZXg6IG51bWJlcilfLlxyXG4gKiBUaGUga2V5IHNldCBmb3IgYSBwYXJ0aWN1bGFyIGFkZHJlc3MgY2FuIGJlIG9idGFpbmVkIGJ5IGRlcml2aW5nIHdpdGggdGhlIHBhdGhcclxuICogYDAvMC8ke2NoYWlufS8ke2luZGV4fWAuIChJbiByYXJlIGNhc2VzIHRoZSBwcmVmaXggMC8wIGNhbiBiZSBkaWZmZXJlbnQpXHJcbiAqXHJcbiAqIFNpbmNlIHdlIG5ldmVyIHVzZSBvdGhlciBkZXJpdmF0aW9ucyBmb3IgdXR4byBhZGRyZXNzIHNjcmlwdHMsIHRoZSBjbGFzc2VzIGRlZmluZWQgaGVyZSBvbmx5XHJcbiAqIGFsbG93IGV4YWN0bHkgb25lIGxldmVsIG9mIGRlcml2YXRpb24uXHJcbiAqL1xyXG5pbXBvcnQgeyBCSVAzMkludGVyZmFjZSB9IGZyb20gJ2JpcDMyJztcclxuXHJcbmltcG9ydCB7IFRyaXBsZSB9IGZyb20gJy4uL3R5cGVzJztcclxuXHJcbmV4cG9ydCB0eXBlIEtleU5hbWUgPSAndXNlcicgfCAnYmFja3VwJyB8ICdiaXRnbyc7XHJcblxyXG5leHBvcnQgZnVuY3Rpb24gZXFQdWJsaWNLZXkoYTogQklQMzJJbnRlcmZhY2UsIGI6IEJJUDMySW50ZXJmYWNlKTogYm9vbGVhbiB7XHJcbiAgcmV0dXJuIGEucHVibGljS2V5LmVxdWFscyhiLnB1YmxpY0tleSk7XHJcbn1cclxuXHJcbi8qKlxyXG4gKiBCYXNlIGNsYXNzIGZvciBSb290V2FsbGV0S2V5cyBhbmQgRGVyaXZlZFdhbGxldEtleXMuXHJcbiAqIEtleXMgY2FuIGJlIGVpdGhlciBwdWJsaWMga2V5cyBvciBwcml2YXRlIGtleXMuXHJcbiAqL1xyXG5leHBvcnQgY2xhc3MgV2FsbGV0S2V5cyB7XHJcbiAgcHVibGljIHJlYWRvbmx5IHB1YmxpY0tleXM6IFRyaXBsZTxCdWZmZXI+O1xyXG5cclxuICAvKipcclxuICAgKiBAcGFyYW0gdHJpcGxlIC0gYmlwMzIga2V5IHRyaXBsZVxyXG4gICAqL1xyXG4gIGNvbnN0cnVjdG9yKHB1YmxpYyByZWFkb25seSB0cmlwbGU6IFRyaXBsZTxCSVAzMkludGVyZmFjZT4pIHtcclxuICAgIHRyaXBsZS5mb3JFYWNoKChhLCBpKSA9PiB7XHJcbiAgICAgIHRyaXBsZS5mb3JFYWNoKChiLCBqKSA9PiB7XHJcbiAgICAgICAgaWYgKGVxUHVibGljS2V5KGEsIGIpICYmIGkgIT09IGopIHtcclxuICAgICAgICAgIHRocm93IG5ldyBFcnJvcihgd2FsbGV0IGtleXMgbXVzdCBiZSBkaXN0aW5jdGApO1xyXG4gICAgICAgIH1cclxuICAgICAgfSk7XHJcbiAgICB9KTtcclxuXHJcbiAgICB0aGlzLnB1YmxpY0tleXMgPSB0aGlzLnRyaXBsZS5tYXAoKGspID0+IGsucHVibGljS2V5KSBhcyBUcmlwbGU8QnVmZmVyPjtcclxuICB9XHJcblxyXG4gIGdldCB1c2VyKCk6IEJJUDMySW50ZXJmYWNlIHtcclxuICAgIHJldHVybiB0aGlzLnRyaXBsZVswXTtcclxuICB9XHJcblxyXG4gIGdldCBiYWNrdXAoKTogQklQMzJJbnRlcmZhY2Uge1xyXG4gICAgcmV0dXJuIHRoaXMudHJpcGxlWzFdO1xyXG4gIH1cclxuXHJcbiAgZ2V0IGJpdGdvKCk6IEJJUDMySW50ZXJmYWNlIHtcclxuICAgIHJldHVybiB0aGlzLnRyaXBsZVsyXTtcclxuICB9XHJcbn1cclxuXHJcbi8qKlxyXG4gKiBTZXQgb2YgV2FsbGV0S2V5cyBkZXJpdmVkIGZyb20gUm9vdFdhbGxldEtleXMuIFN1aXRhYmxlIGZvciBzaWduaW5nIHRyYW5zYWN0aW9uIGlucHV0cy5cclxuICogQ29udGFpbnMgcmVmZXJlbmNlIHRvIHRoZSBSb290V2FsbGV0S2V5cyB0aGlzIHdhcyBkZXJpdmVkIGZyb20gYXMgd2VsbCBhcyB0aGUgcGF0aHMgdXNlZFxyXG4gKiBmb3IgZGVyaXZhdGlvbi5cclxuICovXHJcbmV4cG9ydCBjbGFzcyBEZXJpdmVkV2FsbGV0S2V5cyBleHRlbmRzIFdhbGxldEtleXMge1xyXG4gIC8qKlxyXG4gICAqIEBwYXJhbSBwYXJlbnQgLSB3YWxsZXQga2V5cyB0byBkZXJpdmUgZnJvbVxyXG4gICAqIEBwYXJhbSBwYXRocyAtIHBhdGhzIHRvIGRlcml2ZSB3aXRoXHJcbiAgICovXHJcbiAgY29uc3RydWN0b3IocHVibGljIHBhcmVudDogUm9vdFdhbGxldEtleXMsIHB1YmxpYyBwYXRoczogVHJpcGxlPHN0cmluZz4pIHtcclxuICAgIHN1cGVyKHBhcmVudC50cmlwbGUubWFwKChrLCBpKSA9PiBrLmRlcml2ZVBhdGgocGF0aHNbaV0pKSBhcyBUcmlwbGU8QklQMzJJbnRlcmZhY2U+KTtcclxuICB9XHJcbn1cclxuXHJcbi8qKlxyXG4gKiBTZXQgb2Ygcm9vdCB3YWxsZXQga2V5cywgdHlwaWNhbGx5IGluc3RhbnRpYXRlZCB1c2luZyB0aGUgd2FsbGV0IHhwdWIgdHJpcGxlLlxyXG4gKi9cclxuZXhwb3J0IGNsYXNzIFJvb3RXYWxsZXRLZXlzIGV4dGVuZHMgV2FsbGV0S2V5cyB7XHJcbiAgc3RhdGljIHJlYWRvbmx5IGRlZmF1bHRQcmVmaXggPSAnMC8wJztcclxuXHJcbiAgLyoqXHJcbiAgICogQHBhcmFtIHRyaXBsZSAtIGJpcDMyIGtleSB0cmlwbGVcclxuICAgKiBAcGFyYW0gZGVyaXZhdGlvblByZWZpeGVzIC0gQ2VydGFpbiB2MSB3YWxsZXRzIG9yIHRoZWlyIG1pZ3JhdGVkIHYyIGNvdW50ZXJwYXJ0c1xyXG4gICAqICAgICAgICAgICAgICAgICAgICAgICAgICAgICBjYW4gaGF2ZSBhIG5vbnN0YW5kYXJkIHByZWZpeC5cclxuICAgKi9cclxuICBjb25zdHJ1Y3RvcihcclxuICAgIHRyaXBsZTogVHJpcGxlPEJJUDMySW50ZXJmYWNlPixcclxuICAgIHB1YmxpYyByZWFkb25seSBkZXJpdmF0aW9uUHJlZml4ZXM6IFRyaXBsZTxzdHJpbmc+ID0gW1xyXG4gICAgICBSb290V2FsbGV0S2V5cy5kZWZhdWx0UHJlZml4LFxyXG4gICAgICBSb290V2FsbGV0S2V5cy5kZWZhdWx0UHJlZml4LFxyXG4gICAgICBSb290V2FsbGV0S2V5cy5kZWZhdWx0UHJlZml4LFxyXG4gICAgXVxyXG4gICkge1xyXG4gICAgc3VwZXIodHJpcGxlKTtcclxuXHJcbiAgICBkZXJpdmF0aW9uUHJlZml4ZXMuZm9yRWFjaCgocCkgPT4ge1xyXG4gICAgICBpZiAocC5zdGFydHNXaXRoKCcvJykgfHwgcC5lbmRzV2l0aCgnLycpKSB7XHJcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yKGBkZXJpdmF0aW9uIHByZWZpeCBtdXN0IG5vdCBzdGFydCBvciBlbmQgd2l0aCBhIHNsYXNoYCk7XHJcbiAgICAgIH1cclxuICAgIH0pO1xyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogQHBhcmFtIGtleVxyXG4gICAqIEBwYXJhbSBjaGFpblxyXG4gICAqIEBwYXJhbSBpbmRleFxyXG4gICAqIEByZXR1cm4gZnVsbCBkZXJpdmF0aW9uIHBhdGggZm9yIGtleSwgaW5jbHVkaW5nIGtleS1zcGVjaWZpYyBwcmVmaXhcclxuICAgKi9cclxuICBnZXREZXJpdmF0aW9uUGF0aChrZXk6IEJJUDMySW50ZXJmYWNlLCBjaGFpbjogbnVtYmVyLCBpbmRleDogbnVtYmVyKTogc3RyaW5nIHtcclxuICAgIGlmICghdGhpcy5kZXJpdmF0aW9uUHJlZml4ZXMpIHtcclxuICAgICAgdGhyb3cgbmV3IEVycm9yKGBubyBkZXJpdmF0aW9uIHByZWZpeGVzYCk7XHJcbiAgICB9XHJcbiAgICBjb25zdCBwcmVmaXggPSB0aGlzLmRlcml2YXRpb25QcmVmaXhlcy5maW5kKChwcmVmaXgsIGkpID0+IGVxUHVibGljS2V5KGtleSwgdGhpcy50cmlwbGVbaV0pKTtcclxuICAgIGlmIChwcmVmaXggPT09IHVuZGVmaW5lZCkge1xyXG4gICAgICB0aHJvdyBuZXcgRXJyb3IoYGtleSBub3QgaW4gd2FsbGV0S2V5c2ApO1xyXG4gICAgfVxyXG4gICAgcmV0dXJuIGAke3ByZWZpeH0vJHtjaGFpbn0vJHtpbmRleH1gO1xyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogQHBhcmFtIGNoYWluXHJcbiAgICogQHBhcmFtIGluZGV4XHJcbiAgICogQHJldHVybiB3YWxsZXRLZXlzIGZvciBhIHBhcnRpY3VsYXIgYWRkcmVzcyBpZGVudGlmaWVkIGJ5IChjaGFpbiwgaW5kZXgpXHJcbiAgICovXHJcbiAgZGVyaXZlRm9yQ2hhaW5BbmRJbmRleChjaGFpbjogbnVtYmVyLCBpbmRleDogbnVtYmVyKTogRGVyaXZlZFdhbGxldEtleXMge1xyXG4gICAgcmV0dXJuIG5ldyBEZXJpdmVkV2FsbGV0S2V5cyhcclxuICAgICAgdGhpcyxcclxuICAgICAgdGhpcy50cmlwbGUubWFwKChrKSA9PiB0aGlzLmdldERlcml2YXRpb25QYXRoKGssIGNoYWluLCBpbmRleCkpIGFzIFRyaXBsZTxzdHJpbmc+XHJcbiAgICApO1xyXG4gIH1cclxufVxyXG4iXX0=
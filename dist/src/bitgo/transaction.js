"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createTransactionBuilderFromTransaction = exports.createTransactionBuilderForNetwork = exports.createPsbtForNetwork = exports.setPsbtDefaults = exports.setTransactionBuilderDefaults = exports.getDefaultTransactionVersion = exports.createPsbtFromTransaction = exports.createPsbtFromHex = exports.createPsbtFromBuffer = exports.createTransactionFromHex = exports.createTransactionFromBuffer = void 0;
const networks_1 = require("../networks");
const UtxoPsbt_1 = require("./UtxoPsbt");
const UtxoTransaction_1 = require("./UtxoTransaction");
const UtxoTransactionBuilder_1 = require("./UtxoTransactionBuilder");
const DashPsbt_1 = require("./dash/DashPsbt");
const DashTransaction_1 = require("./dash/DashTransaction");
const DashTransactionBuilder_1 = require("./dash/DashTransactionBuilder");
const ZcashPsbt_1 = require("./zcash/ZcashPsbt");
const ZcashTransactionBuilder_1 = require("./zcash/ZcashTransactionBuilder");
const ZcashTransaction_1 = require("./zcash/ZcashTransaction");
const litecoin_1 = require("./litecoin");
function createTransactionFromBuffer(buf, network, { version, amountType } = {}, deprecatedAmountType) {
    if (amountType) {
        if (deprecatedAmountType && amountType !== deprecatedAmountType) {
            throw new Error(`invalid arguments`);
        }
    }
    else {
        if (deprecatedAmountType) {
            amountType = deprecatedAmountType;
        }
        else {
            amountType = 'number';
        }
    }
    switch ((0, networks_1.getMainnet)(network)) {
        case networks_1.networks.bitcoin:
        case networks_1.networks.bitcoincash:
        case networks_1.networks.bitcoinsv:
        case networks_1.networks.bitcoingold:
        case networks_1.networks.dogecoin:
        case networks_1.networks.bithereum:
        case networks_1.networks.safecoin:
        case networks_1.networks.komodo:
        case networks_1.networks.zelcash:
        case networks_1.networks.flux:
        case networks_1.networks.zero:
        case networks_1.networks.snowgem:
        case networks_1.networks.gemlink:
        case networks_1.networks.commercium:
        case networks_1.networks.zclassic:
        case networks_1.networks.bzedge:
        case networks_1.networks.genesis:
        case networks_1.networks.bitcoinzero:
        case networks_1.networks.bitcoinz:
        case networks_1.networks.hush:
        case networks_1.networks.ravencoin:
        case networks_1.networks.bitcore:
        case networks_1.networks.zcoin:
        case networks_1.networks.axe:
        case networks_1.networks.digibyte:
        case networks_1.networks.sinovate:
        case networks_1.networks.ilcoin:
        case networks_1.networks.raptoreum:
        case networks_1.networks.vertcoin:
        case networks_1.networks.clore:
        case networks_1.networks.ecash:
            return UtxoTransaction_1.UtxoTransaction.fromBuffer(buf, false, amountType, network);
        case networks_1.networks.litecoin:
            return litecoin_1.LitecoinTransaction.fromBuffer(buf, false, amountType, network);
        case networks_1.networks.dash:
            return DashTransaction_1.DashTransaction.fromBuffer(buf, false, amountType, network);
        case networks_1.networks.zcash:
            return ZcashTransaction_1.ZcashTransaction.fromBufferWithVersion(buf, network, version, amountType);
    }
    /* istanbul ignore next */
    throw new Error(`invalid network`);
}
exports.createTransactionFromBuffer = createTransactionFromBuffer;
function createTransactionFromHex(hex, network, p) {
    if (typeof p === 'string') {
        p = { amountType: p };
    }
    return createTransactionFromBuffer(Buffer.from(hex, 'hex'), network, p);
}
exports.createTransactionFromHex = createTransactionFromHex;
function createPsbtFromBuffer(buf, network, bip32PathsAbsolute = false) {
    switch ((0, networks_1.getMainnet)(network)) {
        case networks_1.networks.bitcoin:
        case networks_1.networks.bitcoincash:
        case networks_1.networks.bitcoinsv:
        case networks_1.networks.bitcoingold:
        case networks_1.networks.dogecoin:
        case networks_1.networks.bithereum:
        case networks_1.networks.safecoin:
        case networks_1.networks.komodo:
        case networks_1.networks.zelcash:
        case networks_1.networks.flux:
        case networks_1.networks.zero:
        case networks_1.networks.snowgem:
        case networks_1.networks.gemlink:
        case networks_1.networks.commercium:
        case networks_1.networks.zclassic:
        case networks_1.networks.bzedge:
        case networks_1.networks.genesis:
        case networks_1.networks.bitcoinzero:
        case networks_1.networks.bitcoinz:
        case networks_1.networks.hush:
        case networks_1.networks.ravencoin:
        case networks_1.networks.bitcore:
        case networks_1.networks.zcoin:
        case networks_1.networks.axe:
        case networks_1.networks.digibyte:
        case networks_1.networks.sinovate:
        case networks_1.networks.ilcoin:
        case networks_1.networks.raptoreum:
        case networks_1.networks.vertcoin:
        case networks_1.networks.clore:
        case networks_1.networks.ecash:
            return UtxoPsbt_1.UtxoPsbt.fromBuffer(buf, { network, bip32PathsAbsolute });
        case networks_1.networks.litecoin:
            return litecoin_1.LitecoinPsbt.fromBuffer(buf, { network, bip32PathsAbsolute });
        case networks_1.networks.dash:
            return DashPsbt_1.DashPsbt.fromBuffer(buf, { network, bip32PathsAbsolute });
        case networks_1.networks.zcash:
            return ZcashPsbt_1.ZcashPsbt.fromBuffer(buf, { network, bip32PathsAbsolute });
    }
    /* istanbul ignore next */
    throw new Error(`invalid network`);
}
exports.createPsbtFromBuffer = createPsbtFromBuffer;
function createPsbtFromHex(hex, network, bip32PathsAbsolute = false) {
    return createPsbtFromBuffer(Buffer.from(hex, 'hex'), network, bip32PathsAbsolute);
}
exports.createPsbtFromHex = createPsbtFromHex;
function createPsbtFromTransaction(tx, prevOuts) {
    switch ((0, networks_1.getMainnet)(tx.network)) {
        case networks_1.networks.bitcoin:
        case networks_1.networks.bitcoincash:
        case networks_1.networks.bitcoinsv:
        case networks_1.networks.bitcoingold:
        case networks_1.networks.dogecoin:
        case networks_1.networks.bithereum:
        case networks_1.networks.safecoin:
        case networks_1.networks.komodo:
        case networks_1.networks.zelcash:
        case networks_1.networks.flux:
        case networks_1.networks.zero:
        case networks_1.networks.snowgem:
        case networks_1.networks.gemlink:
        case networks_1.networks.commercium:
        case networks_1.networks.zclassic:
        case networks_1.networks.bzedge:
        case networks_1.networks.genesis:
        case networks_1.networks.bitcoinzero:
        case networks_1.networks.bitcoinz:
        case networks_1.networks.hush:
        case networks_1.networks.ravencoin:
        case networks_1.networks.bitcore:
        case networks_1.networks.zcoin:
        case networks_1.networks.axe:
        case networks_1.networks.digibyte:
        case networks_1.networks.sinovate:
        case networks_1.networks.ilcoin:
        case networks_1.networks.raptoreum:
        case networks_1.networks.vertcoin:
        case networks_1.networks.clore:
        case networks_1.networks.ecash:
            return UtxoPsbt_1.UtxoPsbt.fromTransaction(tx, prevOuts);
        case networks_1.networks.litecoin:
            return litecoin_1.LitecoinPsbt.fromTransaction(tx, prevOuts);
        case networks_1.networks.dash:
            return DashPsbt_1.DashPsbt.fromTransaction(tx, prevOuts);
        case networks_1.networks.zcash:
            return ZcashPsbt_1.ZcashPsbt.fromTransaction(tx, prevOuts);
    }
    /* istanbul ignore next */
    throw new Error(`invalid network`);
}
exports.createPsbtFromTransaction = createPsbtFromTransaction;
function getDefaultTransactionVersion(network) {
    switch ((0, networks_1.getMainnet)(network)) {
        case networks_1.networks.bitcoincash:
        case networks_1.networks.bitcoinsv:
        case networks_1.networks.bitcoingold:
        case networks_1.networks.ecash:
            return 2;
        case networks_1.networks.zcash:
            return ZcashTransaction_1.ZcashTransaction.VERSION4_BRANCH_NU5;
        default:
            return 1;
    }
}
exports.getDefaultTransactionVersion = getDefaultTransactionVersion;
function setTransactionBuilderDefaults(txb, network, { version = getDefaultTransactionVersion(network) } = {}) {
    switch ((0, networks_1.getMainnet)(network)) {
        case networks_1.networks.bitcoincash:
        case networks_1.networks.bitcoinsv:
        case networks_1.networks.bitcoingold:
        case networks_1.networks.ecash:
            if (version !== 2) {
                throw new Error(`invalid version`);
            }
            txb.setVersion(version);
            break;
        case networks_1.networks.zcash:
            txb.setDefaultsForVersion(network, version);
            break;
        default:
            if (version !== 1) {
                throw new Error(`invalid version`);
            }
    }
}
exports.setTransactionBuilderDefaults = setTransactionBuilderDefaults;
function setPsbtDefaults(psbt, network, { version = getDefaultTransactionVersion(network) } = {}) {
    switch ((0, networks_1.getMainnet)(network)) {
        case networks_1.networks.bitcoincash:
        case networks_1.networks.bitcoinsv:
        case networks_1.networks.bitcoingold:
        case networks_1.networks.ecash:
            if (version !== 2) {
                throw new Error(`invalid version`);
            }
            break;
        case networks_1.networks.zcash:
            if (![
                ZcashTransaction_1.ZcashTransaction.VERSION4_BRANCH_CANOPY,
                ZcashTransaction_1.ZcashTransaction.VERSION4_BRANCH_NU5,
                ZcashTransaction_1.ZcashTransaction.VERSION5_BRANCH_NU5,
            ].includes(version)) {
                throw new Error(`invalid version`);
            }
            psbt.setDefaultsForVersion(network, version);
            break;
        default:
            if (version !== 1) {
                throw new Error(`invalid version`);
            }
            // FIXME: set version here, because there's a bug in the upstream PSBT
            // that defaults transactions to v2.
            psbt.setVersion(version);
    }
}
exports.setPsbtDefaults = setPsbtDefaults;
function createPsbtForNetwork(psbtOpts, { version } = {}) {
    let psbt;
    switch ((0, networks_1.getMainnet)(psbtOpts.network)) {
        case networks_1.networks.bitcoin:
        case networks_1.networks.bitcoincash:
        case networks_1.networks.bitcoinsv:
        case networks_1.networks.bitcoingold:
        case networks_1.networks.dogecoin:
        case networks_1.networks.bithereum:
        case networks_1.networks.safecoin:
        case networks_1.networks.komodo:
        case networks_1.networks.zelcash:
        case networks_1.networks.flux:
        case networks_1.networks.zero:
        case networks_1.networks.snowgem:
        case networks_1.networks.gemlink:
        case networks_1.networks.commercium:
        case networks_1.networks.zclassic:
        case networks_1.networks.bzedge:
        case networks_1.networks.genesis:
        case networks_1.networks.bitcoinzero:
        case networks_1.networks.bitcoinz:
        case networks_1.networks.hush:
        case networks_1.networks.ravencoin:
        case networks_1.networks.bitcore:
        case networks_1.networks.zcoin:
        case networks_1.networks.axe:
        case networks_1.networks.digibyte:
        case networks_1.networks.sinovate:
        case networks_1.networks.ilcoin:
        case networks_1.networks.raptoreum:
        case networks_1.networks.vertcoin:
        case networks_1.networks.clore:
        case networks_1.networks.ecash: {
            psbt = UtxoPsbt_1.UtxoPsbt.createPsbt(psbtOpts);
            break;
        }
        case networks_1.networks.litecoin: {
            psbt = litecoin_1.LitecoinPsbt.createPsbt(psbtOpts);
            break;
        }
        case networks_1.networks.dash: {
            psbt = DashPsbt_1.DashPsbt.createPsbt(psbtOpts);
            break;
        }
        case networks_1.networks.zcash: {
            psbt = ZcashPsbt_1.ZcashPsbt.createPsbt(psbtOpts);
            break;
        }
        default:
            throw new Error(`unsupported network`);
    }
    setPsbtDefaults(psbt, psbtOpts.network, { version });
    return psbt;
}
exports.createPsbtForNetwork = createPsbtForNetwork;
function createTransactionBuilderForNetwork(network, { version } = {}) {
    let txb;
    switch ((0, networks_1.getMainnet)(network)) {
        case networks_1.networks.bitcoin:
        case networks_1.networks.bitcoincash:
        case networks_1.networks.bitcoinsv:
        case networks_1.networks.bitcoingold:
        case networks_1.networks.dogecoin:
        case networks_1.networks.bithereum:
        case networks_1.networks.safecoin:
        case networks_1.networks.komodo:
        case networks_1.networks.zelcash:
        case networks_1.networks.flux:
        case networks_1.networks.zero:
        case networks_1.networks.snowgem:
        case networks_1.networks.gemlink:
        case networks_1.networks.commercium:
        case networks_1.networks.zclassic:
        case networks_1.networks.bzedge:
        case networks_1.networks.genesis:
        case networks_1.networks.bitcoinzero:
        case networks_1.networks.bitcoinz:
        case networks_1.networks.hush:
        case networks_1.networks.ravencoin:
        case networks_1.networks.bitcore:
        case networks_1.networks.zcoin:
        case networks_1.networks.axe:
        case networks_1.networks.digibyte:
        case networks_1.networks.sinovate:
        case networks_1.networks.ilcoin:
        case networks_1.networks.raptoreum:
        case networks_1.networks.vertcoin:
        case networks_1.networks.clore:
        case networks_1.networks.ecash: {
            txb = new UtxoTransactionBuilder_1.UtxoTransactionBuilder(network);
            break;
        }
        case networks_1.networks.litecoin: {
            txb = new litecoin_1.LitecoinTransactionBuilder(network);
            break;
        }
        case networks_1.networks.dash:
            txb = new DashTransactionBuilder_1.DashTransactionBuilder(network);
            break;
        case networks_1.networks.zcash: {
            txb = new ZcashTransactionBuilder_1.ZcashTransactionBuilder(network);
            break;
        }
        default:
            throw new Error(`unsupported network`);
    }
    setTransactionBuilderDefaults(txb, network, { version });
    return txb;
}
exports.createTransactionBuilderForNetwork = createTransactionBuilderForNetwork;
function createTransactionBuilderFromTransaction(tx, prevOutputs) {
    switch ((0, networks_1.getMainnet)(tx.network)) {
        case networks_1.networks.bitcoin:
        case networks_1.networks.bitcoincash:
        case networks_1.networks.bitcoinsv:
        case networks_1.networks.bitcoingold:
        case networks_1.networks.dogecoin:
        case networks_1.networks.bithereum:
        case networks_1.networks.safecoin:
        case networks_1.networks.komodo:
        case networks_1.networks.zelcash:
        case networks_1.networks.flux:
        case networks_1.networks.zero:
        case networks_1.networks.snowgem:
        case networks_1.networks.gemlink:
        case networks_1.networks.commercium:
        case networks_1.networks.zclassic:
        case networks_1.networks.bzedge:
        case networks_1.networks.genesis:
        case networks_1.networks.bitcoinzero:
        case networks_1.networks.bitcoinz:
        case networks_1.networks.hush:
        case networks_1.networks.ravencoin:
        case networks_1.networks.bitcore:
        case networks_1.networks.zcoin:
        case networks_1.networks.axe:
        case networks_1.networks.digibyte:
        case networks_1.networks.sinovate:
        case networks_1.networks.ilcoin:
        case networks_1.networks.raptoreum:
        case networks_1.networks.vertcoin:
        case networks_1.networks.clore:
        case networks_1.networks.ecash:
            return UtxoTransactionBuilder_1.UtxoTransactionBuilder.fromTransaction(tx, undefined, prevOutputs);
        case networks_1.networks.litecoin:
            return litecoin_1.LitecoinTransactionBuilder.fromTransaction(tx, undefined, prevOutputs);
        case networks_1.networks.dash:
            return DashTransactionBuilder_1.DashTransactionBuilder.fromTransaction(tx, undefined, prevOutputs);
        case networks_1.networks.zcash:
            return ZcashTransactionBuilder_1.ZcashTransactionBuilder.fromTransaction(tx, undefined, prevOutputs);
    }
    throw new Error(`invalid network`);
}
exports.createTransactionBuilderFromTransaction = createTransactionBuilderFromTransaction;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidHJhbnNhY3Rpb24uanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi9zcmMvYml0Z28vdHJhbnNhY3Rpb24udHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7O0FBR0EsMENBQTREO0FBRTVELHlDQUFnRDtBQUNoRCx1REFBb0Q7QUFDcEQscUVBQWtFO0FBQ2xFLDhDQUEyQztBQUMzQyw0REFBeUQ7QUFDekQsMEVBQXVFO0FBQ3ZFLGlEQUE4QztBQUM5Qyw2RUFBMEU7QUFDMUUsK0RBQTBFO0FBQzFFLHlDQUEyRjtBQVkzRixTQUFnQiwyQkFBMkIsQ0FDekMsR0FBVyxFQUNYLE9BQWdCLEVBQ2hCLEVBQUUsT0FBTyxFQUFFLFVBQVUsS0FBNkQsRUFBRSxFQUNwRixvQkFBMEM7SUFFMUMsSUFBSSxVQUFVLEVBQUU7UUFDZCxJQUFJLG9CQUFvQixJQUFJLFVBQVUsS0FBSyxvQkFBb0IsRUFBRTtZQUMvRCxNQUFNLElBQUksS0FBSyxDQUFDLG1CQUFtQixDQUFDLENBQUM7U0FDdEM7S0FDRjtTQUFNO1FBQ0wsSUFBSSxvQkFBb0IsRUFBRTtZQUN4QixVQUFVLEdBQUcsb0JBQW9CLENBQUM7U0FDbkM7YUFBTTtZQUNMLFVBQVUsR0FBRyxRQUFRLENBQUM7U0FDdkI7S0FDRjtJQUNELFFBQVEsSUFBQSxxQkFBVSxFQUFDLE9BQU8sQ0FBQyxFQUFFO1FBQzNCLEtBQUssbUJBQVEsQ0FBQyxPQUFPLENBQUM7UUFDdEIsS0FBSyxtQkFBUSxDQUFDLFdBQVcsQ0FBQztRQUMxQixLQUFLLG1CQUFRLENBQUMsU0FBUyxDQUFDO1FBQ3hCLEtBQUssbUJBQVEsQ0FBQyxXQUFXLENBQUM7UUFDMUIsS0FBSyxtQkFBUSxDQUFDLFFBQVEsQ0FBQztRQUN2QixLQUFLLG1CQUFRLENBQUMsU0FBUyxDQUFDO1FBQ3hCLEtBQUssbUJBQVEsQ0FBQyxRQUFRLENBQUM7UUFDdkIsS0FBSyxtQkFBUSxDQUFDLE1BQU0sQ0FBQztRQUNyQixLQUFLLG1CQUFRLENBQUMs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QUUsRUFBRSxTQUFTLEVBQUUsV0FBVyxDQUFDLENBQUM7UUFDckYsS0FBSyxtQkFBUSxDQUFDLFFBQVE7WUFDcEIsT0FBTyxxQ0FBMEIsQ0FBQyxlQUFlLENBQy9DLEVBQWtDLEVBQ2xDLFNBQVMsRUFDVCxXQUFrQyxDQUNuQyxDQUFDO1FBQ0osS0FBSyxtQkFBUSxDQUFDLElBQUk7WUFDaEIsT0FBTywrQ0FBc0IsQ0FBQyxlQUFlLENBQzNDLEVBQThCLEVBQzlCLFNBQVMsRUFDVCxXQUFrQyxDQUNuQyxDQUFDO1FBQ0osS0FBSyxtQkFBUSxDQUFDLEtBQUs7WUFDakIsT0FBTyxpREFBdUIsQ0FBQyxlQUFlLENBQzVDLEVBQStCLEVBQy9CLFNBQVMsRUFDVCxXQUFrQyxDQUNuQyxDQUFDO0tBQ0w7SUFFRCxNQUFNLElBQUksS0FBSyxDQUFDLGlCQUFpQixDQUFDLENBQUM7QUFDckMsQ0FBQztBQTFERCwwRkEwREMiLCJzb3VyY2VzQ29udGVudCI6WyIvKiBlc2xpbnQgbm8tcmVkZWNsYXJlOiAwICovXHJcbmltcG9ydCB7IFR4T3V0cHV0IH0gZnJvbSAnYml0Y29pbmpzLWxpYic7XHJcblxyXG5pbXBvcnQgeyBuZXR3b3JrcywgTmV0d29yaywgZ2V0TWFpbm5ldCB9IGZyb20gJy4uL25ldHdvcmtzJztcclxuXHJcbmltcG9ydCB7IFV0eG9Qc2J0LCBQc2J0T3B0cyB9IGZyb20gJy4vVXR4b1BzYnQnO1xyXG5pbXBvcnQgeyBVdHhvVHJhbnNhY3Rpb24gfSBmcm9tICcuL1V0eG9UcmFuc2FjdGlvbic7XHJcbmltcG9ydCB7IFV0eG9UcmFuc2FjdGlvbkJ1aWxkZXIgfSBmcm9tICcuL1V0eG9UcmFuc2FjdGlvbkJ1aWxkZXInO1xyXG5pbXBvcnQgeyBEYXNoUHNidCB9IGZyb20gJy4vZGFzaC9EYXNoUHNidCc7XHJcbmltcG9ydCB7IERhc2hUcmFuc2FjdGlvbiB9IGZyb20gJy4vZGFzaC9EYXNoVHJhbnNhY3Rpb24nO1xyXG5pbXBvcnQgeyBEYXNoVHJhbnNhY3Rpb25CdWlsZGVyIH0gZnJvbSAnLi9kYXNoL0Rhc2hUcmFuc2FjdGlvbkJ1aWxkZXInO1xyXG5pbXBvcnQgeyBaY2FzaFBzYnQgfSBmcm9tICcuL3pjYXNoL1pjYXNoUHNidCc7XHJcbmltcG9ydCB7IFpjYXNoVHJhbnNhY3Rpb25CdWlsZGVyIH0gZnJvbSAnLi96Y2FzaC9aY2FzaFRyYW5zYWN0aW9uQnVpbGRlcic7XHJcbmltcG9ydCB7IFpjYXNoTmV0d29yaywgWmNhc2hUcmFuc2FjdGlvbiB9IGZyb20gJy4vemNhc2gvWmNhc2hUcmFuc2FjdGlvbic7XHJcbmltcG9ydCB7IExpdGVjb2luUHNidCwgTGl0ZWNvaW5UcmFuc2FjdGlvbiwgTGl0ZWNvaW5UcmFuc2FjdGlvbkJ1aWxkZXIgfSBmcm9tICcuL2xpdGVjb2luJztcclxuXHJcbmV4cG9ydCBmdW5jdGlvbiBjcmVhdGVUcmFuc2FjdGlvbkZyb21CdWZmZXIoXHJcbiAgYnVmOiBCdWZmZXIsXHJcbiAgbmV0d29yazogTmV0d29yayxcclxuICBwYXJhbXM6IHsgdmVyc2lvbj86IG51bWJlcjsgYW1vdW50VHlwZTogJ2JpZ2ludCcgfVxyXG4pOiBVdHhvVHJhbnNhY3Rpb248YmlnaW50PjtcclxuZXhwb3J0IGZ1bmN0aW9uIGNyZWF0ZVRyYW5zYWN0aW9uRnJvbUJ1ZmZlcjxUTnVtYmVyIGV4dGVuZHMgbnVtYmVyIHwgYmlnaW50PihcclxuICBidWY6IEJ1ZmZlcixcclxuICBuZXR3b3JrOiBOZXR3b3JrLFxyXG4gIHBhcmFtcz86IHsgdmVyc2lvbj86IG51bWJlcjsgYW1vdW50VHlwZT86ICdudW1iZXInIHwgJ2JpZ2ludCcgfVxyXG4pOiBVdHhvVHJhbnNhY3Rpb248VE51bWJlcj47XHJcbmV4cG9ydCBmdW5jdGlvbiBjcmVhdGVUcmFuc2FjdGlvbkZyb21CdWZmZXI8VE51bWJlciBleHRlbmRzIG51bWJlciB8IGJpZ2ludCA9IG51bWJlcj4oXHJcbiAgYnVmOiBCdWZmZXIsXHJcbiAgbmV0d29yazogTmV0d29yayxcclxuICB7IHZlcnNpb24sIGFtb3VudFR5cGUgfTogeyB2ZXJzaW9uPzogbnVtYmVyOyBhbW91bnRUeXBlPzogJ251bWJlcicgfCAnYmlnaW50JyB9ID0ge30sXHJcbiAgZGVwcmVjYXRlZEFtb3VudFR5cGU/OiAnbnVtYmVyJyB8ICdiaWdpbnQnXHJcbik6IFV0eG9UcmFuc2FjdGlvbjxUTnVtYmVyPiB7XHJcbiAgaWYgKGFtb3VudFR5cGUpIHtcclxuICAgIGlmIChkZXByZWNhdGVkQW1vdW50VHlwZSAmJiBhbW91bnRUeXBlICE9PSBkZXByZWNhdGVkQW1vdW50VHlwZSkge1xyXG4gICAgICB0aHJvdyBuZXcgRXJyb3IoYGludmFsaWQgYXJndW1lbnRzYCk7XHJcbiAgICB9XHJcbiAgfSBlbHNlIHtcclxuICAgIGlmIChkZXByZWNhdGVkQW1vdW50VHlwZSkge1xyXG4gICAgICBhbW91bnRUeXBlID0gZGVwcmVjYXRlZEFtb3VudFR5cGU7XHJcbiAgICB9IGVsc2Uge1xyXG4gICAgICBhbW91bnRUeXBlID0gJ251bWJlcic7XHJcbiAgICB9XHJcbiAgfVxyXG4gIHN3aXRjaCAoZ2V0TWFpbm5ldChuZXR3b3JrKSkge1xyXG4gICAgY2FzZSBuZXR3b3Jrcy5iaXRjb2luOlxyXG4gICAgY2FzZSBuZXR3b3Jrcy5iaXRjb2luY2FzaDpcclxuICAgIGNhc2UgbmV0d29ya3MuYml0Y29pbnN2OlxyXG4gICAgY2FzZSBuZXR3b3Jrcy5iaXRjb2luZ29sZDpcclxuICAgIGNhc2UgbmV0d29ya3MuZG9nZWNvaW46XHJcbiAgICBjYXNlIG5ldHdvcmtzLmJpdGhlcmV1bTpcclxuICAgIGNhc2UgbmV0d29ya3Muc2FmZWNvaW46XHJcbiAgICBjYXNlIG5ldHdvcmtzLmtvbW9kbzpcclxuICAgIGNhc2UgbmV0d29ya3MuemVsY2FzaDpcclxuICAgIGNhc2UgbmV0d29ya3MuZmx1eDpcclxuICAgIGNhc2UgbmV0d29ya3MuemVybzpcclxuICAgIGNhc2UgbmV0d29ya3Muc25vd2dlbTpcclxuICAgIGNhc2UgbmV0d29ya3MuZ2VtbGluazpcclxuICAgIGNhc2UgbmV0d29ya3MuY29tbWVyY2l1bTpcclxuICAgIGNhc2UgbmV0d29ya3MuemNsYXNzaWM6XHJcbiAgICBjYXNlIG5ldHdvcmtzLmJ6ZWRnZTpcclxuICAgIGNhc2UgbmV0d29ya3MuZ2VuZXNpczpcclxuICAgIGNhc2UgbmV0d29ya3MuYml0Y29pbnplcm86XHJcbiAgICBjYXNlIG5ldHdvcmtzLmJpdGNvaW56OlxyXG4gICAgY2FzZSBuZXR3b3Jrcy5odXNoOlxyXG4gICAgY2FzZSBuZXR3b3Jrcy5yYXZlbmNvaW46XHJcbiAgICBjYXNlIG5ldHdvcmtzLmJpdGNvcmU6XHJcbiAgICBjYXNlIG5ldHdvcmtzLnpjb2luOlxyXG4gICAgY2FzZSBuZXR3b3Jrcy5heGU6XHJcbiAgICBjYXNlIG5ldHdvcmtzLmRpZ2lieXRlOlxyXG4gICAgY2FzZSBuZXR3b3Jrcy5zaW5vdmF0ZTpcclxuICAgIGNhc2UgbmV0d29ya3MuaWxjb2luOlxyXG4gICAgY2FzZSBuZXR3b3Jrcy5yYXB0b3JldW06XHJcbiAgICBjYXNlIG5ldHdvcmtzLnZlcnRjb2luOlxyXG4gICAgY2FzZSBuZXR3b3Jrcy5jbG9yZTpcclxuICAgIGNhc2UgbmV0d29ya3MuZWNhc2g6XHJcbiAgICAgIHJldHVybiBVdHhvVHJhbnNhY3Rpb24uZnJvbUJ1ZmZlcjxUTnVtYmVyPihidWYsIGZhbHNlLCBhbW91bnRUeXBlLCBuZXR3b3JrKTtcclxuICAgIGNhc2UgbmV0d29ya3MubGl0ZWNvaW46XHJcbiAgICAgIHJldHVybiBMaXRlY29pblRyYW5zYWN0aW9uLmZyb21CdWZmZXI8VE51bWJlcj4oYnVmLCBmYWxzZSwgYW1vdW50VHlwZSwgbmV0d29yayk7XHJcbiAgICBjYXNlIG5ldHdvcmtzLmRhc2g6XHJcbiAgICAgIHJldHVybiBEYXNoVHJhbnNhY3Rpb24uZnJvbUJ1ZmZlcjxUTnVtYmVyPihidWYsIGZhbHNlLCBhbW91bnRUeXBlLCBuZXR3b3JrKTtcclxuICAgIGNhc2UgbmV0d29ya3MuemNhc2g6XHJcbiAgICAgIHJldHVybiBaY2FzaFRyYW5zYWN0aW9uLmZyb21CdWZmZXJXaXRoVmVyc2lvbjxUTnVtYmVyPihidWYsIG5ldHdvcmsgYXMgWmNhc2hOZXR3b3JrLCB2ZXJzaW9uLCBhbW91bnRUeXBlKTtcclxuICB9XHJcblxyXG4gIC8qIGlzdGFuYnVsIGlnbm9yZSBuZXh0ICovXHJcbiAgdGhyb3cgbmV3IEVycm9yKGBpbnZhbGlkIG5ldHdvcmtgKTtcclxufVxyXG5cclxuLyogaXN0YW5idWwgaWdub3JlIG5leHQgKi9cclxuLyoqIEBkZXByZWNhdGVkIC0gdXNlIGNyZWF0ZVRyYW5zYWN0aW9uRnJvbUJ1ZmZlciBpbnN0ZWFkICovXHJcbmV4cG9ydCBmdW5jdGlvbiBjcmVhdGVUcmFuc2FjdGlvbkZyb21IZXgoXHJcbiAgaGV4OiBzdHJpbmcsXHJcbiAgbmV0d29yazogTmV0d29yayxcclxuICBwOiB7IGFtb3VudFR5cGU6ICdiaWdpbnQnIH1cclxuKTogVXR4b1RyYW5zYWN0aW9uPGJpZ2ludD47XHJcbi8qKiBAZGVwcmVjYXRlZCAtIHVzZSBjcmVhdGVUcmFuc2FjdGlvbkZyb21CdWZmZXIgaW5zdGVhZCAqL1xyXG5leHBvcnQgZnVuY3Rpb24gY3JlYXRlVHJhbnNhY3Rpb25Gcm9tSGV4KGhleDogc3RyaW5nLCBuZXR3b3JrOiBOZXR3b3JrLCBwOiB7IGFtb3VudFR5cGU6ICdudW1iZXInIH0pOiBVdHhvVHJhbnNhY3Rpb247XHJcbi8qKiBAZGVwcmVjYXRlZCAtIHVzZSBjcmVhdGVUcmFuc2FjdGlvbkZyb21CdWZmZXIgaW5zdGVhZCAqL1xyXG5leHBvcnQgZnVuY3Rpb24gY3JlYXRlVHJhbnNhY3Rpb25Gcm9tSGV4PFROdW1iZXIgZXh0ZW5kcyBudW1iZXIgfCBiaWdpbnQgPSBudW1iZXI+KFxyXG4gIGhleDogc3RyaW5nLFxyXG4gIG5ldHdvcms6IE5ldHdvcmssXHJcbiAgcD86IHsgYW1vdW50VHlwZT86ICdudW1iZXInIHwgJ2JpZ2ludCcgfSB8ICdudW1iZXInIHwgJ2JpZ2ludCdcclxuKTogVXR4b1RyYW5zYWN0aW9uPFROdW1iZXI+O1xyXG5leHBvcnQgZnVuY3Rpb24gY3JlYXRlVHJhbnNhY3Rpb25Gcm9tSGV4PFROdW1iZXIgZXh0ZW5kcyBudW1iZXIgfCBiaWdpbnQgPSBudW1iZXI+KFxyXG4gIGhleDogc3RyaW5nLFxyXG4gIG5ldHdvcms6IE5ldHdvcmssXHJcbiAgcD86IHsgYW1vdW50VHlwZT86ICdudW1iZXInIHwgJ2JpZ2ludCcgfSB8ICdudW1iZXInIHwgJ2JpZ2ludCdcclxuKTogVXR4b1RyYW5zYWN0aW9uPFROdW1iZXI+IHtcclxuICBpZiAodHlwZW9mIHAgPT09ICdzdHJpbmcnKSB7XHJcbiAgICBwID0geyBhbW91bnRUeXBlOiBwIH07XHJcbiAgfVxyXG4gIHJldHVybiBjcmVhdGVUcmFuc2FjdGlvbkZyb21CdWZmZXI8VE51bWJlcj4oQnVmZmVyLmZyb20oaGV4LCAnaGV4JyksIG5ldHdvcmssIHApO1xyXG59XHJcblxyXG5leHBvcnQgZnVuY3Rpb24gY3JlYXRlUHNidEZyb21CdWZmZXIoYnVmOiBCdWZmZXIsIG5ldHdvcms6IE5ldHdvcmssIGJpcDMyUGF0aHNBYnNvbHV0ZSA9IGZhbHNlKTogVXR4b1BzYnQge1xyXG4gIHN3aXRjaCAoZ2V0TWFpbm5ldChuZXR3b3JrKSkge1xyXG4gICAgY2FzZSBuZXR3b3Jrcy5iaXRjb2luOlxyXG4gICAgY2FzZSBuZXR3b3Jrcy5iaXRjb2luY2FzaDpcclxuICAgIGNhc2UgbmV0d29ya3MuYml0Y29pbnN2OlxyXG4gICAgY2FzZSBuZXR3b3Jrcy5iaXRjb2luZ29sZDpcclxuICAgIGNhc2UgbmV0d29ya3MuZG9nZWNvaW46XHJcbiAgICBjYXNlIG5ldHdvcmtzLmJpdGhlcmV1bTpcclxuICAgIGNhc2UgbmV0d29ya3Muc2FmZWNvaW46XHJcbiAgICBjYXNlIG5ldHdvcmtzLmtvbW9kbzpcclxuICAgIGNhc2UgbmV0d29ya3MuemVsY2FzaDpcclxuICAgIGNhc2UgbmV0d29ya3MuZmx1eDpcclxuICAgIGNhc2UgbmV0d29ya3MuemVybzpcclxuICAgIGNhc2UgbmV0d29ya3Muc25vd2dlbTpcclxuICAgIGNhc2UgbmV0d29ya3MuZ2VtbGluazpcclxuICAgIGNhc2UgbmV0d29ya3MuY29tbWVyY2l1bTpcclxuICAgIGNhc2UgbmV0d29ya3MuemNsYXNzaWM6XHJcbiAgICBjYXNlIG5ldHdvcmtzLmJ6ZWRnZTpcclxuICAgIGNhc2UgbmV0d29ya3MuZ2VuZXNpczpcclxuICAgIGNhc2UgbmV0d29ya3MuYml0Y29pbnplcm86XHJcbiAgICBjYXNlIG5ldHdvcmtzLmJpdGNvaW56OlxyXG4gICAgY2FzZSBuZXR3b3Jrcy5odXNoOlxyXG4gICAgY2FzZSBuZXR3b3Jrcy5yYXZlbmNvaW46XHJcbiAgICBjYXNlIG5ldHdvcmtzLmJpdGNvcmU6XHJcbiAgICBjYXNlIG5ldHdvcmtzLnpjb2luOlxyXG4gICAgY2FzZSBuZXR3b3Jrcy5heGU6XHJcbiAgICBjYXNlIG5ldHdvcmtzLmRpZ2lieXRlOlxyXG4gICAgY2FzZSBuZXR3b3Jrcy5zaW5vdmF0ZTpcclxuICAgIGNhc2UgbmV0d29ya3MuaWxjb2luOlxyXG4gICAgY2FzZSBuZXR3b3Jrcy5yYXB0b3JldW06XHJcbiAgICBjYXNlIG5ldHdvcmtzLnZlcnRjb2luOlxyXG4gICAgY2FzZSBuZXR3b3Jrcy5jbG9yZTpcclxuICAgIGNhc2UgbmV0d29ya3MuZWNhc2g6XHJcbiAgICAgIHJldHVybiBVdHhvUHNidC5mcm9tQnVmZmVyKGJ1ZiwgeyBuZXR3b3JrLCBiaXAzMlBhdGhzQWJzb2x1dGUgfSk7XHJcbiAgICBjYXNlIG5ldHdvcmtzLmxpdGVjb2luOlxyXG4gICAgICByZXR1cm4gTGl0ZWNvaW5Qc2J0LmZyb21CdWZmZXIoYnVmLCB7IG5ldHdvcmssIGJpcDMyUGF0aHNBYnNvbHV0ZSB9KTtcclxuICAgIGNhc2UgbmV0d29ya3MuZGFzaDpcclxuICAgICAgcmV0dXJuIERhc2hQc2J0LmZyb21CdWZmZXIoYnVmLCB7IG5ldHdvcmssIGJpcDMyUGF0aHNBYnNvbHV0ZSB9KTtcclxuICAgIGNhc2UgbmV0d29ya3MuemNhc2g6XHJcbiAgICAgIHJldHVybiBaY2FzaFBzYnQuZnJvbUJ1ZmZlcihidWYsIHsgbmV0d29yaywgYmlwMzJQYXRoc0Fic29sdXRlIH0pO1xyXG4gIH1cclxuXHJcbiAgLyogaXN0YW5idWwgaWdub3JlIG5leHQgKi9cclxuICB0aHJvdyBuZXcgRXJyb3IoYGludmFsaWQgbmV0d29ya2ApO1xyXG59XHJcblxyXG5leHBvcnQgZnVuY3Rpb24gY3JlYXRlUHNidEZyb21IZXgoaGV4OiBzdHJpbmcsIG5ldHdvcms6IE5ldHdvcmssIGJpcDMyUGF0aHNBYnNvbHV0ZSA9IGZhbHNlKTogVXR4b1BzYnQge1xyXG4gIHJldHVybiBjcmVhdGVQc2J0RnJvbUJ1ZmZlcihCdWZmZXIuZnJvbShoZXgsICdoZXgnKSwgbmV0d29yaywgYmlwMzJQYXRoc0Fic29sdXRlKTtcclxufVxyXG5cclxuZXhwb3J0IGZ1bmN0aW9uIGNyZWF0ZVBzYnRGcm9tVHJhbnNhY3Rpb24odHg6IFV0eG9UcmFuc2FjdGlvbjxiaWdpbnQ+LCBwcmV2T3V0czogVHhPdXRwdXQ8YmlnaW50PltdKTogVXR4b1BzYnQge1xyXG4gIHN3aXRjaCAoZ2V0TWFpbm5ldCh0eC5uZXR3b3JrKSkge1xyXG4gICAgY2FzZSBuZXR3b3Jrcy5iaXRjb2luOlxyXG4gICAgY2FzZSBuZXR3b3Jrcy5iaXRjb2luY2FzaDpcclxuICAgIGNhc2UgbmV0d29ya3MuYml0Y29pbnN2OlxyXG4gICAgY2FzZSBuZXR3b3Jrcy5iaXRjb2luZ29sZDpcclxuICAgIGNhc2UgbmV0d29ya3MuZG9nZWNvaW46XHJcbiAgICBjYXNlIG5ldHdvcmtzLmJpdGhlcmV1bTpcclxuICAgIGNhc2UgbmV0d29ya3Muc2FmZWNvaW46XHJcbiAgICBjYXNlIG5ldHdvcmtzLmtvbW9kbzpcclxuICAgIGNhc2UgbmV0d29ya3MuemVsY2FzaDpcclxuICAgIGNhc2UgbmV0d29ya3MuZmx1eDpcclxuICAgIGNhc2UgbmV0d29ya3MuemVybzpcclxuICAgIGNhc2UgbmV0d29ya3Muc25vd2dlbTpcclxuICAgIGNhc2UgbmV0d29ya3MuZ2VtbGluazpcclxuICAgIGNhc2UgbmV0d29ya3MuY29tbWVyY2l1bTpcclxuICAgIGNhc2UgbmV0d29ya3MuemNsYXNzaWM6XHJcbiAgICBjYXNlIG5ldHdvcmtzLmJ6ZWRnZTpcclxuICAgIGNhc2UgbmV0d29ya3MuZ2VuZXNpczpcclxuICAgIGNhc2UgbmV0d29ya3MuYml0Y29pbnplcm86XHJcbiAgICBjYXNlIG5ldHdvcmtzLmJpdGNvaW56OlxyXG4gICAgY2FzZSBuZXR3b3Jrcy5odXNoOlxyXG4gICAgY2FzZSBuZXR3b3Jrcy5yYXZlbmNvaW46XHJcbiAgICBjYXNlIG5ldHdvcmtzLmJpdGNvcmU6XHJcbiAgICBjYXNlIG5ldHdvcmtzLnpjb2luOlxyXG4gICAgY2FzZSBuZXR3b3Jrcy5heGU6XHJcbiAgICBjYXNlIG5ldHdvcmtzLmRpZ2lieXRlOlxyXG4gICAgY2FzZSBuZXR3b3Jrcy5zaW5vdmF0ZTpcclxuICAgIGNhc2UgbmV0d29ya3MuaWxjb2luOlxyXG4gICAgY2FzZSBuZXR3b3Jrcy5yYXB0b3JldW06XHJcbiAgICBjYXNlIG5ldHdvcmtzLnZlcnRjb2luOlxyXG4gICAgY2FzZSBuZXR3b3Jrcy5jbG9yZTpcclxuICAgIGNhc2UgbmV0d29ya3MuZWNhc2g6XHJcbiAgICAgIHJldHVybiBVdHhvUHNidC5mcm9tVHJhbnNhY3Rpb24odHgsIHByZXZPdXRzKTtcclxuICAgIGNhc2UgbmV0d29ya3MubGl0ZWNvaW46XHJcbiAgICAgIHJldHVybiBMaXRlY29pblBzYnQuZnJvbVRyYW5zYWN0aW9uKHR4LCBwcmV2T3V0cyk7XHJcbiAgICBjYXNlIG5ldHdvcmtzLmRhc2g6XHJcbiAgICAgIHJldHVybiBEYXNoUHNidC5mcm9tVHJhbnNhY3Rpb24odHgsIHByZXZPdXRzKTtcclxuICAgIGNhc2UgbmV0d29ya3MuemNhc2g6XHJcbiAgICAgIHJldHVybiBaY2FzaFBzYnQuZnJvbVRyYW5zYWN0aW9uKHR4LCBwcmV2T3V0cyk7XHJcbiAgfVxyXG5cclxuICAvKiBpc3RhbmJ1bCBpZ25vcmUgbmV4dCAqL1xyXG4gIHRocm93IG5ldyBFcnJvcihgaW52YWxpZCBuZXR3b3JrYCk7XHJcbn1cclxuXHJcbmV4cG9ydCBmdW5jdGlvbiBnZXREZWZhdWx0VHJhbnNhY3Rpb25WZXJzaW9uKG5ldHdvcms6IE5ldHdvcmspOiBudW1iZXIge1xyXG4gIHN3aXRjaCAoZ2V0TWFpbm5ldChuZXR3b3JrKSkge1xyXG4gICAgY2FzZSBuZXR3b3Jrcy5iaXRjb2luY2FzaDpcclxuICAgIGNhc2UgbmV0d29ya3MuYml0Y29pbnN2OlxyXG4gICAgY2FzZSBuZXR3b3Jrcy5iaXRjb2luZ29sZDpcclxuICAgIGNhc2UgbmV0d29ya3MuZWNhc2g6XHJcbiAgICAgIHJldHVybiAyO1xyXG4gICAgY2FzZSBuZXR3b3Jrcy56Y2FzaDpcclxuICAgICAgcmV0dXJuIFpjYXNoVHJhbnNhY3Rpb24uVkVSU0lPTjRfQlJBTkNIX05VNTtcclxuICAgIGRlZmF1bHQ6XHJcbiAgICAgIHJldHVybiAxO1xyXG4gIH1cclxufVxyXG5cclxuZXhwb3J0IGZ1bmN0aW9uIHNldFRyYW5zYWN0aW9uQnVpbGRlckRlZmF1bHRzPFROdW1iZXIgZXh0ZW5kcyBudW1iZXIgfCBiaWdpbnQ+KFxyXG4gIHR4YjogVXR4b1RyYW5zYWN0aW9uQnVpbGRlcjxUTnVtYmVyPixcclxuICBuZXR3b3JrOiBOZXR3b3JrLFxyXG4gIHsgdmVyc2lvbiA9IGdldERlZmF1bHRUcmFuc2FjdGlvblZlcnNpb24obmV0d29yaykgfTogeyB2ZXJzaW9uPzogbnVtYmVyIH0gPSB7fVxyXG4pOiB2b2lkIHtcclxuICBzd2l0Y2ggKGdldE1haW5uZXQobmV0d29yaykpIHtcclxuICAgIGNhc2UgbmV0d29ya3MuYml0Y29pbmNhc2g6XHJcbiAgICBjYXNlIG5ldHdvcmtzLmJpdGNvaW5zdjpcclxuICAgIGNhc2UgbmV0d29ya3MuYml0Y29pbmdvbGQ6XHJcbiAgICBjYXNlIG5ldHdvcmtzLmVjYXNoOlxyXG4gICAgICBpZiAodmVyc2lvbiAhPT0gMikge1xyXG4gICAgICAgIHRocm93IG5ldyBFcnJvcihgaW52YWxpZCB2ZXJzaW9uYCk7XHJcbiAgICAgIH1cclxuICAgICAgdHhiLnNldFZlcnNpb24odmVyc2lvbik7XHJcbiAgICAgIGJyZWFrO1xyXG4gICAgY2FzZSBuZXR3b3Jrcy56Y2FzaDpcclxuICAgICAgKHR4YiBhcyBaY2FzaFRyYW5zYWN0aW9uQnVpbGRlcjxUTnVtYmVyPikuc2V0RGVmYXVsdHNGb3JWZXJzaW9uKG5ldHdvcmssIHZlcnNpb24pO1xyXG4gICAgICBicmVhaztcclxuICAgIGRlZmF1bHQ6XHJcbiAgICAgIGlmICh2ZXJzaW9uICE9PSAxKSB7XHJcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yKGBpbnZhbGlkIHZlcnNpb25gKTtcclxuICAgICAgfVxyXG4gIH1cclxufVxyXG5cclxuZXhwb3J0IGZ1bmN0aW9uIHNldFBzYnREZWZhdWx0cyhcclxuICBwc2J0OiBVdHhvUHNidCxcclxuICBuZXR3b3JrOiBOZXR3b3JrLFxyXG4gIHsgdmVyc2lvbiA9IGdldERlZmF1bHRUcmFuc2FjdGlvblZlcnNpb24obmV0d29yaykgfTogeyB2ZXJzaW9uPzogbnVtYmVyIH0gPSB7fVxyXG4pOiB2b2lkIHtcclxuICBzd2l0Y2ggKGdldE1haW5uZXQobmV0d29yaykpIHtcclxuICAgIGNhc2UgbmV0d29ya3MuYml0Y29pbmNhc2g6XHJcbiAgICBjYXNlIG5ldHdvcmtzLmJpdGNvaW5zdjpcclxuICAgIGNhc2UgbmV0d29ya3MuYml0Y29pbmdvbGQ6XHJcbiAgICBjYXNlIG5ldHdvcmtzLmVjYXNoOlxyXG4gICAgICBpZiAodmVyc2lvbiAhPT0gMikge1xyXG4gICAgICAgIHRocm93IG5ldyBFcnJvcihgaW52YWxpZCB2ZXJzaW9uYCk7XHJcbiAgICAgIH1cclxuICAgICAgYnJlYWs7XHJcbiAgICBjYXNlIG5ldHdvcmtzLnpjYXNoOlxyXG4gICAgICBpZiAoXHJcbiAgICAgICAgIVtcclxuICAgICAgICAgIFpjYXNoVHJhbnNhY3Rpb24uVkVSU0lPTjRfQlJBTkNIX0NBTk9QWSxcclxuICAgICAgICAgIFpjYXNoVHJhbnNhY3Rpb24uVkVSU0lPTjRfQlJBTkNIX05VNSxcclxuICAgICAgICAgIFpjYXNoVHJhbnNhY3Rpb24uVkVSU0lPTjVfQlJBTkNIX05VNSxcclxuICAgICAgICBdLmluY2x1ZGVzKHZlcnNpb24pXHJcbiAgICAgICkge1xyXG4gICAgICAgIHRocm93IG5ldyBFcnJvcihgaW52YWxpZCB2ZXJzaW9uYCk7XHJcbiAgICAgIH1cclxuICAgICAgKHBzYnQgYXMgWmNhc2hQc2J0KS5zZXREZWZhdWx0c0ZvclZlcnNpb24obmV0d29yaywgdmVyc2lvbik7XHJcbiAgICAgIGJyZWFrO1xyXG4gICAgZGVmYXVsdDpcclxuICAgICAgaWYgKHZlcnNpb24gIT09IDEpIHtcclxuICAgICAgICB0aHJvdyBuZXcgRXJyb3IoYGludmFsaWQgdmVyc2lvbmApO1xyXG4gICAgICB9XHJcbiAgICAgIC8vIEZJWE1FOiBzZXQgdmVyc2lvbiBoZXJlLCBiZWNhdXNlIHRoZXJlJ3MgYSBidWcgaW4gdGhlIHVwc3RyZWFtIFBTQlRcclxuICAgICAgLy8gdGhhdCBkZWZhdWx0cyB0cmFuc2FjdGlvbnMgdG8gdjIuXHJcbiAgICAgIHBzYnQuc2V0VmVyc2lvbih2ZXJzaW9uKTtcclxuICB9XHJcbn1cclxuXHJcbmV4cG9ydCBmdW5jdGlvbiBjcmVhdGVQc2J0Rm9yTmV0d29yayhwc2J0T3B0czogUHNidE9wdHMsIHsgdmVyc2lvbiB9OiB7IHZlcnNpb24/OiBudW1iZXIgfSA9IHt9KTogVXR4b1BzYnQge1xyXG4gIGxldCBwc2J0O1xyXG5cclxuICBzd2l0Y2ggKGdldE1haW5uZXQocHNidE9wdHMubmV0d29yaykpIHtcclxuICAgIGNhc2UgbmV0d29ya3MuYml0Y29pbjpcclxuICAgIGNhc2UgbmV0d29ya3MuYml0Y29pbmNhc2g6XHJcbiAgICBjYXNlIG5ldHdvcmtzLmJpdGNvaW5zdjpcclxuICAgIGNhc2UgbmV0d29ya3MuYml0Y29pbmdvbGQ6XHJcbiAgICBjYXNlIG5ldHdvcmtzLmRvZ2Vjb2luOlxyXG4gICAgY2FzZSBuZXR3b3Jrcy5iaXRoZXJldW06XHJcbiAgICBjYXNlIG5ldHdvcmtzLnNhZmVjb2luOlxyXG4gICAgY2FzZSBuZXR3b3Jrcy5rb21vZG86XHJcbiAgICBjYXNlIG5ldHdvcmtzLnplbGNhc2g6XHJcbiAgICBjYXNlIG5ldHdvcmtzLmZsdXg6XHJcbiAgICBjYXNlIG5ldHdvcmtzLnplcm86XHJcbiAgICBjYXNlIG5ldHdvcmtzLnNub3dnZW06XHJcbiAgICBjYXNlIG5ldHdvcmtzLmdlbWxpbms6XHJcbiAgICBjYXNlIG5ldHdvcmtzLmNvbW1lcmNpdW06XHJcbiAgICBjYXNlIG5ldHdvcmtzLnpjbGFzc2ljOlxyXG4gICAgY2FzZSBuZXR3b3Jrcy5iemVkZ2U6XHJcbiAgICBjYXNlIG5ldHdvcmtzLmdlbmVzaXM6XHJcbiAgICBjYXNlIG5ldHdvcmtzLmJpdGNvaW56ZXJvOlxyXG4gICAgY2FzZSBuZXR3b3Jrcy5iaXRjb2luejpcclxuICAgIGNhc2UgbmV0d29ya3MuaHVzaDpcclxuICAgIGNhc2UgbmV0d29ya3MucmF2ZW5jb2luOlxyXG4gICAgY2FzZSBuZXR3b3Jrcy5iaXRjb3JlOlxyXG4gICAgY2FzZSBuZXR3b3Jrcy56Y29pbjpcclxuICAgIGNhc2UgbmV0d29ya3MuYXhlOlxyXG4gICAgY2FzZSBuZXR3b3Jrcy5kaWdpYnl0ZTpcclxuICAgIGNhc2UgbmV0d29ya3Muc2lub3ZhdGU6XHJcbiAgICBjYXNlIG5ldHdvcmtzLmlsY29pbjpcclxuICAgIGNhc2UgbmV0d29ya3MucmFwdG9yZXVtOlxyXG4gICAgY2FzZSBuZXR3b3Jrcy52ZXJ0Y29pbjpcclxuICAgIGNhc2UgbmV0d29ya3MuY2xvcmU6XHJcbiAgICBjYXNlIG5ldHdvcmtzLmVjYXNoOiB7XHJcbiAgICAgIHBzYnQgPSBVdHhvUHNidC5jcmVhdGVQc2J0KHBzYnRPcHRzKTtcclxuICAgICAgYnJlYWs7XHJcbiAgICB9XHJcbiAgICBjYXNlIG5ldHdvcmtzLmxpdGVjb2luOiB7XHJcbiAgICAgIHBzYnQgPSBMaXRlY29pblBzYnQuY3JlYXRlUHNidChwc2J0T3B0cyk7XHJcbiAgICAgIGJyZWFrO1xyXG4gICAgfVxyXG4gICAgY2FzZSBuZXR3b3Jrcy5kYXNoOiB7XHJcbiAgICAgIHBzYnQgPSBEYXNoUHNidC5jcmVhdGVQc2J0KHBzYnRPcHRzKTtcclxuICAgICAgYnJlYWs7XHJcbiAgICB9XHJcbiAgICBjYXNlIG5ldHdvcmtzLnpjYXNoOiB7XHJcbiAgICAgIHBzYnQgPSBaY2FzaFBzYnQuY3JlYXRlUHNidChwc2J0T3B0cyk7XHJcbiAgICAgIGJyZWFrO1xyXG4gICAgfVxyXG4gICAgZGVmYXVsdDpcclxuICAgICAgdGhyb3cgbmV3IEVycm9yKGB1bnN1cHBvcnRlZCBuZXR3b3JrYCk7XHJcbiAgfVxyXG5cclxuICBzZXRQc2J0RGVmYXVsdHMocHNidCwgcHNidE9wdHMubmV0d29yaywgeyB2ZXJzaW9uIH0pO1xyXG5cclxuICByZXR1cm4gcHNidDtcclxufVxyXG5cclxuZXhwb3J0IGZ1bmN0aW9uIGNyZWF0ZVRyYW5zYWN0aW9uQnVpbGRlckZvck5ldHdvcms8VE51bWJlciBleHRlbmRzIG51bWJlciB8IGJpZ2ludCA9IG51bWJlcj4oXHJcbiAgbmV0d29yazogTmV0d29yayxcclxuICB7IHZlcnNpb24gfTogeyB2ZXJzaW9uPzogbnVtYmVyIH0gPSB7fVxyXG4pOiBVdHhvVHJhbnNhY3Rpb25CdWlsZGVyPFROdW1iZXI+IHtcclxuICBsZXQgdHhiO1xyXG4gIHN3aXRjaCAoZ2V0TWFpbm5ldChuZXR3b3JrKSkge1xyXG4gICAgY2FzZSBuZXR3b3Jrcy5iaXRjb2luOlxyXG4gICAgY2FzZSBuZXR3b3Jrcy5iaXRjb2luY2FzaDpcclxuICAgIGNhc2UgbmV0d29ya3MuYml0Y29pbnN2OlxyXG4gICAgY2FzZSBuZXR3b3Jrcy5iaXRjb2luZ29sZDpcclxuICAgIGNhc2UgbmV0d29ya3MuZG9nZWNvaW46XHJcbiAgICBjYXNlIG5ldHdvcmtzLmJpdGhlcmV1bTpcclxuICAgIGNhc2UgbmV0d29ya3Muc2FmZWNvaW46XHJcbiAgICBjYXNlIG5ldHdvcmtzLmtvbW9kbzpcclxuICAgIGNhc2UgbmV0d29ya3MuemVsY2FzaDpcclxuICAgIGNhc2UgbmV0d29ya3MuZmx1eDpcclxuICAgIGNhc2UgbmV0d29ya3MuemVybzpcclxuICAgIGNhc2UgbmV0d29ya3Muc25vd2dlbTpcclxuICAgIGNhc2UgbmV0d29ya3MuZ2VtbGluazpcclxuICAgIGNhc2UgbmV0d29ya3MuY29tbWVyY2l1bTpcclxuICAgIGNhc2UgbmV0d29ya3MuemNsYXNzaWM6XHJcbiAgICBjYXNlIG5ldHdvcmtzLmJ6ZWRnZTpcclxuICAgIGNhc2UgbmV0d29ya3MuZ2VuZXNpczpcclxuICAgIGNhc2UgbmV0d29ya3MuYml0Y29pbnplcm86XHJcbiAgICBjYXNlIG5ldHdvcmtzLmJpdGNvaW56OlxyXG4gICAgY2FzZSBuZXR3b3Jrcy5odXNoOlxyXG4gICAgY2FzZSBuZXR3b3Jrcy5yYXZlbmNvaW46XHJcbiAgICBjYXNlIG5ldHdvcmtzLmJpdGNvcmU6XHJcbiAgICBjYXNlIG5ldHdvcmtzLnpjb2luOlxyXG4gICAgY2FzZSBuZXR3b3Jrcy5heGU6XHJcbiAgICBjYXNlIG5ldHdvcmtzLmRpZ2lieXRlOlxyXG4gICAgY2FzZSBuZXR3b3Jrcy5zaW5vdmF0ZTpcclxuICAgIGNhc2UgbmV0d29ya3MuaWxjb2luOlxyXG4gICAgY2FzZSBuZXR3b3Jrcy5yYXB0b3JldW06XHJcbiAgICBjYXNlIG5ldHdvcmtzLnZlcnRjb2luOlxyXG4gICAgY2FzZSBuZXR3b3Jrcy5jbG9yZTpcclxuICAgIGNhc2UgbmV0d29ya3MuZWNhc2g6IHtcclxuICAgICAgdHhiID0gbmV3IFV0eG9UcmFuc2FjdGlvbkJ1aWxkZXI8VE51bWJlcj4obmV0d29yayk7XHJcbiAgICAgIGJyZWFrO1xyXG4gICAgfVxyXG4gICAgY2FzZSBuZXR3b3Jrcy5saXRlY29pbjoge1xyXG4gICAgICB0eGIgPSBuZXcgTGl0ZWNvaW5UcmFuc2FjdGlvbkJ1aWxkZXI8VE51bWJlcj4obmV0d29yayk7XHJcbiAgICAgIGJyZWFrO1xyXG4gICAgfVxyXG4gICAgY2FzZSBuZXR3b3Jrcy5kYXNoOlxyXG4gICAgICB0eGIgPSBuZXcgRGFzaFRyYW5zYWN0aW9uQnVpbGRlcjxUTnVtYmVyPihuZXR3b3JrKTtcclxuICAgICAgYnJlYWs7XHJcbiAgICBjYXNlIG5ldHdvcmtzLnpjYXNoOiB7XHJcbiAgICAgIHR4YiA9IG5ldyBaY2FzaFRyYW5zYWN0aW9uQnVpbGRlcjxUTnVtYmVyPihuZXR3b3JrIGFzIFpjYXNoTmV0d29yayk7XHJcbiAgICAgIGJyZWFrO1xyXG4gICAgfVxyXG4gICAgZGVmYXVsdDpcclxuICAgICAgdGhyb3cgbmV3IEVycm9yKGB1bnN1cHBvcnRlZCBuZXR3b3JrYCk7XHJcbiAgfVxyXG5cclxuICBzZXRUcmFuc2FjdGlvbkJ1aWxkZXJEZWZhdWx0czxUTnVtYmVyPih0eGIsIG5ldHdvcmssIHsgdmVyc2lvbiB9KTtcclxuXHJcbiAgcmV0dXJuIHR4YjtcclxufVxyXG5cclxuZXhwb3J0IGZ1bmN0aW9uIGNyZWF0ZVRyYW5zYWN0aW9uQnVpbGRlckZyb21UcmFuc2FjdGlvbjxUTnVtYmVyIGV4dGVuZHMgbnVtYmVyIHwgYmlnaW50PihcclxuICB0eDogVXR4b1RyYW5zYWN0aW9uPFROdW1iZXI+LFxyXG4gIHByZXZPdXRwdXRzPzogVHhPdXRwdXQ8VE51bWJlcj5bXVxyXG4pOiBVdHhvVHJhbnNhY3Rpb25CdWlsZGVyPFROdW1iZXI+IHtcclxuICBzd2l0Y2ggKGdldE1haW5uZXQodHgubmV0d29yaykpIHtcclxuICAgIGNhc2UgbmV0d29ya3MuYml0Y29pbjpcclxuICAgIGNhc2UgbmV0d29ya3MuYml0Y29pbmNhc2g6XHJcbiAgICBjYXNlIG5ldHdvcmtzLmJpdGNvaW5zdjpcclxuICAgIGNhc2UgbmV0d29ya3MuYml0Y29pbmdvbGQ6XHJcbiAgICBjYXNlIG5ldHdvcmtzLmRvZ2Vjb2luOlxyXG4gICAgY2FzZSBuZXR3b3Jrcy5iaXRoZXJldW06XHJcbiAgICBjYXNlIG5ldHdvcmtzLnNhZmVjb2luOlxyXG4gICAgY2FzZSBuZXR3b3Jrcy5rb21vZG86XHJcbiAgICBjYXNlIG5ldHdvcmtzLnplbGNhc2g6XHJcbiAgICBjYXNlIG5ldHdvcmtzLmZsdXg6XHJcbiAgICBjYXNlIG5ldHdvcmtzLnplcm86XHJcbiAgICBjYXNlIG5ldHdvcmtzLnNub3dnZW06XHJcbiAgICBjYXNlIG5ldHdvcmtzLmdlbWxpbms6XHJcbiAgICBjYXNlIG5ldHdvcmtzLmNvbW1lcmNpdW06XHJcbiAgICBjYXNlIG5ldHdvcmtzLnpjbGFzc2ljOlxyXG4gICAgY2FzZSBuZXR3b3Jrcy5iemVkZ2U6XHJcbiAgICBjYXNlIG5ldHdvcmtzLmdlbmVzaXM6XHJcbiAgICBjYXNlIG5ldHdvcmtzLmJpdGNvaW56ZXJvOlxyXG4gICAgY2FzZSBuZXR3b3Jrcy5iaXRjb2luejpcclxuICAgIGNhc2UgbmV0d29ya3MuaHVzaDpcclxuICAgIGNhc2UgbmV0d29ya3MucmF2ZW5jb2luOlxyXG4gICAgY2FzZSBuZXR3b3Jrcy5iaXRjb3JlOlxyXG4gICAgY2FzZSBuZXR3b3Jrcy56Y29pbjpcclxuICAgIGNhc2UgbmV0d29ya3MuYXhlOlxyXG4gICAgY2FzZSBuZXR3b3Jrcy5kaWdpYnl0ZTpcclxuICAgIGNhc2UgbmV0d29ya3Muc2lub3ZhdGU6XHJcbiAgICBjYXNlIG5ldHdvcmtzLmlsY29pbjpcclxuICAgIGNhc2UgbmV0d29ya3MucmFwdG9yZXVtOlxyXG4gICAgY2FzZSBuZXR3b3Jrcy52ZXJ0Y29pbjpcclxuICAgIGNhc2UgbmV0d29ya3MuY2xvcmU6XHJcbiAgICBjYXNlIG5ldHdvcmtzLmVjYXNoOlxyXG4gICAgICByZXR1cm4gVXR4b1RyYW5zYWN0aW9uQnVpbGRlci5mcm9tVHJhbnNhY3Rpb248VE51bWJlcj4odHgsIHVuZGVmaW5lZCwgcHJldk91dHB1dHMpO1xyXG4gICAgY2FzZSBuZXR3b3Jrcy5saXRlY29pbjpcclxuICAgICAgcmV0dXJuIExpdGVjb2luVHJhbnNhY3Rpb25CdWlsZGVyLmZyb21UcmFuc2FjdGlvbjxUTnVtYmVyPihcclxuICAgICAgICB0eCBhcyBMaXRlY29pblRyYW5zYWN0aW9uPFROdW1iZXI+LFxyXG4gICAgICAgIHVuZGVmaW5lZCxcclxuICAgICAgICBwcmV2T3V0cHV0cyBhcyBUeE91dHB1dDxUTnVtYmVyPltdXHJcbiAgICAgICk7XHJcbiAgICBjYXNlIG5ldHdvcmtzLmRhc2g6XHJcbiAgICAgIHJldHVybiBEYXNoVHJhbnNhY3Rpb25CdWlsZGVyLmZyb21UcmFuc2FjdGlvbjxUTnVtYmVyPihcclxuICAgICAgICB0eCBhcyBEYXNoVHJhbnNhY3Rpb248VE51bWJlcj4sXHJcbiAgICAgICAgdW5kZWZpbmVkLFxyXG4gICAgICAgIHByZXZPdXRwdXRzIGFzIFR4T3V0cHV0PFROdW1iZXI+W11cclxuICAgICAgKTtcclxuICAgIGNhc2UgbmV0d29ya3MuemNhc2g6XHJcbiAgICAgIHJldHVybiBaY2FzaFRyYW5zYWN0aW9uQnVpbGRlci5mcm9tVHJhbnNhY3Rpb248VE51bWJlcj4oXHJcbiAgICAgICAgdHggYXMgWmNhc2hUcmFuc2FjdGlvbjxUTnVtYmVyPixcclxuICAgICAgICB1bmRlZmluZWQsXHJcbiAgICAgICAgcHJldk91dHB1dHMgYXMgVHhPdXRwdXQ8VE51bWJlcj5bXVxyXG4gICAgICApO1xyXG4gIH1cclxuXHJcbiAgdGhyb3cgbmV3IEVycm9yKGBpbnZhbGlkIG5ldHdvcmtgKTtcclxufVxyXG4iXX0=
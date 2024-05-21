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
        case networks_1.networks.genesis:
        case networks_1.networks.bitcoinzero:
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
        case networks_1.networks.groestlcoin:
        case networks_1.networks.ecash:
            return UtxoTransaction_1.UtxoTransaction.fromBuffer(buf, false, amountType, network);
        case networks_1.networks.litecoin:
            return litecoin_1.LitecoinTransaction.fromBuffer(buf, false, amountType, network);
        case networks_1.networks.dash:
            return DashTransaction_1.DashTransaction.fromBuffer(buf, false, amountType, network);
        case networks_1.networks.zelcash:
        case networks_1.networks.flux:
        case networks_1.networks.zero:
        case networks_1.networks.snowgem:
        case networks_1.networks.safecoin:
        case networks_1.networks.komodo:
        case networks_1.networks.gemlink:
        case networks_1.networks.commercium:
        case networks_1.networks.zclassic:
        case networks_1.networks.bzedge:
        case networks_1.networks.bitcoinz:
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
        case networks_1.networks.genesis:
        case networks_1.networks.bitcoinzero:
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
        case networks_1.networks.zelcash:
        case networks_1.networks.flux:
        case networks_1.networks.zero:
        case networks_1.networks.snowgem:
        case networks_1.networks.safecoin:
        case networks_1.networks.komodo:
        case networks_1.networks.gemlink:
        case networks_1.networks.commercium:
        case networks_1.networks.zclassic:
        case networks_1.networks.bzedge:
        case networks_1.networks.bitcoinz:
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
        case networks_1.networks.genesis:
        case networks_1.networks.bitcoinzero:
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
        case networks_1.networks.zelcash:
        case networks_1.networks.flux:
        case networks_1.networks.zero:
        case networks_1.networks.snowgem:
        case networks_1.networks.safecoin:
        case networks_1.networks.komodo:
        case networks_1.networks.gemlink:
        case networks_1.networks.commercium:
        case networks_1.networks.zclassic:
        case networks_1.networks.bzedge:
        case networks_1.networks.bitcoinz:
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
        case networks_1.networks.zelcash:
        case networks_1.networks.flux:
        case networks_1.networks.zero:
        case networks_1.networks.snowgem:
        case networks_1.networks.safecoin:
        case networks_1.networks.komodo:
        case networks_1.networks.gemlink:
        case networks_1.networks.commercium:
        case networks_1.networks.zclassic:
        case networks_1.networks.bzedge:
        case networks_1.networks.bitcoinz:
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
        case networks_1.networks.zelcash:
        case networks_1.networks.flux:
        case networks_1.networks.zero:
        case networks_1.networks.snowgem:
        case networks_1.networks.safecoin:
        case networks_1.networks.komodo:
        case networks_1.networks.gemlink:
        case networks_1.networks.commercium:
        case networks_1.networks.zclassic:
        case networks_1.networks.bzedge:
        case networks_1.networks.bitcoinz:
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
        case networks_1.networks.zelcash:
        case networks_1.networks.flux:
        case networks_1.networks.zero:
        case networks_1.networks.snowgem:
        case networks_1.networks.safecoin:
        case networks_1.networks.komodo:
        case networks_1.networks.gemlink:
        case networks_1.networks.commercium:
        case networks_1.networks.zclassic:
        case networks_1.networks.bzedge:
        case networks_1.networks.bitcoinz:
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
        case networks_1.networks.genesis:
        case networks_1.networks.bitcoinzero:
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
        case networks_1.networks.zelcash:
        case networks_1.networks.flux:
        case networks_1.networks.zero:
        case networks_1.networks.snowgem:
        case networks_1.networks.safecoin:
        case networks_1.networks.komodo:
        case networks_1.networks.gemlink:
        case networks_1.networks.commercium:
        case networks_1.networks.zclassic:
        case networks_1.networks.bzedge:
        case networks_1.networks.bitcoinz:
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
        case networks_1.networks.genesis:
        case networks_1.networks.bitcoinzero:
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
        case networks_1.networks.groestlcoin:
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
        case networks_1.networks.zelcash:
        case networks_1.networks.flux:
        case networks_1.networks.zero:
        case networks_1.networks.snowgem:
        case networks_1.networks.safecoin:
        case networks_1.networks.komodo:
        case networks_1.networks.gemlink:
        case networks_1.networks.commercium:
        case networks_1.networks.zclassic:
        case networks_1.networks.bzedge:
        case networks_1.networks.bitcoinz:
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
        case networks_1.networks.genesis:
        case networks_1.networks.bitcoinzero:
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
        case networks_1.networks.groestlcoin:
        case networks_1.networks.ecash:
            return UtxoTransactionBuilder_1.UtxoTransactionBuilder.fromTransaction(tx, undefined, prevOutputs);
        case networks_1.networks.litecoin:
            return litecoin_1.LitecoinTransactionBuilder.fromTransaction(tx, undefined, prevOutputs);
        case networks_1.networks.dash:
            return DashTransactionBuilder_1.DashTransactionBuilder.fromTransaction(tx, undefined, prevOutputs);
        case networks_1.networks.zelcash:
        case networks_1.networks.flux:
        case networks_1.networks.zero:
        case networks_1.networks.snowgem:
        case networks_1.networks.safecoin:
        case networks_1.networks.komodo:
        case networks_1.networks.gemlink:
        case networks_1.networks.commercium:
        case networks_1.networks.zclassic:
        case networks_1.networks.bzedge:
        case networks_1.networks.bitcoinz:
        case networks_1.networks.zcash:
            return ZcashTransactionBuilder_1.ZcashTransactionBuilder.fromTransaction(tx, undefined, prevOutputs);
    }
    throw new Error(`invalid network`);
}
exports.createTransactionBuilderFromTransaction = createTransactionBuilderFromTransaction;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidHJhbnNhY3Rpb24uanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi9zcmMvYml0Z28vdHJhbnNhY3Rpb24udHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7O0FBR0EsMENBQTREO0FBRTVELHlDQUFnRDtBQUNoRCx1REFBb0Q7QUFDcEQscUVBQWtFO0FBQ2xFLDhDQUEyQztBQUMzQyw0REFBeUQ7QUFDekQsMEVBQXVFO0FBQ3ZFLGlEQUE4QztBQUM5Qyw2RUFBMEU7QUFDMUUsK0RBQTBFO0FBQzFFLHlDQUEyRjtBQVkzRixTQUFnQiwyQkFBMkIsQ0FDekMsR0FBVyxFQUNYLE9BQWdCLEVBQ2hCLEVBQUUsT0FBTyxFQUFFLFVBQVUsS0FBNkQsRUFBRSxFQUNwRixvQkFBMEM7SUFFMUMsSUFBSSxVQUFVLEVBQUU7UUFDZCxJQUFJLG9CQUFvQixJQUFJLFVBQVUsS0FBSyxvQkFBb0IsRUFBRTtZQUMvRCxNQUFNLElBQUksS0FBSyxDQUFDLG1CQUFtQixDQUFDLENBQUM7U0FDdEM7S0FDRjtTQUFNO1FBQ0wsSUFBSSxvQkFBb0IsRUFBRTtZQUN4QixVQUFVLEdBQUcsb0JBQW9CLENBQUM7U0FDbkM7YUFBTTtZQUNMLFVBQVUsR0FBRyxRQUFRLENBQUM7U0FDdkI7S0FDRjtJQUNELFFBQVEsSUFBQSxxQkFBVSxFQUFDLE9BQU8sQ0FBQyxFQUFFO1FBQzNCLEtBQUssbUJBQVEsQ0FBQyxPQUFPLENBQUM7UUFDdEIsS0FBSyxtQkFBUSxDQUFDLFdBQVcsQ0FBQztRQUMxQixLQUFLLG1CQUFRLENBQUMsU0FBUyxDQUFDO1FBQ3hCLEtBQUssbUJBQVEsQ0FBQyxXQUFXLENBQUM7UUFDMUIsS0FBSyxtQkFBUSxDQUFDLFFBQVEsQ0FBQztRQUN2QixLQUFLLG1CQUFRLENBQUMsU0FBUyxDQUFDO1FBQ3hCLEtBQUssbUJBQVEsQ0FBQyxPQUFPLENBQUM7UUFDdEIsS0FBSyxtQkFBUSxDQUFDLFdBQVcsQ0FBQztRQUMxQixLQUFLLG1CQUFRLENBQUMs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QyxFQUNsQyxTQUFTLEVBQ1QsV0FBa0MsQ0FDbkMsQ0FBQztRQUNKLEtBQUssbUJBQVEsQ0FBQyxJQUFJO1lBQ2hCLE9BQU8sK0NBQXNCLENBQUMsZUFBZSxDQUMzQyxFQUE4QixFQUM5QixTQUFTLEVBQ1QsV0FBa0MsQ0FDbkMsQ0FBQztRQUNKLEtBQUssbUJBQVEsQ0FBQyxPQUFPLENBQUM7UUFDdEIsS0FBSyxtQkFBUSxDQUFDLElBQUksQ0FBQztRQUNuQixLQUFLLG1CQUFRLENBQUMsSUFBSSxDQUFDO1FBQ25CLEtBQUssbUJBQVEsQ0FBQyxPQUFPLENBQUM7UUFDdEIsS0FBSyxtQkFBUSxDQUFDLFFBQVEsQ0FBQztRQUN2QixLQUFLLG1CQUFRLENBQUMsTUFBTSxDQUFDO1FBQ3JCLEtBQUssbUJBQVEsQ0FBQyxPQUFPLENBQUM7UUFDdEIsS0FBSyxtQkFBUSxDQUFDLFVBQVUsQ0FBQztRQUN6QixLQUFLLG1CQUFRLENBQUMsUUFBUSxDQUFDO1FBQ3ZCLEtBQUssbUJBQVEsQ0FBQyxNQUFNLENBQUM7UUFDckIsS0FBSyxtQkFBUSxDQUFDLFFBQVEsQ0FBQztRQUN2QixLQUFLLG1CQUFRLENBQUMsS0FBSztZQUNqQixPQUFPLGlEQUF1QixDQUFDLGVBQWUsQ0FDNUMsRUFBK0IsRUFDL0IsU0FBUyxFQUNULFdBQWtDLENBQ25DLENBQUM7S0FDTDtJQUVELE1BQU0sSUFBSSxLQUFLLENBQUMsaUJBQWlCLENBQUMsQ0FBQztBQUNyQyxDQUFDO0FBM0RELDBGQTJEQyIsInNvdXJjZXNDb250ZW50IjpbIi8qIGVzbGludCBuby1yZWRlY2xhcmU6IDAgKi9cclxuaW1wb3J0IHsgVHhPdXRwdXQgfSBmcm9tICdiaXRjb2luanMtbGliJztcclxuXHJcbmltcG9ydCB7IG5ldHdvcmtzLCBOZXR3b3JrLCBnZXRNYWlubmV0IH0gZnJvbSAnLi4vbmV0d29ya3MnO1xyXG5cclxuaW1wb3J0IHsgVXR4b1BzYnQsIFBzYnRPcHRzIH0gZnJvbSAnLi9VdHhvUHNidCc7XHJcbmltcG9ydCB7IFV0eG9UcmFuc2FjdGlvbiB9IGZyb20gJy4vVXR4b1RyYW5zYWN0aW9uJztcclxuaW1wb3J0IHsgVXR4b1RyYW5zYWN0aW9uQnVpbGRlciB9IGZyb20gJy4vVXR4b1RyYW5zYWN0aW9uQnVpbGRlcic7XHJcbmltcG9ydCB7IERhc2hQc2J0IH0gZnJvbSAnLi9kYXNoL0Rhc2hQc2J0JztcclxuaW1wb3J0IHsgRGFzaFRyYW5zYWN0aW9uIH0gZnJvbSAnLi9kYXNoL0Rhc2hUcmFuc2FjdGlvbic7XHJcbmltcG9ydCB7IERhc2hUcmFuc2FjdGlvbkJ1aWxkZXIgfSBmcm9tICcuL2Rhc2gvRGFzaFRyYW5zYWN0aW9uQnVpbGRlcic7XHJcbmltcG9ydCB7IFpjYXNoUHNidCB9IGZyb20gJy4vemNhc2gvWmNhc2hQc2J0JztcclxuaW1wb3J0IHsgWmNhc2hUcmFuc2FjdGlvbkJ1aWxkZXIgfSBmcm9tICcuL3pjYXNoL1pjYXNoVHJhbnNhY3Rpb25CdWlsZGVyJztcclxuaW1wb3J0IHsgWmNhc2hOZXR3b3JrLCBaY2FzaFRyYW5zYWN0aW9uIH0gZnJvbSAnLi96Y2FzaC9aY2FzaFRyYW5zYWN0aW9uJztcclxuaW1wb3J0IHsgTGl0ZWNvaW5Qc2J0LCBMaXRlY29pblRyYW5zYWN0aW9uLCBMaXRlY29pblRyYW5zYWN0aW9uQnVpbGRlciB9IGZyb20gJy4vbGl0ZWNvaW4nO1xyXG5cclxuZXhwb3J0IGZ1bmN0aW9uIGNyZWF0ZVRyYW5zYWN0aW9uRnJvbUJ1ZmZlcihcclxuICBidWY6IEJ1ZmZlcixcclxuICBuZXR3b3JrOiBOZXR3b3JrLFxyXG4gIHBhcmFtczogeyB2ZXJzaW9uPzogbnVtYmVyOyBhbW91bnRUeXBlOiAnYmlnaW50JyB9XHJcbik6IFV0eG9UcmFuc2FjdGlvbjxiaWdpbnQ+O1xyXG5leHBvcnQgZnVuY3Rpb24gY3JlYXRlVHJhbnNhY3Rpb25Gcm9tQnVmZmVyPFROdW1iZXIgZXh0ZW5kcyBudW1iZXIgfCBiaWdpbnQ+KFxyXG4gIGJ1ZjogQnVmZmVyLFxyXG4gIG5ldHdvcms6IE5ldHdvcmssXHJcbiAgcGFyYW1zPzogeyB2ZXJzaW9uPzogbnVtYmVyOyBhbW91bnRUeXBlPzogJ251bWJlcicgfCAnYmlnaW50JyB9XHJcbik6IFV0eG9UcmFuc2FjdGlvbjxUTnVtYmVyPjtcclxuZXhwb3J0IGZ1bmN0aW9uIGNyZWF0ZVRyYW5zYWN0aW9uRnJvbUJ1ZmZlcjxUTnVtYmVyIGV4dGVuZHMgbnVtYmVyIHwgYmlnaW50ID0gbnVtYmVyPihcclxuICBidWY6IEJ1ZmZlcixcclxuICBuZXR3b3JrOiBOZXR3b3JrLFxyXG4gIHsgdmVyc2lvbiwgYW1vdW50VHlwZSB9OiB7IHZlcnNpb24/OiBudW1iZXI7IGFtb3VudFR5cGU/OiAnbnVtYmVyJyB8ICdiaWdpbnQnIH0gPSB7fSxcclxuICBkZXByZWNhdGVkQW1vdW50VHlwZT86ICdudW1iZXInIHwgJ2JpZ2ludCdcclxuKTogVXR4b1RyYW5zYWN0aW9uPFROdW1iZXI+IHtcclxuICBpZiAoYW1vdW50VHlwZSkge1xyXG4gICAgaWYgKGRlcHJlY2F0ZWRBbW91bnRUeXBlICYmIGFtb3VudFR5cGUgIT09IGRlcHJlY2F0ZWRBbW91bnRUeXBlKSB7XHJcbiAgICAgIHRocm93IG5ldyBFcnJvcihgaW52YWxpZCBhcmd1bWVudHNgKTtcclxuICAgIH1cclxuICB9IGVsc2Uge1xyXG4gICAgaWYgKGRlcHJlY2F0ZWRBbW91bnRUeXBlKSB7XHJcbiAgICAgIGFtb3VudFR5cGUgPSBkZXByZWNhdGVkQW1vdW50VHlwZTtcclxuICAgIH0gZWxzZSB7XHJcbiAgICAgIGFtb3VudFR5cGUgPSAnbnVtYmVyJztcclxuICAgIH1cclxuICB9XHJcbiAgc3dpdGNoIChnZXRNYWlubmV0KG5ldHdvcmspKSB7XHJcbiAgICBjYXNlIG5ldHdvcmtzLmJpdGNvaW46XHJcbiAgICBjYXNlIG5ldHdvcmtzLmJpdGNvaW5jYXNoOlxyXG4gICAgY2FzZSBuZXR3b3Jrcy5iaXRjb2luc3Y6XHJcbiAgICBjYXNlIG5ldHdvcmtzLmJpdGNvaW5nb2xkOlxyXG4gICAgY2FzZSBuZXR3b3Jrcy5kb2dlY29pbjpcclxuICAgIGNhc2UgbmV0d29ya3MuYml0aGVyZXVtOlxyXG4gICAgY2FzZSBuZXR3b3Jrcy5nZW5lc2lzOlxyXG4gICAgY2FzZSBuZXR3b3Jrcy5iaXRjb2luemVybzpcclxuICAgIGNhc2UgbmV0d29ya3MuaHVzaDpcclxuICAgIGNhc2UgbmV0d29ya3MucmF2ZW5jb2luOlxyXG4gICAgY2FzZSBuZXR3b3Jrcy5iaXRjb3JlOlxyXG4gICAgY2FzZSBuZXR3b3Jrcy56Y29pbjpcclxuICAgIGNhc2UgbmV0d29ya3MuYXhlOlxyXG4gICAgY2FzZSBuZXR3b3Jrcy5kaWdpYnl0ZTpcclxuICAgIGNhc2UgbmV0d29ya3Muc2lub3ZhdGU6XHJcbiAgICBjYXNlIG5ldHdvcmtzLmlsY29pbjpcclxuICAgIGNhc2UgbmV0d29ya3MucmFwdG9yZXVtOlxyXG4gICAgY2FzZSBuZXR3b3Jrcy52ZXJ0Y29pbjpcclxuICAgIGNhc2UgbmV0d29ya3MuY2xvcmU6XHJcbiAgICBjYXNlIG5ldHdvcmtzLmdyb2VzdGxjb2luOlxyXG4gICAgY2FzZSBuZXR3b3Jrcy5lY2FzaDpcclxuICAgICAgcmV0dXJuIFV0eG9UcmFuc2FjdGlvbi5mcm9tQnVmZmVyPFROdW1iZXI+KGJ1ZiwgZmFsc2UsIGFtb3VudFR5cGUsIG5ldHdvcmspO1xyXG4gICAgY2FzZSBuZXR3b3Jrcy5saXRlY29pbjpcclxuICAgICAgcmV0dXJuIExpdGVjb2luVHJhbnNhY3Rpb24uZnJvbUJ1ZmZlcjxUTnVtYmVyPihidWYsIGZhbHNlLCBhbW91bnRUeXBlLCBuZXR3b3JrKTtcclxuICAgIGNhc2UgbmV0d29ya3MuZGFzaDpcclxuICAgICAgcmV0dXJuIERhc2hUcmFuc2FjdGlvbi5mcm9tQnVmZmVyPFROdW1iZXI+KGJ1ZiwgZmFsc2UsIGFtb3VudFR5cGUsIG5ldHdvcmspO1xyXG4gICAgY2FzZSBuZXR3b3Jrcy56ZWxjYXNoOlxyXG4gICAgY2FzZSBuZXR3b3Jrcy5mbHV4OlxyXG4gICAgY2FzZSBuZXR3b3Jrcy56ZXJvOlxyXG4gICAgY2FzZSBuZXR3b3Jrcy5zbm93Z2VtOlxyXG4gICAgY2FzZSBuZXR3b3Jrcy5zYWZlY29pbjpcclxuICAgIGNhc2UgbmV0d29ya3Mua29tb2RvOlxyXG4gICAgY2FzZSBuZXR3b3Jrcy5nZW1saW5rOlxyXG4gICAgY2FzZSBuZXR3b3Jrcy5jb21tZXJjaXVtOlxyXG4gICAgY2FzZSBuZXR3b3Jrcy56Y2xhc3NpYzpcclxuICAgIGNhc2UgbmV0d29ya3MuYnplZGdlOlxyXG4gICAgY2FzZSBuZXR3b3Jrcy5iaXRjb2luejpcclxuICAgIGNhc2UgbmV0d29ya3MuemNhc2g6XHJcbiAgICAgIHJldHVybiBaY2FzaFRyYW5zYWN0aW9uLmZyb21CdWZmZXJXaXRoVmVyc2lvbjxUTnVtYmVyPihidWYsIG5ldHdvcmsgYXMgWmNhc2hOZXR3b3JrLCB2ZXJzaW9uLCBhbW91bnRUeXBlKTtcclxuICB9XHJcblxyXG4gIC8qIGlzdGFuYnVsIGlnbm9yZSBuZXh0ICovXHJcbiAgdGhyb3cgbmV3IEVycm9yKGBpbnZhbGlkIG5ldHdvcmtgKTtcclxufVxyXG5cclxuLyogaXN0YW5idWwgaWdub3JlIG5leHQgKi9cclxuLyoqIEBkZXByZWNhdGVkIC0gdXNlIGNyZWF0ZVRyYW5zYWN0aW9uRnJvbUJ1ZmZlciBpbnN0ZWFkICovXHJcbmV4cG9ydCBmdW5jdGlvbiBjcmVhdGVUcmFuc2FjdGlvbkZyb21IZXgoXHJcbiAgaGV4OiBzdHJpbmcsXHJcbiAgbmV0d29yazogTmV0d29yayxcclxuICBwOiB7IGFtb3VudFR5cGU6ICdiaWdpbnQnIH1cclxuKTogVXR4b1RyYW5zYWN0aW9uPGJpZ2ludD47XHJcbi8qKiBAZGVwcmVjYXRlZCAtIHVzZSBjcmVhdGVUcmFuc2FjdGlvbkZyb21CdWZmZXIgaW5zdGVhZCAqL1xyXG5leHBvcnQgZnVuY3Rpb24gY3JlYXRlVHJhbnNhY3Rpb25Gcm9tSGV4KGhleDogc3RyaW5nLCBuZXR3b3JrOiBOZXR3b3JrLCBwOiB7IGFtb3VudFR5cGU6ICdudW1iZXInIH0pOiBVdHhvVHJhbnNhY3Rpb247XHJcbi8qKiBAZGVwcmVjYXRlZCAtIHVzZSBjcmVhdGVUcmFuc2FjdGlvbkZyb21CdWZmZXIgaW5zdGVhZCAqL1xyXG5leHBvcnQgZnVuY3Rpb24gY3JlYXRlVHJhbnNhY3Rpb25Gcm9tSGV4PFROdW1iZXIgZXh0ZW5kcyBudW1iZXIgfCBiaWdpbnQgPSBudW1iZXI+KFxyXG4gIGhleDogc3RyaW5nLFxyXG4gIG5ldHdvcms6IE5ldHdvcmssXHJcbiAgcD86IHsgYW1vdW50VHlwZT86ICdudW1iZXInIHwgJ2JpZ2ludCcgfSB8ICdudW1iZXInIHwgJ2JpZ2ludCdcclxuKTogVXR4b1RyYW5zYWN0aW9uPFROdW1iZXI+O1xyXG5leHBvcnQgZnVuY3Rpb24gY3JlYXRlVHJhbnNhY3Rpb25Gcm9tSGV4PFROdW1iZXIgZXh0ZW5kcyBudW1iZXIgfCBiaWdpbnQgPSBudW1iZXI+KFxyXG4gIGhleDogc3RyaW5nLFxyXG4gIG5ldHdvcms6IE5ldHdvcmssXHJcbiAgcD86IHsgYW1vdW50VHlwZT86ICdudW1iZXInIHwgJ2JpZ2ludCcgfSB8ICdudW1iZXInIHwgJ2JpZ2ludCdcclxuKTogVXR4b1RyYW5zYWN0aW9uPFROdW1iZXI+IHtcclxuICBpZiAodHlwZW9mIHAgPT09ICdzdHJpbmcnKSB7XHJcbiAgICBwID0geyBhbW91bnRUeXBlOiBwIH07XHJcbiAgfVxyXG4gIHJldHVybiBjcmVhdGVUcmFuc2FjdGlvbkZyb21CdWZmZXI8VE51bWJlcj4oQnVmZmVyLmZyb20oaGV4LCAnaGV4JyksIG5ldHdvcmssIHApO1xyXG59XHJcblxyXG5leHBvcnQgZnVuY3Rpb24gY3JlYXRlUHNidEZyb21CdWZmZXIoYnVmOiBCdWZmZXIsIG5ldHdvcms6IE5ldHdvcmssIGJpcDMyUGF0aHNBYnNvbHV0ZSA9IGZhbHNlKTogVXR4b1BzYnQge1xyXG4gIHN3aXRjaCAoZ2V0TWFpbm5ldChuZXR3b3JrKSkge1xyXG4gICAgY2FzZSBuZXR3b3Jrcy5iaXRjb2luOlxyXG4gICAgY2FzZSBuZXR3b3Jrcy5iaXRjb2luY2FzaDpcclxuICAgIGNhc2UgbmV0d29ya3MuYml0Y29pbnN2OlxyXG4gICAgY2FzZSBuZXR3b3Jrcy5iaXRjb2luZ29sZDpcclxuICAgIGNhc2UgbmV0d29ya3MuZG9nZWNvaW46XHJcbiAgICBjYXNlIG5ldHdvcmtzLmJpdGhlcmV1bTpcclxuICAgIGNhc2UgbmV0d29ya3MuZ2VuZXNpczpcclxuICAgIGNhc2UgbmV0d29ya3MuYml0Y29pbnplcm86XHJcbiAgICBjYXNlIG5ldHdvcmtzLmh1c2g6XHJcbiAgICBjYXNlIG5ldHdvcmtzLnJhdmVuY29pbjpcclxuICAgIGNhc2UgbmV0d29ya3MuYml0Y29yZTpcclxuICAgIGNhc2UgbmV0d29ya3MuemNvaW46XHJcbiAgICBjYXNlIG5ldHdvcmtzLmF4ZTpcclxuICAgIGNhc2UgbmV0d29ya3MuZGlnaWJ5dGU6XHJcbiAgICBjYXNlIG5ldHdvcmtzLnNpbm92YXRlOlxyXG4gICAgY2FzZSBuZXR3b3Jrcy5pbGNvaW46XHJcbiAgICBjYXNlIG5ldHdvcmtzLnJhcHRvcmV1bTpcclxuICAgIGNhc2UgbmV0d29ya3MudmVydGNvaW46XHJcbiAgICBjYXNlIG5ldHdvcmtzLmNsb3JlOlxyXG4gICAgY2FzZSBuZXR3b3Jrcy5lY2FzaDpcclxuICAgICAgcmV0dXJuIFV0eG9Qc2J0LmZyb21CdWZmZXIoYnVmLCB7IG5ldHdvcmssIGJpcDMyUGF0aHNBYnNvbHV0ZSB9KTtcclxuICAgIGNhc2UgbmV0d29ya3MubGl0ZWNvaW46XHJcbiAgICAgIHJldHVybiBMaXRlY29pblBzYnQuZnJvbUJ1ZmZlcihidWYsIHsgbmV0d29yaywgYmlwMzJQYXRoc0Fic29sdXRlIH0pO1xyXG4gICAgY2FzZSBuZXR3b3Jrcy5kYXNoOlxyXG4gICAgICByZXR1cm4gRGFzaFBzYnQuZnJvbUJ1ZmZlcihidWYsIHsgbmV0d29yaywgYmlwMzJQYXRoc0Fic29sdXRlIH0pO1xyXG4gICAgY2FzZSBuZXR3b3Jrcy56ZWxjYXNoOlxyXG4gICAgY2FzZSBuZXR3b3Jrcy5mbHV4OlxyXG4gICAgY2FzZSBuZXR3b3Jrcy56ZXJvOlxyXG4gICAgY2FzZSBuZXR3b3Jrcy5zbm93Z2VtOlxyXG4gICAgY2FzZSBuZXR3b3Jrcy5zYWZlY29pbjpcclxuICAgIGNhc2UgbmV0d29ya3Mua29tb2RvOlxyXG4gICAgY2FzZSBuZXR3b3Jrcy5nZW1saW5rOlxyXG4gICAgY2FzZSBuZXR3b3Jrcy5jb21tZXJjaXVtOlxyXG4gICAgY2FzZSBuZXR3b3Jrcy56Y2xhc3NpYzpcclxuICAgIGNhc2UgbmV0d29ya3MuYnplZGdlOlxyXG4gICAgY2FzZSBuZXR3b3Jrcy5iaXRjb2luejpcclxuICAgIGNhc2UgbmV0d29ya3MuemNhc2g6XHJcbiAgICAgIHJldHVybiBaY2FzaFBzYnQuZnJvbUJ1ZmZlcihidWYsIHsgbmV0d29yaywgYmlwMzJQYXRoc0Fic29sdXRlIH0pO1xyXG4gIH1cclxuXHJcbiAgLyogaXN0YW5idWwgaWdub3JlIG5leHQgKi9cclxuICB0aHJvdyBuZXcgRXJyb3IoYGludmFsaWQgbmV0d29ya2ApO1xyXG59XHJcblxyXG5leHBvcnQgZnVuY3Rpb24gY3JlYXRlUHNidEZyb21IZXgoaGV4OiBzdHJpbmcsIG5ldHdvcms6IE5ldHdvcmssIGJpcDMyUGF0aHNBYnNvbHV0ZSA9IGZhbHNlKTogVXR4b1BzYnQge1xyXG4gIHJldHVybiBjcmVhdGVQc2J0RnJvbUJ1ZmZlcihCdWZmZXIuZnJvbShoZXgsICdoZXgnKSwgbmV0d29yaywgYmlwMzJQYXRoc0Fic29sdXRlKTtcclxufVxyXG5cclxuZXhwb3J0IGZ1bmN0aW9uIGNyZWF0ZVBzYnRGcm9tVHJhbnNhY3Rpb24odHg6IFV0eG9UcmFuc2FjdGlvbjxiaWdpbnQ+LCBwcmV2T3V0czogVHhPdXRwdXQ8YmlnaW50PltdKTogVXR4b1BzYnQge1xyXG4gIHN3aXRjaCAoZ2V0TWFpbm5ldCh0eC5uZXR3b3JrKSkge1xyXG4gICAgY2FzZSBuZXR3b3Jrcy5iaXRjb2luOlxyXG4gICAgY2FzZSBuZXR3b3Jrcy5iaXRjb2luY2FzaDpcclxuICAgIGNhc2UgbmV0d29ya3MuYml0Y29pbnN2OlxyXG4gICAgY2FzZSBuZXR3b3Jrcy5iaXRjb2luZ29sZDpcclxuICAgIGNhc2UgbmV0d29ya3MuZG9nZWNvaW46XHJcbiAgICBjYXNlIG5ldHdvcmtzLmJpdGhlcmV1bTpcclxuICAgIGNhc2UgbmV0d29ya3MuZ2VuZXNpczpcclxuICAgIGNhc2UgbmV0d29ya3MuYml0Y29pbnplcm86XHJcbiAgICBjYXNlIG5ldHdvcmtzLmh1c2g6XHJcbiAgICBjYXNlIG5ldHdvcmtzLnJhdmVuY29pbjpcclxuICAgIGNhc2UgbmV0d29ya3MuYml0Y29yZTpcclxuICAgIGNhc2UgbmV0d29ya3MuemNvaW46XHJcbiAgICBjYXNlIG5ldHdvcmtzLmF4ZTpcclxuICAgIGNhc2UgbmV0d29ya3MuZGlnaWJ5dGU6XHJcbiAgICBjYXNlIG5ldHdvcmtzLnNpbm92YXRlOlxyXG4gICAgY2FzZSBuZXR3b3Jrcy5pbGNvaW46XHJcbiAgICBjYXNlIG5ldHdvcmtzLnJhcHRvcmV1bTpcclxuICAgIGNhc2UgbmV0d29ya3MudmVydGNvaW46XHJcbiAgICBjYXNlIG5ldHdvcmtzLmNsb3JlOlxyXG4gICAgY2FzZSBuZXR3b3Jrcy5lY2FzaDpcclxuICAgICAgcmV0dXJuIFV0eG9Qc2J0LmZyb21UcmFuc2FjdGlvbih0eCwgcHJldk91dHMpO1xyXG4gICAgY2FzZSBuZXR3b3Jrcy5saXRlY29pbjpcclxuICAgICAgcmV0dXJuIExpdGVjb2luUHNidC5mcm9tVHJhbnNhY3Rpb24odHgsIHByZXZPdXRzKTtcclxuICAgIGNhc2UgbmV0d29ya3MuZGFzaDpcclxuICAgICAgcmV0dXJuIERhc2hQc2J0LmZyb21UcmFuc2FjdGlvbih0eCwgcHJldk91dHMpO1xyXG4gICAgY2FzZSBuZXR3b3Jrcy56ZWxjYXNoOlxyXG4gICAgY2FzZSBuZXR3b3Jrcy5mbHV4OlxyXG4gICAgY2FzZSBuZXR3b3Jrcy56ZXJvOlxyXG4gICAgY2FzZSBuZXR3b3Jrcy5zbm93Z2VtOlxyXG4gICAgY2FzZSBuZXR3b3Jrcy5zYWZlY29pbjpcclxuICAgIGNhc2UgbmV0d29ya3Mua29tb2RvOlxyXG4gICAgY2FzZSBuZXR3b3Jrcy5nZW1saW5rOlxyXG4gICAgY2FzZSBuZXR3b3Jrcy5jb21tZXJjaXVtOlxyXG4gICAgY2FzZSBuZXR3b3Jrcy56Y2xhc3NpYzpcclxuICAgIGNhc2UgbmV0d29ya3MuYnplZGdlOlxyXG4gICAgY2FzZSBuZXR3b3Jrcy5iaXRjb2luejpcclxuICAgIGNhc2UgbmV0d29ya3MuemNhc2g6XHJcbiAgICAgIHJldHVybiBaY2FzaFBzYnQuZnJvbVRyYW5zYWN0aW9uKHR4LCBwcmV2T3V0cyk7XHJcbiAgfVxyXG5cclxuICAvKiBpc3RhbmJ1bCBpZ25vcmUgbmV4dCAqL1xyXG4gIHRocm93IG5ldyBFcnJvcihgaW52YWxpZCBuZXR3b3JrYCk7XHJcbn1cclxuXHJcbmV4cG9ydCBmdW5jdGlvbiBnZXREZWZhdWx0VHJhbnNhY3Rpb25WZXJzaW9uKG5ldHdvcms6IE5ldHdvcmspOiBudW1iZXIge1xyXG4gIHN3aXRjaCAoZ2V0TWFpbm5ldChuZXR3b3JrKSkge1xyXG4gICAgY2FzZSBuZXR3b3Jrcy5iaXRjb2luY2FzaDpcclxuICAgIGNhc2UgbmV0d29ya3MuYml0Y29pbnN2OlxyXG4gICAgY2FzZSBuZXR3b3Jrcy5iaXRjb2luZ29sZDpcclxuICAgIGNhc2UgbmV0d29ya3MuZWNhc2g6XHJcbiAgICAgIHJldHVybiAyO1xyXG4gICAgY2FzZSBuZXR3b3Jrcy56ZWxjYXNoOlxyXG4gICAgY2FzZSBuZXR3b3Jrcy5mbHV4OlxyXG4gICAgY2FzZSBuZXR3b3Jrcy56ZXJvOlxyXG4gICAgY2FzZSBuZXR3b3Jrcy5zbm93Z2VtOlxyXG4gICAgY2FzZSBuZXR3b3Jrcy5zYWZlY29pbjpcclxuICAgIGNhc2UgbmV0d29ya3Mua29tb2RvOlxyXG4gICAgY2FzZSBuZXR3b3Jrcy5nZW1saW5rOlxyXG4gICAgY2FzZSBuZXR3b3Jrcy5jb21tZXJjaXVtOlxyXG4gICAgY2FzZSBuZXR3b3Jrcy56Y2xhc3NpYzpcclxuICAgIGNhc2UgbmV0d29ya3MuYnplZGdlOlxyXG4gICAgY2FzZSBuZXR3b3Jrcy5iaXRjb2luejpcclxuICAgIGNhc2UgbmV0d29ya3MuemNhc2g6XHJcbiAgICAgIHJldHVybiBaY2FzaFRyYW5zYWN0aW9uLlZFUlNJT040X0JSQU5DSF9OVTU7XHJcbiAgICBkZWZhdWx0OlxyXG4gICAgICByZXR1cm4gMTtcclxuICB9XHJcbn1cclxuXHJcbmV4cG9ydCBmdW5jdGlvbiBzZXRUcmFuc2FjdGlvbkJ1aWxkZXJEZWZhdWx0czxUTnVtYmVyIGV4dGVuZHMgbnVtYmVyIHwgYmlnaW50PihcclxuICB0eGI6IFV0eG9UcmFuc2FjdGlvbkJ1aWxkZXI8VE51bWJlcj4sXHJcbiAgbmV0d29yazogTmV0d29yayxcclxuICB7IHZlcnNpb24gPSBnZXREZWZhdWx0VHJhbnNhY3Rpb25WZXJzaW9uKG5ldHdvcmspIH06IHsgdmVyc2lvbj86IG51bWJlciB9ID0ge31cclxuKTogdm9pZCB7XHJcbiAgc3dpdGNoIChnZXRNYWlubmV0KG5ldHdvcmspKSB7XHJcbiAgICBjYXNlIG5ldHdvcmtzLmJpdGNvaW5jYXNoOlxyXG4gICAgY2FzZSBuZXR3b3Jrcy5iaXRjb2luc3Y6XHJcbiAgICBjYXNlIG5ldHdvcmtzLmJpdGNvaW5nb2xkOlxyXG4gICAgY2FzZSBuZXR3b3Jrcy5lY2FzaDpcclxuICAgICAgaWYgKHZlcnNpb24gIT09IDIpIHtcclxuICAgICAgICB0aHJvdyBuZXcgRXJyb3IoYGludmFsaWQgdmVyc2lvbmApO1xyXG4gICAgICB9XHJcbiAgICAgIHR4Yi5zZXRWZXJzaW9uKHZlcnNpb24pO1xyXG4gICAgICBicmVhaztcclxuICAgIGNhc2UgbmV0d29ya3MuemVsY2FzaDpcclxuICAgIGNhc2UgbmV0d29ya3MuZmx1eDpcclxuICAgIGNhc2UgbmV0d29ya3MuemVybzpcclxuICAgIGNhc2UgbmV0d29ya3Muc25vd2dlbTpcclxuICAgIGNhc2UgbmV0d29ya3Muc2FmZWNvaW46XHJcbiAgICBjYXNlIG5ldHdvcmtzLmtvbW9kbzpcclxuICAgIGNhc2UgbmV0d29ya3MuZ2VtbGluazpcclxuICAgIGNhc2UgbmV0d29ya3MuY29tbWVyY2l1bTpcclxuICAgIGNhc2UgbmV0d29ya3MuemNsYXNzaWM6XHJcbiAgICBjYXNlIG5ldHdvcmtzLmJ6ZWRnZTpcclxuICAgIGNhc2UgbmV0d29ya3MuYml0Y29pbno6XHJcbiAgICBjYXNlIG5ldHdvcmtzLnpjYXNoOlxyXG4gICAgICAodHhiIGFzIFpjYXNoVHJhbnNhY3Rpb25CdWlsZGVyPFROdW1iZXI+KS5zZXREZWZhdWx0c0ZvclZlcnNpb24obmV0d29yaywgdmVyc2lvbik7XHJcbiAgICAgIGJyZWFrO1xyXG4gICAgZGVmYXVsdDpcclxuICAgICAgaWYgKHZlcnNpb24gIT09IDEpIHtcclxuICAgICAgICB0aHJvdyBuZXcgRXJyb3IoYGludmFsaWQgdmVyc2lvbmApO1xyXG4gICAgICB9XHJcbiAgfVxyXG59XHJcblxyXG5leHBvcnQgZnVuY3Rpb24gc2V0UHNidERlZmF1bHRzKFxyXG4gIHBzYnQ6IFV0eG9Qc2J0LFxyXG4gIG5ldHdvcms6IE5ldHdvcmssXHJcbiAgeyB2ZXJzaW9uID0gZ2V0RGVmYXVsdFRyYW5zYWN0aW9uVmVyc2lvbihuZXR3b3JrKSB9OiB7IHZlcnNpb24/OiBudW1iZXIgfSA9IHt9XHJcbik6IHZvaWQge1xyXG4gIHN3aXRjaCAoZ2V0TWFpbm5ldChuZXR3b3JrKSkge1xyXG4gICAgY2FzZSBuZXR3b3Jrcy5iaXRjb2luY2FzaDpcclxuICAgIGNhc2UgbmV0d29ya3MuYml0Y29pbnN2OlxyXG4gICAgY2FzZSBuZXR3b3Jrcy5iaXRjb2luZ29sZDpcclxuICAgIGNhc2UgbmV0d29ya3MuZWNhc2g6XHJcbiAgICAgIGlmICh2ZXJzaW9uICE9PSAyKSB7XHJcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yKGBpbnZhbGlkIHZlcnNpb25gKTtcclxuICAgICAgfVxyXG4gICAgICBicmVhaztcclxuICAgIGNhc2UgbmV0d29ya3MuemVsY2FzaDpcclxuICAgIGNhc2UgbmV0d29ya3MuZmx1eDpcclxuICAgIGNhc2UgbmV0d29ya3MuemVybzpcclxuICAgIGNhc2UgbmV0d29ya3Muc25vd2dlbTpcclxuICAgIGNhc2UgbmV0d29ya3Muc2FmZWNvaW46XHJcbiAgICBjYXNlIG5ldHdvcmtzLmtvbW9kbzpcclxuICAgIGNhc2UgbmV0d29ya3MuZ2VtbGluazpcclxuICAgIGNhc2UgbmV0d29ya3MuY29tbWVyY2l1bTpcclxuICAgIGNhc2UgbmV0d29ya3MuemNsYXNzaWM6XHJcbiAgICBjYXNlIG5ldHdvcmtzLmJ6ZWRnZTpcclxuICAgIGNhc2UgbmV0d29ya3MuYml0Y29pbno6XHJcbiAgICBjYXNlIG5ldHdvcmtzLnpjYXNoOlxyXG4gICAgICBpZiAoXHJcbiAgICAgICAgIVtcclxuICAgICAgICAgIFpjYXNoVHJhbnNhY3Rpb24uVkVSU0lPTjRfQlJBTkNIX0NBTk9QWSxcclxuICAgICAgICAgIFpjYXNoVHJhbnNhY3Rpb24uVkVSU0lPTjRfQlJBTkNIX05VNSxcclxuICAgICAgICAgIFpjYXNoVHJhbnNhY3Rpb24uVkVSU0lPTjVfQlJBTkNIX05VNSxcclxuICAgICAgICBdLmluY2x1ZGVzKHZlcnNpb24pXHJcbiAgICAgICkge1xyXG4gICAgICAgIHRocm93IG5ldyBFcnJvcihgaW52YWxpZCB2ZXJzaW9uYCk7XHJcbiAgICAgIH1cclxuICAgICAgKHBzYnQgYXMgWmNhc2hQc2J0KS5zZXREZWZhdWx0c0ZvclZlcnNpb24obmV0d29yaywgdmVyc2lvbik7XHJcbiAgICAgIGJyZWFrO1xyXG4gICAgZGVmYXVsdDpcclxuICAgICAgaWYgKHZlcnNpb24gIT09IDEpIHtcclxuICAgICAgICB0aHJvdyBuZXcgRXJyb3IoYGludmFsaWQgdmVyc2lvbmApO1xyXG4gICAgICB9XHJcbiAgICAgIC8vIEZJWE1FOiBzZXQgdmVyc2lvbiBoZXJlLCBiZWNhdXNlIHRoZXJlJ3MgYSBidWcgaW4gdGhlIHVwc3RyZWFtIFBTQlRcclxuICAgICAgLy8gdGhhdCBkZWZhdWx0cyB0cmFuc2FjdGlvbnMgdG8gdjIuXHJcbiAgICAgIHBzYnQuc2V0VmVyc2lvbih2ZXJzaW9uKTtcclxuICB9XHJcbn1cclxuXHJcbmV4cG9ydCBmdW5jdGlvbiBjcmVhdGVQc2J0Rm9yTmV0d29yayhwc2J0T3B0czogUHNidE9wdHMsIHsgdmVyc2lvbiB9OiB7IHZlcnNpb24/OiBudW1iZXIgfSA9IHt9KTogVXR4b1BzYnQge1xyXG4gIGxldCBwc2J0O1xyXG5cclxuICBzd2l0Y2ggKGdldE1haW5uZXQocHNidE9wdHMubmV0d29yaykpIHtcclxuICAgIGNhc2UgbmV0d29ya3MuYml0Y29pbjpcclxuICAgIGNhc2UgbmV0d29ya3MuYml0Y29pbmNhc2g6XHJcbiAgICBjYXNlIG5ldHdvcmtzLmJpdGNvaW5zdjpcclxuICAgIGNhc2UgbmV0d29ya3MuYml0Y29pbmdvbGQ6XHJcbiAgICBjYXNlIG5ldHdvcmtzLmRvZ2Vjb2luOlxyXG4gICAgY2FzZSBuZXR3b3Jrcy5iaXRoZXJldW06XHJcbiAgICBjYXNlIG5ldHdvcmtzLmdlbmVzaXM6XHJcbiAgICBjYXNlIG5ldHdvcmtzLmJpdGNvaW56ZXJvOlxyXG4gICAgY2FzZSBuZXR3b3Jrcy5odXNoOlxyXG4gICAgY2FzZSBuZXR3b3Jrcy5yYXZlbmNvaW46XHJcbiAgICBjYXNlIG5ldHdvcmtzLmJpdGNvcmU6XHJcbiAgICBjYXNlIG5ldHdvcmtzLnpjb2luOlxyXG4gICAgY2FzZSBuZXR3b3Jrcy5heGU6XHJcbiAgICBjYXNlIG5ldHdvcmtzLmRpZ2lieXRlOlxyXG4gICAgY2FzZSBuZXR3b3Jrcy5zaW5vdmF0ZTpcclxuICAgIGNhc2UgbmV0d29ya3MuaWxjb2luOlxyXG4gICAgY2FzZSBuZXR3b3Jrcy5yYXB0b3JldW06XHJcbiAgICBjYXNlIG5ldHdvcmtzLnZlcnRjb2luOlxyXG4gICAgY2FzZSBuZXR3b3Jrcy5jbG9yZTpcclxuICAgIGNhc2UgbmV0d29ya3MuZWNhc2g6IHtcclxuICAgICAgcHNidCA9IFV0eG9Qc2J0LmNyZWF0ZVBzYnQocHNidE9wdHMpO1xyXG4gICAgICBicmVhaztcclxuICAgIH1cclxuICAgIGNhc2UgbmV0d29ya3MubGl0ZWNvaW46IHtcclxuICAgICAgcHNidCA9IExpdGVjb2luUHNidC5jcmVhdGVQc2J0KHBzYnRPcHRzKTtcclxuICAgICAgYnJlYWs7XHJcbiAgICB9XHJcbiAgICBjYXNlIG5ldHdvcmtzLmRhc2g6IHtcclxuICAgICAgcHNidCA9IERhc2hQc2J0LmNyZWF0ZVBzYnQocHNidE9wdHMpO1xyXG4gICAgICBicmVhaztcclxuICAgIH1cclxuICAgIGNhc2UgbmV0d29ya3MuemVsY2FzaDpcclxuICAgIGNhc2UgbmV0d29ya3MuZmx1eDpcclxuICAgIGNhc2UgbmV0d29ya3MuemVybzpcclxuICAgIGNhc2UgbmV0d29ya3Muc25vd2dlbTpcclxuICAgIGNhc2UgbmV0d29ya3Muc2FmZWNvaW46XHJcbiAgICBjYXNlIG5ldHdvcmtzLmtvbW9kbzpcclxuICAgIGNhc2UgbmV0d29ya3MuZ2VtbGluazpcclxuICAgIGNhc2UgbmV0d29ya3MuY29tbWVyY2l1bTpcclxuICAgIGNhc2UgbmV0d29ya3MuemNsYXNzaWM6XHJcbiAgICBjYXNlIG5ldHdvcmtzLmJ6ZWRnZTpcclxuICAgIGNhc2UgbmV0d29ya3MuYml0Y29pbno6XHJcbiAgICBjYXNlIG5ldHdvcmtzLnpjYXNoOiB7XHJcbiAgICAgIHBzYnQgPSBaY2FzaFBzYnQuY3JlYXRlUHNidChwc2J0T3B0cyk7XHJcbiAgICAgIGJyZWFrO1xyXG4gICAgfVxyXG4gICAgZGVmYXVsdDpcclxuICAgICAgdGhyb3cgbmV3IEVycm9yKGB1bnN1cHBvcnRlZCBuZXR3b3JrYCk7XHJcbiAgfVxyXG5cclxuICBzZXRQc2J0RGVmYXVsdHMocHNidCwgcHNidE9wdHMubmV0d29yaywgeyB2ZXJzaW9uIH0pO1xyXG5cclxuICByZXR1cm4gcHNidDtcclxufVxyXG5cclxuZXhwb3J0IGZ1bmN0aW9uIGNyZWF0ZVRyYW5zYWN0aW9uQnVpbGRlckZvck5ldHdvcms8VE51bWJlciBleHRlbmRzIG51bWJlciB8IGJpZ2ludCA9IG51bWJlcj4oXHJcbiAgbmV0d29yazogTmV0d29yayxcclxuICB7IHZlcnNpb24gfTogeyB2ZXJzaW9uPzogbnVtYmVyIH0gPSB7fVxyXG4pOiBVdHhvVHJhbnNhY3Rpb25CdWlsZGVyPFROdW1iZXI+IHtcclxuICBsZXQgdHhiO1xyXG4gIHN3aXRjaCAoZ2V0TWFpbm5ldChuZXR3b3JrKSkge1xyXG4gICAgY2FzZSBuZXR3b3Jrcy5iaXRjb2luOlxyXG4gICAgY2FzZSBuZXR3b3Jrcy5iaXRjb2luY2FzaDpcclxuICAgIGNhc2UgbmV0d29ya3MuYml0Y29pbnN2OlxyXG4gICAgY2FzZSBuZXR3b3Jrcy5iaXRjb2luZ29sZDpcclxuICAgIGNhc2UgbmV0d29ya3MuZG9nZWNvaW46XHJcbiAgICBjYXNlIG5ldHdvcmtzLmJpdGhlcmV1bTpcclxuICAgIGNhc2UgbmV0d29ya3MuZ2VuZXNpczpcclxuICAgIGNhc2UgbmV0d29ya3MuYml0Y29pbnplcm86XHJcbiAgICBjYXNlIG5ldHdvcmtzLmh1c2g6XHJcbiAgICBjYXNlIG5ldHdvcmtzLnJhdmVuY29pbjpcclxuICAgIGNhc2UgbmV0d29ya3MuYml0Y29yZTpcclxuICAgIGNhc2UgbmV0d29ya3MuemNvaW46XHJcbiAgICBjYXNlIG5ldHdvcmtzLmF4ZTpcclxuICAgIGNhc2UgbmV0d29ya3MuZGlnaWJ5dGU6XHJcbiAgICBjYXNlIG5ldHdvcmtzLnNpbm92YXRlOlxyXG4gICAgY2FzZSBuZXR3b3Jrcy5pbGNvaW46XHJcbiAgICBjYXNlIG5ldHdvcmtzLnJhcHRvcmV1bTpcclxuICAgIGNhc2UgbmV0d29ya3MudmVydGNvaW46XHJcbiAgICBjYXNlIG5ldHdvcmtzLmNsb3JlOlxyXG4gICAgY2FzZSBuZXR3b3Jrcy5ncm9lc3RsY29pbjpcclxuICAgIGNhc2UgbmV0d29ya3MuZWNhc2g6IHtcclxuICAgICAgdHhiID0gbmV3IFV0eG9UcmFuc2FjdGlvbkJ1aWxkZXI8VE51bWJlcj4obmV0d29yayk7XHJcbiAgICAgIGJyZWFrO1xyXG4gICAgfVxyXG4gICAgY2FzZSBuZXR3b3Jrcy5saXRlY29pbjoge1xyXG4gICAgICB0eGIgPSBuZXcgTGl0ZWNvaW5UcmFuc2FjdGlvbkJ1aWxkZXI8VE51bWJlcj4obmV0d29yayk7XHJcbiAgICAgIGJyZWFrO1xyXG4gICAgfVxyXG4gICAgY2FzZSBuZXR3b3Jrcy5kYXNoOlxyXG4gICAgICB0eGIgPSBuZXcgRGFzaFRyYW5zYWN0aW9uQnVpbGRlcjxUTnVtYmVyPihuZXR3b3JrKTtcclxuICAgICAgYnJlYWs7XHJcbiAgICBjYXNlIG5ldHdvcmtzLnplbGNhc2g6XHJcbiAgICBjYXNlIG5ldHdvcmtzLmZsdXg6XHJcbiAgICBjYXNlIG5ldHdvcmtzLnplcm86XHJcbiAgICBjYXNlIG5ldHdvcmtzLnNub3dnZW06XHJcbiAgICBjYXNlIG5ldHdvcmtzLnNhZmVjb2luOlxyXG4gICAgY2FzZSBuZXR3b3Jrcy5rb21vZG86XHJcbiAgICBjYXNlIG5ldHdvcmtzLmdlbWxpbms6XHJcbiAgICBjYXNlIG5ldHdvcmtzLmNvbW1lcmNpdW06XHJcbiAgICBjYXNlIG5ldHdvcmtzLnpjbGFzc2ljOlxyXG4gICAgY2FzZSBuZXR3b3Jrcy5iemVkZ2U6XHJcbiAgICBjYXNlIG5ldHdvcmtzLmJpdGNvaW56OlxyXG4gICAgY2FzZSBuZXR3b3Jrcy56Y2FzaDoge1xyXG4gICAgICB0eGIgPSBuZXcgWmNhc2hUcmFuc2FjdGlvbkJ1aWxkZXI8VE51bWJlcj4obmV0d29yayBhcyBaY2FzaE5ldHdvcmspO1xyXG4gICAgICBicmVhaztcclxuICAgIH1cclxuICAgIGRlZmF1bHQ6XHJcbiAgICAgIHRocm93IG5ldyBFcnJvcihgdW5zdXBwb3J0ZWQgbmV0d29ya2ApO1xyXG4gIH1cclxuXHJcbiAgc2V0VHJhbnNhY3Rpb25CdWlsZGVyRGVmYXVsdHM8VE51bWJlcj4odHhiLCBuZXR3b3JrLCB7IHZlcnNpb24gfSk7XHJcblxyXG4gIHJldHVybiB0eGI7XHJcbn1cclxuXHJcbmV4cG9ydCBmdW5jdGlvbiBjcmVhdGVUcmFuc2FjdGlvbkJ1aWxkZXJGcm9tVHJhbnNhY3Rpb248VE51bWJlciBleHRlbmRzIG51bWJlciB8IGJpZ2ludD4oXHJcbiAgdHg6IFV0eG9UcmFuc2FjdGlvbjxUTnVtYmVyPixcclxuICBwcmV2T3V0cHV0cz86IFR4T3V0cHV0PFROdW1iZXI+W11cclxuKTogVXR4b1RyYW5zYWN0aW9uQnVpbGRlcjxUTnVtYmVyPiB7XHJcbiAgc3dpdGNoIChnZXRNYWlubmV0KHR4Lm5ldHdvcmspKSB7XHJcbiAgICBjYXNlIG5ldHdvcmtzLmJpdGNvaW46XHJcbiAgICBjYXNlIG5ldHdvcmtzLmJpdGNvaW5jYXNoOlxyXG4gICAgY2FzZSBuZXR3b3Jrcy5iaXRjb2luc3Y6XHJcbiAgICBjYXNlIG5ldHdvcmtzLmJpdGNvaW5nb2xkOlxyXG4gICAgY2FzZSBuZXR3b3Jrcy5kb2dlY29pbjpcclxuICAgIGNhc2UgbmV0d29ya3MuYml0aGVyZXVtOlxyXG4gICAgY2FzZSBuZXR3b3Jrcy5nZW5lc2lzOlxyXG4gICAgY2FzZSBuZXR3b3Jrcy5iaXRjb2luemVybzpcclxuICAgIGNhc2UgbmV0d29ya3MuaHVzaDpcclxuICAgIGNhc2UgbmV0d29ya3MucmF2ZW5jb2luOlxyXG4gICAgY2FzZSBuZXR3b3Jrcy5iaXRjb3JlOlxyXG4gICAgY2FzZSBuZXR3b3Jrcy56Y29pbjpcclxuICAgIGNhc2UgbmV0d29ya3MuYXhlOlxyXG4gICAgY2FzZSBuZXR3b3Jrcy5kaWdpYnl0ZTpcclxuICAgIGNhc2UgbmV0d29ya3Muc2lub3ZhdGU6XHJcbiAgICBjYXNlIG5ldHdvcmtzLmlsY29pbjpcclxuICAgIGNhc2UgbmV0d29ya3MucmFwdG9yZXVtOlxyXG4gICAgY2FzZSBuZXR3b3Jrcy52ZXJ0Y29pbjpcclxuICAgIGNhc2UgbmV0d29ya3MuY2xvcmU6XHJcbiAgICBjYXNlIG5ldHdvcmtzLmdyb2VzdGxjb2luOlxyXG4gICAgY2FzZSBuZXR3b3Jrcy5lY2FzaDpcclxuICAgICAgcmV0dXJuIFV0eG9UcmFuc2FjdGlvbkJ1aWxkZXIuZnJvbVRyYW5zYWN0aW9uPFROdW1iZXI+KHR4LCB1bmRlZmluZWQsIHByZXZPdXRwdXRzKTtcclxuICAgIGNhc2UgbmV0d29ya3MubGl0ZWNvaW46XHJcbiAgICAgIHJldHVybiBMaXRlY29pblRyYW5zYWN0aW9uQnVpbGRlci5mcm9tVHJhbnNhY3Rpb248VE51bWJlcj4oXHJcbiAgICAgICAgdHggYXMgTGl0ZWNvaW5UcmFuc2FjdGlvbjxUTnVtYmVyPixcclxuICAgICAgICB1bmRlZmluZWQsXHJcbiAgICAgICAgcHJldk91dHB1dHMgYXMgVHhPdXRwdXQ8VE51bWJlcj5bXVxyXG4gICAgICApO1xyXG4gICAgY2FzZSBuZXR3b3Jrcy5kYXNoOlxyXG4gICAgICByZXR1cm4gRGFzaFRyYW5zYWN0aW9uQnVpbGRlci5mcm9tVHJhbnNhY3Rpb248VE51bWJlcj4oXHJcbiAgICAgICAgdHggYXMgRGFzaFRyYW5zYWN0aW9uPFROdW1iZXI+LFxyXG4gICAgICAgIHVuZGVmaW5lZCxcclxuICAgICAgICBwcmV2T3V0cHV0cyBhcyBUeE91dHB1dDxUTnVtYmVyPltdXHJcbiAgICAgICk7XHJcbiAgICBjYXNlIG5ldHdvcmtzLnplbGNhc2g6XHJcbiAgICBjYXNlIG5ldHdvcmtzLmZsdXg6XHJcbiAgICBjYXNlIG5ldHdvcmtzLnplcm86XHJcbiAgICBjYXNlIG5ldHdvcmtzLnNub3dnZW06XHJcbiAgICBjYXNlIG5ldHdvcmtzLnNhZmVjb2luOlxyXG4gICAgY2FzZSBuZXR3b3Jrcy5rb21vZG86XHJcbiAgICBjYXNlIG5ldHdvcmtzLmdlbWxpbms6XHJcbiAgICBjYXNlIG5ldHdvcmtzLmNvbW1lcmNpdW06XHJcbiAgICBjYXNlIG5ldHdvcmtzLnpjbGFzc2ljOlxyXG4gICAgY2FzZSBuZXR3b3Jrcy5iemVkZ2U6XHJcbiAgICBjYXNlIG5ldHdvcmtzLmJpdGNvaW56OlxyXG4gICAgY2FzZSBuZXR3b3Jrcy56Y2FzaDpcclxuICAgICAgcmV0dXJuIFpjYXNoVHJhbnNhY3Rpb25CdWlsZGVyLmZyb21UcmFuc2FjdGlvbjxUTnVtYmVyPihcclxuICAgICAgICB0eCBhcyBaY2FzaFRyYW5zYWN0aW9uPFROdW1iZXI+LFxyXG4gICAgICAgIHVuZGVmaW5lZCxcclxuICAgICAgICBwcmV2T3V0cHV0cyBhcyBUeE91dHB1dDxUTnVtYmVyPltdXHJcbiAgICAgICk7XHJcbiAgfVxyXG5cclxuICB0aHJvdyBuZXcgRXJyb3IoYGludmFsaWQgbmV0d29ya2ApO1xyXG59XHJcbiJdfQ==
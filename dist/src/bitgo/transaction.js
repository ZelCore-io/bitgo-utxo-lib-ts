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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidHJhbnNhY3Rpb24uanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi9zcmMvYml0Z28vdHJhbnNhY3Rpb24udHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7O0FBR0EsMENBQTREO0FBRTVELHlDQUFnRDtBQUNoRCx1REFBb0Q7QUFDcEQscUVBQWtFO0FBQ2xFLDhDQUEyQztBQUMzQyw0REFBeUQ7QUFDekQsMEVBQXVFO0FBQ3ZFLGlEQUE4QztBQUM5Qyw2RUFBMEU7QUFDMUUsK0RBQTBFO0FBQzFFLHlDQUEyRjtBQVkzRixTQUFnQiwyQkFBMkIsQ0FDekMsR0FBVyxFQUNYLE9BQWdCLEVBQ2hCLEVBQUUsT0FBTyxFQUFFLFVBQVUsS0FBNkQsRUFBRSxFQUNwRixvQkFBMEM7SUFFMUMsSUFBSSxVQUFVLEVBQUU7UUFDZCxJQUFJLG9CQUFvQixJQUFJLFVBQVUsS0FBSyxvQkFBb0IsRUFBRTtZQUMvRCxNQUFNLElBQUksS0FBSyxDQUFDLG1CQUFtQixDQUFDLENBQUM7U0FDdEM7S0FDRjtTQUFNO1FBQ0wsSUFBSSxvQkFBb0IsRUFBRTtZQUN4QixVQUFVLEdBQUcsb0JBQW9CLENBQUM7U0FDbkM7YUFBTTtZQUNMLFVBQVUsR0FBRyxRQUFRLENBQUM7U0FDdkI7S0FDRjtJQUNELFFBQVEsSUFBQSxxQkFBVSxFQUFDLE9BQU8sQ0FBQyxFQUFFO1FBQzNCLEtBQUssbUJBQVEsQ0FBQyxPQUFPLENBQUM7UUFDdEIsS0FBSyxtQkFBUSxDQUFDLFdBQVcsQ0FBQztRQUMxQixLQUFLLG1CQUFRLENBQUMsU0FBUyxDQUFDO1FBQ3hCLEtBQUssbUJBQVEsQ0FBQyxXQUFXLENBQUM7UUFDMUIsS0FBSyxtQkFBUSxDQUFDLFFBQVEsQ0FBQztRQUN2QixLQUFLLG1CQUFRLENBQUMsU0FBUyxDQUFDO1FBQ3hCLEtBQUssbUJBQVEsQ0FBQyxPQUFPLENBQUM7UUFDdEIsS0FBSyxtQkFBUSxDQUFDLFdBQVcsQ0FBQztRQUMxQixLQUFLLG1CQUFRLENBQUMs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QUE4QixFQUM5QixTQUFTLEVBQ1QsV0FBa0MsQ0FDbkMsQ0FBQztRQUNKLEtBQUssbUJBQVEsQ0FBQyxPQUFPLENBQUM7UUFDdEIsS0FBSyxtQkFBUSxDQUFDLElBQUksQ0FBQztRQUNuQixLQUFLLG1CQUFRLENBQUMsSUFBSSxDQUFDO1FBQ25CLEtBQUssbUJBQVEsQ0FBQyxPQUFPLENBQUM7UUFDdEIsS0FBSyxtQkFBUSxDQUFDLFFBQVEsQ0FBQztRQUN2QixLQUFLLG1CQUFRLENBQUMsTUFBTSxDQUFDO1FBQ3JCLEtBQUssbUJBQVEsQ0FBQyxPQUFPLENBQUM7UUFDdEIsS0FBSyxtQkFBUSxDQUFDLFVBQVUsQ0FBQztRQUN6QixLQUFLLG1CQUFRLENBQUMsUUFBUSxDQUFDO1FBQ3ZCLEtBQUssbUJBQVEsQ0FBQyxNQUFNLENBQUM7UUFDckIsS0FBSyxtQkFBUSxDQUFDLFFBQVEsQ0FBQztRQUN2QixLQUFLLG1CQUFRLENBQUMsS0FBSztZQUNqQixPQUFPLGlEQUF1QixDQUFDLGVBQWUsQ0FDNUMsRUFBK0IsRUFDL0IsU0FBUyxFQUNULFdBQWtDLENBQ25DLENBQUM7S0FDTDtJQUVELE1BQU0sSUFBSSxLQUFLLENBQUMsaUJBQWlCLENBQUMsQ0FBQztBQUNyQyxDQUFDO0FBMURELDBGQTBEQyIsInNvdXJjZXNDb250ZW50IjpbIi8qIGVzbGludCBuby1yZWRlY2xhcmU6IDAgKi9cclxuaW1wb3J0IHsgVHhPdXRwdXQgfSBmcm9tICdiaXRjb2luanMtbGliJztcclxuXHJcbmltcG9ydCB7IG5ldHdvcmtzLCBOZXR3b3JrLCBnZXRNYWlubmV0IH0gZnJvbSAnLi4vbmV0d29ya3MnO1xyXG5cclxuaW1wb3J0IHsgVXR4b1BzYnQsIFBzYnRPcHRzIH0gZnJvbSAnLi9VdHhvUHNidCc7XHJcbmltcG9ydCB7IFV0eG9UcmFuc2FjdGlvbiB9IGZyb20gJy4vVXR4b1RyYW5zYWN0aW9uJztcclxuaW1wb3J0IHsgVXR4b1RyYW5zYWN0aW9uQnVpbGRlciB9IGZyb20gJy4vVXR4b1RyYW5zYWN0aW9uQnVpbGRlcic7XHJcbmltcG9ydCB7IERhc2hQc2J0IH0gZnJvbSAnLi9kYXNoL0Rhc2hQc2J0JztcclxuaW1wb3J0IHsgRGFzaFRyYW5zYWN0aW9uIH0gZnJvbSAnLi9kYXNoL0Rhc2hUcmFuc2FjdGlvbic7XHJcbmltcG9ydCB7IERhc2hUcmFuc2FjdGlvbkJ1aWxkZXIgfSBmcm9tICcuL2Rhc2gvRGFzaFRyYW5zYWN0aW9uQnVpbGRlcic7XHJcbmltcG9ydCB7IFpjYXNoUHNidCB9IGZyb20gJy4vemNhc2gvWmNhc2hQc2J0JztcclxuaW1wb3J0IHsgWmNhc2hUcmFuc2FjdGlvbkJ1aWxkZXIgfSBmcm9tICcuL3pjYXNoL1pjYXNoVHJhbnNhY3Rpb25CdWlsZGVyJztcclxuaW1wb3J0IHsgWmNhc2hOZXR3b3JrLCBaY2FzaFRyYW5zYWN0aW9uIH0gZnJvbSAnLi96Y2FzaC9aY2FzaFRyYW5zYWN0aW9uJztcclxuaW1wb3J0IHsgTGl0ZWNvaW5Qc2J0LCBMaXRlY29pblRyYW5zYWN0aW9uLCBMaXRlY29pblRyYW5zYWN0aW9uQnVpbGRlciB9IGZyb20gJy4vbGl0ZWNvaW4nO1xyXG5cclxuZXhwb3J0IGZ1bmN0aW9uIGNyZWF0ZVRyYW5zYWN0aW9uRnJvbUJ1ZmZlcihcclxuICBidWY6IEJ1ZmZlcixcclxuICBuZXR3b3JrOiBOZXR3b3JrLFxyXG4gIHBhcmFtczogeyB2ZXJzaW9uPzogbnVtYmVyOyBhbW91bnRUeXBlOiAnYmlnaW50JyB9XHJcbik6IFV0eG9UcmFuc2FjdGlvbjxiaWdpbnQ+O1xyXG5leHBvcnQgZnVuY3Rpb24gY3JlYXRlVHJhbnNhY3Rpb25Gcm9tQnVmZmVyPFROdW1iZXIgZXh0ZW5kcyBudW1iZXIgfCBiaWdpbnQ+KFxyXG4gIGJ1ZjogQnVmZmVyLFxyXG4gIG5ldHdvcms6IE5ldHdvcmssXHJcbiAgcGFyYW1zPzogeyB2ZXJzaW9uPzogbnVtYmVyOyBhbW91bnRUeXBlPzogJ251bWJlcicgfCAnYmlnaW50JyB9XHJcbik6IFV0eG9UcmFuc2FjdGlvbjxUTnVtYmVyPjtcclxuZXhwb3J0IGZ1bmN0aW9uIGNyZWF0ZVRyYW5zYWN0aW9uRnJvbUJ1ZmZlcjxUTnVtYmVyIGV4dGVuZHMgbnVtYmVyIHwgYmlnaW50ID0gbnVtYmVyPihcclxuICBidWY6IEJ1ZmZlcixcclxuICBuZXR3b3JrOiBOZXR3b3JrLFxyXG4gIHsgdmVyc2lvbiwgYW1vdW50VHlwZSB9OiB7IHZlcnNpb24/OiBudW1iZXI7IGFtb3VudFR5cGU/OiAnbnVtYmVyJyB8ICdiaWdpbnQnIH0gPSB7fSxcclxuICBkZXByZWNhdGVkQW1vdW50VHlwZT86ICdudW1iZXInIHwgJ2JpZ2ludCdcclxuKTogVXR4b1RyYW5zYWN0aW9uPFROdW1iZXI+IHtcclxuICBpZiAoYW1vdW50VHlwZSkge1xyXG4gICAgaWYgKGRlcHJlY2F0ZWRBbW91bnRUeXBlICYmIGFtb3VudFR5cGUgIT09IGRlcHJlY2F0ZWRBbW91bnRUeXBlKSB7XHJcbiAgICAgIHRocm93IG5ldyBFcnJvcihgaW52YWxpZCBhcmd1bWVudHNgKTtcclxuICAgIH1cclxuICB9IGVsc2Uge1xyXG4gICAgaWYgKGRlcHJlY2F0ZWRBbW91bnRUeXBlKSB7XHJcbiAgICAgIGFtb3VudFR5cGUgPSBkZXByZWNhdGVkQW1vdW50VHlwZTtcclxuICAgIH0gZWxzZSB7XHJcbiAgICAgIGFtb3VudFR5cGUgPSAnbnVtYmVyJztcclxuICAgIH1cclxuICB9XHJcbiAgc3dpdGNoIChnZXRNYWlubmV0KG5ldHdvcmspKSB7XHJcbiAgICBjYXNlIG5ldHdvcmtzLmJpdGNvaW46XHJcbiAgICBjYXNlIG5ldHdvcmtzLmJpdGNvaW5jYXNoOlxyXG4gICAgY2FzZSBuZXR3b3Jrcy5iaXRjb2luc3Y6XHJcbiAgICBjYXNlIG5ldHdvcmtzLmJpdGNvaW5nb2xkOlxyXG4gICAgY2FzZSBuZXR3b3Jrcy5kb2dlY29pbjpcclxuICAgIGNhc2UgbmV0d29ya3MuYml0aGVyZXVtOlxyXG4gICAgY2FzZSBuZXR3b3Jrcy5nZW5lc2lzOlxyXG4gICAgY2FzZSBuZXR3b3Jrcy5iaXRjb2luemVybzpcclxuICAgIGNhc2UgbmV0d29ya3MuaHVzaDpcclxuICAgIGNhc2UgbmV0d29ya3MucmF2ZW5jb2luOlxyXG4gICAgY2FzZSBuZXR3b3Jrcy5iaXRjb3JlOlxyXG4gICAgY2FzZSBuZXR3b3Jrcy56Y29pbjpcclxuICAgIGNhc2UgbmV0d29ya3MuYXhlOlxyXG4gICAgY2FzZSBuZXR3b3Jrcy5kaWdpYnl0ZTpcclxuICAgIGNhc2UgbmV0d29ya3Muc2lub3ZhdGU6XHJcbiAgICBjYXNlIG5ldHdvcmtzLmlsY29pbjpcclxuICAgIGNhc2UgbmV0d29ya3MucmFwdG9yZXVtOlxyXG4gICAgY2FzZSBuZXR3b3Jrcy52ZXJ0Y29pbjpcclxuICAgIGNhc2UgbmV0d29ya3MuY2xvcmU6XHJcbiAgICBjYXNlIG5ldHdvcmtzLmVjYXNoOlxyXG4gICAgICByZXR1cm4gVXR4b1RyYW5zYWN0aW9uLmZyb21CdWZmZXI8VE51bWJlcj4oYnVmLCBmYWxzZSwgYW1vdW50VHlwZSwgbmV0d29yayk7XHJcbiAgICBjYXNlIG5ldHdvcmtzLmxpdGVjb2luOlxyXG4gICAgICByZXR1cm4gTGl0ZWNvaW5UcmFuc2FjdGlvbi5mcm9tQnVmZmVyPFROdW1iZXI+KGJ1ZiwgZmFsc2UsIGFtb3VudFR5cGUsIG5ldHdvcmspO1xyXG4gICAgY2FzZSBuZXR3b3Jrcy5kYXNoOlxyXG4gICAgICByZXR1cm4gRGFzaFRyYW5zYWN0aW9uLmZyb21CdWZmZXI8VE51bWJlcj4oYnVmLCBmYWxzZSwgYW1vdW50VHlwZSwgbmV0d29yayk7XHJcbiAgICBjYXNlIG5ldHdvcmtzLnplbGNhc2g6XHJcbiAgICBjYXNlIG5ldHdvcmtzLmZsdXg6XHJcbiAgICBjYXNlIG5ldHdvcmtzLnplcm86XHJcbiAgICBjYXNlIG5ldHdvcmtzLnNub3dnZW06XHJcbiAgICBjYXNlIG5ldHdvcmtzLnNhZmVjb2luOlxyXG4gICAgY2FzZSBuZXR3b3Jrcy5rb21vZG86XHJcbiAgICBjYXNlIG5ldHdvcmtzLmdlbWxpbms6XHJcbiAgICBjYXNlIG5ldHdvcmtzLmNvbW1lcmNpdW06XHJcbiAgICBjYXNlIG5ldHdvcmtzLnpjbGFzc2ljOlxyXG4gICAgY2FzZSBuZXR3b3Jrcy5iemVkZ2U6XHJcbiAgICBjYXNlIG5ldHdvcmtzLmJpdGNvaW56OlxyXG4gICAgY2FzZSBuZXR3b3Jrcy56Y2FzaDpcclxuICAgICAgcmV0dXJuIFpjYXNoVHJhbnNhY3Rpb24uZnJvbUJ1ZmZlcldpdGhWZXJzaW9uPFROdW1iZXI+KGJ1ZiwgbmV0d29yayBhcyBaY2FzaE5ldHdvcmssIHZlcnNpb24sIGFtb3VudFR5cGUpO1xyXG4gIH1cclxuXHJcbiAgLyogaXN0YW5idWwgaWdub3JlIG5leHQgKi9cclxuICB0aHJvdyBuZXcgRXJyb3IoYGludmFsaWQgbmV0d29ya2ApO1xyXG59XHJcblxyXG4vKiBpc3RhbmJ1bCBpZ25vcmUgbmV4dCAqL1xyXG4vKiogQGRlcHJlY2F0ZWQgLSB1c2UgY3JlYXRlVHJhbnNhY3Rpb25Gcm9tQnVmZmVyIGluc3RlYWQgKi9cclxuZXhwb3J0IGZ1bmN0aW9uIGNyZWF0ZVRyYW5zYWN0aW9uRnJvbUhleChcclxuICBoZXg6IHN0cmluZyxcclxuICBuZXR3b3JrOiBOZXR3b3JrLFxyXG4gIHA6IHsgYW1vdW50VHlwZTogJ2JpZ2ludCcgfVxyXG4pOiBVdHhvVHJhbnNhY3Rpb248YmlnaW50PjtcclxuLyoqIEBkZXByZWNhdGVkIC0gdXNlIGNyZWF0ZVRyYW5zYWN0aW9uRnJvbUJ1ZmZlciBpbnN0ZWFkICovXHJcbmV4cG9ydCBmdW5jdGlvbiBjcmVhdGVUcmFuc2FjdGlvbkZyb21IZXgoaGV4OiBzdHJpbmcsIG5ldHdvcms6IE5ldHdvcmssIHA6IHsgYW1vdW50VHlwZTogJ251bWJlcicgfSk6IFV0eG9UcmFuc2FjdGlvbjtcclxuLyoqIEBkZXByZWNhdGVkIC0gdXNlIGNyZWF0ZVRyYW5zYWN0aW9uRnJvbUJ1ZmZlciBpbnN0ZWFkICovXHJcbmV4cG9ydCBmdW5jdGlvbiBjcmVhdGVUcmFuc2FjdGlvbkZyb21IZXg8VE51bWJlciBleHRlbmRzIG51bWJlciB8IGJpZ2ludCA9IG51bWJlcj4oXHJcbiAgaGV4OiBzdHJpbmcsXHJcbiAgbmV0d29yazogTmV0d29yayxcclxuICBwPzogeyBhbW91bnRUeXBlPzogJ251bWJlcicgfCAnYmlnaW50JyB9IHwgJ251bWJlcicgfCAnYmlnaW50J1xyXG4pOiBVdHhvVHJhbnNhY3Rpb248VE51bWJlcj47XHJcbmV4cG9ydCBmdW5jdGlvbiBjcmVhdGVUcmFuc2FjdGlvbkZyb21IZXg8VE51bWJlciBleHRlbmRzIG51bWJlciB8IGJpZ2ludCA9IG51bWJlcj4oXHJcbiAgaGV4OiBzdHJpbmcsXHJcbiAgbmV0d29yazogTmV0d29yayxcclxuICBwPzogeyBhbW91bnRUeXBlPzogJ251bWJlcicgfCAnYmlnaW50JyB9IHwgJ251bWJlcicgfCAnYmlnaW50J1xyXG4pOiBVdHhvVHJhbnNhY3Rpb248VE51bWJlcj4ge1xyXG4gIGlmICh0eXBlb2YgcCA9PT0gJ3N0cmluZycpIHtcclxuICAgIHAgPSB7IGFtb3VudFR5cGU6IHAgfTtcclxuICB9XHJcbiAgcmV0dXJuIGNyZWF0ZVRyYW5zYWN0aW9uRnJvbUJ1ZmZlcjxUTnVtYmVyPihCdWZmZXIuZnJvbShoZXgsICdoZXgnKSwgbmV0d29yaywgcCk7XHJcbn1cclxuXHJcbmV4cG9ydCBmdW5jdGlvbiBjcmVhdGVQc2J0RnJvbUJ1ZmZlcihidWY6IEJ1ZmZlciwgbmV0d29yazogTmV0d29yaywgYmlwMzJQYXRoc0Fic29sdXRlID0gZmFsc2UpOiBVdHhvUHNidCB7XHJcbiAgc3dpdGNoIChnZXRNYWlubmV0KG5ldHdvcmspKSB7XHJcbiAgICBjYXNlIG5ldHdvcmtzLmJpdGNvaW46XHJcbiAgICBjYXNlIG5ldHdvcmtzLmJpdGNvaW5jYXNoOlxyXG4gICAgY2FzZSBuZXR3b3Jrcy5iaXRjb2luc3Y6XHJcbiAgICBjYXNlIG5ldHdvcmtzLmJpdGNvaW5nb2xkOlxyXG4gICAgY2FzZSBuZXR3b3Jrcy5kb2dlY29pbjpcclxuICAgIGNhc2UgbmV0d29ya3MuYml0aGVyZXVtOlxyXG4gICAgY2FzZSBuZXR3b3Jrcy5nZW5lc2lzOlxyXG4gICAgY2FzZSBuZXR3b3Jrcy5iaXRjb2luemVybzpcclxuICAgIGNhc2UgbmV0d29ya3MuaHVzaDpcclxuICAgIGNhc2UgbmV0d29ya3MucmF2ZW5jb2luOlxyXG4gICAgY2FzZSBuZXR3b3Jrcy5iaXRjb3JlOlxyXG4gICAgY2FzZSBuZXR3b3Jrcy56Y29pbjpcclxuICAgIGNhc2UgbmV0d29ya3MuYXhlOlxyXG4gICAgY2FzZSBuZXR3b3Jrcy5kaWdpYnl0ZTpcclxuICAgIGNhc2UgbmV0d29ya3Muc2lub3ZhdGU6XHJcbiAgICBjYXNlIG5ldHdvcmtzLmlsY29pbjpcclxuICAgIGNhc2UgbmV0d29ya3MucmFwdG9yZXVtOlxyXG4gICAgY2FzZSBuZXR3b3Jrcy52ZXJ0Y29pbjpcclxuICAgIGNhc2UgbmV0d29ya3MuY2xvcmU6XHJcbiAgICBjYXNlIG5ldHdvcmtzLmVjYXNoOlxyXG4gICAgICByZXR1cm4gVXR4b1BzYnQuZnJvbUJ1ZmZlcihidWYsIHsgbmV0d29yaywgYmlwMzJQYXRoc0Fic29sdXRlIH0pO1xyXG4gICAgY2FzZSBuZXR3b3Jrcy5saXRlY29pbjpcclxuICAgICAgcmV0dXJuIExpdGVjb2luUHNidC5mcm9tQnVmZmVyKGJ1ZiwgeyBuZXR3b3JrLCBiaXAzMlBhdGhzQWJzb2x1dGUgfSk7XHJcbiAgICBjYXNlIG5ldHdvcmtzLmRhc2g6XHJcbiAgICAgIHJldHVybiBEYXNoUHNidC5mcm9tQnVmZmVyKGJ1ZiwgeyBuZXR3b3JrLCBiaXAzMlBhdGhzQWJzb2x1dGUgfSk7XHJcbiAgICBjYXNlIG5ldHdvcmtzLnplbGNhc2g6XHJcbiAgICBjYXNlIG5ldHdvcmtzLmZsdXg6XHJcbiAgICBjYXNlIG5ldHdvcmtzLnplcm86XHJcbiAgICBjYXNlIG5ldHdvcmtzLnNub3dnZW06XHJcbiAgICBjYXNlIG5ldHdvcmtzLnNhZmVjb2luOlxyXG4gICAgY2FzZSBuZXR3b3Jrcy5rb21vZG86XHJcbiAgICBjYXNlIG5ldHdvcmtzLmdlbWxpbms6XHJcbiAgICBjYXNlIG5ldHdvcmtzLmNvbW1lcmNpdW06XHJcbiAgICBjYXNlIG5ldHdvcmtzLnpjbGFzc2ljOlxyXG4gICAgY2FzZSBuZXR3b3Jrcy5iemVkZ2U6XHJcbiAgICBjYXNlIG5ldHdvcmtzLmJpdGNvaW56OlxyXG4gICAgY2FzZSBuZXR3b3Jrcy56Y2FzaDpcclxuICAgICAgcmV0dXJuIFpjYXNoUHNidC5mcm9tQnVmZmVyKGJ1ZiwgeyBuZXR3b3JrLCBiaXAzMlBhdGhzQWJzb2x1dGUgfSk7XHJcbiAgfVxyXG5cclxuICAvKiBpc3RhbmJ1bCBpZ25vcmUgbmV4dCAqL1xyXG4gIHRocm93IG5ldyBFcnJvcihgaW52YWxpZCBuZXR3b3JrYCk7XHJcbn1cclxuXHJcbmV4cG9ydCBmdW5jdGlvbiBjcmVhdGVQc2J0RnJvbUhleChoZXg6IHN0cmluZywgbmV0d29yazogTmV0d29yaywgYmlwMzJQYXRoc0Fic29sdXRlID0gZmFsc2UpOiBVdHhvUHNidCB7XHJcbiAgcmV0dXJuIGNyZWF0ZVBzYnRGcm9tQnVmZmVyKEJ1ZmZlci5mcm9tKGhleCwgJ2hleCcpLCBuZXR3b3JrLCBiaXAzMlBhdGhzQWJzb2x1dGUpO1xyXG59XHJcblxyXG5leHBvcnQgZnVuY3Rpb24gY3JlYXRlUHNidEZyb21UcmFuc2FjdGlvbih0eDogVXR4b1RyYW5zYWN0aW9uPGJpZ2ludD4sIHByZXZPdXRzOiBUeE91dHB1dDxiaWdpbnQ+W10pOiBVdHhvUHNidCB7XHJcbiAgc3dpdGNoIChnZXRNYWlubmV0KHR4Lm5ldHdvcmspKSB7XHJcbiAgICBjYXNlIG5ldHdvcmtzLmJpdGNvaW46XHJcbiAgICBjYXNlIG5ldHdvcmtzLmJpdGNvaW5jYXNoOlxyXG4gICAgY2FzZSBuZXR3b3Jrcy5iaXRjb2luc3Y6XHJcbiAgICBjYXNlIG5ldHdvcmtzLmJpdGNvaW5nb2xkOlxyXG4gICAgY2FzZSBuZXR3b3Jrcy5kb2dlY29pbjpcclxuICAgIGNhc2UgbmV0d29ya3MuYml0aGVyZXVtOlxyXG4gICAgY2FzZSBuZXR3b3Jrcy5nZW5lc2lzOlxyXG4gICAgY2FzZSBuZXR3b3Jrcy5iaXRjb2luemVybzpcclxuICAgIGNhc2UgbmV0d29ya3MuaHVzaDpcclxuICAgIGNhc2UgbmV0d29ya3MucmF2ZW5jb2luOlxyXG4gICAgY2FzZSBuZXR3b3Jrcy5iaXRjb3JlOlxyXG4gICAgY2FzZSBuZXR3b3Jrcy56Y29pbjpcclxuICAgIGNhc2UgbmV0d29ya3MuYXhlOlxyXG4gICAgY2FzZSBuZXR3b3Jrcy5kaWdpYnl0ZTpcclxuICAgIGNhc2UgbmV0d29ya3Muc2lub3ZhdGU6XHJcbiAgICBjYXNlIG5ldHdvcmtzLmlsY29pbjpcclxuICAgIGNhc2UgbmV0d29ya3MucmFwdG9yZXVtOlxyXG4gICAgY2FzZSBuZXR3b3Jrcy52ZXJ0Y29pbjpcclxuICAgIGNhc2UgbmV0d29ya3MuY2xvcmU6XHJcbiAgICBjYXNlIG5ldHdvcmtzLmVjYXNoOlxyXG4gICAgICByZXR1cm4gVXR4b1BzYnQuZnJvbVRyYW5zYWN0aW9uKHR4LCBwcmV2T3V0cyk7XHJcbiAgICBjYXNlIG5ldHdvcmtzLmxpdGVjb2luOlxyXG4gICAgICByZXR1cm4gTGl0ZWNvaW5Qc2J0LmZyb21UcmFuc2FjdGlvbih0eCwgcHJldk91dHMpO1xyXG4gICAgY2FzZSBuZXR3b3Jrcy5kYXNoOlxyXG4gICAgICByZXR1cm4gRGFzaFBzYnQuZnJvbVRyYW5zYWN0aW9uKHR4LCBwcmV2T3V0cyk7XHJcbiAgICBjYXNlIG5ldHdvcmtzLnplbGNhc2g6XHJcbiAgICBjYXNlIG5ldHdvcmtzLmZsdXg6XHJcbiAgICBjYXNlIG5ldHdvcmtzLnplcm86XHJcbiAgICBjYXNlIG5ldHdvcmtzLnNub3dnZW06XHJcbiAgICBjYXNlIG5ldHdvcmtzLnNhZmVjb2luOlxyXG4gICAgY2FzZSBuZXR3b3Jrcy5rb21vZG86XHJcbiAgICBjYXNlIG5ldHdvcmtzLmdlbWxpbms6XHJcbiAgICBjYXNlIG5ldHdvcmtzLmNvbW1lcmNpdW06XHJcbiAgICBjYXNlIG5ldHdvcmtzLnpjbGFzc2ljOlxyXG4gICAgY2FzZSBuZXR3b3Jrcy5iemVkZ2U6XHJcbiAgICBjYXNlIG5ldHdvcmtzLmJpdGNvaW56OlxyXG4gICAgY2FzZSBuZXR3b3Jrcy56Y2FzaDpcclxuICAgICAgcmV0dXJuIFpjYXNoUHNidC5mcm9tVHJhbnNhY3Rpb24odHgsIHByZXZPdXRzKTtcclxuICB9XHJcblxyXG4gIC8qIGlzdGFuYnVsIGlnbm9yZSBuZXh0ICovXHJcbiAgdGhyb3cgbmV3IEVycm9yKGBpbnZhbGlkIG5ldHdvcmtgKTtcclxufVxyXG5cclxuZXhwb3J0IGZ1bmN0aW9uIGdldERlZmF1bHRUcmFuc2FjdGlvblZlcnNpb24obmV0d29yazogTmV0d29yayk6IG51bWJlciB7XHJcbiAgc3dpdGNoIChnZXRNYWlubmV0KG5ldHdvcmspKSB7XHJcbiAgICBjYXNlIG5ldHdvcmtzLmJpdGNvaW5jYXNoOlxyXG4gICAgY2FzZSBuZXR3b3Jrcy5iaXRjb2luc3Y6XHJcbiAgICBjYXNlIG5ldHdvcmtzLmJpdGNvaW5nb2xkOlxyXG4gICAgY2FzZSBuZXR3b3Jrcy5lY2FzaDpcclxuICAgICAgcmV0dXJuIDI7XHJcbiAgICBjYXNlIG5ldHdvcmtzLnplbGNhc2g6XHJcbiAgICBjYXNlIG5ldHdvcmtzLmZsdXg6XHJcbiAgICBjYXNlIG5ldHdvcmtzLnplcm86XHJcbiAgICBjYXNlIG5ldHdvcmtzLnNub3dnZW06XHJcbiAgICBjYXNlIG5ldHdvcmtzLnNhZmVjb2luOlxyXG4gICAgY2FzZSBuZXR3b3Jrcy5rb21vZG86XHJcbiAgICBjYXNlIG5ldHdvcmtzLmdlbWxpbms6XHJcbiAgICBjYXNlIG5ldHdvcmtzLmNvbW1lcmNpdW06XHJcbiAgICBjYXNlIG5ldHdvcmtzLnpjbGFzc2ljOlxyXG4gICAgY2FzZSBuZXR3b3Jrcy5iemVkZ2U6XHJcbiAgICBjYXNlIG5ldHdvcmtzLmJpdGNvaW56OlxyXG4gICAgY2FzZSBuZXR3b3Jrcy56Y2FzaDpcclxuICAgICAgcmV0dXJuIFpjYXNoVHJhbnNhY3Rpb24uVkVSU0lPTjRfQlJBTkNIX05VNTtcclxuICAgIGRlZmF1bHQ6XHJcbiAgICAgIHJldHVybiAxO1xyXG4gIH1cclxufVxyXG5cclxuZXhwb3J0IGZ1bmN0aW9uIHNldFRyYW5zYWN0aW9uQnVpbGRlckRlZmF1bHRzPFROdW1iZXIgZXh0ZW5kcyBudW1iZXIgfCBiaWdpbnQ+KFxyXG4gIHR4YjogVXR4b1RyYW5zYWN0aW9uQnVpbGRlcjxUTnVtYmVyPixcclxuICBuZXR3b3JrOiBOZXR3b3JrLFxyXG4gIHsgdmVyc2lvbiA9IGdldERlZmF1bHRUcmFuc2FjdGlvblZlcnNpb24obmV0d29yaykgfTogeyB2ZXJzaW9uPzogbnVtYmVyIH0gPSB7fVxyXG4pOiB2b2lkIHtcclxuICBzd2l0Y2ggKGdldE1haW5uZXQobmV0d29yaykpIHtcclxuICAgIGNhc2UgbmV0d29ya3MuYml0Y29pbmNhc2g6XHJcbiAgICBjYXNlIG5ldHdvcmtzLmJpdGNvaW5zdjpcclxuICAgIGNhc2UgbmV0d29ya3MuYml0Y29pbmdvbGQ6XHJcbiAgICBjYXNlIG5ldHdvcmtzLmVjYXNoOlxyXG4gICAgICBpZiAodmVyc2lvbiAhPT0gMikge1xyXG4gICAgICAgIHRocm93IG5ldyBFcnJvcihgaW52YWxpZCB2ZXJzaW9uYCk7XHJcbiAgICAgIH1cclxuICAgICAgdHhiLnNldFZlcnNpb24odmVyc2lvbik7XHJcbiAgICAgIGJyZWFrO1xyXG4gICAgY2FzZSBuZXR3b3Jrcy56ZWxjYXNoOlxyXG4gICAgY2FzZSBuZXR3b3Jrcy5mbHV4OlxyXG4gICAgY2FzZSBuZXR3b3Jrcy56ZXJvOlxyXG4gICAgY2FzZSBuZXR3b3Jrcy5zbm93Z2VtOlxyXG4gICAgY2FzZSBuZXR3b3Jrcy5zYWZlY29pbjpcclxuICAgIGNhc2UgbmV0d29ya3Mua29tb2RvOlxyXG4gICAgY2FzZSBuZXR3b3Jrcy5nZW1saW5rOlxyXG4gICAgY2FzZSBuZXR3b3Jrcy5jb21tZXJjaXVtOlxyXG4gICAgY2FzZSBuZXR3b3Jrcy56Y2xhc3NpYzpcclxuICAgIGNhc2UgbmV0d29ya3MuYnplZGdlOlxyXG4gICAgY2FzZSBuZXR3b3Jrcy5iaXRjb2luejpcclxuICAgIGNhc2UgbmV0d29ya3MuemNhc2g6XHJcbiAgICAgICh0eGIgYXMgWmNhc2hUcmFuc2FjdGlvbkJ1aWxkZXI8VE51bWJlcj4pLnNldERlZmF1bHRzRm9yVmVyc2lvbihuZXR3b3JrLCB2ZXJzaW9uKTtcclxuICAgICAgYnJlYWs7XHJcbiAgICBkZWZhdWx0OlxyXG4gICAgICBpZiAodmVyc2lvbiAhPT0gMSkge1xyXG4gICAgICAgIHRocm93IG5ldyBFcnJvcihgaW52YWxpZCB2ZXJzaW9uYCk7XHJcbiAgICAgIH1cclxuICB9XHJcbn1cclxuXHJcbmV4cG9ydCBmdW5jdGlvbiBzZXRQc2J0RGVmYXVsdHMoXHJcbiAgcHNidDogVXR4b1BzYnQsXHJcbiAgbmV0d29yazogTmV0d29yayxcclxuICB7IHZlcnNpb24gPSBnZXREZWZhdWx0VHJhbnNhY3Rpb25WZXJzaW9uKG5ldHdvcmspIH06IHsgdmVyc2lvbj86IG51bWJlciB9ID0ge31cclxuKTogdm9pZCB7XHJcbiAgc3dpdGNoIChnZXRNYWlubmV0KG5ldHdvcmspKSB7XHJcbiAgICBjYXNlIG5ldHdvcmtzLmJpdGNvaW5jYXNoOlxyXG4gICAgY2FzZSBuZXR3b3Jrcy5iaXRjb2luc3Y6XHJcbiAgICBjYXNlIG5ldHdvcmtzLmJpdGNvaW5nb2xkOlxyXG4gICAgY2FzZSBuZXR3b3Jrcy5lY2FzaDpcclxuICAgICAgaWYgKHZlcnNpb24gIT09IDIpIHtcclxuICAgICAgICB0aHJvdyBuZXcgRXJyb3IoYGludmFsaWQgdmVyc2lvbmApO1xyXG4gICAgICB9XHJcbiAgICAgIGJyZWFrO1xyXG4gICAgY2FzZSBuZXR3b3Jrcy56ZWxjYXNoOlxyXG4gICAgY2FzZSBuZXR3b3Jrcy5mbHV4OlxyXG4gICAgY2FzZSBuZXR3b3Jrcy56ZXJvOlxyXG4gICAgY2FzZSBuZXR3b3Jrcy5zbm93Z2VtOlxyXG4gICAgY2FzZSBuZXR3b3Jrcy5zYWZlY29pbjpcclxuICAgIGNhc2UgbmV0d29ya3Mua29tb2RvOlxyXG4gICAgY2FzZSBuZXR3b3Jrcy5nZW1saW5rOlxyXG4gICAgY2FzZSBuZXR3b3Jrcy5jb21tZXJjaXVtOlxyXG4gICAgY2FzZSBuZXR3b3Jrcy56Y2xhc3NpYzpcclxuICAgIGNhc2UgbmV0d29ya3MuYnplZGdlOlxyXG4gICAgY2FzZSBuZXR3b3Jrcy5iaXRjb2luejpcclxuICAgIGNhc2UgbmV0d29ya3MuemNhc2g6XHJcbiAgICAgIGlmIChcclxuICAgICAgICAhW1xyXG4gICAgICAgICAgWmNhc2hUcmFuc2FjdGlvbi5WRVJTSU9ONF9CUkFOQ0hfQ0FOT1BZLFxyXG4gICAgICAgICAgWmNhc2hUcmFuc2FjdGlvbi5WRVJTSU9ONF9CUkFOQ0hfTlU1LFxyXG4gICAgICAgICAgWmNhc2hUcmFuc2FjdGlvbi5WRVJTSU9ONV9CUkFOQ0hfTlU1LFxyXG4gICAgICAgIF0uaW5jbHVkZXModmVyc2lvbilcclxuICAgICAgKSB7XHJcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yKGBpbnZhbGlkIHZlcnNpb25gKTtcclxuICAgICAgfVxyXG4gICAgICAocHNidCBhcyBaY2FzaFBzYnQpLnNldERlZmF1bHRzRm9yVmVyc2lvbihuZXR3b3JrLCB2ZXJzaW9uKTtcclxuICAgICAgYnJlYWs7XHJcbiAgICBkZWZhdWx0OlxyXG4gICAgICBpZiAodmVyc2lvbiAhPT0gMSkge1xyXG4gICAgICAgIHRocm93IG5ldyBFcnJvcihgaW52YWxpZCB2ZXJzaW9uYCk7XHJcbiAgICAgIH1cclxuICAgICAgLy8gRklYTUU6IHNldCB2ZXJzaW9uIGhlcmUsIGJlY2F1c2UgdGhlcmUncyBhIGJ1ZyBpbiB0aGUgdXBzdHJlYW0gUFNCVFxyXG4gICAgICAvLyB0aGF0IGRlZmF1bHRzIHRyYW5zYWN0aW9ucyB0byB2Mi5cclxuICAgICAgcHNidC5zZXRWZXJzaW9uKHZlcnNpb24pO1xyXG4gIH1cclxufVxyXG5cclxuZXhwb3J0IGZ1bmN0aW9uIGNyZWF0ZVBzYnRGb3JOZXR3b3JrKHBzYnRPcHRzOiBQc2J0T3B0cywgeyB2ZXJzaW9uIH06IHsgdmVyc2lvbj86IG51bWJlciB9ID0ge30pOiBVdHhvUHNidCB7XHJcbiAgbGV0IHBzYnQ7XHJcblxyXG4gIHN3aXRjaCAoZ2V0TWFpbm5ldChwc2J0T3B0cy5uZXR3b3JrKSkge1xyXG4gICAgY2FzZSBuZXR3b3Jrcy5iaXRjb2luOlxyXG4gICAgY2FzZSBuZXR3b3Jrcy5iaXRjb2luY2FzaDpcclxuICAgIGNhc2UgbmV0d29ya3MuYml0Y29pbnN2OlxyXG4gICAgY2FzZSBuZXR3b3Jrcy5iaXRjb2luZ29sZDpcclxuICAgIGNhc2UgbmV0d29ya3MuZG9nZWNvaW46XHJcbiAgICBjYXNlIG5ldHdvcmtzLmJpdGhlcmV1bTpcclxuICAgIGNhc2UgbmV0d29ya3MuZ2VuZXNpczpcclxuICAgIGNhc2UgbmV0d29ya3MuYml0Y29pbnplcm86XHJcbiAgICBjYXNlIG5ldHdvcmtzLmh1c2g6XHJcbiAgICBjYXNlIG5ldHdvcmtzLnJhdmVuY29pbjpcclxuICAgIGNhc2UgbmV0d29ya3MuYml0Y29yZTpcclxuICAgIGNhc2UgbmV0d29ya3MuemNvaW46XHJcbiAgICBjYXNlIG5ldHdvcmtzLmF4ZTpcclxuICAgIGNhc2UgbmV0d29ya3MuZGlnaWJ5dGU6XHJcbiAgICBjYXNlIG5ldHdvcmtzLnNpbm92YXRlOlxyXG4gICAgY2FzZSBuZXR3b3Jrcy5pbGNvaW46XHJcbiAgICBjYXNlIG5ldHdvcmtzLnJhcHRvcmV1bTpcclxuICAgIGNhc2UgbmV0d29ya3MudmVydGNvaW46XHJcbiAgICBjYXNlIG5ldHdvcmtzLmNsb3JlOlxyXG4gICAgY2FzZSBuZXR3b3Jrcy5lY2FzaDoge1xyXG4gICAgICBwc2J0ID0gVXR4b1BzYnQuY3JlYXRlUHNidChwc2J0T3B0cyk7XHJcbiAgICAgIGJyZWFrO1xyXG4gICAgfVxyXG4gICAgY2FzZSBuZXR3b3Jrcy5saXRlY29pbjoge1xyXG4gICAgICBwc2J0ID0gTGl0ZWNvaW5Qc2J0LmNyZWF0ZVBzYnQocHNidE9wdHMpO1xyXG4gICAgICBicmVhaztcclxuICAgIH1cclxuICAgIGNhc2UgbmV0d29ya3MuZGFzaDoge1xyXG4gICAgICBwc2J0ID0gRGFzaFBzYnQuY3JlYXRlUHNidChwc2J0T3B0cyk7XHJcbiAgICAgIGJyZWFrO1xyXG4gICAgfVxyXG4gICAgY2FzZSBuZXR3b3Jrcy56ZWxjYXNoOlxyXG4gICAgY2FzZSBuZXR3b3Jrcy5mbHV4OlxyXG4gICAgY2FzZSBuZXR3b3Jrcy56ZXJvOlxyXG4gICAgY2FzZSBuZXR3b3Jrcy5zbm93Z2VtOlxyXG4gICAgY2FzZSBuZXR3b3Jrcy5zYWZlY29pbjpcclxuICAgIGNhc2UgbmV0d29ya3Mua29tb2RvOlxyXG4gICAgY2FzZSBuZXR3b3Jrcy5nZW1saW5rOlxyXG4gICAgY2FzZSBuZXR3b3Jrcy5jb21tZXJjaXVtOlxyXG4gICAgY2FzZSBuZXR3b3Jrcy56Y2xhc3NpYzpcclxuICAgIGNhc2UgbmV0d29ya3MuYnplZGdlOlxyXG4gICAgY2FzZSBuZXR3b3Jrcy5iaXRjb2luejpcclxuICAgIGNhc2UgbmV0d29ya3MuemNhc2g6IHtcclxuICAgICAgcHNidCA9IFpjYXNoUHNidC5jcmVhdGVQc2J0KHBzYnRPcHRzKTtcclxuICAgICAgYnJlYWs7XHJcbiAgICB9XHJcbiAgICBkZWZhdWx0OlxyXG4gICAgICB0aHJvdyBuZXcgRXJyb3IoYHVuc3VwcG9ydGVkIG5ldHdvcmtgKTtcclxuICB9XHJcblxyXG4gIHNldFBzYnREZWZhdWx0cyhwc2J0LCBwc2J0T3B0cy5uZXR3b3JrLCB7IHZlcnNpb24gfSk7XHJcblxyXG4gIHJldHVybiBwc2J0O1xyXG59XHJcblxyXG5leHBvcnQgZnVuY3Rpb24gY3JlYXRlVHJhbnNhY3Rpb25CdWlsZGVyRm9yTmV0d29yazxUTnVtYmVyIGV4dGVuZHMgbnVtYmVyIHwgYmlnaW50ID0gbnVtYmVyPihcclxuICBuZXR3b3JrOiBOZXR3b3JrLFxyXG4gIHsgdmVyc2lvbiB9OiB7IHZlcnNpb24/OiBudW1iZXIgfSA9IHt9XHJcbik6IFV0eG9UcmFuc2FjdGlvbkJ1aWxkZXI8VE51bWJlcj4ge1xyXG4gIGxldCB0eGI7XHJcbiAgc3dpdGNoIChnZXRNYWlubmV0KG5ldHdvcmspKSB7XHJcbiAgICBjYXNlIG5ldHdvcmtzLmJpdGNvaW46XHJcbiAgICBjYXNlIG5ldHdvcmtzLmJpdGNvaW5jYXNoOlxyXG4gICAgY2FzZSBuZXR3b3Jrcy5iaXRjb2luc3Y6XHJcbiAgICBjYXNlIG5ldHdvcmtzLmJpdGNvaW5nb2xkOlxyXG4gICAgY2FzZSBuZXR3b3Jrcy5kb2dlY29pbjpcclxuICAgIGNhc2UgbmV0d29ya3MuYml0aGVyZXVtOlxyXG4gICAgY2FzZSBuZXR3b3Jrcy5nZW5lc2lzOlxyXG4gICAgY2FzZSBuZXR3b3Jrcy5iaXRjb2luemVybzpcclxuICAgIGNhc2UgbmV0d29ya3MuaHVzaDpcclxuICAgIGNhc2UgbmV0d29ya3MucmF2ZW5jb2luOlxyXG4gICAgY2FzZSBuZXR3b3Jrcy5iaXRjb3JlOlxyXG4gICAgY2FzZSBuZXR3b3Jrcy56Y29pbjpcclxuICAgIGNhc2UgbmV0d29ya3MuYXhlOlxyXG4gICAgY2FzZSBuZXR3b3Jrcy5kaWdpYnl0ZTpcclxuICAgIGNhc2UgbmV0d29ya3Muc2lub3ZhdGU6XHJcbiAgICBjYXNlIG5ldHdvcmtzLmlsY29pbjpcclxuICAgIGNhc2UgbmV0d29ya3MucmFwdG9yZXVtOlxyXG4gICAgY2FzZSBuZXR3b3Jrcy52ZXJ0Y29pbjpcclxuICAgIGNhc2UgbmV0d29ya3MuY2xvcmU6XHJcbiAgICBjYXNlIG5ldHdvcmtzLmVjYXNoOiB7XHJcbiAgICAgIHR4YiA9IG5ldyBVdHhvVHJhbnNhY3Rpb25CdWlsZGVyPFROdW1iZXI+KG5ldHdvcmspO1xyXG4gICAgICBicmVhaztcclxuICAgIH1cclxuICAgIGNhc2UgbmV0d29ya3MubGl0ZWNvaW46IHtcclxuICAgICAgdHhiID0gbmV3IExpdGVjb2luVHJhbnNhY3Rpb25CdWlsZGVyPFROdW1iZXI+KG5ldHdvcmspO1xyXG4gICAgICBicmVhaztcclxuICAgIH1cclxuICAgIGNhc2UgbmV0d29ya3MuZGFzaDpcclxuICAgICAgdHhiID0gbmV3IERhc2hUcmFuc2FjdGlvbkJ1aWxkZXI8VE51bWJlcj4obmV0d29yayk7XHJcbiAgICAgIGJyZWFrO1xyXG4gICAgY2FzZSBuZXR3b3Jrcy56ZWxjYXNoOlxyXG4gICAgY2FzZSBuZXR3b3Jrcy5mbHV4OlxyXG4gICAgY2FzZSBuZXR3b3Jrcy56ZXJvOlxyXG4gICAgY2FzZSBuZXR3b3Jrcy5zbm93Z2VtOlxyXG4gICAgY2FzZSBuZXR3b3Jrcy5zYWZlY29pbjpcclxuICAgIGNhc2UgbmV0d29ya3Mua29tb2RvOlxyXG4gICAgY2FzZSBuZXR3b3Jrcy5nZW1saW5rOlxyXG4gICAgY2FzZSBuZXR3b3Jrcy5jb21tZXJjaXVtOlxyXG4gICAgY2FzZSBuZXR3b3Jrcy56Y2xhc3NpYzpcclxuICAgIGNhc2UgbmV0d29ya3MuYnplZGdlOlxyXG4gICAgY2FzZSBuZXR3b3Jrcy5iaXRjb2luejpcclxuICAgIGNhc2UgbmV0d29ya3MuemNhc2g6IHtcclxuICAgICAgdHhiID0gbmV3IFpjYXNoVHJhbnNhY3Rpb25CdWlsZGVyPFROdW1iZXI+KG5ldHdvcmsgYXMgWmNhc2hOZXR3b3JrKTtcclxuICAgICAgYnJlYWs7XHJcbiAgICB9XHJcbiAgICBkZWZhdWx0OlxyXG4gICAgICB0aHJvdyBuZXcgRXJyb3IoYHVuc3VwcG9ydGVkIG5ldHdvcmtgKTtcclxuICB9XHJcblxyXG4gIHNldFRyYW5zYWN0aW9uQnVpbGRlckRlZmF1bHRzPFROdW1iZXI+KHR4YiwgbmV0d29yaywgeyB2ZXJzaW9uIH0pO1xyXG5cclxuICByZXR1cm4gdHhiO1xyXG59XHJcblxyXG5leHBvcnQgZnVuY3Rpb24gY3JlYXRlVHJhbnNhY3Rpb25CdWlsZGVyRnJvbVRyYW5zYWN0aW9uPFROdW1iZXIgZXh0ZW5kcyBudW1iZXIgfCBiaWdpbnQ+KFxyXG4gIHR4OiBVdHhvVHJhbnNhY3Rpb248VE51bWJlcj4sXHJcbiAgcHJldk91dHB1dHM/OiBUeE91dHB1dDxUTnVtYmVyPltdXHJcbik6IFV0eG9UcmFuc2FjdGlvbkJ1aWxkZXI8VE51bWJlcj4ge1xyXG4gIHN3aXRjaCAoZ2V0TWFpbm5ldCh0eC5uZXR3b3JrKSkge1xyXG4gICAgY2FzZSBuZXR3b3Jrcy5iaXRjb2luOlxyXG4gICAgY2FzZSBuZXR3b3Jrcy5iaXRjb2luY2FzaDpcclxuICAgIGNhc2UgbmV0d29ya3MuYml0Y29pbnN2OlxyXG4gICAgY2FzZSBuZXR3b3Jrcy5iaXRjb2luZ29sZDpcclxuICAgIGNhc2UgbmV0d29ya3MuZG9nZWNvaW46XHJcbiAgICBjYXNlIG5ldHdvcmtzLmJpdGhlcmV1bTpcclxuICAgIGNhc2UgbmV0d29ya3MuZ2VuZXNpczpcclxuICAgIGNhc2UgbmV0d29ya3MuYml0Y29pbnplcm86XHJcbiAgICBjYXNlIG5ldHdvcmtzLmh1c2g6XHJcbiAgICBjYXNlIG5ldHdvcmtzLnJhdmVuY29pbjpcclxuICAgIGNhc2UgbmV0d29ya3MuYml0Y29yZTpcclxuICAgIGNhc2UgbmV0d29ya3MuemNvaW46XHJcbiAgICBjYXNlIG5ldHdvcmtzLmF4ZTpcclxuICAgIGNhc2UgbmV0d29ya3MuZGlnaWJ5dGU6XHJcbiAgICBjYXNlIG5ldHdvcmtzLnNpbm92YXRlOlxyXG4gICAgY2FzZSBuZXR3b3Jrcy5pbGNvaW46XHJcbiAgICBjYXNlIG5ldHdvcmtzLnJhcHRvcmV1bTpcclxuICAgIGNhc2UgbmV0d29ya3MudmVydGNvaW46XHJcbiAgICBjYXNlIG5ldHdvcmtzLmNsb3JlOlxyXG4gICAgY2FzZSBuZXR3b3Jrcy5lY2FzaDpcclxuICAgICAgcmV0dXJuIFV0eG9UcmFuc2FjdGlvbkJ1aWxkZXIuZnJvbVRyYW5zYWN0aW9uPFROdW1iZXI+KHR4LCB1bmRlZmluZWQsIHByZXZPdXRwdXRzKTtcclxuICAgIGNhc2UgbmV0d29ya3MubGl0ZWNvaW46XHJcbiAgICAgIHJldHVybiBMaXRlY29pblRyYW5zYWN0aW9uQnVpbGRlci5mcm9tVHJhbnNhY3Rpb248VE51bWJlcj4oXHJcbiAgICAgICAgdHggYXMgTGl0ZWNvaW5UcmFuc2FjdGlvbjxUTnVtYmVyPixcclxuICAgICAgICB1bmRlZmluZWQsXHJcbiAgICAgICAgcHJldk91dHB1dHMgYXMgVHhPdXRwdXQ8VE51bWJlcj5bXVxyXG4gICAgICApO1xyXG4gICAgY2FzZSBuZXR3b3Jrcy5kYXNoOlxyXG4gICAgICByZXR1cm4gRGFzaFRyYW5zYWN0aW9uQnVpbGRlci5mcm9tVHJhbnNhY3Rpb248VE51bWJlcj4oXHJcbiAgICAgICAgdHggYXMgRGFzaFRyYW5zYWN0aW9uPFROdW1iZXI+LFxyXG4gICAgICAgIHVuZGVmaW5lZCxcclxuICAgICAgICBwcmV2T3V0cHV0cyBhcyBUeE91dHB1dDxUTnVtYmVyPltdXHJcbiAgICAgICk7XHJcbiAgICBjYXNlIG5ldHdvcmtzLnplbGNhc2g6XHJcbiAgICBjYXNlIG5ldHdvcmtzLmZsdXg6XHJcbiAgICBjYXNlIG5ldHdvcmtzLnplcm86XHJcbiAgICBjYXNlIG5ldHdvcmtzLnNub3dnZW06XHJcbiAgICBjYXNlIG5ldHdvcmtzLnNhZmVjb2luOlxyXG4gICAgY2FzZSBuZXR3b3Jrcy5rb21vZG86XHJcbiAgICBjYXNlIG5ldHdvcmtzLmdlbWxpbms6XHJcbiAgICBjYXNlIG5ldHdvcmtzLmNvbW1lcmNpdW06XHJcbiAgICBjYXNlIG5ldHdvcmtzLnpjbGFzc2ljOlxyXG4gICAgY2FzZSBuZXR3b3Jrcy5iemVkZ2U6XHJcbiAgICBjYXNlIG5ldHdvcmtzLmJpdGNvaW56OlxyXG4gICAgY2FzZSBuZXR3b3Jrcy56Y2FzaDpcclxuICAgICAgcmV0dXJuIFpjYXNoVHJhbnNhY3Rpb25CdWlsZGVyLmZyb21UcmFuc2FjdGlvbjxUTnVtYmVyPihcclxuICAgICAgICB0eCBhcyBaY2FzaFRyYW5zYWN0aW9uPFROdW1iZXI+LFxyXG4gICAgICAgIHVuZGVmaW5lZCxcclxuICAgICAgICBwcmV2T3V0cHV0cyBhcyBUeE91dHB1dDxUTnVtYmVyPltdXHJcbiAgICAgICk7XHJcbiAgfVxyXG5cclxuICB0aHJvdyBuZXcgRXJyb3IoYGludmFsaWQgbmV0d29ya2ApO1xyXG59XHJcbiJdfQ==
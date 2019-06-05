'use strict';
require('app-module-path').addPath(process.env.baseDir);
const txStatusPending = 'PENDING';
const txStatusConfirmed = true;
const txStatusError = false;

class TxStatusHelper{
    constructor(){
        this.STATUS_PENDING = txStatusPending;
        this.STATUS_CONFIRMED = txStatusConfirmed;
        this.STATUS_ERROR = txStatusError;
    }
}

module.exports = new TxStatusHelper();
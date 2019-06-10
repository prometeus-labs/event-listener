'use strict';
require('app-module-path').addPath(process.env.baseDir);
var Model = require('core/models/mongoModels/Model.js');
const schemaAttr = 
{
	topic:String,
	fromAddress:String,
	toAddress:String,
	value:String,
	blockNumber:Number,
	txHash:String,
    reported: Number
};

const indexFields = {txHash:1};
const indexOptions ={unique:true};
const COLLECTION_NAME = 'StoredEthEvents';

function StoredEthEvent(){

};

StoredEthEvent.prototype = new Model(COLLECTION_NAME,schemaAttr,indexFields,indexOptions);
module.exports = new StoredEthEvent();

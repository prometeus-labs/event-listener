'use strict';
require('app-module-path').addPath(process.env.baseDir);
var Model = require('core/models/mongoModels/Model.js');
const TYPE_TRANSFER = 'Transfer';
const TYPE_LINK = 'Link';

const TransferEventData = {
	fromAddress:String,
	toAddress:String,
	value:Number
};

const LinkEventData = {
	validatorAddress:String,
	ownerAddress:String,
	price:Number,
};

const schemaAttr =
{
	topic:String,
	eventData:Object,
	blockNumber:Number,
	txHash:String,
    reported: Number
};

const indexFields = {txHash:1};
const indexOptions ={};//{unique:true};
const COLLECTION_NAME = 'StoredEthEvents';

function StoredEthEvent(){

};

let methods = {
	isTransfer(){
		return this.protocol===TYPE_TRANSFER;
	},
	isLink(){
		return this.protocol===TYPE_LINK;
	},
	getEventData:function(){
		return this.eventData;
	},
	getEventDataMaps:function(protocol=TYPE_TRANSFER){
		let eventData;
		switch (protocol) {
			case TYPE_TRANSFER:{
				eventData = TransferEventData
				break;
			}
			case TYPE_LINK:{
				eventData = LinkEventData;
				break;
			}
		}
		return eventData;
	}
}
StoredEthEvent.prototype = new Model(COLLECTION_NAME,schemaAttr,indexFields,indexOptions,methods);
module.exports = new StoredEthEvent();

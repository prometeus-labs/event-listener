'use strict';
require('app-module-path').addPath(process.env.baseDir);
function Model(collectionName,fields,indexFields={}, indexOptions={},methods={}){
    this.collectionName = collectionName;
    this.fields = fields;
    this.indexFields=indexFields;
    this.indexOptions=indexOptions;
    this.methods = methods;
}

module.exports = Model;
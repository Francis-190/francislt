/*global QUnit*/

sap.ui.define([
	"billingsimplification/controller/dealerandmodel.controller"
], function (Controller) {
	"use strict";

	QUnit.module("dealerandmodel Controller");

	QUnit.test("I should test the dealerandmodel controller", function (assert) {
		var oAppController = new Controller();
		oAppController.onInit();
		assert.ok(oAppController);
	});

});

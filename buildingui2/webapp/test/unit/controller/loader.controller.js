/*global QUnit*/

sap.ui.define([
	"buildingui2/controller/loader.controller"
], function (Controller) {
	"use strict";

	QUnit.module("loader Controller");

	QUnit.test("I should test the loader controller", function (assert) {
		var oAppController = new Controller();
		oAppController.onInit();
		assert.ok(oAppController);
	});

});

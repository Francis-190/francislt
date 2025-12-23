/*global QUnit*/

sap.ui.define([
	"vechilepricingui/controller/vechileoverview.controller"
], function (Controller) {
	"use strict";

	QUnit.module("vechileoverview Controller");

	QUnit.test("I should test the vechileoverview controller", function (assert) {
		var oAppController = new Controller();
		oAppController.onInit();
		assert.ok(oAppController);
	});

});

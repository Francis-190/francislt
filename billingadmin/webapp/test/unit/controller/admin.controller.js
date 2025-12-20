/*global QUnit*/

sap.ui.define([
	"billingadmin/controller/admin.controller"
], function (Controller) {
	"use strict";

	QUnit.module("admin Controller");

	QUnit.test("I should test the admin controller", function (assert) {
		var oAppController = new Controller();
		oAppController.onInit();
		assert.ok(oAppController);
	});

});

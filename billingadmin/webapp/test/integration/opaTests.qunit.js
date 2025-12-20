/* global QUnit */
QUnit.config.autostart = false;

sap.ui.require(["billingadmin/test/integration/AllJourneys"
], function () {
	QUnit.start();
});

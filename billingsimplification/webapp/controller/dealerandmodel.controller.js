sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/ui/core/format/NumberFormat",
    "sap/m/MessageBox"


], (Controller,NumberFormat,MessageBox) => {
    "use strict";

    return Controller.extend("billingsimplification.controller.dealerandmodel", {
       onInit: function () {
            const oViewModel = new sap.ui.model.json.JSONModel({});
            this.getView().setModel(oViewModel, "viewModel");
        },
 
        onModelDescPress: async function (oEvent) {
            const oView = this.getView();
            const sDealerId = oView.byId("idDealerCombo").getSelectedKey();
            const oVBox = oView.byId("vectorFlowBox");
 
            if (!sDealerId) {
                sap.m.MessageToast.show("Please select a Dealer.");
                return;
            }
 
            const oLink = oEvent.getSource();
            const oContext = oLink.getBindingContext("viewModel");
            const sModelCode = oContext.getProperty("modelCode");
 
            if (this._lastModelCode === sModelCode) {
                oVBox.setVisible(!oVBox.getVisible());
                return;
            }
 
            try {
                const oModel = oView.getModel();
 
                // OData V4: bindContext + requestObject
                const oDealerContext = oModel.bindContext(`/Dealer('${sDealerId}')?$expand=billings`);
                const oData = await oDealerContext.requestObject();
 
                const aAllBillings = oData.billings || [];
                const aFilteredBilling = aAllBillings.filter(item => item.modelCode === sModelCode);
 
                const oDialogModel = new sap.ui.model.json.JSONModel({ Billings: aFilteredBilling });
                oView.setModel(oDialogModel, "dialogModel");
 
                oVBox.setVisible(true);
                this._lastModelCode = sModelCode;
 
            } catch (error) {
                sap.m.MessageToast.show("Failed to load dealer billing data.");
                console.error("Error loading dealer:", error);
            }
        },
 
        onCloseDialog: function () {
            if (this.oDialog) {
                this.oDialog.close();
            }
        },
 
       onOrderQtyChange: function (oEvent) {
            const oInput = oEvent.getSource();
            const sNewValue = oInput.getValue();
            const oContext = oInput.getBindingContext("viewModel");
 
            const oData = oContext.getObject();
 
            if (oData._originalQuantity === undefined) {
                oData._originalQuantity = oData.totalQuantity;
            }
 
            const oTable = this.getView().byId("allocationTable1");
            const oRow = oTable.getRows().find(row => row.getCells().includes(oInput));
            if (!oRow) return;
 
            const oButton = oRow.getCells().find(ctrl => ctrl.isA("sap.m.Button"));
            if (!oButton) return;
 
            // Enable button only if value changed
            if (String(sNewValue) !== String(oData._originalQuantity)) {
                oButton.setEnabled(true);
            } else {
                oButton.setEnabled(false);
            }
        },
 
onUpdatePress: async function (oEvent) {
    const oButton = oEvent.getSource();
    oButton.setEnabled(false);

    const oView = this.getView();
    const oRow = oButton.getParent && oButton.getParent();
    if (!oRow) return;

    const oContext = oRow.getBindingContext("viewModel");
    if (!oContext) return;

    const oRowData = oContext.getObject();
    const sModelCode = oRowData.modelCode;
    const nNewQty = Number(oRowData.totalQuantity) || 0;

    // Store old quantity BEFORE updating _originalQuantity
    const oldQty = Number(oRowData._originalQuantity) || 0;

    const oODataModel = oView.getModel();
    let sBase = "";
    if (oODataModel) {
        if (typeof oODataModel.getServiceUrl === "function") {
            sBase = oODataModel.getServiceUrl();
        } else if (oODataModel.sServiceUrl) {
            sBase = oODataModel.sServiceUrl;
        }
    }

    const sEntityUrl = (sBase ? sBase.replace(/\/$/, "") : "") + `/Billings('${encodeURIComponent(sModelCode)}')`;

    try {
        // Fetch CSRF token
        const tokenResp = await fetch(sEntityUrl, {
            method: "GET",
            headers: {
                "X-CSRF-Token": "Fetch",
                "Accept": "application/json"
            },
            credentials: "same-origin"
        });
        const sToken = tokenResp.headers.get("x-csrf-token");

        // PATCH request
        const patchResp = await fetch(sEntityUrl, {
            method: "PATCH",
            headers: {
                "Content-Type": "application/json",
                "X-CSRF-Token": sToken || ""
            },
            credentials: "same-origin",
            body: JSON.stringify({ totalQuantity: String(nNewQty) })
        });

        if (!patchResp.ok) {
            const text = await patchResp.text().catch(() => "");
            throw new Error(`${patchResp.status} ${patchResp.statusText} ${text}`);
        }

        sap.m.MessageBox.success(`Model : ${sModelCode} successfully updated.`, {
            title: "Update Successful",
            onClose: () => {
                this._recalculateTotalsForRow(oRowData, oldQty);

                oRowData._originalQuantity = oRowData.totalQuantity;

                oButton.setEnabled(false);
            }
        });

    } catch (err) {
        console.error("Update Error:", err);

        sap.m.MessageBox.error(`Failed to update model ${sModelCode}. ${err.message || ""}`, {
            title: "Update Failed",
            onClose: () => oButton.setEnabled(true)
        });
    }
}
,
_recalculateTotalsForRow: function (oUpdatedRow, oldQty) {
    const oView = this.getView();
    const oViewModel = oView.getModel("viewModel");
    if (!oViewModel) return;
 
    let totalQuantity = Number(oViewModel.getProperty("/TotalQuantity").replace(/,/g, "")) || 0;
    let totalFundRequired = Number(oViewModel.getProperty("/TotalFundRequired").replace(/[^0-9.-]+/g,"")) || 0;
    let totalOrderValue = Number(oViewModel.getProperty("/TotalOrderValue").replace(/[^0-9.-]+/g,"")) || 0;
 
    const newQty = Number(oUpdatedRow.totalQuantity) || 0;
    const diffQty = newQty - oldQty;
 
    totalQuantity += diffQty;
 
    const diffFund = (Number(oUpdatedRow.fundRequired) || 0) * diffQty / (oldQty || 1);
    const diffValue = (Number(oUpdatedRow.OrderVAlue) || 0) * diffQty / (oldQty || 1);
 
    totalFundRequired += diffFund;
    totalOrderValue += diffValue;
 
    const oIndianFormatter = NumberFormat.getFloatInstance({
        groupingEnabled: true,
        groupingSeparator: ",",
        decimalSeparator: ".",
        maxFractionDigits: 2
    }, new sap.ui.core.Locale("en_IN"));
 
    const oCurrencyFormatter = NumberFormat.getCurrencyInstance({ currencyCode: false }, new sap.ui.core.Locale("en_IN"));
 
    oViewModel.setProperty("/TotalQuantity", oIndianFormatter.format(totalQuantity));
 
},
 
        onGoPress: async function () {
            const oView = this.getView();
            const sDealerId = oView.byId("idDealerCombo").getSelectedKey();
            const oVBox = oView.byId("vectorFlowBox");
 
            if (oVBox) oVBox.setVisible(false);
 
            if (!sDealerId) {
                sap.m.MessageToast.show("Please select a Dealer first.");
                return;
            }
 
            const oModel = oView.getModel();
 
            try {
                const oDealerContext = oModel.bindContext(`/Dealer('${sDealerId}')?$expand=billings`);
                const oData = await oDealerContext.requestObject();
                const aBillings = oData.billings || [];
 
                const oViewModel = oView.getModel("viewModel") || new sap.ui.model.json.JSONModel();
                oView.setModel(oViewModel, "viewModel");
 
                oViewModel.setData({
                    DealerName: oData.DealerName,
                    Stock_Availability: oData.Stock_Availability,
                    Limit_available: oData.Limit_available,
                    Billings: aBillings,
                    showTable: true
                });
 
                const oIndianFormatter = NumberFormat.getFloatInstance({
                    groupingEnabled: true,
                    groupingSeparator: ",",
                    decimalSeparator: ".",
                    maxFractionDigits: 2
                }, new sap.ui.core.Locale("en_IN"));
 
                const oCurrencyFormatter = NumberFormat.getCurrencyInstance({ currencyCode: false }, new sap.ui.core.Locale("en_IN"));
 
                // Totals calculation
                const totals = aBillings.reduce((acc, item) => {
                    acc.totalStock += parseFloat(item.stock) || 0;
                    acc.totalAvailable += parseFloat(item.availability) || 0;
                    acc.totalQuantity += parseFloat(item.totalQuantity) || 0;
                    acc.totalFundRequired += parseFloat(item.fundRequired) || 0;
                    acc.totalOrderValue += parseFloat(item.OrderVAlue) || 0;
                    return acc;
                }, { totalStock: 0, totalAvailable: 0, totalQuantity: 0, totalFundRequired: 0, totalOrderValue: 0 });
 
                oViewModel.setProperty("/TotalStock", oIndianFormatter.format(totals.totalStock));
                oViewModel.setProperty("/TotalAvailable", oIndianFormatter.format(totals.totalAvailable));
                oViewModel.setProperty("/TotalQuantity", oIndianFormatter.format(totals.totalQuantity));
                oViewModel.setProperty("/TotalFundRequired", oCurrencyFormatter.format(totals.totalFundRequired, "INR"));
                oViewModel.setProperty("/TotalOrderValue", oCurrencyFormatter.format(totals.totalOrderValue, "INR"));
 
                // Show tables
                const oTableContainer = oView.byId("tableContainer");
                const oTotalTableContainer = oView.byId("totaltableContainer");
 
                if (oTableContainer && oTotalTableContainer) {
                    oTableContainer.removeStyleClass("hiddenTable").addStyleClass("visibleTable");
                    oTotalTableContainer.removeStyleClass("hiddenTable").addStyleClass("visibleTable");
                }
 
                const oWizard = oView.byId("myWizard");
                oWizard.nextStep();
 
                sap.m.MessageToast.show("Dealer details loaded.");
 
            } catch (oError) {
                sap.m.MessageToast.show("Failed to fetch dealer details.");
                console.error("OData Error:", oError);
            }
        }
 
    });
});
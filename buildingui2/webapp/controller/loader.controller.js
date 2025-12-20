sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/ui/core/format/NumberFormat",
    "sap/m/MessageToast",
    "sap/m/MessageBox"
], (Controller, NumberFormat, MessageToast, MessageBox) => {
    "use strict";

    return Controller.extend("buildingui2.controller.loader", {
        onInit: function () {
            this._changedRows = [];
            this._bHasUnsavedChanges = false;

            const oViewModel = new sap.ui.model.json.JSONModel({});
            this.getView().setModel(oViewModel, "viewModel");

            // Warn before leaving page if unsaved changes exist
            window.addEventListener("popstate", (event) => {
                if (this._bHasUnsavedChanges) {
                    event.preventDefault();
                    MessageBox.warning("You have unsaved changes. Do you really want to leave?", {
                        actions: ["Yes", "No"],
                        onClose: (sAction) => {
                            if (sAction === "No") {
                                window.history.pushState(null, "", window.location.hash);
                            }
                        }
                    });
                }
            });

            window.addEventListener("beforeunload", (event) => {
                if (this._bHasUnsavedChanges) {
                    event.preventDefault();
                    event.returnValue = "You have unsaved changes. Are you sure you want to leave?";
                    return event.returnValue;
                }
            });
        },

        onOrderQtyChange: function (oEvent) {
            const oInput = oEvent.getSource();
            const sValue = oInput.getValue();
            const nNewValue = Number(sValue) || 0;
            const oContext = oInput.getBindingContext("viewModel");
            const oRowData = oContext.getObject();

            if (oRowData._originalQuantity === undefined) {
                oRowData._originalQuantity = Number(oRowData.totalQuantity) || 0;
            }

            const nMaxQty = (Number(oRowData.stock) || 0) + (Number(oRowData.availability) || 0);

            if (nNewValue > nMaxQty) {
                MessageBox.error(
                    `Order quantity for Model ${oRowData.modelCode} cannot exceed available + stock (${nMaxQty}).`
                );
                oInput.setValue(oRowData._originalQuantity);
                oRowData.totalQuantity = oRowData._originalQuantity;
                return;
            }

            oRowData.totalQuantity = nNewValue;
            this._bHasUnsavedChanges = true;

            if (!this._changedRows.includes(oRowData)) {
                this._changedRows.push(oRowData);
            }

            const oView = this.getView();
            const oViewModel = oView.getModel("viewModel");
            const aRows = oViewModel.getProperty("/Billings") || [];

            const bAnyChange = aRows.some(
                row => Number(row.totalQuantity) !== Number(row._originalQuantity)
            );

            const oSaveButton = oView.byId("acceptButton");
            if (oSaveButton) {
                oSaveButton.setVisible(bAnyChange);
                oSaveButton.setEnabled(bAnyChange);
            }
        },

        onModelDescPress: async function (oEvent) {
            const oView = this.getView();
            const sDealerId = oView.byId("idDealerCombo").getSelectedKey();
            const oVBox = oView.byId("vectorFlowBox");

            if (!sDealerId) {
                MessageToast.show("Please select a Dealer.");
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
                const oDealerContext = oModel.bindContext(`/Dealer('${sDealerId}')?$expand=billings`);
                const oData = await oDealerContext.requestObject();

                const aFilteredBilling = (oData.billings || []).filter(
                    item => item.modelCode === sModelCode
                );

                const oDialogModel = new sap.ui.model.json.JSONModel({ Billings: aFilteredBilling });
                oView.setModel(oDialogModel, "dialogModel");

                oVBox.setVisible(true);
                this._lastModelCode = sModelCode;
            } catch (error) {
                MessageToast.show("Failed to load dealer billing data.");
                console.error("Error loading dealer:", error);
            }
        },

        // onUpdatePress: async function () {
        //     const oView = this.getView();
        //     const oViewModel = oView.getModel("viewModel");
        //     const aRows = oViewModel.getProperty("/Billings") || [];
        //     const aChangedRows = this._changedRows;

        //     if (aRows.length === 0) {
        //         MessageBox.error("No rows to update.");
        //         return;
        //     }

        //     MessageBox.confirm("Do you want to save the changes?", {
        //         title: "Confirm Save",
        //         actions: [MessageBox.Action.YES, MessageBox.Action.NO],
        //         emphasizedAction: MessageBox.Action.YES,
        //         onClose: async (sAction) => {
        //             if (sAction !== MessageBox.Action.YES) {
        //                 MessageToast.show("Save cancelled.");
        //                 return;
        //             }

        //             const oButton = oView.byId("acceptButton");
        //             oButton.setEnabled(false);

        //             const aPendingOrders = oViewModel.getProperty("/PendingOrders") || [];
        //             const oODataModel = oView.getModel();
        //             const sBase = oODataModel.getServiceUrl().replace(/\/$/, "");
        //             const sEntityUrl = `${sBase}/PendingOrders`;

        //             try {
        //                 for (const row of aChangedRows) {
        //                     const data = {
        //                         modelCode: row.modelCode,
        //                         modelDescription: row.modelDescription,
        //                         totalQuantity: row.totalQuantity,
        //                         status: "PE"
        //                     };

        //                     const postResp = await fetch(sEntityUrl, {
        //                         method: "POST",
        //                         headers: { "Content-Type": "application/json" },
        //                         body: JSON.stringify(data)
        //                     });

        //                     if (!postResp.ok) throw new Error(`Failed to save ${row.modelCode}`);
        //                     const createdEntity = await postResp.json();
        //                     aPendingOrders.push(createdEntity);
        //                     console.log(`Saved:`, createdEntity);
        //                 }

        //                 oViewModel.setProperty("/PendingOrders", aPendingOrders);
        //                 MessageBox.success("Changes successfully saved.");
        //                 this._bHasUnsavedChanges = false;
        //                 oButton.setVisible(false);
        //             } catch (err) {
        //                 console.error("Save Error:", err);
        //                 MessageBox.error(`Error saving data: ${err.message}`);
        //             } finally {
        //                 oButton.setEnabled(true);
        //             }
        //         }
        //     });
        // },

        onUpdatePress: async function () {
    const oView = this.getView();
    const oViewModel = oView.getModel("viewModel");
    const aChangedRows = this._changedRows;

    if (aChangedRows.length === 0) {
        MessageBox.error("No changes to save.");
        return;
    }

    MessageBox.confirm("Do you want to save the changes?", {
        title: "Confirm Save",
        actions: [MessageBox.Action.YES, MessageBox.Action.NO],
        emphasizedAction: MessageBox.Action.YES,
        onClose: async (sAction) => {
            if (sAction !== MessageBox.Action.YES) {
                MessageToast.show("Save cancelled.");
                return;
            }

            const oButton = oView.byId("acceptButton");
            oButton.setEnabled(false);

            try {
                const sEntityUrl = "/odata/v4/my/PendingOrders"; // <-- via Approuter

                for (const row of aChangedRows) {
                    const data = {
                        modelCode: row.modelCode,
                        modelDescription: row.modelDescription,
                        totalQuantity: row.totalQuantity,
                        status: "PE"
                    };

                    const postResp = await fetch(sEntityUrl, {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify(data)
                    });

                    if (!postResp.ok) throw new Error(`Failed to save ${row.modelCode}`);
                }

                MessageBox.success("Changes successfully saved.");
                this._bHasUnsavedChanges = false;
                oButton.setVisible(false);
            } catch (err) {
                console.error("Save Error:", err);
                MessageBox.error(`Error saving data: ${err.message}`);
            } finally {
                oButton.setEnabled(true);
            }
        }
    });
},

        _recalculateTotalsForAllRows: function () {
            const oViewModel = this.getView().getModel("viewModel");
            if (!oViewModel) return;

            let totalQuantity = 0, totalFundRequired = 0, totalOrderValue = 0;

            const aRows = oViewModel.getProperty("/Billings") || [];
            aRows.forEach(row => {
                totalQuantity += Number(row.totalQuantity) || 0;
                totalFundRequired += Number(row.fundRequired) || 0;
                totalOrderValue += Number(row.OrderVAlue) || 0;
            });

            const oIndianFormatter = NumberFormat.getFloatInstance({
                groupingEnabled: true,
                groupingSeparator: ",",
                decimalSeparator: ".",
                maxFractionDigits: 2
            }, new sap.ui.core.Locale("en_IN"));

            const oCurrencyFormatter = NumberFormat.getCurrencyInstance(
                { currencyCode: false },
                new sap.ui.core.Locale("en_IN")
            );

            oViewModel.setProperty("/TotalQuantity", oIndianFormatter.format(totalQuantity));
            oViewModel.setProperty("/TotalFundRequired", oCurrencyFormatter.format(totalFundRequired, "INR"));
            oViewModel.setProperty("/TotalOrderValue", oCurrencyFormatter.format(totalOrderValue, "INR"));
        },

        onGoPress: async function () {
            const oView = this.getView();
            const sDealerId = oView.byId("idDealerCombo").getSelectedKey();
            const oVBox = oView.byId("vectorFlowBox");
            if (oVBox) oVBox.setVisible(false);

            if (!sDealerId) {
                MessageToast.show("Please select a Dealer first.");
                return;
            }

            const oModel = oView.getModel();

            try {
                const oDealerContext = oModel.bindContext(`/Dealer('${sDealerId}')?$expand=billings`);
                const oData = await oDealerContext.requestObject();
                const aBillings = oData.billings || [];

                const oViewModel = new sap.ui.model.json.JSONModel({
                    DealerName: oData.DealerName,
                    Stock_Availability: oData.Stock_Availability,
                    Limit_available: oData.Limit_available,
                    Billings: aBillings,
                    showTable: true
                });
                oView.setModel(oViewModel, "viewModel");

                const totals = aBillings.reduce((acc, item) => {
                    acc.totalStock += parseFloat(item.stock) || 0;
                    acc.totalAvailable += parseFloat(item.availability) || 0;
                    acc.totalQuantity += parseFloat(item.totalQuantity) || 0;
                    acc.totalFundRequired += parseFloat(item.fundRequired) || 0;
                    acc.totalOrderValue += parseFloat(item.OrderVAlue) || 0;
                    return acc;
                }, { totalStock: 0, totalAvailable: 0, totalQuantity: 0, totalFundRequired: 0, totalOrderValue: 0 });

                const oIndianFormatter = NumberFormat.getFloatInstance({
                    groupingEnabled: true,
                    groupingSeparator: ",",
                    decimalSeparator: ".",
                    maxFractionDigits: 2
                }, new sap.ui.core.Locale("en_IN"));

                const oCurrencyFormatter = NumberFormat.getCurrencyInstance(
                    { currencyCode: false },
                    new sap.ui.core.Locale("en_IN")
                );

                oViewModel.setProperty("/TotalStock", oIndianFormatter.format(totals.totalStock));
                oViewModel.setProperty("/TotalAvailable", oIndianFormatter.format(totals.totalAvailable));
                oViewModel.setProperty("/TotalQuantity", oIndianFormatter.format(totals.totalQuantity));
                oViewModel.setProperty("/TotalFundRequired", oCurrencyFormatter.format(totals.totalFundRequired, "INR"));
                oViewModel.setProperty("/TotalOrderValue", oCurrencyFormatter.format(totals.totalOrderValue, "INR"));

                const oTableContainer = oView.byId("tableContainer");
                const oTotalTableContainer = oView.byId("totaltableContainer");
                if (oTableContainer && oTotalTableContainer) {
                    oTableContainer.removeStyleClass("hiddenTable").addStyleClass("visibleTable");
                    oTotalTableContainer.removeStyleClass("hiddenTable").addStyleClass("visibleTable");
                }

                const oWizard = oView.byId("myWizard");
                if (oWizard) oWizard.nextStep();

                MessageToast.show("Dealer details loaded.");
            } catch (oError) {
                MessageToast.show("Failed to fetch dealer details.");
                console.error("OData Error:", oError);
            }
        }

    });
});

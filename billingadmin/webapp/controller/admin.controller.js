sap.ui.define([
  "sap/ui/core/mvc/Controller",
  "sap/m/MessageToast",
  "sap/m/MessageBox",
  "sap/ui/model/json/JSONModel"
], function (Controller, MessageToast, MessageBox, JSONModel) {
  "use strict";

    return Controller.extend("billingadmin.controller.admin", {
       onInit: async function () {
      const oODataModel = this.getOwnerComponent().getModel();

      if (!oODataModel) {
        console.error("OData model not found.");
        MessageToast.show("Backend model not found.");
        return;
      }

      try {
        const oListBinding = oODataModel.bindList("/PendingOrders");
        const aContexts = await oListBinding.requestContexts();
        const aPendingOrders = aContexts.map(ctx => ctx.getObject());

        console.log("Fetched Pending Orders:", aPendingOrders);

        // Calculate counts for dashboard tiles
        const nPending = aPendingOrders.filter(o => o.status === "PE").length;
        const nApproved = aPendingOrders.filter(o => o.status === "AP").length;
        const nRejected = aPendingOrders.filter(o => o.status === "RE").length;

        const oViewModel = new JSONModel({
          PendingOrders: aPendingOrders,
          Counts: {
            Pending: nPending,
            Approved: nApproved,
            Rejected: nRejected
          }
        });
        this.getView().setModel(oViewModel, "viewModel");
      } catch (err) {
        console.error("Error fetching PendingOrders:", err);
        MessageBox.error("Failed to load pending orders: " + err.message);
      }
    },

    formatStatusText: function (sStatus) {
      switch (sStatus) {
        case "PE": return "Pending";
        case "AP": return "Approved";
        case "RE": return "Rejected";
        default:   return sStatus;
      }
    },

    formatStatusState: function (sStatus) {
      switch (sStatus) {
        case "PE": return "Warning";
        case "AP": return "Success";
        case "RE": return "Error";
        default:   return "None";
      }
    },

    onItemPress: async function (oEvent) {
      const oItem = oEvent.getSource();
      const oContext = oItem.getBindingContext("viewModel");
      const oOrder = oContext.getObject();

      console.log("Selected order:", oOrder);
      MessageToast.show(`Selected Model: ${oOrder.modelDescription}`);
    },

    onApprove: async function (oEvent) {
      try {
        const oButton = oEvent.getSource();
        const oContext = oButton.getBindingContext("viewModel");
        const oRowData = oContext.getObject();

        console.log("Row being approved:", oRowData);

        const oODataModel = this.getView().getModel();
        const sBase = oODataModel.getServiceUrl();
        const sEntityUrl = `${sBase.replace(/\/$/, "")}/approvedOrder`;

        const data = {
          modelCode: oRowData.modelCode,
          approvedQty: String(oRowData.totalQuantity)
        };

        const postResp = await fetch(sEntityUrl, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(data)
        });

        if (!postResp.ok) {
          const errText = await postResp.text();
          throw new Error(`Server error ${postResp.status}: ${errText}`);
        }

        MessageToast.show(`Order ${oRowData.modelCode} approved successfully!`);
      } catch (err) {
        console.error("Error approving order:", err);
        MessageBox.error("Failed to approve order. " + err.message);
      }
    }

  });
});

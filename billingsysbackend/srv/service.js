const cds = require('@sap/cds');
const axios = require("axios");
require('dotenv').config();
const { getDestination } = require("@sap-cloud-sdk/connectivity");

module.exports = cds.service.impl(function (req) {

  const { Billings, PendingOrders } = this.entities;

   async function startOrderApprovalProcess(orderData) {
    try {
      const destination = await getDestination({
        destinationName: "sap_process_automation_service_user_access",
      });

      console.log(destination.url);
      

      const bpaUrl = `${destination.url}/workflow/rest/v1/workflow-instances`;

      const payload = {
        definitionId: "us10.13ca479ctrial.ui52bpa1.ui5",
        context: orderData, 
      };

      const response = await axios.post(bpaUrl, payload, {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${destination.authTokens[0].value}`,
        },
      });

      console.log("BPA process started:", response.data);
      return response.data;
    } catch (err) {
      console.error("Failed to start BPA process:", err.message);
    }
  }

  async function getBpaDefinitions() {
  try {
    // Get destination info
    const destination = await getDestination({
      destinationName: "sap_process_automation_service_user_access",
    });

    const bpaUrl = `${destination.url}/workflow/rest/v1/workflow-definitions`;

    const response = await axios.get(bpaUrl, {
      headers: {
        Authorization: `Bearer ${destination.authTokens[0].value}`,
      },
    });

    // Log all available workflows
    console.log("Available BPA Definitions:", response.data);

    // Optionally, return the definitionId of a specific process
    const target = response.data.find(
      (def) => def.name === "UI52BPA1" // change this to your process name
    );

    if (target) {
      console.log("Definition ID:", target.id);
      return target.id;
    } else {
      console.log("Process not found!");
      return null;
    }

  } catch (err) {
    console.error("Error fetching BPA definitions:", err.message);
  }
}



  this.on('READ', 'Billings', async (req,res) => {

    console.log('target Name: ',req.target.name);
    const results = await cds.run(SELECT.from('billing.Billings'));
    return results;
  });

  this.on('approvedOrder', async (req) => {

    console.log(req.data);

    const {modelCode, approvedQty} =  req.data;

        const update = await UPDATE(PendingOrders)
        .set({ status: "AP" })
        .where({ modelCode });

             const updatedBilling = await UPDATE(Billings)
        .set({ totalQuantity:  String(approvedQty)})
        .where({ modelCode });

        console.log("Billing update: ",updatedBilling);
        

        const select = await SELECT.from(PendingOrders).where({ modelCode });

        console.log(update);

        console.log(select);
        
  });

  this.after("CREATE", "PendingOrders", async (data, req) => {
    console.log("New Pending Order created:", data);

    const orderContext = {
      modelCode: data.modelCode,
      modelDescription: data.modelDescription,
      totalQuantity: data.totalQuantity,
      fundRequired: data.fundRequired,
      status: data.status,
      createdBy: data.createdBy || "dealer",
    };

    await startOrderApprovalProcess(orderContext);
    // await getBpaDefinitions();
  });
  

  

});

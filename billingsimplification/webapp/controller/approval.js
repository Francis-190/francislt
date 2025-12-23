const { getDestination } = require("@sap-cloud-sdk/connectivity");
const axios = require("axios");

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


  module.exports = {
    startOrderApprovalProcess
  }
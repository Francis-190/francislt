const cds = require('@sap/cds');
const XLSX = require('xlsx');

const { getDestination } = require('@sap-cloud-sdk/connectivity');
const { executeHttpRequest } = require('@sap-cloud-sdk/http-client');

module.exports = cds.service.impl(async function () {

  const { BikePricing } = this.entities;
  async function startBpaProcess(context, jwt) {
    try {
      const destination = await getDestination({
        destinationName: 'sap_process_automation_service_user_access'
      });

      if (!destination) {
        throw new Error('BPA destination not found');
      }

      const payload = {
        definitionId: 'us10.ebb75ac4trial.testbpafromcapm.test',
        context
      };

      const response = await executeHttpRequest(destination, {
        method: 'POST',
        url: '/workflow/rest/v1/workflow-instances',
        headers: {
          'Content-Type': 'application/json'
        },
        data: payload
      });

      console.log('BPA started, instanceId:', response.data.id);
      return response.data;

    } catch (err) {
      console.error('BPA error:', err.response?.data || err.message);
      throw err;
    }
  }


  this.on('sendToBPA', async (req) => {

    const ID = req.data?.data?.ID;
    const data = req.data?.data

    console.log('Received ID:', ID);

    if (!ID) {
      return req.error(400, 'ID is required');
    }

    const pricing = await SELECT.one
      .from(BikePricing)
      .where({ ID: ID });

    if (!pricing) {
      return req.error(404, 'BikePricing record not found');
    }

     const bpaContext = {
    ID: pricing.ID,
    modelCode: pricing.mtsModel,
    modelDescription: pricing.modelDescription,
    state: pricing.state,
    exShowroomPrice: pricing.exShowroomPrice,
    onRoadPrice: pricing.onRoadPrice
  };
    const jwt = req.headers.authorization?.replace('Bearer ', '');

    await startBpaProcess(bpaContext, jwt);

    return 'BPA process started successfully';
  });


  this.on('uploadExcel', async (req) => {
    const { file, fileName } = req.data;

    if (!file) return req.error(400, 'No file uploaded');

    const buffer = Buffer.from(file, 'base64');
    console.log(`Uploaded file: ${fileName}, Size: ${buffer.length} bytes`);

    const workbook = XLSX.read(buffer, { type: 'buffer' });
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    const rows = XLSX.utils.sheet_to_json(sheet, { defval: null });

    if (!rows.length) return req.error(400, 'Excel file is empty');

    const normalize = s =>
      s?.toString().trim().toLowerCase().replace(/[\s_-]+/g, '');

    const getValue = (row, key) =>
      row[Object.keys(row).find(k => normalize(k) === normalize(key))];

    const toNumber = v =>
      v === null || v === undefined || v === '' || isNaN(v)
        ? null
        : Number(v);

    const dataToInsert = rows.map(row => ({
      categoryAndRegion: getValue(row, 'Category & region'),
      mtsModel: getValue(row, 'MTS Models'),
      state: getValue(row, 'State'),
      exShowroomPrice: toNumber(getValue(row, 'Ex-Showroom')),
      onRoadPrice: toNumber(getValue(row, 'On Road'))
    }));

    const tx = cds.transaction(req);
    await tx.run(INSERT.into(BikePricing).entries(dataToInsert));

    return `Successfully uploaded ${dataToInsert.length} records`;
  });
});

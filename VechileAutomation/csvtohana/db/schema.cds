namespace csvtohana.db;

entity BikePricing {
  key ID                     : UUID @cds.auto;

  categoryAndRegion           : String(100);
  categoryCodeAndRegion       : String(100);
  mtsModel                    : String(50);
  modelDescription            : String(255);
  cc                          : Integer;
  regionCode                  : String(20);
  state                       : String(50);
  basis                       : String(50);

  dealerMarginPercent         : Decimal(5,2);

  mtsNSP                      : Decimal(13,2);
  incrementalNSP              : Decimal(13,2);
  helmetNSP                   : Decimal(13,2);
  transportationCost          : Decimal(13,2);
  dealerCost                  : Decimal(13,2);
  otherExpenses               : Decimal(13,2);

  bikeMargin                  : Decimal(13,2);
  incrementalMargin           : Decimal(13,2);
  dealerMargin                : Decimal(13,2);
  helmetMargin                : Decimal(13,2);
  totalDealerMargin           : Decimal(13,2);

  ndp                         : Decimal(13,2);
  basicPrice                  : Decimal(13,2);
  gstAmount                   : Decimal(13,2);
  keralaCess                  : Decimal(13,2);
  exShowroomPrice             : Decimal(13,2);

  exceptionRef                : String(50);

  rtoPercent                  : Decimal(5,2);
  rtoAmount                   : Decimal(13,2);
  rtoWithBill                 : Decimal(13,2);

  insuranceBelow350           : Decimal(13,2);
  insuranceAbove350           : Decimal(13,2);
  insuranceAmount             : Decimal(13,2);
  tpaPa                       : Decimal(13,2);
  insuranceGST                : Decimal(13,2);
  totalInsurance              : Decimal(13,2);

  onRoadPrice                 : Decimal(13,2);

  exShowroom                  : Decimal(13,2);
  diffAmount                  : Decimal(13,2);
}

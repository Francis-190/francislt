namespace csvtohana.srv;

using { csvtohana.db as db } from '../db/schema';

service BikePricingService {

  entity BikePricing as projection on db.BikePricing;

  action uploadExcel(
    file     : LargeBinary,
    fileName : String
  ) returns String;

type BpaPricingContext {
  ID        : UUID;
  modelCode        : String;
  modelDescription : String;
  state            : String;
  exShowroomPrice  : Decimal(13,2);
  onRoadPrice      : Decimal(13,2);
}

action sendToBPA(
  data : BpaPricingContext
) returns String;

}

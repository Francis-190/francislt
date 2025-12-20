
using { billing as new } from '../db/schema';

service MyService {
    entity Billings as projection on new.Billings;
    entity Dealer as projection on new.Dealer;

    entity PendingOrders as projection on new.PendingOrders;
    
    action approvedOrder(modelCode: String, approvedQty: String) returns String;

                }

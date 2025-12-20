namespace billing;


entity Billings  {
    key modelCode :String;
    modelDescription:String;
    stock:String;
    availability:String;
    totalQuantity:String;
    fundRequired:String;
    totalAllocation:String;
    OrderVAlue:String;
    dealer: Association to Dealer;
    vectorReq:String;
    fst:String;
    black:String;
    red:String;
    yellow:String;
    green:String;
    rational:String;
    snopAllocation:String;
    svopAllocation:String;

    
}

entity Dealer {
    key dealerId     : String;
    billings : Association to many Billings on billings.dealer=$self;
    DealerName: String;
    Stock_Availability: Integer;
    Limit_available: Integer;
    
}

entity PendingOrders {
    key modelCode : String;
    modelDescription : String;
    totalQuantity : Integer;
    createdBy : String;
    @cds.persistence.enum.value
    status: String enum{
        Pending   = 'PE';
        Approved  = 'AP';
        Rejected  = 'RE';
    };
}
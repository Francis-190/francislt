namespace shop;

entity Products {
  key ID      : UUID;
  name        : String(100);
  category    : String(50);
  price       : Decimal(15,2);
  stock       : Integer;
  createdAt   : DateTime;
}

entity Orders {
  key ID      : UUID;
  orderDate   : Date;
  customer    : String(100);
  items       : Composition of OrderItems on items.parent = $self;
}

entity OrderItems {
  key parent  : Association to Orders;
  key itemNo  : Integer;
  product     : Association to Products;
  quantity    : Integer;
  amount      : Decimal(15,2);
}

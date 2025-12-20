using shop from '../db/schema';

service ShopService {

  @readonly
  entity Products as projection on shop.Products;

  entity Orders as projection on shop.Orders;

  entity OrderItems as projection on shop.OrderItems;

}

import { DiscountType } from "@/types/enum";
import { ProductData } from "@/types/order";

export const calculateOrderTotals = (
  products: ProductData[],
  discount: number = 0,
  discountType: DiscountType = DiscountType.Amount,
  shippingFee: number = 0
) => {
  const subtotal = products.reduce(
    (sum, product) => sum + product.quantity * product.price,
    0
  );

  const discountAmount = discountType === DiscountType.Percentage
    ? (subtotal * discount) / 100
    : discount;

  const total = subtotal - discountAmount + shippingFee;

  return {
    subtotal,
    discountAmount,
    total
  };
};

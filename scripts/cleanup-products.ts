/**
 * Script để xóa các trường không cần thiết trong products
 * Chỉ giữ lại workflows trong mỗi product
 */

import { getDatabase, ref, get, update } from "firebase/database";

async function cleanupProductsKeepWorkflows() {
  const db = getDatabase();
  const ordersRef = ref(db, "xoxo/orders");

  try {
    console.log("🔄 Đang tải dữ liệu orders...");
    const ordersSnapshot = await get(ordersRef);
    const orders = ordersSnapshot.val() || {};

    const orderCodes = Object.keys(orders);
    console.log(`📦 Tìm thấy ${orderCodes.length} orders`);

    let totalProducts = 0;
    let cleanedProducts = 0;

    for (const orderCode of orderCodes) {
      const order = orders[orderCode];
      if (!order?.products) {
        continue;
      }

      const productIds = Object.keys(order.products);
      totalProducts += productIds.length;

      for (const productId of productIds) {
        const product = order.products[productId];
        
        // Chỉ giữ lại workflows, xóa các trường khác
        const productRef = ref(db, `xoxo/orders/${orderCode}/products/${productId}`);
        
        const updates: any = {};
        
        // Xóa các trường không cần thiết
        if (product.name !== undefined) {
          updates.name = null; // Set null để xóa
        }
        if (product.quantity !== undefined) {
          updates.quantity = null;
        }
        if (product.price !== undefined) {
          updates.price = null;
        }
        if (product.images !== undefined) {
          updates.images = null;
        }
        if (product.imagesDone !== undefined) {
          updates.imagesDone = null;
        }

        // Giữ lại workflows (không động vào)
        
        if (Object.keys(updates).length > 0) {
          await update(productRef, updates);
          cleanedProducts++;
          console.log(`  ✅ Đã xóa dữ liệu product ${productId} trong order ${orderCode}`);
        }
      }
    }

    console.log(`\n✨ Hoàn thành!`);
    console.log(`   - Tổng số products: ${totalProducts}`);
    console.log(`   - Đã xóa dữ liệu: ${cleanedProducts} products`);
    console.log(`   - Workflows được giữ lại trong tất cả products`);
  } catch (error) {
    console.error("❌ Lỗi khi cleanup products:", error);
    throw error;
  }
}

// Chạy script
if (require.main === module) {
  cleanupProductsKeepWorkflows()
    .then(() => {
      console.log("✅ Script hoàn thành!");
      process.exit(0);
    })
    .catch((error) => {
      console.error("❌ Script thất bại:", error);
      process.exit(1);
    });
}

export { cleanupProductsKeepWorkflows };


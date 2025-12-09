/**
 * XOXO Mock Data Generator
 * Generates realistic data for Orders, Service Items, Workflow Templates, and Customers
 * Output: tools/mock-data.json
 * Run: npx tsx tools/mock.ts
 */

import { writeFileSync } from "fs";
import { resolve } from "path";

// ============================================
// ENUMS & TYPES
// ============================================

enum OrderStatus {
  PENDING = "pending",
  DEPOSIT_PAID = "deposit_paid",
  PROCESSING = "processing",
  READY = "ready",
  COMPLETED = "completed",
  CANCELLED = "cancelled",
}

enum ServiceItemStatus {
  PENDING = "pending",
  PROCESSING = "processing",
  COMPLETED = "completed",
  DELIVERED = "delivered",
  CANCELLED = "cancelled",
}

enum CommissionType {
  FIXED = "fixed",
  PERCENT = "percent",
}

enum CustomerSource {
  Facebook = "facebook",
  Zalo = "zalo",
  Instagram = "instagram",
  Tiktok = "tiktok",
  Google = "google",
  Referral = "referral",
  WalkIn = "walk_in",
  Other = "other",
}

// ============================================
// MOCK DATA TEMPLATES
// ============================================

const LUXURY_PRODUCTS = [
  { name: "Túi Hermès Birkin 30cm", price: 5000000, category: "bag" },
  { name: "Túi Louis Vuitton Neverfull", price: 3500000, category: "bag" },
  { name: "Túi Chanel Classic Flap", price: 6000000, category: "bag" },
  { name: "Giày Christian Louboutin", price: 2800000, category: "shoe" },
  { name: "Giày Gucci Horsebit Loafer", price: 3200000, category: "shoe" },
  { name: "Túi Prada Galleria", price: 4500000, category: "bag" },
  { name: "Đồng hồ Rolex Submariner", price: 15000000, category: "watch" },
  { name: "Ví Louis Vuitton Sarah", price: 1200000, category: "leather" },
  { name: "Thắt lưng Hermès Reversible", price: 1800000, category: "leather" },
  { name: "Giày Jimmy Choo Anouk", price: 2500000, category: "shoe" },
];

const VIETNAMESE_NAMES = [
  "Nguyễn Thị Lan Anh",
  "Trần Văn Minh",
  "Lê Thị Hương",
  "Phạm Đức Anh",
  "Hoàng Thị Mai",
  "Vũ Văn Hùng",
  "Đặng Thị Nga",
  "Bùi Văn Long",
  "Đỗ Thị Thảo",
  "Ngô Văn Tùng",
];

const PHONE_PREFIXES = ["090", "091", "098", "097", "096", "032", "033", "034"];

const ADDRESSES = [
  "123 Nguyễn Huệ, Quận 1, TP.HCM",
  "456 Lê Lợi, Quận 3, TP.HCM",
  "789 Trần Hưng Đạo, Quận 5, TP.HCM",
  "321 Hai Bà Trưng, Quận 3, TP.HCM",
  "654 Võ Văn Tần, Quận 3, TP.HCM",
];

// ============================================
// WORKFLOW TEMPLATES
// ============================================

const WORKFLOW_TEMPLATES = {
  WF_BAG_SPA: {
    id: "WF_BAG_SPA",
    name: "Quy trình Spa túi xách cao cấp",
    description: "Quy trình vệ sinh và chăm sóc túi xách da thật",
    category: "bag" as const,
    stages: [
      {
        id: "STAGE_INSPECTION",
        name: "Kiểm tra sơ bộ",
        department_id: "DEPT_QC",
        order: 1,
        checklist_template: [
          "Chụp ảnh before toàn bộ sản phẩm (6 góc)",
          "Kiểm tra vết xước, rách, bong tróc",
          "Kiểm tra phụ kiện kim loại (khóa, móc, dây đeo)",
          "Đánh giá mức độ bẩn và loại vết bẩn",
          "Ghi chú tình trạng vào phiếu theo dõi",
        ],
        estimated_hours: 0.5,
        required_photos: true,
      },
      {
        id: "STAGE_CLEANING",
        name: "Vệ sinh da lộn/da trơn",
        department_id: "DEPT_CLEANING",
        order: 2,
        checklist_template: [
          "Hút bụi bề mặt bằng máy hút mini",
          "Xịt dung dịch tẩy rửa chuyên dụng",
          "Chải sợi da lộn theo chiều sợi",
          "Lau sạch vết bẩn cứng đầu",
          "Kiểm tra lại toàn bộ bề mặt",
        ],
        estimated_hours: 2,
        required_photos: true,
      },
      {
        id: "STAGE_CONDITIONING",
        name: "Dưỡng da và phục hồi màu",
        department_id: "DEPT_REPAIR",
        order: 3,
        checklist_template: [
          "Thoa dung dịch dưỡng da chuyên dụng",
          "Massage da để hấp thụ dưỡng chất",
          "Phục hồi màu sắc vùng phai",
          "Đánh bóng phụ kiện kim loại",
          "Làm khô tự nhiên trong 24h",
        ],
        estimated_hours: 4,
        required_photos: false,
      },
      {
        id: "STAGE_QC",
        name: "QC và đóng gói",
        department_id: "DEPT_QC",
        order: 4,
        checklist_template: [
          "Chụp ảnh after (6 góc giống before)",
          "Kiểm tra chất lượng hoàn thiện",
          "Đóng gói sản phẩm vào túi chống ẩm",
          "Gắn tem QR code hoàn thành",
          "Thông báo khách hàng đến lấy",
        ],
        estimated_hours: 0.5,
        required_photos: true,
      },
    ],
    total_estimated_hours: 7,
    is_active: true,
    created_at: Date.now() - 30 * 24 * 60 * 60 * 1000,
    updated_at: Date.now() - 30 * 24 * 60 * 60 * 1000,
    created_by: "admin",
  },
  WF_SHOE_REPAIR: {
    id: "WF_SHOE_REPAIR",
    name: "Quy trình sửa chữa giày cao cấp",
    description: "Sửa chữa và phục hồi giày da, giày cao gót",
    category: "shoe" as const,
    stages: [
      {
        id: "STAGE_INSPECT_SHOE",
        name: "Kiểm tra tình trạng giày",
        department_id: "DEPT_QC",
        order: 1,
        checklist_template: [
          "Chụp ảnh before",
          "Kiểm tra đế giày (mòn, nứt, bong)",
          "Kiểm tra phần upper (rách, bong da)",
          "Kiểm tra gót giày",
          "Đo kích thước và khối lượng",
        ],
        estimated_hours: 0.5,
        required_photos: true,
      },
      {
        id: "STAGE_SOLE_REPAIR",
        name: "Sửa chữa đế giày",
        department_id: "DEPT_REPAIR",
        order: 2,
        checklist_template: [
          "Tháo đế cũ nếu cần",
          "Dán đế mới hoặc vá đế",
          "Ép định hình đế",
          "Mài láng đế",
          "Kiểm tra độ chắc chắn",
        ],
        estimated_hours: 3,
        required_photos: true,
      },
      {
        id: "STAGE_UPPER_REPAIR",
        name: "Sửa chữa phần upper",
        department_id: "DEPT_REPAIR",
        order: 3,
        checklist_template: [
          "Khâu vá các vị trí rách",
          "Phục hồi màu da",
          "Đánh bóng bề mặt",
          "Thay dây giày nếu cần",
          "Vệ sinh lót giày",
        ],
        estimated_hours: 2,
        required_photos: false,
      },
      {
        id: "STAGE_FINISH_SHOE",
        name: "Hoàn thiện và QC",
        department_id: "DEPT_QC",
        order: 4,
        checklist_template: [
          "Chụp ảnh after",
          "Kiểm tra tổng thể chất lượng",
          "Đóng gói vào hộp đựng giày",
          "Gắn tem QR hoàn thành",
          "Thông báo khách",
        ],
        estimated_hours: 0.5,
        required_photos: true,
      },
    ],
    total_estimated_hours: 6,
    is_active: true,
    created_at: Date.now() - 30 * 24 * 60 * 60 * 1000,
    updated_at: Date.now() - 30 * 24 * 60 * 60 * 1000,
    created_by: "admin",
  },
  WF_WATCH_SERVICE: {
    id: "WF_WATCH_SERVICE",
    name: "Quy trình bảo dưỡng đồng hồ",
    description: "Bảo dưỡng và sửa chữa đồng hồ cao cấp",
    category: "watch" as const,
    stages: [
      {
        id: "STAGE_DISASSEMBLE",
        name: "Tháo rời và kiểm tra",
        department_id: "DEPT_REPAIR",
        order: 1,
        checklist_template: [
          "Chụp ảnh before",
          "Tháo dây đeo",
          "Mở nắp lưng",
          "Kiểm tra bộ máy",
          "Lập danh sách linh kiện cần thay",
        ],
        estimated_hours: 1,
        required_photos: true,
      },
      {
        id: "STAGE_MOVEMENT_SERVICE",
        name: "Bảo dưỡng bộ máy",
        department_id: "DEPT_REPAIR",
        order: 2,
        checklist_template: [
          "Vệ sinh bộ máy bằng dung dịch chuyên dụng",
          "Thay dầu bôi trơn",
          "Kiểm tra độ chính xác",
          "Điều chỉnh nếu cần",
          "Test chống nước",
        ],
        estimated_hours: 4,
        required_photos: false,
      },
      {
        id: "STAGE_POLISH",
        name: "Đánh bóng vỏ và dây",
        department_id: "DEPT_CLEANING",
        order: 3,
        checklist_template: [
          "Đánh bóng vỏ thép/vàng",
          "Vệ sinh mặt kính",
          "Đánh bóng dây đeo",
          "Kiểm tra khóa gài",
          "Lau sạch toàn bộ",
        ],
        estimated_hours: 2,
        required_photos: true,
      },
      {
        id: "STAGE_ASSEMBLE",
        name: "Lắp ráp và QC",
        department_id: "DEPT_QC",
        order: 4,
        checklist_template: [
          "Lắp lại bộ máy",
          "Gắn nắp lưng",
          "Lắp dây đeo",
          "Test chống nước lần cuối",
          "Chụp ảnh after và đóng gói",
        ],
        estimated_hours: 1,
        required_photos: true,
      },
    ],
    total_estimated_hours: 8,
    is_active: true,
    created_at: Date.now() - 30 * 24 * 60 * 60 * 1000,
    updated_at: Date.now() - 30 * 24 * 60 * 60 * 1000,
    created_by: "admin",
  },
};

// ============================================
// DEPARTMENTS
// ============================================

const DEPARTMENTS = {
  DEPT_QC: {
    code: "DEPT_QC",
    name: "Phòng Kiểm Định Chất Lượng",
    description: "Bộ phận kiểm tra chất lượng đầu vào và đầu ra",
    created_at: Date.now() - 60 * 24 * 60 * 60 * 1000,
  },
  DEPT_CLEANING: {
    code: "DEPT_CLEANING",
    name: "Phòng Vệ Sinh",
    description: "Bộ phận vệ sinh và làm sạch sản phẩm",
    created_at: Date.now() - 60 * 24 * 60 * 60 * 1000,
  },
  DEPT_REPAIR: {
    code: "DEPT_REPAIR",
    name: "Phòng Sửa Chữa",
    description: "Bộ phận sửa chữa và phục hồi sản phẩm",
    created_at: Date.now() - 60 * 24 * 60 * 60 * 1000,
  },
};

// ============================================
// UTILITY FUNCTIONS
// ============================================

function generateRandomCode(prefix: string): string {
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = Math.random().toString(36).substring(2, 8).toUpperCase();
  return `${prefix}${timestamp}${random}`;
}

function randomElement<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function randomPhone(): string {
  const prefix = randomElement(PHONE_PREFIXES);
  const suffix = Math.floor(1000000 + Math.random() * 9000000);
  return `${prefix}${suffix}`;
}

function randomDate(daysAgo: number): number {
  return Date.now() - daysAgo * 24 * 60 * 60 * 1000;
}

// ============================================
// MOCK DATA GENERATORS
// ============================================

function generateCustomers(count: number = 10) {
  console.log(`📝 Generating ${count} customers...`);
  const customers: any = {};

  for (let i = 0; i < count; i++) {
    const customerId = generateRandomCode("CUST_");
    const name = randomElement(VIETNAMESE_NAMES);
    const phone = randomPhone();
    const email = name
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/\s+/g, "")
      + "@gmail.com";

    customers[customerId] = {
      code: customerId,
      name,
      phone,
      email,
      address: randomElement(ADDRESSES),
      customerSource: randomElement(Object.values(CustomerSource)),
      createdAt: randomDate(Math.floor(Math.random() * 180)),
      updatedAt: Date.now(),
    };
  }

  console.log(`✅ Created ${count} customers`);
  return { customers, customerIds: Object.keys(customers) };
}

function generateOrders(customers: any, count: number = 15) {
  console.log(`📝 Generating ${count} orders...`);
  const orders: any = {};
  const allServiceItems: any = {};
  const customerIds = Object.keys(customers);

  for (let i = 0; i < count; i++) {
    const orderId = generateRandomCode("ORD_");
    const customerId = randomElement(customerIds);
    const customer = customers[customerId];

    const numProducts = Math.floor(Math.random() * 3) + 1; // 1-3 products per order
    const serviceItemIds: string[] = [];
    let totalAmount = 0;

    // Generate service items for this order
    for (let j = 0; j < numProducts; j++) {
      const product = randomElement(LUXURY_PRODUCTS);
      const quantity = 1; // Usually 1 item per service item
      const itemPrice = product.price;

      // Select workflow based on category
      let workflowId = "WF_BAG_SPA";
      if (product.category === "shoe") workflowId = "WF_SHOE_REPAIR";
      if (product.category === "watch") workflowId = "WF_WATCH_SERVICE";

      const workflow = WORKFLOW_TEMPLATES[workflowId as keyof typeof WORKFLOW_TEMPLATES];

      for (let k = 0; k < quantity; k++) {
        const itemId = generateRandomCode("ITEM_");
        serviceItemIds.push(itemId);
        totalAmount += itemPrice;

        // Determine current stage (random progress)
        const progress = Math.random();
        let currentStageIndex = Math.floor(progress * workflow.stages.length);
        const isCompleted = progress > 0.8;

        if (isCompleted) {
          currentStageIndex = workflow.stages.length; // Beyond last stage
        }

        const currentStage = workflow.stages[currentStageIndex];
        const completedStages = workflow.stages
          .slice(0, currentStageIndex)
          .map((s) => s.id);

        // Generate checklist
        const checklist: any = {};
        workflow.stages.forEach((stage, idx) => {
          const tasks = stage.checklist_template.map((task, taskIdx) => {
            const isThisStageCompleted = idx < currentStageIndex;
            const isCurrentStageSomeTasksDone =
              idx === currentStageIndex && taskIdx < Math.floor(Math.random() * stage.checklist_template.length);

            return {
              task,
              checked: isThisStageCompleted || isCurrentStageSomeTasksDone,
              timestamp: isThisStageCompleted
                ? randomDate(30 - idx * 7)
                : undefined,
              by: isThisStageCompleted ? "tech_worker_1" : undefined,
              by_name: isThisStageCompleted ? "Nguyễn Văn A" : undefined,
              notes: undefined,
            };
          });
          checklist[stage.id] = tasks;
        });

        // Commission (random FIXED or PERCENT)
        const commissionType = Math.random() > 0.5 ? CommissionType.FIXED : CommissionType.PERCENT;
        const commissionValue =
          commissionType === CommissionType.FIXED
            ? Math.floor(itemPrice * 0.05) // 5% as fixed amount
            : Math.floor(Math.random() * 15) + 5; // 5-20%

        const calculatedAmount =
          commissionType === CommissionType.FIXED
            ? commissionValue
            : (itemPrice * commissionValue) / 100;

        const serviceItem = {
          id: itemId,
          qr_code: itemId,
          order_id: orderId,
          product_name: product.name,
          service_name: workflow.name,
          price: itemPrice,
          quantity: 1,
          commission: {
            type: commissionType,
            value: commissionValue,
            receiver_id: "user_sale_A",
            receiver_name: "Trần Thị B (Sales)",
            calculated_amount: calculatedAmount,
          },
          workflow_id: workflowId,
          workflow_name: workflow.name,
          current_stage_id: isCompleted ? null : currentStage?.id || null,
          current_stage_name: isCompleted ? null : currentStage?.name || null,
          status: isCompleted
            ? ServiceItemStatus.COMPLETED
            : currentStageIndex > 0
            ? ServiceItemStatus.PROCESSING
            : ServiceItemStatus.PENDING,
          assigned_technician_id: currentStageIndex > 0 ? "tech_worker_1" : null,
          assigned_technician_name:
            currentStageIndex > 0 ? "Nguyễn Văn A" : undefined,
          department_id: currentStage?.department_id,
          checklist,
          completed_stages: completedStages,
          total_stages: workflow.stages.length,
          completion_percentage: Math.round(
            (completedStages.length / workflow.stages.length) * 100
          ),
          photos: {
            before: [
              "https://picsum.photos/seed/" + itemId + "1/800/600",
              "https://picsum.photos/seed/" + itemId + "2/800/600",
            ],
            after: isCompleted
              ? [
                  "https://picsum.photos/seed/" + itemId + "3/800/600",
                  "https://picsum.photos/seed/" + itemId + "4/800/600",
                ]
              : [],
          },
          created_at: randomDate(Math.floor(Math.random() * 60)),
          updated_at: Date.now(),
          started_at: currentStageIndex > 0 ? randomDate(50) : undefined,
          completed_at: isCompleted ? randomDate(5) : undefined,
          delivered_at: undefined,
          estimated_completion: Date.now() + 7 * 24 * 60 * 60 * 1000,
          notes: Math.random() > 0.7 ? "Khách VIP, ưu tiên xử lý" : undefined,
          priority: Math.random() > 0.8 ? "high" : "normal",
        };

        allServiceItems[itemId] = serviceItem;
      }
    }

    // Calculate order totals
    const discountAmount = Math.floor(totalAmount * 0.05); // 5% discount
    const shippingFee = 0; // Free shipping for luxury items
    const subtotal = totalAmount - discountAmount;
    const finalAmount = subtotal + shippingFee;
    const depositAmount = Math.floor(finalAmount * 0.5); // 50% deposit

    // Determine order status based on service items
    const allCompleted = serviceItemIds.every(
      (id) => allServiceItems[id].status === ServiceItemStatus.COMPLETED
    );
    const anyProcessing = serviceItemIds.some(
      (id) => allServiceItems[id].status === ServiceItemStatus.PROCESSING
    );

    let orderStatus = OrderStatus.PENDING;
    if (allCompleted) orderStatus = OrderStatus.READY;
    else if (anyProcessing) orderStatus = OrderStatus.PROCESSING;
    else if (Math.random() > 0.5) orderStatus = OrderStatus.DEPOSIT_PAID;

    const order = {
      id: orderId,
      code: orderId,
      customer_id: customerId,
      customer_name: customer.name,
      customer_phone: customer.phone,
      customer_email: customer.email,
      customer_address: customer.address,
      customer_source: customer.customerSource,
      status: orderStatus,
      order_date: randomDate(Math.floor(Math.random() * 60)),
      estimated_completion_date: Date.now() + 14 * 24 * 60 * 60 * 1000,
      total_amount: totalAmount,
      discount_amount: discountAmount,
      discount_type: "amount",
      discount_value: discountAmount,
      shipping_fee: shippingFee,
      subtotal,
      final_amount: finalAmount,
      payment_status: orderStatus === OrderStatus.DEPOSIT_PAID ? "deposit" : "unpaid",
      deposit_amount: orderStatus === OrderStatus.DEPOSIT_PAID ? depositAmount : 0,
      paid_amount: orderStatus === OrderStatus.DEPOSIT_PAID ? depositAmount : 0,
      remaining_amount: finalAmount - (orderStatus === OrderStatus.DEPOSIT_PAID ? depositAmount : 0),
      consultant_id: "user_sale_A",
      consultant_name: "Trần Thị B (Sales)",
      service_item_ids: serviceItemIds,
      total_items: serviceItemIds.length,
      created_at: randomDate(Math.floor(Math.random() * 60)),
      updated_at: Date.now(),
      created_by: "user_sale_A",
      created_by_name: "Trần Thị B",
      notes: Math.random() > 0.7 ? "Khách hàng yêu cầu gấp trong 3 ngày" : "",
      priority: Math.random() > 0.8 ? "high" : "normal",
    };

    orders[orderId] = order;
  }

  console.log(`✅ Created ${count} orders with ${Object.keys(allServiceItems).length} service items`);
  return { orders, serviceItems: allServiceItems };
}

// ============================================
// MAIN EXECUTION
// ============================================

function main() {
  console.log("🚀 Starting XOXO Mock Data Generation...\n");

  try {
    // Step 1: Generate customers
    const { customers, customerIds } = generateCustomers(20);

    // Step 2: Generate orders and service items
    const { orders, serviceItems } = generateOrders(customers, 25);

    // Step 3: Compile all data
    const mockData = {
      xoxo: {
        customers,
        orders,
        service_items: serviceItems,
        workflow_templates: WORKFLOW_TEMPLATES,
        departments: DEPARTMENTS,
      }
    };

    // Step 4: Write to JSON file
    const outputPath = resolve(__dirname, "mock-data.json");
    writeFileSync(outputPath, JSON.stringify(mockData, null, 2), "utf-8");

    console.log("\n✅ ✨ Mock data generation completed successfully!");
    console.log("\n📊 Summary:");
    console.log("   - 20 Customers");
    console.log("   - 25 Orders");
    console.log(`   - ${Object.keys(serviceItems).length} Service Items (with QR codes)`);
    console.log("   - 3 Workflow Templates");
    console.log("   - 3 Departments");
    console.log(`\n📁 Output file: ${outputPath}`);

    process.exit(0);
  } catch (error) {
    console.error("❌ Error generating mock data:", error);
    process.exit(1);
  }
}

// Run the script
main();

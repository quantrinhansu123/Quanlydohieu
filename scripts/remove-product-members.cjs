/**
 * Script để xóa nhân viên thực hiện (members) trong tất cả workflows của một product
 * Chạy: node scripts/remove-product-members.cjs PRO_2513AG9B3
 */

const admin = require("firebase-admin");
const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "../.env.local") });

// Initialize Firebase Admin
if (!admin.apps.length) {
    try {
        const serviceAccount = {
            type: "service_account",
            project_id: process.env.FIREBASE_PROJECT_ID,
            private_key_id: process.env.FIREBASE_PRIVATE_KEY_ID,
            private_key: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
            client_email: process.env.FIREBASE_CLIENT_EMAIL,
            client_id: process.env.FIREBASE_CLIENT_ID,
            auth_uri: "https://accounts.google.com/o/oauth2/auth",
            token_uri: "https://oauth2.googleapis.com/token",
            auth_provider_x509_cert_url: "https://www.googleapis.com/oauth2/v1/certs",
            client_x509_cert_url: process.env.FIREBASE_CLIENT_X509_CERT_URL,
        };
        admin.initializeApp({
            credential: admin.credential.cert(serviceAccount),
            databaseURL: process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL,
        });
    } catch (error) {
        console.error("Firebase Admin initialization error:", error);
        process.exit(1);
    }
}

const db = admin.database();

async function removeProductMembers(productId) {
    try {
        console.log(`🔄 Đang tìm product ${productId}...`);
        const ordersRef = db.ref("xoxo/orders");
        const snapshot = await ordersRef.once("value");
        const orders = snapshot.val() || {};

        let orderCode = null;
        let orderId = null;
        let workflowsFound = 0;

        // Tìm product trong tất cả orders
        for (const [id, order] of Object.entries(orders)) {
            const orderData = order;
            if (orderData.products && orderData.products[productId]) {
                orderId = id;
                orderCode = orderData.code || id;
                const product = orderData.products[productId];

                if (product.workflows) {
                    workflowsFound = Object.keys(product.workflows).length;
                    console.log(`📦 Tìm thấy product trong order ${orderCode}`);
                    console.log(`   Số workflows: ${workflowsFound}`);

                    // Xóa members trong tất cả workflows
                    const updates = {};
                    Object.keys(product.workflows).forEach((workflowId) => {
                        const workflowPath = `xoxo/orders/${orderId}/products/${productId}/workflows/${workflowId}`;
                        updates[`${workflowPath}/members`] = null;
                        console.log(`   - Xóa members trong workflow: ${workflowId}`);
                    });

                    if (Object.keys(updates).length > 0) {
                        console.log("\n🗑️  Đang xóa members...");
                        await db.ref().update(updates);
                        console.log(`\n✅ Đã xóa thành công members trong ${workflowsFound} workflows!`);
                        console.log(`   Order Code: ${orderCode}`);
                        console.log(`   Product ID: ${productId}`);
                    } else {
                        console.log("⚠️  Không có workflows nào để xóa members.");
                    }
                } else {
                    console.log("⚠️  Product không có workflows.");
                }
                break; // Tìm thấy rồi thì dừng
            }
        }

        if (!orderCode) {
            console.log(`❌ Không tìm thấy product ${productId} trong bất kỳ order nào!`);
            process.exit(1);
        }

        process.exit(0);
    } catch (error) {
        console.error("❌ Lỗi khi xóa members:", error);
        process.exit(1);
    }
}

// Lấy product ID từ command line argument
const productId = process.argv[2] || "PRO_2513AG9B3";

if (!productId) {
    console.error("❌ Vui lòng cung cấp Product ID!");
    console.log("Usage: node scripts/remove-product-members.cjs <PRODUCT_ID>");
    process.exit(1);
}

removeProductMembers(productId);

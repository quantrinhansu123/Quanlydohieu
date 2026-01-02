/**
 * Script để xóa tất cả operational workflows
 * Chạy: node scripts/delete-operational-workflows.js
 */

const admin = require("firebase-admin");
const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "../.env.local") });

// Initialize Firebase Admin
if (!admin.apps.length) {
    try {
        const serviceAccount = JSON.parse(
            process.env.FIREBASE_SERVICE_ACCOUNT_KEY || "{}"
        );
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

async function deleteAllOperationalWorkflows() {
    try {
        console.log("🔄 Đang tải dữ liệu operational workflows...");
        const workflowsRef = db.ref("xoxo/operational_workflows");
        const snapshot = await workflowsRef.once("value");
        const workflows = snapshot.val() || {};

        const workflowIds = Object.keys(workflows);
        const workflowNames = Object.values(workflows).map(
            (w) => w.workflowName || "N/A"
        );

        console.log(`📦 Tìm thấy ${workflowIds.length} workflows:`);
        workflowNames.forEach((name, index) => {
            console.log(`   ${index + 1}. ${name}`);
        });

        if (workflowIds.length === 0) {
            console.log("✅ Không có workflows nào để xóa.");
            process.exit(0);
        }

        console.log("\n🗑️  Đang xóa tất cả operational workflows...");
        await workflowsRef.remove();

        console.log(`\n✅ Đã xóa thành công ${workflowIds.length} operational workflows!`);
        console.log("\nDanh sách workflows đã xóa:");
        workflowNames.forEach((name, index) => {
            console.log(`   ${index + 1}. ${name}`);
        });

        process.exit(0);
    } catch (error) {
        console.error("❌ Lỗi khi xóa operational workflows:", error);
        process.exit(1);
    }
}

deleteAllOperationalWorkflows();


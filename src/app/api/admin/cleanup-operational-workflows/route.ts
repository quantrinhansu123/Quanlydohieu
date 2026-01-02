import { NextRequest, NextResponse } from "next/server";
import { getDatabase, ref, get, remove } from "firebase/database";
import { initializeApp, getApps, cert } from "firebase-admin/app";
import { getDatabase as getAdminDatabase } from "firebase-admin/database";

// Initialize Firebase Admin if not already initialized
if (!getApps().length) {
    try {
        const serviceAccount = JSON.parse(
            process.env.FIREBASE_SERVICE_ACCOUNT_KEY || "{}"
        );
        initializeApp({
            credential: cert(serviceAccount),
            databaseURL: process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL,
        });
    } catch (error) {
        console.error("Firebase Admin initialization error:", error);
    }
}

export async function POST(request: NextRequest) {
    try {
        const db = getAdminDatabase();
        const workflowsRef = db.ref("xoxo/operational_workflows");

        // Get all workflows
        const snapshot = await workflowsRef.once("value");
        const workflows = snapshot.val() || {};

        const workflowIds = Object.keys(workflows);
        const workflowNames = Object.values(workflows).map(
            (w: any) => w.workflowName || "N/A"
        );

        // Delete all workflows
        await workflowsRef.remove();

        return NextResponse.json({
            success: true,
            message: `Đã xóa thành công ${workflowIds.length} operational workflows`,
            deletedCount: workflowIds.length,
            workflowNames,
        });
    } catch (error: any) {
        console.error("Error deleting operational workflows:", error);
        return NextResponse.json(
            {
                success: false,
                error: error.message || "Có lỗi xảy ra khi xóa operational workflows",
            },
            { status: 500 }
        );
    }
}


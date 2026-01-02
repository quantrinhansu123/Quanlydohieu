import { NextRequest, NextResponse } from "next/server";
import { initializeApp, getApps, cert } from "firebase-admin/app";
import { getDatabase as getAdminDatabase } from "firebase-admin/database";
import { env } from "@/env";

// Initialize Firebase Admin if not already initialized
if (!getApps().length) {
    try {
        const serviceAccount = {
            type: "service_account",
            project_id: env.FIREBASE_PROJECT_ID,
            private_key_id: env.FIREBASE_PRIVATE_KEY_ID,
            private_key: env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
            client_email: env.FIREBASE_CLIENT_EMAIL,
            client_id: env.FIREBASE_CLIENT_ID,
            auth_uri: "https://accounts.google.com/o/oauth2/auth",
            token_uri: "https://oauth2.googleapis.com/token",
            auth_provider_x509_cert_url: "https://www.googleapis.com/oauth2/v1/certs",
            client_x509_cert_url: env.FIREBASE_CLIENT_X509_CERT_URL,
        };
        initializeApp({
            credential: cert(serviceAccount as any),
            databaseURL: env.NEXT_PUBLIC_FIREBASE_DATABASE_URL,
        });
    } catch (error) {
        console.error("Firebase Admin initialization error:", error);
    }
}

export async function POST(request: NextRequest) {
    try {
        const { productId } = await request.json();

        if (!productId) {
            return NextResponse.json(
                {
                    success: false,
                    error: "Vui lòng cung cấp Product ID!",
                },
                { status: 400 }
            );
        }

        const db = getAdminDatabase();
        const ordersRef = db.ref("xoxo/orders");

        // Get all orders
        const snapshot = await ordersRef.once("value");
        const orders = snapshot.val() || {};

        let orderCode: string | null = null;
        let orderId: string | null = null;
        let workflowsFound = 0;

        // Tìm product trong tất cả orders
        for (const [id, order] of Object.entries(orders)) {
            const orderData = order as any;
            if (orderData.products && orderData.products[productId]) {
                orderId = id;
                orderCode = orderData.code || id;
                const product = orderData.products[productId];

                if (product.workflows) {
                    workflowsFound = Object.keys(product.workflows).length;

                    // Xóa members trong tất cả workflows
                    const updates: any = {};
                    Object.keys(product.workflows).forEach((workflowId) => {
                        const workflowPath = `xoxo/orders/${orderId}/products/${productId}/workflows/${workflowId}`;
                        updates[`${workflowPath}/members`] = null;
                    });

                    if (Object.keys(updates).length > 0) {
                        await db.ref().update(updates);
                    }
                }
                break; // Tìm thấy rồi thì dừng
            }
        }

        if (!orderCode) {
            return NextResponse.json(
                {
                    success: false,
                    error: `Không tìm thấy product ${productId} trong bất kỳ order nào!`,
                },
                { status: 404 }
            );
        }

        return NextResponse.json({
            success: true,
            message: `Đã xóa thành công members trong ${workflowsFound} workflows!`,
            orderCode,
            productId,
            workflowsUpdated: workflowsFound,
        });
    } catch (error: any) {
        console.error("Error removing product members:", error);
        return NextResponse.json(
            {
                success: false,
                error: error.message || "Có lỗi xảy ra khi xóa members",
            },
            { status: 500 }
        );
    }
}


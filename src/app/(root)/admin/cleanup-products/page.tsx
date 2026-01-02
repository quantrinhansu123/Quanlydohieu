"use client";

import { App, Button, Card, Typography, Space, Alert } from "antd";
import { useState } from "react";
import { getDatabase, ref, get, update } from "firebase/database";
import { useFirebaseApp } from "@/firebase/provider";

const { Title, Text, Paragraph } = Typography;

export default function CleanupProductsPage() {
    const { message } = App.useApp();
    const firebaseApp = useFirebaseApp();
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState<{
        totalProducts: number;
        cleanedProducts: number;
    } | null>(null);

    const handleCleanup = async () => {
        setLoading(true);
        setResult(null);

        try {
            const db = getDatabase(firebaseApp);
            const ordersRef = ref(db, "xoxo/orders");

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
                    const productRef = ref(
                        db,
                        `xoxo/orders/${orderCode}/products/${productId}`
                    );

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
                    }
                }
            }

            setResult({
                totalProducts,
                cleanedProducts,
            });

            message.success(
                `Đã xóa dữ liệu ${cleanedProducts}/${totalProducts} products! Workflows được giữ lại.`
            );
        } catch (error) {
            console.error("❌ Lỗi khi cleanup products:", error);
            message.error("Có lỗi xảy ra khi cleanup products!");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="p-6">
            <Title level={2}>Cleanup Products - Xóa dữ liệu Products</Title>

            <Alert
                message="Cảnh báo"
                description="Script này sẽ xóa các trường name, quantity, price, images trong tất cả products của tất cả orders. Chỉ workflows sẽ được giữ lại."
                type="warning"
                showIcon
                className="mb-6"
            />

            <Card>
                <Space direction="vertical" size="large" className="w-full">
                    <div>
                        <Paragraph>
                            Script này sẽ thực hiện các thao tác sau:
                        </Paragraph>
                        <ul>
                            <li>
                                Xóa trường <Text code>name</Text> trong tất cả
                                products
                            </li>
                            <li>
                                Xóa trường <Text code>quantity</Text> trong tất
                                cả products
                            </li>
                            <li>
                                Xóa trường <Text code>price</Text> trong tất cả
                                products
                            </li>
                            <li>
                                Xóa trường <Text code>images</Text> trong tất
                                cả products
                            </li>
                            <li>
                                Xóa trường <Text code>imagesDone</Text> trong
                                tất cả products
                            </li>
                            <li>
                                <Text strong>Giữ lại</Text> trường{" "}
                                <Text code>workflows</Text> trong tất cả
                                products
                            </li>
                        </ul>
                    </div>

                    <Button
                        type="primary"
                        danger
                        size="large"
                        loading={loading}
                        onClick={handleCleanup}
                    >
                        {loading ? "Đang xử lý..." : "Bắt đầu Cleanup"}
                    </Button>

                    {result && (
                        <Card>
                            <Title level={4}>Kết quả:</Title>
                            <Space direction="vertical">
                                <Text>
                                    Tổng số products:{" "}
                                    <Text strong>{result.totalProducts}</Text>
                                </Text>
                                <Text>
                                    Đã xóa dữ liệu:{" "}
                                    <Text strong>{result.cleanedProducts}</Text>{" "}
                                    products
                                </Text>
                                <Text type="success">
                                    Workflows được giữ lại trong tất cả products
                                </Text>
                            </Space>
                        </Card>
                    )}
                </Space>
            </Card>
        </div>
    );
}


"use client";

import { App, Button, Card, Typography, Space, Alert, Input } from "antd";
import { useState, useEffect, useCallback } from "react";

const { Title, Text } = Typography;

export default function RemoveProductMembersPage() {
    const { message: antdMessage } = App.useApp();
    const [loading, setLoading] = useState(false);
    const [productId, setProductId] = useState("PRO_2513AG9B3");
    const [result, setResult] = useState<{
        orderCode?: string;
        workflowsFound: number;
        workflowsUpdated: number;
    } | null>(null);
    const [hasRun, setHasRun] = useState(false);

    const handleRemoveMembers = useCallback(async (id?: string) => {
        const targetProductId = id || productId.trim();
        if (!targetProductId) {
            antdMessage.warning("Vui lòng nhập Product ID!");
            return;
        }

        setLoading(true);
        setResult(null);

        try {
            const response = await fetch("/api/admin/remove-product-members", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ productId: targetProductId }),
            });

            const data = await response.json();

            if (!response.ok || !data.success) {
                throw new Error(data.error || "Có lỗi xảy ra");
            }

            setResult({
                orderCode: data.orderCode,
                workflowsFound: data.workflowsUpdated,
                workflowsUpdated: data.workflowsUpdated,
            });

            antdMessage.success(data.message);
        } catch (error: any) {
            console.error("Error removing members:", error);
            antdMessage.error(`Lỗi: ${error.message}`);
        } finally {
            setLoading(false);
        }
    }, [productId, antdMessage]);

    // Tự động chạy một lần khi component mount với productId mặc định
    useEffect(() => {
        if (!hasRun && productId === "PRO_2513AG9B3") {
            setHasRun(true);
            handleRemoveMembers();
        }
    }, [hasRun, productId, handleRemoveMembers]);

    return (
        <div className="p-6">
            <Title level={2}>Xóa Nhân viên thực hiện trong Product</Title>

            <Alert
                message="Cảnh báo"
                description="Script này sẽ xóa trường 'members' trong tất cả workflows của product được chỉ định."
                type="warning"
                showIcon
                className="mb-6"
            />

            <Card>
                <Space direction="vertical" className="w-full" size="large">
                    <div>
                        <Text strong>Nhập Product ID:</Text>
                        <Input
                            placeholder="VD: PRO_2513AG9B3"
                            value={productId}
                            onChange={(e) => setProductId(e.target.value)}
                            className="mt-2"
                        />
                    </div>

                    <Button
                        type="primary"
                        danger
                        size="large"
                        loading={loading}
                        onClick={() => handleRemoveMembers()}
                        disabled={!productId.trim()}
                    >
                        {loading ? "Đang xử lý..." : "Xóa Nhân viên thực hiện"}
                    </Button>

                    {result && (
                        <Card>
                            <Title level={4}>Kết quả:</Title>
                            <Space direction="vertical">
                                <Text>
                                    Order Code: <Text strong>{result.orderCode}</Text>
                                </Text>
                                <Text>
                                    Product ID: <Text strong>{productId}</Text>
                                </Text>
                                <Text>
                                    Số workflows tìm thấy:{" "}
                                    <Text strong>{result.workflowsFound}</Text>
                                </Text>
                                <Text>
                                    Số workflows đã cập nhật:{" "}
                                    <Text strong type="success">
                                        {result.workflowsUpdated}
                                    </Text>
                                </Text>
                            </Space>
                        </Card>
                    )}
                </Space>
            </Card>
        </div>
    );
}


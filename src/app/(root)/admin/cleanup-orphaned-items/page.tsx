"use client";

import { App, Button, Card, Typography, Space, Alert, Statistic } from "antd";
import { useState } from "react";
import { useFirebaseApp } from "@/firebase/provider";
import { OperationalWorkflowService } from "@/services/operationalWorkflowService";
import { DeleteOutlined } from "@ant-design/icons";

const { Title, Text } = Typography;

export default function CleanupOrphanedItemsPage() {
    const { message: antdMessage } = App.useApp();
    const firebaseApp = useFirebaseApp();
    const [loading, setLoading] = useState(false);
    const [deletedCount, setDeletedCount] = useState<number | null>(null);

    // Handle cleanup orphaned items
    const handleCleanup = async () => {
        setLoading(true);
        setDeletedCount(null);

        try {
            const count = await OperationalWorkflowService.deleteOrphanedItems();
            
            setDeletedCount(count);
            antdMessage.success(
                `Đã xóa thành công ${count} công việc không có đơn hàng tương ứng!`
            );
        } catch (error: any) {
            console.error("Error cleaning up orphaned items:", error);
            antdMessage.error(`Lỗi: ${error.message}`);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="p-6">
            <Title level={2}>Xóa Công Việc Thừa</Title>

            <Alert
                message="Mô tả"
                description="Trang này sẽ xóa tất cả các công việc (operational workflow items) không có đơn hàng tương ứng trong database. Đây là các công việc test hoặc đơn hàng đã bị xóa nhưng công việc vẫn còn."
                type="info"
                showIcon
                className="mb-6"
            />

            <Card>
                <Space direction="vertical" className="w-full" size="large">
                    {/* Statistics */}
                    {deletedCount !== null && (
                        <Card>
                            <Statistic
                                title="Số công việc đã xóa"
                                value={deletedCount}
                                prefix={<DeleteOutlined />}
                            />
                        </Card>
                    )}

                    {/* Cleanup Button */}
                    <div className="flex justify-center">
                        <Button
                            type="primary"
                            danger
                            size="large"
                            icon={<DeleteOutlined />}
                            loading={loading}
                            onClick={handleCleanup}
                        >
                            {loading ? "Đang xóa..." : "Xóa Công Việc Thừa"}
                        </Button>
                    </div>

                    {/* Info */}
                    <Alert
                        message="Lưu ý"
                        description="Chỉ các công việc không có đơn hàng tương ứng sẽ bị xóa. Các công việc có đơn hàng hợp lệ sẽ được giữ lại."
                        type="warning"
                        showIcon
                    />
                </Space>
            </Card>
        </div>
    );
}


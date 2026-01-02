"use client";

import { App, Button, Card, Typography, Space, Alert, Modal, Statistic } from "antd";
import { useState, useEffect } from "react";
import { getDatabase, ref, get, remove } from "firebase/database";
import { OperationalWorkflowService } from "@/services/operationalWorkflowService";
import { useFirebaseApp } from "@/firebase/provider";
import { DeleteOutlined, ExclamationCircleOutlined } from "@ant-design/icons";

const { Title, Text } = Typography;

export default function DeleteAllOrdersPage() {
    const { message: antdMessage } = App.useApp();
    const firebaseApp = useFirebaseApp();
    const [loading, setLoading] = useState(false);
    const [ordersCount, setOrdersCount] = useState<number | null>(null);
    const [loadingCount, setLoadingCount] = useState(true);

    // Load orders count
    useEffect(() => {
        loadOrdersCount();
    }, []);

    const loadOrdersCount = async () => {
        setLoadingCount(true);
        try {
            const db = getDatabase(firebaseApp);
            const ordersRef = ref(db, "xoxo/orders");

            const snapshot = await get(ordersRef);
            const ordersData = snapshot.val() || {};
            const count = Object.keys(ordersData).length;

            setOrdersCount(count);
        } catch (error: any) {
            console.error("Error loading orders count:", error);
            antdMessage.error(`Lỗi khi tải số lượng đơn hàng: ${error.message}`);
        } finally {
            setLoadingCount(false);
        }
    };

    // Handle delete all orders
    const handleDeleteAllOrders = () => {
        Modal.confirm({
            title: "⚠️ XÁC NHẬN XÓA TẤT CẢ ĐƠN HÀNG",
            width: 600,
            icon: <ExclamationCircleOutlined style={{ color: "#ff4d4f" }} />,
            content: (
                <div>
                    <Alert
                        message="CẢNH BÁO NGHIÊM TRỌNG"
                        description={
                            <div>
                                <p className="mb-2">
                                    Bạn sắp xóa <strong>TẤT CẢ {ordersCount} đơn hàng</strong> trong database!
                                </p>
                                <p className="mb-2 text-red-500">
                                    <strong>Hành động này KHÔNG THỂ HOÀN TÁC!</strong>
                                </p>
                                <p className="mb-2">
                                    Tất cả dữ liệu đơn hàng, sản phẩm, quy trình sẽ bị xóa vĩnh viễn.
                                </p>
                                <p>
                                    Vui lòng nhập <strong>"XÓA TẤT CẢ"</strong> vào ô bên dưới để xác nhận:
                                </p>
                            </div>
                        }
                        type="error"
                        showIcon
                        className="mt-4"
                    />
                </div>
            ),
            okText: "Xóa tất cả",
            okType: "danger",
            cancelText: "Hủy",
            onOk: async () => {
                setLoading(true);
                try {
                    const db = getDatabase(firebaseApp);
                    const ordersRef = ref(db, "xoxo/orders");

                    // Get all orders first to show what will be deleted
                    const snapshot = await get(ordersRef);
                    const ordersData = snapshot.val() || {};
                    const orderCodes = Object.keys(ordersData);

                    // Delete all orders
                    await remove(ordersRef);

                    // Delete all operational workflow items
                    for (const orderCode of orderCodes) {
                        try {
                            await OperationalWorkflowService.deleteItemsByOrderCode(orderCode);
                        } catch (error) {
                            console.error(`Error deleting items for order ${orderCode}:`, error);
                        }
                    }

                    antdMessage.success(
                        `Đã xóa thành công ${orderCodes.length} đơn hàng và tất cả công việc liên quan!`
                    );
                    
                    // Reload count
                    setOrdersCount(0);
                } catch (error: any) {
                    console.error("Error deleting all orders:", error);
                    antdMessage.error(`Lỗi khi xóa đơn hàng: ${error.message}`);
                } finally {
                    setLoading(false);
                }
            },
        });
    };

    return (
        <div className="p-6">
            <Title level={2}>Xóa Tất Cả Đơn Hàng</Title>

            <Alert
                message="Cảnh báo nguy hiểm"
                description="Trang này sẽ xóa TẤT CẢ đơn hàng trong database. Hành động này không thể hoàn tác!"
                type="error"
                showIcon
                className="mb-6"
            />

            <Card>
                <Space direction="vertical" className="w-full" size="large">
                    {/* Statistics */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <Card>
                            <Statistic
                                title="Tổng số đơn hàng"
                                value={loadingCount ? "..." : ordersCount || 0}
                                loading={loadingCount}
                            />
                        </Card>
                    </div>

                    {/* Delete Button */}
                    <div className="flex justify-center">
                        <Button
                            type="primary"
                            danger
                            size="large"
                            icon={<DeleteOutlined />}
                            loading={loading}
                            onClick={handleDeleteAllOrders}
                            disabled={loadingCount || (ordersCount !== null && ordersCount === 0)}
                        >
                            {loading
                                ? "Đang xóa..."
                                : `Xóa Tất Cả ${ordersCount !== null ? ordersCount : ""} Đơn Hàng`}
                        </Button>
                    </div>

                    {/* Info */}
                    <Alert
                        message="Lưu ý"
                        description="Sau khi xóa, bạn có thể tạo đơn hàng mới từ đầu. Tất cả dữ liệu cũ sẽ bị mất vĩnh viễn."
                        type="info"
                        showIcon
                    />
                </Space>
            </Card>
        </div>
    );
}


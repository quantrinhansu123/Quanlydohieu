"use client";

import { App, Button, Card, Typography, Space, Alert, Modal, Input } from "antd";
import { useState } from "react";
import { useFirebaseApp } from "@/firebase/provider";
import { getDatabase, ref, remove } from "firebase/database";
import { DeleteOutlined, ExclamationCircleOutlined } from "@ant-design/icons";

const { Title, Text } = Typography;

export default function DeleteAllDatabasePage() {
    const { message: antdMessage } = App.useApp();
    const firebaseApp = useFirebaseApp();
    const [loading, setLoading] = useState(false);
    const [confirmVisible, setConfirmVisible] = useState(false);
    const [confirmText, setConfirmText] = useState("");

    // Handle delete all database
    const handleDeleteAll = async () => {
        if (confirmText !== "XOA TAT CA") {
            antdMessage.error("Vui lòng nhập chính xác 'XOA TAT CA' để xác nhận!");
            return;
        }

        try {
            setLoading(true);
            const db = getDatabase(firebaseApp);
            const rootRef = ref(db, "xoxo");
            
            await remove(rootRef);
            
            antdMessage.success("Đã xóa toàn bộ database thành công!");
            setConfirmVisible(false);
            setConfirmText("");
        } catch (error: any) {
            console.error("Error deleting all database:", error);
            antdMessage.error(`Lỗi khi xóa database: ${error.message}`);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="p-6">
            <Title level={2}>Xoa Toan Bo Database</Title>

            <Alert
                message="Cảnh báo cực kỳ nguy hiểm"
                description="Trang này sẽ xóa TOAN BO dữ liệu trong database (xoxo/). Hành động này KHONG THE hoàn tác!"
                type="error"
                showIcon
                className="mb-6"
            />

            <Card>
                <Space direction="vertical" className="w-full" size="large">
                    <div>
                        <Text strong>Hành động này sẽ xóa:</Text>
                        <ul className="list-disc pl-5 mt-2">
                            <li>Tất cả đơn hàng (orders)</li>
                            <li>Tất cả quy trình vận hành (operational_workflows)</li>
                            <li>Tất cả công việc (operational_workflow_items)</li>
                            <li>Tất cả nhân viên (staff)</li>
                            <li>Tất cả quy trình (workflows)</li>
                            <li>Tất cả dữ liệu khác trong xoxo/</li>
                        </ul>
                    </div>

                    <Button
                        type="primary"
                        danger
                        size="large"
                        icon={<DeleteOutlined />}
                        onClick={() => setConfirmVisible(true)}
                        block
                    >
                        XOA TOAN BO DATABASE
                    </Button>
                </Space>
            </Card>

            {/* Confirmation Modal */}
            <Modal
                title={
                    <span style={{ color: "#ff4d4f" }}>
                        <ExclamationCircleOutlined /> XOA TOAN BO DATABASE
                    </span>
                }
                open={confirmVisible}
                onCancel={() => {
                    setConfirmVisible(false);
                    setConfirmText("");
                }}
                footer={null}
                width={600}
            >
                <Space direction="vertical" className="w-full" size="large">
                    <Alert
                        message="Cảnh báo cực kỳ nguy hiểm"
                        description={
                            <div>
                                <p>Bạn đang chuẩn bị xóa <strong>TOAN BO</strong> dữ liệu trong database!</p>
                                <p className="mt-2 text-red-500">
                                    <strong>Hành động này KHONG THE hoàn tác!</strong>
                                </p>
                            </div>
                        }
                        type="error"
                        showIcon
                    />

                    <div>
                        <Text strong>Để xác nhận, vui lòng nhập: </Text>
                        <Text code strong style={{ fontSize: "16px" }}>
                            XOA TAT CA
                        </Text>
                        <Input
                            placeholder="Nhập 'XOA TAT CA' để xác nhận"
                            value={confirmText}
                            onChange={(e) => setConfirmText(e.target.value)}
                            className="mt-2"
                            onPressEnter={handleDeleteAll}
                        />
                    </div>

                    <Space className="w-full justify-end">
                        <Button
                            onClick={() => {
                                setConfirmVisible(false);
                                setConfirmText("");
                            }}
                        >
                            Hủy
                        </Button>
                        <Button
                            type="primary"
                            danger
                            icon={<DeleteOutlined />}
                            onClick={handleDeleteAll}
                            loading={loading}
                            disabled={confirmText !== "XOA TAT CA"}
                        >
                            XOA TOAN BO
                        </Button>
                    </Space>
                </Space>
            </Modal>
        </div>
    );
}


"use client";

import { App, Button, Card, Typography, Space, Alert, Modal } from "antd";
import { useState } from "react";
import { getDatabase, ref, get, remove } from "firebase/database";
import { useFirebaseApp } from "@/firebase/provider";

const { Title, Text, Paragraph } = Typography;

export default function CleanupOperationalWorkflowsPage() {
    const { message } = App.useApp();
    const firebaseApp = useFirebaseApp();
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState<{
        totalWorkflows: number;
        deletedWorkflows: number;
        workflowNames: string[];
    } | null>(null);

    const handleCleanup = () => {
        Modal.confirm({
            title: "Xác nhận xóa",
            content: (
                <div>
                    <p>
                        Bạn có chắc chắn muốn xóa <strong>TẤT CẢ</strong>{" "}
                        operational workflows không?
                    </p>
                    <Alert
                        message="Cảnh báo"
                        description="Hành động này không thể hoàn tác! Tất cả workflows trong xoxo/operational_workflows sẽ bị xóa vĩnh viễn."
                        type="error"
                        showIcon
                        className="mt-4"
                    />
                </div>
            ),
            okText: "Xóa",
            okType: "danger",
            cancelText: "Hủy",
            onOk: async () => {
                setLoading(true);
                setResult(null);

                try {
                    const db = getDatabase(firebaseApp);
                    const workflowsRef = ref(db, "xoxo/operational_workflows");

                    console.log("🔄 Đang tải dữ liệu operational workflows...");
                    const workflowsSnapshot = await get(workflowsRef);
                    const workflows = workflowsSnapshot.val() || {};

                    const workflowIds = Object.keys(workflows);
                    const workflowNames = Object.values(workflows).map(
                        (w: any) => w.workflowName || "N/A"
                    );

                    console.log(`📦 Tìm thấy ${workflowIds.length} workflows`);

                    // Xóa toàn bộ node operational_workflows một lần
                    await remove(workflowsRef);
                    console.log(`  ✅ Đã xóa toàn bộ ${workflowIds.length} workflows`);

                    setResult({
                        totalWorkflows: workflowIds.length,
                        deletedWorkflows: workflowIds.length,
                        workflowNames,
                    });

                    message.success(
                        `Đã xóa thành công ${workflowIds.length} operational workflows!`
                    );
                } catch (error) {
                    console.error("❌ Lỗi khi xóa operational workflows:", error);
                    message.error("Có lỗi xảy ra khi xóa operational workflows!");
                } finally {
                    setLoading(false);
                }
            },
        });
    };

    return (
        <div className="p-6">
            <Title level={2}>
                Cleanup Operational Workflows - Xóa Quy trình vận hành
            </Title>

            <Alert
                message="Cảnh báo nghiêm trọng"
                description="Script này sẽ xóa VĨNH VIỄN tất cả operational workflows trong xoxo/operational_workflows. Hành động này không thể hoàn tác!"
                type="error"
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
                                Xóa <Text code>xoxo/operational_workflows</Text>{" "}
                                hoàn toàn
                            </li>
                            <li>
                                Xóa tất cả workflows như "Đánh bóng", "Quy trình
                                mạ vàng 18k", v.v.
                            </li>
                            <li>
                                Xóa tất cả jobs và tasks trong mỗi workflow
                            </li>
                            <li>
                                <Text strong type="danger">
                                    Hành động này không thể hoàn tác!
                                </Text>
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
                        {loading ? "Đang xóa..." : "Xóa Tất Cả Operational Workflows"}
                    </Button>

                    {result && (
                        <Card>
                            <Title level={4}>Kết quả:</Title>
                            <Space direction="vertical" className="w-full">
                                <Text>
                                    Tổng số workflows:{" "}
                                    <Text strong>{result.totalWorkflows}</Text>
                                </Text>
                                <Text>
                                    Đã xóa:{" "}
                                    <Text strong type="danger">
                                        {result.deletedWorkflows}
                                    </Text>{" "}
                                    workflows
                                </Text>
                                <div>
                                    <Text strong>Danh sách workflows đã xóa:</Text>
                                    <ul className="mt-2">
                                        {result.workflowNames.map((name, index) => (
                                            <li key={index}>
                                                <Text code>{name}</Text>
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            </Space>
                        </Card>
                    )}
                </Space>
            </Card>
        </div>
    );
}


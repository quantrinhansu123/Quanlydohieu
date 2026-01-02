"use client";

import { useEffect, useState } from "react";
import { getDatabase, ref, get, remove } from "firebase/database";
import { useFirebaseApp } from "@/firebase/provider";
import { App, Typography, Card, Spin, Alert } from "antd";

const { Title, Text } = Typography;

export default function DeleteOperationalWorkflowsPage() {
    const firebaseApp = useFirebaseApp();
    const { message } = App.useApp();
    const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
    const [result, setResult] = useState<{
        count: number;
        names: string[];
    } | null>(null);

    useEffect(() => {
        const deleteAll = async () => {
            setStatus("loading");
            try {
                const db = getDatabase(firebaseApp);
                const workflowsRef = ref(db, "xoxo/operational_workflows");

                // Get all workflows first to show what will be deleted
                const workflowsSnapshot = await get(workflowsRef);
                const workflows = workflowsSnapshot.val() || {};
                const workflowIds = Object.keys(workflows);
                const workflowNames = Object.values(workflows).map(
                    (w: any) => w.workflowName || "N/A"
                );

                // Delete all workflows
                await remove(workflowsRef);

                setResult({
                    count: workflowIds.length,
                    names: workflowNames,
                });
                setStatus("success");
                message.success(`Đã xóa thành công ${workflowIds.length} operational workflows!`);
            } catch (error: any) {
                console.error("Error deleting operational workflows:", error);
                setStatus("error");
                message.error(`Lỗi: ${error.message}`);
            }
        };

        // Auto-run on mount
        deleteAll();
    }, [firebaseApp, message]);

    return (
        <div className="p-6">
            <Title level={2}>Đang xóa Operational Workflows...</Title>

            {status === "loading" && (
                <Card>
                    <div className="text-center py-8">
                        <Spin size="large" />
                        <div className="mt-4">
                            <Text>Đang xóa tất cả operational workflows...</Text>
                        </div>
                    </div>
                </Card>
            )}

            {status === "success" && result && (
                <Card>
                    <Alert
                        message="Xóa thành công!"
                        description={`Đã xóa ${result.count} operational workflows`}
                        type="success"
                        showIcon
                        className="mb-4"
                    />
                    <div className="mt-4">
                        <Text strong>Danh sách workflows đã xóa:</Text>
                        <ul className="mt-2">
                            {result.names.map((name, index) => (
                                <li key={index}>
                                    <Text code>{name}</Text>
                                </li>
                            ))}
                        </ul>
                    </div>
                </Card>
            )}

            {status === "error" && (
                <Card>
                    <Alert
                        message="Lỗi"
                        description="Có lỗi xảy ra khi xóa operational workflows. Vui lòng thử lại."
                        type="error"
                        showIcon
                    />
                </Card>
            )}
        </div>
    );
}


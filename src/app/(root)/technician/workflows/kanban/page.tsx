"use client";

import React from "react";
import { Empty, Button } from "antd";
import { useRouter } from "next/navigation";
import WrapperContent from "@/components/WrapperContent";
import { ArrowLeftOutlined } from "@ant-design/icons";

const WorkflowsKanbanPage: React.FC = () => {
    const router = useRouter();

    return (
        <WrapperContent
            isEmpty={true}
            isLoading={false}
            title="Kanban"
            header={{
                buttonBackTo: "/technician/workflows",
            }}
        >
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '400px', gap: '16px' }}>
                <Empty
                    description="Trang Kanban Ä‘Ã£ Ä‘Æ°á»£c gá»¡ bá». Vui lÃ²ng sá»­ dá»¥ng trang Quy trÃ¬nh Ä‘á»ƒ xem danh sÃ¡ch quy trÃ¬nh."
                />
                <Button
                    type="primary"
                    icon={<ArrowLeftOutlined />}
                    onClick={() => router.push("/technician/workflows")}
                >
                    Quay láº¡i trang Quy trÃ¬nh
                </Button>
            </div>
        </WrapperContent>
    );
};

export default WorkflowsKanbanPage;

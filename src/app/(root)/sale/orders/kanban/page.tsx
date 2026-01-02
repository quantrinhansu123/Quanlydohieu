"use client";

import React from "react";
import { Empty, Button } from "antd";
import { useRouter } from "next/navigation";
import WrapperContent from "@/components/WrapperContent";
import { ArrowLeftOutlined } from "@ant-design/icons";

const SaleOrdersKanbanPage: React.FC = () => {
    const router = useRouter();

    return (
        <WrapperContent
            isEmpty={true}
            isLoading={false}
            title="Kanban"
            header={{
                buttonBackTo: "/sale/orders",
            }}
        >
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '400px', gap: '16px' }}>
                <Empty
                    description="Trang Kanban Ä‘Ã£ Ä‘Æ°á»£c gá»¡ bá». Vui lÃ²ng sá»­ dá»¥ng trang ÄÆ¡n hÃ ng Ä‘á»ƒ xem danh sÃ¡ch Ä‘Æ¡n hÃ ng."
                />
                <Button
                    type="primary"
                    icon={<ArrowLeftOutlined />}
                    onClick={() => router.push("/sale/orders")}
                >
                    Quay láº¡i trang ÄÆ¡n hÃ ng
                </Button>
            </div>
        </WrapperContent>
    );
};

export default SaleOrdersKanbanPage;
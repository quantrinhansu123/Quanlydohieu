"use client";

import PurchaseRequestManagement from "@/components/PurchaseRequestManagement";
import { useRealtimeList } from "@/firebase/hooks/useRealtime";
import { Material } from "@/types/inventory";
import WrapperContent from "@/components/WrapperContent";

export default function PurchaseRequestsPage() {
    const { data: materialsData } = useRealtimeList<Material>("xoxo/inventory/materials");

    return (
        <WrapperContent
            isEmpty={false}
            isLoading={false}
            title="Phiếu đề xuất mua"
            header={{}}
        >
            <PurchaseRequestManagement materials={materialsData || []} />
        </WrapperContent>
    );
}


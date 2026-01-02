"use client";

import MaterialOrderManagement from "@/components/MaterialOrderManagement";
import { useRealtimeList } from "@/firebase/hooks/useRealtime";
import { Material } from "@/types/inventory";
import WrapperContent from "@/components/WrapperContent";

export default function MaterialOrdersPage() {
    const { data: materialsData } = useRealtimeList<Material>("xoxo/inventory/materials");

    return (
        <WrapperContent
            isEmpty={false}
            isLoading={false}
            title="Đề xuất kho"
            header={{}}
        >
            <MaterialOrderManagement materials={materialsData || []} />
        </WrapperContent>
    );
}


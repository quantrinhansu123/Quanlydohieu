"use client";

import WrapperContent from "@/components/WrapperContent";
import { useRealtimeList } from "@/firebase/hooks/useRealtime";
import useFilter from "@/hooks/useFilter";
import { FirebaseOrderData, OrderStatus } from "@/types/order";
import { WarrantyClaimStatus, type WarrantyClaim } from "@/types/warrantyClaim";
import {
    DragDropContext,
    Draggable,
    Droppable,
    DropResult,
} from "@hello-pangea/dnd";
import {
    App,
    Badge,
    Button,
    Card,
    Empty,
    Tag,
    Typography,
} from "antd";
import dayjs from "dayjs";
import "dayjs/locale/vi";
import { getDatabase, ref, update } from "firebase/database";
import { useRouter } from "next/navigation";
import { useCallback, useMemo } from "react";

const { Text, Title } = Typography;

type OrderWithId = FirebaseOrderData & { id: string };

type TodoRow = {
    key: string;
    orderCode: string;
    productCode: string;
    productName: string;
    customerName: string;
    quantity: number;
    status: string;
    progressText: string;
    deliveryDate: number;
    type?: "order" | "warranty_claim";
    originalOrderCode?: string;
};

// Kanban columns configuration
const kanbanColumns = [
    {
        key: OrderStatus.PENDING,
        title: "Chờ xử lý",
        color: "#a1a1aa",
        bgColor: "#27272a",
    },
    {
        key: OrderStatus.CONFIRMED,
        title: "Đã xác nhận",
        color: "#69b1ff",
        bgColor: "#1e3a5f",
    },
    {
        key: OrderStatus.IN_PROGRESS,
        title: "Đang thực hiện",
        color: "#fadb14",
        bgColor: "#3f3f46",
    },
    {
        key: OrderStatus.ON_HOLD,
        title: "Tạm giữ",
        color: "#b37feb",
        bgColor: "#3d2a4f",
    },
    {
        key: OrderStatus.COMPLETED,
        title: "Hoàn thành",
        color: "#73d13d",
        bgColor: "#2d4a2d",
    },
];

// Todo Card Component
const TodoCard: React.FC<{
    todo: TodoRow;
    index: number;
    onView: (todo: TodoRow) => void;
}> = ({ todo, index, onView }) => {
    const columnStyle = kanbanColumns.find((col) => col.key === todo.status);

    return (
        <Draggable draggableId={todo.key} index={index}>
            {(provided, snapshot) => (
                <div
                    ref={provided.innerRef}
                    {...provided.draggableProps}
                    {...provided.dragHandleProps}
                    className={`mb-3 transition-transform duration-200 ${
                        snapshot.isDragging
                            ? "rotate-1 scale-105 shadow-lg"
                            : ""
                    }`}
                >
                    <Card
                        onClick={() => onView(todo)}
                        size="small"
                        className="shadow-sm hover:shadow-md transition-all cursor-pointer w-full"
                        style={{
                            borderLeft: `4px solid ${columnStyle?.color || "#3f3f46"}`,
                            backgroundColor: "#27272a",
                            color: "#d9d9d9",
                        }}
                        styles={{
                            body: {
                                padding: "12px",
                                backgroundColor: "#27272a",
                            },
                        }}
                    >
                        <div className="space-y-2">
                            <div className="flex items-center justify-between">
                                <Text strong className="text-white text-sm">
                                    {todo.orderCode}
                                </Text>
                                {todo.type === "warranty_claim" && (
                                    <Tag color="purple" className="text-xs">
                                        BH
                                    </Tag>
                                )}
                            </div>
                            <div>
                                <Text className="text-xs text-gray-400">Khách hàng:</Text>
                                <Text className="text-xs text-white ml-1">
                                    {todo.customerName}
                                </Text>
                            </div>
                            <div>
                                <Text className="text-xs text-gray-400">Sản phẩm:</Text>
                                <Text className="text-xs text-white ml-1 block truncate">
                                    {todo.productName}
                                </Text>
                            </div>
                            <div className="flex items-center justify-between">
                                <div>
                                    <Text className="text-xs text-gray-400">SL:</Text>
                                    <Text className="text-xs text-white ml-1">
                                        {todo.quantity}
                                    </Text>
                                </div>
                                <Tag color="processing" className="text-xs">
                                    {todo.progressText}
                                </Tag>
                            </div>
                            {todo.deliveryDate && (
                                <div>
                                    <Text className="text-xs text-gray-400">
                                        Hẹn: {dayjs(todo.deliveryDate).format("DD/MM/YYYY")}
                                    </Text>
                                </div>
                            )}
                        </div>
                    </Card>
                </div>
            )}
        </Draggable>
    );
};

export default function TodoKanbanBoard() {
    const router = useRouter();
    const { message } = App.useApp();
    const { data: ordersData, isLoading: ordersLoading } =
        useRealtimeList<OrderWithId>("xoxo/orders");
    const { data: warrantyClaimsData, isLoading: warrantyClaimsLoading } =
        useRealtimeList<WarrantyClaim>("xoxo/warranty_claims");
    const { query, applyFilter } = useFilter();

    // Process data to TodoRow format
    const todos: TodoRow[] = useMemo(() => {
        const list: TodoRow[] = [];

        // Process orders
        if (ordersData && ordersData.length > 0) {
            ordersData.forEach((order) => {
                if (!order.products) return;
                Object.entries(order.products).forEach(([productCode, product]) => {
                    const workflows = product.workflows || {};
                    const total = Object.keys(workflows).length;
                    const completed = Object.values(workflows).filter(
                        (wf) => wf.isDone,
                    ).length;
                    const progressText = total ? `${completed}/${total}` : "0/0";

                    list.push({
                        key: `order_${order.code}_${productCode}`,
                        orderCode: order.code,
                        productCode,
                        productName: product.name || "",
                        customerName: order.customerName || "",
                        quantity: product.quantity,
                        status: order.status || OrderStatus.PENDING,
                        progressText,
                        deliveryDate: order.deliveryDate || 0,
                        type: "order",
                    });
                });
            });
        }

        // Process warranty claims
        if (warrantyClaimsData && warrantyClaimsData.length > 0) {
            warrantyClaimsData.forEach((claimItem) => {
                const claim: WarrantyClaim =
                    (claimItem as any).data || (claimItem as WarrantyClaim);
                if (!claim.products) return;
                Object.entries(claim.products).forEach(
                    ([productCode, product]: [string, any]) => {
                        const workflows = product.workflows || {};
                        const total = Object.keys(workflows).length;
                        const completed = Object.values(workflows).filter(
                            (wf: any) => wf.isDone,
                        ).length;
                        const progressText = total ? `${completed}/${total}` : "0/0";

                        const statusMap: Record<WarrantyClaimStatus, string> = {
                            [WarrantyClaimStatus.PENDING]: OrderStatus.PENDING,
                            [WarrantyClaimStatus.CONFIRMED]: OrderStatus.CONFIRMED,
                            [WarrantyClaimStatus.IN_PROGRESS]: OrderStatus.IN_PROGRESS,
                            [WarrantyClaimStatus.ON_HOLD]: OrderStatus.ON_HOLD,
                            [WarrantyClaimStatus.COMPLETED]: OrderStatus.COMPLETED,
                            [WarrantyClaimStatus.CANCELLED]: OrderStatus.CANCELLED,
                        };

                        const claimStatus = claim.status as WarrantyClaimStatus;

                        list.push({
                            key: `warranty_${claim.code}_${productCode}`,
                            orderCode: claim.code,
                            productCode,
                            productName: product.name || "",
                            customerName: claim.customerName || "",
                            quantity: product.quantity,
                            status: statusMap[claimStatus] || OrderStatus.PENDING,
                            progressText,
                            deliveryDate: claim.deliveryDate || 0,
                            type: "warranty_claim",
                            originalOrderCode: claim.originalOrderCode,
                        });
                    },
                );
            });
        }

        return list;
    }, [ordersData, warrantyClaimsData]);

    // Filter data
    const filteredTodos = useMemo(() => {
        return applyFilter(todos);
    }, [todos, query]);

    // Get todos for each column
    const getTodosForColumn = (status: string) => {
        return filteredTodos.filter((todo) => todo.status === status);
    };

    // Handle drag end
    const onDragEnd = useCallback(
        async (result: DropResult) => {
            const { destination, source, draggableId } = result;

            if (
                !destination ||
                (destination.droppableId === source.droppableId &&
                    destination.index === source.index)
            ) {
                return;
            }

            const newStatus = destination.droppableId as OrderStatus;
            const todo = filteredTodos.find((t) => t.key === draggableId);

            if (!todo) {
                message.error("Không tìm thấy công việc!");
                return;
            }

            try {
                const database = getDatabase();
                const path =
                    todo.type === "warranty_claim"
                        ? `xoxo/warranty_claims/${todo.orderCode}`
                        : `xoxo/orders/${todo.orderCode}`;
                const itemRef = ref(database, path);

                // Map order status to warranty claim status if needed
                if (todo.type === "warranty_claim") {
                    const statusMap: Record<OrderStatus, WarrantyClaimStatus> = {
                        [OrderStatus.PENDING]: WarrantyClaimStatus.PENDING,
                        [OrderStatus.CONFIRMED]: WarrantyClaimStatus.CONFIRMED,
                        [OrderStatus.IN_PROGRESS]: WarrantyClaimStatus.IN_PROGRESS,
                        [OrderStatus.ON_HOLD]: WarrantyClaimStatus.ON_HOLD,
                        [OrderStatus.COMPLETED]: WarrantyClaimStatus.COMPLETED,
                        [OrderStatus.CANCELLED]: WarrantyClaimStatus.CANCELLED,
                        [OrderStatus.REFUND]: WarrantyClaimStatus.CANCELLED,
                    };
                    await update(itemRef, {
                        status: statusMap[newStatus],
                        updatedAt: new Date().getTime(),
                    });
                } else {
                    await update(itemRef, {
                        status: newStatus,
                        updatedAt: new Date().getTime(),
                    });
                }

                message.success("Cập nhật trạng thái thành công!");
            } catch (error) {
                console.error("Error updating status:", error);
                message.error("Có lỗi xảy ra khi cập nhật trạng thái!");
            }
        },
        [filteredTodos, message],
    );

    const handleViewTodo = (todo: TodoRow) => {
        if (todo.type === "warranty_claim") {
            router.push(
                `/technician/todo/warranty/${todo.orderCode}/${todo.productCode}`,
            );
        } else {
            router.push(`/technician/todo/${todo.orderCode}/${todo.productCode}`);
        }
    };

    return (
        <WrapperContent
            isEmpty={
                filteredTodos.length === 0 &&
                !ordersLoading &&
                !warrantyClaimsLoading
            }
            isLoading={ordersLoading || warrantyClaimsLoading}
            header={{
                searchInput: {
                    placeholder: "Tìm kiếm theo mã đơn, khách hàng, sản phẩm...",
                    filterKeys: [
                        "orderCode",
                        "customerName",
                        "productName",
                        "productCode",
                    ],
                },
            }}
        >
            <DragDropContext onDragEnd={onDragEnd}>
                <div
                    className="mt-4"
                    style={{
                        display: "flex",
                        overflowX: "auto",
                        gap: "16px",
                        paddingBottom: "16px",
                    }}
                >
                    {kanbanColumns.map((column) => {
                        const columnTodos = getTodosForColumn(column.key);
                        return (
                            <div
                                key={column.key}
                                style={{
                                    minWidth: "280px",
                                    width: "280px",
                                    flexShrink: 0,
                                }}
                            >
                                <Card
                                    style={{
                                        backgroundColor: column.bgColor,
                                        border: `1px solid ${column.color}`,
                                        height: "100%",
                                    }}
                                    bodyStyle={{
                                        padding: "12px",
                                        height: "100%",
                                        display: "flex",
                                        flexDirection: "column",
                                    }}
                                >
                                    <div className="mb-3">
                                        <div className="flex items-center justify-between mb-2">
                                            <Title
                                                level={5}
                                                style={{
                                                    color: column.color,
                                                    margin: 0,
                                                }}
                                            >
                                                {column.title}
                                            </Title>
                                            <Badge
                                                count={columnTodos.length}
                                                style={{
                                                    backgroundColor: column.color,
                                                }}
                                            />
                                        </div>
                                    </div>
                                    <Droppable droppableId={column.key}>
                                        {(provided, snapshot) => (
                                            <div
                                                ref={provided.innerRef}
                                                {...provided.droppableProps}
                                                style={{
                                                    flex: 1,
                                                    minHeight: "200px",
                                                    backgroundColor: snapshot.isDraggingOver
                                                        ? `${column.bgColor}80`
                                                        : "transparent",
                                                    borderRadius: "4px",
                                                    padding: "8px",
                                                    transition: "background-color 0.2s",
                                                }}
                                            >
                                                {columnTodos.length === 0 ? (
                                                    <Empty
                                                        description={
                                                            <Text
                                                                type="secondary"
                                                                className="text-xs"
                                                            >
                                                                Không có công việc
                                                            </Text>
                                                        }
                                                        image={Empty.PRESENTED_IMAGE_SIMPLE}
                                                        style={{
                                                            padding: "20px 0",
                                                        }}
                                                    />
                                                ) : (
                                                    columnTodos.map((todo, index) => (
                                                        <TodoCard
                                                            key={todo.key}
                                                            todo={todo}
                                                            index={index}
                                                            onView={handleViewTodo}
                                                        />
                                                    ))
                                                )}
                                                {provided.placeholder}
                                            </div>
                                        )}
                                    </Droppable>
                                </Card>
                            </div>
                        );
                    })}
                </div>
            </DragDropContext>
        </WrapperContent>
    );
}


"use client";

import React from "react";
import WrapperContent from "@/components/WrapperContent";
import { useRealtimeDoc, useRealtimeValue, useRealtimeList } from "@/firebase/hooks/useRealtime";
import { useFirebaseApp, useUser } from "@/firebase/provider";
import { ProcessFlowService } from "@/services/processFlowService";
import { IMembers } from "@/types/members";
import {
    FirebaseDepartments,
    FirebaseOrderData,
    FirebaseWorkflowData,
} from "@/types/order";
import type { ProductProcessInstance } from "@/types/processInstance";
import { type WarrantyClaim } from "@/types/warrantyClaim";
import {
    App,
    Button,
    Card,
    Empty,
    Progress,
    Space,
    Typography,
    Modal,
    Descriptions,
    Tag,
    Form,
    Input,
    InputNumber,
    Select,
    DatePicker,
} from "antd";
import { CheckCircleOutlined, ClockCircleOutlined, UserOutlined, DownOutlined, UpOutlined, ShoppingCartOutlined, PlusOutlined, ShoppingOutlined } from "@ant-design/icons";
import dayjs from "dayjs";
import "dayjs/locale/vi";
import { getDatabase, ref, update, set } from "firebase/database";
import { Material, MaterialOrder } from "@/types/inventory";
import { InventoryService } from "@/services/inventoryService";
import { genCode } from "@/utils/genCode";
import { useParams, useRouter } from "next/navigation";
import { useMemo } from "react";

const { Text, Title } = Typography;

// Extended interface for workflow with checklist
interface WorkflowWithChecklist extends FirebaseWorkflowData {
    checklist?: ChecklistTask[];
}

interface ChecklistTask {
    id: string;
    task_name: string;
    task_order: number;
    checked: boolean;
    checked_by?: string;
    checkedByName?: string;
    checked_at?: number;
    notes?: string;
    description?: string;
    assignedToName?: string;
    deadline?: number;
}

const ProductWorkflowDetailsPage = () => {
    const params = useParams();
    const router = useRouter();
    const firebaseApp = useFirebaseApp();
    const { user } = useUser();
    const { message: antdMessage } = App.useApp();

    const [selectedTask, setSelectedTask] = React.useState<ChecklistTask | null>(null);
    const [isTaskDetailOpen, setIsTaskDetailOpen] = React.useState(false);
    const [selectedWorkflowIndex, setSelectedWorkflowIndex] = React.useState<number | null>(null);
    const [isWorkflowDetailOpen, setIsWorkflowDetailOpen] = React.useState(false);
    const [expandedWorkflowIds, setExpandedWorkflowIds] = React.useState<Set<string>>(new Set());
    const [purchaseRequestModalVisible, setPurchaseRequestModalVisible] = React.useState(false);
    const [materialRequestForm] = Form.useForm();
    const [materialOrderModalVisible, setMaterialOrderModalVisible] = React.useState(false);
    const [materialOrderForm] = Form.useForm();
    const { data: materialsData } = useRealtimeList<Material>("xoxo/inventory/materials");

    // Parse codes from params
    const codes = useMemo(() => {
        const codesParam = params.codes;
        if (Array.isArray(codesParam)) {
            return codesParam;
        }
        return [codesParam];
    }, [params.codes]);

    // Check if this is a warranty claim (path contains "warranty")
    const isWarrantyClaim = codes[0] === "warranty";
    const orderCode = isWarrantyClaim ? codes[1] : codes[0];
    const productCode = isWarrantyClaim ? codes[2] : codes[1];

    // Fetch order or warranty claim data
    const { data: order, isLoading: orderLoading } =
        useRealtimeDoc<FirebaseOrderData>(
            orderCode && !isWarrantyClaim ? `xoxo/orders/${orderCode}` : null,
        );

    const { data: warrantyClaim, isLoading: warrantyClaimLoading } =
        useRealtimeDoc<WarrantyClaim>(
            orderCode && isWarrantyClaim
                ? `xoxo/warranty_claims/${orderCode}`
                : null,
        );

    // Convert warranty claim to order-like format for compatibility
    const orderData = useMemo(() => {
        if (isWarrantyClaim && warrantyClaim) {
            const claim = warrantyClaim;
            return {
                code: claim.code,
                customerName: claim.customerName,
                phone: claim.phone,
                email: claim.email,
                address: claim.address,
                customerSource: claim.customerSource,
                customerCode: claim.customerCode,
                orderDate: claim.orderDate,
                deliveryDate: claim.deliveryDate,
                createdAt: claim.createdAt,
                updatedAt: claim.updatedAt,
                createdBy: claim.createdBy,
                createdByName: claim.createdByName,
                consultantId: claim.consultantId,
                consultantName: claim.consultantName,
                notes: claim.notes,
                issues: claim.issues,
                products: claim.products || {},
                status: claim.status,
                totalAmount: claim.totalAmount || 0,
            } as any as FirebaseOrderData;
        }
        return order;
    }, [isWarrantyClaim, warrantyClaim, order]);

    // Fetch members data
    const { data: membersData } = useRealtimeValue<{
        [key: string]: IMembers;
    }>("xoxo/members");

    // Fetch departments data
    const { data: departmentsData } =
        useRealtimeValue<FirebaseDepartments>("xoxo/departments");

    const membersMap = useMemo(() => {
        if (!membersData || !Object.keys(membersData).length)
            return {} as { [key: string]: IMembers };
        return membersData;
    }, [membersData]);

    const departments = useMemo(() => {
        if (!departmentsData || !Object.keys(departmentsData).length)
            return {} as FirebaseDepartments;
        return departmentsData;
    }, [departmentsData]);

    // Get product data
    const product = useMemo(() => {
        if (!orderData?.products || !productCode) return null;
        return orderData.products[productCode];
    }, [orderData?.products, productCode]);

    // Get process instances or legacy workflows
    const processInstances = useMemo(() => {
        if (!product) return [];

        // Check if product uses new process instances structure
        if (product.processInstances) {
            return Object.entries(product.processInstances).map(
                ([instanceId, instance]) => ({
                    ...instance,
                    instanceId,
                }),
            );
        }

        // Fallback to legacy workflows structure
        if (product.workflows) {
            return Object.entries(product.workflows).map(
                ([workflowId, workflow]) => {
                    let checklist: ChecklistTask[] = [];
                    if ((workflow as any).checklist) {
                        checklist = (workflow as any).checklist;
                    } else {
                        checklist = workflow.workflowName.map(
                            (name, index) => ({
                                id: `task_${workflowId}_${index}`,
                                task_name: name,
                                task_order: index + 1,
                                checked: false,
                            }),
                        );
                    }

                    return {
                        ...workflow,
                        id: workflowId,
                        checklist,
                        isLegacy: true,
                    } as WorkflowWithChecklist & {
                        id: string;
                        isLegacy: boolean;
                    };
                },
            );
        }

        return [];
    }, [product]);

    // Check if using new process instances
    const usingNewStructure = useMemo(() => {
        return product?.processInstances !== undefined;
    }, [product]);

    // Handle task toggle - supports both new and legacy structures
    const handleTaskToggle = async (
        processInstanceId: string,
        stageId: string,
        taskId: string,
        checked: boolean,
        isLegacy = false,
        legacyWorkflowId?: string,
    ) => {
        if (!orderCode || !productCode || !firebaseApp) return;

        try {
            const checkedByName = user?.uid
                ? user.displayName || user.email || "Không rõ"
                : undefined;

            if (isLegacy && legacyWorkflowId) {
                // Legacy workflow handling
                const db = getDatabase(firebaseApp);
                const workflow = processInstances.find(
                    (w: any) => w.id === legacyWorkflowId && w.isLegacy,
                ) as any;
                if (!workflow) return;

                const workflowIndex = processInstances.findIndex(
                    (w: any) => w.id === legacyWorkflowId,
                );
                if (workflowIndex > 0) {
                    const previousWorkflow = processInstances[
                        workflowIndex - 1
                    ] as any;
                    if (
                        !previousWorkflow.isDone &&
                        !previousWorkflow.isLegacy
                    ) {
                        antdMessage.warning(
                            "Vui lòng hoàn thành quy trình trước đó trước khi thực hiện quy trình này",
                        );
                        return;
                    }
                }

                const updatedChecklist = workflow.checklist?.map(
                    (task: ChecklistTask) =>
                        task.id === taskId
                            ? {
                                ...task,
                                checked,
                                checked_at: checked ? Date.now() : undefined,
                                checked_by: checked ? user?.uid : undefined,
                                checkedByName: checked
                                    ? checkedByName
                                    : undefined,
                            }
                            : task,
                );

                const allTasksCompleted =
                    updatedChecklist?.every(
                        (task: ChecklistTask) => task.checked,
                    ) ?? false;

                const basePath = isWarrantyClaim
                    ? `xoxo/warranty_claims/${orderCode}/products/${productCode}/workflows/${legacyWorkflowId}`
                    : `xoxo/orders/${orderCode}/products/${productCode}/workflows/${legacyWorkflowId}`;
                const workflowRef = ref(db, basePath);

                await update(workflowRef, {
                    checklist: updatedChecklist,
                    isDone: allTasksCompleted,
                    updatedAt: Date.now(),
                });

                antdMessage.success(
                    allTasksCompleted
                        ? "Tất cả công việc đã hoàn thành!"
                        : "Đã cập nhật công việc",
                );
            } else {
                // New process instance handling
                await ProcessFlowService.checkTask(
                    orderCode,
                    productCode,
                    processInstanceId,
                    stageId,
                    taskId,
                    checked,
                    user?.uid,
                    checkedByName,
                    isWarrantyClaim ? "warranty_claim" : "order",
                );

                antdMessage.success(
                    checked ? "Đã đánh dấu hoàn thành!" : "Đã bỏ đánh dấu",
                );
            }
        } catch (error) {
            console.error("Error updating task:", error);
            antdMessage.error(
                "Không thể cập nhật công việc. Vui lòng thử lại.",
            );
        }
    };

    // Calculate progress
    const progress = useMemo(() => {
        if (processInstances.length === 0) return 0;

        if (usingNewStructure) {
            const instances = processInstances as Array<
                ProductProcessInstance & { instanceId: string }
            >;
            const completed = instances.filter(
                (inst) => inst.status === "completed",
            ).length;
            return Math.round((completed / instances.length) * 100);
        } else {
            const workflows = processInstances as Array<
                WorkflowWithChecklist & { id: string; isLegacy: boolean }
            >;
            const completed = workflows.filter((w) => w.isDone).length;
            return Math.round((completed / workflows.length) * 100);
        }
    }, [processInstances, usingNewStructure]);

    // Prepare workflows for Kanban view
    const kanbanWorkflows = useMemo(() => {
        return processInstances.map((instance: any, index: number) => ({
            id: instance.id || instance.instanceId,
            workflowCode: instance.workflowCode || [],
            workflowName: instance.workflowName || [],
            members: instance.members || [],
            isDone: instance.isDone,
            updatedAt: instance.updatedAt,
            checklist: instance.checklist,
            deadline: instance.deadline,
            originalIndex: index,
        }));
    }, [processInstances]);

    const handleKanbanTaskToggle = async (
        workflowIndex: number,
        taskId: string,
        checked: boolean,
    ) => {
        const instance = processInstances[workflowIndex] as any;
        if (!instance) return;

        // Tìm task tiếp theo trước khi toggle (dựa trên task_order)
        const sortedTasks = [...(instance.checklist || [])].sort(
            (a: any, b: any) => (a.task_order || 0) - (b.task_order || 0)
        );
        const currentTaskIndex = sortedTasks.findIndex((t: any) => t.id === taskId);
        const nextTask = sortedTasks
            .slice(currentTaskIndex + 1)
            .find((t: any) => !t.checked);

        if (instance.isLegacy) {
            await handleTaskToggle(
                instance.id,
                "",
                taskId,
                checked,
                true,
                instance.id,
            );
        } else {
            await handleTaskToggle(
                instance.instanceId,
                instance.currentStageId || "",
                taskId,
                checked,
                false
            );
        }

        // Nếu đang hoàn thành task (checked = true) và modal đang mở
        if (checked && isWorkflowDetailOpen && selectedWorkflowIndex === workflowIndex) {
            // Đợi một chút để state update
            setTimeout(() => {
                if (nextTask) {
                    // Tìm và scroll vào task tiếp theo
                    const nextTaskElement = document.querySelector(
                        `[data-task-id="${nextTask.id}"]`
                    ) as HTMLElement;
                    if (nextTaskElement) {
                        nextTaskElement.scrollIntoView({
                            behavior: 'smooth',
                            block: 'center'
                        });
                        // Highlight task tiếp theo
                        nextTaskElement.style.transition = 'all 0.3s';
                        nextTaskElement.style.backgroundColor = '#e6f7ff';
                        setTimeout(() => {
                            nextTaskElement.style.backgroundColor = '';
                        }, 1000);
                    }
                } else {
                    // Không còn task nào, chuyển sang workflow tiếp theo
                    const nextWorkflowIndex = workflowIndex + 1;
                    if (nextWorkflowIndex < processInstances.length) {
                        const nextWorkflow = processInstances[nextWorkflowIndex] as any;
                        const nextWorkflowName = Array.isArray(nextWorkflow.workflowName) 
                            ? nextWorkflow.workflowName.join(", ")
                            : nextWorkflow.workflowName || "Công đoạn tiếp theo";
                        setSelectedWorkflowIndex(nextWorkflowIndex);
                        antdMessage.info(`Đã hoàn thành tất cả công việc. Chuyển sang: ${nextWorkflowName}`);
                        // Scroll về đầu modal
                        setTimeout(() => {
                            const modalContent = document.querySelector('.ant-modal-body');
                            if (modalContent) {
                                modalContent.scrollTop = 0;
                            }
                        }, 100);
                    } else {
                        antdMessage.success('Đã hoàn thành tất cả công việc!');
                    }
                }
            }, 300);
        }
    };

    const handleKanbanTaskClick = (
        workflowIndex: number,
        taskId: string,
    ) => {
        const instance = processInstances[workflowIndex] as any;
        if (!instance || !instance.checklist) return;

        const task = instance.checklist.find((t: any) => t.id === taskId);
        if (task) {
            setSelectedTask(task);
            setIsTaskDetailOpen(true);
        }
    };

    const handleWorkflowClick = (index: number) => {
        setSelectedWorkflowIndex(index);
        setIsWorkflowDetailOpen(true);
    };

    if (orderLoading || warrantyClaimLoading) {
        return (
            <WrapperContent
                isEmpty={false}
                isLoading={true}
                title="Đang tải..."
                header={{}}
            >
                <div></div>
            </WrapperContent>
        );
    }

    if (!orderData || !product) {
        return (
            <WrapperContent
                isEmpty={true}
                isLoading={false}
                title="Không tìm thấy sản phẩm"
                header={{}}
            >
                <Empty description="Không tìm thấy sản phẩm" />
            </WrapperContent>
        );
    }

    return (
        <WrapperContent
            isEmpty={false}
            isLoading={false}
            title={`Quy trình: ${product.name}${isWarrantyClaim ? " (Bảo hành)" : ""
                }`}
            header={{
                buttonBackTo: `/technician/todo`,
            }}
        >
            <div className="space-y-6 flex flex-col gap-4">
                {/* Product Info Card */}
                <Card>
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                        <div>
                            <Title level={4} className="mb-2">
                                {product.name}
                            </Title>
                            <Space size="middle">
                                <Text type="secondary">
                                    Số lượng:{" "}
                                    <Text strong>{product.quantity}</Text>
                                </Text>
                                <Text type="secondary">
                                    Giá:{" "}
                                    <Text strong>
                                        {product.price?.toLocaleString("vi-VN")}{" "}
                                        VNĐ
                                    </Text>
                                </Text>
                            </Space>
                        </div>
                        <div className="flex items-center gap-4">
                            <Button
                                type="primary"
                                icon={<ShoppingOutlined />}
                                onClick={() => setMaterialOrderModalVisible(true)}
                                size="large"
                            >
                                Order nguyên liệu
                            </Button>
                            <div className="text-right">
                                <Text
                                    type="secondary"
                                    className="block text-sm"
                                >
                                    Tiến độ hoàn thành
                                </Text>
                                <Text strong className="text-lg">
                                    {progress}%
                                </Text>
                            </div>
                            <Progress
                                type="circle"
                                size={60}
                                percent={progress}
                                format={(percent) => `${percent}%`}
                            />
                        </div>
                    </div>
                </Card>

                {/* Process Details - Now Kanban */}
                {processInstances.length > 0 ? (
                    <Card>
                        <Title level={5} className="mb-4">
                            Chi tiết quy trình
                        </Title>
                        <WorkflowStageKanban
                            workflows={kanbanWorkflows}
                            membersMap={membersMap}
                            onToggleTask={handleKanbanTaskToggle}
                            onTaskClick={handleKanbanTaskClick}
                            onWorkflowClick={handleWorkflowClick}
                        />
                    </Card>
                ) : (
                    <Card>
                        <Empty description="Chưa có quy trình nào" />
                    </Card>
                )}

                <Modal
                    title="Chi tiết công việc"
                    open={isTaskDetailOpen}
                    onCancel={() => setIsTaskDetailOpen(false)}
                    footer={null}
                    centered
                    width={600}
                >
                    {selectedTask ? (
                        <div className="space-y-4">
                            <Descriptions column={1} bordered size="small">
                                <Descriptions.Item label="Tên công việc">
                                    <Text strong>{selectedTask.task_name || "Không có tên"}</Text>
                                </Descriptions.Item>

                                <Descriptions.Item label="Mô tả">
                                    <div className="whitespace-pre-wrap">
                                        {selectedTask.description || selectedTask.notes || "Không có mô tả"}
                                    </div>
                                </Descriptions.Item>

                                <Descriptions.Item label="Trạng thái">
                                    <Tag color={selectedTask.checked ? "success" : "processing"}>
                                        {selectedTask.checked ? "Đã hoàn thành" : "Chưa hoàn thành"}
                                    </Tag>
                                </Descriptions.Item>

                                <Descriptions.Item label="Hạn chót">
                                    {selectedTask.deadline ? (
                                        <Text type={dayjs(selectedTask.deadline).isBefore(dayjs()) && !selectedTask.checked ? "danger" : undefined}>
                                            {dayjs(selectedTask.deadline).format("HH:mm DD/MM/YYYY")}
                                        </Text>
                                    ) : (
                                        <Text type="secondary">Không có hạn chót</Text>
                                    )}
                                </Descriptions.Item>

                                <Descriptions.Item label="Người thực hiện">
                                    {selectedTask.assignedToName || <Text type="secondary">Chưa phân công</Text>}
                                </Descriptions.Item>

                                {selectedTask.checked && (
                                    <>
                                        <Descriptions.Item label="Hoàn thành bởi">
                                            {selectedTask.checkedByName || "Không rõ"}
                                        </Descriptions.Item>
                                        <Descriptions.Item label="Thời gian hoàn thành">
                                            {selectedTask.checked_at ? dayjs(selectedTask.checked_at).format("HH:mm DD/MM/YYYY") : "Không rõ"}
                                        </Descriptions.Item>
                                    </>
                                )}
                            </Descriptions>
                        </div>
                    ) : (
                        <Empty description="Không tìm thấy thông tin công việc" />
                    )}
                </Modal>

                {/* Full Workflow Detail Modal */}
                <Modal
                    title={
                        <div>
                            <Text strong>
                                {selectedWorkflowIndex !== null ? kanbanWorkflows[selectedWorkflowIndex]?.workflowName?.join(", ") : "Chi tiết quy trình"}
                            </Text>
                            {selectedWorkflowIndex !== null && kanbanWorkflows[selectedWorkflowIndex] && (
                                <div className="mt-2">
                                    <Space>
                                        <Tag color={kanbanWorkflows[selectedWorkflowIndex].isDone ? "success" : "blue"}>
                                            {kanbanWorkflows[selectedWorkflowIndex].isDone ? "Đã hoàn thành" : "Đang thực hiện"}
                                        </Tag>
                                        <Text type="secondary" className="text-sm">
                                            {kanbanWorkflows[selectedWorkflowIndex].checklist?.filter((t: any) => t.checked).length}/
                                            {kanbanWorkflows[selectedWorkflowIndex].checklist?.length} công việc
                                        </Text>
                                        {kanbanWorkflows[selectedWorkflowIndex].deadline && (
                                            <Tag color={dayjs(kanbanWorkflows[selectedWorkflowIndex].deadline).isBefore(dayjs()) && !kanbanWorkflows[selectedWorkflowIndex].isDone ? "error" : "warning"}>
                                                Hạn: {dayjs(kanbanWorkflows[selectedWorkflowIndex].deadline).format("DD/MM/YYYY HH:mm")}
                                            </Tag>
                                        )}
                                    </Space>
                                </div>
                            )}
                        </div>
                    }
                    open={isWorkflowDetailOpen}
                    onCancel={() => setIsWorkflowDetailOpen(false)}
                    footer={
                        <Space>
                            <Button onClick={() => setIsWorkflowDetailOpen(false)}>
                                Đóng
                            </Button>
                            <Button
                                type="primary"
                                icon={<ShoppingCartOutlined />}
                                onClick={() => {
                                    setPurchaseRequestModalVisible(true);
                                }}
                            >
                                Đề xuất mua
                            </Button>
                        </Space>
                    }
                    width={900}
                    centered
                >
                    {selectedWorkflowIndex !== null && kanbanWorkflows[selectedWorkflowIndex] && (
                        <div>
                            <div className="max-h-[70vh] overflow-y-auto pr-2">
                                {(!kanbanWorkflows[selectedWorkflowIndex].checklist || kanbanWorkflows[selectedWorkflowIndex].checklist.length === 0) ? (
                                    <Empty description="Không có công việc nào" />
                                ) : (
                                    <div className="space-y-4">
                                        {kanbanWorkflows[selectedWorkflowIndex].checklist
                                            ?.sort((a: any, b: any) => (a.task_order || 0) - (b.task_order || 0))
                                            .map((task: any, index: number) => (
                                            <Card 
                                                key={task.id} 
                                                data-task-id={task.id}
                                                size="small" 
                                                className={`hover:shadow-md transition-shadow ${task.checked ? 'bg-gray-50' : 'bg-white'}`}
                                            >
                                                <div className="flex items-start gap-4">
                                                    <div className="flex items-center gap-3 flex-1">
                                                        <div className="mt-1">
                                                            <input
                                                                type="checkbox"
                                                                className="w-5 h-5 cursor-pointer accent-blue-600"
                                                                checked={task.checked}
                                                                disabled={kanbanWorkflows[selectedWorkflowIndex].isDone}
                                                                onChange={(e) => handleKanbanTaskToggle(selectedWorkflowIndex, task.id, e.target.checked)}
                                                            />
                                                        </div>
                                                        <div className="flex-1">
                                                            <div className="flex items-start justify-between gap-4 mb-2">
                                                                <div className="flex-1">
                                                                    <div className="flex items-center gap-2 mb-1">
                                                                        <Text 
                                                                            strong 
                                                                            delete={task.checked} 
                                                                            className={`text-base ${task.checked ? "text-gray-400" : "text-gray-900"}`}
                                                                        >
                                                                            {index + 1}. {task.task_name}
                                                                        </Text>
                                                                        {task.checked && (
                                                                            <Tag color="success" icon={<CheckCircleOutlined />}>
                                                                                Đã hoàn thành
                                                                            </Tag>
                                                                        )}
                                                                    </div>
                                                                    
                                                                    {/* Ghi chú/Mô tả */}
                                                                    {(task.description || task.notes) && (
                                                                        <div className="bg-blue-50 border border-blue-200 rounded p-3 mt-2 mb-2">
                                                                            <Text type="secondary" className="text-xs block mb-1 font-medium">
                                                                                Ghi chú:
                                                                            </Text>
                                                                            <Text className="text-sm whitespace-pre-wrap">
                                                                                {task.description || task.notes}
                                                                            </Text>
                                                                        </div>
                                                                    )}

                                                                    {/* Thông tin bổ sung */}
                                                                    <div className="flex flex-wrap gap-2 mt-2">
                                                                        {task.deadline && (
                                                                            <Tag 
                                                                                color={dayjs(task.deadline).isBefore(dayjs()) && !task.checked ? "error" : "warning"}
                                                                                icon={<ClockCircleOutlined />}
                                                                            >
                                                                                Hạn: {dayjs(task.deadline).format("DD/MM/YYYY HH:mm")}
                                                                            </Tag>
                                                                        )}
                                                                        {task.assignedToName && (
                                                                            <Tag color="cyan" icon={<UserOutlined />}>
                                                                                Giao cho: {task.assignedToName}
                                                                            </Tag>
                                                                        )}
                                                                        {task.checked && task.checkedByName && (
                                                                            <Tag color="green">
                                                                                Hoàn thành bởi: {task.checkedByName}
                                                                            </Tag>
                                                                        )}
                                                                        {task.checked && task.checked_at && (
                                                                            <Tag color="blue">
                                                                                Lúc: {dayjs(task.checked_at).format("DD/MM/YYYY HH:mm")}
                                                                            </Tag>
                                                                        )}
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                    
                                                    {/* Nút hoàn thành */}
                                                    {!task.checked && !kanbanWorkflows[selectedWorkflowIndex].isDone && (
                                                        <div className="flex-shrink-0">
                                                            <Button
                                                                type="primary"
                                                                icon={<CheckCircleOutlined />}
                                                                onClick={() => handleKanbanTaskToggle(selectedWorkflowIndex, task.id, true)}
                                                                className="bg-green-600 hover:bg-green-700"
                                                            >
                                                                Hoàn thành
                                                            </Button>
                                                        </div>
                                                    )}
                                                </div>
                                            </Card>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </Modal>

                {/* Material Request Modal */}
                <Modal
                    title="Đề xuất mua nguyên liệu"
                    open={purchaseRequestModalVisible}
                    onCancel={() => {
                        setPurchaseRequestModalVisible(false);
                        materialRequestForm.resetFields();
                    }}
                    footer={null}
                    width={600}
                >
                    <Form
                        form={materialRequestForm}
                        layout="vertical"
                        onFinish={async (values) => {
                            try {
                                const database = getDatabase(firebaseApp);
                                const now = Date.now();
                                const material = materialsData?.find(m => m.id === values.materialId);
                                
                                if (!material) {
                                    antdMessage.error("Không tìm thấy nguyên liệu!");
                                    return;
                                }

                                // Tạo transaction xuất kho
                                await InventoryService.createTransaction({
                                    materialId: material.id,
                                    materialName: material.name,
                                    type: "export",
                                    quantity: values.quantity,
                                    unit: material.unit,
                                    date: dayjs(values.date || now).format("YYYY-MM-DD"),
                                    reason: "Đề xuất mua nguyên liệu",
                                    note: values.note || "",
                                    createdBy: user?.uid || "",
                                });

                                // Tạo phiếu đề xuất mua
                                const requestId = genCode("PR_");
                                const purchaseRequest = {
                                    id: requestId,
                                    code: requestId,
                                    items: [{
                                        materialId: material.id,
                                        materialName: material.name,
                                        quantity: values.quantity,
                                        unit: material.unit,
                                        note: values.note || "",
                                    }],
                                    totalAmount: 0,
                                    status: "pending",
                                    requestedBy: user?.uid || "",
                                    requestedByName: user?.displayName || "",
                                    requestedAt: now,
                                    relatedTaskId: `${orderCode}_${productCode}`,
                                    relatedOrderCode: orderCode,
                                    createdAt: now,
                                    updatedAt: now,
                                };

                                await set(ref(database, `xoxo/purchase_requests/${requestId}`), purchaseRequest);

                                antdMessage.success("Đã tạo đề xuất mua nguyên liệu và ghi vào lịch sử xuất kho!");
                                setPurchaseRequestModalVisible(false);
                                materialRequestForm.resetFields();
                            } catch (error) {
                                console.error("Error creating material request:", error);
                                antdMessage.error("Không thể tạo đề xuất mua nguyên liệu!");
                            }
                        }}
                        initialValues={{
                            date: dayjs(),
                        }}
                    >
                        <Form.Item
                            name="materialId"
                            label="Nguyên liệu"
                            rules={[{ required: true, message: "Vui lòng chọn nguyên liệu" }]}
                        >
                            <Select placeholder="Chọn nguyên liệu">
                                {materialsData?.map((material) => (
                                    <Select.Option key={material.id} value={material.id}>
                                        {material.name} ({material.stockQuantity} {material.unit})
                                    </Select.Option>
                                ))}
                            </Select>
                        </Form.Item>

                        <Form.Item
                            name="quantity"
                            label="Số lượng"
                            rules={[{ required: true, message: "Vui lòng nhập số lượng" }]}
                        >
                            <InputNumber min={1} style={{ width: "100%" }} placeholder="Nhập số lượng" />
                        </Form.Item>

                        <Form.Item
                            name="date"
                            label="Ngày giờ"
                            rules={[{ required: true, message: "Vui lòng chọn ngày" }]}
                        >
                            <DatePicker
                                showTime
                                format="DD/MM/YYYY HH:mm"
                                style={{ width: "100%" }}
                            />
                        </Form.Item>

                        <Form.Item
                            name="note"
                            label="Ghi chú"
                        >
                            <Input.TextArea rows={4} placeholder="Nhập ghi chú (nếu có)" />
                        </Form.Item>

                        <Descriptions bordered column={1} size="small" className="mb-4">
                            <Descriptions.Item label="Người đề xuất">
                                {user?.displayName || user?.email || "Chưa xác định"}
                            </Descriptions.Item>
                            <Descriptions.Item label="Ngày giờ đề xuất">
                                {dayjs().format("DD/MM/YYYY HH:mm")}
                            </Descriptions.Item>
                        </Descriptions>

                        <Form.Item>
                            <Space>
                                <Button type="primary" htmlType="submit">
                                    Tạo đề xuất
                                </Button>
                                <Button onClick={() => {
                                    setPurchaseRequestModalVisible(false);
                                    materialRequestForm.resetFields();
                                }}>
                                    Hủy
                                </Button>
                            </Space>
                        </Form.Item>
                    </Form>
                </Modal>

                {/* Material Order Modal */}
                <Modal
                    title="Phiếu xin Order nguyên liệu trong kho"
                    open={materialOrderModalVisible}
                    onCancel={() => {
                        setMaterialOrderModalVisible(false);
                        materialOrderForm.resetFields();
                    }}
                    footer={null}
                    width={700}
                    centered
                >
                    <Form
                        form={materialOrderForm}
                        layout="vertical"
                        onFinish={async (values) => {
                            try {
                                const database = getDatabase(firebaseApp);
                                const now = Date.now();
                                const material = materialsData?.find(m => m.id === values.materialId);
                                
                                if (!material) {
                                    antdMessage.error("Không tìm thấy nguyên liệu!");
                                    return;
                                }

                                // Tạo mã phiếu order
                                const orderId = genCode("MO_"); // Material Order
                                
                                // Tạo phiếu order nguyên liệu
                                const materialOrder: MaterialOrder = {
                                    id: orderId,
                                    code: orderId,
                                    materialId: material.id,
                                    materialName: material.name,
                                    quantity: values.quantity,
                                    unit: material.unit,
                                    note: values.note || "",
                                    status: "pending", // Chờ duyệt
                                    requestedBy: user?.uid || "",
                                    requestedByName: user?.displayName || user?.email || "Không rõ",
                                    requestedAt: now,
                                    orderDate: dayjs(values.orderDate || now).valueOf(),
                                    relatedOrderCode: orderCode,
                                    relatedProductCode: productCode,
                                    createdAt: now,
                                    updatedAt: now,
                                    // Lịch sử
                                    history: [{
                                        action: "created",
                                        actionName: "Tạo phiếu",
                                        by: user?.uid || "",
                                        byName: user?.displayName || user?.email || "Không rõ",
                                        at: now,
                                        note: "Tạo phiếu xin order nguyên liệu"
                                    }]
                                };

                                await set(ref(database, `xoxo/material_orders/${orderId}`), materialOrder);

                                antdMessage.success("Đã tạo phiếu xin order nguyên liệu thành công!");
                                setMaterialOrderModalVisible(false);
                                materialOrderForm.resetFields();
                            } catch (error) {
                                console.error("Error creating material order:", error);
                                antdMessage.error("Không thể tạo phiếu xin order nguyên liệu!");
                            }
                        }}
                        initialValues={{
                            orderDate: dayjs(),
                        }}
                    >
                        <Form.Item
                            name="materialId"
                            label="Vật liệu"
                            rules={[{ required: true, message: "Vui lòng chọn vật liệu" }]}
                        >
                            <Select 
                                placeholder="Chọn vật liệu"
                                showSearch
                                filterOption={(input, option) =>
                                    (option?.children as unknown as string)?.toLowerCase().includes(input.toLowerCase())
                                }
                            >
                                {materialsData?.map((material) => (
                                    <Select.Option key={material.id} value={material.id}>
                                        {material.name} ({material.stockQuantity} {material.unit})
                                    </Select.Option>
                                ))}
                            </Select>
                        </Form.Item>

                        <Form.Item
                            name="quantity"
                            label="Số lượng"
                            rules={[
                                { required: true, message: "Vui lòng nhập số lượng" },
                                { type: "number", min: 1, message: "Số lượng phải lớn hơn 0" }
                            ]}
                        >
                            <InputNumber 
                                min={1} 
                                style={{ width: "100%" }} 
                                placeholder="Nhập số lượng"
                            />
                        </Form.Item>

                        <Form.Item
                            name="orderDate"
                            label="Thời gian order"
                            rules={[{ required: true, message: "Vui lòng chọn thời gian order" }]}
                        >
                            <DatePicker
                                showTime
                                format="DD/MM/YYYY HH:mm"
                                style={{ width: "100%" }}
                                placeholder="Chọn thời gian order"
                            />
                        </Form.Item>

                        <Form.Item
                            name="note"
                            label="Ghi chú"
                        >
                            <Input.TextArea 
                                rows={4} 
                                placeholder="Nhập ghi chú (nếu có)"
                            />
                        </Form.Item>

                        <Descriptions bordered column={1} size="small" className="mb-4">
                            <Descriptions.Item label="Người tạo">
                                {user?.displayName || user?.email || "Chưa xác định"}
                            </Descriptions.Item>
                            <Descriptions.Item label="Mã đơn hàng">
                                {orderCode}
                            </Descriptions.Item>
                            <Descriptions.Item label="Sản phẩm">
                                {product?.name}
                            </Descriptions.Item>
                            <Descriptions.Item label="Trạng thái">
                                <Tag color="orange">Chờ duyệt</Tag>
                            </Descriptions.Item>
                        </Descriptions>

                        <Form.Item>
                            <Space>
                                <Button type="primary" htmlType="submit" icon={<ShoppingOutlined />}>
                                    Tạo phiếu order
                                </Button>
                                <Button onClick={() => {
                                    setMaterialOrderModalVisible(false);
                                    materialOrderForm.resetFields();
                                }}>
                                    Hủy
                                </Button>
                            </Space>
                        </Form.Item>
                    </Form>
                </Modal>
            </div>
        </WrapperContent>
    );
};

export default ProductWorkflowDetailsPage;

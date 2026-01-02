"use client";

import CustomerFormModal from "@/components/CustomerFormModal";
import { useFirebaseApp, useUser } from "@/firebase/provider";
import { useRouter } from "next/navigation";
import type {
    Customer,
    FirebaseCustomerGroups,
    Province,
} from "@/types/customer";
import {
    CustomerSource,
    CustomerSourceOptions,
    DiscountType,
    ROLES,
} from "@/types/enum";
import {
    OrderStatus,
    type FirebaseDepartments,
    type FirebaseOrderData,
    type FirebaseProductData,
    type FirebaseStaff,
    type FirebaseWorkflowData,
    type FirebaseWorkflows,
    type FormValues,
    type OrderFormProps,
    type PaymentInfo,
    type ProductCardProps,
    type ProductData,
    type ReturnInfo,
    type Workflow,
    type WorkflowData,
} from "@/types/order";
import { calculateOrderTotals } from "@/utils/calcultateOrderTotals";
import { genCode } from "@/utils/genCode";
import { getBase64 } from "@/utils/getBase64";
import { groupMembersByRole } from "@/utils/membersMapRole";
import {
    CheckOutlined,
    UndoOutlined,
    CloseOutlined,
    DeleteOutlined,
    EditOutlined,
    LoadingOutlined,
    PlusOutlined,
    ReloadOutlined,
    SaveOutlined,
    ShoppingCartOutlined,
    TagOutlined,
    UploadOutlined,
    UserOutlined,
    CheckCircleOutlined,
    BankOutlined,
    DeploymentUnitOutlined,
    TeamOutlined,
    ClockCircleOutlined,
    UnorderedListOutlined,
} from "@ant-design/icons";
import {
    App,
    Button,
    Card,
    Checkbox,
    Col,
    DatePicker,
    Empty,
    Form,
    Input,
    InputNumber,
    InputRef,
    Modal,
    Radio,
    Row,
    Select,
    Space,
    Switch,
    Table,
    Tag,
    Typography,
    Upload,
    notification,
} from "antd";
import dayjs from "dayjs";
import {
    ref as dbRef,
    getDatabase,
    off,
    onValue,
    set,
    update,
} from "firebase/database";
import {
    getDownloadURL,
    getStorage,
    ref as storageRef,
    uploadBytes,
} from "firebase/storage";
import { Wrench } from "lucide-react";
import React, {
    forwardRef,
    useCallback,
    useEffect,
    useImperativeHandle,
    useMemo,
    useRef,
    useState,
} from "react";
import { ProcessTemplateService } from "@/services/processTemplateService";
import { ProcessFlowService } from "@/services/processFlowService";
import type { ProcessTemplate } from "@/types/processTemplate";
import { OperationalWorkflowService, OperationalWorkflow } from "@/services/operationalWorkflowService";
import { InventoryService } from "@/services/inventoryService";
import type { FirebaseServices, Service } from "@/types/service";

const { Title, Text } = Typography;
const { Option } = Select;

interface FirebaseCustomers {
    [key: string]: Customer;
}

const statusOptions = [
    { value: "pending", label: "Chờ xử lý", color: "default" },
    {
        value: "confirmed",
        label: "Xác nhận",
        name: "Đã xác nhận",
        color: "warning",
    },
    {
        value: "in_progress",
        label: "Thực hiện",
        name: "Đang thực hiện",
        color: "processing",
    },
    {
        value: "on_hold",
        label: "Thanh toán",
        name: "Chờ thanh toán",
        color: "warning",
    },
    {
        value: "completed",
        label: "Hoàn thành",
        name: "Đã thanh toán",
        color: "success",
    },
    { value: "cancelled", label: "Đã hủy", color: "error" },
];

const statusSequence = [
    OrderStatus.PENDING,
    OrderStatus.CONFIRMED,
    OrderStatus.IN_PROGRESS,
    OrderStatus.ON_HOLD,
    OrderStatus.COMPLETED,
];

// Get available status options based on current status (prevent reverting to previous statuses)
const getAvailableStatusOptions = (currentStatus: OrderStatus) => {
    return [
        {
            value: OrderStatus.PENDING,
            label: "Chờ xử lý",
            name: "Chờ xử lý",
            color: "default",
            disabled: currentStatus !== OrderStatus.PENDING,
        },
        {
            value: OrderStatus.CONFIRMED,
            label: "Đã xác nhận",
            name: "Đã xác nhận",
            color: "warning",
            disabled: statusSequence.indexOf(currentStatus) >= 1,
        },
        {
            value: OrderStatus.IN_PROGRESS,
            label: "Đang thực hiện",
            name: "Đang thực hiện",
            color: "processing",
            disabled: statusSequence.indexOf(currentStatus) >= 2,
        },
        {
            value: OrderStatus.ON_HOLD,
            label: "Tạm giữ",
            name: "Chờ thanh toán",
            color: "warning",
            disabled: statusSequence.indexOf(currentStatus) >= 3,
        },
        {
            value: OrderStatus.COMPLETED,
            label: "Hoàn thành",
            name: "Đã thanh toán",
            color: "success",
            disabled: statusSequence.indexOf(currentStatus) >= 4,
        },
        {
            value: OrderStatus.CANCELLED,
            label: "Đã hủy",
            color: "error",
            disabled: false, // Cancelled is always available
        },
    ];
};

// StatusStepper Component
const StatusStepper = ({
    form,
    products,
    message,
    modal,
}: {
    form: any;
    products: ProductData[];
    message: any;
    modal: any;
}) => {
    const currentStatus = Form.useWatch("status", form) || OrderStatus.PENDING;
    const isDepositPaid = Form.useWatch("isDepositPaid", form);

    const currentIndex = statusSequence.indexOf(currentStatus);
    const nextStatus =
        currentIndex < statusSequence.length - 1
            ? statusSequence[currentIndex + 1]
            : null;

    const handleAdvanceStatus = () => {
        if (!nextStatus) return;

        modal.confirm({
            title: "Xác nhận chuyển trạng thái",
            content: `Bạn có chắc muốn chuyển trạng thái đơn hàng sang "${statusOptions.find((opt) => opt.value === nextStatus)?.label
                }"?`,
            okText: "Xác nhận",
            cancelText: "Hủy",
            onOk: () => {
                // Validation before moving to CONFIRMED
                if (nextStatus === OrderStatus.CONFIRMED) {
                    if (
                        products.some((p: ProductData) => p.images.length === 0)
                    ) {
                        message.error(
                            "Vui lòng tải lên ít nhất một ảnh cho mỗi sản phẩm trước khi xác nhận.",
                        );
                        return;
                    }
                    if (!isDepositPaid) {
                        message.error(
                            "Vui lòng xác nhận khách hàng đã đặt cọc.",
                        );
                        return;
                    }
                }

                // Validation before moving to COMPLETED
                if (
                    nextStatus === OrderStatus.COMPLETED &&
                    currentStatus === OrderStatus.ON_HOLD
                ) {
                    if (
                        products.some(
                            (p: ProductData) =>
                                !p.imagesDone || p.imagesDone.length === 0,
                        )
                    ) {
                        message.error(
                            "Vui lòng tải lên ảnh sau khi hoàn thiện cho tất cả sản phẩm.",
                        );
                        return;
                    }
                }

                // Validation before moving to ON_HOLD
                if (nextStatus === OrderStatus.ON_HOLD) {
                    const allWorkflowsDone = products.every(
                        (product: ProductData) =>
                            Object.values(product.workflows || {}).every(
                                (workflow: any) => workflow.isDone,
                            ),
                    );
                    if (!allWorkflowsDone) {
                        message.error("Đội kỹ thuật chưa làm xong!");
                        return;
                    }
                }

                form.setFieldsValue({ status: nextStatus });
                form.submit();
            },
        });
    };

    const currentStatusInfo =
        statusOptions.find((opt) => opt.value === currentStatus) ||
        statusOptions[0];

    return (
        <div>
            <div className="flex items-center gap-2">
                <Tag
                    color={currentStatusInfo.color}
                    className="text-sm px-2 py-1"
                >
                    {currentStatusInfo.name}
                </Tag>
                {isDepositPaid && (
                    <Tag color="green" className="text-sm px-2 py-1">
                        Đã đặt cọc
                    </Tag>
                )}
            </div>

            <div className="flex items-center gap-2">
                {(currentStatus === OrderStatus.PENDING ||
                    currentStatus === OrderStatus.CONFIRMED) && (
                        <Form.Item
                            name="isDepositPaid"
                            valuePropName="checked"
                            className="mb-0"
                            noStyle
                        >
                            <Switch
                                checkedChildren="Đã cọc"
                                unCheckedChildren="Chưa cọc"
                            />
                        </Form.Item>
                    )}

                {nextStatus && (
                    <Button
                        onClick={handleAdvanceStatus}
                        size="small"
                        type="primary"
                    >
                        {
                            statusOptions.find(
                                (opt) => opt.value === nextStatus,
                            )?.label
                        }
                    </Button>
                )}
            </div>
        </div>
    );
};

// Customer Information Section Component
const CustomerInformationSection = ({
    mode,
    customerType,
    setCustomerType,
    form,
    customers,
    setCustomers,
    customerGroups,
    provinces,
}: {
    mode: string;
    customerType: "new" | "existing";
    setCustomerType: (type: "new" | "existing") => void;
    form: any;
    customers: FirebaseCustomers;
    setCustomers: (customers: FirebaseCustomers) => void;
    customerGroups: FirebaseCustomerGroups;
    provinces: Province[];
}) => {
    const [customerModalVisible, setCustomerModalVisible] = useState(false);
    const { message } = App.useApp();

    const handleCustomerTypeChange = (e: any) => {
        const newType = e.target.value;
        setCustomerType(newType);
        form.resetFields([
            "customerCode",
            "customerName",
            "phone",
            "address",
            "customerSource",
        ]);

        // Nếu chọn "Khách mới", mở modal
        if (newType === "new" && mode === "create") {
            setCustomerModalVisible(true);
        }
    };

    const handleCustomerModalSuccess = () => {
        // Reload customers from Firebase
        const database = getDatabase();
        const customersRef = dbRef(database, "xoxo/customers");
        onValue(customersRef, (snapshot) => {
            const data = snapshot.val() || {};
            setCustomers(data);
            // Tự động chọn khách hàng mới nhất (vừa tạo)
            const customerList = Object.values(data) as Customer[];
            if (customerList.length > 0) {
                const latestCustomer = customerList.sort(
                    (a, b) => (b.createdAt || 0) - (a.createdAt || 0),
                )[0];
                form.setFieldsValue({
                    customerCode: latestCustomer.code,
                    customerName: latestCustomer.name,
                    phone: latestCustomer.phone,
                    address: latestCustomer.address,
                    customerSource: latestCustomer.customerSource,
                });
                setCustomerType("existing");
                message.success(`Đã chọn khách hàng: ${latestCustomer.name}`);
            }
        });
        setCustomerModalVisible(false);
    };

    return (
        <>
            <div className="mb-6">
                <div className="mb-3 pb-2 border-b border-gray-200 flex justify-between items-center">
                    <Text strong>Khách hàng</Text>
                    {mode === "create" && (
                        <Radio.Group
                            value={customerType}
                            onChange={handleCustomerTypeChange}
                            optionType="button"
                            buttonStyle="solid"
                            size="small"
                        >
                            <Radio.Button value="new">Khách mới</Radio.Button>
                            <Radio.Button value="existing">
                                Khách cũ
                            </Radio.Button>
                        </Radio.Group>
                    )}
                </div>

                <Form.Item name="customerCode" hidden>
                    <Input />
                </Form.Item>

                {mode === "create" && customerType === "existing" ? (
                    <Form.Item
                        label="Chọn khách hàng"
                        name="customerCode"
                        rules={[
                            {
                                required: true,
                                message: "Vui lòng chọn một khách hàng!",
                            },
                        ]}
                    >
                        <Select
                            showSearch
                            placeholder="Tìm và chọn khách hàng theo tên hoặc SĐT"
                            onChange={(customerCode) => {
                                const customer = customers[customerCode];
                                if (customer) {
                                    form.setFieldsValue({
                                        customerCode: customer.code,
                                        customerName: customer.name,
                                        phone: customer.phone,
                                        address: customer.address,
                                        customerSource: customer.customerSource,
                                    });
                                }
                            }}
                            filterOption={(input, option) => {
                                const customer =
                                    customers[option?.value as string];
                                if (!customer) return false;
                                const searchableText =
                                    `${customer.name} ${customer.phone}`.toLowerCase();
                                return searchableText.includes(
                                    input.toLowerCase(),
                                );
                            }}
                        >
                            {Object.values(customers).map((customer) => (
                                <Option
                                    key={customer.code}
                                    value={customer.code}
                                >
                                    {customer.name} - {customer.phone}
                                </Option>
                            ))}
                        </Select>
                    </Form.Item>
                ) : null}

                <Row gutter={12}>
                    <Col xs={24} sm={8} md={6} lg={5}>
                        <Form.Item
                            label={
                                mode === "create"
                                    ? "Mã đơn hàng (tự động)"
                                    : "Mã đơn hàng"
                            }
                            name="code"
                            rules={[
                                {
                                    required: true,
                                    message: "Vui lòng nhập mã đơn hàng!",
                                },
                            ]}
                        >
                            <Input disabled placeholder="VD: ORD_AD2342" />
                        </Form.Item>
                    </Col>
                    <Col xs={24} sm={8} md={9} lg={10}>
                        <Form.Item
                            label="Tên khách hàng"
                            name="customerName"
                            rules={[
                                {
                                    required: true,
                                    message: "Vui lòng nhập tên khách hàng!",
                                },
                            ]}
                        >
                            <Input
                                placeholder="VD: Nguyễn Thị Lan Anh"
                                disabled={
                                    mode === "update" ||
                                    customerType === "existing"
                                }
                            />
                        </Form.Item>
                    </Col>
                    <Col xs={24} sm={8} md={9} lg={9}>
                        <Form.Item
                            label="Số điện thoại"
                            name="phone"
                            rules={[
                                {
                                    required: true,
                                    message: "Vui lòng nhập số điện thoại!",
                                },
                                {
                                    pattern: /^[0-9]{10,11}$/,
                                    message: "Số điện thoại không hợp lệ!",
                                },
                            ]}
                        >
                            <Input
                                placeholder="VD: 0123456789"
                                disabled={
                                    mode === "update" ||
                                    customerType === "existing"
                                }
                                onChange={(e) => {
                                    const phone = e.target.value;
                                    // Only auto-fill for new customers in create mode
                                    if (mode === "create" && customerType === "new" && phone.length >= 10) {
                                        // Search for existing customer with this phone
                                        const existingCustomer = Object.values(customers).find(
                                            (customer: any) => customer.phone === phone
                                        );

                                        if (existingCustomer) {
                                            // Auto-fill customer information
                                            form.setFieldsValue({
                                                customerCode: existingCustomer.code,
                                                customerName: existingCustomer.name,
                                                address: existingCustomer.address,
                                                customerSource: existingCustomer.customerSource,
                                            });
                                            
                                            // Tự động chuyển sang chế độ "existing" để người dùng biết đây là khách hàng cũ
                                            setCustomerType("existing");
                                            
                                            message.success(
                                                `Đã tìm thấy khách hàng: ${existingCustomer.name}. Đơn hàng sẽ được thêm vào khách hàng này.`,
                                                { duration: 4 }
                                            );
                                        }
                                    }
                                }}
                            />
                        </Form.Item>
                    </Col>
                </Row>

                <Row gutter={12}>
                    <Col xs={24} sm={12}>
                        <Form.Item
                            label="Nguồn khách hàng"
                            name="customerSource"
                        >
                            <Select
                                placeholder="Chọn nguồn khách hàng"
                                className="w-full"
                                allowClear
                                disabled={
                                    mode === "update" ||
                                    customerType === "existing"
                                }
                                showSearch={{
                                    optionFilterProp: "children",
                                    filterOption: (input, option) =>
                                        String(option?.label || "")
                                            .toLowerCase()
                                            .includes(input.toLowerCase()),
                                }}
                            >
                                {CustomerSourceOptions.map((option) => (
                                    <Option
                                        key={option.value}
                                        value={option.value}
                                    >
                                        {option.label}
                                    </Option>
                                ))}
                            </Select>
                        </Form.Item>
                    </Col>
                </Row>

                <Form.Item
                    label="Địa chỉ"
                    name="address"
                    rules={[
                        { required: true, message: "Vui lòng nhập địa chỉ!" },
                    ]}
                >
                    <Input.TextArea
                        rows={2}
                        placeholder="VD: 123 Đường ABC, Quận XYZ, TP.HN"
                        disabled={
                            mode === "update" || customerType === "existing"
                        }
                    />
                </Form.Item>
            </div>

            <CustomerFormModal
                open={customerModalVisible}
                editingCustomer={null}
                customerGroups={customerGroups}
                provinces={provinces}
                onCancel={() => setCustomerModalVisible(false)}
                onSuccess={handleCustomerModalSuccess}
            />
        </>
    );
};

// Order Timing Information Section Component
const OrderTimingSection = ({
    mode,
    form,
    products,
    message,
    modal,
}: {
    mode: string;
    form: any;
    products: ProductData[];
    message: any;
    modal: any;
}) => {
    return (
        <div className="mb-6">
            <div className="mb-3 pb-2 border-b border-gray-200">
                <Text strong>Thời gian</Text>
            </div>
            <Row gutter={16}>
                <Col xs={24} sm={12} lg={8}>
                    <Form.Item
                        label="Ngày đặt"
                        name="orderDate"
                        initialValue={mode === "create" ? dayjs() : undefined}
                        rules={[
                            {
                                required: true,
                                message: "Vui lòng chọn ngày đặt!",
                            },
                        ]}
                    >
                        <DatePicker
                            disabled
                            className="w-full"
                            format="DD/MM/YYYY"
                            placeholder="Chọn ngày đặt"
                        />
                    </Form.Item>
                </Col>
                <Col xs={24} sm={12} lg={8}>
                    <Form.Item
                        label="Ngày giao dự kiến"
                        name="deliveryDate"
                        rules={[
                            {
                                required: true,
                                message: "Vui lòng chọn ngày giao!",
                            },
                        ]}
                    >
                        <DatePicker
                            className="w-full"
                            format="DD/MM/YYYY"
                            placeholder="Chọn ngày giao"
                            disabledDate={(current) =>
                                current && current < dayjs().endOf("day")
                            }
                        />
                    </Form.Item>
                </Col>
                {mode === "update" && (
                    <Col xs={24} lg={8}>
                        <Form.Item label="Trạng thái" required>
                            <StatusStepper
                                form={form}
                                products={products}
                                message={message}
                                modal={modal}
                            />
                        </Form.Item>
                        <Form.Item name="status" hidden>
                            <Input disabled hidden className="fixed" />
                        </Form.Item>
                        <Form.Item
                            name="isDepositPaid"
                            valuePropName="checked"
                            hidden
                        >
                            <Switch disabled className="fixed hidden" />
                        </Form.Item>
                    </Col>
                )}
            </Row>
        </div>
    );
};

// Issue Input Item Component (memoized to prevent unnecessary re-renders)
const IssueInputItem = React.memo(
    ({
        issue,
        index,
        onChange,
        onKeyDown,
        onRemove,
        inputRef,
        canRemove,
    }: {
        issue: string;
        index: number;
        onChange: (value: string) => void;
        onKeyDown: (e: React.KeyboardEvent<HTMLInputElement>) => void;
        onRemove: () => void;
        inputRef: (el: InputRef | null) => void;
        canRemove: boolean;
    }) => {
        return (
            <div className="flex items-center gap-2">
                <Input
                    ref={inputRef}
                    value={issue}
                    onChange={(e) => onChange(e.target.value)}
                    onKeyDown={onKeyDown}
                    placeholder={`Vấn đề ${index + 1}...`}
                    className="flex-1"
                    onPressEnter={(e) => {
                        e.preventDefault();
                        onKeyDown(e as any);
                    }}
                />
                {canRemove && (
                    <Button
                        type="text"
                        size="small"
                        icon={<DeleteOutlined />}
                        onClick={onRemove}
                        className="text-red-500 hover:text-red-700 shrink-0"
                    />
                )}
            </div>
        );
    },
);

IssueInputItem.displayName = "IssueInputItem";

// Issues List Component
const IssuesList = ({ form }: { form: any }) => {
    const [issues, setIssues] = useState<string[]>([""]);
    const inputRefs = useRef<(InputRef | null)[]>([]);
    const isInitialMount = useRef(true);
    const updateFormTimeoutRef = useRef<NodeJS.Timeout | null>(null);
    const editingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
    const formRef = useRef(form);
    const isUserEditing = useRef(false);
    const lastSyncedFormIssues = useRef<string>("");
    const issueIdsRef = useRef<string[]>([]);

    // Watch form issues field to sync when form is populated from Firebase
    const formIssues = Form.useWatch("issues", form);

    // Keep form ref updated
    useEffect(() => {
        formRef.current = form;
    }, [form]);

    // Initialize issue IDs on mount
    useEffect(() => {
        if (issueIdsRef.current.length === 0) {
            issueIdsRef.current = ["issue-0"];
        }
    }, []);

    // Sync issues from form when form is populated (e.g., from Firebase in update mode)
    useEffect(() => {
        // Skip if user is currently editing
        if (isUserEditing.current) {
            return;
        }

        const formIssuesArray = Array.isArray(formIssues) ? formIssues : [];
        const formIssuesString = JSON.stringify(formIssuesArray);

        // Only sync if formIssues actually changed (not just a re-render)
        if (formIssuesString !== lastSyncedFormIssues.current) {
            if (formIssuesArray.length > 0) {
                // Generate stable IDs for issues
                const newIssueIds = formIssuesArray.map(
                    (_, idx) => `issue-${idx}`,
                );
                newIssueIds.push(`issue-${formIssuesArray.length}`);
                issueIdsRef.current = newIssueIds;
                setIssues([...formIssuesArray, ""]);
            } else if (isInitialMount.current) {
                // Initial mount with no issues
                issueIdsRef.current = ["issue-0"];
                setIssues([""]);
            }
            lastSyncedFormIssues.current = formIssuesString;
            isInitialMount.current = false;
        } else if (isInitialMount.current) {
            // Initial mount - ensure we have at least one empty field
            issueIdsRef.current = ["issue-0"];
            setIssues([""]);
            lastSyncedFormIssues.current = formIssuesString;
            isInitialMount.current = false;
        }
    }, [formIssues]);

    // Update form when issues change (debounced to avoid focus loss)
    useEffect(() => {
        if (!isInitialMount.current && isUserEditing.current) {
            // Clear previous timeout
            if (updateFormTimeoutRef.current) {
                clearTimeout(updateFormTimeoutRef.current);
            }

            // Debounce form update with longer delay to avoid focus loss
            updateFormTimeoutRef.current = setTimeout(() => {
                const issuesToSave = issues.filter(
                    (issue) => issue.trim() !== "",
                );
                const issuesToSaveString = JSON.stringify(issuesToSave);
                formRef.current.setFieldsValue({ issues: issuesToSave });
                // Update last synced to prevent re-sync
                lastSyncedFormIssues.current = issuesToSaveString;
            }, 500);
        }

        return () => {
            if (updateFormTimeoutRef.current) {
                clearTimeout(updateFormTimeoutRef.current);
            }
        };
    }, [issues]);

    const handleIssueChange = React.useCallback(
        (index: number, value: string) => {
            // Set editing flag immediately and keep it for longer
            isUserEditing.current = true;

            // Clear any existing timeout
            if (editingTimeoutRef.current) {
                clearTimeout(editingTimeoutRef.current);
            }

            setIssues((prevIssues) => {
                const newIssues = [...prevIssues];
                newIssues[index] = value;
                return newIssues;
            });

            // Reset editing flag after a longer delay to prevent sync during typing
            editingTimeoutRef.current = setTimeout(() => {
                isUserEditing.current = false;
            }, 1000);
        },
        [],
    );

    const handleIssueKeyDown = React.useCallback(
        (e: React.KeyboardEvent<HTMLInputElement>, index: number) => {
            if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                e.stopPropagation();

                isUserEditing.current = true;
                if (editingTimeoutRef.current) {
                    clearTimeout(editingTimeoutRef.current);
                }

                setIssues((prevIssues) => {
                    const newIssues = [...prevIssues];

                    // Always add new field when Enter is pressed at the last field
                    if (index === prevIssues.length - 1) {
                        newIssues.push("");
                        // Generate new ID for the new field
                        const newId = `issue-${issueIdsRef.current.length}`;
                        issueIdsRef.current.push(newId);
                        // Focus the new field after state update
                        setTimeout(() => {
                            const newIndex = newIssues.length - 1;
                            inputRefs.current[newIndex]?.input?.focus();
                        }, 10);
                        return newIssues;
                    } else {
                        // Focus next field if it exists
                        setTimeout(() => {
                            inputRefs.current[index + 1]?.input?.focus();
                        }, 10);
                        return prevIssues;
                    }
                });

                editingTimeoutRef.current = setTimeout(() => {
                    isUserEditing.current = false;
                }, 1000);
            }
        },
        [],
    );

    const handleIssueRemove = React.useCallback((index: number) => {
        isUserEditing.current = true;
        if (editingTimeoutRef.current) {
            clearTimeout(editingTimeoutRef.current);
        }

        setIssues((prevIssues) => {
            if (prevIssues.length <= 1) {
                issueIdsRef.current = ["issue-0"];
                return [""];
            }
            // Remove the corresponding ID
            issueIdsRef.current = issueIdsRef.current.filter(
                (_, i) => i !== index,
            );
            return prevIssues.filter((_, i) => i !== index);
        });

        editingTimeoutRef.current = setTimeout(() => {
            isUserEditing.current = false;
        }, 1000);
    }, []);

    return (
        <div className="space-y-2">
            <Text strong className="text-gray-700 block mb-2">
                Vấn đề khách hàng gặp phải
            </Text>
            <div className="space-y-2">
                {issues.map((issue, index) => (
                    <IssueInputItem
                        key={
                            issueIdsRef.current[index] ||
                            `issue-${index}-${genCode("REACTKEY")}`
                        }
                        issue={issue}
                        index={index}
                        onChange={(value) => handleIssueChange(index, value)}
                        onKeyDown={(e) => handleIssueKeyDown(e, index)}
                        onRemove={() => handleIssueRemove(index)}
                        inputRef={(el) => {
                            inputRefs.current[index] = el;
                        }}
                        canRemove={issues.length > 1 && issue.trim() !== ""}
                    />
                ))}
            </div>
            <Text type="secondary" className="text-xs">
                Nhấn Enter để thêm vấn đề mới
            </Text>
        </div>
    );
};

// Staff Information Section Component
const StaffInformationSection = ({ form, staff }: { form: any; staff: FirebaseStaff }) => {
    // Filter sales staff members
    const salesMembers = useMemo(() => {
        return Object.values(staff).filter(
            (member) => member.role === ROLES.sales && member.isActive !== false
        );
    }, [staff]);

    const handleSalesStaffChange = (memberId: string) => {
        const selectedMember = salesMembers.find((m) => m.id === memberId);
        if (selectedMember) {
            form.setFieldsValue({
                consultantId: memberId,
                consultantName: selectedMember.name,
            });
        }
    };

    return (
        <div className="">
            <div className="mb-3 pb-2 border-b border-gray-200">
                <Text strong>Nhân viên</Text>
            </div>
            <Row gutter={16}>
                <Col xs={24} sm={24} md={12}>
                    <Form.Item
                        required
                        label="Nhân viên tạo đơn"
                        name="createdByName"
                    >
                        <Input
                            disabled
                            placeholder="Đang tải thông tin người dùng..."
                            prefix={<UserOutlined className="text-gray-400" />}
                            className="bg-gray-50"
                        />
                    </Form.Item>
                    <Form.Item name="createdBy" className="absolute">
                        <Input disabled hidden />
                    </Form.Item>
                </Col>
                <Col xs={24} sm={24} md={12}>
                    <Form.Item
                        label="Nhân viên Sale"
                        name="consultantId"
                    >
                        <Select
                            placeholder="Chọn nhân viên Sale"
                            showSearch
                            optionFilterProp="children"
                            filterOption={(input, option) =>
                                (option?.label?.toString() ?? "")
                                    .toLowerCase()
                                    .includes(input.toLowerCase())
                            }
                            onChange={handleSalesStaffChange}
                            allowClear
                        >
                            {salesMembers.map((member) => (
                                <Select.Option
                                    key={member.id}
                                    value={member.id}
                                    label={member.name}
                                >
                                    {member.name} {member.phone && `(${member.phone})`}
                                </Select.Option>
                            ))}
                        </Select>
                    </Form.Item>
                    <Form.Item name="consultantName" hidden>
                        <Input />
                    </Form.Item>
                </Col>
            </Row>
            <Form.Item label="Ghi chú đơn hàng" name="notes">
                <Input.TextArea
                    rows={3}
                    placeholder="Ghi chú chung về đơn hàng..."
                    maxLength={500}
                    showCount
                />
            </Form.Item>
            <Form.Item name="issues" hidden>
                <Input />
            </Form.Item>
            <IssuesList form={form} />
        </div>
    );
};

// Task Display Component
const TaskDisplayView = ({
    task,
    membersMap,
    onEdit,
    onDelete,
}: {
    task: any;
    membersMap: FirebaseStaff;
    onEdit: () => void;
    onDelete: () => void;
}) => {
    return (
        <div className="space-y-2">
            <div className="flex items-start justify-between">
                <div className="flex-1">
                    <Text strong>
                        {task.task_order}. {task.task_name}
                    </Text>
                    {task.description && (
                        <div className="mt-1">
                            <Text type="secondary" className="text-sm">
                                {task.description}
                            </Text>
                        </div>
                    )}
                </div>
                <Space>
                    <Button
                        type="text"
                        size="small"
                        icon={<EditOutlined />}
                        onClick={onEdit}
                    />
                    <Button
                        type="text"
                        danger
                        size="small"
                        icon={<DeleteOutlined />}
                        onClick={onDelete}
                    />
                </Space>
            </div>

            {/* Task Details */}
            <div className="grid grid-cols-2 gap-2 text-sm">
                {task.assignedToName && (
                    <div>
                        <Text type="secondary">Nhân sự: </Text>
                        <Text strong>{task.assignedToName}</Text>
                    </div>
                )}
                {task.estimatedDuration && (
                    <div>
                        <Text type="secondary">Thời gian: </Text>
                        <Text strong>
                            {task.estimatedDuration}{" "}
                            {task.durationUnit === "hours" ? "giờ" : "ngày"}
                        </Text>
                    </div>
                )}
                {task.deadline && (
                    <div className="col-span-2">
                        <Text type="secondary">Deadline: </Text>
                        <Text strong>
                            {dayjs(task.deadline).format("HH:mm DD/MM/YYYY")}
                        </Text>
                    </div>
                )}
            </div>
        </div>
    );
};

// Task Edit Form Component
const TaskEditForm = ({
    task,
    staff,
    departmentCode,
    onSave,
    onCancel,
}: {
    task: any;
    staff: FirebaseStaff;
    departmentCode?: string;
    onSave: (updates: any) => void;
    onCancel: () => void;
}) => {
    // Create staff options from staff object, filter by department if provided
    const staffOptions = useMemo(() => {
        return Object.entries(staff || {})
            .filter(([id, member]: [string, any]) => {
                if (!member.isActive) return false;
                if (departmentCode && member.departments) {
                    return member.departments.includes(departmentCode);
                }
                return true;
            })
            .map(([id, member]: [string, any]) => ({
                value: id,
                label: member.name || id,
            }));
    }, [staff, departmentCode]);
    const [taskName, setTaskName] = useState(task.task_name);
    const [assignedTo, setAssignedTo] = useState(task.assignedTo);
    const [duration, setDuration] = useState(
        task.estimatedDuration || undefined,
    );
    const [durationUnit, setDurationUnit] = useState<"hours" | "days">(
        task.durationUnit || "hours",
    );
    const [description, setDescription] = useState(task.description || "");

    // Sync state when task prop changes
    useEffect(() => {
        setTaskName(task.task_name);
        setAssignedTo(task.assignedTo);
        setDuration(task.estimatedDuration || undefined);
        setDurationUnit(task.durationUnit || "hours");
        setDescription(task.description || "");
    }, [
        task.id,
        task.task_name,
        task.assignedTo,
        task.estimatedDuration,
        task.durationUnit,
        task.description,
    ]);

    const handleSave = () => {
        const selectedMember = staffOptions.find(
            (opt) => opt.value === assignedTo,
        );
        onSave({
            task_name: taskName,
            assignedTo: assignedTo,
            assignedToName: selectedMember?.label,
            estimatedDuration: duration,
            durationUnit: durationUnit,
            description: description,
        });
    };

    const calculatedDeadline =
        duration && durationUnit
            ? durationUnit === "hours"
                ? Date.now() + duration * 60 * 60 * 1000
                : Date.now() + duration * 24 * 60 * 60 * 1000
            : undefined;

    return (
        <div className="space-y-3">
            <div>
                <Text strong className="mb-2 block">
                    Tên công việc:
                </Text>
                <Input
                    value={taskName}
                    onChange={(e) => setTaskName(e.target.value)}
                    placeholder="Nhập tên công việc"
                />
            </div>

            <div>
                <Text strong className="mb-2 block">
                    Nhân sự phụ trách:
                </Text>
                <Select
                    value={assignedTo}
                    onChange={setAssignedTo}
                    placeholder="Chọn nhân sự"
                    className="w-full"
                    showSearch
                    optionFilterProp="children"
                    allowClear
                >
                    {staffOptions.map((option) => (
                        <Option key={option.value} value={option.value}>
                            {option.label}
                        </Option>
                    ))}
                </Select>
            </div>

            <Row gutter={12}>
                <Col span={16}>
                    <Text strong className="mb-2 block">
                        Thời gian ước tính:
                    </Text>
                    <InputNumber
                        value={duration}
                        onChange={(value) =>
                            setDuration(value ? Number(value) : undefined)
                        }
                        placeholder="Nhập số"
                        min={0}
                        className="w-full"
                    />
                </Col>
                <Col span={8}>
                    <Text strong className="mb-2 block">
                        Đơn vị:
                    </Text>
                    <Select
                        value={durationUnit}
                        onChange={(value) =>
                            setDurationUnit(value as "hours" | "days")
                        }
                        className="w-full"
                    >
                        <Option value="hours">Giờ</Option>
                        <Option value="days">Ngày</Option>
                    </Select>
                </Col>
            </Row>

            {calculatedDeadline && (
                <div className="p-2 bg-blue-50 rounded">
                    <Text type="secondary" className="text-sm">
                        Deadline:{" "}
                    </Text>
                    <Text strong className="text-sm">
                        {dayjs(calculatedDeadline).format("HH:mm DD/MM/YYYY")}
                    </Text>
                </div>
            )}

            <div>
                <Text strong className="mb-2 block">
                    Ghi chú:
                </Text>
                <Input.TextArea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Nhập ghi chú..."
                    rows={3}
                />
            </div>

            <div className="flex justify-end gap-2 pt-2">
                <Button onClick={onCancel}>Hủy</Button>
                <Button
                    type="primary"
                    onClick={handleSave}
                    disabled={!taskName.trim()}
                >
                    Lưu
                </Button>
            </div>
        </div>
    );
};

// Payment Manager Component
const PaymentManager: React.FC<{
    payments: PaymentInfo[];
    onPaymentsChange: (payments: PaymentInfo[]) => void;
    totalAmount: number;
    user: any;
}> = ({ payments, onPaymentsChange, totalAmount, user }) => {
    const [paymentModalVisible, setPaymentModalVisible] = useState(false);
    const [editingPayment, setEditingPayment] = useState<PaymentInfo | null>(null);
    const [paymentForm] = Form.useForm();
    const { message } = App.useApp();

    const totalPaidAmount = payments.reduce((sum, p) => sum + p.amount, 0);
    const remainingDebt = totalAmount - totalPaidAmount;

    const handleAddPayment = () => {
        setEditingPayment(null);
        paymentForm.resetFields();
        paymentForm.setFieldsValue({ paidAt: dayjs() });
        setPaymentModalVisible(true);
    };

    const handleEditPayment = (payment: PaymentInfo) => {
        setEditingPayment(payment);
        paymentForm.setFieldsValue({
            amount: payment.amount,
            content: payment.content,
            paidAt: dayjs(payment.paidAt),
            images: payment.images || [],
        });
        setPaymentModalVisible(true);
    };

    const handleDeletePayment = (paymentId: string) => {
        modal.confirm({
            title: "Xác nhận xóa",
            content: "Bạn có chắc chắn muốn xóa thanh toán này?",
            onOk: () => {
                onPaymentsChange(payments.filter(p => p.id !== paymentId));
                message.success("Đã xóa thanh toán");
            },
        });
    };

    const handlePaymentSubmit = async () => {
        try {
            const values = await paymentForm.validateFields();
            const paymentId = editingPayment?.id || `PAY_${Date.now()}`;
            
            // Handle image uploads
            const processedImages = await Promise.all(
                (values.images || []).map(async (file: any) => {
                    if (file.originFileObj) {
                        const base64 = await getBase64(file.originFileObj);
                        return {
                            uid: file.uid,
                            name: file.name,
                            status: "done" as const,
                            url: base64,
                        };
                    }
                    return file;
                })
            );

            const newPayment: PaymentInfo = {
                id: paymentId,
                amount: values.amount,
                content: values.content,
                images: processedImages,
                paidAt: values.paidAt.valueOf(),
                paidBy: user?.uid,
                paidByName: user?.displayName,
                createdAt: editingPayment?.createdAt || Date.now(),
            };

            if (editingPayment) {
                onPaymentsChange(payments.map(p => p.id === editingPayment.id ? newPayment : p));
                message.success("Đã cập nhật thanh toán");
            } else {
                onPaymentsChange([...payments, newPayment]);
                message.success("Đã thêm thanh toán");
            }

            setPaymentModalVisible(false);
            paymentForm.resetFields();
        } catch (error) {
            console.error("Error submitting payment:", error);
        }
    };

    return (
        <div className="mt-4 pt-4 border-t border-gray-200">
            <div className="flex justify-between items-center mb-3">
                <Text strong>Thanh toán</Text>
                <Button
                    type="dashed"
                    icon={<PlusOutlined />}
                    size="small"
                    onClick={handleAddPayment}
                >
                    Thêm thanh toán
                </Button>
            </div>

            <div className="space-y-2 mb-3">
                {payments.map((payment) => (
                    <Card
                        key={payment.id}
                        size="small"
                        className="shadow-sm"
                        actions={[
                            <Button
                                type="text"
                                icon={<EditOutlined />}
                                onClick={() => handleEditPayment(payment)}
                                key="edit"
                            >
                                Sửa
                            </Button>,
                            <Button
                                type="text"
                                danger
                                icon={<DeleteOutlined />}
                                onClick={() => handleDeletePayment(payment.id)}
                                key="delete"
                            >
                                Xóa
                            </Button>,
                        ]}
                    >
                        <div className="flex justify-between items-start">
                            <div className="flex-1">
                                <div className="flex items-center gap-2 mb-1">
                                    <Text strong className="text-primary">
                                        {payment.amount.toLocaleString("vi-VN")} VNĐ
                                    </Text>
                                    <Tag>{dayjs(payment.paidAt).format("DD/MM/YYYY HH:mm")}</Tag>
                                </div>
                                {payment.content && (
                                    <Text type="secondary" className="text-sm">
                                        {payment.content}
                                    </Text>
                                )}
                                {payment.images && payment.images.length > 0 && (
                                    <div className="mt-2 flex gap-2">
                                        {payment.images.slice(0, 3).map((img) => (
                                            <img
                                                key={img.uid}
                                                src={img.url}
                                                alt={img.name}
                                                className="w-16 h-16 object-cover rounded"
                                            />
                                        ))}
                                        {payment.images.length > 3 && (
                                            <div className="w-16 h-16 flex items-center justify-center bg-gray-100 rounded">
                                                <Text className="text-xs">+{payment.images.length - 3}</Text>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>
                    </Card>
                ))}
            </div>

            <div className="flex justify-between pt-2 border-t border-gray-200">
                <Text strong>Tổng đã thanh toán:</Text>
                <Text strong className="text-green-600">
                    {totalPaidAmount.toLocaleString("vi-VN")} VNĐ
                </Text>
            </div>
            <div className="flex justify-between pt-1">
                <Text strong>Công nợ còn lại:</Text>
                <Text strong className={remainingDebt > 0 ? "text-red-500" : "text-green-600"}>
                    {remainingDebt.toLocaleString("vi-VN")} VNĐ
                </Text>
            </div>

            {/* Payment Modal */}
            <Modal
                title={editingPayment ? "Chỉnh sửa thanh toán" : "Thêm thanh toán"}
                open={paymentModalVisible}
                onCancel={() => {
                    setPaymentModalVisible(false);
                    paymentForm.resetFields();
                }}
                onOk={handlePaymentSubmit}
                okText={editingPayment ? "Cập nhật" : "Thêm"}
                cancelText="Hủy"
                width={600}
            >
                <Form
                    form={paymentForm}
                    layout="vertical"
                    className="mt-4"
                >
                    <Form.Item
                        name="amount"
                        label="Số tiền đã thanh toán"
                        rules={[
                            { required: true, message: "Vui lòng nhập số tiền!" },
                            { type: "number", min: 1, message: "Số tiền phải lớn hơn 0!" },
                        ]}
                    >
                        <InputNumber
                            min={0}
                            placeholder="0"
                            formatter={(v) => `${v}`.replace(/\B(?=(\d{3})+(?!\d))/g, ",")}
                            parser={(value) => Number(value?.replace(/,/g, "") || 0) as any}
                            className="w-full"
                            style={{ width: "100%" }}
                        />
                    </Form.Item>

                    <Form.Item
                        name="content"
                        label="Nội dung thanh toán"
                    >
                        <Input.TextArea
                            placeholder="Nhập nội dung thanh toán..."
                            rows={3}
                        />
                    </Form.Item>

                    <Form.Item
                        name="paidAt"
                        label="Thời gian thanh toán"
                        rules={[{ required: true, message: "Vui lòng chọn thời gian!" }]}
                    >
                        <DatePicker
                            showTime
                            format="DD/MM/YYYY HH:mm"
                            className="w-full"
                        />
                    </Form.Item>

                    <Form.Item
                        name="images"
                        label="Ảnh chứng từ thanh toán"
                    >
                        <Form.Item noStyle shouldUpdate>
                            {({ getFieldValue }) => {
                                const images = getFieldValue("images") || [];
                                return (
                                    <Upload
                                        listType="picture-card"
                                        fileList={images}
                                        beforeUpload={async (file, fileList) => {
                                            const base64 = await getBase64(file);
                                            const newFile = {
                                                uid: file.uid,
                                                name: file.name,
                                                status: "done" as const,
                                                url: base64,
                                                originFileObj: file,
                                            };
                                            const currentImages = getFieldValue("images") || [];
                                            paymentForm.setFieldsValue({ images: [...currentImages, newFile] });
                                            return false;
                                        }}
                                        onRemove={(file) => {
                                            const currentImages = getFieldValue("images") || [];
                                            paymentForm.setFieldsValue({
                                                images: currentImages.filter((img: any) => img.uid !== file.uid),
                                            });
                                            return true;
                                        }}
                                        multiple
                                        accept="image/*"
                                    >
                                        {images.length >= 8 ? null : (
                                            <div className="flex flex-col items-center justify-center p-2">
                                                <UploadOutlined className="text-xl mb-1" />
                                                <Text className="text-xs text-center">Tải ảnh</Text>
                                            </div>
                                        )}
                                    </Upload>
                                );
                            }}
                        </Form.Item>
                    </Form.Item>
                </Form>
            </Modal>
        </div>
    );
};

// Return Manager Component
const ReturnManager: React.FC<{
    returns: ReturnInfo[];
    onReturnsChange: (returns: ReturnInfo[]) => void;
    user: any;
    staffOptions: Array<{ value: string; label: string }>;
}> = ({ returns, onReturnsChange, user, staffOptions }) => {
    const [returnModalVisible, setReturnModalVisible] = useState(false);
    const [editingReturn, setEditingReturn] = useState<ReturnInfo | null>(null);
    const [returnForm] = Form.useForm();
    const { message, modal } = App.useApp();

    const handleAddReturn = () => {
        setEditingReturn(null);
        returnForm.resetFields();
        returnForm.setFieldsValue({
            returnedAt: dayjs(),
            returnedBy: user?.uid,
            returnedByName: user?.displayName,
        });
        setReturnModalVisible(true);
    };

    const handleEditReturn = (returnItem: ReturnInfo) => {
        setEditingReturn(returnItem);
        returnForm.setFieldsValue({
            returnedBy: returnItem.returnedBy,
            returnedByName: returnItem.returnedByName,
            returnedAt: dayjs(returnItem.returnedAt),
            images: returnItem.images || [],
        });
        setReturnModalVisible(true);
    };

    const handleDeleteReturn = (returnId: string) => {
        modal.confirm({
            title: "Xác nhận xóa",
            content: "Bạn có chắc chắn muốn xóa mục trả đồ này?",
            onOk: () => {
                onReturnsChange(returns.filter(r => r.id !== returnId));
                message.success("Đã xóa mục trả đồ");
            },
        });
    };

    const handleReturnSubmit = async () => {
        try {
            const values = await returnForm.validateFields();
            const returnId = editingReturn?.id || `RET_${Date.now()}`;
            
            // Handle image uploads
            const processedImages = await Promise.all(
                (values.images || []).map(async (file: any) => {
                    if (file.originFileObj) {
                        const base64 = await getBase64(file.originFileObj);
                        return {
                            uid: file.uid,
                            name: file.name,
                            status: "done" as const,
                            url: base64,
                        };
                    }
                    return file;
                })
            );

            // Get returned by name from staff options
            const returnedByName = staffOptions.find(opt => opt.value === values.returnedBy)?.label || values.returnedByName || "";

            const newReturn: ReturnInfo = {
                id: returnId,
                returnedBy: values.returnedBy,
                returnedByName: returnedByName,
                returnedAt: values.returnedAt.valueOf(),
                images: processedImages,
                createdAt: editingReturn?.createdAt || Date.now(),
            };

            if (editingReturn) {
                onReturnsChange(returns.map(r => r.id === editingReturn.id ? newReturn : r));
                message.success("Đã cập nhật mục trả đồ");
            } else {
                onReturnsChange([...returns, newReturn]);
                message.success("Đã thêm mục trả đồ");
            }

            setReturnModalVisible(false);
            returnForm.resetFields();
        } catch (error) {
            console.error("Error submitting return:", error);
        }
    };

    return (
        <div className="mt-4 pt-4 border-t border-gray-200">
            <div className="flex justify-between items-center mb-3">
                <Text strong>Trả đồ</Text>
                <Button
                    type="dashed"
                    icon={<PlusOutlined />}
                    size="small"
                    onClick={handleAddReturn}
                >
                    Thêm mục trả đồ
                </Button>
            </div>

            <div className="space-y-2 mb-3">
                {returns.map((returnItem) => (
                    <Card
                        key={returnItem.id}
                        size="small"
                        className="shadow-sm"
                        actions={[
                            <Button
                                type="text"
                                icon={<EditOutlined />}
                                onClick={() => handleEditReturn(returnItem)}
                                key="edit"
                            >
                                Sửa
                            </Button>,
                            <Button
                                type="text"
                                danger
                                icon={<DeleteOutlined />}
                                onClick={() => handleDeleteReturn(returnItem.id)}
                                key="delete"
                            >
                                Xóa
                            </Button>,
                        ]}
                    >
                        <div className="flex justify-between items-start">
                            <div className="flex-1">
                                <div className="flex items-center gap-2 mb-1">
                                    <Text strong>Người trả: {returnItem.returnedByName || "Chưa xác định"}</Text>
                                    <Tag>{dayjs(returnItem.returnedAt).format("DD/MM/YYYY HH:mm")}</Tag>
                                </div>
                                {returnItem.images && returnItem.images.length > 0 && (
                                    <div className="mt-2 flex gap-2">
                                        {returnItem.images.slice(0, 3).map((img) => (
                                            <img
                                                key={img.uid}
                                                src={img.url}
                                                alt={img.name}
                                                className="w-16 h-16 object-cover rounded"
                                            />
                                        ))}
                                        {returnItem.images.length > 3 && (
                                            <div className="w-16 h-16 flex items-center justify-center bg-gray-100 rounded">
                                                <Text className="text-xs">+{returnItem.images.length - 3}</Text>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>
                    </Card>
                ))}
            </div>

            {returns.length === 0 && (
                <Empty
                    description="Chưa có mục trả đồ nào"
                    image={Empty.PRESENTED_IMAGE_SIMPLE}
                    className="my-4"
                />
            )}

            {/* Return Modal */}
            <Modal
                title={editingReturn ? "Chỉnh sửa mục trả đồ" : "Thêm mục trả đồ"}
                open={returnModalVisible}
                onCancel={() => {
                    setReturnModalVisible(false);
                    returnForm.resetFields();
                }}
                onOk={handleReturnSubmit}
                okText={editingReturn ? "Cập nhật" : "Thêm"}
                cancelText="Hủy"
                width={600}
            >
                <Form
                    form={returnForm}
                    layout="vertical"
                    className="mt-4"
                >
                    <Form.Item
                        name="returnedBy"
                        label="Người trả"
                        rules={[
                            { required: true, message: "Vui lòng chọn người trả!" },
                        ]}
                    >
                        <Select
                            placeholder="Chọn người trả"
                            showSearch
                            optionFilterProp="children"
                            suffixIcon={<UserOutlined className="text-gray-400" />}
                            onChange={(value) => {
                                const selectedStaff = staffOptions.find(opt => opt.value === value);
                                if (selectedStaff) {
                                    returnForm.setFieldsValue({ returnedByName: selectedStaff.label });
                                }
                            }}
                        >
                            {staffOptions.map((opt: any) => (
                                <Option key={opt.value} value={opt.value}>
                                    {opt.label}
                                </Option>
                            ))}
                        </Select>
                    </Form.Item>

                    <Form.Item
                        name="returnedAt"
                        label="Thời gian trả"
                        rules={[{ required: true, message: "Vui lòng chọn thời gian!" }]}
                        initialValue={dayjs()}
                    >
                        <DatePicker
                            showTime
                            format="DD/MM/YYYY HH:mm"
                            className="w-full"
                            suffixIcon={<ClockCircleOutlined className="text-gray-400" />}
                        />
                    </Form.Item>

                    <Form.Item
                        name="images"
                        label="Ảnh minh chứng"
                    >
                        <Form.Item noStyle shouldUpdate>
                            {({ getFieldValue }) => {
                                const images = getFieldValue("images") || [];
                                return (
                                    <Upload
                                        listType="picture-card"
                                        fileList={images}
                                        beforeUpload={async (file, fileList) => {
                                            const base64 = await getBase64(file);
                                            const newFile = {
                                                uid: file.uid,
                                                name: file.name,
                                                status: "done" as const,
                                                url: base64,
                                                originFileObj: file,
                                            };
                                            const currentImages = getFieldValue("images") || [];
                                            returnForm.setFieldsValue({ images: [...currentImages, newFile] });
                                            return false;
                                        }}
                                        onRemove={(file) => {
                                            const currentImages = getFieldValue("images") || [];
                                            returnForm.setFieldsValue({
                                                images: currentImages.filter((img: any) => img.uid !== file.uid),
                                            });
                                            return true;
                                        }}
                                        multiple
                                        accept="image/*"
                                    >
                                        {images.length >= 8 ? null : (
                                            <div className="flex flex-col items-center justify-center p-2">
                                                <UploadOutlined className="text-xl mb-1" />
                                                <Text className="text-xs text-center">Tải ảnh</Text>
                                            </div>
                                        )}
                                    </Upload>
                                );
                            }}
                        </Form.Item>
                    </Form.Item>
                </Form>
            </Modal>
        </div>
    );
};

// Add Workflow Form Component
const AddWorkflowForm: React.FC<{
    form: any;
    departments: FirebaseDepartments;
    workflows: FirebaseWorkflows;
    memberOptions: any;
    allStaffOptions: Array<{ value: string; label: string }>;
    product: ProductData;
    processTemplates?: ProcessTemplate[];
}> = ({ form, departments, workflows, memberOptions, allStaffOptions, product, processTemplates = [], operationalWorkflows = [] }) => {
    // Convert operational workflows to options for Select (ưu tiên)
    const workflowOptions = operationalWorkflows.length > 0
        ? operationalWorkflows.map((workflow) => ({
              value: workflow.id,
              label: workflow.workflowName,
          }))
        : Object.entries(workflows).map(([code, workflow]) => ({
              value: code,
              label: (workflow as Workflow).name,
          }));

    // Watch workflowCode changes to auto-load tasks
    const selectedWorkflowCodes = Form.useWatch("workflowCode", form);
    const currentChecklist = Form.useWatch("checklist", form);

    // Auto-load công việc from selected Operational Workflows (Quy trình vận hành)
    useEffect(() => {
        if (!selectedWorkflowCodes || selectedWorkflowCodes.length === 0) {
            // Clear checklist if no workflow selected
            form.setFieldValue("checklist", []);
            return;
        }

        // Only auto-load if checklist is empty or has no công việc with names
        const hasExistingTasks = currentChecklist && currentChecklist.length > 0 && 
            currentChecklist.some((task: any) => task?.task_name && task.task_name.trim() !== "");
        
        if (hasExistingTasks) {
            // Don't overwrite existing công việc - user may have edited them
            return;
        }

        // Collect all công việc from all selected Operational Workflows
        const allTasks: Array<{
            id: string;
            task_name: string;
            task_order: number;
            checked: boolean;
        }> = [];

        selectedWorkflowCodes.forEach((workflowCode: string) => {
            // Check Operational Workflows (Quy trình vận hành)
            const operationalWorkflow = operationalWorkflows.find(w => w.id === workflowCode);
            if (operationalWorkflow && operationalWorkflow.jobs) {
                // Get all công việc from jobs[] in this workflow
                operationalWorkflow.jobs.forEach((job) => {
                    allTasks.push({
                        id: `CV_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                        task_name: job.jobName, // Lấy từ jobs[].jobName
                        task_order: allTasks.length + 1,
                        checked: false,
                    });
                });
            }
        });

        // Update checklist with loaded công việc
        if (allTasks.length > 0) {
            form.setFieldValue("checklist", allTasks);
        }
    }, [selectedWorkflowCodes, operationalWorkflows, form, currentChecklist]);

    return (
        <Form
            form={form}
            layout="vertical"
            className="mt-4"
        >
            <Form.Item
                name="workflowCode"
                label="Quy trình"
                rules={[
                    {
                        required: true,
                        message: "Vui lòng chọn quy trình!",
                    },
                ]}
            >
                <Select
                    mode="multiple"
                    placeholder="Chọn quy trình vận hành"
                    showSearch
                    suffixIcon={<DeploymentUnitOutlined className="text-gray-400" />}
                    filterOption={(input, option) =>
                        (option?.label ?? "")
                            .toLowerCase()
                            .includes(input.toLowerCase())
                    }
                >
                    {operationalWorkflows.length > 0 ? (
                        operationalWorkflows.map((workflow) => (
                            <Option key={workflow.id} value={workflow.id}>
                                {workflow.workflowName}
                            </Option>
                        ))
                    ) : (
                        <Option disabled value="no-workflows">
                            Chưa có quy trình vận hành
                        </Option>
                    )}
                </Select>
            </Form.Item>

            <Form.Item
                name="consultantId"
                label="Tư vấn"
            >
                <Select
                    placeholder="Chọn tư vấn"
                    allowClear
                    showSearch
                    optionFilterProp="children"
                    suffixIcon={<UserOutlined className="text-gray-400" />}
                >
                    {memberOptions?.[ROLES.sales]?.map((opt: any) => (
                        <Option key={opt.value} value={opt.value}>
                            {opt.label}
                        </Option>
                    ))}
                </Select>
            </Form.Item>

            <Form.Item
                name="members"
                label="Thực hiện"
            >
                <Select
                    mode="multiple"
                    placeholder="Chọn người thực hiện"
                    showSearch
                    optionFilterProp="children"
                    suffixIcon={<TeamOutlined className="text-gray-400" />}
                >
                    {allStaffOptions.map((opt: any) => (
                        <Option key={opt.value} value={opt.value}>
                            {opt.label}
                        </Option>
                    ))}
                </Select>
            </Form.Item>

            <Form.Item
                name="deadline"
                label="Hạn chót"
            >
                <DatePicker
                    showTime
                    format="DD/MM/YYYY HH:mm"
                    placeholder="Chọn hạn chót"
                    className="w-full"
                    suffixIcon={<ClockCircleOutlined className="text-gray-400" />}
                />
            </Form.Item>

            {/* Danh sách công việc - Lấy từ Quy trình vận hành */}
            <div className="mt-4 pt-4 border-t border-gray-200">
                <div className="flex justify-between items-center mb-3">
                    <Text strong>Công việc</Text>
                    <Text type="secondary" className="text-xs">
                        (Tự động lấy từ Quy trình vận hành)
                    </Text>
                </div>
                <Form.List name="checklist">
                    {(fields, { add, remove }) => (
                        <div className="space-y-2">
                            {fields.length === 0 ? (
                                <div className="text-center py-4 text-gray-400 text-sm">
                                    Chọn Quy trình vận hành để tự động lấy danh sách công việc
                                </div>
                            ) : (
                                fields.map((field, index) => (
                                    <div
                                        key={field.key}
                                        className="flex items-center gap-2 p-2 bg-gray-50 rounded border border-gray-200"
                                    >
                                        <div className="flex-1">
                                            <Form.Item
                                                {...field}
                                                name={[field.name, "task_name"]}
                                                rules={[
                                                    {
                                                        required: true,
                                                        message: "Vui lòng nhập tên công việc!",
                                                    },
                                                ]}
                                                noStyle
                                            >
                                                <Input
                                                    placeholder="Nhập tên công việc..."
                                                    className="w-full"
                                                />
                                            </Form.Item>
                                        </div>
                                        <Button
                                            type="text"
                                            danger
                                            icon={<DeleteOutlined />}
                                            onClick={() => remove(field.name)}
                                            size="small"
                                        />
                                    </div>
                                ))
                            )}
                            <Button
                                type="dashed"
                                icon={<PlusOutlined />}
                                onClick={() => {
                                    add({
                                        id: `CV_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                                        task_name: "",
                                        task_order: fields.length + 1,
                                        checked: false,
                                    });
                                }}
                                block
                                className="mt-2"
                            >
                                Thêm công việc
                            </Button>
                        </div>
                    )}
                </Form.List>
            </div>
        </Form>
    );
};

const ProductCard: React.FC<
    ProductCardProps & { status: OrderStatus; mode?: string }
> = ({
    product,
    onUpdate,
    onRemove,
    staffOptions,
    workflowOptions,
    workflows,
    staff,
    departments,
    status,
    mode,
    memberOptions,
    processTemplates = [],
    operationalWorkflows = [],
}) => {
        // Make processTemplates available in the component scope
        const processTemplatesRef = React.useRef(processTemplates);
        React.useEffect(() => {
            processTemplatesRef.current = processTemplates;
        }, [processTemplates]);
        
        const router = useRouter();
        const { message, modal } = App.useApp();
        const [taskModalVisible, setTaskModalVisible] = useState(false);
        const [currentWorkflowIndex, setCurrentWorkflowIndex] = useState<number | null>(null);
        const [currentWorkflowId, setCurrentWorkflowId] = useState<string | null>(null);
        const [taskInput, setTaskInput] = useState("");
        const [editingTask, setEditingTask] = useState<{
            id: string;
            workflowIndex: number;
        } | null>(null);
        const [addWorkflowModalVisible, setAddWorkflowModalVisible] = useState(false);
        const [addWorkflowForm] = Form.useForm();
        const [expandedWorkflowId, setExpandedWorkflowId] = useState<string | null>(null);

        const allStaffOptions = useMemo(() => {
            const options: { value: string; label: string }[] = [];
            if (memberOptions) {
                Object.values(memberOptions).forEach((roleOptions: any) => {
                    if (Array.isArray(roleOptions)) {
                        options.push(...roleOptions);
                    }
                });
            } else if (staffOptions) {
                options.push(...staffOptions);
            }

            // Deduplicate
            const uniqueOptions: { value: string; label: string }[] = [];
            const seen = new Set();
            for (const opt of options) {
                if (!seen.has(opt.value)) {
                    seen.add(opt.value);
                    uniqueOptions.push(opt);
                }
            }
            return uniqueOptions;
        }, [memberOptions, staffOptions]);

        const addWorkflow = () => {
            if (!product) {
                console.error("Product is undefined");
                message.error("Không thể thêm quy trình: Sản phẩm không tồn tại");
                return;
            }
            addWorkflowForm.resetFields();
            setAddWorkflowModalVisible(true);
        };

        const handleAddWorkflowCancel = () => {
            setAddWorkflowModalVisible(false);
            addWorkflowForm.resetFields();
        };

        const handleAddWorkflowSubmit = async () => {
            try {
                const values = await addWorkflowForm.validateFields();
                const newWorkflowCode = `STAGE_${new Date().getTime()}`;
                
                // Get workflow names from selected workflow codes (from workflows list)
                const selectedWorkflowCodes = values.workflowCode || [];
                
                if (!selectedWorkflowCodes || selectedWorkflowCodes.length === 0) {
                    message.error("Vui lòng chọn ít nhất một quy trình!");
                    return;
                }
                
                // Get names from Operational Workflows (Quy trình vận hành)
                const selectedWorkflowNames = selectedWorkflowCodes
                    .map((code: string) => {
                        const operationalWorkflow = operationalWorkflows.find(w => w.id === code);
                        return operationalWorkflow?.workflowName;
                    })
                    .filter(Boolean) as string[];

                if (selectedWorkflowNames.length === 0) {
                    message.error("Không tìm thấy tên quy trình. Vui lòng kiểm tra lại!");
                    return;
                }

                // Process checklist - ensure each task has required fields
                const checklist = (values.checklist || []).map((task: any, index: number) => ({
                    id: task.id || `TASK_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                    task_name: task.task_name || "",
                    task_order: index + 1,
                    checked: false,
                })).filter((task: any) => task.task_name && task.task_name.trim() !== "");

                const newWorkflow: WorkflowData = {
                    id: newWorkflowCode,
                    workflowCode: selectedWorkflowCodes,
                    workflowName: selectedWorkflowNames,
                    members: values.members || [],
                    consultantId: values.consultantId,
                    isDone: false,
                    checklist: checklist,
                    deadline: values.deadline ? dayjs(values.deadline).valueOf() : undefined,
                } as any;

                const currentWorkflows = Array.isArray(product.workflows) ? product.workflows : [];
                
                // Thêm workflow mới vào đầu danh sách để dễ nhìn thấy
                const updatedWorkflows = [newWorkflow, ...currentWorkflows];
                
                const updatedProduct = {
                    ...product,
                    workflows: updatedWorkflows,
                };
                
                console.log("Adding new workflow:", {
                    productId: product.id,
                    workflowId: newWorkflow.id,
                    totalWorkflows: updatedWorkflows.length,
                    workflowCodes: selectedWorkflowCodes,
                    workflowNames: selectedWorkflowNames,
                    mode: mode,
                });
                
                onUpdate(updatedProduct);

                message.success("Đã thêm quy trình mới");
                handleAddWorkflowCancel();
                
                // Scroll đến workflow mới sau khi thêm (optional)
                setTimeout(() => {
                    const workflowElement = document.querySelector(`[data-workflow-id="${newWorkflowCode}"]`);
                    if (workflowElement) {
                        workflowElement.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
                    }
                }, 100);
            } catch (errorInfo) {
                console.error("Validation failed:", errorInfo);
                message.error("Vui lòng kiểm tra lại thông tin đã nhập!");
            }
        };

        const updateWorkflow = (
            workflowIndex: number,
            field: string,
            value: string | string[] | boolean | any[] | number | undefined,
        ) => {
            const updatedWorkflows = [...product.workflows];
            const currentWorkflow = updatedWorkflows[workflowIndex];

            if (field === "workflowCode" && Array.isArray(value)) {
                const selectedWorkflowCodes = value;
                
                // Get names from Operational Workflows (Quy trình vận hành)
                const selectedWorkflowNames = selectedWorkflowCodes
                    .map((code: string) => {
                        const operationalWorkflow = operationalWorkflows.find(w => w.id === code);
                        return operationalWorkflow?.workflowName;
                    })
                    .filter(Boolean) as string[];

                // Auto-load công việc from Operational Workflows
                let autoLoadedChecklist: any[] = [];
                
                selectedWorkflowCodes.forEach((code: string) => {
                    const operationalWorkflow = operationalWorkflows.find(w => w.id === code);
                    if (operationalWorkflow && operationalWorkflow.jobs) {
                        // Collect all công việc from jobs[] in this Operational Workflow
                        operationalWorkflow.jobs.forEach((job) => {
                            autoLoadedChecklist.push({
                                id: `CV_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                                task_name: job.jobName, // Lấy từ jobs[].jobName
                                task_order: autoLoadedChecklist.length + 1,
                                checked: false,
                            });
                        });
                    }
                });

                // When Operational Workflow is selected, always load công việc from Operational Workflow
                // If multiple Operational Workflows are selected, combine all công việc from all workflows
                const currentChecklist = currentWorkflow.checklist || [];
                
                // Determine final checklist:
                // - If Operational Workflow(s) selected and have công việc, use those công việc
                // - Otherwise, keep existing checklist if it has công việc
                // - Otherwise, use empty array
                let finalChecklist: any[] = [];
                if (autoLoadedChecklist.length > 0) {
                    // Use công việc from Operational Workflow(s)
                    finalChecklist = autoLoadedChecklist;
                } else if (currentChecklist.length > 0) {
                    // Keep existing checklist if no Operational Workflow công việc found
                    finalChecklist = currentChecklist;
                }

                updatedWorkflows[workflowIndex] = {
                    ...updatedWorkflows[workflowIndex],
                    workflowCode: selectedWorkflowCodes,
                    workflowName: selectedWorkflowNames,
                    members: currentWorkflow.members || [], // Keep existing members
                    checklist: finalChecklist, // Load công việc from Operational Workflow when selected
                };
            } else if (field === "checklist" && Array.isArray(value)) {
                // Special handling for checklist updates to ensure proper structure
                updatedWorkflows[workflowIndex] = {
                    ...updatedWorkflows[workflowIndex],
                    checklist: value,
                };
                console.log("Updating workflow checklist:", {
                    productId: product.id,
                    workflowIndex,
                    checklistLength: value.length,
                    checklistItems: value.map((t: any) => ({ id: t.id, name: t.task_name })),
                    mode: mode,
                });
            } else {
                updatedWorkflows[workflowIndex] = {
                    ...updatedWorkflows[workflowIndex],
                    [field]: value,
                };
            }
            
            const updatedProduct = { ...product, workflows: updatedWorkflows };
            console.log("Updating workflow:", {
                productId: product.id,
                workflowIndex,
                field,
                valueType: Array.isArray(value) ? `array[${value.length}]` : typeof value,
                mode: mode,
            });
            
            onUpdate(updatedProduct);
        };

        const removeWorkflow = (workflowIndex: number) => {
            const updatedWorkflows = product.workflows.filter(
                (_, index: number) => index !== workflowIndex,
            );
            
            const updatedProduct = { ...product, workflows: updatedWorkflows };
            console.log("Removing workflow:", {
                productId: product.id,
                workflowIndex,
                remainingWorkflows: updatedWorkflows.length,
                mode: mode,
            });
            
            onUpdate(updatedProduct);
        };

        const openTaskModal = (workflowIndex: number) => {
            if (!product.workflows || workflowIndex < 0 || workflowIndex >= product.workflows.length) {
                console.error("Invalid workflow index:", workflowIndex);
                return;
            }
            const workflow = product.workflows[workflowIndex];
            setCurrentWorkflowIndex(workflowIndex);
            setCurrentWorkflowId(workflow?.id || null);
            setTaskModalVisible(true);
        };

        const closeTaskModal = () => {
            setTaskModalVisible(false);
            setCurrentWorkflowIndex(null);
            setCurrentWorkflowId(null);
            setTaskInput("");
            setEditingTask(null);
        };

        const addTask = () => {
            if (!taskInput.trim()) {
                message.warning("Vui lòng nhập tên công việc!");
                return;
            }

            if (currentWorkflowIndex === null || !product.workflows) {
                message.error("Không tìm thấy quy trình để thêm công việc!");
                return;
            }

            // Find workflow by ID to ensure we get the latest version
            const workflowId = currentWorkflowId || product.workflows[currentWorkflowIndex]?.id;
            let workflowIndex = currentWorkflowIndex;
            
            // If we have a workflowId, try to find it in the current workflows
            if (workflowId) {
                const foundIndex = product.workflows.findIndex(w => w.id === workflowId);
                if (foundIndex !== -1) {
                    workflowIndex = foundIndex;
                }
            }
            
            // Validate workflow index
            if (workflowIndex < 0 || workflowIndex >= product.workflows.length) {
                console.error("Workflow not found:", workflowId, "at index:", workflowIndex);
                message.error("Không tìm thấy quy trình!");
                return;
            }

            const workflow = product.workflows[workflowIndex];
            if (!workflow) {
                console.error("Workflow is undefined at index:", workflowIndex);
                message.error("Quy trình không tồn tại!");
                return;
            }

            const existingChecklist = Array.isArray(workflow.checklist) ? workflow.checklist : [];
            const newTask = {
                id: `CV_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                task_name: taskInput.trim(),
                task_order: existingChecklist.length + 1,
                checked: false,
            };

            const updatedChecklist = [...existingChecklist, newTask];
            
            console.log("Adding task:", {
                productId: product.id,
                workflowIndex: workflowIndex,
                workflowId: workflowId,
                taskName: taskInput.trim(),
                totalTasks: updatedChecklist.length,
                currentChecklistLength: existingChecklist.length,
                mode: mode,
            });
            
            try {
                // Update workflow with new checklist
                updateWorkflow(workflowIndex, "checklist", updatedChecklist);
                
                // Clear input after successful update
                setTaskInput("");
                
                // Show success message
                message.success("Đã thêm công việc mới");
            } catch (error) {
                console.error("Error adding task:", error);
                message.error("Không thể thêm công việc. Vui lòng thử lại!");
            }
        };

        const removeTask = (workflowIndex: number, taskId: string) => {
            if (!product.workflows || workflowIndex < 0 || workflowIndex >= product.workflows.length) {
                console.error("Invalid workflow index in removeTask:", workflowIndex);
                return;
            }
            const workflow = product.workflows[workflowIndex];
            if (!workflow) {
                console.error("Workflow is undefined at index:", workflowIndex);
                return;
            }
            const existingChecklist = workflow.checklist || [];
            const updatedChecklist = existingChecklist
                .filter((task) => task.id !== taskId)
                .map((task, index) => ({
                    ...task,
                    task_order: index + 1,
                }));
            updateWorkflow(workflowIndex, "checklist", updatedChecklist);
        };

        const updateTask = (
            workflowIndex: number,
            taskId: string,
            updates: Partial<{
                task_name: string;
                assignedTo: string;
                assignedToName: string;
                estimatedDuration: number;
                durationUnit: "hours" | "days";
                deadline: number;
                description: string;
            }>,
        ) => {
            if (!product.workflows || workflowIndex < 0 || workflowIndex >= product.workflows.length) {
                console.error("Invalid workflow index in updateTask:", workflowIndex);
                return;
            }
            const workflow = product.workflows[workflowIndex];
            if (!workflow) {
                console.error("Workflow is undefined at index:", workflowIndex);
                return;
            }
            const existingChecklist = workflow.checklist || [];
            const updatedChecklist = existingChecklist.map((task) => {
                if (task.id === taskId) {
                    // Merge updates with existing task
                    const mergedTask = { ...task, ...updates };

                    // Calculate deadline if duration is provided
                    let deadline: number | undefined;
                    const finalDuration = mergedTask.estimatedDuration;
                    const finalDurationUnit = mergedTask.durationUnit;

                    if (finalDuration && finalDurationUnit) {
                        const now = Date.now();
                        if (finalDurationUnit === "hours") {
                            deadline = now + finalDuration * 60 * 60 * 1000;
                        } else if (finalDurationUnit === "days") {
                            deadline = now + finalDuration * 24 * 60 * 60 * 1000;
                        }
                    }

                    return {
                        ...mergedTask,
                        deadline: deadline || updates.deadline || task.deadline,
                    };
                }
                return task;
            });
            updateWorkflow(workflowIndex, "checklist", updatedChecklist);
            setEditingTask(null);
        };

        const updateProduct = (
            field: keyof ProductData,
            value: ProductData[keyof ProductData],
        ) => {
            onUpdate({ ...product, [field]: value });
        };

        return (
            <Card
                title={
                    <div className="flex items-center gap-2">
                        <Wrench className="text-gold-500 w-4 h-4" />
                        <Text strong>Mã sản phẩm: {product.id}</Text>
                    </div>
                }
                extra={
                    <Button
                        type="text"
                        danger
                        icon={<DeleteOutlined />}
                        onClick={onRemove}
                        className="hover:bg-red-50"
                    >
                        Xóa
                    </Button>
                }
                className="mb-4 shadow-sm border border-gray-200"
            >
                <div className="space-y-4">
                    {/* Product Basic Info */}
                    <Row gutter={16}>
                        <Col xs={24} sm={12} lg={8}>
                            <div className="space-y-2 flex flex-col">
                                <Text strong className="text-gray-700">
                                    Tên sản phẩm <Text type="danger">*</Text>
                                </Text>
                                <Input
                                    placeholder="VD: Túi Hermes Birkin 30cm"
                                    value={product.name}
                                    onChange={(e) =>
                                        updateProduct("name", e.target.value)
                                    }
                                    className="w-full"
                                    status={!product.name.trim() ? "error" : ""}
                                />
                                {!product.name.trim() && (
                                    <Text type="danger" className="text-xs">
                                        Vui lòng nhập tên sản phẩm
                                    </Text>
                                )}
                            </div>
                        </Col>
                        <Col xs={12} sm={6} lg={4}>
                            <div className="space-y-2 flex flex-col">
                                <Text strong className="text-gray-700">
                                    Số lượng <Text type="danger">*</Text>
                                </Text>
                                <InputNumber
                                    style={{ width: "100%" }}
                                    min={1}
                                    placeholder="1"
                                    value={product.quantity}
                                    onChange={(value) =>
                                        updateProduct("quantity", value || 1)
                                    }
                                    className="w-full"
                                    status={
                                        !product.quantity || product.quantity < 1
                                            ? "error"
                                            : ""
                                    }
                                />
                                {(!product.quantity || product.quantity < 1) && (
                                    <Text type="danger" className="text-xs">
                                        Số lượng phải lớn hơn 0
                                    </Text>
                                )}
                            </div>
                        </Col>
                        <Col xs={12} sm={6} lg={5}>
                            <div className="space-y-2 flex flex-col">
                                <Text strong className="text-gray-700">
                                    Giá đơn vị (VNĐ) <Text type="danger">*</Text>
                                </Text>
                                <InputNumber
                                    min={0}
                                    placeholder="0"
                                    value={product.price}
                                    onChange={(value) =>
                                        updateProduct("price", value || 0)
                                    }
                                    formatter={(value) =>
                                        `${value}`.replace(
                                            /\B(?=(\d{3})+(?!\d))/g,
                                            ",",
                                        )
                                    }
                                    parser={(value) => {
                                        const parsed = Number(
                                            value?.replace(/,/g, "") || 0,
                                        );
                                        return parsed as any;
                                    }}
                                    style={{ width: "100%" }}
                                    status={
                                        !product.price || product.price < 0
                                            ? "error"
                                            : ""
                                    }
                                />
                                {(!product.price || product.price < 0) && (
                                    <Text type="danger" className="text-xs">
                                        Vui lòng nhập giá sản phẩm
                                    </Text>
                                )}
                            </div>
                        </Col>
                        <Col xs={12} sm={6} lg={5}>
                            <div className="space-y-2 flex flex-col">
                                <Text strong className="text-gray-700">
                                    Tổng tiền
                                </Text>
                                <div className="p-2 bg-gray-50 rounded border border-gray-200">
                                    <Text strong className="text-lg text-primary">
                                        {((product.quantity || 0) * (product.price || 0)).toLocaleString("vi-VN")} VNĐ
                                    </Text>
                                </div>
                            </div>
                        </Col>
                    </Row>

                    {/* Product Images Upload */}
                    <div className="space-y-2 flex flex-col">
                        <Text strong className="text-gray-700">
                            Ảnh sản phẩm (để đối chiếu) <Text type="danger">*</Text>
                        </Text>
                        <Upload
                            listType="picture-card"
                            fileList={product.images}
                            beforeUpload={async (file, fileList) => {
                                try {
                                    if (fileList && fileList.length > 1) {
                                        const isLastFile =
                                            fileList.indexOf(file) ===
                                            fileList.length - 1;

                                        if (isLastFile) {
                                            const newFiles = [];

                                            for (const currentFile of fileList) {
                                                const base64 =
                                                    await getBase64(currentFile);
                                                newFiles.push({
                                                    uid: currentFile.uid,
                                                    name: currentFile.name,
                                                    status: "done" as const,
                                                    url: base64,
                                                    originFileObj: currentFile,
                                                });
                                            }

                                            const updatedImages = [
                                                ...product.images,
                                                ...newFiles,
                                            ];
                                            updateProduct("images", updatedImages);
                                            message.success(
                                                `Đã thêm ${fileList.length} ảnh`,
                                            );
                                        }
                                    } else {
                                        const base64 = await getBase64(file);
                                        const newFile = {
                                            uid: file.uid,
                                            name: file.name,
                                            status: "done" as const,
                                            url: base64,
                                            originFileObj: file,
                                        };

                                        const updatedImages = [
                                            ...product.images,
                                            newFile,
                                        ];
                                        updateProduct("images", updatedImages);
                                        message.success(`Đã thêm ảnh ${file.name}`);
                                    }
                                } catch (error) {
                                    message.error(
                                        `Không thể tải ${file.name} lên!`,
                                    );
                                    console.error("Upload error:", error);
                                }
                                return false;
                            }}
                            onRemove={(file) => {
                                const updatedImages = product.images.filter(
                                    (item: any) => item.uid !== file.uid,
                                );
                                updateProduct("images", updatedImages);
                                return true;
                            }}
                            multiple
                            accept="image/*"
                            className={
                                product.images.length === 0 ? "upload-error" : ""
                            }
                        >
                            {product.images.length >= 8 ? null : (
                                <div className="flex flex-col items-center justify-center p-2">
                                    <UploadOutlined className="text-xl mb-1" />
                                    <Text className="text-xs text-center">
                                        Tải ảnh
                                    </Text>
                                </div>
                            )}
                        </Upload>
                        {product.images.length === 0 && mode === "update" && (
                            <Text type="danger" className="text-xs">
                                Vui lòng tải lên ít nhất 1 ảnh sản phẩm
                            </Text>
                        )}
                    </div>

                    {/* Post-completion Images Upload */}
                    {status === OrderStatus.ON_HOLD && (
                        <div className="space-y-2 flex flex-col mt-4 p-4 border border-dashed border-yellow-500 rounded-lg bg-yellow-50">
                            <Text strong className="text-yellow-700">
                                Ảnh sau khi hoàn thiện <Text type="danger">*</Text>
                            </Text>
                            <Upload
                                listType="picture-card"
                                fileList={product.imagesDone}
                                beforeUpload={async (file) => {
                                    const base64 = await getBase64(file);
                                    const newFile = {
                                        uid: file.uid,
                                        name: file.name,
                                        status: "done" as const,
                                        url: base64,
                                        originFileObj: file,
                                    };
                                    updateProduct("imagesDone", [
                                        ...(product.imagesDone || []),
                                        newFile,
                                    ]);
                                    return false;
                                }}
                                onRemove={(file) => {
                                    const updatedImages = (
                                        product.imagesDone || []
                                    ).filter((item: any) => item.uid !== file.uid);
                                    updateProduct("imagesDone", updatedImages);
                                    return true;
                                }}
                                multiple
                                accept="image/*"
                            >
                                {product.imagesDone &&
                                    product.imagesDone.length >= 5 ? null : (
                                    <div className="flex flex-col items-center justify-center p-2">
                                        <UploadOutlined className="text-xl mb-1" />
                                        <Text className="text-xs text-center">
                                            Tải ảnh
                                        </Text>
                                    </div>
                                )}
                            </Upload>
                            {(!product.imagesDone ||
                                product.imagesDone.length === 0) && (
                                    <Text type="danger" className="text-xs">
                                        Vui lòng tải lên ảnh sau khi hoàn thiện.
                                    </Text>
                                )}
                        </div>
                    )}

                    <div className="flex items-center gap-2 my-4">
                        <div className="h-px bg-gray-200 flex-1"></div>
                        <Text strong className="text-primary px-3">
                            Quy trình dịch vụ <Text type="danger">*</Text>
                        </Text>
                        <div className="h-px bg-gray-200 flex-1"></div>
                    </div>

                    {/* Kanban Board View */}
                    <div className="mb-6">
                        <Row gutter={24}>
                            {/* Column 1: Active Workflows */}
                            <Col span={12} className="bg-gray-50 p-4 rounded-lg border border-gray-100 min-h-[400px]">
                                <div className="flex items-center justify-between mb-4">
                                    <Text strong className="text-lg">Đang thực hiện</Text>
                                    <Tag color="processing">{product.workflows.filter(w => !w.isDone).length}</Tag>
                                </div>
                                <div className="space-y-4">
                                    {product.workflows && product.workflows.length > 0 ? (
                                        product.workflows
                                            .map((workflow, index) => ({ ...workflow, originalIndex: index }))
                                            .filter(w => !w.isDone)
                                            .map((workflow) => (
                                                <Card
                                                key={workflow.id}
                                                data-workflow-id={workflow.id}
                                                size="small"
                                                title={
                                                    <div className="flex justify-between items-center gap-2">
                                                        <Tag color="blue">#{workflow.originalIndex + 1}</Tag>
                                                        <Text strong ellipsis className="max-w-[150px]">
                                                            {workflow.workflowName?.length
                                                                ? workflow.workflowName.join(", ")
                                                                : "Chưa chọn công đoạn"}
                                                        </Text>
                                                    </div>
                                                }
                                                extra={
                                                    <Space size={2}>
                                                        <Button
                                                            size="small"
                                                            type="text"
                                                            icon={<CheckOutlined className="text-green-600" />}
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                updateWorkflow(workflow.originalIndex, "isDone", true);
                                                            }}
                                                            title="Hoàn thành"
                                                        />
                                                        <Button
                                                            size="small"
                                                            type="text"
                                                            danger
                                                            icon={<DeleteOutlined />}
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                removeWorkflow(workflow.originalIndex);
                                                            }}
                                                            title="Xóa"
                                                        />
                                                    </Space>
                                                }
                                                className="shadow-sm hover:shadow-md transition-shadow"
                                                styles={{ body: { padding: '12px' } }}
                                            >
                                                <div className="space-y-3" onClick={(e) => e.stopPropagation()}>
                                                    {/* Quy trình */}
                                                    <div className="flex gap-2 mb-2">
                                                        <Select
                                                            mode="multiple"
                                                            maxTagCount={0}
                                                            maxTagPlaceholder={(omitted) => `+${omitted.length}`}
                                                            value={workflow.workflowCode}
                                                            placeholder="Quy trình vận hành"
                                                            onChange={(newValue) => {
                                                                // Update workflow
                                                                updateWorkflow(workflow.originalIndex, "workflowCode", newValue);
                                                            }}
                                                            onClick={(e) => e.stopPropagation()}
                                                            onMouseDown={(e) => e.stopPropagation()}
                                                            className="w-full"
                                                            size="small"
                                                            showSearch
                                                            filterOption={(input, option) =>
                                                                (option?.label ?? "")
                                                                    .toLowerCase()
                                                                    .includes(input.toLowerCase())
                                                            }
                                                            suffixIcon={<DeploymentUnitOutlined className="text-gray-400" />}
                                                        >
                                                            {operationalWorkflows.length > 0 ? (
                                                                operationalWorkflows.map((workflow) => (
                                                                    <Option key={workflow.id} value={workflow.id}>
                                                                        {workflow.workflowName}
                                                                    </Option>
                                                                ))
                                                            ) : (
                                                                <Option disabled value="no-workflows">
                                                                    Chưa có quy trình vận hành
                                                                </Option>
                                                            )}
                                                        </Select>
                                                    </div>

                                                    {/* Staff Selection Row */}
                                                    <Input.Group compact className="flex">
                                                        <Select
                                                            placeholder="Tư vấn"
                                                            value={workflow.consultantId}
                                                            onChange={(newValue) => updateWorkflow(workflow.originalIndex, "consultantId", newValue)}
                                                            onClick={(e) => e.stopPropagation()}
                                                            onMouseDown={(e) => e.stopPropagation()}
                                                            className="w-1/3"
                                                            size="small"
                                                            allowClear
                                                            showSearch
                                                            optionFilterProp="children"
                                                            suffixIcon={<UserOutlined className="text-gray-400" />}
                                                        >
                                                            {memberOptions?.[ROLES.sales]?.map((opt: any) => (
                                                                <Option key={opt.value} value={opt.value}>{opt.label}</Option>
                                                            ))}
                                                        </Select>
                                                        <Select
                                                            mode="multiple"
                                                            placeholder="Thực hiện"
                                                            value={workflow.members}
                                                            onChange={(newValue) => updateWorkflow(workflow.originalIndex, "members", newValue)}
                                                            onClick={(e) => e.stopPropagation()}
                                                            onMouseDown={(e) => e.stopPropagation()}
                                                            className="w-2/3"
                                                            size="small"
                                                            maxTagCount={1}
                                                            showSearch
                                                            optionFilterProp="children"
                                                            suffixIcon={<TeamOutlined className="text-gray-400" />}
                                                        >
                                                            {allStaffOptions.map((opt: any) => (
                                                                <Option key={opt.value} value={opt.value}>{opt.label}</Option>
                                                            ))}
                                                        </Select>
                                                    </Input.Group>

                                                    {/* Deadline & Actions & Checklist - 2 cột song song */}
                                                    <Row gutter={12}>
                                                        {/* Cột 1: Deadline & Actions */}
                                                        <Col span={12}>
                                                            <div className="space-y-2">
                                                                <DatePicker
                                                                    showTime
                                                                    format="DD/MM HH:mm"
                                                                    placeholder="Hạn chót"
                                                                    value={workflow.deadline ? dayjs(workflow.deadline) : undefined}
                                                                    onChange={(date) => updateWorkflow(workflow.originalIndex, "deadline", date ? date.valueOf() : undefined)}
                                                                    onClick={(e) => e.stopPropagation()}
                                                                    onMouseDown={(e) => e.stopPropagation()}
                                                                    className="w-full"
                                                                    size="small"
                                                                    suffixIcon={<ClockCircleOutlined className="text-gray-400" />}
                                                                />
                                                                
                                                                <div className="flex items-center gap-2">
                                                                    <Button
                                                                        type="dashed"
                                                                        size="small"
                                                                        onClick={(e) => {
                                                                            e.stopPropagation();
                                                                            openTaskModal(workflow.originalIndex);
                                                                        }}
                                                                        className="flex items-center gap-1 text-xs px-2 flex-1"
                                                                    >
                                                                        <UnorderedListOutlined />
                                                                        {workflow.checklist?.filter((t: any) => t.checked).length || 0}/{workflow.checklist?.length || 0}
                                                                    </Button>

                                                                    <Button
                                                                        type="link"
                                                                        size="small"
                                                                        onClick={(e) => {
                                                                            e.stopPropagation();
                                                                            router.push("/technician/workflows");
                                                                        }}
                                                                        className="flex items-center gap-1 text-xs px-2"
                                                                        title="Xem quy trình"
                                                                    >
                                                                        <DeploymentUnitOutlined />
                                                                        Kanban
                                                                    </Button>
                                                                </div>
                                                            </div>
                                                        </Col>

                                                        {/* Cột 2: Checklist Preview */}
                                                        <Col span={12}>
                                                            {Array.isArray(workflow.checklist) && workflow.checklist.length > 0 ? (
                                                                <div className="flex flex-col gap-1">
                                                                    {workflow.checklist.map((task: any) => (
                                                                        <div key={task.id} className="flex items-center gap-2 text-xs">
                                                                            {task.checked ? <CheckCircleOutlined className="text-green-600" /> : <div className="w-3 h-3 rounded-full border border-gray-300" />}
                                                                            <Text type={task.checked ? "secondary" : undefined} delete={task.checked} className={task.checked ? "" : "text-gray-600"}>
                                                                                {task.task_name}
                                                                            </Text>
                                                                        </div>
                                                                    ))}
                                                                </div>
                                                            ) : (
                                                                <div className="text-xs text-gray-400 flex items-center h-full">
                                                                    Chưa có công việc
                                                                </div>
                                                            )}
                                                        </Col>
                                                    </Row>
                                                </div>
                                            </Card>
                                        ))
                                    ) : (
                                        <div className="text-center py-8 text-gray-400 text-sm">
                                            Chưa có quy trình nào. Nhấn "Thêm quy trình" để bắt đầu.
                                        </div>
                                    )}

                                    <Button
                                        type="dashed"
                                        block
                                        icon={<PlusOutlined />}
                                        onClick={addWorkflow}
                                        className="mt-4 border-blue-300 text-primary hover:border-blue-500 hover:text-primary h-12"
                                    >
                                        Thêm quy trình
                                    </Button>
                                </div>
                            </Col>

                            {/* Column 2: Completed Workflows */}
                            <Col span={12} className="bg-green-50 p-4 rounded-lg border border-green-100 min-h-[400px]">
                                <div className="flex items-center justify-between mb-4">
                                    <Text strong className="text-lg text-green-700">Đã hoàn thành</Text>
                                    <Tag color="success">{(product.workflows || []).filter(w => w.isDone).length}</Tag>
                                </div>
                                <div className="space-y-4">
                                    {product.workflows && product.workflows.length > 0 ? (
                                        product.workflows.map((workflow, index) => ({ ...workflow, originalIndex: index }))
                                            .filter(w => w.isDone)
                                            .map((workflow) => (
                                            <Card
                                                key={workflow.id}
                                                size="small"
                                                className="opacity-75 shadow-sm hover:opacity-100 transition-all border-green-200"
                                                title={
                                                    <div className="flex justify-between items-center gap-2">
                                                        <Tag color="green">#{workflow.originalIndex + 1}</Tag>
                                                        <Text delete type="secondary" ellipsis className="max-w-[200px]">
                                                            {workflow.workflowName?.join(", ")}
                                                        </Text>
                                                    </div>
                                                }
                                                extra={
                                                    <Space>
                                                        <Button
                                                            size="small"
                                                            type="text"
                                                            icon={<EditOutlined />}
                                                            onClick={() => openTaskModal(workflow.originalIndex)}
                                                            title="Chỉnh sửa chi tiết"
                                                        />
                                                        <Button
                                                            size="small"
                                                            type="text"
                                                            icon={<UndoOutlined />}
                                                            onClick={() => updateWorkflow(workflow.originalIndex, "isDone", false)}
                                                            title="Hoàn tác"
                                                        />
                                                        <Button
                                                            size="small"
                                                            type="text"
                                                            danger
                                                            icon={<DeleteOutlined />}
                                                            onClick={() => removeWorkflow(workflow.originalIndex)}
                                                            title="Xóa"
                                                        />
                                                    </Space>
                                                }
                                            >
                                                <div className="space-y-2">
                                                    <div className="flex justify-between text-xs text-gray-500">
                                                        <span>{departments[workflow.departmentCode]?.name}</span>
                                                        <span>{workflow.checklist?.filter((t: any) => t.checked).length}/{workflow.checklist?.length} tasks</span>
                                                    </div>
                                                    <div className="text-xs">
                                                        <Text strong>Thực hiện: </Text>
                                                        {workflow.members?.map(m => staff[m]?.name).join(", ")}
                                                    </div>

                                                    {/* Checklist Preview */}
                                                    {workflow.checklist && workflow.checklist.length > 0 && (
                                                        <div className="mt-2 pt-2 border-t border-gray-200">
                                                            <div className="flex flex-col gap-1">
                                                                {workflow.checklist.map((task: any) => (
                                                                    <div key={task.id} className="flex items-center gap-2 text-xs">
                                                                        <CheckCircleOutlined className={task.checked ? "text-green-600" : "text-gray-300"} />
                                                                        <Text type="secondary" delete={task.checked}>
                                                                            {task.task_name}
                                                                        </Text>
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>
                                            </Card>
                                        ))
                                    ) : (
                                        <div className="text-center py-8 text-gray-400 text-sm">
                                            Chưa có công đoạn hoàn thành
                                        </div>
                                    )}
                                </div>
                            </Col>
                        </Row>
                    </div>

                    {/* Task Management Modal */}
                    <Modal
                        title="Quản lý công việc"
                        open={taskModalVisible}
                        onCancel={closeTaskModal}
                        footer={null}
                        width={700}
                    >
                        {(() => {
                            // Find workflow by ID to ensure we get the latest version
                            if (!product.workflows || currentWorkflowIndex === null) {
                                return null;
                            }
                            
                            const workflowId = currentWorkflowId || product.workflows[currentWorkflowIndex]?.id;
                            const workflow = workflowId 
                                ? product.workflows.find(w => w.id === workflowId)
                                : product.workflows[currentWorkflowIndex];
                            
                            if (!workflow) return null;
                            
                            const workflowIndex = product.workflows.findIndex(w => w.id === workflow.id);
                            
                            if (workflowIndex === -1) {
                                console.error("Workflow index not found for workflow:", workflow.id);
                                return null;
                            }
                            
                            return (
                                <div className="space-y-4">
                                    <div>
                                        <Text strong>
                                            Công đoạn:{" "}
                                            {workflow.workflowName?.join(", ") ||
                                                `Công đoạn ${workflowIndex + 1}`}
                                        </Text>
                                    </div>

                                    {/* Add Task Input */}
                                    <div className="flex gap-2">
                                        <Input
                                            placeholder="Nhập tên công việc..."
                                            value={taskInput}
                                            onChange={(e) =>
                                                setTaskInput(e.target.value)
                                            }
                                            onPressEnter={addTask}
                                        />
                                        <Button
                                            type="primary"
                                            icon={<PlusOutlined />}
                                            onClick={addTask}
                                            disabled={!taskInput.trim()}
                                        >
                                            Thêm
                                        </Button>
                                    </div>

                                    {/* Tasks List */}
                                    <div className="max-h-[400px] overflow-y-auto">
                                        {workflow.checklist && workflow.checklist.length > 0 ? (
                                            <div className="space-y-2">
                                                {workflow.checklist.map((task) => {
                                                    const isEditing =
                                                        editingTask?.id === task.id &&
                                                        editingTask?.workflowIndex ===
                                                        workflowIndex;
                                                    return (
                                                        <Card
                                                            key={task.id}
                                                            size="small"
                                                            className="shadow-sm"
                                                        >
                                                            {isEditing ? (
                                                                <TaskEditForm
                                                                    task={task}
                                                                    staff={staff}
                                                                    departmentCode={
                                                                        workflow.departmentCode
                                                                    }
                                                                    onSave={(
                                                                        updates,
                                                                    ) => {
                                                                        updateTask(
                                                                            workflowIndex,
                                                                            task.id,
                                                                            updates,
                                                                        );
                                                                    }}
                                                                    onCancel={() =>
                                                                        setEditingTask(
                                                                            null,
                                                                        )
                                                                    }
                                                                />
                                                            ) : (
                                                                <TaskDisplayView
                                                                    task={task}
                                                                    membersMap={
                                                                        staff
                                                                    }
                                                                    onEdit={() =>
                                                                        setEditingTask(
                                                                            {
                                                                                id: task.id,
                                                                                workflowIndex:
                                                                                    workflowIndex,
                                                                            },
                                                                        )
                                                                    }
                                                                    onDelete={() =>
                                                                        removeTask(
                                                                            workflowIndex,
                                                                            task.id,
                                                                        )
                                                                    }
                                                                />
                                                            )}
                                                        </Card>
                                                    );
                                                })}
                                            </div>
                                        ) : (
                                            <Empty
                                                description="Chưa có công việc nào"
                                                image={Empty.PRESENTED_IMAGE_SIMPLE}
                                            />
                                        )}
                                    </div>
                                </div>
                            );
                        })()}
                    </Modal>

                    {/* Add Workflow Modal */}
                    <Modal
                        title="Thêm quy trình mới"
                        open={addWorkflowModalVisible}
                        onCancel={handleAddWorkflowCancel}
                        onOk={handleAddWorkflowSubmit}
                        okText="Thêm"
                        cancelText="Hủy"
                        width={600}
                        destroyOnClose
                    >
                        <AddWorkflowForm
                            form={addWorkflowForm}
                            departments={departments}
                            workflows={workflows}
                            memberOptions={memberOptions}
                            allStaffOptions={allStaffOptions}
                            product={product}
                            processTemplates={processTemplates}
                            operationalWorkflows={operationalWorkflows}
                        />
                    </Modal>
                </div>
            </Card >
        );
    };

interface ChildHandle {
    onResetForm: () => void;
}

const OrderForm = forwardRef<ChildHandle, OrderFormProps>(
    ({ mode, orderCode, onSuccess, onCancel }, ref) => {
        const router = useRouter();
        const [form] = Form.useForm();
        const [products, setProducts] = useState<ProductData[]>([]);
        const [staff, setStaff] = useState<FirebaseStaff>({});
        const [workflows, setWorkflows] = useState<FirebaseWorkflows>({});
        const [departments, setDepartments] = useState<FirebaseDepartments>({});
        const [customers, setCustomers] = useState<FirebaseCustomers>({});
        const [customerGroups, setCustomerGroups] =
            useState<FirebaseCustomerGroups>({});
        const [provinces, setProvinces] = useState<Province[]>([]);
        const [customerType, setCustomerType] = useState<"new" | "existing">(
            "new",
        );
        const [loading, setLoading] = useState(true);
        const [submitting, setSubmitting] = useState(false);
        const [payments, setPayments] = useState<PaymentInfo[]>([]);
        const [returns, setReturns] = useState<ReturnInfo[]>([]);
        const [currentOrderData, setCurrentOrderData] = useState<FirebaseOrderData | null>(null);
        const [processTemplates, setProcessTemplates] = useState<ProcessTemplate[]>([]);
        const [operationalWorkflows, setOperationalWorkflows] = useState<OperationalWorkflow[]>([]);
        const [services, setServices] = useState<FirebaseServices>({});
        const [serviceModalVisible, setServiceModalVisible] = useState(false);
        const [searchServiceTerm, setSearchServiceTerm] = useState("");
        const isSavingRef = useRef(false); // Track if we're currently saving to Firebase
        const { user } = useUser();
        const { message, modal } = App.useApp();
        const firebaseApp = useFirebaseApp();

        useEffect(() => {
            if (mode === "update") {
                setCustomerType("existing");
            }
        }, [mode]);

        // Load provinces data
        useEffect(() => {
            const loadProvinces = async () => {
                try {
                    const response = await fetch(
                        "https://provinces.open-api.vn/api/?depth=3",
                    );
                    if (!response.ok) {
                        throw new Error(
                            `HTTP error! status: ${response.status}`,
                        );
                    }
                    const data = await response.json();
                    if (Array.isArray(data)) {
                        setProvinces(data);
                    }
                } catch (error) {
                    console.error("Error loading provinces:", error);
                }
            };
            loadProvinces();
        }, []);

        // Calculate total amount and update form when dependencies change
        const totalAmount = React.useMemo(() => {
            const subtotal = products.reduce(
                (sum, product) => sum + product.quantity * product.price,
                0,
            );
            const discount = form.getFieldValue("discount") || 0;
            const discountType =
                form.getFieldValue("discountType") || DiscountType.Amount;
            const shippingFee = form.getFieldValue("shippingFee") || 0;
            const discountAmount =
                discountType === DiscountType.Percentage
                    ? (subtotal * discount) / 100
                    : discount;
            return subtotal - discountAmount + shippingFee;
        }, [products, form]);

        // Update form field when total changes
        React.useEffect(() => {
            form.setFieldsValue({ totalAmount });
        }, [totalAmount, form]);

        const handleResetForm = () => {
            form.resetFields();
            // Auto-fill current user again for create mode
            if (mode === "create" && user) {
                setProducts([]);
                form.setFieldsValue({
                    createdBy: user.uid,
                    createdByName: user.displayName,
                    code: genCode("ORD_"),
                    orderDate: dayjs(),
                });
            } else {
                populateFormWithOrderData(orderDataRef.current);
            }
        };

        useImperativeHandle(
            ref,
            () => ({
                onResetForm: handleResetForm,
            }),
            [],
        );

        // Populate form with existing order data
        const populateFormWithOrderData = useCallback((orderData: FirebaseOrderData) => {
            console.log("populateFormWithOrderData called with:", orderData);
            try {
                const formValues = {
                    code: orderData.code,
                    customerName: orderData.customerName,
                    phone: orderData.phone,
                    address: orderData.address,
                    customerSource: orderData.customerSource,
                    orderDate: orderData.orderDate ? dayjs(orderData.orderDate) : null,
                    deliveryDate: orderData.deliveryDate ? dayjs(orderData.deliveryDate) : null,
                    createdBy: orderData.createdBy,
                    consultantId: orderData.consultantId,
                    consultantName: orderData.consultantName,
                    notes: orderData.notes || "",
                    discount: orderData.discount || 0,
                    discountType: orderData.discountType || DiscountType.Amount,
                    shippingFee: orderData.shippingFee || 0,
                    status: orderData.status || OrderStatus.CONFIRMED,
                    totalAmount: orderData.totalAmount,
                    deposit: orderData.deposit || 0,
                    depositType: orderData.depositType || DiscountType.Percentage,
                    isDepositPaid: orderData.isDepositPaid || false,
                    issues: orderData.issues || [],
                };
                console.log("Setting form values:", formValues);
                form.setFieldsValue(formValues);
                console.log("Form values set successfully");
            } catch (error) {
                console.error("Error populating form:", error);
            }

            // Convert products data back to form format
            const productsArray = Object.entries(orderData.products || {}).map(
                ([productId, productData]: [string, FirebaseProductData]) => ({
                    id: productId,
                    name: productData.name,
                    quantity: productData.quantity,
                    price: productData.price || 0,
                    images:
                        productData.images?.map((img: any, index: number) => ({
                            uid: img.uid || `img-${index}`,
                            name: img.name || `image-${index}`,
                            url: img.url,
                            firebaseUrl: img.url,
                        })) || [],
                    imagesDone:
                        productData.imagesDone?.map(
                            (img: any, index: number) => ({
                                uid: img.uid || `img-done-${index}`,
                                name: img.name || `image-done-${index}`,
                                url: img.url,
                                firebaseUrl: img.url,
                            }),
                        ) || [],
                    workflows: Object.entries(productData.workflows || {}).map(
                        ([workflowId, workflowData]: [
                            string,
                            FirebaseWorkflowData,
                        ]) => {
                            // Build workflow object, only including defined fields
                            const workflow: any = {
                                id: workflowId,
                                workflowCode: workflowData.workflowCode || [],
                                workflowName: workflowData.workflowName || [],
                                members: workflowData.members || [],
                                isDone: workflowData.isDone || false,
                                checklist: workflowData.checklist || [],
                            };
                            // Only include optional fields if they exist
                            if (workflowData.departmentCode !== undefined && workflowData.departmentCode !== null) {
                                workflow.departmentCode = workflowData.departmentCode;
                            }
                            if (workflowData.consultantId !== undefined && workflowData.consultantId !== null) {
                                workflow.consultantId = workflowData.consultantId;
                            }
                            if (workflowData.deadline !== undefined && workflowData.deadline !== null) {
                                workflow.deadline = workflowData.deadline;
                            }
                            return workflow;
                        },
                    ),
                    processTemplateIds: [],
                }),
            );

            console.log("📥 Received products from Firebase:", {
                productCount: productsArray.length,
                isSaving: isSavingRef.current,
                workflows: productsArray.map(p => ({
                    id: p.id,
                    workflowCount: p.workflows?.length || 0,
                    tasks: p.workflows?.map(w => ({
                        id: w.id,
                        checklistCount: w.checklist?.length || 0,
                    })),
                })),
            });

            // Don't overwrite local state if we're in the middle of saving
            if (!isSavingRef.current) {
                setProducts(productsArray);
            } else {
                console.log("⏸️ Skipping setProducts because save is in progress");
            }

            // Load payments
            if (orderData.payments) {
                setPayments(orderData.payments);
            } else {
                setPayments([]);
            }

            // Load returns
            if (orderData.returns) {
                setReturns(orderData.returns);
            } else {
                setReturns([]);
            }
        }, [form, isSavingRef]);

        const memberOptions = groupMembersByRole(staff);

        const allStaffOptions = useMemo(() => {
            const options: { value: string; label: string }[] = [];
            if (memberOptions) {
                Object.values(memberOptions).forEach((roleOptions: any) => {
                    if (Array.isArray(roleOptions)) {
                        options.push(...roleOptions);
                    }
                });
            }

            // Deduplicate
            const uniqueOptions: { value: string; label: string }[] = [];
            const seen = new Set();
            for (const opt of options) {
                if (!seen.has(opt.value)) {
                    seen.add(opt.value);
                    uniqueOptions.push(opt);
                }
            }
            return uniqueOptions;
        }, [memberOptions]);

        const workflowOptions = Object.entries(workflows).map(
            ([id, workflow]) => ({
                value: id,
                label: (workflow as Workflow).name,
            }),
        );

        const orderDataRef = useRef<any>(null);

        const addProduct = () => {
            // Mở modal chọn dịch vụ
            setServiceModalVisible(true);
        };

        const handleSelectService = (serviceCode: string) => {
            const service = services[serviceCode];
            if (!service) return;

            const newProductId = genCode("PRO_");
            
            // Tự động tạo workflows từ operationalWorkflowIds của dịch vụ
            const autoWorkflows: WorkflowData[] = [];
            if (service.operationalWorkflowIds && service.operationalWorkflowIds.length > 0) {
                service.operationalWorkflowIds.forEach((workflowId: string) => {
                    const operationalWorkflow = operationalWorkflows.find(w => w.id === workflowId);
                    if (operationalWorkflow) {
                        // Tạo checklist từ jobs của operational workflow
                        const checklist = operationalWorkflow.jobs?.map((job, index) => ({
                            id: `CV_${Date.now()}_${Math.random().toString(36).substr(2, 9)}_${index}`,
                            task_name: job.jobName || "",
                            task_order: index + 1,
                            checked: false,
                        })) || [];

                        const workflow: WorkflowData = {
                            id: genCode("WF_"),
                            workflowCode: [workflowId],
                            workflowName: [operationalWorkflow.workflowName || ""],
                            members: [],
                            isDone: false,
                            checklist: checklist,
                        };
                        autoWorkflows.push(workflow);
                    }
                });
            }

            const newProduct: ProductData = {
                id: newProductId,
                name: service.name,
                quantity: 1,
                price: service.sellingPrice || 0,
                images: [],
                imagesDone: [],
                workflows: autoWorkflows,
                processTemplateIds: [],
            };
            products.unshift(newProduct);
            setProducts([...products]);
            setServiceModalVisible(false);
            setSearchServiceTerm("");
        };

        // Save workflow changes to Firebase immediately in update mode
        const saveWorkflowToFirebase = useCallback(async (productId: string, productWorkflows: WorkflowData[]) => {
            if (mode !== "update" || !orderCode || !firebaseApp) {
                console.log("Skipping Firebase save:", { mode, orderCode: !!orderCode, firebaseApp: !!firebaseApp });
                return;
            }
            
            try {
                isSavingRef.current = true;
                
                const database = getDatabase(firebaseApp);
                const now = Date.now();
                
                // Convert workflows to Firebase format
                const firebaseWorkflows: Record<string, FirebaseWorkflowData> = productWorkflows.reduce(
                    (acc, workflow) => {
                        // Get workflow names from both old workflows and operationalWorkflows
                        const workflowNames = workflow.workflowCode
                            .map((code) => {
                                // First try operational workflows
                                const operationalWorkflow = operationalWorkflows.find(w => w.id === code);
                                if (operationalWorkflow) {
                                    return operationalWorkflow.workflowName;
                                }
                                // Fallback to old workflows
                                return workflows[code]?.name;
                            })
                            .filter(Boolean) as string[];
                        
                        const workflowChecklist = workflow.checklist || [];
                        
                        // Build workflow data object, excluding undefined values (Firebase doesn't accept undefined)
                        const workflowData: any = {
                            workflowCode: workflow.workflowCode || [],
                            workflowName: workflowNames.length > 0 ? workflowNames : workflow.workflowName || [],
                            members: workflow.members || [],
                            isDone: workflow.isDone || false,
                            checklist: workflowChecklist,
                            updatedAt: now,
                        };
                        
                        // Only add optional fields if they are defined (Firebase doesn't accept undefined)
                        if (workflow.departmentCode !== undefined && workflow.departmentCode !== null) {
                            workflowData.departmentCode = workflow.departmentCode;
                        }
                        if (workflow.consultantId !== undefined && workflow.consultantId !== null) {
                            workflowData.consultantId = workflow.consultantId;
                        }
                        if (workflow.deadline !== undefined && workflow.deadline !== null) {
                            workflowData.deadline = workflow.deadline;
                        }
                        
                        acc[workflow.id] = workflowData;
                        
                        console.log("Converting workflow to Firebase format:", {
                            workflowId: workflow.id,
                            checklistCount: workflowChecklist.length,
                            checklistItems: workflowChecklist.map((t: any) => ({ id: t.id, name: t.task_name })),
                            hasDeadline: workflow.deadline !== undefined && workflow.deadline !== null,
                        });
                        
                        return acc;
                    },
                    {} as Record<string, FirebaseWorkflowData>
                );
                
                console.log("🔄 Saving workflows to Firebase:", {
                    productId,
                    workflowCount: Object.keys(firebaseWorkflows).length,
                    totalTasks: Object.values(firebaseWorkflows).reduce((sum, w) => sum + (w.checklist?.length || 0), 0),
                    path: `xoxo/orders/${orderCode}/products/${productId}`,
                });
                
                // Update the product's workflows in Firebase
                const productRef = dbRef(
                    database,
                    `xoxo/orders/${orderCode}/products/${productId}`
                );
                
                // Update only the workflows field
                await update(productRef, {
                    workflows: firebaseWorkflows
                });
                
                console.log("✅ Successfully saved workflows to Firebase");
                
                // Wait a bit before allowing Firebase listener to update state again
                setTimeout(() => {
                    isSavingRef.current = false;
                    console.log("🔓 Released save lock");
                }, 500);
            } catch (error) {
                isSavingRef.current = false;
                console.error("❌ Error saving workflow to Firebase:", error);
                throw error; // Re-throw to be caught in updateProduct
            }
        }, [mode, orderCode, firebaseApp, workflows, operationalWorkflows]);

        const updateProduct = (index: number, updatedProduct: ProductData) => {
            // Find product by ID to ensure we update the correct one
            const productIndex = products.findIndex(p => p.id === updatedProduct.id);
            const actualIndex = productIndex !== -1 ? productIndex : index;
            
            const updatedProducts = [...products];
            updatedProducts[actualIndex] = updatedProduct;
            setProducts(updatedProducts);
            
            console.log("updateProduct called:", {
                providedIndex: index,
                actualIndex,
                productId: updatedProduct.id,
                workflowCount: updatedProduct.workflows?.length || 0,
                mode,
                orderCode: !!orderCode,
                firebaseApp: !!firebaseApp,
            });
            
            // Save workflow changes to Firebase immediately if in update mode
            if (mode === "update" && updatedProduct.workflows && orderCode && firebaseApp) {
                console.log("Saving workflows to Firebase:", {
                    productId: updatedProduct.id,
                    workflowCount: updatedProduct.workflows.length,
                    orderCode,
                });
                saveWorkflowToFirebase(updatedProduct.id, updatedProduct.workflows)
                    .then(() => {
                        console.log("✅ Workflows saved successfully to Firebase");
                    })
                    .catch((error) => {
                        console.error("❌ Failed to save workflows to Firebase:", error);
                        message.error("Không thể lưu thao tác. Vui lòng thử lại!");
                    });
            } else {
                console.warn("⚠️ Skipping Firebase save. Check console for details:", {
                    mode,
                    hasWorkflows: !!updatedProduct.workflows,
                    hasOrderCode: !!orderCode,
                    hasFirebaseApp: !!firebaseApp,
                });
                
                // If not in update mode, warn user
                if (mode !== "update") {
                    console.warn("Not in update mode. Changes will be saved when you submit the form.");
                }
            }
        };

        const removeProduct = (index: number) => {
            setProducts(products.filter((_, i) => i !== index));
        };

        const uploadImageToFirebase = async (
            file: File,
            productId: string,
            imageIndex: number,
        ): Promise<string> => {
            const storage = getStorage();
            const fileName = `orders/${new Date().getTime()}_${productId}_${imageIndex}_${file.name
                }`;
            const storageReference = storageRef(storage, fileName);

            const snapshot = await uploadBytes(storageReference, file);
            return await getDownloadURL(snapshot.ref);
        };

        const onFinish = async (values: FormValues) => {
            // --- VALIDATION ---
            if (products.length === 0) {
                message.warning("Vui lòng thêm ít nhất một sản phẩm!");
                return;
            }

            if (
                values.discountType === DiscountType.Percentage &&
                (values.discount || 0) > 100
            ) {
                message.warning(
                    "Giảm giá theo phần trăm không được vượt quá 100%!",
                );
                return;
            }

            const status = values.status || OrderStatus.CONFIRMED;

            // Validate products
            for (const product of products) {
                if (!product.name.trim()) {
                    message.warning(
                        `Vui lòng nhập tên cho sản phẩm ${product.id}!`,
                    );
                    return;
                }
                if (!product.quantity || product.quantity < 1) {
                    message.warning(
                        `Vui lòng nhập số lượng hợp lệ cho sản phẩm ${product.id}!`,
                    );
                    return;
                }
                if (!product.price || product.price < 0) {
                    message.warning(
                        `Vui lòng nhập giá hợp lệ cho sản phẩm ${product.id}!`,
                    );
                    return;
                }
                // Image validation based on status
                if (
                    mode === "update" &&
                    status !== OrderStatus.PENDING &&
                    product.images.length === 0
                ) {
                    message.warning(
                        `Vui lòng tải lên ít nhất 1 ảnh cho sản phẩm ${product.id} vì đơn hàng không ở trạng thái "Chờ xử lý".`,
                    );
                    return;
                }
                if (product.workflows.length === 0) {
                    message.warning(
                        `Sản phẩm ${product.id} phải có ít nhất một công đoạn!`,
                    );
                    return;
                }
                for (const workflow of product.workflows) {
                    if (
                        !workflow.workflowCode ||
                        workflow.workflowCode.length === 0
                    ) {
                        message.warning(
                            `Vui lòng chọn công đoạn cho tất cả các bước trong sản phẩm ${product.id}!`,
                        );
                        return;
                    }
                }
            }

            // Confirmed status validation
            const totals = calculateOrderTotals(
                products,
                values.discount,
                values.discountType,
                values.shippingFee,
            );
            const depositValue = values.deposit || 0;
            const depositType = values.depositType || DiscountType.Percentage;
            const depositAmount =
                depositType === DiscountType.Percentage
                    ? (totals.total * depositValue) / 100
                    : depositValue;

            if (status === OrderStatus.CONFIRMED && depositAmount <= 0) {
                message.warning(
                    'Đơn hàng "Đã xác nhận" phải có số tiền cọc lớn hơn 0.',
                );
                return;
            }

            setSubmitting(true);
            const database = getDatabase();
            let customerCodeToSave =
                mode === "update"
                    ? orderDataRef.current?.customerCode
                    : values.customerCode;

            try {
                // New Customer Validation and Creation
                if (customerType === "new") {
                    const existingCustomerByPhone = Object.values(
                        customers,
                    ).find((c) => c.phone === values.phone);
                    
                    if (existingCustomerByPhone) {
                        // SĐT đã tồn tại - tự động liên kết với khách hàng đó
                        customerCodeToSave = existingCustomerByPhone.code;
                        
                        // Cập nhật thông tin khách hàng nếu có thay đổi
                        const customerUpdates: Partial<Customer> = {
                            updatedAt: new Date().getTime(),
                        };
                        
                        // Cập nhật tên nếu khác
                        if (values.customerName && values.customerName.trim() !== existingCustomerByPhone.name) {
                            customerUpdates.name = values.customerName;
                        }
                        
                        // Cập nhật địa chỉ nếu khác
                        if (values.address && values.address.trim() !== existingCustomerByPhone.address) {
                            customerUpdates.address = values.address;
                        }
                        
                        // Cập nhật nguồn khách hàng nếu khác
                        if (values.customerSource && values.customerSource !== existingCustomerByPhone.customerSource) {
                            customerUpdates.customerSource = values.customerSource;
                        }
                        
                        // Chỉ cập nhật nếu có thay đổi
                        if (Object.keys(customerUpdates).length > 1) { // > 1 vì luôn có updatedAt
                            const customerRef = dbRef(
                                database,
                                `xoxo/customers/${existingCustomerByPhone.code}`,
                            );
                            await update(customerRef, customerUpdates);
                        }
                        
                        // Cập nhật form với customerCode
                        form.setFieldValue("customerCode", existingCustomerByPhone.code);
                        
                        message.success(
                            `Đã tự động liên kết đơn hàng với khách hàng hiện có: ${existingCustomerByPhone.name} (${existingCustomerByPhone.phone})`,
                        );
                    } else {
                        // Tạo khách hàng mới nếu SĐT chưa tồn tại
                        const newCustomerCode = genCode("CUST_");
                        const now = new Date().getTime();
                        const newCustomer: Customer = {
                            code: newCustomerCode,
                            name: values.customerName,
                            phone: values.phone,
                            address: values.address,
                            customerSource:
                                values.customerSource || CustomerSource.Other,
                            createdAt: now,
                            updatedAt: now,
                        };
                        const customerRef = dbRef(
                            database,
                            `xoxo/customers/${newCustomerCode}`,
                        );
                        await set(customerRef, newCustomer);
                        customerCodeToSave = newCustomerCode;
                        message.success(
                            `Đã tạo khách hàng mới: ${newCustomer.name}`,
                        );
                    }
                }

                const hideLoading = message.loading(
                    "Đang tải ảnh lên Firebase...",
                    0,
                );

                // Upload all images to Firebase
                const productsWithUploadedImages = await Promise.all(
                    products.map(async (product) => {
                        const uploadedImages = await Promise.all(
                            product.images.map(
                                async (image: any, index: number) => {
                                    if (image.originFileObj) {
                                        try {
                                            const firebaseUrl =
                                                await uploadImageToFirebase(
                                                    image.originFileObj as File,
                                                    `${product.id}_before`,
                                                    index,
                                                );
                                            return { ...image, firebaseUrl };
                                        } catch (error) {
                                            console.error(
                                                `Error uploading image ${image.name}:`,
                                                error,
                                            );
                                            message.error(
                                                `Không thể tải ảnh ${image.name} lên Firebase`,
                                            );
                                            return { ...image, error: true };
                                        }
                                    }
                                    return image;
                                },
                            ),
                        );

                        const uploadedImagesDone = await Promise.all(
                            (product.imagesDone || []).map(
                                async (image: any, index: number) => {
                                    if (image.originFileObj) {
                                        try {
                                            const firebaseUrl =
                                                await uploadImageToFirebase(
                                                    image.originFileObj as File,
                                                    `${product.id}_after`,
                                                    index,
                                                );
                                            return { ...image, firebaseUrl };
                                        } catch (error) {
                                            console.error(
                                                `Error uploading image ${image.name}:`,
                                                error,
                                            );
                                            message.error(
                                                `Không thể tải ảnh ${image.name} lên Firebase`,
                                            );
                                            return { ...image, error: true };
                                        }
                                    }
                                    return image;
                                },
                            ),
                        );

                        return {
                            ...product,
                            images: uploadedImages.filter((img) => !img.error),
                            imagesDone: uploadedImagesDone.filter(
                                (img) => !img.error,
                            ),
                        };
                    }),
                );

                hideLoading();

                // --- PREPARE ORDER DATA ---
                const now = new Date().getTime();
                const {
                    discount,
                    discountType = DiscountType.Amount,
                    shippingFee,
                    deposit,
                    depositType = DiscountType.Percentage,
                } = values;

                const totals = calculateOrderTotals(
                    products,
                    discount,
                    discountType,
                    shippingFee,
                );

                // Get issues from form
                const formIssues = values.issues || [];
                const orderIssues: string[] = Array.isArray(formIssues)
                    ? formIssues.filter(
                        (issue: string) => issue && issue.trim() !== "",
                    )
                    : [];

                // Add automatic issues if needed
                if (
                    status === OrderStatus.PENDING &&
                    products.some((p) => p.images.length === 0)
                ) {
                    if (!orderIssues.includes("pending_images")) {
                        orderIssues.push("Chờ lấy ảnh");
                    }
                }

                const depositAmount =
                    depositType === DiscountType.Percentage
                        ? (totals.total * (deposit || 0)) / 100
                        : deposit || 0;

                const totalPaidAmount = payments.reduce((sum, p) => sum + p.amount, 0);
                const remainingDebt = totals.total - totalPaidAmount;

                const orderData: FirebaseOrderData = {
                    code: values.code,
                    status: status,
                    customerCode: customerCodeToSave,
                    customerName: values.customerName,
                    phone: values.phone,
                    address: values.address,
                    customerSource:
                        values.customerSource || CustomerSource.Other,
                    orderDate: values.orderDate
                        ? values.orderDate.valueOf()
                        : new Date().getTime(),
                    totalAmount: totals.total,
                    discountAmount: totals.discountAmount,
                    subtotal: totals.subtotal,
                    deposit: values.deposit || 0,
                    depositType: depositType,
                    depositAmount: depositAmount,
                    isDepositPaid: values.isDepositPaid || false,
                    deliveryDate: values.deliveryDate
                        ? values.deliveryDate.valueOf()
                        : new Date().getTime(),
                    createdBy: user?.uid || "unknown",
                    createdByName:
                        values.createdByName ||
                        user?.displayName ||
                        user?.email ||
                        "Người dùng hiện tại",
                    consultantId: values.consultantId,
                    consultantName: values.consultantName,
                    notes: values.notes || "",
                    discount: discount || 0,
                    discountType: discountType,
                    shippingFee: shippingFee || 0,
                    issues: orderIssues,
                    payments: payments,
                    totalPaidAmount: totalPaidAmount,
                    remainingDebt: remainingDebt,
                    ...(mode === "update" && returns && returns.length > 0 ? { 
                        returns: returns.map((ret) => {
                            // Remove undefined fields to avoid Firebase errors
                            const cleanedReturn: any = {
                                id: ret.id,
                                returnedAt: ret.returnedAt,
                            };
                            if (ret.returnedBy !== undefined) cleanedReturn.returnedBy = ret.returnedBy;
                            if (ret.returnedByName !== undefined) cleanedReturn.returnedByName = ret.returnedByName;
                            if (ret.images !== undefined && ret.images.length > 0) cleanedReturn.images = ret.images;
                            if (ret.createdAt !== undefined) cleanedReturn.createdAt = ret.createdAt;
                            return cleanedReturn;
                        })
                    } : {}),
                    ...(mode === "create" && { createdAt: now }),
                    updatedAt: now,
                    products: productsWithUploadedImages.reduce(
                        (acc, product) => {
                            acc[product.id] = {
                                name: product.name,
                                quantity: product.quantity,
                                price: product.price,
                                images: product.images.map((img: any) => ({
                                    uid: img.uid,
                                    name: img.name,
                                    url: img.firebaseUrl || img.url || "",
                                })),
                                imagesDone: (product.imagesDone || []).map(
                                    (img: any) => ({
                                        uid: img.uid,
                                        name: img.name,
                                        url: img.firebaseUrl || img.url || "",
                                    }),
                                ),
                                workflows: product.workflows.reduce(
                                    (
                                        workflowAcc: any,
                                        workflow: WorkflowData,
                                    ) => {
                                        // Check if workflowCode contains process template IDs
                                        const workflowNames = workflow.workflowCode
                                            .map((code: string) => {
                                                // First check if it's a process template
                                                const processTemplate = processTemplates.find(t => t.id === code);
                                                if (processTemplate) {
                                                    return processTemplate.name;
                                                }
                                                // Otherwise, check old workflows
                                                return workflows[code]?.name;
                                            })
                                            .filter(Boolean) as string[];

                                        // Build workflow object, only include fields that are not undefined
                                        const workflowData: any = {
                                            workflowCode: workflow.workflowCode || [],
                                            workflowName: workflowNames || [],
                                            members: workflow.members || [],
                                            isDone: workflow.isDone,
                                            checklist: workflow.checklist || [],
                                            updatedAt: now,
                                        };
                                        
                                        // Only add optional fields if they are defined and not null (Firebase doesn't accept undefined)
                                        if ((workflow as any).departmentCode !== undefined && (workflow as any).departmentCode !== null) {
                                            workflowData.departmentCode = (workflow as any).departmentCode;
                                        }
                                        if (workflow.consultantId !== undefined && workflow.consultantId !== null) {
                                            workflowData.consultantId = workflow.consultantId;
                                        }
                                        if (workflow.deadline !== undefined && workflow.deadline !== null) {
                                            workflowData.deadline = workflow.deadline;
                                        }
                                        if ((workflow as any).processTemplateId !== undefined && (workflow as any).processTemplateId !== null) {
                                            workflowData.processTemplateId = (workflow as any).processTemplateId;
                                        }
                                        
                                        workflowAcc[workflow.id] = workflowData;
                                        return workflowAcc;
                                    },
                                    {} as Record<string, FirebaseWorkflowData>,
                                ),
                            };
                            return acc;
                        },
                        {} as Record<string, FirebaseProductData>,
                    ),
                };

                // --- SAVE TO FIREBASE ---
                if (mode === "create") {
                    const orderRef = dbRef(
                        database,
                        `xoxo/orders/${orderData.code}`,
                    );
                    await set(orderRef, orderData);
                    notification.success({
                        message: "Đơn hàng đã được tạo thành công!",
                        description: `Mã đơn hàng: ${orderData.code}`,
                        btn: (
                            <Button
                                type="primary"
                                size="small"
                                onClick={() => {
                                    router.push(`/sale/orders/${orderData.code}`);
                                    notification.destroy();
                                }}
                            >
                                Xem đơn hàng
                            </Button>
                        ),
                        duration: 5,
                    });
                    
                    // Initialize process instances for products with process templates
                    try {
                        for (const product of productsWithUploadedImages) {
                            // Collect process template IDs from product.processTemplateIds and workflowCode
                            const processTemplateIdsSet = new Set<string>();
                            
                            // Add from product.processTemplateIds
                            if (product.processTemplateIds && product.processTemplateIds.length > 0) {
                                product.processTemplateIds.forEach(id => processTemplateIdsSet.add(id));
                            }
                            
                            // Also check workflowCode - if they are process template IDs, add them
                            if (product.workflows) {
                                product.workflows.forEach((workflow: WorkflowData) => {
                                    if (workflow.workflowCode && Array.isArray(workflow.workflowCode)) {
                                        workflow.workflowCode.forEach((code: string) => {
                                            // Check if this code is a process template ID
                                            const isProcessTemplate = processTemplates.some(t => t.id === code);
                                            if (isProcessTemplate) {
                                                processTemplateIdsSet.add(code);
                                            }
                                        });
                                    }
                                });
                            }
                            
                            const processTemplateIds = Array.from(processTemplateIdsSet);
                            
                            if (processTemplateIds.length > 0) {
                                await ProcessFlowService.initializeProcessInstances(
                                    orderData.code,
                                    product.id,
                                    processTemplateIds,
                                    "order"
                                );
                            }
                        }
                    } catch (error) {
                        console.error("Error initializing process instances:", error);
                        message.warning("Đơn hàng đã được tạo nhưng có lỗi khi khởi tạo quy trình. Vui lòng kiểm tra lại.");
                    }
                    
                    // Tự động tạo công việc trong kanban todo cho mỗi product
                    // Mã đơn hàng được gắn vào công việc đầu tiên của MỖI quy trình đã chọn, trạng thái luôn là "Đang chờ"
                    try {
                        for (const product of productsWithUploadedImages) {
                            if (product.workflows && product.workflows.length > 0) {
                                // Duyệt tất cả workflow của sản phẩm
                                for (const wf of product.workflows) {
                                    const codes = Array.isArray(wf.workflowCode) ? wf.workflowCode : [];
                                    if (!codes || codes.length === 0) {
                                        continue; // Không có mã quy trình để khởi tạo item
                                    }

                                    // Tạo item cho TỪNG mã quy trình vận hành đã chọn
                                    for (const code of codes) {
                                        // Tìm OperationalWorkflow tương ứng theo id
                                        const operationalWorkflow = operationalWorkflows.find((w) => w.id === code);
                                        if (!operationalWorkflow || !operationalWorkflow.jobs || operationalWorkflow.jobs.length === 0) {
                                            continue;
                                        }

                                        // Lấy job đầu tiên
                                        const firstJob = operationalWorkflow.jobs[0];

                                        // Tạo công việc trong kanban với job đầu tiên và trạng thái "pending"
                                        await OperationalWorkflowService.createItem({
                                            workflowId: operationalWorkflow.id,
                                            workflowName: operationalWorkflow.workflowName,
                                            jobId: firstJob.id,
                                            jobName: firstJob.jobName,
                                            jobOrder: firstJob.jobOrder,
                                            status: "pending",
                                            orderCode: orderData.code,
                                            productId: product.id,
                                            productName: product.name,
                                            customerName: values.customerName || "",
                                        });

                                        console.log("✅ Đã tạo công việc Kanban:", {
                                            orderCode: orderData.code,
                                            productName: product.name,
                                            workflowId: operationalWorkflow.id,
                                            workflowName: operationalWorkflow.workflowName,
                                            firstJobName: firstJob.jobName,
                                            status: "pending",
                                        });
                                    }
                                }
                            }
                        }
                    } catch (error) {
                        console.error("Error creating kanban items:", error);
                        message.warning("Đơn hàng đã được tạo nhưng có lỗi khi tạo công việc trong kanban. Vui lòng kiểm tra lại.");
                    }
                    
                    // Trừ vật tư từ kho khi tạo đơn hàng
                    try {
                        const materialDeductions: Map<string, { quantity: number; unit: string; materialName: string }> = new Map();
                        
                        // Thu thập tất cả vật tư từ các quy trình được chọn
                        for (const product of productsWithUploadedImages) {
                            if (product.workflows && product.workflows.length > 0) {
                                for (const wf of product.workflows) {
                                    const codes = Array.isArray(wf.workflowCode) ? wf.workflowCode : [];
                                    
                                    for (const code of codes) {
                                        // Tìm OperationalWorkflow tương ứng
                                        const operationalWorkflow = operationalWorkflows.find((w) => w.id === code);
                                        if (!operationalWorkflow) continue;
                                        
                                        // Thu thập vật tư từ workflow level
                                        if (operationalWorkflow.materials && operationalWorkflow.materials.length > 0) {
                                            for (const mat of operationalWorkflow.materials) {
                                                if (mat.materialId && mat.quantity > 0) {
                                                    const key = mat.materialId;
                                                    const existing = materialDeductions.get(key);
                                                    const totalQuantity = (existing?.quantity || 0) + (mat.quantity * product.quantity);
                                                    materialDeductions.set(key, {
                                                        quantity: totalQuantity,
                                                        unit: mat.unit || existing?.unit || "",
                                                        materialName: mat.materialName || existing?.materialName || "",
                                                    });
                                                }
                                            }
                                        }
                                        
                                        // Thu thập vật tư từ jobs level
                                        if (operationalWorkflow.jobs && operationalWorkflow.jobs.length > 0) {
                                            for (const job of operationalWorkflow.jobs) {
                                                if (job.materials && job.materials.length > 0) {
                                                    for (const mat of job.materials) {
                                                        if (mat.materialId && mat.quantity > 0) {
                                                            const key = mat.materialId;
                                                            const existing = materialDeductions.get(key);
                                                            const totalQuantity = (existing?.quantity || 0) + (mat.quantity * product.quantity);
                                                            materialDeductions.set(key, {
                                                                quantity: totalQuantity,
                                                                unit: mat.unit || existing?.unit || "",
                                                                materialName: mat.materialName || existing?.materialName || "",
                                                            });
                                                        }
                                                    }
                                                }
                                            }
                                        }
                                    }
                                }
                            }
                        }
                        
                        // Trừ vật tư từ kho
                        if (materialDeductions.size > 0) {
                            const today = new Date().toISOString().split('T')[0];
                            
                            for (const [materialId, materialInfo] of materialDeductions.entries()) {
                                try {
                                    // Lấy thông tin vật tư từ kho để có tên đầy đủ
                                    const material = await InventoryService.getMaterialById(materialId);
                                    const materialName = material?.name || materialInfo.materialName || materialId;
                                    
                                    await InventoryService.createTransaction({
                                        materialId: materialId,
                                        materialName: materialName,
                                        type: "export",
                                        quantity: materialInfo.quantity,
                                        unit: materialInfo.unit,
                                        date: today,
                                        reason: "Tự động trừ khi tạo đơn hàng",
                                        note: `Đơn hàng: ${orderData.code}`,
                                        createdBy: user?.uid || "unknown",
                                    });
                                    
                                    console.log(`✅ Đã trừ vật tư: ${materialName} - ${materialInfo.quantity} ${materialInfo.unit}`);
                                } catch (error) {
                                    console.error(`❌ Lỗi khi trừ vật tư ${materialId}:`, error);
                                    message.warning(`Không thể trừ vật tư ${materialInfo.materialName || materialId} từ kho. Vui lòng kiểm tra lại.`);
                                }
                            }
                            
                            message.success(`Đã tự động trừ ${materialDeductions.size} loại vật tư từ kho.`);
                        }
                    } catch (error) {
                        console.error("Error deducting materials:", error);
                        message.warning("Đơn hàng đã được tạo nhưng có lỗi khi trừ vật tư từ kho. Vui lòng kiểm tra lại.");
                    }
                    
                    onSuccess?.(orderData.code);
                } else {
                    if (
                        Object.values(orderData.products).some(
                            (product) => product.images.length === 0,
                        )
                    ) {
                        message.warning(
                            "Vui lòng tải lên ít nhất 1 ảnh cho tất cả sản phẩm!",
                        );
                        return;
                    }
                    const orderRef = dbRef(
                        database,
                        `xoxo/orders/${orderCode}`,
                    );
                    await update(orderRef, orderData);
                    
                    // Tự động tạo công việc trong kanban cho đơn hàng cũ nếu chưa có
                    // Kiểm tra và tạo item cho mỗi product
                    try {
                        // Lấy danh sách item hiện có
                        const existingItems = await OperationalWorkflowService.getAllItems();
                        
                        for (const product of productsWithUploadedImages) {
                            if (product.workflows && product.workflows.length > 0) {
                                // Kiểm tra xem đã có item cho orderCode + productId này chưa
                                const existingItem = existingItems.find(
                                    item => item.orderCode === orderCode && item.productId === product.id
                                );
                                
                                if (!existingItem) {
                                    // Chưa có item, tạo mới
                                    const firstWorkflow = product.workflows[0];
                                    if (firstWorkflow.workflowCode && firstWorkflow.workflowCode.length > 0) {
                                        const workflowCode = firstWorkflow.workflowCode[0];
                                        
                                        // Tìm OperationalWorkflow tương ứng
                                        const operationalWorkflow = operationalWorkflows.find(w => w.id === workflowCode);
                                        
                                        if (operationalWorkflow && operationalWorkflow.jobs && operationalWorkflow.jobs.length > 0) {
                                            // Lấy job đầu tiên
                                            const firstJob = operationalWorkflow.jobs[0];
                                            
                                            // Tạo công việc trong kanban với trạng thái "pending"
                                            await OperationalWorkflowService.createItem({
                                                workflowId: operationalWorkflow.id,
                                                workflowName: operationalWorkflow.workflowName,
                                                jobId: firstJob.id,
                                                jobName: firstJob.jobName,
                                                jobOrder: firstJob.jobOrder,
                                                status: "pending",
                                                orderCode: orderCode!,
                                                productId: product.id,
                                                productName: product.name,
                                                customerName: values.customerName || "",
                                            });
                                            
                                            console.log("Tạo công việc Kanban cho đơn hàng cũ:", {
                                                orderCode,
                                                productName: product.name,
                                                workflowName: operationalWorkflow.workflowName,
                                                firstJobName: firstJob.jobName,
                                            });
                                        }
                                    }
                                }
                            }
                        }
                    } catch (error) {
                        console.error("Error creating kanban items for existing order:", error);
                    }
                    
                    notification.success({
                        message: "Đơn hàng đã được cập nhật thành công!",
                        description: `Mã đơn hàng: ${orderCode}`,
                        btn: (
                            <Button
                                type="primary"
                                size="small"
                                onClick={() => {
                                    router.push(`/sale/orders/${orderCode}`);
                                    notification.destroy();
                                }}
                            >
                                Xem đơn hàng
                            </Button>
                        ),
                        duration: 5,
                    });
                    onSuccess?.(orderCode!);
                }

                // Reset form for create mode
                if (mode === "create") {
                    form.resetFields();
                    setProducts([]);
                    setCustomerType("new");
                    form.setFieldsValue({
                        code: genCode("ORD_"),
                        createdBy: user?.uid,
                        createdByName:
                            user?.displayName ||
                            user?.email ||
                            "Người dùng hiện tại",
                        orderDate: dayjs(),
                        status: OrderStatus.CONFIRMED,
                    });
                }
            } catch (error) {
                console.error("Error saving order:", error);
                message.error(
                    `Có lỗi xảy ra khi lưu đơn hàng: ${(error as any).message || error
                    }`,
                );
            } finally {
                setSubmitting(false);
            }
        };

        // Auto-fill current user when component mounts (create mode only)
        useEffect(() => {
            if (mode === "create" && user) {
                form.setFieldsValue({
                    createdBy: user.uid,
                    createdByName:
                        user.displayName || user.email || "Người dùng hiện tại",
                    code: genCode("ORD_"),
                });
            }
        }, [user, form, mode]);

        // Load staff and workflows from Firebase
        useEffect(() => {
            const database = getDatabase();
            const staffRef = dbRef(database, "xoxo/members");
            const ordersRef = dbRef(database, "xoxo/orders");
            const departmentsRef = dbRef(database, "xoxo/departments");
            const customersRef = dbRef(database, "xoxo/customers");
            const groupsRef = dbRef(database, "xoxo/customerGroups");

            onValue(staffRef, (snapshot) => {
                const staffData = snapshot.val() || {};
                setStaff(staffData);
            });

            // Load workflows from products in orders
            onValue(ordersRef, (snapshot) => {
                const ordersData = snapshot.val() || {};
                const workflowsMap: FirebaseWorkflows = {};
                
                // Iterate through all orders
                Object.values(ordersData).forEach((order: any) => {
                    if (order?.products) {
                        // Iterate through all products in each order
                        Object.values(order.products).forEach((product: any) => {
                            if (product?.workflows) {
                                // Iterate through all workflows in each product
                                Object.entries(product.workflows).forEach(([workflowId, workflowData]: [string, any]) => {
                                    // Use workflowCode as key (first code in array, or workflowId as fallback)
                                    const workflowKey = workflowData?.workflowCode?.[0] || workflowId;
                                    if (workflowKey && !workflowsMap[workflowKey]) {
                                        // Extract workflow name from workflowName array
                                        const workflowName = workflowData?.workflowName?.[0] || workflowKey;
                                        workflowsMap[workflowKey] = {
                                            name: workflowName,
                                            department: workflowData?.departmentCode,
                                        };
                                    }
                                });
                            }
                        });
                    }
                });
                
                setWorkflows(workflowsMap);
            });

            onValue(departmentsRef, (snapshot) => {
                const departmentsData = snapshot.val() || {};
                setDepartments(departmentsData);
            });

            onValue(customersRef, (snapshot) => {
                const customersData = snapshot.val() || {};
                setCustomers(customersData);
            });

            onValue(groupsRef, (snapshot) => {
                const groupsData = snapshot.val() || {};
                setCustomerGroups(groupsData);
            });

            // Load services
            const servicesRef = dbRef(database, "xoxo/services");
            onValue(servicesRef, (snapshot) => {
                const servicesData = snapshot.val() || {};
                setServices(servicesData);
            });

            // Load process templates
            ProcessTemplateService.getAll()
                .then((templates) => {
                    setProcessTemplates(templates);
                })
                .catch((error) => {
                    console.error("Error loading process templates:", error);
                });

            // Load operational workflows (Quy trình vận hành)
            const unsubscribeOperationalWorkflows = OperationalWorkflowService.onSnapshot((workflows) => {
                setOperationalWorkflows(workflows);
            });

            // Load existing order data if in update mode
            let orderRef: any = null;
            if (mode === "update" && orderCode) {
                orderRef = dbRef(
                    database,
                    `xoxo/orders/${orderCode}`,
                );
                onValue(orderRef, (snapshot) => {
                    const orderData = snapshot.val();
                    console.log("orderData:", orderData);
                    if (orderData) {
                        console.log("Populating form with order data:", {
                            code: orderData.code,
                            customerName: orderData.customerName,
                            phone: orderData.phone,
                            address: orderData.address,
                        });
                        setCurrentOrderData(orderData);
                        populateFormWithOrderData(orderData);
                        orderDataRef.current = orderData;
                        // Force form to update
                        setTimeout(() => {
                            form.validateFields().catch(() => {});
                        }, 100);
                    } else {
                        console.warn("No order data found for orderCode:", orderCode);
                        setCurrentOrderData(null);
                    }
                    setLoading(false);
                });
            } else {
                setLoading(false);
            }

            return () => {
                off(staffRef);
                off(ordersRef);
                off(departmentsRef);
                off(customersRef);
                off(groupsRef);
                if (orderRef) {
                    off(orderRef);
                }
                if (unsubscribeOperationalWorkflows) {
                    unsubscribeOperationalWorkflows();
                }
            };
        }, [mode, orderCode, populateFormWithOrderData]);

        // Watch form values for order info display
        const formOrderCode = Form.useWatch("code", form);
        const customerName = Form.useWatch("customerName", form);
        const phone = Form.useWatch("phone", form);
        const address = Form.useWatch("address", form);
        const orderDate = Form.useWatch("orderDate", form);
        const deliveryDate = Form.useWatch("deliveryDate", form);

        // Debug log
        if (mode === "update") {
            console.log("Order Info Display Debug:", {
                formOrderCode,
                customerName,
                phone,
                address,
                orderDate,
                deliveryDate,
                currentOrderData: currentOrderData ? {
                    code: currentOrderData.code,
                    customerName: currentOrderData.customerName,
                    phone: currentOrderData.phone,
                    address: currentOrderData.address,
                } : null,
                orderCode,
                loading,
            });
        }

        return (
            <>
            <Form form={form} layout="vertical" onFinish={onFinish}>
                <div className="gap-6 flex flex-col">
                    {/* Order Info Display - Only in update mode */}
                    {mode === "update" && (
                        <Card
                            title={
                                <div className="flex items-center gap-2">
                                    <UserOutlined />
                                    <Text strong>Thông tin đơn hàng</Text>
                                    {loading && !currentOrderData && <Text type="secondary" className="text-xs ml-2">(Đang tải...)</Text>}
                                </div>
                            }
                            className="bg-background shadow-sm"
                        >
                            {currentOrderData || formOrderCode || customerName || phone ? (
                                <Row gutter={16}>
                                    <Col xs={24} sm={8}>
                                        <div className="mb-3">
                                            <Text type="secondary" className="text-xs">Mã đơn hàng</Text>
                                            <div>
                                                <Text strong>{formOrderCode || currentOrderData?.code || orderCode || "-"}</Text>
                                            </div>
                                        </div>
                                    </Col>
                                    <Col xs={24} sm={8}>
                                        <div className="mb-3">
                                            <Text type="secondary" className="text-xs">Tên khách hàng</Text>
                                            <div>
                                                <Text strong>{customerName || currentOrderData?.customerName || "-"}</Text>
                                            </div>
                                        </div>
                                    </Col>
                                    <Col xs={24} sm={8}>
                                        <div className="mb-3">
                                            <Text type="secondary" className="text-xs">Số điện thoại</Text>
                                            <div>
                                                <Text strong>{phone || currentOrderData?.phone || "-"}</Text>
                                            </div>
                                        </div>
                                    </Col>
                                </Row>
                            ) : (
                                <div className="text-center py-4">
                                    <Text type="secondary">Đang tải thông tin đơn hàng...</Text>
                                </div>
                            )}
                            {currentOrderData || address || orderDate || deliveryDate ? (
                                <Row gutter={16}>
                                    <Col xs={24} sm={12}>
                                        <div className="mb-3">
                                            <Text type="secondary" className="text-xs">Địa chỉ</Text>
                                            <div>
                                                <Text>{address || currentOrderData?.address || "-"}</Text>
                                            </div>
                                        </div>
                                    </Col>
                                    <Col xs={24} sm={6}>
                                        <div className="mb-3">
                                            <Text type="secondary" className="text-xs">Ngày đặt</Text>
                                            <div>
                                                <Text>
                                                    {(() => {
                                                        const date = orderDate || currentOrderData?.orderDate;
                                                        if (date && typeof date === 'object' && 'format' in date) {
                                                            return (date as any).format("DD/MM/YYYY");
                                                        }
                                                        if (date) {
                                                            return dayjs(date).format("DD/MM/YYYY");
                                                        }
                                                        return "-";
                                                    })()}
                                                </Text>
                                            </div>
                                        </div>
                                    </Col>
                                    <Col xs={24} sm={6}>
                                        <div className="mb-3">
                                            <Text type="secondary" className="text-xs">Ngày giao</Text>
                                            <div>
                                                <Text>
                                                    {(() => {
                                                        const date = deliveryDate || currentOrderData?.deliveryDate;
                                                        if (date && typeof date === 'object' && 'format' in date) {
                                                            return (date as any).format("DD/MM/YYYY");
                                                        }
                                                        if (date) {
                                                            return dayjs(date).format("DD/MM/YYYY");
                                                        }
                                                        return "-";
                                                    })()}
                                                </Text>
                                            </div>
                                        </div>
                                    </Col>
                                </Row>
                            ) : null}
                        </Card>
                    )}

                    {/* Order Basic Information */}
                    <Card
                        title={
                            <div className="flex items-center gap-2">
                                <UserOutlined />
                                <Text strong>
                                    {mode === "create"
                                        ? "Thông tin đơn hàng"
                                        : "Cập nhật đơn hàng"}
                                </Text>
                            </div>
                        }
                        className="bg-background shadow-sm"
                    >
                        <CustomerInformationSection
                            mode={mode}
                            customerType={customerType}
                            setCustomerType={setCustomerType}
                            form={form}
                            customers={customers}
                            setCustomers={setCustomers}
                            customerGroups={customerGroups}
                            provinces={provinces}
                        />
                        <OrderTimingSection
                            mode={mode}
                            form={form}
                            products={products}
                            message={message}
                            modal={modal}
                        />
                        <StaffInformationSection form={form} staff={staff} />
                    </Card>

                    {/* Products Section */}
                    <Card
                        title={
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <TagOutlined />
                                    <Text strong>Danh sách sản phẩm</Text>
                                    <Tag color="yellow">
                                        {products.length} sản phẩm
                                    </Tag>
                                </div>
                                <Button
                                    type="primary"
                                    htmlType="button"
                                    icon={<PlusOutlined />}
                                    onClick={addProduct}
                                    className="bg-primary hover:bg-primary"
                                >
                                    Thêm
                                </Button>
                            </div>
                        }
                        className="bg-background shadow-sm"
                    >
                        {products.length === 0 ? (
                            <div className="text-center py-8">
                                <Empty
                                    description={`Chưa có sản phẩm nào. Nhấn "Thêm sản phẩm" để bắt đầu.`}
                                />
                            </div>
                        ) : (
                            <div className="space-y-4 max-h-[600px] flex flex-col gap-4 overflow-y-auto pr-2">
                                {products.map((product, index) => (
                                    <ProductCard
                                        key={product.id}
                                        product={product}
                                        onUpdate={(
                                            updatedProduct: ProductData,
                                        ) =>
                                            updateProduct(index, updatedProduct)
                                        }
                                        onRemove={() => removeProduct(index)}
                                        staffOptions={
                                            memberOptions[ROLES.worker]
                                        }
                                        workflowOptions={workflowOptions}
                                        workflows={workflows}
                                        staff={staff}
                                        departments={departments}
                                        status={
                                            form.getFieldValue("status") ||
                                            OrderStatus.PENDING
                                        }
                                        mode={mode}
                                        memberOptions={memberOptions}
                                        processTemplates={processTemplates}
                                        operationalWorkflows={operationalWorkflows}
                                    />
                                ))}
                            </div>
                        )}
                    </Card>

                    {/* Order Summary */}
                    {products.length > 0 && (
                        <Card
                            title={
                                <div className="flex items-center gap-2">
                                    <ShoppingCartOutlined />
                                    <Text strong>Tổng kết đơn hàng</Text>
                                </div>
                            }
                            className="bg-background shadow-sm"
                        >
                            <Row gutter={24}>
                                <Col span={14}>
                                    <div className="space-y-3 max-h-[400px] overflow-y-auto">
                                        {products.map((product, index) => {
                                            const subtotal =
                                                product.quantity *
                                                product.price;
                                            return (
                                                <div
                                                    key={product.id}
                                                    className="flex justify-between items-center py-2 border-b border-gray-100 last:border-b-0"
                                                >
                                                    <div className="flex-1">
                                                        <Text>
                                                            {product.name ||
                                                                `Sản phẩm ${index + 1}`}
                                                        </Text>
                                                        <br />
                                                        <Text
                                                            type="secondary"
                                                            className="text-sm"
                                                        >
                                                            {product.quantity} x{" "}
                                                            {product.price?.toLocaleString(
                                                                "vi-VN",
                                                            )}{" "}
                                                            VNĐ
                                                        </Text>
                                                    </div>
                                                    <div className="text-right">
                                                        <Text strong>
                                                            {subtotal.toLocaleString(
                                                                "vi-VN",
                                                            )}{" "}
                                                            VNĐ
                                                        </Text>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </Col>
                                <Col span={10}>
                                    <div className="space-y-4 border-l border-gray-200 pl-4">
                                        <div className="flex justify-between gap-4">
                                            <div className="flex-1">
                                                <Form.Item
                                                    dependencies={[
                                                        "discountType",
                                                    ]}
                                                >
                                                    {({ getFieldValue }) => {
                                                        const discountType =
                                                            getFieldValue(
                                                                "discountType",
                                                            ) ||
                                                            DiscountType.Amount;
                                                        const isPercentage =
                                                            discountType ===
                                                            DiscountType.Percentage;
                                                        return (
                                                            <div>
                                                                <div className="mb-2">
                                                                    <Text>
                                                                        Chiết
                                                                        khấu
                                                                    </Text>
                                                                </div>
                                                                <Space.Compact className="w-full">
                                                                    <Form.Item
                                                                        name="discount"
                                                                        initialValue={
                                                                            0
                                                                        }
                                                                        noStyle
                                                                    >
                                                                        <InputNumber
                                                                            min={
                                                                                0
                                                                            }
                                                                            max={
                                                                                isPercentage
                                                                                    ? 99.9
                                                                                    : undefined
                                                                            }
                                                                            placeholder="0"
                                                                            step={
                                                                                isPercentage
                                                                                    ? 0.1
                                                                                    : 1000
                                                                            }
                                                                            className="w-full"
                                                                        />
                                                                    </Form.Item>
                                                                    <Form.Item
                                                                        name="discountType"
                                                                        initialValue={
                                                                            DiscountType.Amount
                                                                        }
                                                                        noStyle
                                                                    >
                                                                        <Select
                                                                            style={{
                                                                                width: 80,
                                                                            }}
                                                                        >
                                                                            <Option
                                                                                value={
                                                                                    DiscountType.Amount
                                                                                }
                                                                            >
                                                                                VNĐ
                                                                            </Option>
                                                                            <Option
                                                                                value={
                                                                                    DiscountType.Percentage
                                                                                }
                                                                            >
                                                                                %
                                                                            </Option>
                                                                        </Select>
                                                                    </Form.Item>
                                                                </Space.Compact>
                                                            </div>
                                                        );
                                                    }}
                                                </Form.Item>
                                            </div>

                                            <div className="flex-1">
                                                <Form.Item
                                                    label="Phí vận chuyển"
                                                    name="shippingFee"
                                                    initialValue={0}
                                                >
                                                    <InputNumber
                                                        min={0}
                                                        placeholder="0"
                                                        formatter={(v) =>
                                                            `${v}`.replace(
                                                                /\B(?=(\d{3})+(?!\d))/g,
                                                                ",",
                                                            )
                                                        }
                                                        parser={(value) => {
                                                            const parsed =
                                                                Number(
                                                                    value?.replace(
                                                                        /,/g,
                                                                        "",
                                                                    ) || 0,
                                                                );
                                                            return parsed as any;
                                                        }}
                                                        className="w-full"
                                                    />
                                                </Form.Item>
                                            </div>
                                        </div>

                                        {/* Deposit Field */}
                                        <div className="flex-1">
                                            <Form.Item
                                                dependencies={["depositType"]}
                                            >
                                                {({ getFieldValue }) => {
                                                    const depositType =
                                                        getFieldValue(
                                                            "depositType",
                                                        ) ||
                                                        DiscountType.Percentage;
                                                    const isPercentage =
                                                        depositType ===
                                                        DiscountType.Percentage;
                                                    return (
                                                        <div>
                                                            <div className="mb-2">
                                                                <Text>
                                                                    Tiền cọc
                                                                </Text>
                                                            </div>
                                                            <Space.Compact className="w-full">
                                                                <Form.Item
                                                                    name="deposit"
                                                                    initialValue={
                                                                        50
                                                                    }
                                                                    noStyle
                                                                >
                                                                    <InputNumber
                                                                        min={0}
                                                                        max={
                                                                            isPercentage
                                                                                ? 100
                                                                                : undefined
                                                                        }
                                                                        placeholder="0"
                                                                        step={
                                                                            isPercentage
                                                                                ? 10
                                                                                : 1000
                                                                        }
                                                                        className="w-full"
                                                                    />
                                                                </Form.Item>
                                                                <Form.Item
                                                                    name="depositType"
                                                                    initialValue={
                                                                        DiscountType.Percentage
                                                                    }
                                                                    noStyle
                                                                >
                                                                    <Select
                                                                        style={{
                                                                            width: 80,
                                                                        }}
                                                                    >
                                                                        <Option
                                                                            value={
                                                                                DiscountType.Amount
                                                                            }
                                                                        >
                                                                            VNĐ
                                                                        </Option>
                                                                        <Option
                                                                            value={
                                                                                DiscountType.Percentage
                                                                            }
                                                                        >
                                                                            %
                                                                        </Option>
                                                                    </Select>
                                                                </Form.Item>
                                                            </Space.Compact>
                                                        </div>
                                                    );
                                                }}
                                            </Form.Item>
                                        </div>

                                        <Form.Item
                                            dependencies={[
                                                "discount",
                                                "discountType",
                                                "shippingFee",
                                                "deposit",
                                                "depositType",
                                            ]}
                                        >
                                            {({ getFieldValue }) => {
                                                const discount =
                                                    getFieldValue("discount") ||
                                                    0;
                                                const discountType =
                                                    getFieldValue(
                                                        "discountType",
                                                    ) || DiscountType.Amount;
                                                const shippingFee =
                                                    getFieldValue(
                                                        "shippingFee",
                                                    ) || 0;
                                                const depositValue =
                                                    getFieldValue("deposit") ||
                                                    0;
                                                const depositType =
                                                    getFieldValue(
                                                        "depositType",
                                                    ) ||
                                                    DiscountType.Percentage;

                                                const totals =
                                                    calculateOrderTotals(
                                                        products,
                                                        discount,
                                                        discountType,
                                                        shippingFee,
                                                    );

                                                const depositAmount =
                                                    depositType ===
                                                        DiscountType.Percentage
                                                        ? (totals.total *
                                                            depositValue) /
                                                        100
                                                        : depositValue;

                                                const totalPaidAmount = payments.reduce((sum, p) => sum + p.amount, 0);
                                                const remainingDebt = totals.total - totalPaidAmount;

                                                return (
                                                    <>
                                                        <div className="space-y-2 p-4 bg-gray-50 rounded-lg">
                                                            <div className="flex justify-between">
                                                                <Text>
                                                                    Tạm tính:
                                                                </Text>
                                                                <Text>
                                                                    {totals.subtotal.toLocaleString(
                                                                        "vi-VN",
                                                                    )}{" "}
                                                                    VNĐ
                                                                </Text>
                                                            </div>
                                                            <div className="flex justify-between">
                                                                <Text>
                                                                    Chiết khấu:
                                                                </Text>
                                                                <Text>
                                                                    -
                                                                    {totals.discountAmount.toLocaleString(
                                                                        "vi-VN",
                                                                    )}{" "}
                                                                    VNĐ
                                                                    {discountType ===
                                                                        DiscountType.Percentage &&
                                                                        discount >
                                                                        0 &&
                                                                        ` (${discount}%)`}
                                                                </Text>
                                                            </div>
                                                            <div className="flex justify-between">
                                                                <Text>
                                                                    Phí vận chuyển:
                                                                </Text>
                                                                <Text>
                                                                    +
                                                                    {shippingFee.toLocaleString(
                                                                        "vi-VN",
                                                                    )}{" "}
                                                                    VNĐ
                                                                </Text>
                                                            </div>
                                                            <div className="flex justify-between pt-2 border-t border-gray-300">
                                                                <Text
                                                                    strong
                                                                    className="text-lg"
                                                                >
                                                                    Tổng cộng:
                                                                </Text>
                                                                <Text
                                                                    strong
                                                                    className="text-lg text-primary"
                                                                >
                                                                    {totals.total.toLocaleString(
                                                                        "vi-VN",
                                                                    )}{" "}
                                                                    VNĐ
                                                                </Text>
                                                            </div>
                                                            <div className="flex justify-between">
                                                                <Text>
                                                                    Tiền cọc:
                                                                </Text>
                                                                <Text>
                                                                    -
                                                                    {depositAmount.toLocaleString(
                                                                        "vi-VN",
                                                                    )}{" "}
                                                                    VNĐ
                                                                    {depositType ===
                                                                        DiscountType.Percentage &&
                                                                        depositValue >
                                                                        0 &&
                                                                        ` (${depositValue}%)`}
                                                                </Text>
                                                            </div>
                                                        </div>

                                                        {/* Payment Section */}
                                                        <PaymentManager
                                                            payments={payments}
                                                            onPaymentsChange={setPayments}
                                                            totalAmount={totals.total}
                                                            user={user}
                                                        />
                                                    </>
                                                );
                                            }}
                                        </Form.Item>

                                        {/* Return Section - Only in update mode */}
                                        {mode === "update" && (
                                            <ReturnManager
                                                returns={returns}
                                                onReturnsChange={setReturns}
                                                user={user}
                                                staffOptions={allStaffOptions}
                                            />
                                        )}
                                    </div>
                                </Col>
                            </Row>
                        </Card>
                    )}

                    {/* Submit Button */}
                    <div className="flex justify-end gap-4 py-4 sticky bottom-0 mt-4 z-40 border-t bg-background border-gray-200">
                        <Button
                            disabled={submitting}
                            icon={<CloseOutlined />}
                            size="large"
                            onClick={onCancel}
                        >
                            Hủy bỏ
                        </Button>
                        <Button
                            size="large"
                            type="dashed"
                            icon={<ReloadOutlined />}
                            disabled={submitting}
                            onClick={handleResetForm}
                            className="min-w-32"
                        >
                            Đặt lại
                        </Button>
                        <Button
                            disabled={submitting}
                            icon={
                                submitting ? (
                                    <LoadingOutlined spin />
                                ) : (
                                    <SaveOutlined />
                                )
                            }
                            type="primary"
                            size="large"
                            htmlType="submit"
                            loading={submitting}
                            className="bg-primary hover:bg-primary min-w-32"
                        >
                            {mode === "create"
                                ? "Tạo đơn hàng"
                                : "Cập nhật đơn hàng"}
                        </Button>
                    </div>
                </div>
                <Form.Item name="totalAmount" hidden>
                    <Input />
                </Form.Item>
            </Form>

            {/* Modal chọn dịch vụ */}
            <Modal
                title="Chọn dịch vụ"
                open={serviceModalVisible}
                onCancel={() => {
                    setServiceModalVisible(false);
                    setSearchServiceTerm("");
                }}
                footer={null}
                width={800}
            >
                <div className="space-y-4">
                    <Input
                        placeholder="Tìm kiếm dịch vụ theo tên, mã..."
                        value={searchServiceTerm}
                        onChange={(e) => setSearchServiceTerm(e.target.value)}
                        allowClear
                        size="large"
                    />
                    <div className="max-h-[500px] overflow-y-auto">
                        {Object.entries(services || {})
                            .filter(([code, service]) => {
                                if (!service || !service.name) return false;
                                if (!searchServiceTerm) return true;
                                const searchLower = searchServiceTerm.toLowerCase();
                                return (
                                    service.name.toLowerCase().includes(searchLower) ||
                                    code.toLowerCase().includes(searchLower)
                                );
                            })
                            .map(([code, service]) => (
                                <Card
                                    key={code}
                                    hoverable
                                    className="mb-2 cursor-pointer"
                                    onClick={() => handleSelectService(code)}
                                >
                                    <div className="flex justify-between items-center">
                                        <div className="flex-1">
                                            <Text strong>{service.name}</Text>
                                            <br />
                                            <Text type="secondary" className="text-xs">
                                                Mã: {code}
                                            </Text>
                                        </div>
                                        <div className="text-right">
                                            <Text strong className="text-primary text-lg">
                                                {service.sellingPrice
                                                    ? new Intl.NumberFormat("vi-VN").format(
                                                          service.sellingPrice
                                                      ) + " đ"
                                                    : service.priceFrom && service.priceTo
                                                      ? `${new Intl.NumberFormat("vi-VN").format(service.priceFrom)} - ${new Intl.NumberFormat("vi-VN").format(service.priceTo)} đ`
                                                      : "Chưa có giá"}
                                            </Text>
                                        </div>
                                    </div>
                                </Card>
                            ))}
                        {Object.keys(services).length === 0 && (
                            <Empty description="Chưa có dịch vụ nào" />
                        )}
                    </div>
                </div>
            </Modal>
            </>
        );
    },
);

export default OrderForm;

"use client";

import type {
    FirebaseBrands,
    FirebaseServiceCategories,
    Service,
    ServiceCategory,
} from "@/types/service";
import { genCode } from "@/utils/genCode";
import { CustomerServiceOutlined, PlusOutlined } from "@ant-design/icons";
import {
    App,
    Button,
    Col,
    Collapse,
    Form,
    Input,
    InputNumber,
    Modal,
    Row,
    Select,
    Space,
    Tabs,
    Typography,
    Upload,
} from "antd";
import type { UploadFile, RcFile } from "antd/lib/upload/interface";
import { getDatabase, onValue, ref, set, update } from "firebase/database";
import {
    deleteObject,
    getDownloadURL,
    getStorage,
    ref as storageRef,
    uploadBytes,
} from "firebase/storage";
import { useEffect, useState } from "react";
import { OperationalWorkflowService, OperationalWorkflow } from "@/services/operationalWorkflowService";

const { Text } = Typography;
const { Panel } = Collapse;

interface ServiceFormModalProps {
    open: boolean;
    editingService: Service | null;
    serviceCategories: FirebaseServiceCategories;
    brands: FirebaseBrands;
    onCancel: () => void;
    onSuccess: () => void;
}

const ServiceFormModal: React.FC<ServiceFormModalProps> = ({
    open,
    editingService,
    serviceCategories,
    brands,
    onCancel,
    onSuccess,
}) => {
    const [form] = Form.useForm();
    const { message } = App.useApp();
    const [allServiceCategories, setAllServiceCategories] = useState<
        ServiceCategory[]
    >([]);
    const [selectedOng, setSelectedOng] = useState<string | undefined>();
    const [selectedCha, setSelectedCha] = useState<string | undefined>();
    const [selectedCon, setSelectedCon] = useState<string | undefined>();
    const [selectedChau, setSelectedChau] = useState<string | undefined>();
    const [fileList, setFileList] = useState<UploadFile[]>([]);
    const [uploading, setUploading] = useState(false);
    const [operationalWorkflows, setOperationalWorkflows] = useState<OperationalWorkflow[]>([]);

    // Load all service categories
    useEffect(() => {
        const database = getDatabase();
        const categoriesRef = ref(database, "xoxo/serviceCategories");

        const unsubscribe = onValue(categoriesRef, (snapshot) => {
            const data = snapshot.val() || {};
            const categoriesArray = Object.entries(data).map(([code, cat]) => ({
                code,
                ...(cat as Omit<ServiceCategory, "code">),
            }));
            setAllServiceCategories(categoriesArray);
        });

        return () => unsubscribe();
    }, []);

    // Load operational workflows
    useEffect(() => {
        const unsubscribe = OperationalWorkflowService.onSnapshot((workflows) => {
            setOperationalWorkflows(workflows);
        });

        return () => unsubscribe();
    }, []);

    useEffect(() => {
        if (open) {
            form.resetFields();
            setFileList([]);
            setSelectedOng(undefined);
            setSelectedCha(undefined);
            setSelectedCon(undefined);
            setSelectedChau(undefined);

            if (editingService) {
                // Set images first
                if (editingService.images && editingService.images.length > 0) {
                    setFileList(
                        editingService.images.map((url, index) => ({
                            uid: `-${index}`,
                            name: `image-${index}.jpg`,
                            status: "done",
                            url: url,
                        })),
                    );
                }

                // Set hierarchy from categoryCode - wait for categories to load
                if (editingService.categoryCode && allServiceCategories.length > 0) {
                    const categoryPath = getCategoryPath(
                        editingService.categoryCode,
                    );
                    const hierarchyValues: any = {};
                    if (categoryPath.length > 0) {
                        hierarchyValues.ong = categoryPath[0]?.code;
                        setSelectedOng(categoryPath[0]?.code);
                        if (categoryPath.length > 1) {
                            hierarchyValues.cha = categoryPath[1]?.code;
                            setSelectedCha(categoryPath[1]?.code);
                            if (categoryPath.length > 2) {
                                hierarchyValues.con = categoryPath[2]?.code;
                                setSelectedCon(categoryPath[2]?.code);
                                if (categoryPath.length > 3) {
                                    hierarchyValues.chau = categoryPath[3]?.code;
                                    setSelectedChau(categoryPath[3]?.code);
                                }
                            }
                        }
                    }
                    // Set form values with hierarchy
                    form.setFieldsValue({
                        ...editingService,
                        ...hierarchyValues,
                        operationalWorkflowIds: editingService.operationalWorkflowIds || [],
                    });
                } else {
                    // Set form values without hierarchy
                    form.setFieldsValue({
                        ...editingService,
                        operationalWorkflowIds: editingService.operationalWorkflowIds || [],
                    });
                }
            } else {
                form.setFieldsValue({
                    code: genCode("SVC_"),
                    operationalWorkflowIds: [],
                });
            }
        }
    }, [open, editingService, form, allServiceCategories]);

    // Helper to get category path
    const getCategoryPath = (categoryCode: string): ServiceCategory[] => {
        const path: ServiceCategory[] = [];
        let current = allServiceCategories.find((c) => c.code === categoryCode);
        while (current) {
            path.unshift(current);
            current = current.parentCode
                ? allServiceCategories.find((c) => c.code === current!.parentCode)
                : undefined;
        }
        return path;
    };

    // Upload image to Firebase Storage
    const uploadImageToFirebase = async (
        file: RcFile,
        serviceCode: string,
        index: number,
    ): Promise<string> => {
        const storage = getStorage();
        const fileName = `services/${serviceCode}/${new Date().getTime()}_${index}_${file.name}`;
        const storageReference = storageRef(storage, fileName);
        const snapshot = await uploadBytes(storageReference, file);
        return await getDownloadURL(snapshot.ref);
    };

    // Delete image from Firebase Storage
    const deleteImageFromFirebase = async (url: string) => {
        try {
            const storage = getStorage();
            const imageRef = storageRef(storage, url);
            await deleteObject(imageRef);
        } catch (error) {
            console.error("Error deleting image:", error);
        }
    };

    // Create category if not exists
    const createCategoryIfNotExists = async (
        nameOrCode: string,
        parentCode?: string,
    ): Promise<string> => {
        // Check if it's already a code (starts with CAT_)
        if (nameOrCode.startsWith("CAT_")) {
            // It's a code, check if category exists
            const existingCategory = allServiceCategories.find(
                (cat) => cat.code === nameOrCode,
            );
            if (existingCategory) {
                return existingCategory.code;
            }
            // Code doesn't exist, treat as name
        }

        // It's a name, check if category exists with this name and parent
        const existingCategory = allServiceCategories.find(
            (cat) => cat.name === nameOrCode && cat.parentCode === parentCode,
        );
        if (existingCategory) {
            return existingCategory.code;
        }

        // Create new category
        const newCode = genCode("CAT_");
        const now = new Date().getTime();
        
        // Build category data without undefined values
        const categoryData: any = {
            code: newCode,
            name: nameOrCode,
            displayColor: "default",
            createdAt: now,
            updatedAt: now,
        };
        
        // Only add parentCode if it exists (not undefined)
        if (parentCode) {
            categoryData.parentCode = parentCode;
        }

        const database = getDatabase();
        const categoryRef = ref(database, `xoxo/serviceCategories/${newCode}`);
        await set(categoryRef, categoryData);

        // Reload categories
        const categoriesRef = ref(database, "xoxo/serviceCategories");
        const snapshot = await new Promise<any>((resolve) => {
            onValue(categoriesRef, resolve, { onlyOnce: true });
        });
        const data = snapshot.val() || {};
        const categoriesArray = Object.entries(data).map(([code, cat]) => ({
            code,
            ...(cat as Omit<ServiceCategory, "code">),
        }));
        setAllServiceCategories(categoriesArray);

        return newCode;
    };

    // Get options for each level
    const getOngOptions = () => {
        const ongCategories = allServiceCategories.filter(
            (cat) => !cat.parentCode,
        );
        return ongCategories.map((cat) => ({
            value: cat.code,
            label: cat.name,
        }));
    };

    const getChaOptions = (ongCode: string) => {
        const chaCategories = allServiceCategories.filter(
            (cat) => cat.parentCode === ongCode,
        );
        return chaCategories.map((cat) => ({
            value: cat.code,
            label: cat.name,
        }));
    };

    const getConOptions = (chaCode: string) => {
        const conCategories = allServiceCategories.filter(
            (cat) => cat.parentCode === chaCode,
        );
        return conCategories.map((cat) => ({
            value: cat.code,
            label: cat.name,
        }));
    };

    const getChauOptions = (conCode: string) => {
        const chauCategories = allServiceCategories.filter(
            (cat) => cat.parentCode === conCode,
        );
        return chauCategories.map((cat) => ({
            value: cat.code,
            label: cat.name,
        }));
    };

    const handleSubmit = async () => {
        setUploading(true);
        try {
            const values = await form.validateFields();
            const database = getDatabase();
            const now = new Date().getTime();

            // Handle image uploads
            const uploadedImageUrls: string[] = [];
            const existingImageUrls: string[] = [];

            for (const file of fileList) {
                if (file.originFileObj) {
                    // New file to upload
                    const url = await uploadImageToFirebase(
                        file.originFileObj as RcFile,
                        values.code,
                        uploadedImageUrls.length,
                    );
                    uploadedImageUrls.push(url);
                } else if (file.url) {
                    // Existing file
                    existingImageUrls.push(file.url);
                }
            }
            const finalImages = [...existingImageUrls, ...uploadedImageUrls];

            // Create categories if they don't exist and get their codes
            // Handle mode="tags" - value can be array or string
            const getValue = (value: any): string | undefined => {
                if (!value) return undefined;
                if (Array.isArray(value)) {
                    return value.length > 0 ? value[0] : undefined;
                }
                return typeof value === "string" ? value : undefined;
            };

            let categoryCode: string | undefined;
            const ongValue = getValue(values.ong);
            if (ongValue) {
                const ongCode = await createCategoryIfNotExists(ongValue);
                const chaValue = getValue(values.cha);
                if (chaValue) {
                    const chaCode = await createCategoryIfNotExists(
                        chaValue,
                        ongCode,
                    );
                    const conValue = getValue(values.con);
                    if (conValue) {
                        const conCode = await createCategoryIfNotExists(
                            conValue,
                            chaCode,
                        );
                        const chauValue = getValue(values.chau);
                        if (chauValue) {
                            categoryCode = await createCategoryIfNotExists(
                                chauValue,
                                conCode,
                            );
                        } else {
                            categoryCode = conCode;
                        }
                    } else {
                        categoryCode = chaCode;
                    }
                } else {
                    categoryCode = ongCode;
                }
            }

            const serviceData: any = {
                name: values.name,
                code: values.code,
                updatedAt: now,
                ...(editingService
                    ? { createdAt: editingService.createdAt }
                    : { createdAt: now }),
            };

            // Add optional fields only if they have values
            if (categoryCode) {
                serviceData.categoryCode = categoryCode;
            }
            if (values.brandCode && values.brandCode.trim()) {
                serviceData.brandCode = values.brandCode.trim();
            }
            if (values.sellingPrice !== undefined && values.sellingPrice !== null) {
                serviceData.sellingPrice = values.sellingPrice;
            }
            if (values.priceFrom !== undefined && values.priceFrom !== null) {
                serviceData.priceFrom = values.priceFrom;
            }
            if (values.priceTo !== undefined && values.priceTo !== null) {
                serviceData.priceTo = values.priceTo;
            }
            if (finalImages.length > 0) {
                serviceData.images = finalImages;
            }
            if (values.imageNotes && values.imageNotes.trim()) {
                serviceData.imageNotes = values.imageNotes.trim();
            }
            if (values.operationalWorkflowIds && values.operationalWorkflowIds.length > 0) {
                serviceData.operationalWorkflowIds = values.operationalWorkflowIds;
            }

            const cleanedData = serviceData as Service;

            const serviceRef = ref(database, `xoxo/services/${values.code}`);

            if (editingService) {
                await update(serviceRef, cleanedData);
                message.success("Cập nhật dịch vụ thành công!");
            } else {
                await set(serviceRef, cleanedData);
                message.success("Thêm dịch vụ thành công!");
            }

            onCancel();
            onSuccess();
        } catch (error: any) {
            console.error("Error saving service:", error);
            const errorMessage =
                error?.message || "Có lỗi xảy ra khi lưu dịch vụ!";
            message.error(errorMessage);
        } finally {
            setUploading(false);
        }
    };

    // Handle image change
    const handleImageChange = ({ fileList: newFileList }: any) => {
        setFileList(newFileList);
    };

    // Before upload
    const beforeUpload = (file: RcFile) => {
        const isImage = file.type.startsWith("image/");
        if (!isImage) {
            message.error("Chỉ có thể upload file ảnh!");
            return Upload.LIST_IGNORE;
        }
        const isLt2M = file.size / 1024 / 1024 < 2;
        if (!isLt2M) {
            message.error("Ảnh phải nhỏ hơn 2MB!");
            return Upload.LIST_IGNORE;
        }
        return false; // Prevent auto upload
    };


    return (
        <>
            <Modal
                title={
                    <div className="flex items-center gap-2">
                        <CustomerServiceOutlined />
                        <Text strong>
                            {editingService
                                ? "Cập nhật dịch vụ"
                                : "Tạo thẻ tài khoản"}
                        </Text>
                    </div>
                }
                open={open}
                onCancel={onCancel}
                onOk={handleSubmit}
                width={1000}
                okText="Lưu"
                cancelText="Bỏ qua"
                confirmLoading={uploading}
            >
                <Tabs
                    defaultActiveKey="info"
                    items={[
                        {
                            key: "info",
                            label: "Thông tin",
                            children: (
                                <Form
                                    form={form}
                                    layout="vertical"
                                    className="mt-4"
                                >
                                    <Row gutter={24}>
                                        <Col span={12}>
                                            <Form.Item
                                                name="name"
                                                label="Tên hàng"
                                                rules={[
                                                    {
                                                        required: true,
                                                        message:
                                                            "Vui lòng nhập tên hàng!",
                                                    },
                                                ]}
                                            >
                                                <Input
                                                    placeholder="Bắt buộc"
                                                    size="large"
                                                />
                                            </Form.Item>

                                            <Form.Item
                                                name="code"
                                                label="Mã hàng"
                                            >
                                                <Input
                                                    placeholder="Tự động"
                                                    disabled
                                                    size="large"
                                                />
                                            </Form.Item>

                                            <Form.Item name="ong" label="Ông">
                                                <Select
                                                    placeholder="Chọn hoặc nhập Ông (ví dụ: Túi, Ví, Giầy)"
                                                    size="large"
                                                    showSearch
                                                    allowClear
                                                    mode="tags"
                                                    options={getOngOptions()}
                                                    onChange={(value) => {
                                                        const ongValue = Array.isArray(value)
                                                            ? value[0]
                                                            : value;
                                                        setSelectedOng(ongValue);
                                                        form.setFieldsValue({
                                                            cha: undefined,
                                                            con: undefined,
                                                            chau: undefined,
                                                        });
                                                        setSelectedCha(undefined);
                                                        setSelectedCon(undefined);
                                                        setSelectedChau(undefined);
                                                    }}
                                                />
                                            </Form.Item>

                                            {selectedOng && (
                                                <Form.Item
                                                    name="cha"
                                                    label="Cha"
                                                    className="mb-0"
                                                >
                                                    <Select
                                                        placeholder="Chọn hoặc nhập Cha (ví dụ: Túi)"
                                                        size="large"
                                                        showSearch
                                                        allowClear
                                                        mode="tags"
                                                        options={getChaOptions(
                                                            selectedOng,
                                                        )}
                                                        onChange={(value) => {
                                                            const chaValue = Array.isArray(
                                                                value,
                                                            )
                                                                ? value[0]
                                                                : value;
                                                            setSelectedCha(chaValue);
                                                            form.setFieldsValue({
                                                                con: undefined,
                                                                chau: undefined,
                                                            });
                                                            setSelectedCon(undefined);
                                                            setSelectedChau(undefined);
                                                        }}
                                                    />
                                                </Form.Item>
                                            )}
                                            {selectedCha && (
                                                <Form.Item
                                                    name="con"
                                                    label="Con"
                                                    className="mb-0"
                                                >
                                                    <Select
                                                        placeholder="Chọn hoặc nhập Con (ví dụ: Quai túi)"
                                                        size="large"
                                                        showSearch
                                                        allowClear
                                                        mode="tags"
                                                        options={getConOptions(
                                                            selectedCha,
                                                        )}
                                                        onChange={(value) => {
                                                            const conValue = Array.isArray(
                                                                value,
                                                            )
                                                                ? value[0]
                                                                : value;
                                                            setSelectedCon(conValue);
                                                            form.setFieldsValue({
                                                                chau: undefined,
                                                            });
                                                            setSelectedChau(undefined);
                                                        }}
                                                    />
                                                </Form.Item>
                                            )}
                                            {selectedCon && (
                                                <Form.Item
                                                    name="chau"
                                                    label="Cháu"
                                                    className="mb-0"
                                                >
                                                    <Select
                                                        placeholder="Chọn hoặc nhập Cháu (ví dụ: Da thật, Da giả)"
                                                        size="large"
                                                        showSearch
                                                        allowClear
                                                        mode="tags"
                                                        options={getChauOptions(
                                                            selectedCon,
                                                        )}
                                                        onChange={(value) => {
                                                            const chauValue = Array.isArray(
                                                                value,
                                                            )
                                                                ? value[0]
                                                                : value;
                                                            setSelectedChau(chauValue);
                                                        }}
                                                    />
                                                </Form.Item>
                                            )}

                                            <Form.Item
                                                name="brandCode"
                                                label="Thương hiệu"
                                            >
                                                <Input
                                                    placeholder="Nhập thương hiệu (ví dụ: Gucci, Hermès, Nike...)"
                                                    size="large"
                                                    allowClear
                                                />
                                            </Form.Item>

                                            <Form.Item
                                                name="sellingPrice"
                                                label="Giá bán"
                                                tooltip="Nhập giá bán cho dịch vụ này"
                                            >
                                                <InputNumber
                                                    placeholder="Nhập giá bán (VND)"
                                                    size="large"
                                                    style={{
                                                        width: "100%",
                                                    }}
                                                    min={0}
                                                    formatter={(value) =>
                                                        `${value}`.replace(
                                                            /\B(?=(\d{3})+(?!\d))/g,
                                                            ",",
                                                        )
                                                    }
                                                    parser={(value) =>
                                                        value!.replace(
                                                            /\$\s?|(,*)/g,
                                                            "",
                                                        )
                                                    }
                                                />
                                            </Form.Item>

                                            <Form.Item
                                                name="operationalWorkflowIds"
                                                label="Quy trình vận hành"
                                                tooltip="Chọn nhiều quy trình vận hành theo thứ tự (chọn trước sẽ là bước 1, 2, 3...)"
                                            >
                                                <Select
                                                    mode="multiple"
                                                    placeholder="Chọn quy trình vận hành (thứ tự chọn sẽ là thứ tự thực hiện)"
                                                    size="large"
                                                    allowClear
                                                    maxTagCount="responsive"
                                                    tagRender={(props) => {
                                                        const { label, value, closable, onClose } = props;
                                                        const selectedValues = form.getFieldValue("operationalWorkflowIds") || [];
                                                        const index = selectedValues.indexOf(value) + 1;
                                                        return (
                                                            <span
                                                                style={{
                                                                    display: "inline-flex",
                                                                    alignItems: "center",
                                                                    padding: "2px 8px",
                                                                    margin: "2px",
                                                                    backgroundColor: "#1677ff",
                                                                    color: "#fff",
                                                                    borderRadius: "4px",
                                                                    fontSize: "14px",
                                                                }}
                                                            >
                                                                {index}. {label}
                                                                {closable && (
                                                                    <span
                                                                        style={{
                                                                            marginLeft: "4px",
                                                                            cursor: "pointer",
                                                                        }}
                                                                        onMouseDown={(e) => {
                                                                            e.preventDefault();
                                                                            e.stopPropagation();
                                                                        }}
                                                                        onClick={onClose}
                                                                    >
                                                                        ×
                                                                    </span>
                                                                )}
                                                            </span>
                                                        );
                                                    }}
                                                    options={operationalWorkflows.map((workflow) => ({
                                                        value: workflow.id,
                                                        label: workflow.workflowName,
                                                    }))}
                                                />
                                            </Form.Item>
                                        </Col>
                                        <Col span={12}>
                                            <Collapse
                                                defaultActiveKey={["price"]}
                                            >
                                                <Panel
                                                    header="Giá bán và khoảng giá"
                                                    key="price"
                                                >
                                                    <Form.Item
                                                        name="sellingPrice"
                                                        label="Giá bán"
                                                        tooltip="Nhập giá bán cho dịch vụ này"
                                                    >
                                                        <InputNumber
                                                            placeholder="Nhập giá bán (VND)"
                                                            size="large"
                                                            style={{
                                                                width: "100%",
                                                            }}
                                                            min={0}
                                                            formatter={(value) =>
                                                                `${value}`.replace(
                                                                    /\B(?=(\d{3})+(?!\d))/g,
                                                                    ",",
                                                                )
                                                            }
                                                            parser={(value) =>
                                                                value!.replace(
                                                                    /\$\s?|(,*)/g,
                                                                    "",
                                                                )
                                                            }
                                                        />
                                                    </Form.Item>
                                                    <Form.Item
                                                        name="priceFrom"
                                                        label="Từ khoảng giá"
                                                    >
                                                        <InputNumber
                                                            placeholder="0"
                                                            size="large"
                                                            style={{
                                                                width: "100%",
                                                            }}
                                                            formatter={(
                                                                value,
                                                            ) =>
                                                                `${value}`.replace(
                                                                    /\B(?=(\d{3})+(?!\d))/g,
                                                                    ",",
                                                                )
                                                            }
                                                            parser={(value) =>
                                                                value!.replace(
                                                                    /\$\s?|(,*)/g,
                                                                    "",
                                                                )
                                                            }
                                                        />
                                                    </Form.Item>
                                                    <Form.Item
                                                        name="priceTo"
                                                        label="Tới khoảng giá"
                                                    >
                                                        <InputNumber
                                                            placeholder="0"
                                                            size="large"
                                                            style={{
                                                                width: "100%",
                                                            }}
                                                            formatter={(
                                                                value,
                                                            ) =>
                                                                `${value}`.replace(
                                                                    /\B(?=(\d{3})+(?!\d))/g,
                                                                    ",",
                                                                )
                                                            }
                                                            parser={(value) =>
                                                                value!.replace(
                                                                    /\$\s?|(,*)/g,
                                                                    "",
                                                                )
                                                            }
                                                        />
                                                    </Form.Item>
                                                </Panel>
                                            </Collapse>

                                            <Form.Item label="Hình ảnh">
                                                <Text
                                                    type="secondary"
                                                    className="block mb-2"
                                                >
                                                    Upload tối đa 10 ảnh, dung lượng
                                                    mỗi ảnh tối đa 2MB
                                                </Text>
                                                <Upload
                                                    listType="picture-card"
                                                    maxCount={10}
                                                    accept="image/*"
                                                    fileList={fileList}
                                                    onChange={handleImageChange}
                                                    beforeUpload={beforeUpload}
                                                    onRemove={async (file) => {
                                                        if (
                                                            file.url &&
                                                            file.originFileObj ===
                                                                undefined
                                                        ) {
                                                            // Only delete if it's an existing image
                                                            await deleteImageFromFirebase(
                                                                file.url,
                                                            );
                                                        }
                                                    }}
                                                >
                                                    {fileList.length >= 10 ? null : (
                                                        <div>
                                                            <PlusOutlined />
                                                            <div style={{ marginTop: 8 }}>
                                                                Upload
                                                            </div>
                                                        </div>
                                                    )}
                                                </Upload>
                                            </Form.Item>

                                            <Form.Item
                                                name="imageNotes"
                                                label="Ghi chú hình ảnh"
                                            >
                                                <Input.TextArea
                                                    rows={2}
                                                    placeholder="Nhập ghi chú cho hình ảnh..."
                                                />
                                            </Form.Item>
                                        </Col>
                                    </Row>
                                </Form>
                            ),
                        },
                    ]}
                />
            </Modal>

        </>
    );
};

export default ServiceFormModal;


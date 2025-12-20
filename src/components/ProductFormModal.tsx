"use client";

import type { Product } from "@/types/product";
import { FirebaseOrderData } from "@/types/order";
import { genCode } from "@/utils/genCode";
import { ShoppingCartOutlined, PlusOutlined } from "@ant-design/icons";
import {
    App,
    Button,
    Col,
    Form,
    Input,
    InputNumber,
    Modal,
    Row,
    Select,
    Typography,
    Upload,
} from "antd";
import type { UploadFile, RcFile } from "antd/lib/upload/interface";
import { getDatabase, ref, set, update, onValue } from "firebase/database";
import {
    deleteObject,
    getDownloadURL,
    getStorage,
    ref as storageRef,
    uploadBytes,
} from "firebase/storage";
import { useEffect, useState } from "react";
import RichTextEditor from "./RichTextEditor";

const { Text } = Typography;

interface ProductFormModalProps {
    open: boolean;
    editingProduct: Product | null;
    onCancel: () => void;
    onSuccess: () => void;
}

const ProductFormModal: React.FC<ProductFormModalProps> = ({
    open,
    editingProduct,
    onCancel,
    onSuccess,
}) => {
    const [form] = Form.useForm();
    const { message } = App.useApp();
    const [fileList, setFileList] = useState<UploadFile[]>([]);
    const [uploading, setUploading] = useState(false);
    const [orders, setOrders] = useState<FirebaseOrderData[]>([]);

    // Load orders for linking
    useEffect(() => {
        const database = getDatabase();
        const ordersRef = ref(database, "xoxo/orders");

        const unsubscribe = onValue(ordersRef, (snapshot) => {
            const data = snapshot.val() || {};
            const ordersArray = Object.entries(data).map(([id, order]) => ({
                id,
                ...(order as FirebaseOrderData),
            }));
            setOrders(ordersArray);
        });

        return () => unsubscribe();
    }, []);

    // Common product categories for phục chế đồ hiệu
    const productCategories = [
        "Xi (Sáp)",
        "Gel dưỡng da",
        "Chất tẩy rửa",
        "Kem bảo vệ",
        "Dầu dưỡng",
        "Bàn chải chuyên dụng",
        "Khăn lau chuyên dụng",
        "Bộ dụng cụ",
        "Khác",
    ];

    useEffect(() => {
        if (open) {
            form.resetFields();
            if (editingProduct) {
                form.setFieldsValue({
                    ...editingProduct,
                });
                // Set existing images
                if (editingProduct.images && editingProduct.images.length > 0) {
                    setFileList(
                        editingProduct.images.map((url, index) => ({
                            uid: `-${index}`,
                            name: `image-${index}.jpg`,
                            status: "done",
                            url,
                        })),
                    );
                } else {
                    setFileList([]);
                }
            } else {
                form.setFieldsValue({
                    code: genCode("PRD_"),
                });
                setFileList([]);
            }
        }
    }, [open, editingProduct, form]);

    const uploadImageToFirebase = async (
        file: RcFile,
        productCode: string,
        index: number,
    ): Promise<string> => {
        const storage = getStorage();
        const fileName = `products/${productCode}/${new Date().getTime()}_${index}_${file.name}`;
        const storageReference = storageRef(storage, fileName);
        const snapshot = await uploadBytes(storageReference, file);
        return await getDownloadURL(snapshot.ref);
    };

    const deleteImageFromFirebase = async (url: string) => {
        try {
            const storage = getStorage();
            const imageRef = storageRef(storage, url);
            await deleteObject(imageRef);
        } catch (error) {
            console.error("Error deleting image:", error);
        }
    };

    const handleImageChange = (info: any) => {
        setFileList(info.fileList);
    };

    const beforeUpload = (file: RcFile) => {
        const isImage = file.type.startsWith("image/");
        if (!isImage) {
            message.error("Chỉ được upload file ảnh!");
            return Upload.LIST_IGNORE;
        }
        const isLt2M = file.size / 1024 / 1024 < 2;
        if (!isLt2M) {
            message.error("Ảnh phải nhỏ hơn 2MB!");
            return Upload.LIST_IGNORE;
        }
        return false; // Prevent auto upload
    };

    const handleSubmit = async () => {
        setUploading(true);
        try {
            const values = await form.validateFields();
            const database = getDatabase();
            const now = new Date().getTime();

            const uploadedImageUrls: string[] = [];
            const existingImageUrls: string[] = [];

            for (const file of fileList) {
                if (file.originFileObj) {
                    const url = await uploadImageToFirebase(
                        file.originFileObj as RcFile,
                        values.code,
                        uploadedImageUrls.length,
                    );
                    uploadedImageUrls.push(url);
                } else if (file.url) {
                    existingImageUrls.push(file.url);
                }
            }
            const finalImages = [...existingImageUrls, ...uploadedImageUrls];

            const productData: any = {
                ...values,
                images: finalImages.length > 0 ? finalImages : undefined,
                updatedAt: now,
                ...(editingProduct
                    ? { createdAt: editingProduct.createdAt }
                    : { createdAt: now }),
            };

            const cleanedData = Object.fromEntries(
                Object.entries(productData).filter(
                    ([_, value]) => value !== undefined && value !== null && value !== "",
                ),
            ) as Product;

            const productRef = ref(database, `xoxo/products/${values.code}`);

            if (editingProduct) {
                await update(productRef, cleanedData);
                message.success("Cập nhật sản phẩm thành công!");
            } else {
                await set(productRef, cleanedData);
                message.success("Thêm sản phẩm thành công!");
            }

            onCancel();
            onSuccess();
        } catch (error: any) {
            console.error("Error saving product:", error);
            message.error(
                `Có lỗi xảy ra khi lưu sản phẩm! Chi tiết: ${error.message || error.toString()}`,
            );
        } finally {
            setUploading(false);
        }
    };

    return (
        <Modal
            title={
                <div className="flex items-center gap-2">
                    <ShoppingCartOutlined />
                    <Text strong>
                        {editingProduct ? "Cập nhật sản phẩm" : "Thêm sản phẩm bán thêm"}
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
            <Form form={form} layout="vertical" className="mt-4">
                <Row gutter={24}>
                    <Col span={12}>
                        <Form.Item
                            name="name"
                            label="Tên sản phẩm"
                            rules={[
                                { required: true, message: "Vui lòng nhập tên sản phẩm!" },
                            ]}
                        >
                            <Input placeholder="Ví dụ: Xi phục chế da thật" size="large" />
                        </Form.Item>

                        <Form.Item name="code" label="Mã sản phẩm">
                            <Input placeholder="Tự động" disabled size="large" />
                        </Form.Item>

                        <Form.Item name="category" label="Loại sản phẩm">
                            <Select
                                placeholder="Chọn loại sản phẩm"
                                size="large"
                                showSearch
                                allowClear
                                options={productCategories.map((cat) => ({
                                    label: cat,
                                    value: cat,
                                }))}
                            />
                        </Form.Item>

                        <Form.Item name="brand" label="Thương hiệu">
                            <Input
                                placeholder="Nhập thương hiệu (ví dụ: Leather Care Pro)"
                                size="large"
                                allowClear
                            />
                        </Form.Item>

                        <Form.Item name="price" label="Giá bán">
                            <InputNumber
                                placeholder="0"
                                size="large"
                                style={{ width: "100%" }}
                                formatter={(value) =>
                                    `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ",")
                                }
                                parser={(value) => value!.replace(/\$\s?|(,*)/g, "")}
                            />
                        </Form.Item>
                    </Col>
                    <Col span={12}>
                        <Form.Item label="Hình ảnh">
                            <Text type="secondary" className="block mb-2">
                                Upload tối đa 10 ảnh, dung lượng mỗi ảnh tối đa 2MB
                            </Text>
                            <Upload
                                listType="picture-card"
                                maxCount={10}
                                accept="image/*"
                                fileList={fileList}
                                onChange={handleImageChange}
                                beforeUpload={beforeUpload}
                                onRemove={async (file) => {
                                    if (file.url && file.originFileObj === undefined) {
                                        await deleteImageFromFirebase(file.url);
                                    }
                                }}
                            >
                                {fileList.length >= 10 ? null : (
                                    <div>
                                        <PlusOutlined />
                                        <div style={{ marginTop: 8 }}>Upload</div>
                                    </div>
                                )}
                            </Upload>
                        </Form.Item>

                        <Form.Item name="description" label="Mô tả">
                            <RichTextEditor placeholder="Nhập mô tả sản phẩm..." />
                        </Form.Item>

                        <Form.Item name="usage" label="Cách sử dụng">
                            <Input.TextArea
                                rows={3}
                                placeholder="Nhập hướng dẫn sử dụng..."
                            />
                        </Form.Item>

                        <Form.Item name="specifications" label="Thông số kỹ thuật">
                            <Input.TextArea
                                rows={2}
                                placeholder="Nhập thông số kỹ thuật..."
                            />
                        </Form.Item>

                        <Form.Item name="notes" label="Ghi chú">
                            <Input.TextArea placeholder="Nhập ghi chú..." rows={3} />
                        </Form.Item>

                        <Form.Item name="orderCodes" label="Liên kết đơn hàng">
                            <Select
                                mode="multiple"
                                placeholder="Chọn các đơn hàng đã sử dụng sản phẩm này"
                                size="large"
                                showSearch
                                allowClear
                                optionFilterProp="label"
                                options={orders.map((order) => ({
                                    label: `${order.code} - ${order.customerName}`,
                                    value: order.code,
                                }))}
                            />
                        </Form.Item>
                    </Col>
                </Row>
            </Form>
        </Modal>
    );
};

export default ProductFormModal;


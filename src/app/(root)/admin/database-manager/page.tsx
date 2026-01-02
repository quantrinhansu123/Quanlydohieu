"use client";

import { App, Button, Card, Typography, Space, Alert, Input, Modal, Tree } from "antd";
import React, { useState, useEffect, useCallback, useRef } from "react";
import { getDatabase, ref, get, remove, set, update } from "firebase/database";
import { useFirebaseApp } from "@/firebase/provider";
import { DeleteOutlined, EyeOutlined, ReloadOutlined, ExclamationCircleOutlined, EditOutlined, SearchOutlined, SaveOutlined } from "@ant-design/icons";

const { Title, Text, Paragraph } = Typography;
const { TextArea } = Input;

interface TreeNode {
    title: React.ReactNode;
    key: string;
    children?: TreeNode[];
    isLeaf?: boolean;
    data?: any;
}

export default function DatabaseManagerPage() {
    const { message: antdMessage } = App.useApp();
    const firebaseApp = useFirebaseApp();
    const [loading, setLoading] = useState(false);
    const [selectedPath, setSelectedPath] = useState<string>("");
    const [treeData, setTreeData] = useState<TreeNode[]>([]);
    const [expandedKeys, setExpandedKeys] = useState<React.Key[]>([]);
    const [searchKeys, setSearchKeys] = useState<React.Key[]>([]);
    const [previewData, setPreviewData] = useState<any>(null);
    const [previewVisible, setPreviewVisible] = useState(false);
    const [editMode, setEditMode] = useState(false);
    const [editData, setEditData] = useState<string>("");
    const [deletePath, setDeletePath] = useState("");
    const [searchPath, setSearchPath] = useState("");
    const [deleteAllVisible, setDeleteAllVisible] = useState(false);
    const [deleteAllConfirm, setDeleteAllConfirm] = useState("");
    const loadDatabaseStructureRef = useRef<() => Promise<void>>(() => Promise.resolve());
    const handlePreviewRef = useRef<(path: string) => Promise<void>>(() => Promise.resolve());
    const handleDeleteRef = useRef<(path: string) => void>(() => {});

    // Preview data at path
    const handlePreview = useCallback(async (path: string, edit: boolean = false) => {
        try {
            const db = getDatabase(firebaseApp);
            const pathRef = ref(db, path);
            const snapshot = await get(pathRef);
            const data = snapshot.val();

            setPreviewData({
                path,
                data,
                size: JSON.stringify(data || {}).length,
            });
            setEditData(JSON.stringify(data, null, 2));
            setEditMode(edit);
            setPreviewVisible(true);
        } catch (error: any) {
            antdMessage.error(`Lỗi khi xem dữ liệu: ${error.message}`);
        }
    }, [firebaseApp, antdMessage]);

    // Update data at path
    const handleUpdate = useCallback(async (path: string, newData: any) => {
        try {
            setLoading(true);
            const db = getDatabase(firebaseApp);
            const pathRef = ref(db, path);
            
            await set(pathRef, newData);
            
            antdMessage.success(`Đã cập nhật thành công: ${path}`);
            setEditMode(false);
            setPreviewVisible(false);
            
            // Reload tree
            if (loadDatabaseStructureRef.current) {
                await loadDatabaseStructureRef.current();
            }
        } catch (error: any) {
            console.error("Error updating data:", error);
            antdMessage.error(`Lỗi khi cập nhật: ${error.message}`);
        } finally {
            setLoading(false);
        }
    }, [firebaseApp, antdMessage]);

    // Save edited data
    const handleSaveEdit = useCallback(() => {
        if (!previewData?.path) return;
        
        try {
            const parsedData = JSON.parse(editData);
            handleUpdate(previewData.path, parsedData);
        } catch (error: any) {
            antdMessage.error(`Lỗi JSON: ${error.message}. Vui lòng kiểm tra định dạng!`);
        }
    }, [previewData, editData, handleUpdate, antdMessage]);

    // Delete path
    const handleDelete = useCallback((path: string) => {
        Modal.confirm({
            title: "Xác nhận xóa",
            width: 600,
            content: (
                <div>
                    <Alert
                        message="Cảnh báo"
                        description={
                            <div>
                                <p>
                                    Bạn có chắc chắn muốn xóa path này không?
                                </p>
                                <Text code className="mt-2 block">
                                    {path}
                                </Text>
                                <p className="mt-2 text-red-500">
                                    <strong>Hành động này không thể hoàn tác!</strong>
                                </p>
                            </div>
                        }
                        type="error"
                        showIcon
                        className="mt-4"
                    />
                </div>
            ),
            okText: "Xóa",
            okType: "danger",
            cancelText: "Hủy",
            onOk: async () => {
                try {
                    const db = getDatabase(firebaseApp);
                    const pathRef = ref(db, path);
                    await remove(pathRef);

                    antdMessage.success(`Đã xóa thành công: ${path}`);
                    
                    // Reload tree using ref
                    if (loadDatabaseStructureRef.current) {
                        await loadDatabaseStructureRef.current();
                    }
                } catch (error: any) {
                    console.error("Error deleting path:", error);
                    antdMessage.error(`Lỗi khi xóa: ${error.message}`);
                }
            },
        });
    }, [firebaseApp, antdMessage]);

    // Find path in tree and expand to it
    const findAndExpandPath = useCallback((targetPath: string) => {
        const normalizePath = (p: string) => {
            let path = p.trim();
            if (!path.startsWith("xoxo/")) {
                path = `xoxo/${path}`;
            }
            return path;
        };

        const normalizedPath = normalizePath(targetPath);
        const pathParts = normalizedPath.split("/").filter(p => p);
        
        // Build expanded keys by accumulating path parts
        const keysToExpand: React.Key[] = [];
        let currentPath = "";
        
        pathParts.forEach((part, index) => {
            if (index === 0) {
                currentPath = part;
            } else {
                currentPath = `${currentPath}/${part}`;
            }
            keysToExpand.push(currentPath);
        });

        setExpandedKeys(keysToExpand);
        setSearchKeys([normalizedPath]);
        setSelectedPath(normalizedPath);
        
        // Scroll to element after a short delay
        setTimeout(() => {
            const element = document.querySelector(`[data-key="${normalizedPath}"]`);
            if (element) {
                element.scrollIntoView({ behavior: "smooth", block: "center" });
            }
        }, 300);
    }, []);

    // Handle search path
    const handleSearchPath = useCallback(() => {
        if (!searchPath.trim()) {
            antdMessage.warning("Vui lòng nhập path cần tìm!");
            return;
        }
        findAndExpandPath(searchPath);
    }, [searchPath, findAndExpandPath, antdMessage]);

    // Load database structure
    const loadDatabaseStructure = useCallback(async () => {
        setLoading(true);
        try {
            const db = getDatabase(firebaseApp);
            const rootRef = ref(db, "xoxo");

            const snapshot = await get(rootRef);
            const data = snapshot.val() || {};
            
            console.log("📊 Database data loaded:", {
                keys: Object.keys(data),
                count: Object.keys(data).length,
            });

            const buildTree = (obj: any, path: string = "xoxo"): TreeNode[] => {
                if (!obj || typeof obj !== "object") {
                    return [];
                }

                return Object.entries(obj).map(([key, value]) => {
                    const currentPath = path ? `${path}/${key}` : key;
                    const isObject = value && typeof value === "object" && !Array.isArray(value);
                    const hasChildren = isObject && Object.keys(value).length > 0;

                    return {
                        title: (
                            <div className="flex items-center justify-between" data-key={currentPath}>
                                <Text strong>{key}</Text>
                                <Space>
                                    <Button
                                        type="text"
                                        size="small"
                                        icon={<EyeOutlined />}
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            if (handlePreviewRef.current) {
                                                handlePreviewRef.current(currentPath, false);
                                            }
                                        }}
                                    >
                                        Xem
                                    </Button>
                                    <Button
                                        type="text"
                                        size="small"
                                        icon={<EditOutlined />}
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            if (handlePreviewRef.current) {
                                                handlePreviewRef.current(currentPath, true);
                                            }
                                        }}
                                    >
                                        Sửa
                                    </Button>
                                    <Button
                                        type="text"
                                        danger
                                        size="small"
                                        icon={<DeleteOutlined />}
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            if (handleDeleteRef.current) {
                                                handleDeleteRef.current(currentPath);
                                            }
                                        }}
                                    >
                                        Xóa
                                    </Button>
                                </Space>
                            </div>
                        ),
                        key: currentPath,
                        isLeaf: !hasChildren,
                        children: hasChildren ? buildTree(value, currentPath) : undefined,
                        data: value,
                    };
                });
            };

            setTreeData(buildTree(data));
        } catch (error: any) {
            console.error("Error loading database structure:", error);
            antdMessage.error(`Lỗi: ${error.message}`);
        } finally {
            setLoading(false);
        }
    }, [firebaseApp, antdMessage]);

    // Update refs
    useEffect(() => {
        loadDatabaseStructureRef.current = loadDatabaseStructure;
        handlePreviewRef.current = handlePreview;
        handleDeleteRef.current = handleDelete;
    }, [loadDatabaseStructure, handlePreview, handleDelete]);

    // Delete by manual path input
    const handleDeleteByPath = () => {
        if (!deletePath.trim()) {
            antdMessage.warning("Vui lòng nhập path cần xóa!");
            return;
        }

        const path = deletePath.trim().startsWith("xoxo/")
            ? deletePath.trim()
            : `xoxo/${deletePath.trim()}`;

        handleDelete(path);
    };

    // Delete all database
    const handleDeleteAll = useCallback(async () => {
        if (deleteAllConfirm !== "XOA TAT CA") {
            antdMessage.error("Vui lòng nhập chính xác 'XOA TAT CA' để xác nhận!");
            return;
        }

        try {
            setLoading(true);
            const db = getDatabase(firebaseApp);
            const rootRef = ref(db, "xoxo");
            
            await remove(rootRef);
            
            antdMessage.success("Đã xóa toàn bộ database thành công!");
            setDeleteAllVisible(false);
            setDeleteAllConfirm("");
            
            // Reload tree
            if (loadDatabaseStructureRef.current) {
                await loadDatabaseStructureRef.current();
            }
        } catch (error: any) {
            console.error("Error deleting all database:", error);
            antdMessage.error(`Lỗi khi xóa database: ${error.message}`);
        } finally {
            setLoading(false);
        }
    }, [firebaseApp, antdMessage, deleteAllConfirm]);

    useEffect(() => {
        loadDatabaseStructure();
    }, [loadDatabaseStructure]);

    return (
        <div className="p-6">
            <div className="flex justify-between items-center mb-6">
                <Title level={2}>Database Manager - Quản lý Database</Title>
                <Button
                    icon={<ReloadOutlined />}
                    onClick={loadDatabaseStructure}
                    loading={loading}
                >
                    Làm mới
                </Button>
            </div>

            <Alert
                message="Cảnh báo"
                description="Trang này cho phép xem, sửa, xóa bất kỳ phần nào trong database. Hãy cẩn thận khi sử dụng!"
                type="warning"
                showIcon
                className="mb-6"
            />

            {/* Delete All Database Button */}
            <Card 
                className="mb-6" 
                style={{ 
                    border: "2px solid #ff4d4f",
                    backgroundColor: "#fff1f0"
                }}
            >
                <Space direction="vertical" className="w-full" size="middle">
                    <div>
                        <Text strong style={{ color: "#ff4d4f", fontSize: "16px" }}>
                            <ExclamationCircleOutlined /> XOA TOAN BO DATABASE
                        </Text>
                    </div>
                    <Alert
                        message="Cảnh báo cực kỳ nguy hiểm"
                        description="Hành động này sẽ xóa TOAN BO dữ liệu trong database (xoxo/). Không thể hoàn tác!"
                        type="error"
                        showIcon
                    />
                    <Button
                        type="primary"
                        danger
                        size="large"
                        icon={<DeleteOutlined />}
                        onClick={() => setDeleteAllVisible(true)}
                        block
                    >
                        XOA TOAN BO DATABASE
                    </Button>
                </Space>
            </Card>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Left: Tree View */}
                <Card title="Cấu trúc Database" loading={loading}>
                    {/* Search Path */}
                    <div className="mb-4">
                        <Space.Compact className="w-full">
                            <Input
                                placeholder="Paste path để tìm kiếm (VD: xoxo/orders/ORD_123)"
                                value={searchPath}
                                onChange={(e) => setSearchPath(e.target.value)}
                                onPressEnter={handleSearchPath}
                                prefix={<SearchOutlined />}
                            />
                            <Button
                                type="primary"
                                icon={<SearchOutlined />}
                                onClick={handleSearchPath}
                            >
                                Tìm
                            </Button>
                        </Space.Compact>
                    </div>

                    <div className="max-h-[70vh] overflow-auto">
                        {treeData.length > 0 ? (
                            <>
                                <div className="mb-2">
                                    <Text type="secondary" className="text-xs">
                                        Tổng số nodes: {treeData.length} (Click để mở rộng)
                                    </Text>
                                </div>
                                <Tree
                                    treeData={treeData}
                                    expandedKeys={expandedKeys}
                                    selectedKeys={searchKeys}
                                    onExpand={(keys) => setExpandedKeys(keys)}
                                    showLine
                                    onSelect={(keys) => {
                                        if (keys.length > 0) {
                                            setSelectedPath(keys[0] as string);
                                            setSearchKeys(keys);
                                        }
                                    }}
                                />
                            </>
                        ) : loading ? (
                            <Text type="secondary">Đang tải...</Text>
                        ) : (
                            <div>
                                <Text type="secondary">Không có dữ liệu</Text>
                                <br />
                                <Text type="secondary" className="text-xs">
                                    Kiểm tra console để xem chi tiết
                                </Text>
                            </div>
                        )}
                    </div>
                </Card>

                {/* Right: Actions */}
                <Card title="Thao tác">
                    <Space direction="vertical" className="w-full" size="large">
                        {/* Search Path */}
                        <div>
                            <Text strong>Tìm kiếm Path:</Text>
                            <Input
                                placeholder="Paste path để tìm kiếm"
                                value={searchPath}
                                onChange={(e) => setSearchPath(e.target.value)}
                                className="mt-2"
                                onPressEnter={handleSearchPath}
                                prefix={<SearchOutlined />}
                            />
                            <Button
                                type="primary"
                                icon={<SearchOutlined />}
                                onClick={handleSearchPath}
                                className="mt-2"
                                block
                            >
                                Tìm kiếm và mở rộng
                            </Button>
                        </div>

                        {/* Delete Path */}
                        <div>
                            <Text strong>Xóa theo Path:</Text>
                            <Input
                                placeholder="VD: xoxo/operational_workflows hoặc operational_workflows"
                                value={deletePath}
                                onChange={(e) => setDeletePath(e.target.value)}
                                className="mt-2"
                                onPressEnter={handleDeleteByPath}
                            />
                            <Text type="secondary" className="text-xs block mt-1">
                                Path sẽ tự động thêm prefix "xoxo/" nếu chưa có
                            </Text>
                            <Button
                                type="primary"
                                danger
                                block
                                onClick={handleDeleteByPath}
                                disabled={!deletePath.trim()}
                                className="mt-2"
                            >
                                Xóa Path
                            </Button>
                        </div>

                        {/* Selected Path Actions */}
                        {selectedPath && (
                            <Card size="small">
                                <Text strong>Path đã chọn:</Text>
                                <Text code className="block mt-2 break-all">{selectedPath}</Text>
                                <Space className="mt-4" wrap>
                                    <Button
                                        size="small"
                                        icon={<EyeOutlined />}
                                        onClick={() => handlePreview(selectedPath, false)}
                                    >
                                        Xem dữ liệu
                                    </Button>
                                    <Button
                                        size="small"
                                        icon={<EditOutlined />}
                                        onClick={() => handlePreview(selectedPath, true)}
                                    >
                                        Sửa dữ liệu
                                    </Button>
                                    <Button
                                        size="small"
                                        danger
                                        icon={<DeleteOutlined />}
                                        onClick={() => handleDelete(selectedPath)}
                                    >
                                        Xóa
                                    </Button>
                                </Space>
                            </Card>
                        )}
                    </Space>
                </Card>
            </div>

            {/* Preview/Edit Modal */}
            <Modal
                title={
                    <span>
                        {editMode ? (
                            <>
                                <EditOutlined /> Sửa dữ liệu: {previewData?.path}
                            </>
                        ) : (
                            <>
                                <EyeOutlined /> Xem dữ liệu: {previewData?.path}
                            </>
                        )}
                    </span>
                }
                open={previewVisible}
                onCancel={() => {
                    setPreviewVisible(false);
                    setEditMode(false);
                    setEditData("");
                }}
                footer={[
                    <Button key="close" onClick={() => {
                        setPreviewVisible(false);
                        setEditMode(false);
                        setEditData("");
                    }}>
                        Đóng
                    </Button>,
                    editMode ? (
                        <>
                            <Button
                                key="cancel"
                                onClick={() => {
                                    setEditMode(false);
                                    if (previewData?.data) {
                                        setEditData(JSON.stringify(previewData.data, null, 2));
                                    }
                                }}
                            >
                                Hủy sửa
                            </Button>
                            <Button
                                key="save"
                                type="primary"
                                icon={<SaveOutlined />}
                                onClick={handleSaveEdit}
                                loading={loading}
                            >
                                Lưu
                            </Button>
                        </>
                    ) : (
                        <>
                            <Button
                                key="edit"
                                icon={<EditOutlined />}
                                onClick={() => setEditMode(true)}
                            >
                                Sửa
                            </Button>
                            <Button
                                key="delete"
                                danger
                                onClick={() => {
                                    if (previewData?.path) {
                                        setPreviewVisible(false);
                                        handleDelete(previewData.path);
                                    }
                                }}
                            >
                                Xóa Path này
                            </Button>
                        </>
                    ),
                ]}
                width={900}
            >
                {previewData && (
                    <div>
                        <Space className="mb-4">
                            <Text strong>Path:</Text>
                            <Text code>{previewData.path}</Text>
                            <Text type="secondary">
                                (Size: {(previewData.size / 1024).toFixed(2)} KB)
                            </Text>
                        </Space>
                        {editMode ? (
                            <div>
                                <Alert
                                    message="Chế độ chỉnh sửa"
                                    description="Bạn có thể sửa định dạng JSON. Lưu ý: Định dạng JSON phải hợp lệ!"
                                    type="info"
                                    showIcon
                                    className="mb-4"
                                />
                                <TextArea
                                    value={editData}
                                    onChange={(e) => setEditData(e.target.value)}
                                    rows={20}
                                    style={{ fontFamily: "monospace", fontSize: "12px" }}
                                />
                            </div>
                        ) : (
                            <TextArea
                                value={JSON.stringify(previewData.data, null, 2)}
                                readOnly
                                rows={20}
                                style={{ fontFamily: "monospace", fontSize: "12px" }}
                            />
                        )}
                    </div>
                )}
            </Modal>

            {/* Delete All Database Modal */}
            <Modal
                title={
                    <span style={{ color: "#ff4d4f" }}>
                        <ExclamationCircleOutlined /> XOA TOAN BO DATABASE
                    </span>
                }
                open={deleteAllVisible}
                onCancel={() => {
                    setDeleteAllVisible(false);
                    setDeleteAllConfirm("");
                }}
                footer={null}
                width={600}
            >
                <Space direction="vertical" className="w-full" size="large">
                    <Alert
                        message="Cảnh báo cực kỳ nguy hiểm"
                        description={
                            <div>
                                <p>Bạn đang chuẩn bị xóa <strong>TOAN BO</strong> dữ liệu trong database!</p>
                                <p className="mt-2">Điều này sẽ xóa:</p>
                                <ul className="list-disc pl-5 mt-2">
                                    <li>Tất cả đơn hàng</li>
                                    <li>Tất cả sản phẩm</li>
                                    <li>Tất cả quy trình</li>
                                    <li>Tất cả nhân viên</li>
                                    <li>Tất cả dữ liệu khác trong xoxo/</li>
                                </ul>
                                <p className="mt-2 text-red-500">
                                    <strong>Hành động này KHONG THE hoàn tác!</strong>
                                </p>
                            </div>
                        }
                        type="error"
                        showIcon
                    />

                    <div>
                        <Text strong>Để xác nhận, vui lòng nhập: </Text>
                        <Text code strong style={{ fontSize: "16px" }}>
                            XOA TAT CA
                        </Text>
                        <Input
                            placeholder="Nhập 'XOA TAT CA' để xác nhận"
                            value={deleteAllConfirm}
                            onChange={(e) => setDeleteAllConfirm(e.target.value)}
                            className="mt-2"
                            onPressEnter={handleDeleteAll}
                        />
                    </div>

                    <Space className="w-full justify-end">
                        <Button
                            onClick={() => {
                                setDeleteAllVisible(false);
                                setDeleteAllConfirm("");
                            }}
                        >
                            Hủy
                        </Button>
                        <Button
                            type="primary"
                            danger
                            icon={<DeleteOutlined />}
                            onClick={handleDeleteAll}
                            loading={loading}
                            disabled={deleteAllConfirm !== "XOA TAT CA"}
                        >
                            XOA TOAN BO
                        </Button>
                    </Space>
                </Space>
            </Modal>
        </div>
    );
}

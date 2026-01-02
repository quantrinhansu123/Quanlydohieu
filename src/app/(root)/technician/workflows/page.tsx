"use client";

import { OperationalWorkflowService, OperationalWorkflow, OperationalWorkflowMaterial } from "@/services/operationalWorkflowService";
import { DepartmentService, IDepartment } from "@/services/departmentService";
import { InventoryService } from "@/services/inventoryService";
import { Material } from "@/types/inventory";
import WrapperContent from "@/components/WrapperContent";
import { App, Button, Card, Form, Input, Modal, Table, Tag, Popconfirm, Space, Typography, Row, Col, Select, InputNumber, Collapse, AutoComplete } from "antd";

const { Option } = Select;
import { DeleteOutlined, EditOutlined, PlusOutlined, AppstoreOutlined, BankOutlined, ShoppingOutlined } from "@ant-design/icons";
import { useEffect, useState, useMemo } from "react";
import type { TableColumnsType } from "antd";

const { Text } = Typography;

interface OperationalWorkflowFormData {
  workflowName: string;
  departmentCode?: string;
  jobs: Array<{
    jobName: string;
    tasks: Array<{
      taskName: string;
      description?: string;
      standard?: string;
    }>;
    materials?: OperationalWorkflowMaterial[];
  }>;
  materials?: OperationalWorkflowMaterial[];
}

export default function OperationalWorkflowPage() {
  const [workflows, setWorkflows] = useState<OperationalWorkflow[]>([]);
  const [departments, setDepartments] = useState<IDepartment[]>([]);
  const [materials, setMaterials] = useState<Material[]>([]);
  const [loading, setLoading] = useState(true);
  const [formVisible, setFormVisible] = useState(false);
  const [editingWorkflow, setEditingWorkflow] = useState<OperationalWorkflow | undefined>();
  const [form] = Form.useForm<OperationalWorkflowFormData>();
  const { message } = App.useApp();

  // Load data
  useEffect(() => {
    const unsubscribe = OperationalWorkflowService.onSnapshot((data) => {
      setWorkflows(data);
      setLoading(false);
    });

    return () => {
      unsubscribe();
    };
  }, []);

  // Load departments
  useEffect(() => {
    const unsubscribe = DepartmentService.onSnapshot((data) => {
      setDepartments(data);
    });

    return () => {
      unsubscribe();
    };
  }, []);

  // Load materials
  useEffect(() => {
    const loadMaterials = async () => {
      try {
        console.log("Loading materials from database...");
        const materialsData = await InventoryService.getAllMaterials();
        console.log("Materials loaded:", materialsData.length, "items", materialsData);
        setMaterials(materialsData);
        if (materialsData.length === 0) {
          message.warning("Chưa có vật tư nào trong kho. Vui lòng thêm vật tư vào kho trước.");
        }
      } catch (error) {
        console.error("Error loading materials:", error);
        message.error("Không thể tải danh sách vật tư: " + (error as Error).message);
      }
    };

    loadMaterials();

    // Subscribe to real-time updates
    const unsubscribe = InventoryService.onMaterialsSnapshot((materialsData) => {
      console.log("Materials updated from snapshot:", materialsData.length, "items");
      setMaterials(materialsData);
    });

    return () => unsubscribe();
  }, [message]);

  // Set form values when editing
  useEffect(() => {
    if (formVisible && editingWorkflow) {
      // Reset form first
      form.resetFields();
      // Then set values after a short delay to ensure Form.List is ready
      setTimeout(() => {
        const formValues = {
          workflowName: editingWorkflow.workflowName,
          departmentCode: editingWorkflow.departmentCode,
          jobs: editingWorkflow.jobs.map((job) => ({
            jobName: job.jobName,
            tasks: job.tasks.map((task) => ({
              taskName: task.taskName,
              description: task.description || "",
              standard: task.standard || "",
            })),
            materials: job.materials && job.materials.length > 0 
              ? job.materials 
              : [{ materialId: "", materialName: "", quantity: 1, unit: "" }],
          })),
          materials: editingWorkflow.materials || [],
        };
        console.log("Setting form values for edit:", JSON.stringify(formValues, null, 2));
        form.setFieldsValue(formValues);
        // Force update after setting values
        setTimeout(() => {
          const currentValues = form.getFieldsValue();
          console.log("Current form values after set:", JSON.stringify(currentValues, null, 2));
        }, 100);
      }, 300);
    } else if (formVisible && !editingWorkflow) {
      // Reset form for new workflow
      form.resetFields();
      const defaultValues = {
        workflowName: "",
        departmentCode: undefined,
        jobs: [{ jobName: "", tasks: [{ taskName: "", description: "", standard: "" }], materials: [{ materialId: "", materialName: "", quantity: 1, unit: "" }] }],
        materials: [],
      };
      console.log("Setting default form values:", JSON.stringify(defaultValues, null, 2));
      form.setFieldsValue(defaultValues);
    }
  }, [formVisible, editingWorkflow, form]);

  // Departments map for easy lookup
  const departmentsMap = useMemo(() => {
    const map: Record<string, IDepartment> = {};
    departments.forEach((dept) => {
      map[dept.code] = dept;
    });
    return map;
  }, [departments]);

  // Group workflows by department - luôn group
  const groupedWorkflows = useMemo(() => {
    const grouped: Record<string, OperationalWorkflow[]> = {};
    workflows.forEach((workflow) => {
      const deptCode = workflow.departmentCode || "no_department";
      if (!grouped[deptCode]) {
        grouped[deptCode] = [];
      }
      grouped[deptCode].push(workflow);
    });
    
    // Sort by department name
    const sorted: Record<string, OperationalWorkflow[]> = {};
    Object.keys(grouped).sort((a, b) => {
      if (a === "no_department") return 1;
      if (b === "no_department") return -1;
      const deptA = departmentsMap[a];
      const deptB = departmentsMap[b];
      if (!deptA) return 1;
      if (!deptB) return -1;
      return deptA.name.localeCompare(deptB.name);
    }).forEach(key => {
      sorted[key] = grouped[key];
    });
    
    return sorted;
  }, [workflows, departmentsMap]);

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      console.log("Form values before submit:", JSON.stringify(values, null, 2));
      
      const workflowData = {
        workflowName: values.workflowName,
        departmentCode: values.departmentCode,
        jobs: values.jobs.map((job, jobIndex) => {
          const jobMaterials = job.materials?.filter(m => m.materialId && m.quantity > 0) || [];
          console.log(`Job ${jobIndex} materials:`, jobMaterials);
          return {
            id: editingWorkflow?.jobs[jobIndex]?.id || `JOB_${Date.now()}_${jobIndex}`,
            jobName: job.jobName,
            jobOrder: jobIndex + 1,
            tasks: job.tasks
              .filter((task) => task.taskName && task.taskName.trim() !== "")
              .map((task, taskIndex) => ({
                id: editingWorkflow?.jobs[jobIndex]?.tasks[taskIndex]?.id || `TASK_${Date.now()}_${taskIndex}`,
                taskName: task.taskName,
                description: task.description || "",
                standard: task.standard || "",
                taskOrder: taskIndex + 1,
              })),
            materials: jobMaterials,
          };
        }),
        materials: values.materials?.filter(m => m.materialId && m.quantity > 0) || [],
      };
      
      console.log("Workflow data to save:", JSON.stringify(workflowData, null, 2));

      if (editingWorkflow) {
        await OperationalWorkflowService.update(editingWorkflow.id, workflowData);
        message.success("Cập nhật quy trình vận hành thành công!");
      } else {
        await OperationalWorkflowService.create(workflowData);
        message.success("Tạo quy trình vận hành thành công!");
      }

      setFormVisible(false);
      setEditingWorkflow(undefined);
      form.resetFields();
    } catch (error) {
      console.error("Error saving workflow:", error);
      message.error("Có lỗi xảy ra khi lưu quy trình!");
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await OperationalWorkflowService.delete(id);
      message.success("Xóa quy trình thành công!");
    } catch (error) {
      console.error("Error deleting workflow:", error);
      message.error("Có lỗi xảy ra khi xóa quy trình!");
    }
  };

  const handleEdit = (workflow: OperationalWorkflow) => {
    console.log("handleEdit called with workflow:", workflow);
    try {
      setEditingWorkflow(workflow);
      setFormVisible(true);
      console.log("Form should be visible now");
    } catch (error) {
      console.error("Error in handleEdit:", error);
      message.error("Không thể mở form chỉnh sửa: " + (error as Error).message);
    }
  };

  const handleAdd = () => {
    setEditingWorkflow(undefined);
    form.resetFields();
    form.setFieldsValue({
      workflowName: "",
      departmentCode: undefined,
      jobs: [{ jobName: "", tasks: [{ taskName: "", description: "", standard: "" }], materials: [{ materialId: "", materialName: "", quantity: 1, unit: "" }] }],
      materials: [],
    });
    setFormVisible(true);
  };

  const columns: TableColumnsType<OperationalWorkflow> = useMemo(() => [
    {
      title: "Tên quy trình",
      dataIndex: "workflowName",
      key: "workflowName",
    },
    {
      title: "Phòng ban",
      key: "department",
      width: 150,
      render: (_, record) => {
        if (!record.departmentCode) {
          return <Tag color="default">Chưa có</Tag>;
        }
        const dept = departmentsMap[record.departmentCode];
        return <Tag color="cyan">{dept?.name || record.departmentCode}</Tag>;
      },
    },
    {
      title: "Số công việc",
      key: "jobsCount",
      width: 120,
      render: (_, record) => (
        <Tag color="blue">{record.jobs.length} công việc</Tag>
      ),
    },
    {
      title: "Tổng số công việc",
      key: "tasksCount",
      width: 120,
      render: (_, record) => {
        const totalTasks = record.jobs.reduce(
          (sum, job) => sum + job.tasks.length,
          0
        );
        return <Tag>{totalTasks} công việc</Tag>;
      },
    },
    {
      title: "Vật Tư",
      key: "materials",
      width: 350,
      render: (_, record) => {
        // Collect materials from both record.materials and jobs[].materials
        const allMaterials: Array<{ materialName: string; quantity: number; unit: string }> = [];
        
        // Helper function to get material name
        const getMaterialName = (mat: any): string => {
          if (mat.materialName) {
            return mat.materialName;
          }
          if (mat.materialId) {
            const foundMaterial = materials.find(m => m.id === mat.materialId);
            return foundMaterial?.name || mat.materialId;
          }
          return "";
        };

        // Helper function to get material unit
        const getMaterialUnit = (mat: any): string => {
          if (mat.unit) {
            return mat.unit;
          }
          if (mat.materialId) {
            const foundMaterial = materials.find(m => m.id === mat.materialId);
            return foundMaterial?.unit || "";
          }
          return "";
        };
        
        // Add materials from record.materials
        if (record.materials && record.materials.length > 0) {
          record.materials.forEach((mat: any) => {
            // Check if material has materialId or materialName
            if (mat.materialId || mat.materialName) {
              const materialName = getMaterialName(mat);
              if (materialName) {
                allMaterials.push({
                  materialName: materialName,
                  quantity: mat.quantity || 0,
                  unit: getMaterialUnit(mat),
                });
              }
            }
          });
        }
        
        // Add materials from jobs
        if (record.jobs && record.jobs.length > 0) {
          record.jobs.forEach((job: any) => {
            if (job.materials && job.materials.length > 0) {
              job.materials.forEach((mat: any) => {
                // Check if material has materialId or materialName
                if (mat.materialId || mat.materialName) {
                  const materialName = getMaterialName(mat);
                  if (materialName) {
                    allMaterials.push({
                      materialName: materialName,
                      quantity: mat.quantity || 0,
                      unit: getMaterialUnit(mat),
                    });
                  }
                }
              });
            }
          });
        }
        
        if (allMaterials.length === 0) {
          return <Tag>Không có</Tag>;
        }
        
        return (
          <Space wrap size="small">
            {allMaterials.map((mat, idx) => (
              <Tag key={idx} color="orange" icon={<ShoppingOutlined />}>
                {mat.materialName}: {mat.quantity} {mat.unit}
              </Tag>
            ))}
          </Space>
        );
      },
    },
    {
      title: "Thao tác",
      key: "action",
      width: 120,
      fixed: "right" as const,
      render: (_, record) => (
        <Space>
          <Button
            type="text"
            icon={<EditOutlined />}
            onClick={() => handleEdit(record)}
          />
          <Popconfirm
            title="Xác nhận xóa"
            description="Bạn có chắc chắn muốn xóa quy trình này?"
            onConfirm={() => handleDelete(record.id)}
            okText="Xóa"
            cancelText="Hủy"
          >
            <Button type="text" danger icon={<DeleteOutlined />} />
          </Popconfirm>
        </Space>
      ),
    },
  ], [departmentsMap, materials]);

  return (
    <>
      <WrapperContent
        isLoading={loading}
        isEmpty={!loading && workflows.length === 0}
        title="Quy trình vận hành"
        header={{
          searchInput: {
            placeholder: "Tìm kiếm quy trình...",
            filterKeys: ["workflowName"],
          },
          buttonEnds: [
            {
              can: true,
              type: "primary",
              name: "Thêm quy trình",
              icon: <PlusOutlined />,
              onClick: handleAdd,
            },
          ],
        }}
      >
        <Card>
          <div className="space-y-6">
            {Object.entries(groupedWorkflows).map(([deptCode, deptWorkflows]) => {
              const dept = deptCode !== "no_department" ? departmentsMap[deptCode] : null;
              return (
                <div 
                  key={deptCode} 
                  className="border rounded-lg overflow-hidden"
                  style={{
                    borderColor: "#3f3f46",
                    backgroundColor: "#1a1a1a",
                  }}
                >
                  <div 
                    className="px-4 py-3 border-b"
                    style={{
                      backgroundColor: "#27272a",
                      borderBottomColor: "#3f3f46",
                    }}
                  >
                    <div className="flex items-center justify-between" style={{ display: "flex", flexDirection: "row", alignItems: "center", width: "100%" }}>
                      <Typography.Title 
                        level={5} 
                        className="mb-0"
                        style={{ 
                          color: "#d9d9d9",
                          fontSize: "16px",
                          fontWeight: 600,
                          margin: 0,
                          marginBottom: 0,
                          display: "inline-block",
                          whiteSpace: "nowrap",
                        }}
                      >
                        {dept ? dept.name : "Chưa có phòng ban"}
                      </Typography.Title>
                      <Tag 
                        color="blue" 
                        style={{
                          fontSize: "12px",
                          margin: 0,
                          marginLeft: "12px",
                          fontWeight: 500,
                          flexShrink: 0,
                        }}
                      >
                        {deptWorkflows.length} quy trình
                      </Tag>
                    </div>
                  </div>
                  <div className="p-4">
                    <Table
                      dataSource={deptWorkflows}
                      columns={columns}
                      rowKey="id"
                      pagination={false}
                      size="middle"
                      style={{
                        backgroundColor: "transparent",
                      }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
      </WrapperContent>

      <Modal
        title={editingWorkflow ? "Chỉnh sửa quy trình" : "Thêm quy trình mới"}
        open={formVisible}
        onCancel={() => {
          setFormVisible(false);
          setEditingWorkflow(undefined);
          form.resetFields();
        }}
        onOk={handleSubmit}
        width={800}
        styles={{
          body: { maxHeight: "calc(100vh - 200px)", overflowY: "auto" },
        }}
        destroyOnClose
      >
        <Form
          form={form}
          layout="vertical"
          className="mt-4"
          key={editingWorkflow?.id || "new"}
        >
          <Form.Item
            name="workflowName"
            label="Tên quy trình"
            rules={[{ required: true, message: "Vui lòng nhập tên quy trình!" }]}
          >
            <Input placeholder="Nhập tên quy trình" />
          </Form.Item>

          <Form.Item
            name="departmentCode"
            label="Phòng ban"
          >
            <Select
              placeholder="Chọn phòng ban (tùy chọn)"
              allowClear
              showSearch
              optionFilterProp="children"
              suffixIcon={<BankOutlined className="text-gray-400" />}
            >
              {departments.map((dept) => (
                <Select.Option key={dept.code} value={dept.code}>
                  {dept.name}
                </Select.Option>
              ))}
            </Select>
          </Form.Item>

          <Form.List name="jobs">
            {(fields, { add: addJob, remove: removeJob }) => (
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <Text strong>Danh sách Hành động</Text>
                  <Button
                    type="dashed"
                    icon={<PlusOutlined />}
                    onClick={() => addJob({ jobName: "", tasks: [{ taskName: "", description: "", standard: "" }], materials: [{ materialId: "", materialName: "", quantity: 1, unit: "" }] })}
                  >
                    Thêm hành động
                  </Button>
                </div>

                {fields.map((jobField, jobIndex) => (
                  <Card
                    key={jobField.key}
                    size="small"
                    title={
                      <div className="flex items-center gap-2">
                        <span>Hành động {jobIndex + 1}</span>
                        <Form.Item
                          {...jobField}
                          name={[jobField.name, "jobName"]}
                          rules={[{ required: true, message: "Vui lòng nhập tên hành động!" }]}
                          className="mb-0 flex-1"
                          style={{ marginBottom: 0 }}
                        >
                          <Input placeholder="Nhập tên hành động" size="small" />
                        </Form.Item>
                      </div>
                    }
                    extra={
                      <Button
                        type="text"
                        danger
                        icon={<DeleteOutlined />}
                        onClick={() => removeJob(jobField.name)}
                        size="small"
                      />
                    }
                    className="mb-4"
                  >

                    <Form.List name={[jobField.name, "tasks"]}>
                      {(taskFields, { add: addTask, remove: removeTask }) => (
                        <div className="space-y-2">
                          <div className="flex justify-between items-center mb-2">
                            <Text strong className="text-sm">Danh sách Hành động</Text>
                            <Button
                              type="dashed"
                              size="small"
                              icon={<PlusOutlined />}
                              onClick={() => addTask({ taskName: "", description: "", standard: "" })}
                            >
                              Thêm hành động
                            </Button>
                          </div>

                          {taskFields.map((taskField) => (
                            <div key={taskField.key} className="space-y-2">
                              <Row gutter={12} align="top">
                                <Col span={6}>
                                  <Form.Item
                                    {...taskField}
                                    name={[taskField.name, "taskName"]}
                                    label="Tên hành động"
                                    rules={[{ required: true, message: "Vui lòng nhập tên hành động!" }]}
                                    className="mb-0"
                                  >
                                    <Input placeholder="Nhập tên hành động" />
                                  </Form.Item>
                                </Col>
                                <Col span={6}>
                                  <Form.Item
                                    {...taskField}
                                    name={[taskField.name, "standard"]}
                                    label="Tiêu chuẩn"
                                    className="mb-0"
                                  >
                                    <Input.TextArea 
                                      placeholder="Nhập tiêu chuẩn" 
                                      rows={2}
                                      autoSize={{ minRows: 2, maxRows: 4 }}
                                    />
                                  </Form.Item>
                                </Col>
                                <Col span={11}>
                                  <Form.Item
                                    {...taskField}
                                    name={[taskField.name, "description"]}
                                    label="Mô tả chi tiết hành động"
                                    className="mb-0"
                                  >
                                    <Input.TextArea 
                                      placeholder="Nhập mô tả chi tiết" 
                                      rows={2}
                                      autoSize={{ minRows: 2, maxRows: 4 }}
                                    />
                                  </Form.Item>
                                </Col>
                                <Col span={1}>
                                  <Form.Item label=" " className="mb-0">
                                    <Button
                                      type="text"
                                      danger
                                      icon={<DeleteOutlined />}
                                      onClick={() => removeTask(taskField.name)}
                                      style={{ marginTop: "30px" }}
                                    />
                                  </Form.Item>
                                </Col>
                              </Row>
                            </div>
                          ))}
                        </div>
                      )}
                    </Form.List>

                    {/* Materials for this Job */}
                    <Form.List name={[jobField.name, "materials"]}>
                      {(materialFields, { add: addMaterial, remove: removeMaterial }) => {
                        console.log("Material fields in render:", materialFields.length, "for job:", jobField.name);
                        return (
                          <div className="space-y-3 mt-4 pt-4 border-t" style={{ borderColor: "#3f3f46" }}>
                            <div className="flex justify-between items-center mb-3">
                              <Text strong className="text-sm">Danh mục vật tư cho hành động này</Text>
                              <Button
                                type="dashed"
                                size="small"
                                icon={<PlusOutlined />}
                                onClick={(e) => {
                                  e.preventDefault();
                                  e.stopPropagation();
                                  addMaterial({ materialId: "", materialName: "", quantity: 1, unit: "" });
                                }}
                              >
                                Thêm vật tư
                              </Button>
                            </div>

                            {materialFields.length === 0 && (
                              <div className="text-center py-2 text-gray-400 text-sm">
                                Chưa có vật tư. Đang tải...
                              </div>
                            )}

                            {materialFields.map((materialField, matIndex) => {
                              const MaterialImageDisplay = () => {
                                return (
                                  <Form.Item
                                    noStyle
                                    shouldUpdate={(prevValues, currentValues) => {
                                      const prevMaterialId = prevValues?.jobs?.[jobIndex]?.materials?.[matIndex]?.materialId;
                                      const currentMaterialId = currentValues?.jobs?.[jobIndex]?.materials?.[matIndex]?.materialId;
                                      return prevMaterialId !== currentMaterialId;
                                    }}
                                  >
                                    {() => {
                                      const materialIdValue = form.getFieldValue([jobField.name, "materials", materialField.name, "materialId"]);
                                      const selectedMaterial = materials.find(m => m.id === materialIdValue);
                                      
                                      if (!selectedMaterial) return null;
                                      
                                      return (
                                        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100%" }}>
                                          {selectedMaterial.image ? (
                                            <img 
                                              src={selectedMaterial.image} 
                                              alt={selectedMaterial.name}
                                              style={{ width: 40, height: 40, objectFit: "cover", borderRadius: 4 }}
                                            />
                                          ) : (
                                            <div style={{ width: 40, height: 40, backgroundColor: "#333", borderRadius: 4, display: "flex", alignItems: "center", justifyContent: "center" }}>
                                              <ShoppingOutlined style={{ fontSize: 20, color: "#999" }} />
                                            </div>
                                          )}
                                        </div>
                                      );
                                    }}
                                  </Form.Item>
                                );
                              };
                              
                              return (
                                <div key={materialField.key} className="mb-3 p-3 border rounded" style={{ backgroundColor: "#000", borderColor: "#333" }}>
                                  <Row gutter={12} align="middle">
                                    <Col span={2}>
                                      <MaterialImageDisplay />
                                    </Col>
                                    <Col span={16}>
                                      <Form.Item
                                        {...materialField}
                                        name={[materialField.name, "materialId"]}
                                        label={<span style={{ color: "#FFD700", fontWeight: "bold" }}>Vật tư</span>}
                                        rules={[{ required: true, message: "Vui lòng chọn vật tư!" }]}
                                        className="mb-0"
                                        style={{
                                          marginBottom: 0,
                                        }}
                                        labelCol={{
                                          style: {
                                            lineHeight: "40px",
                                            paddingBottom: 0,
                                          }
                                        }}
                                      >
                                        <Select
                                          placeholder="Gõ để tìm vật tư..."
                                          size="small"
                                          showSearch
                                          allowClear
                                          optionLabelProp="label"
                                          filterOption={(inputValue, option) => {
                                            const material = materials.find(m => m.id === option?.value);
                                            if (!material) return false;
                                            return material.name.toLowerCase().includes(inputValue.toLowerCase());
                                          }}
                                          onChange={(value) => {
                                            const material = materials.find(m => m.id === value);
                                            if (material) {
                                              // Get current quantity
                                              const currentQuantity = form.getFieldValue([jobField.name, "materials", materialField.name, "quantity"]);
                                              
                                              // Update the full materials array
                                              const currentMaterials = form.getFieldValue([jobField.name, "materials"]) || [];
                                              currentMaterials[matIndex] = {
                                                ...currentMaterials[matIndex],
                                                materialId: value,
                                                materialName: material.name,
                                                unit: material.unit,
                                                quantity: currentQuantity || 1,
                                              };
                                              
                                              // Set the entire materials array
                                              form.setFieldValue([jobField.name, "materials"], [...currentMaterials]);
                                              
                                              // Set quantity if not set
                                              if (!currentQuantity || currentQuantity === 0) {
                                                form.setFieldValue([jobField.name, "materials", materialField.name, "quantity"], 1);
                                              }
                                            } else if (!value) {
                                              // When cleared
                                              const currentMaterials = form.getFieldValue([jobField.name, "materials"]) || [];
                                              currentMaterials[matIndex] = {
                                                ...currentMaterials[matIndex],
                                                materialId: undefined,
                                                materialName: "",
                                                unit: "",
                                              };
                                              form.setFieldValue([jobField.name, "materials"], [...currentMaterials]);
                                            }
                                          }}
                                          notFoundContent={materials.length === 0 ? "Chưa có vật tư nào trong kho" : "Không tìm thấy"}
                                          style={{ width: "100%" }}
                                          dropdownStyle={{ backgroundColor: "#1a1a1a" }}
                                        >
                                          {materials && materials.length > 0 ? materials.map((material) => (
                                            <Option key={material.id} value={material.id} label={material.name}>
                                              <div 
                                                className="flex items-center py-2 px-2 rounded" 
                                                style={{ 
                                                  display: "flex", 
                                                  alignItems: "flex-start", 
                                                  flexDirection: "row",
                                                  backgroundColor: "#27272a",
                                                  gap: "12px"
                                                }}
                                              >
                                                {material.image ? (
                                                  <img 
                                                    src={material.image} 
                                                    alt={material.name}
                                                    style={{ width: 40, height: 40, objectFit: "cover", borderRadius: 4, flexShrink: 0 }}
                                                  />
                                                ) : (
                                                  <div style={{ width: 40, height: 40, backgroundColor: "#3f3f46", borderRadius: 4, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                                                    <ShoppingOutlined style={{ fontSize: 18, color: "#fff" }} />
                                                  </div>
                                                )}
                                                <div className="flex-1 min-w-0" style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                                                  <span className="font-medium" style={{ color: "#fff", fontSize: "14px" }}>{material.name}</span>
                                                  <span className="text-xs" style={{ color: "#fff", display: "flex", alignItems: "center", gap: "4px" }}>
                                                    <span>Tồn:</span>
                                                    <Tag color={material.stockQuantity > 0 ? "green" : "red"} style={{ margin: 0, fontSize: "10px", padding: "0 4px", lineHeight: "16px" }}>
                                                      {material.stockQuantity} {material.unit}
                                                    </Tag>
                                                  </span>
                                                </div>
                                              </div>
                                            </Option>
                                          )) : null}
                                        </Select>
                                      </Form.Item>
                                    </Col>
                                      <Col span={5}>
                                        <Form.Item
                                          {...materialField}
                                          name={[materialField.name, "quantity"]}
                                          label={<span style={{ color: "#fff" }}>Số lượng</span>}
                                          rules={[
                                            { required: true, message: "Vui lòng nhập số lượng!" },
                                            { type: "number", min: 0.01, message: "Số lượng phải lớn hơn 0!" },
                                          ]}
                                          className="mb-0"
                                        >
                                          <InputNumber
                                            placeholder="Số lượng"
                                            min={0.01}
                                            step={0.01}
                                            size="small"
                                            style={{ width: "100%" }}
                                          />
                                        </Form.Item>
                                      </Col>
                                      <Col span={1}>
                                        <Form.Item label=" " className="mb-0">
                                          <Button
                                            type="text"
                                            danger
                                            size="small"
                                            icon={<DeleteOutlined />}
                                            onClick={() => removeMaterial(materialField.name)}
                                            style={{ marginTop: "24px" }}
                                          />
                                        </Form.Item>
                                      </Col>
                                    </Row>
                                    <Form.Item
                                      {...materialField}
                                      name={[materialField.name, "materialName"]}
                                      hidden
                                    >
                                      <Input type="hidden" />
                                    </Form.Item>
                                    <Form.Item
                                      {...materialField}
                                      name={[materialField.name, "unit"]}
                                      hidden
                                    >
                                      <Input type="hidden" />
                                    </Form.Item>
                                  </div>
                                );
                              })}
                            </div>
                          );
                        }}
                      </Form.List>
                  </Card>
                ))}
              </div>
            )}
          </Form.List>

          {/* Materials Section */}
          <Form.List name="materials">
            {(fields, { add: addMaterial, remove: removeMaterial }) => (
              <div className="space-y-4 mt-6">
                <div className="flex justify-between items-center">
                  <Text strong>Danh mục vật liệu trong kho</Text>
                  <Button
                    type="dashed"
                    icon={<PlusOutlined />}
                    onClick={() => addMaterial({ materialId: "", materialName: "", quantity: 0, unit: "" })}
                  >
                    Thêm vật liệu
                  </Button>
                </div>

                {fields.map((field, index) => {
                  const materialId = Form.useWatch([field.name, "materialId"], form);
                  const selectedMaterial = materials.find(m => m.id === materialId);

                  return (
                    <Card
                      key={field.key}
                      size="small"
                      title={`Vật liệu ${index + 1}`}
                      extra={
                        <Button
                          type="text"
                          danger
                          icon={<DeleteOutlined />}
                          onClick={() => removeMaterial(field.name)}
                          size="small"
                        />
                      }
                      className="mb-4"
                    >
                      <Row gutter={12}>
                        <Col span={10}>
                          <Form.Item
                            {...field}
                            name={[field.name, "materialId"]}
                            label="Chọn vật liệu"
                            rules={[{ required: true, message: "Vui lòng chọn vật liệu!" }]}
                          >
                            <AutoComplete
                              placeholder="Gõ để tìm vật liệu..."
                              size="small"
                              filterOption={(inputValue, option) => {
                                const material = materials.find(m => m.id === option?.value);
                                if (!material) return false;
                                return material.name.toLowerCase().includes(inputValue.toLowerCase());
                              }}
                              onSelect={(value) => {
                                const material = materials.find(m => m.id === value);
                                if (material) {
                                  form.setFieldsValue({
                                    materials: form.getFieldValue("materials").map((m: OperationalWorkflowMaterial, idx: number) =>
                                      idx === index
                                        ? { ...m, materialId: value, materialName: material.name, unit: material.unit }
                                        : m
                                    ),
                                  });
                                }
                              }}
                              options={materials.map((material) => ({
                                value: material.id,
                                label: (
                                  <div className="flex justify-between items-center">
                                    <span>{material.name}</span>
                                    <Tag color={material.stockQuantity > 0 ? "green" : "red"} style={{ marginLeft: 8, fontSize: "11px" }}>
                                      {material.stockQuantity} {material.unit}
                                    </Tag>
                                  </div>
                                ),
                              }))}
                              style={{ width: "100%" }}
                            />
                          </Form.Item>
                        </Col>
                        <Col span={6}>
                          <Form.Item
                            {...field}
                            name={[field.name, "quantity"]}
                            label="Số lượng"
                            rules={[
                              { required: true, message: "Vui lòng nhập số lượng!" },
                              { type: "number", min: 0.01, message: "Số lượng phải lớn hơn 0!" },
                            ]}
                          >
                            <InputNumber
                              placeholder="Số lượng"
                              min={0.01}
                              step={0.01}
                              style={{ width: "100%" }}
                              disabled={!selectedMaterial}
                            />
                          </Form.Item>
                        </Col>
                        <Col span={6}>
                          <Form.Item
                            {...field}
                            name={[field.name, "unit"]}
                            label="Đơn vị"
                          >
                            <Input placeholder="Đơn vị" disabled value={selectedMaterial?.unit || ""} />
                          </Form.Item>
                        </Col>
                        <Col span={2}>
                          <Form.Item label=" " className="mb-0">
                            {selectedMaterial && (
                              <Tag color="blue" style={{ marginTop: "30px" }}>
                                Tồn: {selectedMaterial.stockQuantity}
                              </Tag>
                            )}
                          </Form.Item>
                        </Col>
                      </Row>
                      <Form.Item
                        {...field}
                        name={[field.name, "materialName"]}
                        hidden
                      >
                        <Input type="hidden" />
                      </Form.Item>
                    </Card>
                  );
                })}
              </div>
            )}
          </Form.List>
        </Form>
      </Modal>
    </>
  );
}

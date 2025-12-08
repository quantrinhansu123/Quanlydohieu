"use client";

import ButtonCall from "@/components/ButtonCall";
import { IMembers } from "@/types/members";
import {
  FirebaseOrderData,
  FirebaseWorkflowData,
  Workflow,
} from "@/types/order";
import { formatCurrency } from "@/utils/formatCurrency";
import { CheckOutlined, DeleteOutlined, PlusOutlined } from "@ant-design/icons";
import {
  App,
  Button,
  Card,
  Checkbox,
  Col,
  Collapse,
  DatePicker,
  Empty,
  Form,
  Input,
  Modal,
  Progress,
  Row,
  Select,
  Space,
  Tag,
  Typography,
} from "antd";
import dayjs from "dayjs";
import "dayjs/locale/vi";
import React, { useEffect, useState } from "react";

const { Text, Title } = Typography;

// Workflow Update Modal Component
interface WorkflowUpdateModalProps {
  visible: boolean;
  order: (FirebaseOrderData & { id: string }) | null;
  onCancel: () => void;
  onSave: (orderCode: string, updatedOrder: FirebaseOrderData) => void;
  members: Record<string, IMembers>;
  workflows: Record<string, Workflow>;
}

export const WorkflowUpdateModal: React.FC<WorkflowUpdateModalProps> = ({
  visible,
  order,
  onCancel,
  onSave,
  members,
  workflows,
}) => {
  const [form] = Form.useForm();
  const [localOrder, setLocalOrder] = useState<
    (FirebaseOrderData & { id: string }) | null
  >(null);
  const { message } = App.useApp();

  useEffect(() => {
    if (order) {
      setLocalOrder(order);
      form.setFieldsValue({
        customerName: order.customerName,
        phone: order.phone,
        email: order.email,
        address: order.address,
        deliveryDate: order.deliveryDate ? dayjs(order.deliveryDate) : null,
        notes: order.notes || "",
      });
    }
  }, [order, form]);

  const membersOptions = Object.entries(members).map(([id, membersMember]) => ({
    value: id,
    label: `${membersMember.name} (${membersMember.role})`,
  }));

  const workflowOptions = Object.entries(workflows).map(([id, workflow]) => ({
    value: id,
    label: workflow.name,
  }));

  const addWorkflow = (productId: string) => {
    if (!localOrder || !localOrder.products) return;

    const newWorkflowCode = `workflow_${new Date().getTime()}`;
    const firstWorkflowCode = Object.keys(workflows)[0] || "";
    const firstWorkflowName = workflows[firstWorkflowCode]?.name || "";

    const newWorkflow: FirebaseWorkflowData = {
      workflowCode: "",
      workflowName: "",
      members: [],
      isDone: false,
      updatedAt: new Date().getTime(),
    };

    const updatedOrder = {
      ...localOrder,
      products: {
        ...localOrder.products,
        [productId]: {
          ...localOrder.products[productId],
          workflows: {
            ...(localOrder.products[productId]?.workflows || {}),
            [newWorkflowCode]: newWorkflow,
          },
        },
      },
    };

    setLocalOrder(updatedOrder);
  };

  const updateWorkflow = (
    productId: string,
    workflowCode: string,
    field: string,
    value: any
  ) => {
    if (!localOrder || !localOrder.products || !localOrder.products[productId])
      return;

    const workflow = localOrder.products[productId].workflows?.[workflowCode];
    if (!workflow) return;

    let updatedWorkflow = { ...workflow };

    if (field === "workflowCode") {
      updatedWorkflow = {
        ...updatedWorkflow,
        workflowCode: value,
        workflowName: workflows[value]?.name || "",
      };
    } else {
      updatedWorkflow = {
        ...updatedWorkflow,
        [field]: value,
        updatedAt: new Date().getTime(),
      };
    }

    const updatedOrder = {
      ...localOrder,
      products: {
        ...localOrder.products,
        [productId]: {
          ...localOrder.products[productId],
          workflows: {
            ...localOrder.products[productId].workflows,
            [workflowCode]: updatedWorkflow,
          },
        },
      },
    };

    setLocalOrder(updatedOrder);
  };

  const removeWorkflow = (productId: string, workflowCode: string) => {
    if (!localOrder || !localOrder.products || !localOrder.products[productId])
      return;

    const productWorkflows = localOrder.products[productId].workflows || {};
    const { [workflowCode]: removedWorkflow, ...remainingWorkflows } =
      productWorkflows;

    const updatedOrder = {
      ...localOrder,
      products: {
        ...localOrder.products,
        [productId]: {
          ...localOrder.products[productId],
          workflows: remainingWorkflows,
        },
      },
    };

    setLocalOrder(updatedOrder);
  };

  const handleSave = async () => {
    try {
      const values = await form.validateFields();
      if (!localOrder) return;

      const updatedOrder = {
        ...localOrder,
        customerName: values.customerName,
        phone: values.phone,
        email: values.email,
        address: values.address,
        deliveryDate: values.deliveryDate.valueOf(),
        notes: values.notes,
        updatedAt: new Date().getTime(),
      };

      onSave(localOrder.id, updatedOrder);
      message.success("Đã cập nhật đơn hàng thành công!");
      onCancel();
    } catch (error) {
      message.error("Vui lòng kiểm tra lại thông tin!");
    }
  };

  if (!localOrder) return null;

  return (
    <Modal
      title={
        <div className="flex items-center gap-4">
          <div>
            <Text strong className="text-lg">
              Cập nhật đơn hàng: {localOrder.code}
            </Text>
          </div>
          <div className="flex items-center gap-2">
            {localOrder.phone && <ButtonCall phone={localOrder.phone} />}
          </div>
        </div>
      }
      open={visible}
      onCancel={onCancel}
      onOk={handleSave}
      width={1200}
      okText="Lưu"
      cancelText="Hủy"
    >
      <Form form={form} layout="vertical">
        <Row gutter={16}>
          <Col span={6}>
            <Form.Item label="Tên khách hàng" name="customerName">
              <Input disabled />
            </Form.Item>
          </Col>
          <Col span={6}>
            <Form.Item label="Số điện thoại" name="phone">
              <Input disabled />
            </Form.Item>
          </Col>
          <Col span={6}>
            <Form.Item label="Email" name="email">
              <Input disabled />
            </Form.Item>
          </Col>
          <Col span={6}>
            <Form.Item label="Ngày giao" name="deliveryDate">
              <DatePicker disabled className="w-full" format="DD/MM/YYYY" />
            </Form.Item>
          </Col>
        </Row>
        <Row gutter={16}>
          <Col span={24}>
            <Form.Item label="Địa chỉ" name="address">
              <Input.TextArea rows={2} disabled />
            </Form.Item>
          </Col>
        </Row>
        <Form.Item label="Ghi chú" name="notes">
          <Input.TextArea rows={3} disabled />
        </Form.Item>
      </Form>

      <div className="mt-6">
        <Title level={4}>Sản phẩm và công đoạn</Title>
        <Collapse
          defaultActiveKey={
            localOrder.products ? Object.keys(localOrder.products) : []
          }
          items={
            localOrder.products
              ? Object.entries(localOrder.products).map(
                  ([productId, product]) => {
                    const completedWorkflows = Object.values(
                      product.workflows || {}
                    ).filter((workflow) => workflow.isDone).length;
                    const totalWorkflows = Object.values(
                      product.workflows || {}
                    ).length;
                    const progressPercent =
                      totalWorkflows > 0
                        ? Math.round(
                            (completedWorkflows / totalWorkflows) * 100
                          )
                        : 0;

                    return {
                      key: productId,
                      label: (
                        <div className="flex justify-between items-center">
                          <div>
                            <Text strong>{product.name}</Text>
                            <br />
                            <Text type="secondary" className="text-sm">
                              {formatCurrency(product.price)} • SL:{" "}
                              {product.quantity}
                            </Text>
                          </div>
                          <div className="flex items-center gap-2">
                            <Tag
                              color={
                                progressPercent === 100
                                  ? "success"
                                  : "processing"
                              }
                            >
                              {progressPercent === 100
                                ? "Hoàn thành"
                                : "Đang thực hiện"}
                            </Tag>
                            <Progress
                              type="circle"
                              size={40}
                              percent={progressPercent}
                              format={() =>
                                `${completedWorkflows}/${totalWorkflows}`
                              }
                            />
                          </div>
                        </div>
                      ),
                      children: (
                        <div className="pl-4">
                          <Button
                            type="primary"
                            icon={<PlusOutlined />}
                            onClick={() => addWorkflow(productId)}
                            className="mb-4"
                            size="small"
                          >
                            Thêm công đoạn
                          </Button>

                          <div className="space-y-3 flex flex-col mt-4 gap-4">
                            {Object.entries(product.workflows || {})
                              .reverse()
                              .map(([workflowCode, workflow]) => (
                                <Card
                                  key={workflowCode}
                                  size="small"
                                  className="shadow-sm"
                                  title={
                                    <div className="flex justify-between items-center">
                                      <Space>
                                        <Checkbox
                                          checked={workflow.isDone}
                                          onChange={(e) =>
                                            updateWorkflow(
                                              productId,
                                              workflowCode,
                                              "isDone",
                                              e.target.checked
                                            )
                                          }
                                        />
                                        <Text
                                          strong
                                          className={
                                            workflow.isDone
                                              ? "line-through text-gray-500"
                                              : ""
                                          }
                                        >
                                          {workflow.workflowName}
                                        </Text>
                                        {workflow.isDone && (
                                          <CheckOutlined
                                            color="green"
                                            className="text-green-500"
                                          />
                                        )}
                                      </Space>
                                      <Button
                                        danger
                                        size="small"
                                        icon={<DeleteOutlined />}
                                        onClick={() =>
                                          removeWorkflow(
                                            productId,
                                            workflowCode
                                          )
                                        }
                                        type="text"
                                      />
                                    </div>
                                  }
                                >
                                  <Row gutter={[16, 8]}>
                                    <Col span={12}>
                                      <Text
                                        type="secondary"
                                        className="text-xs"
                                      >
                                        Công việc:
                                      </Text>
                                      <Select
                                        placeholder="Chọn công đoạn"
                                        value={workflow.workflowCode}
                                        onChange={(newValue) =>
                                          updateWorkflow(
                                            productId,
                                            workflowCode,
                                            "workflowCode",
                                            newValue
                                          )
                                        }
                                        options={workflowOptions}
                                        className="w-full mt-1"
                                        size="small"
                                      />
                                    </Col>
                                    <Col span={12}>
                                      <Text
                                        type="secondary"
                                        className="text-xs"
                                      >
                                        Nhân viên thực hiện:
                                      </Text>
                                      <Select
                                        mode="multiple"
                                        value={workflow.members}
                                        onChange={(newValue) =>
                                          updateWorkflow(
                                            productId,
                                            workflowCode,
                                            "members",
                                            newValue
                                          )
                                        }
                                        options={membersOptions}
                                        className="w-full mt-1"
                                        maxTagCount={1}
                                        size="small"
                                        placeholder="Chọn nhân viên"
                                      />
                                    </Col>
                                  </Row>
                                  <Row gutter={[16, 8]} className="mt-2">
                                    <Col span={24}>
                                      <Text
                                        type="secondary"
                                        className="text-xs"
                                      >
                                        {dayjs(workflow.updatedAt).format(
                                          "DD/MM/YYYY HH:mm"
                                        )}
                                      </Text>
                                    </Col>
                                  </Row>
                                </Card>
                              ))}
                          </div>

                          {Object.keys(product.workflows || {}).length ===
                            0 && (
                            <Empty
                              description="Chưa có công đoạn nào"
                              image={Empty.PRESENTED_IMAGE_SIMPLE}
                              className="py-4"
                            />
                          )}
                        </div>
                      ),
                    };
                  }
                )
              : []
          }
        />
      </div>
    </Modal>
  );
};

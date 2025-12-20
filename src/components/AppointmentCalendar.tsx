"use client";

import { AppointmentService } from "@/services/appointmentService";
import {
    AppointmentStatus,
    AppointmentStatusLabels,
    type Appointment,
} from "@/types/appointment";
import { IMembers } from "@/types/members";
import {
    App,
    Badge,
    Button,
    Calendar,
    Card,
    Col,
    Divider,
    Modal,
    Radio,
    Row,
    Select,
    Space,
    Tag,
    Timeline,
    Typography,
} from "antd";
import type { CalendarMode } from "antd/es/calendar/generateCalendar";
import type { Dayjs } from "dayjs";
import dayjs from "dayjs";
import localeData from "dayjs/plugin/localeData";
import weekday from "dayjs/plugin/weekday";
import { useEffect, useState } from "react";

dayjs.extend(weekday);
dayjs.extend(localeData);

const { Text, Title } = Typography;

interface AppointmentCalendarProps {
    staffId?: string; // Filter by staff
    onAppointmentClick?: (appointment: Appointment) => void;
    onSlotSelect?: (start: Date, end: Date) => void;
}

export default function AppointmentCalendar({
    staffId,
    onAppointmentClick,
    onSlotSelect,
}: AppointmentCalendarProps) {
    const [appointments, setAppointments] = useState<Appointment[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedAppointment, setSelectedAppointment] =
        useState<Appointment | null>(null);
    const [modalVisible, setModalVisible] = useState(false);
    const [members, setMembers] = useState<Record<string, IMembers>>({});
    const { message } = App.useApp();

    useEffect(() => {
        const unsubscribe = AppointmentService.onSnapshot((data) => {
            let filtered = data;
            if (staffId) {
                filtered = filtered.filter((appt) => appt.staffId === staffId);
            }
            setAppointments(filtered);
            setLoading(false);
        });

        return () => {
            unsubscribe();
        };
    }, [staffId]);

    // Load members for display
    useEffect(() => {
        // This would typically come from a members service
        // For now, we'll leave it empty
    }, []);

    const getStatusColor = (status: AppointmentStatus) => {
        switch (status) {
            case AppointmentStatus.SCHEDULED:
                return "blue";
            case AppointmentStatus.CONFIRMED:
                return "green";
            case AppointmentStatus.COMPLETED:
                return "success";
            case AppointmentStatus.CANCELLED:
                return "default";
            case AppointmentStatus.NO_SHOW:
                return "red";
            default:
                return "default";
        }
    };

    const [selectedDate, setSelectedDate] = useState<Dayjs>(dayjs());
    const [viewMode, setViewMode] = useState<"week" | "timeline">("week");

    const getAppointmentsForDate = (date: Dayjs) => {
        const dateStart = date.startOf("day").valueOf();
        const dateEnd = date.endOf("day").valueOf();
        return appointments.filter(
            (appt) =>
                appt.scheduledDate >= dateStart &&
                appt.scheduledDate <= dateEnd &&
                appt.status !== AppointmentStatus.CANCELLED,
        );
    };

    const getWeekDates = (date: Dayjs) => {
        const startOfWeek = date.startOf("week");
        const days: Dayjs[] = [];
        for (let i = 0; i < 7; i++) {
            days.push(startOfWeek.add(i, "day"));
        }
        return days;
    };

    const getHours = () => {
        const hours: number[] = [];
        for (let i = 0; i < 24; i++) {
            hours.push(i);
        }
        return hours;
    };

    const getAppointmentsForHourAndDate = (date: Dayjs, hour: number) => {
        const hourStart = date.hour(hour).minute(0).second(0).valueOf();
        const hourEnd = date.hour(hour).minute(59).second(59).valueOf();
        return appointments.filter(
            (appt) =>
                appt.scheduledDate >= hourStart &&
                appt.scheduledDate <= hourEnd &&
                dayjs(appt.scheduledDate).isSame(date, "day") &&
                appt.status !== AppointmentStatus.CANCELLED,
        );
    };

    const getStatusBgColor = (status: AppointmentStatus): string => {
        switch (status) {
            case AppointmentStatus.SCHEDULED:
                return "#2a1a1a"; // Dark red-black background
            case AppointmentStatus.CONFIRMED:
                return "#1a2a1a"; // Dark red-black background
            case AppointmentStatus.COMPLETED:
                return "#1a1a1a"; // Pure black background
            case AppointmentStatus.NO_SHOW:
                return "#3a1a1a"; // Dark red background
            default:
                return "#1a1a1a"; // Pure black
        }
    };

    const getStatusBorderColor = (status: AppointmentStatus): string => {
        switch (status) {
            case AppointmentStatus.SCHEDULED:
                return "#dc2626"; // Red border
            case AppointmentStatus.CONFIRMED:
                return "#ef4444"; // Bright red border
            case AppointmentStatus.COMPLETED:
                return "#991b1b"; // Dark red border
            case AppointmentStatus.NO_SHOW:
                return "#dc2626"; // Red border
            default:
                return "#dc2626"; // Red border
        }
    };

    const getStatusTextColor = (status: AppointmentStatus): string => {
        switch (status) {
            case AppointmentStatus.SCHEDULED:
                return "#fca5a5"; // Light red for text
            case AppointmentStatus.CONFIRMED:
                return "#f87171"; // Bright red for text
            case AppointmentStatus.COMPLETED:
                return "#dc2626"; // Red for text
            case AppointmentStatus.NO_SHOW:
                return "#ef4444"; // Bright red for text
            default:
                return "#ffffff"; // White for text
        }
    };

    const dateCellRender = (value: Dayjs) => {
        const dayAppointments = getAppointmentsForDate(value);
        if (dayAppointments.length === 0) return null;

        return (
            <div className="space-y-1 py-1">
                {dayAppointments.slice(0, 3).map((appt) => (
                    <div
                        key={appt.id}
                        className="text-xs px-3 py-2 rounded-lg cursor-pointer"
                        style={{
                            backgroundColor: getStatusBgColor(appt.status),
                            borderLeft: `3px solid ${getStatusBorderColor(appt.status)}`,
                            fontSize: "12px",
                            borderRadius: "8px",
                        }}
                        onClick={(e) => {
                            e.stopPropagation();
                            setSelectedAppointment(appt);
                            setModalVisible(true);
                            onAppointmentClick?.(appt);
                        }}
                        onMouseEnter={(e) => {
                            e.currentTarget.style.opacity = "0.85";
                        }}
                        onMouseLeave={(e) => {
                            e.currentTarget.style.opacity = "1";
                        }}
                    >
                        <div className="truncate" style={{ 
                            color: getStatusTextColor(appt.status),
                            fontWeight: "600",
                            fontSize: "11px",
                            marginBottom: "2px"
                        }}>
                            {dayjs(appt.scheduledDate).format("HH:mm")}
                        </div>
                        <div className="truncate" style={{ 
                            color: "#ffffff",
                            fontWeight: "500",
                            fontSize: "13px",
                            lineHeight: "1.3"
                        }}>
                            {appt.customerName}
                        </div>
                        <div className="truncate" style={{ 
                            color: "#8e8e93", 
                            fontSize: "11px",
                            lineHeight: "1.2",
                            marginTop: "2px"
                        }}>
                            {appt.purpose}
                        </div>
                    </div>
                ))}
                {dayAppointments.length > 3 && (
                    <div
                        className="text-xs text-gray-500 text-center font-medium py-1"
                        onClick={(e) => {
                            e.stopPropagation();
                            setSelectedDate(value);
                            setViewMode("timeline");
                        }}
                    >
                        +{dayAppointments.length - 3} lịch hẹn khác
                    </div>
                )}
            </div>
        );
    };


    const selectedDateAppointments = getAppointmentsForDate(selectedDate).sort(
        (a, b) => a.scheduledDate - b.scheduledDate,
    );

    return (
        <div className="space-y-4">
            {/* Header Controls */}
            <Card 
                style={{ 
                    backgroundColor: "#000000",
                    border: "none",
                    boxShadow: "none",
                    padding: "16px 0"
                }}
                bodyStyle={{ padding: 0 }}
            >
                <Row gutter={16} align="middle">
                    <Col flex="auto">
                        <Space>
                            <Title level={4} style={{ 
                                margin: 0, 
                                fontWeight: "600",
                                color: "#ffffff",
                                fontSize: "22px"
                            }}>
                                Lịch hẹn
                            </Title>
                            <Badge
                                count={appointments.length}
                                style={{ 
                                    backgroundColor: "#dc2626",
                                    boxShadow: "none"
                                }}
                            />
                        </Space>
                    </Col>
                    <Col>
                        <Space>
                            <Radio.Group
                                value={viewMode}
                                onChange={(e) => setViewMode(e.target.value)}
                                buttonStyle="solid"
                                style={{
                                    borderRadius: "10px",
                                    overflow: "hidden",
                                    backgroundColor: "#1a1a1a"
                                }}
                            >
                                <Radio.Button value="week" style={{ 
                                    borderRadius: 0,
                                    backgroundColor: viewMode === "week" ? "#dc2626" : "#1a1a1a",
                                    borderColor: "#3a1a1a",
                                    color: viewMode === "week" ? "#ffffff" : "#8e8e93"
                                }}>
                                    Tuần
                                </Radio.Button>
                                <Radio.Button value="timeline" style={{ 
                                    borderRadius: 0,
                                    backgroundColor: viewMode === "timeline" ? "#dc2626" : "#1a1a1a",
                                    borderColor: "#3a1a1a",
                                    color: viewMode === "timeline" ? "#ffffff" : "#8e8e93"
                                }}>
                                    Timeline
                                </Radio.Button>
                            </Radio.Group>
                            <Button
                                type="primary"
                                onClick={() => {
                                    setSelectedDate(dayjs());
                                    setViewMode("week");
                                }}
                                style={{
                                    backgroundColor: "#dc2626",
                                    borderColor: "#dc2626",
                                    borderRadius: "10px",
                                    fontWeight: "500"
                                }}
                            >
                                Tuần này
                            </Button>
                        </Space>
                    </Col>
                </Row>
                </Card>

            {viewMode === "week" ? (
                <Card
                    style={{ 
                        backgroundColor: "#000000",
                        border: "none",
                        boxShadow: "none",
                        borderRadius: "12px"
                    }}
                >
                    <div className="mb-4" style={{ padding: "0 4px" }}>
                        <Space>
                            <Button
                                onClick={() =>
                                    setSelectedDate(selectedDate.subtract(1, "week"))
                                }
                                style={{
                                    backgroundColor: "#1a1a1a",
                                    borderColor: "#3a1a1a",
                                    color: "#dc2626",
                                    borderRadius: "8px",
                                    fontWeight: "400"
                                }}
                            >
                                ← Tuần trước
                            </Button>
                            <Title level={4} style={{ 
                                margin: 0,
                                fontWeight: "400",
                                color: "#ffffff",
                                fontSize: "17px"
                            }}>
                                Tuần {selectedDate.format("DD/MM/YYYY")}
                            </Title>
                            <Button
                                onClick={() => setSelectedDate(selectedDate.add(1, "week"))}
                                style={{
                                    backgroundColor: "#1a1a1a",
                                    borderColor: "#3a1a1a",
                                    color: "#dc2626",
                                    borderRadius: "8px",
                                    fontWeight: "400"
                                }}
                            >
                                Tuần sau →
                            </Button>
                            <Button
                                onClick={() => {
                                    setSelectedDate(dayjs());
                                }}
                                style={{
                                    backgroundColor: "#1a1a1a",
                                    borderColor: "#3a1a1a",
                                    color: "#dc2626",
                                    borderRadius: "8px",
                                    fontWeight: "400"
                                }}
                            >
                                Tuần này
                            </Button>
                        </Space>
                    </div>
                    <div
                        style={{
                            display: "flex",
                            overflowX: "auto",
                            borderRadius: "12px",
                            backgroundColor: "#000000",
                            boxShadow: "0 2px 8px rgba(0, 0, 0, 0.3)",
                        }}
                    >
                        {/* Time column */}
                        <div
                            style={{
                                minWidth: "70px",
                                backgroundColor: "#000000",
                                position: "sticky",
                                left: 0,
                                zIndex: 10,
                            }}
                        >
                            <div
                                style={{
                                    height: "60px",
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    fontWeight: "400",
                                    color: "#8e8e93",
                                    fontSize: "13px",
                                    backgroundColor: "#000000",
                                    borderBottom: "0.5px solid #38383a",
                                }}
                            >
                                {/* Empty header for alignment */}
                            </div>
                            {getHours().map((hour) => (
                                <div
                                    key={hour}
                                    style={{
                                        height: "60px",
                                        display: "flex",
                                        alignItems: "flex-start",
                                        justifyContent: "center",
                                        fontSize: "12px",
                                        color: "#8e8e93",
                                        fontWeight: "400",
                                        paddingTop: "8px",
                                        borderBottom: "0.5px solid #1c1c1e",
                                    }}
                                >
                                    {hour.toString().padStart(2, "0")}:00
                                </div>
                            ))}
                        </div>

                        {/* Days columns */}
                        {getWeekDates(selectedDate).map((day, dayIndex) => {
                            return (
                                <div
                                    key={dayIndex}
                                    style={{
                                        minWidth: "200px",
                                        width: "200px",
                                        borderRight:
                                            dayIndex < 6 ? "0.5px solid #38383a" : "none",
                                        flexShrink: 0,
                                        backgroundColor: "#000000",
                                    }}
                                >
                                    {/* Day header */}
                                    <div
                                        style={{
                                            height: "60px",
                                            borderBottom: "0.5px solid #38383a",
                                            display: "flex",
                                            flexDirection: "column",
                                            alignItems: "center",
                                            justifyContent: "center",
                                            backgroundColor: "#000000",
                                        }}
                                    >
                                        <div style={{ 
                                            fontSize: "11px", 
                                            fontWeight: "500",
                                            color: "#8e8e93",
                                            textTransform: "uppercase",
                                            letterSpacing: "0.3px",
                                            marginBottom: "2px"
                                        }}>
                                            {day.format("ddd")}
                                        </div>
                                        <div style={{ 
                                            fontSize: day.isSame(dayjs(), "day") ? "28px" : "24px", 
                                            fontWeight: "300",
                                            color: day.isSame(dayjs(), "day") ? "#dc2626" : "#ffffff",
                                            lineHeight: "1"
                                        }}>
                                            {day.format("DD")}
                                        </div>
                                    </div>

                                    {/* Time slots */}
                                    {getHours().map((hour) => {
                                        const hourAppointments = getAppointmentsForHourAndDate(
                                            day,
                                            hour,
                                        );
                                        return (
                                            <div
                                                key={hour}
                                                style={{
                                                    height: "60px",
                                                    borderBottom: "0.5px solid #1c1c1e",
                                                    position: "relative",
                                                    padding: "4px 6px",
                                                    backgroundColor: "#000000",
                                                }}
                                                onClick={() => {
                                                    onSlotSelect?.(
                                                        day.hour(hour).minute(0).toDate(),
                                                        day.hour(hour).add(1, "hour").toDate(),
                                                    );
                                                }}
                                            >
                                                {hourAppointments.map((appt) => (
                                                    <div
                                                        key={appt.id}
                                                        className="cursor-pointer"
                                                        style={{
                                                            backgroundColor: getStatusBgColor(appt.status),
                                                            borderLeft: `3px solid ${getStatusBorderColor(appt.status)}`,
                                                            padding: "6px 8px",
                                                            marginBottom: "3px",
                                                            borderRadius: "8px",
                                                            fontSize: "12px",
                                                            boxShadow: "none",
                                                        }}
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            setSelectedAppointment(appt);
                                                            setModalVisible(true);
                                                            onAppointmentClick?.(appt);
                                                        }}
                                                        onMouseEnter={(e) => {
                                                            e.currentTarget.style.opacity = "0.85";
                                                        }}
                                                        onMouseLeave={(e) => {
                                                            e.currentTarget.style.opacity = "1";
                                                        }}
                                                    >
                                                        <div className="truncate" style={{ 
                                                            color: getStatusTextColor(appt.status),
                                                            fontWeight: "600",
                                                            fontSize: "11px",
                                                            marginBottom: "2px"
                                                        }}>
                                                            {dayjs(appt.scheduledDate).format("HH:mm")}
                                                        </div>
                                                        <div className="truncate" style={{ 
                                                            color: "#ffffff",
                                                            fontWeight: "500",
                                                            fontSize: "13px",
                                                            lineHeight: "1.3"
                                                        }}>
                                                            {appt.customerName}
                                                        </div>
                                                        <div className="truncate" style={{ 
                                                            color: "#8e8e93", 
                                                            fontSize: "11px",
                                                            lineHeight: "1.2",
                                                            marginTop: "2px"
                                                        }}>
                                                            {appt.purpose}
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        );
                                    })}
                                </div>
                            );
                        })}
                    </div>
                </Card>
            ) : (
                <Row gutter={[16, 16]}>
                    <Col xs={24} lg={16}>
                        <Card>
                            <Title level={5}>
                                Timeline - {selectedDate.format("DD/MM/YYYY")}
                            </Title>
                            <Divider />
                    {selectedDateAppointments.length > 0 ? (
                                <Timeline
                                    mode="left"
                                    items={selectedDateAppointments.map((appt) => ({
                                        color: getStatusBorderColor(appt.status),
                                        children: (
                                            <div
                                                className="cursor-pointer hover:opacity-80 p-3 rounded-lg transition-all"
                                                style={{
                                                    backgroundColor: getStatusBgColor(
                                                        appt.status,
                                                    ),
                                                    borderLeft: `4px solid ${getStatusBorderColor(appt.status)}`,
                                                }}
                                    onClick={() => {
                                        setSelectedAppointment(appt);
                                        setModalVisible(true);
                                        onAppointmentClick?.(appt);
                                    }}
                                >
                                                <div className="flex items-center justify-between mb-2">
                                                    <Text strong className="text-lg">
                                                        {dayjs(appt.scheduledDate).format(
                                                            "HH:mm",
                                                        )}
                                                </Text>
                                                    <Tag color={getStatusColor(appt.status)}>
                                                    {
                                                        AppointmentStatusLabels[
                                                            appt.status
                                                        ]
                                                    }
                                                </Tag>
                                                </div>
                                                <Text strong className="block mb-1">
                                                    {appt.customerName}
                                                </Text>
                                                <Text type="secondary" className="block mb-2">
                                                    {appt.purpose}
                                                </Text>
                                                {appt.staffName && (
                                                    <Text className="text-xs text-gray-500">
                                                        Nhân viên: {appt.staffName}
                                                    </Text>
                                                )}
                                                {appt.customerPhone && (
                                                    <Text className="text-xs text-gray-500 block">
                                                        SĐT: {appt.customerPhone}
                                                    </Text>
                                                )}
                                            </div>
                                        ),
                                    }))}
                        />
                    ) : (
                        <div className="text-center text-gray-500 py-8">
                                    Không có lịch hẹn nào trong ngày này
                        </div>
                    )}
                </Card>
            </Col>
                    <Col xs={24} lg={8}>
                        <Card title={`Tổng quan ngày ${selectedDate.format("DD/MM/YYYY")}`}>
                            <Space direction="vertical" className="w-full">
                                <div>
                                    <Text type="secondary">Tổng số lịch hẹn:</Text>
                                    <div>
                                        <Text strong className="text-2xl">
                                            {selectedDateAppointments.length}
                                        </Text>
                                    </div>
                                </div>
                                <Divider />
                                <div>
                                    <Text type="secondary">Theo trạng thái:</Text>
                                    <Space direction="vertical" className="w-full mt-2">
                                        {Object.values(AppointmentStatus)
                                            .filter(
                                                (status) =>
                                                    status !==
                                                    AppointmentStatus.CANCELLED,
                                            )
                                            .map((status) => {
                                                const count =
                                                    selectedDateAppointments.filter(
                                                        (appt) => appt.status === status,
                                                    ).length;
                                                if (count === 0) return null;
                                                return (
                                                    <div
                                                        key={status}
                                                        className="flex items-center justify-between"
                                                    >
                                                        <Tag color={getStatusColor(status)}>
                                                            {
                                                                AppointmentStatusLabels[
                                                                    status
                                                                ]
                                                            }
                                                        </Tag>
                                                        <Text strong>{count}</Text>
                                                    </div>
                                                );
                                            })}
                                    </Space>
                                </div>
                            </Space>
                        </Card>
                    </Col>
                </Row>
            )}

            <Modal
                title="Chi tiết lịch hẹn"
                open={modalVisible}
                onCancel={() => {
                    setModalVisible(false);
                    setSelectedAppointment(null);
                }}
                footer={[
                    <Button
                        key="close"
                        onClick={() => {
                            setModalVisible(false);
                            setSelectedAppointment(null);
                        }}
                    >
                        Đóng
                    </Button>,
                ]}
            >
                {selectedAppointment && (
                    <div className="space-y-3">
                        <div>
                            <Text strong>Khách hàng: </Text>
                            <Text>{selectedAppointment.customerName}</Text>
                        </div>
                        <div>
                            <Text strong>Số điện thoại: </Text>
                            <Text>{selectedAppointment.customerPhone}</Text>
                        </div>
                        {selectedAppointment.orderCode && (
                            <div>
                                <Text strong>Mã đơn hàng: </Text>
                                <Text>{selectedAppointment.orderCode}</Text>
                            </div>
                        )}
                        <div>
                            <Text strong>Mục đích: </Text>
                            <Text>{selectedAppointment.purpose}</Text>
                        </div>
                        <div>
                            <Text strong>Thời gian: </Text>
                            <Text>
                                {dayjs(
                                    selectedAppointment.scheduledDate,
                                ).format("DD/MM/YYYY HH:mm")}
                            </Text>
                        </div>
                        {selectedAppointment.duration && (
                            <div>
                                <Text strong>Thời lượng: </Text>
                                <Text>{selectedAppointment.duration} phút</Text>
                            </div>
                        )}
                        {selectedAppointment.staffName && (
                            <div>
                                <Text strong>Nhân viên: </Text>
                                <Text>{selectedAppointment.staffName}</Text>
                            </div>
                        )}
                        <div>
                            <Text strong>Trạng thái: </Text>
                            <Tag
                                color={getStatusColor(
                                    selectedAppointment.status,
                                )}
                            >
                                {
                                    AppointmentStatusLabels[
                                        selectedAppointment.status
                                    ]
                                }
                            </Tag>
                        </div>
                        {selectedAppointment.notes && (
                            <div>
                                <Text strong>Ghi chú: </Text>
                                <Text>{selectedAppointment.notes}</Text>
                            </div>
                        )}
                    </div>
                )}
            </Modal>
        </div>
    );
}

import React, { useEffect, useCallback } from "react";
import {
  Card,
  Statistic,
  Row,
  Col,
  Progress,
  Typography,
  Space,
  Avatar,
  Spin,
} from "antd";
import {
  CheckCircleOutlined,
  ClockCircleOutlined,
  ExclamationCircleOutlined,
  BarChartOutlined,
  TrophyOutlined,
  FireOutlined,
  ReloadOutlined,
} from "@ant-design/icons";
import { useTodos } from "../contexts/TodoContext";
import { useCategories } from "../contexts/CategoryContext";

const { Title, Text } = Typography;

const TodoSummary: React.FC = () => {
  const { summary, ui, fetchTodos } = useTodos();
  const { fetchCategoryCounts } = useCategories();

  // FIXED: Stable refresh function that doesn't cause infinite loops
  const refreshSummary = useCallback(async () => {
    try {
      console.log("Refreshing summary data...");
      await Promise.all([fetchTodos(), fetchCategoryCounts()]);
    } catch (error) {
      console.error("Failed to refresh summary:", error);
    }
  }, []);

  // Auto-refresh summary periodically (every 30 seconds)
  useEffect(() => {
    const interval = setInterval(refreshSummary, 30000);
    return () => clearInterval(interval);
  }, [refreshSummary]);

  // FIXED: Only show loading on initial load, not when summary exists
  if (ui.loading.todos && !summary) {
    return (
      <div className="summary-sidebar">
        <Card
          style={{
            textAlign: "center",
            background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
            borderRadius: "16px",
            color: "white",
            border: "none",
            minHeight: "200px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Spin size="large" />
          <div style={{ marginTop: "16px", color: "white" }}>
            Loading your progress...
          </div>
        </Card>
      </div>
    );
  }

  // FIXED: Better fallback values and null checks
  const completionPercentage =
    summary && summary.total > 0
      ? Math.round((summary.completed / summary.total) * 100)
      : 0;

  const priorityCounts = {
    high: summary?.high_priority ?? 0,
    medium: summary?.medium_priority ?? 0,
    low: summary?.low_priority ?? 0,
  };

  const getProductivityStatus = () => {
    if (!summary || summary.total === 0) {
      return {
        status: "Get Started",
        icon: <ClockCircleOutlined />,
        color: "rgba(255,255,255,0.9)",
        message: "Create your first todo to begin!",
      };
    }

    // Consider overdue todos in productivity calculation
    const overdueRatio =
      summary.overdue > 0 ? (summary.overdue / summary.total) * 100 : 0;

    if (overdueRatio > 30) {
      return {
        status: "Needs Attention",
        icon: <ExclamationCircleOutlined />,
        color: "#ef4444",
        message: "You have overdue tasks that need attention! 🚨",
      };
    }

    if (completionPercentage >= 90) {
      return {
        status: "Outstanding",
        icon: <TrophyOutlined />,
        color: "#10b981",
        message: "Incredible! You're absolutely crushing it!",
      };
    }

    if (completionPercentage >= 75) {
      return {
        status: "Excellent",
        icon: <TrophyOutlined />,
        color: "#10b981",
        message: "Amazing work! You're on fire!",
      };
    }

    if (completionPercentage >= 60) {
      return {
        status: "Great",
        icon: <FireOutlined />,
        color: "#f59e0b",
        message: "You're doing great! Keep the momentum!",
      };
    }

    if (completionPercentage >= 40) {
      return {
        status: "Good",
        icon: <BarChartOutlined />,
        color: "#3b82f6",
        message: "Nice progress! You're getting there!",
      };
    }

    if (completionPercentage >= 20) {
      return {
        status: "Fair",
        icon: <ClockCircleOutlined />,
        color: "#f97316",
        message: "Good start! Every step counts!",
      };
    }

    return {
      status: "Keep Going",
      icon: <ClockCircleOutlined />,
      color: "rgba(255,255,255,0.9)",
      message: "You've got this! One task at a time!",
    };
  };

  const productivity = getProductivityStatus();

  const displayStats = {
    total: summary?.total ?? 0,
    completed: summary?.completed ?? 0,
    pending: summary?.pending ?? 0,
  };

  return (
    <div className="summary-sidebar">
      {/* Refresh Button */}
      <div style={{ textAlign: "right", marginBottom: "8px" }}>
        <Text
          style={{
            color: "#6b7280",
            fontSize: "12px",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "flex-end",
            gap: "4px",
          }}
          onClick={refreshSummary}
        >
          <ReloadOutlined spin={ui.loading.todos} />
          Last updated: just now
        </Text>
      </div>

      {/* Main Overview Card */}
      <Card
        className="summary-card"
        style={{
          textAlign: "center",
          background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
          borderRadius: "16px",
          color: "white",
          border: "none",
          boxShadow: "0 8px 32px rgba(102, 126, 234, 0.3)",
          transition: "all 0.3s ease",
          marginBottom: "16px",
          position: "relative",
          overflow: "hidden",
        }}
        bodyStyle={{ padding: "24px" }}
      >
        {/* Background decoration */}
        <div
          style={{
            position: "absolute",
            top: "-50%",
            right: "-50%",
            width: "200%",
            height: "200%",
            background:
              "radial-gradient(circle, rgba(255,255,255,0.1) 0%, transparent 50%)",
            pointerEvents: "none",
          }}
        />

        <div style={{ position: "relative", zIndex: 1 }}>
          <div style={{ marginBottom: "16px" }}>
            <div
              style={{
                fontSize: "48px",
                color: "white",
                marginBottom: "8px",
                display: "flex",
                justifyContent: "center",
              }}
            >
              {productivity.icon}
            </div>
            <Title
              level={3}
              style={{
                color: "white",
                margin: 0,
                fontSize: "32px",
                fontWeight: "700",
              }}
            >
              {completionPercentage}%
            </Title>
            <Text
              style={{
                color: "rgba(255,255,255,0.9)",
                fontSize: "16px",
                fontWeight: "500",
                display: "block",
                marginTop: "4px",
              }}
            >
              Tasks Completed
            </Text>
          </div>

          <div style={{ marginTop: "16px" }}>
            <Progress
              percent={completionPercentage}
              strokeColor="rgba(255,255,255,0.9)"
              trailColor="rgba(255,255,255,0.3)"
              strokeWidth={12}
              format={() => productivity.status}
              style={{ color: "white" }}
            />
          </div>

          {/* Motivational message */}
          <div
            style={{
              marginTop: "16px",
              padding: "12px",
              background: "rgba(255,255,255,0.15)",
              borderRadius: "8px",
              backdropFilter: "blur(10px)",
            }}
          >
            <Text
              style={{
                color: "white",
                fontWeight: "500",
                fontSize: "13px",
                lineHeight: "1.4",
              }}
            >
              {productivity.message}
            </Text>
          </div>
        </div>
      </Card>

      {/* Stats Overview */}
      <Row gutter={[8, 8]} style={{ marginBottom: "16px" }}>
        <Col span={8}>
          <Card
            className="summary-progress-card"
            style={{
              textAlign: "center",
              background: "linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)",
              color: "white",
              border: "none",
              borderRadius: "12px",
              boxShadow: "0 4px 16px rgba(99, 102, 241, 0.3)",
              transition: "all 0.3s ease",
            }}
            bodyStyle={{ padding: "16px" }}
            hoverable
          >
            <Statistic
              title={
                <span
                  style={{
                    color: "rgba(255,255,255,0.9)",
                    fontSize: "12px",
                    fontWeight: "600",
                  }}
                >
                  Total
                </span>
              }
              value={displayStats.total}
              prefix={<BarChartOutlined />}
              valueStyle={{
                color: "white",
                fontWeight: "700",
                fontSize: "20px",
              }}
            />
          </Card>
        </Col>
        <Col span={8}>
          <Card
            className="summary-progress-card"
            style={{
              textAlign: "center",
              background: "linear-gradient(135deg, #10b981 0%, #059669 100%)",
              color: "white",
              border: "none",
              borderRadius: "12px",
              boxShadow: "0 4px 16px rgba(16, 185, 129, 0.3)",
              transition: "all 0.3s ease",
            }}
            bodyStyle={{ padding: "16px" }}
            hoverable
          >
            <Statistic
              title={
                <span
                  style={{
                    color: "rgba(255,255,255,0.9)",
                    fontSize: "12px",
                    fontWeight: "600",
                  }}
                >
                  Done
                </span>
              }
              value={displayStats.completed}
              prefix={<CheckCircleOutlined />}
              valueStyle={{
                color: "white",
                fontWeight: "700",
                fontSize: "20px",
              }}
            />
          </Card>
        </Col>
        <Col span={8}>
          <Card
            className="summary-progress-card"
            style={{
              textAlign: "center",
              background: "linear-gradient(135deg, #f59e0b 0%, #d97706 100%)",
              color: "white",
              border: "none",
              borderRadius: "12px",
              boxShadow: "0 4px 16px rgba(245, 158, 11, 0.3)",
              transition: "all 0.3s ease",
            }}
            bodyStyle={{ padding: "16px" }}
            hoverable
          >
            <Statistic
              title={
                <span
                  style={{
                    color: "rgba(255,255,255,0.9)",
                    fontSize: "12px",
                    fontWeight: "600",
                  }}
                >
                  Remaining
                </span>
              }
              value={displayStats.pending}
              prefix={<ClockCircleOutlined />}
              valueStyle={{
                color: "white",
                fontWeight: "700",
                fontSize: "20px",
              }}
            />
          </Card>
        </Col>
      </Row>

      {/* Priority Breakdown */}
      <Card
        title={
          <Space>
            <ExclamationCircleOutlined
              style={{ color: "rgba(255,255,255,0.9)" }}
            />
            <span
              style={{
                color: "white",
                fontWeight: "600",
                fontSize: "16px",
              }}
            >
              Priority Focus
            </span>
          </Space>
        }
        className="summary-priority-card"
        style={{
          background: "linear-gradient(135deg, #e11d48 0%, #be185d 100%)",
          color: "white",
          border: "none",
          borderRadius: "16px",
          boxShadow: "0 8px 32px rgba(225, 29, 72, 0.3)",
          marginBottom: "16px",
        }}
        bodyStyle={{ padding: "20px" }}
        headStyle={{
          background: "transparent",
          border: "none",
          color: "white",
        }}
      >
        <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
          {/* High Priority */}
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              padding: "12px",
              background: "rgba(255,255,255,0.15)",
              borderRadius: "8px",
              border: "1px solid rgba(255,255,255,0.2)",
              backdropFilter: "blur(10px)",
              transition: "all 0.3s ease",
            }}
          >
            <Space>
              <Avatar
                style={{
                  backgroundColor: "#dc2626",
                  color: "white",
                  fontSize: "12px",
                  fontWeight: "bold",
                }}
                size="small"
              >
                H
              </Avatar>
              <Text strong style={{ color: "white", fontSize: "14px" }}>
                High Priority
              </Text>
            </Space>
            <div style={{ textAlign: "right" }}>
              <div
                style={{
                  fontSize: "18px",
                  fontWeight: "bold",
                  color: "white",
                  lineHeight: "1.2",
                }}
              >
                {priorityCounts.high}
              </div>
              <Text
                style={{ color: "rgba(255,255,255,0.8)", fontSize: "11px" }}
              >
                urgent
              </Text>
            </div>
          </div>

          {/* Medium Priority */}
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              padding: "12px",
              background: "rgba(255,255,255,0.15)",
              borderRadius: "8px",
              border: "1px solid rgba(255,255,255,0.2)",
              backdropFilter: "blur(10px)",
              transition: "all 0.3s ease",
            }}
          >
            <Space>
              <Avatar
                style={{
                  backgroundColor: "#f59e0b",
                  color: "white",
                  fontSize: "12px",
                  fontWeight: "bold",
                }}
                size="small"
              >
                M
              </Avatar>
              <Text strong style={{ color: "white", fontSize: "14px" }}>
                Medium Priority
              </Text>
            </Space>
            <div style={{ textAlign: "right" }}>
              <div
                style={{
                  fontSize: "18px",
                  fontWeight: "bold",
                  color: "white",
                  lineHeight: "1.2",
                }}
              >
                {priorityCounts.medium}
              </div>
              <Text
                style={{ color: "rgba(255,255,255,0.8)", fontSize: "11px" }}
              >
                important
              </Text>
            </div>
          </div>

          {/* Low Priority */}
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              padding: "12px",
              background: "rgba(255,255,255,0.15)",
              borderRadius: "8px",
              border: "1px solid rgba(255,255,255,0.2)",
              backdropFilter: "blur(10px)",
              transition: "all 0.3s ease",
            }}
          >
            <Space>
              <Avatar
                style={{
                  backgroundColor: "#10b981",
                  color: "white",
                  fontSize: "12px",
                  fontWeight: "bold",
                }}
                size="small"
              >
                L
              </Avatar>
              <Text strong style={{ color: "white", fontSize: "14px" }}>
                Low Priority
              </Text>
            </Space>
            <div style={{ textAlign: "right" }}>
              <div
                style={{
                  fontSize: "18px",
                  fontWeight: "bold",
                  color: "white",
                  lineHeight: "1.2",
                }}
              >
                {priorityCounts.low}
              </div>
              <Text
                style={{ color: "rgba(255,255,255,0.8)", fontSize: "11px" }}
              >
                optional
              </Text>
            </div>
          </div>
        </div>

        {/* Show helpful tip when no todos exist */}
        {displayStats.total === 0 && (
          <div
            style={{
              marginTop: "16px",
              padding: "12px",
              background: "rgba(255,255,255,0.1)",
              borderRadius: "8px",
              textAlign: "center",
            }}
          >
            <Text
              style={{ color: "white", fontSize: "13px", fontWeight: "500" }}
            >
              Ready to boost your productivity? Create your first todo!
            </Text>
          </div>
        )}
      </Card>
    </div>
  );
};

export default TodoSummary;

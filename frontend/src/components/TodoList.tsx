import React from "react";
import {
  List,
  Card,
  Checkbox,
  Button,
  Tag,
  Typography,
  Space,
  Tooltip,
  Popconfirm,
  Empty,
  Divider,
} from "antd";
import {
  EditOutlined,
  DeleteOutlined,
  ClockCircleOutlined,
  CalendarOutlined,
} from "@ant-design/icons";
import { Todo } from "../types";
import { useTodos } from "../contexts/TodoContext";
import { formatDate, isOverdue, getPriorityConfig } from "../utils";

const { Text, Paragraph, Title } = Typography;

interface TodoListProps {
  className?: string;
}

const TodoList: React.FC<TodoListProps> = ({ className }) => {
  const { todos, ui, toggleTodoCompletion, deleteTodo, openEditModal } =
    useTodos();

  const handleToggleComplete = (todo: Todo) => {
    if (!todo?.id) return;
    toggleTodoCompletion(todo.id, !todo.completed);
  };

  const handleEdit = (todo: Todo) => {
    if (!todo?.id) return;
    openEditModal(todo);
  };

  const handleDelete = (todoId: number) => {
    if (!todoId) return;
    deleteTodo(todoId);
  };

  const renderTodoItem = (todo: Todo) => {
    // Safe property access with fallbacks
    if (!todo || !todo.id) {
      return null;
    }

    const priorityConfig = getPriorityConfig(todo.priority || "medium");
    const isTaskOverdue = isOverdue(todo.due_date, todo.completed);
    const todoTitle = todo.title || "Untitled Todo";
    const todoDescription = todo.description || "";

    // Safe category access
    const categoryName = todo.category?.name || "No Category";
    const categoryColor = todo.category?.color || "#9ca3af";

    let cardClasses = "todo-item-card w-full";

    if (todo.completed) {
      cardClasses += " completed";
    } else {
      if (isTaskOverdue) {
        cardClasses += " overdue";
      } else {
        cardClasses += ` priority-${todo.priority || "medium"}`;
      }
    }

    return (
      <List.Item key={todo.id} style={{ padding: 0 }}>
        <Card
          className={cardClasses}
          style={{
            width: "100%",
            borderLeftWidth: "4px",
            borderLeftStyle: "solid",
            borderLeftColor: todo.completed
              ? "#9ca3af"
              : isTaskOverdue
              ? "#ef4444"
              : priorityConfig.color,
            background: todo.completed
              ? "#f8fafc"
              : isTaskOverdue && !todo.completed
              ? "linear-gradient(90deg, rgba(255, 77, 79, 0.05) 0%, transparent 100%)"
              : "white",
            opacity: todo.completed ? 0.75 : 1,
            transition: "all 0.3s ease",
            marginBottom: "16px",
          }}
          bodyStyle={{
            padding: "20px",
          }}
          actions={[
            <Tooltip title="Edit" key="edit">
              <Button
                type="text"
                icon={<EditOutlined />}
                onClick={() => handleEdit(todo)}
                disabled={ui.loading.updating}
                size="middle"
                style={{
                  color: "#3b82f6",
                  borderRadius: "6px",
                }}
              />
            </Tooltip>,
            <Popconfirm
              key="delete"
              title={
                <span style={{ color: "#1f2937", fontWeight: 600 }}>
                  Delete Todo
                </span>
              }
              description={
                <span style={{ color: "#374151" }}>
                  Are you sure you want to delete "{todoTitle}"?
                </span>
              }
              onConfirm={() => handleDelete(todo.id)}
              okText="Delete"
              cancelText="Cancel"
              okButtonProps={{
                danger: true,
                style: { borderRadius: "6px" },
              }}
              cancelButtonProps={{
                style: { borderRadius: "6px" },
              }}
            >
              <Tooltip title="Delete">
                <Button
                  type="text"
                  danger
                  icon={<DeleteOutlined />}
                  disabled={ui.loading.deleting}
                  size="middle"
                  style={{
                    color: "#dc2626",
                    borderRadius: "6px",
                  }}
                />
              </Tooltip>
            </Popconfirm>,
          ]}
        >
          <div
            style={{ display: "flex", alignItems: "flex-start", gap: "16px" }}
          >
            {/* Checkbox with better styling */}
            <Checkbox
              checked={todo.completed || false}
              onChange={() => handleToggleComplete(todo)}
              disabled={ui.loading.updating}
              style={{
                marginTop: "4px",
                transform: "scale(1.25)",
              }}
            />

            {/* Main Content */}
            <div style={{ flex: 1, minWidth: 0 }}>
              {/* Header: Title and Priority */}
              <div
                style={{
                  display: "flex",
                  alignItems: "flex-start",
                  justifyContent: "space-between",
                  marginBottom: "12px",
                }}
              >
                <div style={{ flex: 1, marginRight: "12px" }}>
                  <Title
                    level={5}
                    style={{
                      margin: 0,
                      fontSize: "16px",
                      fontWeight: 600,
                      textDecoration: todo.completed ? "line-through" : "none",
                      color: todo.completed ? "#6b7280" : "#1f2937",
                      wordBreak: "break-word",
                    }}
                    title={todoTitle}
                  >
                    {todoTitle}
                  </Title>
                </div>

                {/* Priority Badge */}
                <div
                  style={{ display: "flex", alignItems: "center", gap: "8px" }}
                >
                  <Tag
                    style={{
                      padding: "4px 12px",
                      fontSize: "12px",
                      fontWeight: 500,
                      border: "none",
                      borderRadius: "20px",
                      backgroundColor: priorityConfig.bgColor,
                      color: priorityConfig.color,
                    }}
                  >
                    {priorityConfig.label}
                  </Tag>

                  {isTaskOverdue && !todo.completed && (
                    <Tag
                      color="red"
                      style={{
                        padding: "2px 8px",
                        fontSize: "11px",
                        fontWeight: 500,
                        borderRadius: "20px",
                      }}
                    >
                      OVERDUE
                    </Tag>
                  )}
                </div>
              </div>

              {/* Description */}
              {todoDescription && (
                <div style={{ marginBottom: "16px" }}>
                  <Paragraph
                    style={{
                      margin: 0,
                      fontSize: "14px",
                      lineHeight: "1.6",
                      color: todo.completed ? "#9ca3af" : "#6b7280",
                    }}
                    ellipsis={{
                      rows: 2,
                      expandable: true,
                      symbol: (
                        <Text
                          style={{
                            color: "#3b82f6",
                            cursor: "pointer",
                            fontWeight: 500,
                            fontSize: "14px",
                          }}
                        >
                          Show more
                        </Text>
                      ),
                    }}
                  >
                    {todoDescription}
                  </Paragraph>
                </div>
              )}

              {/* Divider */}
              <Divider style={{ margin: "12px 0", borderColor: "#e5e7eb" }} />

              {/* Meta Information */}
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  flexWrap: "wrap",
                  gap: "8px",
                }}
              >
                {/* Left side: Category and dates */}
                <Space size="large" wrap>
                  {/* Category */}
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "8px",
                    }}
                  >
                    <div
                      style={{
                        width: "16px",
                        height: "16px",
                        borderRadius: "50%",
                        backgroundColor: categoryColor,
                        border: "2px solid white",
                        boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
                      }}
                    />
                    <Text
                      style={{
                        fontSize: "12px",
                        fontWeight: 500,
                        color: todo.completed ? "#9ca3af" : "#4b5563",
                      }}
                      title={categoryName}
                    >
                      {categoryName}
                    </Text>
                  </div>

                  {/* Due Date */}
                  {todo.due_date && (
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "6px",
                      }}
                    >
                      <CalendarOutlined
                        style={{
                          color:
                            isTaskOverdue && !todo.completed
                              ? "#dc2626"
                              : "#9ca3af",
                          fontSize: "12px",
                        }}
                      />
                      <Text
                        style={{
                          fontSize: "12px",
                          fontWeight: 500,
                          color:
                            isTaskOverdue && !todo.completed
                              ? "#dc2626"
                              : todo.completed
                              ? "#9ca3af"
                              : "#6b7280",
                        }}
                      >
                        Due {formatDate(todo.due_date)}
                      </Text>
                    </div>
                  )}

                  {/* Created date */}
                  {todo.created_at && (
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "6px",
                      }}
                    >
                      <ClockCircleOutlined
                        style={{
                          color: "#9ca3af",
                          fontSize: "12px",
                        }}
                      />
                      <Text
                        style={{
                          fontSize: "12px",
                          color: todo.completed ? "#9ca3af" : "#9ca3af",
                        }}
                      >
                        Created {formatDate(todo.created_at)}
                      </Text>
                    </div>
                  )}
                </Space>
              </div>
            </div>
          </div>
        </Card>
      </List.Item>
    );
  };

  // Better loading state handling
  if (ui.loading.todos) {
    return (
      <div className={className}>
        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          {[1, 2, 3].map((i) => (
            <Card key={i} loading style={{ width: "100%", height: "128px" }} />
          ))}
        </div>
      </div>
    );
  }

  // FBetter error state handling
  if (ui.error) {
    return (
      <div className={className}>
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            padding: "64px 32px",
            textAlign: "center",
          }}
        >
          <Empty
            description={
              <div>
                <Text
                  style={{
                    fontSize: "16px",
                    fontWeight: 500,
                    color: "#ef4444",
                    display: "block",
                    marginBottom: "8px",
                  }}
                >
                  Failed to load todos
                </Text>
                <Text style={{ color: "#9ca3af", fontSize: "14px" }}>
                  {ui.error}
                </Text>
              </div>
            }
          />
        </div>
      </div>
    );
  }

  // Better empty state handling
  if (!todos || todos.length === 0) {
    return (
      <div className={className}>
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            padding: "64px 32px",
          }}
        >
          <Empty
            description={
              <div style={{ textAlign: "center" }}>
                <Text
                  style={{
                    fontSize: "16px",
                    fontWeight: 500,
                    color: "#6b7280",
                    display: "block",
                    marginBottom: "8px",
                  }}
                >
                  No todos found
                </Text>
                <Text style={{ color: "#9ca3af", fontSize: "14px" }}>
                  Create your first todo to get started on your productivity
                  journey!
                </Text>
              </div>
            }
            style={{ marginBottom: "24px" }}
          />
        </div>
      </div>
    );
  }

  // Safe todos filtering
  const validTodos = todos.filter((todo) => todo && todo.id);

  return (
    <div className={className}>
      <List
        dataSource={validTodos}
        renderItem={renderTodoItem}
        style={{
          padding: 0,
          background: "transparent",
        }}
        split={false}
        size="large"
      />
    </div>
  );
};

export default TodoList;

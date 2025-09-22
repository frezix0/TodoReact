import React, {
  createContext,
  useContext,
  useReducer,
  useCallback,
  useEffect,
  ReactNode,
  useMemo,
} from "react";
import { message } from "antd";
import {
  Todo,
  TodoCreate,
  TodoUpdate,
  TodoFilters,
  PaginationMeta,
  TodoSummary,
  TodoContextType,
  UIState,
  LoadingState,
  ApiError,
} from "../types";
import { apiService } from "../services/api";

// Initial states
const initialLoadingState: LoadingState = {
  todos: false,
  categories: false,
  creating: false,
  updating: false,
  deleting: false,
};

const initialUIState: UIState = {
  loading: initialLoadingState,
  error: null,
  selectedTodo: null,
  isCreateModalOpen: false,
  isEditModalOpen: false,
  isCategoryModalOpen: false,
};

const initialFilters: TodoFilters = {
  sort_by: "created_at",
  sort_order: "desc",
};

const initialPagination: PaginationMeta = {
  current_page: 1,
  per_page: 20,
  total: 0,
  total_pages: 0,
  has_next: false,
  has_prev: false,
};

interface TodoState {
  todos: Todo[];
  pagination: PaginationMeta;
  summary: TodoSummary | null;
  filters: TodoFilters;
  ui: UIState;
}

const initialState: TodoState = {
  todos: [],
  pagination: initialPagination,
  summary: null,
  filters: initialFilters,
  ui: initialUIState,
};

// Action types (keeping the same as before)
type TodoAction =
  | {
      type: "SET_LOADING";
      payload: { key: keyof LoadingState; value: boolean };
    }
  | { type: "SET_ERROR"; payload: string | null }
  | {
      type: "SET_TODOS";
      payload: { todos: Todo[]; pagination: PaginationMeta };
    }
  | { type: "SET_SUMMARY"; payload: TodoSummary }
  | { type: "ADD_TODO"; payload: Todo }
  | { type: "UPDATE_TODO"; payload: Todo }
  | { type: "DELETE_TODO"; payload: number }
  | { type: "SET_FILTERS"; payload: Partial<TodoFilters> }
  | { type: "SET_PAGINATION"; payload: Partial<PaginationMeta> }
  | { type: "SET_SELECTED_TODO"; payload: Todo | null }
  | { type: "SET_CREATE_MODAL"; payload: boolean }
  | { type: "SET_EDIT_MODAL"; payload: boolean }
  | { type: "CLEAR_ERROR" };

// Reducer (keeping the same as before)
const todoReducer = (state: TodoState, action: TodoAction): TodoState => {
  switch (action.type) {
    case "SET_LOADING":
      return {
        ...state,
        ui: {
          ...state.ui,
          loading: {
            ...state.ui.loading,
            [action.payload.key]: action.payload.value,
          },
        },
      };

    case "SET_ERROR":
      return {
        ...state,
        ui: {
          ...state.ui,
          error: action.payload,
        },
      };

    case "SET_TODOS":
      return {
        ...state,
        todos: action.payload.todos,
        pagination: action.payload.pagination,
      };

    case "SET_SUMMARY":
      return {
        ...state,
        summary: action.payload,
      };

    case "ADD_TODO":
      const newPagination = {
        ...state.pagination,
        total: state.pagination.total + 1,
      };
      return {
        ...state,
        todos: [action.payload, ...state.todos],
        pagination: newPagination,
        summary: state.summary
          ? {
              ...state.summary,
              total: state.summary.total + 1,
              pending: state.summary.pending + 1,
            }
          : null,
      };

    case "UPDATE_TODO":
      const oldTodo = state.todos.find((t) => t.id === action.payload.id);
      const updatedTodos = state.todos.map((todo) =>
        todo.id === action.payload.id ? action.payload : todo
      );

      // Update summary if completion status changed
      let updatedSummary = state.summary;
      if (oldTodo && oldTodo.completed !== action.payload.completed) {
        updatedSummary = state.summary
          ? {
              ...state.summary,
              completed: action.payload.completed
                ? state.summary.completed + 1
                : state.summary.completed - 1,
              pending: action.payload.completed
                ? state.summary.pending - 1
                : state.summary.pending + 1,
            }
          : null;
      }

      return {
        ...state,
        todos: updatedTodos,
        summary: updatedSummary,
      };

    case "DELETE_TODO":
      const deletedTodo = state.todos.find(
        (todo) => todo.id === action.payload
      );
      return {
        ...state,
        todos: state.todos.filter((todo) => todo.id !== action.payload),
        pagination: {
          ...state.pagination,
          total: Math.max(0, state.pagination.total - 1),
        },
        summary:
          state.summary && deletedTodo
            ? {
                ...state.summary,
                total: Math.max(0, state.summary.total - 1),
                completed: deletedTodo.completed
                  ? Math.max(0, state.summary.completed - 1)
                  : state.summary.completed,
                pending: !deletedTodo.completed
                  ? Math.max(0, state.summary.pending - 1)
                  : state.summary.pending,
              }
            : state.summary,
      };

    case "SET_FILTERS":
      return {
        ...state,
        filters: { ...state.filters, ...action.payload },
        pagination: { ...state.pagination, current_page: 1 }, // Reset to page 1 when filters change
      };

    case "SET_PAGINATION":
      return {
        ...state,
        pagination: { ...state.pagination, ...action.payload },
      };

    case "SET_SELECTED_TODO":
      return {
        ...state,
        ui: { ...state.ui, selectedTodo: action.payload },
      };

    case "SET_CREATE_MODAL":
      return {
        ...state,
        ui: { ...state.ui, isCreateModalOpen: action.payload },
      };

    case "SET_EDIT_MODAL":
      return {
        ...state,
        ui: { ...state.ui, isEditModalOpen: action.payload },
      };

    case "CLEAR_ERROR":
      return {
        ...state,
        ui: { ...state.ui, error: null },
      };

    default:
      return state;
  }
};

// Context
const TodoContext = createContext<TodoContextType | undefined>(undefined);

// Provider component
interface TodoProviderProps {
  children: ReactNode;
}

export const TodoProvider: React.FC<TodoProviderProps> = ({ children }) => {
  const [state, dispatch] = useReducer(todoReducer, initialState);

  const handleError = useCallback((error: ApiError | Error) => {
    console.error("Todo API Error:", error);
    const errorMessage =
      "message" in error ? error.message : "An unexpected error occurred";
    dispatch({ type: "SET_ERROR", payload: errorMessage });
    message.error(errorMessage);
  }, []);

  // FIXED: Memoized function parameters to prevent infinite loops
  const fetchParams = useMemo(
    () => ({
      page: state.pagination.current_page,
      per_page: state.pagination.per_page,
      filters: state.filters,
    }),
    [state.pagination.current_page, state.pagination.per_page, state.filters]
  );

  // FIXED: Stable fetchTodos function
  const fetchTodos = useCallback(async () => {
    try {
      console.log("Fetching todos with params:", fetchParams);
      dispatch({ type: "SET_LOADING", payload: { key: "todos", value: true } });
      dispatch({ type: "CLEAR_ERROR" });

      const response = await apiService.getTodos(
        fetchParams.page,
        fetchParams.per_page,
        fetchParams.filters
      );

      if (!response || !response.data || !response.pagination) {
        throw new Error("Invalid response format from server");
      }

      dispatch({
        type: "SET_TODOS",
        payload: {
          todos: response.data,
          pagination: response.pagination,
        },
      });
    } catch (error) {
      console.error("Error fetching todos:", error);
      dispatch({
        type: "SET_ERROR",
        payload: "Failed to fetch todos. Please try again later.",
      });
    } finally {
      dispatch({
        type: "SET_LOADING",
        payload: { key: "todos", value: false },
      });
    }
  }, [fetchParams]);

  const fetchSummary = useCallback(async () => {
    try {
      console.log("Fetching summary...");
      const summary = await apiService.getTodoSummary();
      console.log("✅ Summary fetched:", summary);
      dispatch({ type: "SET_SUMMARY", payload: summary });
    } catch (error) {
      console.error("❌ Failed to fetch summary:", error);
    }
  }, []);

  // FIXED: Listen for param changes
  useEffect(() => {
    console.log("🔄 TodoProvider: Params changed, refetching...");
    fetchTodos();
    fetchSummary();
  }, [fetchTodos, fetchSummary]);

  const createTodo = useCallback(
    async (todoData: TodoCreate) => {
      try {
        dispatch({
          type: "SET_LOADING",
          payload: { key: "creating", value: true },
        });
        dispatch({ type: "CLEAR_ERROR" });

        const newTodo = await apiService.createTodo(todoData);
        dispatch({ type: "ADD_TODO", payload: newTodo });
        dispatch({ type: "SET_CREATE_MODAL", payload: false });
        message.success("Todo created successfully!");

        // Refresh summary after creating
        fetchSummary();
      } catch (error) {
        handleError(error as ApiError);
        throw error; // Re-throw to let modal handle it
      } finally {
        dispatch({
          type: "SET_LOADING",
          payload: { key: "creating", value: false },
        });
      }
    },
    [handleError, fetchSummary]
  );

  const updateTodo = useCallback(
    async (id: number, todoData: TodoUpdate) => {
      try {
        dispatch({
          type: "SET_LOADING",
          payload: { key: "updating", value: true },
        });
        dispatch({ type: "CLEAR_ERROR" });

        const updatedTodo = await apiService.updateTodo(id, todoData);
        dispatch({ type: "UPDATE_TODO", payload: updatedTodo });
        dispatch({ type: "SET_EDIT_MODAL", payload: false });
        dispatch({ type: "SET_SELECTED_TODO", payload: null });
        message.success("Todo updated successfully!");

        // Refresh summary after updating
        fetchSummary();
      } catch (error) {
        handleError(error as ApiError);
        throw error; // Re-throw to let modal handle it
      } finally {
        dispatch({
          type: "SET_LOADING",
          payload: { key: "updating", value: false },
        });
      }
    },
    [handleError, fetchSummary]
  );

  const deleteTodo = useCallback(
    async (id: number) => {
      try {
        dispatch({
          type: "SET_LOADING",
          payload: { key: "deleting", value: true },
        });
        dispatch({ type: "CLEAR_ERROR" });

        await apiService.deleteTodo(id);
        dispatch({ type: "DELETE_TODO", payload: id });
        message.success("Todo deleted successfully!");

        // Refresh summary after deleting
        fetchSummary();
      } catch (error) {
        handleError(error as ApiError);
      } finally {
        dispatch({
          type: "SET_LOADING",
          payload: { key: "deleting", value: false },
        });
      }
    },
    [handleError, fetchSummary]
  );

  const toggleTodoCompletion = useCallback(
    async (id: number, completed: boolean) => {
      try {
        dispatch({
          type: "SET_LOADING",
          payload: { key: "updating", value: true },
        });

        const updatedTodo = await apiService.toggleTodoComplete(id, completed);
        dispatch({ type: "UPDATE_TODO", payload: updatedTodo });

        const action = completed ? "completed" : "marked as pending";
        message.success(`Todo ${action}!`);

        // Refresh summary after toggle
        fetchSummary();
      } catch (error) {
        handleError(error as ApiError);
      } finally {
        dispatch({
          type: "SET_LOADING",
          payload: { key: "updating", value: false },
        });
      }
    },
    [handleError, fetchSummary]
  );

  const setFilters = useCallback((filters: Partial<TodoFilters>) => {
    console.log("🔄 Setting filters:", filters);
    dispatch({ type: "SET_FILTERS", payload: filters });
  }, []);

  const setPage = useCallback((page: number) => {
    console.log("🔄 Setting page:", page);
    dispatch({ type: "SET_PAGINATION", payload: { current_page: page } });
  }, []);

  const setSelectedTodo = useCallback((todo: Todo | null) => {
    dispatch({ type: "SET_SELECTED_TODO", payload: todo });
  }, []);

  const openCreateModal = useCallback(() => {
    dispatch({ type: "SET_CREATE_MODAL", payload: true });
  }, []);

  const closeCreateModal = useCallback(() => {
    dispatch({ type: "SET_CREATE_MODAL", payload: false });
  }, []);

  const openEditModal = useCallback((todo: Todo) => {
    dispatch({ type: "SET_SELECTED_TODO", payload: todo });
    dispatch({ type: "SET_EDIT_MODAL", payload: true });
  }, []);

  const closeEditModal = useCallback(() => {
    dispatch({ type: "SET_EDIT_MODAL", payload: false });
    dispatch({ type: "SET_SELECTED_TODO", payload: null });
  }, []);

  const clearError = useCallback(() => {
    dispatch({ type: "CLEAR_ERROR" });
  }, []);

  // FIXED: Memoize context value to prevent unnecessary re-renders
  const contextValue = useMemo(
    (): TodoContextType => ({
      todos: state.todos,
      pagination: state.pagination,
      summary: state.summary,
      filters: state.filters,
      ui: state.ui,
      fetchTodos,
      createTodo,
      updateTodo,
      deleteTodo,
      toggleTodoCompletion,
      setFilters,
      setPage,
      setSelectedTodo,
      openCreateModal,
      closeCreateModal,
      openEditModal,
      closeEditModal,
      clearError,
    }),
    [
      state.todos,
      state.pagination,
      state.summary,
      state.filters,
      state.ui,
      fetchTodos,
      createTodo,
      updateTodo,
      deleteTodo,
      toggleTodoCompletion,
      setFilters,
      setPage,
      setSelectedTodo,
      openCreateModal,
      closeCreateModal,
      openEditModal,
      closeEditModal,
      clearError,
    ]
  );

  return (
    <TodoContext.Provider value={contextValue}>{children}</TodoContext.Provider>
  );
};

// Hook for using the context
export const useTodos = (): TodoContextType => {
  const context = useContext(TodoContext);
  if (context === undefined) {
    throw new Error("useTodos must be used within a TodoProvider");
  }
  return context;
};

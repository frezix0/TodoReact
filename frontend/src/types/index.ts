export type PriorityType = "high" | "medium" | "low";

export interface Category {
  id: number;
  name: string;
  color: string;
  created_at: string;
}

// FIXED: Remove duplicate definition, use consistent naming
export interface CategoryWithTodoCount extends Category {
  todo_count: number; // Use consistent field name
}

export interface Todo {
  id: number;
  title: string;
  description: string | null;
  completed: boolean;
  priority: PriorityType;
  due_date: string | null;
  created_at: string;
  updated_at: string;
  category: Category;
}

export interface TodoCreate {
  title: string;
  description?: string;
  priority?: PriorityType;
  due_date?: string | null;
  category_id?: number;
}

export interface TodoUpdate {
  title?: string;
  description?: string;
  priority?: PriorityType;
  due_date?: string | null;
  category_id?: number;
}

export interface CategoryCreate {
  name: string;
  color?: string;
}

export interface CategoryUpdate {
  name?: string;
  color?: string;
}

export interface PaginationMeta {
  current_page: number;
  per_page: number;
  total: number;
  total_pages: number;
  has_next: boolean;
  has_prev: boolean;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: PaginationMeta;
}

export interface TodoFilters {
  search?: string;
  category_id?: number;
  priority?: PriorityType;
  completed?: boolean;
  sort_by?: "created_at" | "updated_at" | "title" | "priority" | "due_date";
  sort_order?: "asc" | "desc";
}

export interface TodoSummary {
  total: number;
  completed: number;
  pending: number;
  high_priority: number;
  medium_priority: number;
  low_priority: number;
  overdue: number; // Added to match backend
}

export interface ApiError {
  success: false;
  message: string;
  error_code?: string;
  errors?: Record<string, any>;
}

export interface ApiSuccess<T = any> {
  success: true;
  message: string;
  data?: T;
}

export type ApiResponse<T = any> = ApiSuccess<T> | ApiError;

export interface LoadingState {
  todos: boolean;
  categories: boolean;
  creating: boolean;
  updating: boolean;
  deleting: boolean;
}

export interface UIState {
  loading: LoadingState;
  error: string | null;
  selectedTodo: Todo | null;
  isCreateModalOpen: boolean;
  isEditModalOpen: boolean;
  isCategoryModalOpen: boolean;
}

export interface TodoContextType {
  todos: Todo[];
  pagination: PaginationMeta | null;
  summary: TodoSummary | null;
  filters: TodoFilters;
  ui: UIState;

  fetchTodos: () => Promise<void>;
  createTodo: (todo: TodoCreate) => Promise<void>;
  updateTodo: (id: number, todo: TodoUpdate) => Promise<void>;
  deleteTodo: (id: number) => Promise<void>;
  toggleTodoCompletion: (id: number, completed: boolean) => Promise<void>;
  setFilters: (filters: Partial<TodoFilters>) => void;
  setPage: (page: number) => void;

  setSelectedTodo: (todo: Todo | null) => void;
  openCreateModal: () => void;
  closeCreateModal: () => void;
  openEditModal: (todo: Todo) => void;
  closeEditModal: () => void;
  clearError: () => void;
}

export interface CategoryContextType {
  categories: Category[];
  categoriesWithCounts: CategoryWithTodoCount[];
  ui: Pick<UIState, "loading" | "error" | "isCategoryModalOpen">;

  fetchCategories: () => Promise<void>;
  fetchCategoryCounts: () => Promise<void>;
  createCategory: (category: CategoryCreate) => Promise<void>;
  updateCategory: (id: number, category: CategoryUpdate) => Promise<void>;
  deleteCategory: (id: number) => Promise<void>;

  openCategoryModal: () => void;
  closeCategoryModal: () => void;
  clearError: () => void;
}

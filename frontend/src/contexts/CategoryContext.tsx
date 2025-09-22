import React, {
  createContext,
  useContext,
  useReducer,
  useEffect,
  useCallback,
  ReactNode,
} from "react";
import { message } from "antd";
import {
  Category,
  CategoryCreate,
  CategoryUpdate,
  CategoryWithTodoCount,
  CategoryContextType,
  UIState,
  ApiError,
} from "../types";
import { apiService } from "../services/api";

// Initial state
interface CategoryState {
  categories: Category[];
  categoriesWithCount: CategoryWithTodoCount[];
  ui: Pick<UIState, "loading" | "error" | "isCategoryModalOpen">;
}

const initialState: CategoryState = {
  categories: [],
  categoriesWithCount: [],
  ui: {
    loading: {
      todos: false,
      categories: false,
      creating: false,
      updating: false,
      deleting: false,
    },
    error: null,
    isCategoryModalOpen: false,
  },
};

// Action types
type CategoryAction =
  | {
      type: "SET_LOADING";
      payload: { key: keyof CategoryState["ui"]["loading"]; value: boolean };
    }
  | { type: "SET_ERROR"; payload: string | null }
  | { type: "SET_CATEGORIES"; payload: Category[] }
  | { type: "SET_CATEGORIES_WITH_COUNT"; payload: CategoryWithTodoCount[] }
  | { type: "ADD_CATEGORY"; payload: Category }
  | { type: "UPDATE_CATEGORY"; payload: Category }
  | { type: "DELETE_CATEGORY"; payload: number }
  | { type: "SET_CATEGORY_MODAL"; payload: boolean }
  | { type: "CLEAR_ERROR" };

// Reducer
const categoryReducer = (
  state: CategoryState,
  action: CategoryAction
): CategoryState => {
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

    case "SET_CATEGORIES":
      return {
        ...state,
        categories: action.payload,
      };

    case "SET_CATEGORIES_WITH_COUNT":
      return {
        ...state,
        categoriesWithCount: action.payload,
      };

    case "ADD_CATEGORY":
      return {
        ...state,
        categories: [...state.categories, action.payload],
        categoriesWithCount: [
          ...state.categoriesWithCount,
          { ...action.payload, todo_count: 0 } as CategoryWithTodoCount,
        ],
      };

    case "UPDATE_CATEGORY":
      return {
        ...state,
        categories: state.categories.map((category) =>
          category.id === action.payload.id ? action.payload : category
        ),
        categoriesWithCount: state.categoriesWithCount.map((category) =>
          category.id === action.payload.id
            ? ({
                ...action.payload,
                todo_count: category.todo_count,
              } as CategoryWithTodoCount)
            : category
        ),
      };

    case "DELETE_CATEGORY":
      return {
        ...state,
        categories: state.categories.filter(
          (category) => category.id !== action.payload
        ),
        categoriesWithCount: state.categoriesWithCount.filter(
          (category) => category.id !== action.payload
        ),
      };

    case "SET_CATEGORY_MODAL":
      return {
        ...state,
        ui: {
          ...state.ui,
          isCategoryModalOpen: action.payload,
        },
      };

    case "CLEAR_ERROR":
      return {
        ...state,
        ui: {
          ...state.ui,
          error: null,
        },
      };

    default:
      return state;
  }
};

// Context
const CategoryContext = createContext<CategoryContextType | undefined>(
  undefined
);

// Provider component
interface CategoryProviderProps {
  children: ReactNode;
}

export const CategoryProvider: React.FC<CategoryProviderProps> = ({
  children,
}) => {
  const [state, dispatch] = useReducer(categoryReducer, initialState);

  const handleError = useCallback((error: ApiError | Error) => {
    console.error("Category API Error:", error);
    const errorMessage =
      "message" in error ? error.message : "An unexpected error occurred";
    dispatch({ type: "SET_ERROR", payload: errorMessage });
    message.error(errorMessage);
  }, []);

  const fetchCategories = useCallback(async () => {
    try {
      dispatch({
        type: "SET_LOADING",
        payload: { key: "categories", value: true },
      });
      dispatch({ type: "CLEAR_ERROR" });

      const categories = await apiService.getCategories();
      dispatch({ type: "SET_CATEGORIES", payload: categories });
    } catch (error) {
      handleError(error as ApiError);
    } finally {
      dispatch({
        type: "SET_LOADING",
        payload: { key: "categories", value: false },
      });
    }
  }, [handleError]);

  const fetchCategoryCounts = useCallback(async () => {
    try {
      dispatch({
        type: "SET_LOADING",
        payload: { key: "categories", value: true },
      });
      dispatch({ type: "CLEAR_ERROR" });

      const categoriesWithCount = await apiService.getCategoriesWithCount();
      dispatch({
        type: "SET_CATEGORIES_WITH_COUNT",
        payload: categoriesWithCount,
      });
    } catch (error) {
      handleError(error as ApiError);
    } finally {
      dispatch({
        type: "SET_LOADING",
        payload: { key: "categories", value: false },
      });
    }
  }, [handleError]);

  useEffect(() => {
    console.log("CategoryProvider: Loading initial data...");
    fetchCategories();
    fetchCategoryCounts();
  }, [fetchCategories, fetchCategoryCounts]);

  const createCategory = useCallback(
    async (categoryData: CategoryCreate) => {
      try {
        dispatch({
          type: "SET_LOADING",
          payload: { key: "creating", value: true },
        });
        dispatch({ type: "CLEAR_ERROR" });

        const newCategory = await apiService.createCategory(categoryData);
        dispatch({ type: "ADD_CATEGORY", payload: newCategory });
        dispatch({ type: "SET_CATEGORY_MODAL", payload: false });
        message.success("Category created successfully!");

        fetchCategoryCounts();
      } catch (error) {
        handleError(error as ApiError);
      } finally {
        dispatch({
          type: "SET_LOADING",
          payload: { key: "creating", value: false },
        });
      }
    },
    [handleError, fetchCategoryCounts]
  );

  const updateCategory = useCallback(
    async (id: number, categoryData: CategoryUpdate) => {
      try {
        dispatch({
          type: "SET_LOADING",
          payload: { key: "updating", value: true },
        });
        dispatch({ type: "CLEAR_ERROR" });

        const updatedCategory = await apiService.updateCategory(
          id,
          categoryData
        );
        dispatch({ type: "UPDATE_CATEGORY", payload: updatedCategory });
        message.success("Category updated successfully!");
      } catch (error) {
        handleError(error as ApiError);
      } finally {
        dispatch({
          type: "SET_LOADING",
          payload: { key: "updating", value: false },
        });
      }
    },
    [handleError]
  );

  const deleteCategory = useCallback(
    async (id: number) => {
      try {
        dispatch({
          type: "SET_LOADING",
          payload: { key: "deleting", value: true },
        });
        dispatch({ type: "CLEAR_ERROR" });

        await apiService.deleteCategory(id);
        dispatch({ type: "DELETE_CATEGORY", payload: id });
        message.success("Category deleted successfully!");

        fetchCategoryCounts();
      } catch (error) {
        handleError(error as ApiError);
      } finally {
        dispatch({
          type: "SET_LOADING",
          payload: { key: "deleting", value: false },
        });
      }
    },
    [handleError, fetchCategoryCounts]
  );

  const openCategoryModal = useCallback(() => {
    dispatch({ type: "SET_CATEGORY_MODAL", payload: true });
  }, []);

  const closeCategoryModal = useCallback(() => {
    dispatch({ type: "SET_CATEGORY_MODAL", payload: false });
  }, []);

  const clearError = useCallback(() => {
    dispatch({ type: "CLEAR_ERROR" });
  }, []);

  const contextValue: CategoryContextType = {
    categories: state.categories,
    categoriesWithCounts: state.categoriesWithCount,
    ui: state.ui,
    fetchCategories,
    fetchCategoryCounts,
    createCategory,
    updateCategory,
    deleteCategory,
    openCategoryModal,
    closeCategoryModal,
    clearError,
  };

  return (
    <CategoryContext.Provider value={contextValue}>
      {children}
    </CategoryContext.Provider>
  );
};

// Hook for using the context
export const useCategories = (): CategoryContextType => {
  const context = useContext(CategoryContext);
  if (context === undefined) {
    throw new Error("useCategories must be used within a CategoryProvider");
  }
  return context;
};

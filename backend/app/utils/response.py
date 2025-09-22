from fastapi import HTTPException, status
from typing import Any, Dict, Optional

class APIException(HTTPException):
    def __init__(
            self, 
            status_code: int, 
            detail: Any, 
            error_code: Optional[str] = None,
            errors: Optional[Dict[str, Any]] = None
    ):
        super().__init__(status_code=status_code, detail=detail)
    
def create_error_response(
        message: str, 
        error_code: Optional[str] = None,
        errors: Optional[Dict[str, Any]] = None
) -> Dict[str, Any]:
    response = {
        "success": False,
        "message": message
    }

    if error_code:
        response["error_code"] = error_code
    if errors:
        response["errors"] = errors
    
    return response

def create_success_response(
        data: Any = None, 
        message: str = "Request was successful"
) -> Dict[str, Any]:
    response = {
        "success": True,
        "message": message
    }
    if data is not None:
        response["data"] = data

    return response

def not_found_exception(resource: str, identifier: Any) -> APIException:
    return APIException(
        status_code=status.HTTP_404_NOT_FOUND,
        detail=f"{resource} with id {identifier} not found",
        error_code="not_found"
    )

def validation_exception(message: str, errors: Dict[str, Any]) -> APIException:
    return APIException(
        status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
        detail=message,
        error_code="validation_error",
        errors=errors
    )

def conflict_exception(message: str) -> APIException:
    return APIException(
        status_code=status.HTTP_409_CONFLICT,
        detail=message,
        error_code="conflict"
    )
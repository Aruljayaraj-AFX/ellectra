from fastapi import FastAPI,HTTPException,Request
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from starlette.middleware.sessions import SessionMiddleware 
from routers.users import router_user
from routers.products import router_product
from routers.admin import router_admin
from routers.cart import router_cart
from routers.order import router_past_order
import uvicorn
from pydantic import constr

app=FastAPI()
app.add_middleware(SessionMiddleware, secret_key="your_super_secret_key_here")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.exception_handler(HTTPException)
async def http_exception_handler(request: Request, exc: HTTPException):
    return JSONResponse(
        status_code=exc.status_code,
        content={
            "error": f"HTTP {exc.status_code}",
            "message": exc.detail,
            "path": str(request.url)
        }
    )

app.include_router(router_user,prefix="/ellectra/v1/users",tags=["users_api"])
app.include_router(router_product,prefix="/ellectra/v1/products",tags=["products_api"])
app.include_router(router_admin,prefix="/ellectra/v1/admin/operation",tags=["operation_api"])
app.include_router(router_cart, prefix="/ellectra/v1", tags=["Cart"])
app.include_router(router_past_order, prefix="/ellectra/v1", tags=["orders"])

if __name__ == "__main__":
    uvicorn.run("main:app",host="localhost",port=8000,reload=True)
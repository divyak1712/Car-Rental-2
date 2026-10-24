from dotenv import load_dotenv

load_dotenv()

import os
from pathlib import Path

from fastapi import FastAPI, HTTPException
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse
from fastapi.staticfiles import StaticFiles

from routers import auth as auth_router, availability, bookings, my_bookings, resources

IS_PRODUCTION = os.environ.get("ENV") == "production"

app = FastAPI()


@app.exception_handler(HTTPException)
async def http_exception_handler(request, exc):
    # Keep the same {error: string} contract the frontend's api.service.ts expects,
    # instead of FastAPI's default {detail: ...}.
    return JSONResponse(status_code=exc.status_code, content={"error": exc.detail})


@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request, exc):
    errors = exc.errors()
    message = errors[0]["msg"] if errors else "Invalid request"
    return JSONResponse(status_code=422, content={"error": message})


# Routers first — they must win over the catch-all static/SPA mount registered below.
app.include_router(auth_router.router, prefix="/api/auth")
app.include_router(resources.router, prefix="/api/resources")
app.include_router(availability.router, prefix="/api/availability")
app.include_router(bookings.router, prefix="/api/bookings")
app.include_router(my_bookings.router, prefix="/api/my-bookings")

if IS_PRODUCTION:
    # Angular's esbuild-based application builder (v17+) outputs under .../browser/,
    # not directly under dist/<project>/ — verified against the real `ng build` output.
    dist_dir = Path(__file__).resolve().parent.parent / "client" / "dist" / "client" / "browser"

    class SPAStaticFiles(StaticFiles):
        async def get_response(self, path, scope):
            response = await super().get_response(path, scope)
            if response.status_code == 404:
                response = await super().get_response("index.html", scope)
            return response

    app.mount("/", SPAStaticFiles(directory=dist_dir, html=True), name="static")

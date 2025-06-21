from pydantic import BaseModel


class RootResponse(BaseModel):
    message: str


class HealthCheckResponse(BaseModel):
    status: str
    message: str


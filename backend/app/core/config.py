from pydantic_settings import BaseSettings, SettingsConfigDict
from typing import List

class Settings(BaseSettings):
    cors_origins: List[str] = ["*"]
    host: str = "127.0.0.1"
    port: int = 8000
    
    default_max_iterations: int = 10000
    default_time_limit: int = 60
    default_exploration_coeff: float = 1.414
    
    large_graph_threshold_vertices: int = 500
    large_graph_threshold_edges: int = 5000

    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8")

settings = Settings()

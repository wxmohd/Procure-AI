from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    anthropic_api_key: str = ""
    mongo_uri: str = "mongodb://localhost:27017"
    mongo_db_name: str = "procureiq"
    mongo_collection_name: str = "purchase_orders"

    model_config = {"env_file": ".env"}


settings = Settings()

import os
from dataclasses import dataclass
from typing import Union

@dataclass
class OpenAILLMConfig:
    """
    A data class to store configuration details for OpenAI models.

    Attributes:
        model_name (str): The name of the OpenAI model to use.
        openai_api_key (str): The API key for authenticating with the OpenAI service.
    """
    model_name: str
    openai_api_key: str


@dataclass
class AzureOpenAILLMConfig:
    """
    A data class to store configuration details for Azure OpenAI deployment.

    Attributes:
        deployment_name (str): The name of the deployment.
        model_name (str): The name of the OpenAI model to use.
        azure_endpoint (str): The endpoint URL for the Azure OpenAI service.
        openai_api_version (str): The API version to use with the Azure OpenAI service.
        openai_api_key (str): The API key for authenticating with the Azure OpenAI service.
    """
    deployment_name: str
    model_name: str
    azure_endpoint: str
    openai_api_version: str
    openai_api_key: str


@dataclass
class GroqLLMConfig:
    """
    A data class to store configuration details for Groq-based LLM models.

    Attributes:
        model_name (str): The name of the Groq model to use.
        api_key (str): The API key for authenticating with Groq.
    """
    model_name: str
    api_key: str


LLMConfig = Union[OpenAILLMConfig, AzureOpenAILLMConfig, GroqLLMConfig]


# Azure LLM configuration map
azure_llm_config_map = {
    "gpt-4o": AzureOpenAILLMConfig(
        deployment_name="gpt-4o",
        model_name="gpt-4o",
        azure_endpoint=os.getenv("AZURE_ENDPOINT_GPT4O"),
        openai_api_version=os.getenv("AZURE_OPENAI_API_VERSION"),
        openai_api_key=os.getenv("AZURE_OPENAI_API_KEY_GPT4O"),
    ),
    "gpt-4.1": AzureOpenAILLMConfig(
        deployment_name="gpt-4.1",
        model_name="gpt-4.1",
        azure_endpoint=os.getenv("AZURE_ENDPOINT_GPT"),
        openai_api_version=os.getenv("AZURE_OPENAI_API_VERSION"),
        openai_api_key=os.getenv("AZURE_OPENAI_API_KEY"),
    )
}

# Azure Embedding configuration map
azure_embedding_config_map = {
    "embedding-3-large": AzureOpenAILLMConfig(
        deployment_name="text-embedding-3-large",
        model_name="text-embedding-3-large",
        azure_endpoint=os.getenv("AZURE_ENDPOINT_EMBEDDING_3"),
        openai_api_version=os.getenv("AZURE_OPENAI_API_VERSION_EMBEDDING_3"),
        openai_api_key=os.getenv("AZURE_OPENAI_API_KEY_EMBEDDING_3_LARGE"),
    )
}

# LLM config map
llm_config_map = {
    "llama-4-scout": GroqLLMConfig(
        model_name="meta-llama/llama-4-scout-17b-16e-instruct",
        api_key=os.getenv("GROQ_API_KEY"),
    ),
    "llama-3.3-70b": GroqLLMConfig(
        model_name="llama-3.3-70b-versatile",
        api_key=os.getenv("GROQ_API_KEY"),
    ),
    "llama-3.1-8b": GroqLLMConfig(
        model_name="llama-3.1-8b-instant",
        api_key=os.getenv("GROQ_API_KEY"),
    ),
    # Legacy aliases for compatibility
    "gpt-4o": GroqLLMConfig(
        model_name="llama-3.3-70b-versatile",
        api_key=os.getenv("GROQ_API_KEY"),
    ),
    "gpt-4.1": GroqLLMConfig(
        model_name="llama-3.3-70b-versatile",
        api_key=os.getenv("GROQ_API_KEY"),
    )
}

# Default model for debate agents
DEFAULT_MODEL = "llama-4-scout"

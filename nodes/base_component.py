"""
This module defines the BaseComponent class, which provides a foundation
for managing LLM-based workflows with optional token tracking integrated into the state.
"""
import logging
import random
import time
from typing import Optional, List, Type, Any
from langchain_core.output_parsers import PydanticOutputParser, StrOutputParser
from langchain_core.prompts import ChatPromptTemplate
from langchain_core.runnables.base import RunnableSequence
from langchain_openai import AzureChatOpenAI, ChatOpenAI
from langchain_groq import ChatGroq
from langchain_community.callbacks.manager import get_openai_callback
from pydantic import BaseModel
from debate_state import DebateState
from configurations.llm_config import (
    LLMConfig,
    OpenAILLMConfig,
    AzureOpenAILLMConfig,
    GroqLLMConfig,
)
from rich.console import Console
from rich.logging import RichHandler

try:
    from opentelemetry import trace
    from opentelemetry.trace import get_tracer_provider
    _OPENTELEMETRY_AVAILABLE = True
except ImportError:  # pragma: no cover
    trace = None
    get_tracer_provider = None
    _OPENTELEMETRY_AVAILABLE = False


class BaseComponent:
    """
    A foundational class for managing LLM-based workflows with token tracking.
    Can handle both Azure OpenAI (AzureChatOpenAI) and OpenAI (ChatOpenAI).
    """

    def __init__(
        self,
        llm_config: Optional[LLMConfig] = None,
        temperature: float = 0.0,
        max_retries: int = 5,
        transcript_logger: Any = None,
    ):
        """
        Initializes the BaseComponent with optional LLM configuration and temperature.

        Args:
            llm_config (Optional[LLMConfig]): Configuration for either Azure or OpenAI.
            temperature (float): Controls the randomness of LLM outputs. Defaults to 0.0.
            max_retries (int): How many times to retry on 429 errors.
            transcript_logger (Any): Optional transcript logger instance.
        """
        logger = logging.getLogger(self.__class__.__name__)
        tracer = None
        if _OPENTELEMETRY_AVAILABLE:
            tracer = trace.get_tracer(__name__, tracer_provider=get_tracer_provider())
        else:
            logger.debug("OpenTelemetry is not installed; tracing is disabled.")

        self.logger = logger
        self._configure_rich_logger() 
        self.tracer = tracer
        self.llm: Optional[Any] = None
        self.output_parser: Optional[StrOutputParser] = None
        self.state: Optional[DebateState] = None
        self.prompt_template: Optional[ChatPromptTemplate] = None
        self.chain: Optional[RunnableSequence] = None
        self.output_model: Optional[Type[BaseModel]] = None
        self.documents: Optional[List] = None
        self.prompt_tokens = 0
        self.completion_tokens = 0
        self.max_retries = max_retries
        self.transcript_logger = transcript_logger

        if llm_config is not None:
            self.llm = self._init_llm(llm_config, temperature)
            self.output_parser = StrOutputParser()

    def _configure_rich_logger(self):
        """Set up Rich logging with styles"""
        console = Console(width=100, color_system="auto")
        handler = RichHandler(
            console=console,
            show_time=True,
            show_level=True,
            markup=True,
            show_path=False
        )
        self.logger.addHandler(handler)
        self.logger.propagate = False

    def log_debate_event(self, message: str, prefix: str = "", style: str = ""):
        """Centralized rich-formatted logging"""
        prefix_map = {
            "PRO": "[cyan]PRO[/]",
            "CON": "[magenta]CON[/]",
            "FACT": "[red]FACT-CHECK[/]",
            "JUDGE": "[yellow]JUDGE[/]"
        }
        styled_msg = f"{prefix_map.get(prefix, prefix)}{' ' + message if message else ''}"
        self.logger.info(styled_msg, extra={"markup": True})

    def _init_llm(self, config: LLMConfig, temperature: float):
        """
        Initializes an LLM instance for either Azure OpenAI or standard OpenAI.
        """
        if isinstance(config, AzureOpenAILLMConfig):
            # If it's Azure, use the AzureChatOpenAI class
            return AzureChatOpenAI(
                deployment_name=config.deployment_name,
                azure_endpoint=config.azure_endpoint,
                openai_api_version=config.openai_api_version,
                openai_api_key=config.openai_api_key,
                temperature=temperature,
            )
        elif isinstance(config, OpenAILLMConfig):
            # If it's standard OpenAI, use the ChatOpenAI class
            return ChatOpenAI(
                model_name=config.model_name,
                openai_api_key=config.openai_api_key,
                temperature=temperature,
            )
        elif isinstance(config, GroqLLMConfig):
            return ChatGroq(
                model=config.model_name,
                api_key=config.api_key,
                max_tokens=400,
            )
        else:
            raise ValueError("Unsupported LLMConfig type.")

    def validate_initialization(self) -> None:
        """
        Ensures we have an LLM and an output parser.
        """
        if not self.llm:
            raise ValueError("LLM is not initialized. Ensure `llm_config` is provided.")
        if not self.output_parser:
            raise ValueError("Output parser is not initialized.")

    def execute_chain(self, inputs: Any) -> Any:
        """
        Executes the LLM chain, tracks token usage, and retries on 429 errors.
        """
        if not self.chain:
            raise ValueError("No chain is initialized for execution.")

        retry_wait = 2  # Initial wait time in seconds

        for attempt in range(self.max_retries):
            try:
                if isinstance(self.llm, (ChatOpenAI, AzureChatOpenAI)):
                    with get_openai_callback() as cb:
                        result = self.chain.invoke(inputs)
                        self.logger.info("Prompt Token usage: %s", cb.prompt_tokens)
                        self.logger.info("Completion Token usage: %s", cb.completion_tokens)
                        self.prompt_tokens = cb.prompt_tokens
                        self.completion_tokens = cb.completion_tokens
                else:
                    result = self.chain.invoke(inputs)

                if self.output_model is not None and not isinstance(result, self.output_model):
                    parser = PydanticOutputParser(pydantic_object=self.output_model)
                    text_to_parse = getattr(result, "text", str(result))
                    result = parser.parse(text_to_parse)

                return result

            except Exception as e:
                err_str = str(e).lower()
                if "429" in err_str or "rate_limit" in err_str or "choices" in err_str or "too many" in err_str:
                    if attempt == self.max_retries - 1:
                        raise Exception("Rate limit hit — please wait a minute and try again.")

                    retry_after = None
                    if hasattr(e, "response") and getattr(e.response, "headers", None):
                        headers = {k.lower(): v for k, v in e.response.headers.items()}
                        retry_after = headers.get("retry-after")
                    elif hasattr(e, "headers"):
                        headers = {k.lower(): v for k, v in e.headers.items()}
                        retry_after = headers.get("retry-after")

                    if retry_after is not None:
                        try:
                            retry_wait = max(retry_wait, int(retry_after))
                        except ValueError:
                            pass

                    wait = min(retry_wait + random.uniform(0, 2), 30)
                    self.logger.warning(
                        f"Rate limit. Retrying in {wait:.1f}s (attempt {attempt+1}/{self.max_retries})"
                    )
                    time.sleep(wait)
                    retry_wait *= 2
                else:
                    self.logger.error(f"Unexpected error: {str(e)}")
                    raise e

        raise Exception("API request failed after maximum number of retries")

    def create_chain(
        self, system_template: str, human_template: str
    ) -> RunnableSequence:
        """
        Creates a chain for unstructured outputs.
        """
        self.validate_initialization()
        self.prompt_template = ChatPromptTemplate.from_messages(
            [
                ("system", system_template),
                ("human", human_template),
            ]
        )
        self.chain = self.prompt_template | self.llm | self.output_parser
        return self.chain

    def create_structured_output_chain(
        self, system_template: str, human_template: str, output_model: Type[BaseModel]
    ) -> RunnableSequence:
        """
        Creates a chain that yields structured outputs (parsed into a Pydantic model).
        """
        self.validate_initialization()
        self.output_model = output_model
        self.prompt_template = ChatPromptTemplate.from_messages(
            [
                ("system", system_template),
                ("human", human_template),
            ]
        )

        if isinstance(self.llm, ChatGroq):
            self.chain = self.prompt_template | self.llm | self.output_parser
        else:
            self.chain = self.prompt_template | self.llm.with_structured_output(output_model)

        return self.chain

    def build_return_with_tokens(self, node_specific_data: dict) -> dict:
        """
        Convenience method to add token usage info into the return values.
        """
        return {
            **node_specific_data,
            "prompt_tokens": self.prompt_tokens,
            "completion_tokens": self.completion_tokens,
        }

    def __call__(self, state: DebateState) -> None:
        """
        Updates the node's local copy of the state.
        """
        self.state = state
        for key, value in state.items():
            setattr(self, key, value)

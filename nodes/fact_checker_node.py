import textwrap
import json
from typing import Dict, Any
from nodes.base_component import BaseComponent
from debate_state import DebateState
from configurations.debate_constants import SPEAKER_PRO, SPEAKER_CON
from configurations.llm_config import GroqLLMConfig
import os
from utils import create_debate_message
from dotenv import load_dotenv
from pydantic import BaseModel, Field
import logging

load_dotenv()

class FactCheck(BaseModel):
    """
    Pydantic model for the fact checking the claims made by debaters.

    Attributes:
        binary_score (str): 'yes' if the claim is verifiable and truthful, 'no' otherwise.
    """

    binary_score: str = Field(
        description="Indicates if the claim is verifiable and truthful. 'yes' or 'no'."
    )
    justification: str = Field(
        description="Explanation of the reasoning behind the score."
    )

class FactCheckNode(BaseComponent):
    def __init__(self, llm_config: GroqLLMConfig, temperature: float = 0.7, transcript_logger: Any = None):
        super().__init__(llm_config, temperature, transcript_logger=transcript_logger)

        system_template = (
            "You are a debate fact-checker. Evaluate the user's statement carefully and "
            "respond with ONLY a valid JSON object (no markdown, no extra text) with keys 'binary_score' and 'justification'."
        )
        human_template = (
            "Consider the following statement from a debate:\n"
            "{claim}\n\n"
            "If the statement contains numbers, figures, or references to studies, fact-check them. "
            "If it does not include such references, treat it as successfully fact-checked. "
            "Respond ONLY with a JSON object containing:\n"
            "- binary_score: 'yes' or 'no'\n"
            "- justification: a short explanation\n\n"
            "Return ONLY the JSON object, nothing else."
        )

        self.chain = self.create_chain(
            system_template=system_template,
            human_template=human_template,
        )

    def __call__(self, state: DebateState) -> Dict[str, Any]:
        messages = state.get("messages", [])
        last_message = messages[-1]
        claim = last_message["content"]
        speaker = last_message["speaker"]
        stage = state["stage"]

        self.logger.info(
            f"[bold red]Fact-Checking {speaker.upper()}'s {stage.title()} Claim:[/][\n]"
            f"[dim]{textwrap.shorten(claim, width=150, placeholder='...')}[/]"
        )

        # Get response as text
        response_text = self.execute_chain({"claim": claim})
        
        # Parse JSON from response
        try:
            fact_check_result = json.loads(response_text)
            result = fact_check_result.get("binary_score", "no").lower()
            justification = fact_check_result.get("justification", "Unable to verify")
        except (json.JSONDecodeError, AttributeError):
            # If the model output cannot be parsed, treat as a failed fact-check.
            self.logger.warning(f"Failed to parse fact-check JSON: {response_text}")

            result = "no"
            justification = (
                "Fact-check failed due to invalid model output."
            )

        if result == "yes":
            self.logger.info(f"[green]✅ Verified[/]\n"f"[dim]{justification}[/]")
            # Create an updated copy of the last message instead of mutating in-place
            updated_message = { **last_message, "validated": True }
            messages = messages[:-1] + [updated_message]

            if self.transcript_logger:
                # Update the debater's last turn to reflect the fact-check result
                try:
                    self.transcript_logger.update_fact_check_status(state.get("debate_id"), speaker, True)
                except Exception:
                    self.logger.exception("Failed to update fact-check status in DB for passed check")

                self.transcript_logger.log_turn(
                    state.get("debate_id"),
                    state.get("debate_topic"),
                    state.get("round_number", 1),
                    "fact_checker",
                    stage,
                    f"Fact check passed: {justification}",
                    True,
                )

            return {
                "messages": messages,
                "validated": True,
            }
        else:
            self.logger.info(
                f"[red]❌ Disputed[/]\n"
                f"[bold]Reason:[/] {justification}\n"
                f"[yellow]⚠ {speaker.upper()} now has {state.get(f'times_{speaker}_fact_checked', 0) + 1}/3 failed checks[/]"
            )
            fact_checker_msg = create_debate_message(
                speaker="fact_checker",
                content=result,
                stage=state["stage"],
            )
            if self.transcript_logger:
                # Update the debater's last turn to reflect the failed fact-check
                try:
                    self.transcript_logger.update_fact_check_status(state.get("debate_id"), speaker, False)
                except Exception:
                    self.logger.exception("Failed to update fact-check status in DB for failed check")

                self.transcript_logger.log_turn(
                    state.get("debate_id"),
                    state.get("debate_topic"),
                    state.get("round_number", 1),
                    "fact_checker",
                    stage,
                    f"Fact check failed: {justification}",
                    False,
                )
            if speaker == SPEAKER_PRO:
                return {
                    "messages": messages + [fact_checker_msg],
                    "validated": False,
                    "times_pro_fact_checked": state.get("times_pro_fact_checked", 0) + 1,
                }
            elif speaker == SPEAKER_CON:
                return {
                    "messages": messages + [fact_checker_msg],
                    "validated": False,
                    "times_con_fact_checked": state.get("times_con_fact_checked", 0) + 1,
                }

from debate_state import DebateState
from langgraph.types import Command
from langgraph.graph import END
from configurations.debate_constants import (
    NODE_PRO_DEBATER,
    NODE_CON_DEBATER,
    NODE_DEBATE_MODERATOR,
    SPEAKER_CON,
    SPEAKER_PRO,
)
from typing import Any

class FactCheckRouterNode:
    def __init__(self, transcript_logger: Any = None):
        self.transcript_logger = transcript_logger

    def __call__(self, state: DebateState) -> Command[str]:
        messages = state.get("messages", [])
        if not messages:
            raise ValueError("No messages found in the state.")
        last_message = messages[-1]
        # Use the actual speaker from the last message to route fact-check results.
        # If the last message was appended by the fact checker (due to a failed check),
        # look at the second-to-last message to determine which debater failed.
        if last_message["speaker"] == "fact_checker" and len(messages) >= 2:
            speaker = messages[-2]["speaker"]
        else:
            speaker = last_message["speaker"]
        pro_fact_checks = state.get("times_pro_fact_checked", 0)
        con_fact_checks = state.get("times_con_fact_checked", 0)

        if pro_fact_checks >= 3 or con_fact_checks >= 3:
            disqualified = SPEAKER_PRO if pro_fact_checks >= 3 else SPEAKER_CON
            winner = SPEAKER_CON if disqualified == SPEAKER_PRO else SPEAKER_PRO

            verdict_msg = {
                "speaker": "moderator",
                "content": (
                    f"Debate ended early due to excessive factual inaccuracies.\n\n"
                    f"DISQUALIFIED: {disqualified.upper()} (exceeded fact check limit)\n"
                    f"WINNER: {winner.upper()}"
                ),
                "validated": True,
                "stage": "verdict"
            }

            if self.transcript_logger:
                self.transcript_logger.log_turn(
                    state.get("debate_id"),
                    state.get("debate_topic"),
                    state.get("round_number", 1),
                    "moderator",
                    "verdict",
                    verdict_msg["content"],
                    True,
                )

            return Command(
                update={
                    "messages": messages + [verdict_msg],
                    "disqualified": disqualified
                },
                goto=END
            )
        if last_message.get("validated"):
            return Command(goto=NODE_DEBATE_MODERATOR)
        elif speaker == SPEAKER_PRO:
            return Command(goto=NODE_PRO_DEBATER)
        elif speaker == SPEAKER_CON:
            return Command(goto=NODE_CON_DEBATER)
        raise ValueError("Unable to determine routing in FactCheckRouterNode.")

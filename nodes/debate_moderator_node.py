from langgraph.types import Command
from typing import Literal
from debate_state import DebateState
from configurations.debate_constants import (
    STAGE_OPENING, STAGE_REBUTTAL, STAGE_COUNTER, STAGE_FINAL_ARGUMENT,
    SPEAKER_PRO, SPEAKER_CON,
    NODE_PRO_DEBATER, NODE_CON_DEBATER, NODE_JUDGE
)

class DebateModeratorNode:
    def __call__(self, state: DebateState) -> Command[Literal["pro_debater_node", "con_debater_node", "__end__"]]:
        stage = state["stage"]
        speaker = state["speaker"]

        # Safety guards: ensure speaker and stage are valid before routing
        if speaker not in [SPEAKER_PRO, SPEAKER_CON]:
            raise ValueError(
                f"Invalid speaker: {speaker}"
            )

        valid_stages = [
            "opening",
            "rebuttal",
            "counter",
            "final_argument"
        ]

        if stage not in valid_stages:
            raise ValueError(
                f"Invalid stage: {stage}"
            )

        if stage == STAGE_OPENING and speaker == SPEAKER_PRO:
            return Command(
                update={"stage": STAGE_REBUTTAL, "speaker": SPEAKER_CON},
                goto=NODE_CON_DEBATER
            )
        elif stage == STAGE_REBUTTAL and speaker == SPEAKER_CON:
            return Command(
                update={"stage": STAGE_COUNTER, "speaker": SPEAKER_PRO, "round_number": state.get("round_number", 0) + 1},
                goto=NODE_PRO_DEBATER
            )
        elif stage == STAGE_COUNTER and speaker == SPEAKER_PRO:
            return Command(
                update={"stage": STAGE_FINAL_ARGUMENT, "speaker": SPEAKER_CON},
                goto=NODE_CON_DEBATER
            )
        elif stage == STAGE_FINAL_ARGUMENT and speaker == SPEAKER_CON:
            return Command(
                update={"round_number": state.get("round_number", 0) + 1},
                goto=NODE_JUDGE
            )

        raise ValueError(f"Unexpected stage/speaker combo: stage={stage}, speaker={speaker}")

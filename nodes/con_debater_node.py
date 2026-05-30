from nodes.base_component import BaseComponent
from debate_state import DebateState
from typing import Dict, Any
from langgraph.types import Command
from configurations.debate_constants import (
    STAGE_REBUTTAL, STAGE_FINAL_ARGUMENT,
    SPEAKER_CON, SPEAKER_PRO
)
from prompts.con_debater_prompts import (
    SYSTEM_PROMPT,
    REBUTTAL_HUMAN_PROMPT,
    REBUTTAL_RETRY_HUMAN_PROMPT,
    FINAL_ARGUMENT_HUMAN_PROMPT,
    FINAL_ARGUMENT_RETRY_HUMAN_PROMPT,
)
from utils import create_debate_message, get_debate_history

class ConDebaterNode(BaseComponent):
    def __init__(self, llm_config, temperature: float = 0.7, transcript_logger: Any = None):
        super().__init__(llm_config, temperature, transcript_logger=transcript_logger)
        self.rebuttal_human_prompt = REBUTTAL_HUMAN_PROMPT
        self.rebuttal_retry_human_prompt = REBUTTAL_RETRY_HUMAN_PROMPT
        self.final_argument_human_prompt = FINAL_ARGUMENT_HUMAN_PROMPT
        self.final_argument_retry_human_prompt = FINAL_ARGUMENT_RETRY_HUMAN_PROMPT

    def _build_memory_context(self, role: str, state: DebateState) -> str:
        past_args = state.get("memory", {}).get(role, [])
        if not past_args:
            return "No prior arguments yet."
        return "\n".join([f"Round {i + 1}: {arg}" for i, arg in enumerate(past_args)])

    def _build_system_prompt(self, role: str, state: DebateState) -> str:
        memory_context = self._build_memory_context(role, state)
        return f"""{SYSTEM_PROMPT}
Your previous arguments across rounds:
{memory_context}
Build on or refine your position. Don't repeat yourself.
"""

    def _get_updated_memory(self, role: str, state: DebateState, new_argument: str) -> dict:
        old_memory = state.get("memory") or {"PRO": [], "CON": []}
        new_memory = {
            "PRO": list(old_memory.get("PRO", [])),
            "CON": list(old_memory.get("CON", []))
        }
        new_memory.setdefault(role, []).append(new_argument)
        return new_memory

    def __call__(self, state: DebateState) -> Dict[str, Any]:
        super().__call__(state)
        debate_topic = state["debate_topic"]
        messages = state.get("messages", [])
        stage = state["stage"]
        speaker = state["speaker"]

        # Determine if the CON agent is retrying due to a failed fact check
        retrying = False
        if len(messages) >= 2:
            previous_msg = messages[-2]
            latest_msg = messages[-1]

            retrying = (
                latest_msg["speaker"] == "fact_checker"
                and previous_msg["speaker"] == SPEAKER_CON
                and not previous_msg.get("validated", False)
            )

        retry_count = state.get("retry_count", 0)
        if retrying:
            retry_count += 1
            if retry_count >= 3:
                # Bypass to debate_moderator_node to prevent infinite retry loop
                return Command(
                    update={"retry_count": 0},
                    goto="debate_moderator_node"
                )
        else:
            retry_count = 0

        system_prompt = self._build_system_prompt(SPEAKER_CON.upper(), state)

        if stage == STAGE_REBUTTAL and speaker == SPEAKER_CON:
            opponent_msg = self._get_last_message_by(SPEAKER_PRO, messages)
            human_template = self.rebuttal_retry_human_prompt if retrying else self.rebuttal_human_prompt
            self.create_chain(system_prompt, human_template)
            result = self.execute_chain({
                "debate_topic": debate_topic,
                "opponent_statement": opponent_msg,
            })

        elif stage == STAGE_FINAL_ARGUMENT and speaker == SPEAKER_CON:
            debate_history = get_debate_history(messages)
            human_template = self.final_argument_retry_human_prompt if retrying else self.final_argument_human_prompt
            self.create_chain(system_prompt, human_template)
            result = self.execute_chain({
                "debate_topic": debate_topic,
                "debate_history": debate_history,
            })

        else:
            raise ValueError(f"Unknown turn for ConDebater: stage={stage}, speaker={speaker}")

        new_message = create_debate_message(speaker=SPEAKER_CON, content=result, stage=stage)
        new_memory = self._get_updated_memory(SPEAKER_CON.upper(), state, result)

        self.log_debate_event(
            f"[bold]{stage.upper()}[/] {'🔁 (Retry)' if retrying else ''}\n"
            f"{result}\n",
            prefix="CON"
        )

        if self.transcript_logger:
            self.transcript_logger.log_turn(
                state.get("debate_id"),
                debate_topic,
                state["round_number"],
                SPEAKER_CON,
                stage,
                result,
                None,
            )
        return {
            "messages": messages + [new_message],
            "memory": new_memory,
            "round_number": state["round_number"],
            "retry_count": retry_count,
        }

    def _get_last_message_by(self, speaker: str, messages: list) -> str:
        for m in reversed(messages):
            if m["speaker"] == speaker:
                return m["content"]
        return ""

from nodes.base_component import BaseComponent
from debate_state import DebateState
from typing import Dict, Any
from prompts.pro_debater_prompts import (
    SYSTEM_PROMPT,
    OPENING_HUMAN_PROMPT,
    COUNTER_HUMAN_PROMPT,
    OPENING_RETRY_HUMAN_PROMPT,
    COUNTER_RETRY_HUMAN_PROMPT
)
from utils import create_debate_message, get_debate_history
from configurations.debate_constants import (
    STAGE_OPENING,
    STAGE_COUNTER,
    SPEAKER_PRO,
    SPEAKER_CON
)

class ProDebaterNode(BaseComponent):
    def __init__(self, llm_config, temperature: float = 0.7, transcript_logger: Any = None):
        super().__init__(llm_config, temperature, transcript_logger=transcript_logger)
        self.opening_human_prompt = OPENING_HUMAN_PROMPT
        self.opening_retry_human_prompt = OPENING_RETRY_HUMAN_PROMPT
        self.counter_human_prompt = COUNTER_HUMAN_PROMPT
        self.counter_retry_human_prompt = COUNTER_RETRY_HUMAN_PROMPT

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

    def _append_memory(self, role: str, state: DebateState, new_argument: str) -> None:
        memory = state.setdefault("memory", {"PRO": [], "CON": []})
        memory.setdefault(role, []).append(new_argument)
        state["round_number"] = state.get("round_number", 0) + 1

    def __call__(self, state: DebateState) -> Dict[str, Any]:
        super().__call__(state)

        debate_topic = state.get("debate_topic")
        messages = state.get("messages", [])
        stage = state.get("stage")
        speaker = state.get("speaker")

        # Check if retrying (last message was by pro and not validated)
        last_msg = messages[-1] if messages else None
        retrying = last_msg and last_msg["speaker"] == SPEAKER_PRO and not last_msg["validated"]

        system_prompt = self._build_system_prompt(SPEAKER_PRO.upper(), state)

        if stage == STAGE_OPENING and speaker == SPEAKER_PRO:
            human_template = self.opening_retry_human_prompt if retrying else self.opening_human_prompt
            chain = self.create_chain(system_prompt, human_template)
            result = chain.invoke({"debate_topic": debate_topic})
        elif stage == STAGE_COUNTER and speaker == SPEAKER_PRO:
            opponent_msg = self._get_last_message_by(SPEAKER_CON, messages)
            debate_history = get_debate_history(messages)
            human_template = self.counter_retry_human_prompt if retrying else self.counter_human_prompt
            chain = self.create_chain(system_prompt, human_template)
            result = chain.invoke({
                "debate_topic": debate_topic,
                "opponent_statement": opponent_msg,
                "debate_history": debate_history,
            })
        else:
            raise ValueError(f"Unknown turn for ProDebater: stage={stage}, speaker={speaker}")

        new_message = create_debate_message(speaker=SPEAKER_PRO, content=result, stage=stage)
        self._append_memory(SPEAKER_PRO.upper(), state, result)

        self.log_debate_event(
            f"[bold]{stage.upper()}[/] {'🔁 (Retry)' if retrying else ''}\n"
            f"{result}\n",
            prefix="PRO"
        )

        if self.transcript_logger:
            self.transcript_logger.log_turn(
                state.get("debate_id"),
                debate_topic,
                state["round_number"],
                SPEAKER_PRO,
                stage,
                result,
                True,
            )

        return {
            "messages": messages + [new_message],
            "memory": state["memory"],
            "round_number": state["round_number"],
        }

    def _get_last_message_by(self, speaker_prefix, messages):
        for m in reversed(messages):
            if m.get("speaker") == speaker_prefix:
                return m["content"]
        return ""

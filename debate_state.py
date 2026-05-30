from typing import TypedDict, List, Dict, Literal, Annotated
import operator


DebateStage = Literal[
    "opening",
    "rebuttal",
    "counter",
    "final_argument",
    "verdict",
]

class DebateMessage(TypedDict):
    speaker: str  # e.g. pro or con
    content: str  # The message each speaker produced
    validated: bool  # Whether the FactChecker ok’d this message
    stage: DebateStage # The stage of the debate when this message was produced

class DebateState(TypedDict):
    debate_id: str
    debate_topic: str
    positions: Dict[str, str]
    messages: Annotated[List[DebateMessage], operator.add]
    opening_statement_pro_agent: str
    stage: str  # "opening", "rebuttal", "counter", "final_argument"
    speaker: str  # "pro" or "con"
    memory: Dict[str, List[str]]  # {"PRO": [...past args], "CON": [...past args]}
    round_number: int
    times_pro_fact_checked: int # The number of times the pro agent has been fact-checked. If it reaches 3, the pro agent is disqualified.
    times_con_fact_checked: int # The number of times the con agent has been fact-checked. If it reaches 3, the con agent is disqualified.
    disqualified: str | None # The name of the disqualified speaker, if any.
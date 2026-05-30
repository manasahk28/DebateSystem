from langgraph.graph import StateGraph, END
from debate_state import DebateState
from nodes.topic_generator_node import GenerateTopicNode
from nodes.pro_debater_node import ProDebaterNode
from nodes.con_debater_node import ConDebaterNode
from nodes.debate_moderator_node import DebateModeratorNode
from nodes.fact_checker_node import FactCheckNode
from nodes.fact_check_router_node import FactCheckRouterNode
from nodes.judge_node import JudgeNode
from configurations.llm_config import llm_config_map

class DebateWorkflow:
    def __init__(self, transcript_logger=None):
        self.transcript_logger = transcript_logger

    def _initialize_workflow(self) -> StateGraph:
        workflow = StateGraph(DebateState)
        # LLM config selection
        debater_config = llm_config_map["llama-4-scout"]
        fast_config = llm_config_map["llama-3.1-8b"]

        # Nodes
        workflow.add_node("generate_topic_node", GenerateTopicNode(debater_config, transcript_logger=self.transcript_logger))
        workflow.add_node("pro_debater_node", ProDebaterNode(debater_config, transcript_logger=self.transcript_logger))
        workflow.add_node("con_debater_node", ConDebaterNode(debater_config, transcript_logger=self.transcript_logger))
        workflow.add_node("fact_check_node", FactCheckNode(fast_config, transcript_logger=self.transcript_logger))
        workflow.add_node("fact_check_router_node", FactCheckRouterNode(transcript_logger=self.transcript_logger))
        workflow.add_node("debate_moderator_node", DebateModeratorNode())
        workflow.add_node("judge_node", JudgeNode(debater_config, transcript_logger=self.transcript_logger))

        # Entry point
        workflow.set_entry_point("generate_topic_node")

        # Flow
        workflow.add_edge("generate_topic_node", "pro_debater_node")
        workflow.add_edge("pro_debater_node", "fact_check_node")
        workflow.add_edge("con_debater_node", "fact_check_node")
        workflow.add_edge("fact_check_node", "fact_check_router_node")
        workflow.add_edge("judge_node", END)
        return workflow



    async def run(self, debate_id: str, topic: str | None = None):
        workflow = self._initialize_workflow()
        graph = workflow.compile()
        # graph.get_graph().draw_mermaid_png(output_file_path="workflow_graph.png")
        debate_topic = topic.strip() if topic and topic.strip() else ""
        initial_state = {
            "debate_id": debate_id,
            "debate_topic": debate_topic,
            "positions": {},
            "messages": [],
            "opening_statement_pro_agent": "",
            "stage": "opening",
            "speaker": "pro",
            "memory": {"PRO": [], "CON": []},
            "round_number": 1,
            "times_pro_fact_checked": 0,
            "times_con_fact_checked": 0,
            "retry_count": 0,
        }
        final_state = await graph.ainvoke(initial_state, config={"recursion_limit": 50})
        return final_state

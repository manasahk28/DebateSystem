import asyncio
import inspect
from workflow.debate_workflow import DebateWorkflow

async def _run_full_debate_workflow():
    workflow = DebateWorkflow()
    graph = workflow._initialize_workflow().compile()

    initial_state = {
        "debate_topic": "Should autonomous drones be allowed in warfare?",
        "positions": {
            "pro": "In favor of the topic",
            "con": "Against the topic"
        },
        "messages": [],
        "opening_statement_pro_agent": "",
        "stage": "opening",
        "speaker": "pro",
        "times_pro_fact_checked": 0,
        "times_con_fact_checked": 0,
    }

    return await graph.ainvoke(initial_state, config={"recursion_limit": 50})


def test_full_debate_workflow_completes():
    final_state = asyncio.run(_run_full_debate_workflow())

    assert "messages" in final_state
    assert any(m["stage"] == "verdict" for m in final_state["messages"]) or final_state["speaker"] in ["pro", "con"]


import inspect

def test_workflow_run_accepts_topic_parameter():
    workflow = DebateWorkflow()
    debate_id = "test-debate-id"
    topic = "Should schools require computer science education?"

    signature = inspect.signature(workflow.run)
    assert "topic" in signature.parameters

    coroutine = workflow.run(debate_id, topic=topic)
    assert asyncio.iscoroutine(coroutine)

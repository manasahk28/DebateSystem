import asyncio
import inspect
from workflow.debate_workflow import DebateWorkflow

async def _run_full_debate_workflow():
    workflow = DebateWorkflow()
    return await workflow.run("test-debate-id", topic="Should autonomous drones be allowed in warfare?")


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

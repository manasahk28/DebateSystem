import asyncio
import uuid
from workflow.debate_workflow import DebateWorkflow
from transcript_logger import TranscriptLogger
import os
import logging
from rich.console import Console
from rich.logging import RichHandler
from dotenv import load_dotenv

load_dotenv()

def setup_logging():
    console = Console(width=100)
    logging.basicConfig(
        level=logging.INFO,
        format='%(message)s',
        handlers=[
            RichHandler(
                console=console,
                show_time=True,
                show_level=True,
                markup=True,
                show_path=False
            )
        ]
    )
    logging.getLogger("httpx").setLevel(logging.WARNING)

def validate_env():
    required_var = "GROQ_API_KEY"
    if not os.getenv(required_var):
        raise EnvironmentError(f"Missing environment variable: {required_var}")

async def main():
    setup_logging()
    validate_env()
    logger = logging.getLogger("main")
    transcript_logger = TranscriptLogger()
    debate_id = str(uuid.uuid4())
    try:
        logger.info("[bold green]Starting debate workflow...[/]")
        workflow = DebateWorkflow(transcript_logger=transcript_logger)
        workflow_result = await workflow.run(debate_id)
        
        final_message = workflow_result["messages"][-1]["content"]
        logger.info("\n[bold]━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━[/]")
        if "WINNER: PRO" in final_message:
            logger.info("[bold green]  DEBATE VERDICT[/]")
            logger.info("[cyan]  %s[/]", final_message.replace("WINNER: PRO", "🏆 [bold]WINNER:[/] [cyan]PRO"))
        elif "WINNER: CON" in final_message:
            logger.info("[bold green]  DEBATE VERDICT[/]")
            logger.info("[magenta]  %s[/]", final_message.replace("WINNER: CON", "🏆 [bold]WINNER:[/] [magenta]CON"))
        else:
            logger.info("[yellow]  %s[/]", final_message)
        logger.info("[bold]━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━[/]\n")
        logger.info("[green]Workflow completed successfully | Status: [bold]SUCCESS[/][/]")
        transcript_logger.export_csv(debate_id)
        logger.info("[blue]Transcript exported to CSV for debate_id %s[/]", debate_id)
    except Exception as e:
        logger.error("Workflow failed: %s", str(e), exc_info=True)
        raise


if __name__ == "__main__":
    asyncio.run(main())
give me in steps dont add evrything once at all . add in small steps 


## Design Decisions

<!-- Note key architectural decisions and their rationale. --

project requirements :- build this prwe have to build a proejct that can make there own decision about analyse financial markets   and can make trades in a syntethic account that we have only created . we need 5 mcp different servers and 
Agent interaction should be autonoumous 


### Week 6 Day 4

And now - introducing the Capstone project:


# Autonomous Traders

An equity trading simulation, with 4 Traders and a Researcher, powered by a slew of MCP servers with tools & resources:

1. Our home-made Accounts MCP server (written by our engineering team!)
2. Fetch (get webpage via a local headless browser)
3. Memory
4. Brave Search
5. Financial data

And a resource to read information about the trader's account, and their investment strategy.

The goal of today's lab is to make a new python module, `traders.tsx` that will manage a single trader on our trading floor.

We will experiment and explore in the lab, and then migrate to a python module when we're ready.

use the free tools like if polygon.ai is free and also use the llm model which are free like gemini or glm5.2 and other better not paid ones for this 



1) ### Let's start by gathering the MCP params for our trader . create a mcp param from scratch that should be free of cost with glm 5.2 (from cloudflare or matbe zcode )

i will give you small snipppeets of code also go one by one if is_paid_polygon or is_realtime_polygon:
    market_mcp = {"command": "uvx","args": ["--from", "git+https://github.com/polygon-io/mcp_polygon@master", "mcp_polygon"], "env": {"POLYGON_API_KEY": polygon_api_key}}
else:
    market_mcp = ({"command": "uv", "args": ["run", "market_server.py"]})

trader_mcp_server_params = [
    {"command": "uv", "args": ["run", "accounts_server.py"]},
    {"command": "uv", "args": ["run", "push_server.py"]},
    market_mcp
] this is for poloygod market mcp . is it free on internet if yes then use it else use a free one 

Also we need chaching for history saving and saving the tokens . we have accounts server and the push server also 

import os
from dotenv import load_dotenv
import requests
from pydantic import BaseModel, Field
from mcp.server.fastmcp import FastMCP

load_dotenv(override=True)

pushover_user = os.getenv("PUSHOVER_USER")
pushover_token = os.getenv("PUSHOVER_TOKEN")
pushover_url = "https://api.pushover.net/1/messages.json"


mcp = FastMCP("push_server")


class PushModelArgs(BaseModel):
    message: str = Field(description="A brief message to push")


@mcp.tool()
def push(args: PushModelArgs):
    """Send a push notification with this brief message"""
    print(f"Push: {args.message}")
    payload = {"user": pushover_user, "token": pushover_token, "message": args.message}
    requests.post(pushover_url, data=payload)
    return "Push notification sent"


if __name__ == "__main__":
    mcp.run(transport="stdio")


now for the resaeacher go with the brave key (if it is free add that in env else use someting else ) and create a mcp server for the resaeacher part with giving him the fetch 
brave_env = {"BRAVE_API_KEY": os.getenv("BRAVE_API_KEY")}

researcher_mcp_server_params = [
    {"command": "uvx", "args": ["mcp-server-fetch"]},
    {"command": "npx", "args": ["-y", "@modelcontextprotocol/server-brave-search"], "env": brave_env}
]

researcher_mcp_servers = [MCPServerStdio(params, client_session_timeout_seconds=30) for params in researcher_mcp_server_params]
trader_mcp_servers = [MCPServerStdio(params, client_session_timeout_seconds=30) for params in trader_mcp_server_params]
mcp_servers = trader_mcp_servers + researcher_mcp_servers  ## createing the mcp servere research agent be should be like a tool 

async def get_researcher(mcp_servers) -> Agent:
    instructions = f"""You are a financial researcher. You are able to search the web for interesting financial news,
look for possible trading opportunities, and help with research.
Based on the request, you carry out necessary research and respond with your findings.
Take time to make multiple searches to get a comprehensive overview, and then summarize your findings.
If there isn't a specific request, then just respond with investment opportunities based on searching latest news.
The current datetime is {datetime.now().strftime("%Y-%m-%d %H:%M:%S")}
"""
    researcher = Agent(
        name="Researcher",
        instructions=instructions,
        model="gpt-4.1-mini",
        mcp_servers=mcp_servers,
    )
    return researcher


    async def get_researcher_tool(mcp_servers) -> Tool:
    researcher = await get_researcher(mcp_servers)
    return researcher.as_tool(
            tool_name="Researcher",
            tool_description="This tool researches online for news and opportunities, \
                either based on your specific request to look into a certain stock, \
                or generally for notable financial news and opportunities. \
                Describe what kind of research you're looking for."
        )


        research_question = "What's the latest news on Amazon?"

for server in researcher_mcp_servers:
    await server.connect()
researcher = await get_researcher(researcher_mcp_servers)
with trace("Researcher"):
    result = await Runner.run(researcher, research_question, max_turns=30)
display(Markdown(result.final_output))


dont implement everything go in small modules for chceeckign the aboueve the question . 


Also note the folder strucute should be as clear as crystal with naming convention very easy and no file should have more than 150 lines of code and code should be in typesctipt 

give me in steps dont add evrything once at all . add in small steps 

-->

next this is the traders logic


<!--
agent_name = "Ed"

# Using MCP Servers to read resources
account_details = await read_accounts_resource(agent_name)
strategy = await read_strategy_resource(agent_name)

instructions = f"""
You are a trader that manages a portfolio of shares. Your name is {agent_name} and your account is under your name, {agent_name}.
You have access to tools that allow you to search the internet for company news, check stock prices, and buy and sell shares.
Your investment strategy for your portfolio is:
{strategy}
Your current holdings and balance is:
{account_details}
You have the tools to perform a websearch for relevant news and information.
You have tools to check stock prices.
You have tools to buy and sell shares.
You have tools to save memory of companies, research and thinking so far.
Please make use of these tools to manage your portfolio. Carry out trades as you see fit; do not wait for instructions or ask for confirmation.
"""

prompt = """
Use your tools to make decisions about your portfolio.
Investigate the news and the market, make your decision, make the trades, and respond with a summary of your actions.

>

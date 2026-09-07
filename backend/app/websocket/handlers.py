import asyncio
import uuid
import logging
import time
from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from typing import Dict, Any, List
from types import SimpleNamespace

logger = logging.getLogger("wvcp.websocket")
logging.basicConfig(level=logging.INFO)

router = APIRouter()

async def run_exact_solver(websocket: WebSocket, graph_id: str, config: Dict[str, Any]):
    """Run exact solver and stream events to WebSocket."""
    solver_service = websocket.app.state.solver_service
    loop = asyncio.get_running_loop()
    events_queue = asyncio.Queue()
    
    def event_callback(event):
        payload = event.model_dump() if hasattr(event, 'model_dump') else event
        loop.call_soon_threadsafe(events_queue.put_nowait, payload)

    async def solver_task():
        try:
            logger.info(f"Starting exact solver for graph {graph_id}")
            cfg = SimpleNamespace(**config)
            await websocket.app.state.solver_service.run_exact(graph_id, cfg, event_callback)
            logger.info(f"Exact solver finished for graph {graph_id}")
        except Exception as e:
            logger.error(f"Error in exact solver: {e}", exc_info=True)
            loop.call_soon_threadsafe(events_queue.put_nowait, {"type": "ERROR", "message": f"Exact solver error: {str(e)}"})
        finally:
            loop.call_soon_threadsafe(events_queue.put_nowait, None)

    task = asyncio.create_task(solver_task())

    try:
        while True:
            event = await events_queue.get()
            if event is None:
                break
            try:
                await websocket.send_json(event)
            except Exception as e:
                logger.warning(f"Failed to send event over websocket: {e}")
                break
    finally:
        task.cancel()

async def run_mcts_solver(websocket: WebSocket, graph_id: str, config: Dict[str, Any]):
    """Run MCTS solver and stream events to WebSocket."""
    loop = asyncio.get_running_loop()
    events_queue = asyncio.Queue()
    
    def event_callback(event):
        payload = event.model_dump() if hasattr(event, 'model_dump') else event
        loop.call_soon_threadsafe(events_queue.put_nowait, payload)

    async def solver_task():
        try:
            logger.info(f"Starting MCTS solver for graph {graph_id} with config: {config}")
            cfg = SimpleNamespace(**config)
            await websocket.app.state.solver_service.run_mcts(graph_id, cfg, event_callback)
            logger.info(f"MCTS solver completed for graph {graph_id}")
        except Exception as e:
            logger.error(f"Error in MCTS solver: {e}", exc_info=True)
            loop.call_soon_threadsafe(events_queue.put_nowait, {"type": "ERROR", "message": f"MCTS error: {str(e)}"})
        finally:
            loop.call_soon_threadsafe(events_queue.put_nowait, None)

    task = asyncio.create_task(solver_task())

    try:
        while True:
            event = await events_queue.get()
            if event is None:
                break
            try:
                await websocket.send_json(event)
            except Exception as e:
                logger.warning(f"Failed to send event over websocket: {e}")
                break
    finally:
        task.cancel()

async def run_comparison(websocket: WebSocket, graph_id: str, configs: List[Dict[str, Any]]):
    """Run comparison of algorithms and stream events."""
    loop = asyncio.get_running_loop()
    events_queue = asyncio.Queue()

    async def task():
        try:
            logger.info(f"Starting comparison for graph {graph_id} across {len(configs)} algorithms")
            cfg_objs = [SimpleNamespace(**c) for c in configs]
            solver_service = websocket.app.state.solver_service
            comparison_data: Dict[str, Any] = {}

            for cfg in cfg_objs:
                algo = getattr(cfg, 'algorithm', 'mcts')
                
                def make_algo_callback(algo_name: str):
                    def cb(event):
                        payload = event.model_dump() if hasattr(event, 'model_dump') else event
                        if isinstance(payload, dict):
                            payload['algorithm'] = algo_name
                        loop.call_soon_threadsafe(events_queue.put_nowait, payload)
                    return cb

                algo_cb = make_algo_callback(algo)
                if algo == 'exact':
                    res = await solver_service.run_exact(graph_id, cfg, algo_cb)
                    comparison_data['exact'] = {
                        'score': res.best_score if res.best_score != float('inf') else None,
                        'num_colors': res.num_colors,
                        'runtime': res.runtime,
                        'nodes_explored': res.states_explored,
                        'nodes_pruned': res.branches_pruned,
                        'status': res.status,
                        'is_optimal': res.is_optimal,
                        'coloring': res.best_coloring or {}
                    }
                else:
                    res = await solver_service.run_mcts(graph_id, cfg, algo_cb)
                    comparison_data['mcts'] = {
                        'score': res.best_score if res.best_score != float('inf') else None,
                        'num_colors': res.num_colors,
                        'runtime': res.runtime,
                        'nodes_explored': res.nodes_explored,
                        'nodes_pruned': getattr(res, 'nodes_pruned', 0),
                        'simulations': getattr(res, 'simulations', 0),
                        'status': res.status,
                        'is_optimal': res.is_optimal,
                        'coloring': res.best_coloring or {},
                        'strategy': getattr(cfg, 'strategy', 'dsatur')
                    }

            # Compute comparison metrics if both exist
            optimality_gap = None
            speedup = None
            if 'exact' in comparison_data and 'mcts' in comparison_data:
                exact_score = comparison_data['exact']['score']
                mcts_score = comparison_data['mcts']['score']
                if exact_score and mcts_score and exact_score > 0:
                    optimality_gap = round(((mcts_score - exact_score) / exact_score) * 100, 2)
                exact_runtime = comparison_data['exact']['runtime']
                mcts_runtime = comparison_data['mcts']['runtime']
                if mcts_runtime and mcts_runtime > 0:
                    speedup = round(exact_runtime / mcts_runtime, 2)

            comparison_payload = {
                'type': 'COMPARISON_COMPLETED',
                'timestamp': time.time(),
                'data': {
                    'results': comparison_data,
                    'optimality_gap': optimality_gap,
                    'speedup': speedup
                },
                'message': f"Comparison finished: Exact score={comparison_data.get('exact', {}).get('score')}, MCTS score={comparison_data.get('mcts', {}).get('score')}"
            }
            loop.call_soon_threadsafe(events_queue.put_nowait, comparison_payload)
            logger.info(f"Comparison completed for graph {graph_id}")
        except Exception as e:
            logger.error(f"Error in comparison: {e}", exc_info=True)
            loop.call_soon_threadsafe(events_queue.put_nowait, {"type": "ERROR", "message": f"Comparison error: {str(e)}"})
        finally:
            loop.call_soon_threadsafe(events_queue.put_nowait, None)

    task_handle = asyncio.create_task(task())

    try:
        while True:
            event = await events_queue.get()
            if event is None:
                break
            try:
                await websocket.send_json(event)
            except Exception as e:
                logger.warning(f"Failed to send event over websocket: {e}")
                break
    finally:
        task_handle.cancel()

@router.websocket('/solve')
async def websocket_solve(websocket: WebSocket):
    await websocket.accept()
    client_id = str(uuid.uuid4())
    logger.info(f"WebSocket client connected: {client_id}")
    
    try:
        while True:
            data = await websocket.receive_json()
            command = data.get('command')
            logger.info(f"Received WS command: {command} from {client_id}")
            
            if command == 'run_exact':
                graph_id = data.get('graph_id')
                config = data.get('config', {})
                if graph_id:
                    asyncio.create_task(run_exact_solver(websocket, graph_id, config))
                else:
                    await websocket.send_json({"type": "ERROR", "message": "Missing graph_id for run_exact"})
            
            elif command == 'run_mcts':
                graph_id = data.get('graph_id')
                config = data.get('config', {})
                if graph_id:
                    asyncio.create_task(run_mcts_solver(websocket, graph_id, config))
                else:
                    await websocket.send_json({"type": "ERROR", "message": "Missing graph_id for run_mcts"})
            
            elif command == 'run_comparison':
                graph_id = data.get('graph_id')
                configs = data.get('configs', [])
                if graph_id and configs:
                    asyncio.create_task(run_comparison(websocket, graph_id, configs))
                else:
                    await websocket.send_json({"type": "ERROR", "message": "Missing graph_id or configs for run_comparison"})
            else:
                await websocket.send_json({"type": "ERROR", "message": f"Unknown command '{command}'"})
    
    except WebSocketDisconnect:
        logger.info(f"WebSocket client disconnected: {client_id}")
    except Exception as e:
        logger.error(f"Websocket exception for {client_id}: {e}", exc_info=True)

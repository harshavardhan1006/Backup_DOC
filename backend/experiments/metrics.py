import csv
import json
from typing import Optional
from app.models.experiment import ExperimentResult

def calculate_optimality_gap(exact_score: float, mcts_score: float) -> Optional[float]:
    if exact_score <= 0 or mcts_score <= 0:
        return None
    return ((mcts_score - exact_score) / exact_score) * 100.0

def calculate_speedup(exact_runtime: float, mcts_runtime: float, exact_status: str) -> Optional[float]:
    if mcts_runtime <= 0:
        return None
    return exact_runtime / mcts_runtime

def aggregate_results(results: list[ExperimentResult]) -> dict:
    summary = {
        'total_experiments': len(results),
        'algorithms': {}
    }
    
    for r in results:
        if r.algorithm not in summary['algorithms']:
            summary['algorithms'][r.algorithm] = {
                'count': 0,
                'avg_score': 0.0,
                'avg_time': 0.0
            }
        
        stats = summary['algorithms'][r.algorithm]
        stats['count'] += 1
        stats['avg_score'] += r.score
        stats['avg_time'] += r.execution_time
        
    for algo, stats in summary['algorithms'].items():
        if stats['count'] > 0:
            stats['avg_score'] /= stats['count']
            stats['avg_time'] /= stats['count']
            
    return summary

def export_results_csv(results: list[ExperimentResult], filepath: str):
    if not results:
        return
        
    with open(filepath, 'w', newline='') as f:
        writer = csv.writer(f)
        writer.writerow(['experiment_id', 'graph_id', 'algorithm', 'score', 'execution_time', 'status'])
        for r in results:
            writer.writerow([r.experiment_id, r.graph_id, r.algorithm, r.score, r.execution_time, r.status])

def export_results_json(results: list[ExperimentResult], filepath: str):
    data = [r.dict() for r in results]
    with open(filepath, 'w') as f:
        json.dump(data, f, indent=2)

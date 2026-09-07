import React, { useRef, useEffect, useState } from 'react';
import * as d3 from 'd3';
import { MCTSTreeNode } from '../types';

interface MCTSTreeVisualizationProps {
  nodes: MCTSTreeNode[];
  selectedNodeId?: string;
  bestPath?: string[];
  maxDepth?: number;
  showDepth?: number;
}

export default function MCTSTreeVisualization({ 
  nodes, 
  selectedNodeId, 
  bestPath = [], 
  maxDepth = 10, 
  showDepth = 5 
}: MCTSTreeVisualizationProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const zoomRef = useRef<d3.ZoomBehavior<Element, unknown> | null>(null);

  const [depth, setDepth] = useState(showDepth);

  useEffect(() => {
    if (!nodes.length || !svgRef.current || !containerRef.current) return;

    const width = containerRef.current.clientWidth;
    const height = containerRef.current.clientHeight;
    const svg = d3.select(svgRef.current);
    
    svg.selectAll('*').remove();

    const defs = svg.append('defs');
    const filter = defs.append('filter').attr('id', 'nodeGlow');
    filter.append('feGaussianBlur').attr('stdDeviation', '3').attr('result', 'coloredBlur');
    const merge = filter.append('feMerge');
    merge.append('feMergeNode').attr('in', 'coloredBlur');
    merge.append('feMergeNode').attr('in', 'SourceGraphic');

    const zoom = d3.zoom()
      .scaleExtent([0.1, 4])
      .on('zoom', (event) => {
        g.attr('transform', event.transform);
      });
      
    zoomRef.current = zoom as any;
    svg.call(zoom as any);

    const g = svg.append('g').attr('transform', 'translate(' + (width / 2) + ', 50)');

    const rootNode = nodes.find(n => n.parent_id === null || n.parent_id === undefined) || nodes[0];
    if (!rootNode) return;

    const buildTree = (node: MCTSTreeNode, currentDepth: number): any => {
      if (currentDepth > depth) return null;
      const children = nodes.filter(n => n.parent_id === node.id);
      return {
        ...node,
        children: children.length ? children.map(c => buildTree(c, currentDepth + 1)).filter(Boolean) : undefined
      };
    };

    const treeData = buildTree(rootNode, 0);
    if (!treeData) return;
    const root = d3.hierarchy(treeData);

    const treeLayout = d3.tree().nodeSize([60, 80]);
    treeLayout(root as any);

    // Draw links
    g.append('g')
      .attr('fill', 'none')
      .attr('stroke', '#2a2a4a')
      .attr('stroke-width', 2)
      .selectAll('path')
      .data(root.links())
      .join('path')
      .attr('d', (d: any) => {
        const sx = d.source.x, sy = d.source.y;
        const tx = d.target.x, ty = d.target.y;
        const my = (sy + ty) / 2;
        return 'M' + sx + ',' + sy + ' C' + sx + ',' + my + ' ' + tx + ',' + my + ' ' + tx + ',' + ty;
      })
      .attr('stroke', (d: any) => {
        if (bestPath.includes(d.source.data.id) && bestPath.includes(d.target.data.id)) {
          return '#00E5A0';
        }
        return '#2a2a4a';
      });

    const maxVisits = d3.max(nodes, d => d.visits) || 1;
    const sizeScale = d3.scaleLinear().domain([0, maxVisits]).range([8, 25]);
    const colorScale = d3.scaleSequential(d3.interpolateRdYlGn).domain([0, 1]);

    // Draw nodes
    const node = g.append('g')
      .selectAll('g')
      .data(root.descendants())
      .join('g')
      .attr('transform', (d: any) => 'translate(' + d.x + ',' + d.y + ')');

    node.append('circle')
      .attr('r', (d: any) => sizeScale(d.data.visits || 0))
      .attr('fill', (d: any) => colorScale(d.data.avg_reward || 0))
      .attr('stroke', (d: any) => {
        if (selectedNodeId === d.data.id) return '#00D4FF';
        if (bestPath.includes(d.data.id)) return '#00E5A0';
        if (d.data.is_pruned) return '#FF6B6B';
        return '#1a1a2a';
      })
      .attr('stroke-width', (d: any) => selectedNodeId === d.data.id || bestPath.includes(d.data.id) ? 3 : 1)
      .attr('stroke-dasharray', (d: any) => d.data.is_pruned ? '4,2' : 'none')
      .attr('opacity', (d: any) => d.data.is_pruned ? 0.4 : 1)
      .attr('filter', (d: any) => (selectedNodeId === d.data.id || bestPath.includes(d.data.id)) ? 'url(#nodeGlow)' : null);

    // Tooltip on hover
    node.append('title')
      .text((d: any) => {
        const data = d.data;
        return 'ID: ' + data.id + '\nVisits: ' + (data.visits || 0) + '\nAvg Reward: ' + (data.avg_reward ? data.avg_reward.toFixed(3) : 'N/A') + '\nBest Score: ' + (data.best_score !== undefined ? data.best_score : 'N/A');
      });

    // Visit count labels for large nodes
    node.filter((d: any) => sizeScale(d.data.visits || 0) > 14)
      .append('text')
      .attr('dy', '0.35em')
      .attr('text-anchor', 'middle')
      .attr('fill', 'white')
      .attr('font-size', '8px')
      .attr('font-family', 'monospace')
      .text((d: any) => d.data.visits || 0);

    // Initial zoom fit
    const fitView = () => {
      const bounds = g.node()?.getBBox();
      if (!bounds || bounds.width === 0) return;
      const padding = 40;
      const scale = Math.min(
        (width - padding * 2) / bounds.width,
        (height - padding * 2) / bounds.height
      ) * 0.85;
      const transform = d3.zoomIdentity
        .translate(width / 2, padding)
        .scale(Math.min(scale, 2));
      svg.transition().duration(750).call(zoom.transform as any, transform);
    };

    setTimeout(fitView, 100);

  }, [nodes, selectedNodeId, bestPath, depth]);

  const visibleCount = nodes.filter(n => (n.depth || 0) <= depth).length;

  return (
    <div className="relative w-full h-full bg-[#0a0a1a] rounded-lg overflow-hidden backdrop-blur-md border border-white/10 flex flex-col">
      {/* Controls */}
      <div className="absolute top-4 left-4 z-10 flex flex-col space-y-2 bg-black/60 backdrop-blur-sm p-3 rounded-lg border border-white/10">
        <label className="text-xs text-cyan-400 font-medium">Visible Depth: {depth}</label>
        <input 
          type="range" 
          min="1" 
          max={maxDepth} 
          value={depth} 
          onChange={(e) => setDepth(parseInt(e.target.value))} 
          className="w-32 accent-cyan-500"
        />
        <div className="text-xs text-gray-500">
          Showing {visibleCount} / {nodes.length} nodes
        </div>
      </div>

      {/* Empty state */}
      {nodes.length === 0 && (
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center text-gray-500">
            <div className="text-4xl mb-2 opacity-30">🌳</div>
            <div className="text-sm">MCTS Tree will appear here</div>
            <div className="text-xs mt-1">Run MCTS to see the search tree grow</div>
          </div>
        </div>
      )}

      {/* SVG container */}
      <div ref={containerRef} className="flex-1 w-full h-full">
        <svg ref={svgRef} className="w-full h-full" />
      </div>
    </div>
  );
}

import React, { useRef, useEffect } from 'react';
import * as d3 from 'd3';
import { GRAPH_COLORS } from '../types';
import type { VisualizationMode } from '../types';

interface VisNode {
  id: number;
  weight: number;
  x?: number;
  y?: number;
  fx?: number | null;
  fy?: number | null;
}

interface VisLink {
  source: any;
  target: any;
}

interface VisualizationData {
  nodes?: VisNode[];
  links?: VisLink[];
  type?: string;
  num_vertices?: number;
  weights?: number[];
  edges?: [number, number][];
}

interface GraphVisualizationProps {
  graphData: VisualizationData | null;
  coloring: Record<string, number>;
  selectedVertex?: number;
  highlightedVertices?: Set<number>;
  mode?: VisualizationMode;
  onVertexClick?: (vertexId: number) => void;
}

const MAX_SVG_EDGES = 600;

export default function GraphVisualization({ 
  graphData, 
  coloring, 
  selectedVertex, 
  highlightedVertices, 
  mode = 'detailed', 
  onVertexClick 
}: GraphVisualizationProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const zoomRef = useRef<d3.ZoomBehavior<SVGSVGElement, unknown> | null>(null);
  const gRef = useRef<d3.Selection<SVGGElement, unknown, null, undefined> | null>(null);
  const nodeSelectionRef = useRef<d3.Selection<any, VisNode, any, any> | null>(null);
  const linkSelectionRef = useRef<d3.Selection<any, VisLink, any, any> | null>(null);
  const simulationRef = useRef<d3.Simulation<VisNode, VisLink> | null>(null);

  const [totalEdgesCount, setTotalEdgesCount] = React.useState(0);
  const [renderedEdgesCount, setRenderedEdgesCount] = React.useState(0);

  // Effect 1: Build graph structure and force simulation ONLY when graphData or mode changes
  useEffect(() => {
    if (!graphData || !svgRef.current || !containerRef.current) return;
    if (mode === 'overview') return;

    if (simulationRef.current) {
      simulationRef.current.stop();
    }

    const width = containerRef.current.clientWidth || 700;
    const height = containerRef.current.clientHeight || 500;
    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();

    // Glow filters
    const defs = svg.append('defs');
    const glowFilter = defs.append('filter').attr('id', 'neonGlow');
    glowFilter.append('feGaussianBlur').attr('stdDeviation', '4').attr('result', 'blur');
    const glowMerge = glowFilter.append('feMerge');
    glowMerge.append('feMergeNode').attr('in', 'blur');
    glowMerge.append('feMergeNode').attr('in', 'SourceGraphic');

    const g = svg.append('g');
    gRef.current = g;

    // Zoom behavior
    const zoom = d3.zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.05, 5])
      .on('zoom', (event) => {
        g.attr('transform', event.transform);
      });
    zoomRef.current = zoom;
    svg.call(zoom);

    // Normalize nodes & links
    let rawNodes: VisNode[] = [];
    let rawLinks: VisLink[] = [];

    if (graphData.nodes && graphData.nodes.length > 0) {
      rawNodes = graphData.nodes.map(n => ({ id: n.id, weight: n.weight }));
      rawLinks = (graphData.links || []).map(l => ({
        source: typeof l.source === 'object' ? l.source.id : l.source,
        target: typeof l.target === 'object' ? l.target.id : l.target,
      }));
    } else if (graphData.num_vertices !== undefined) {
      const weights = graphData.weights || [];
      for (let i = 0; i < graphData.num_vertices; i++) {
        rawNodes.push({ id: i, weight: weights[i] ?? 1 });
      }
      for (const [u, v] of (graphData.edges || [])) {
        rawLinks.push({ source: u, target: v });
      }
    }

    if (rawNodes.length === 0) return;

    // Cap edges for rendering performance if dense
    setTotalEdgesCount(rawLinks.length);
    let renderLinks = rawLinks;
    if (rawLinks.length > MAX_SVG_EDGES) {
      // Sample evenly
      const step = Math.ceil(rawLinks.length / MAX_SVG_EDGES);
      renderLinks = rawLinks.filter((_, idx) => idx % step === 0);
    }
    setRenderedEdgesCount(renderLinks.length);

    // Node radius scale
    const maxW = d3.max(rawNodes, d => d.weight) || 1;
    const minW = d3.min(rawNodes, d => d.weight) || 1;
    const isLarge = rawNodes.length > 50;
    const minRadius = isLarge ? 8 : 14;
    const maxRadius = isLarge ? 18 : 28;
    const radiusScale = d3.scaleLinear().domain([minW, maxW]).range([minRadius, maxRadius]);

    // Force simulation
    const linkDistance = isLarge ? 45 : 75;
    const chargeStrength = isLarge ? -90 : -180;
    
    const sim = d3.forceSimulation<VisNode>(rawNodes)
      .force('link', d3.forceLink<VisNode, VisLink>(renderLinks).id((d: any) => d.id).distance(linkDistance))
      .force('charge', d3.forceManyBody().strength(chargeStrength))
      .force('center', d3.forceCenter(width / 2, height / 2))
      .force('collision', d3.forceCollide().radius((d: any) => radiusScale(d.weight) + (isLarge ? 2 : 4)));

    simulationRef.current = sim;

    // Links
    const linkGroup = g.append('g').attr('class', 'links');
    const linkSelection = linkGroup.selectAll<SVGLineElement, VisLink>('line')
      .data(renderLinks)
      .join('line')
      .attr('stroke', 'rgba(255, 255, 255, 0.08)')
      .attr('stroke-width', isLarge ? 0.75 : 1.2);
    linkSelectionRef.current = linkSelection;

    // Nodes
    const nodeGroup = g.append('g').attr('class', 'nodes');
    const nodeSelection = nodeGroup.selectAll<SVGGElement, VisNode>('g')
      .data(rawNodes)
      .join('g')
      .attr('class', 'graph-node')
      .style('cursor', 'pointer')
      .call(d3.drag<SVGGElement, VisNode>()
        .on('start', (event, d) => {
          if (!event.active) sim.alphaTarget(0.2).restart();
          d.fx = d.x;
          d.fy = d.y;
        })
        .on('drag', (event, d) => {
          d.fx = event.x;
          d.fy = event.y;
        })
        .on('end', (event, d) => {
          if (!event.active) sim.alphaTarget(0);
          d.fx = null;
          d.fy = null;
        })
      )
      .on('click', (_event, d) => {
        if (onVertexClick) onVertexClick(d.id);
      });

    nodeSelectionRef.current = nodeSelection;

    // Circle
    nodeSelection.append('circle')
      .attr('r', d => radiusScale(d.weight))
      .attr('fill', '#1f1f38')
      .attr('stroke', '#333355')
      .attr('stroke-width', 1.5);

    // Node label (weight)
    nodeSelection.append('text')
      .attr('class', 'node-weight')
      .attr('text-anchor', 'middle')
      .attr('dy', '0.35em')
      .attr('fill', '#ffffff')
      .attr('font-size', isLarge ? '8px' : '11px')
      .attr('font-weight', 'bold')
      .style('pointer-events', 'none')
      .text(d => d.weight);

    // Node ID label (outside)
    if (!isLarge) {
      nodeSelection.append('text')
        .attr('class', 'node-id')
        .attr('text-anchor', 'middle')
        .attr('dy', d => radiusScale(d.weight) + 12)
        .attr('fill', '#7a7a9a')
        .attr('font-size', '9px')
        .style('pointer-events', 'none')
        .text(d => `v${d.id}`);
    }

    // Tick
    sim.on('tick', () => {
      linkSelection
        .attr('x1', (d: any) => d.source.x)
        .attr('y1', (d: any) => d.source.y)
        .attr('x2', (d: any) => d.target.x)
        .attr('y2', (d: any) => d.target.y);

      nodeSelection.attr('transform', (d: any) => `translate(${d.x},${d.y})`);
    });

    // Auto-stop simulation after settling to save CPU
    sim.alphaDecay(isLarge ? 0.05 : 0.028);

    // Initial zoom fit
    const fitTimer = setTimeout(() => {
      const bounds = g.node()?.getBBox();
      if (!bounds || bounds.width === 0) return;
      const padding = 40;
      const scale = Math.min(
        (width - padding * 2) / bounds.width,
        (height - padding * 2) / bounds.height
      ) * 0.9;
      const tx = width / 2 - (bounds.x + bounds.width / 2) * scale;
      const ty = height / 2 - (bounds.y + bounds.height / 2) * scale;
      svg.transition().duration(600).call(zoom.transform, d3.zoomIdentity.translate(tx, ty).scale(Math.min(scale, 1.8)));
    }, 500);

    return () => {
      clearTimeout(fitTimer);
      sim.stop();
    };
  }, [graphData, mode]);

  // Effect 2: In-place update of node colors, selections, and edge conflicts WITHOUT rebuilding DOM
  useEffect(() => {
    if (!nodeSelectionRef.current) return;

    nodeSelectionRef.current.select('circle')
      .attr('fill', (d: VisNode) => {
        const c = coloring[String(d.id)];
        return c !== undefined ? (GRAPH_COLORS[c % GRAPH_COLORS.length] || '#00D4FF') : '#1f1f38';
      })
      .attr('stroke', (d: VisNode) => {
        if (selectedVertex === d.id) return '#ffffff';
        if (highlightedVertices?.has(d.id)) return '#00D4FF';
        const c = coloring[String(d.id)];
        return c !== undefined ? 'rgba(255,255,255,0.4)' : '#333355';
      })
      .attr('stroke-width', (d: VisNode) => {
        if (selectedVertex === d.id) return 3.5;
        if (highlightedVertices?.has(d.id)) return 2.5;
        return 1.5;
      })
      .attr('filter', (d: VisNode) => {
        return coloring[String(d.id)] !== undefined ? 'url(#neonGlow)' : null;
      });

    // Update conflicting edges (adjacent vertices with same color)
    if (linkSelectionRef.current) {
      linkSelectionRef.current.attr('stroke', (d: any) => {
        const u = typeof d.source === 'object' ? d.source.id : d.source;
        const v = typeof d.target === 'object' ? d.target.id : d.target;
        const cu = coloring[String(u)];
        const cv = coloring[String(v)];
        if (cu !== undefined && cv !== undefined && cu === cv) {
          return '#FF6B6B'; // Conflict!
        }
        return 'rgba(255, 255, 255, 0.08)';
      })
      .attr('stroke-width', (d: any) => {
        const u = typeof d.source === 'object' ? d.source.id : d.source;
        const v = typeof d.target === 'object' ? d.target.id : d.target;
        const cu = coloring[String(u)];
        const cv = coloring[String(v)];
        return (cu !== undefined && cv !== undefined && cu === cv) ? 2.5 : 0.8;
      });
    }
  }, [coloring, selectedVertex, highlightedVertices]);

  const handleZoomIn = () => {
    if (svgRef.current && zoomRef.current) {
      d3.select(svgRef.current).transition().call(zoomRef.current.scaleBy, 1.4);
    }
  };

  const handleZoomOut = () => {
    if (svgRef.current && zoomRef.current) {
      d3.select(svgRef.current).transition().call(zoomRef.current.scaleBy, 0.7);
    }
  };

  const handleResetZoom = () => {
    if (svgRef.current && zoomRef.current && gRef.current && containerRef.current) {
      const width = containerRef.current.clientWidth || 700;
      const height = containerRef.current.clientHeight || 500;
      const bounds = gRef.current.node()?.getBBox();
      if (!bounds || bounds.width === 0) return;
      const scale = Math.min((width - 60) / bounds.width, (height - 60) / bounds.height) * 0.9;
      const tx = width / 2 - (bounds.x + bounds.width / 2) * scale;
      const ty = height / 2 - (bounds.y + bounds.height / 2) * scale;
      d3.select(svgRef.current).transition().duration(500).call(
        zoomRef.current.transform,
        d3.zoomIdentity.translate(tx, ty).scale(Math.min(scale, 1.8))
      );
    }
  };

  if (!graphData) {
    return (
      <div className="w-full h-full flex flex-col items-center justify-center p-8 text-center bg-black/20 rounded-2xl border border-white/5">
        <div className="w-16 h-16 rounded-2xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400 mb-4 shadow-[0_0_20px_rgba(0,212,255,0.15)] text-2xl">
          ⬡
        </div>
        <h3 className="text-white font-semibold mb-1">No Graph Loaded</h3>
        <p className="text-gray-400 text-xs max-w-xs">
          Generate a graph from the sidebar, select a preset, or import a dataset file to visualize.
        </p>
      </div>
    );
  }

  return (
    <div ref={containerRef} className="relative w-full h-full overflow-hidden bg-[#070716] rounded-2xl border border-white/10">
      <svg ref={svgRef} className="w-full h-full select-none" />

      {/* Floating Toolbar */}
      <div className="absolute top-4 right-4 flex items-center gap-2 bg-black/60 backdrop-blur-md p-1.5 rounded-xl border border-white/10 shadow-lg">
        <button 
          onClick={handleZoomIn} 
          className="w-7 h-7 flex items-center justify-center text-gray-300 hover:text-white hover:bg-white/10 rounded-lg text-sm transition-colors"
          title="Zoom In"
        >
          +
        </button>
        <button 
          onClick={handleZoomOut} 
          className="w-7 h-7 flex items-center justify-center text-gray-300 hover:text-white hover:bg-white/10 rounded-lg text-sm transition-colors"
          title="Zoom Out"
        >
          −
        </button>
        <button 
          onClick={handleResetZoom} 
          className="px-2 h-7 flex items-center justify-center text-gray-300 hover:text-white hover:bg-white/10 rounded-lg text-xs transition-colors"
          title="Fit to Screen"
        >
          Fit
        </button>
      </div>

      {/* Sampling notification badge for dense graphs */}
      {totalEdgesCount > MAX_SVG_EDGES && (
        <div className="absolute bottom-4 left-4 text-[11px] bg-black/70 backdrop-blur-md text-cyan-300 px-3 py-1.5 rounded-lg border border-cyan-500/30 flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse"></span>
          <span>Dense Graph Mode: Displaying {renderedEdgesCount} sampled edges ({totalEdgesCount.toLocaleString()} total)</span>
        </div>
      )}
    </div>
  );
}

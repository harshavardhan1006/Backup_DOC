import React, { useRef, useEffect, useCallback } from 'react';
import * as d3 from 'd3';
import { GRAPH_COLORS } from '../types';
import type { VisualizationMode, GraphStats } from '../types';

interface VisNode {
  id: number;
  weight: number;
  degree?: number;
  x?: number;
  y?: number;
  fx?: number | null;
  fy?: number | null;
}

interface VisLink {
  source: any;
  target: any;
}

export interface VisualizationData {
  nodes?: VisNode[];
  links?: VisLink[];
  type?: string;
  isSampled?: boolean;
  totalVertices?: number;
  displayedVertices?: number;
  totalEdges?: number;
  displayedEdges?: number;
  num_vertices?: number;
  weights?: number[];
  edges?: [number, number][];
}

interface GraphVisualizationProps {
  graphData: VisualizationData | null;
  coloring: Record<string, number>;
  graphStats?: GraphStats | null;
  sampleLimit?: number;
  onSampleLimitChange?: (limit: number) => void;
  selectedVertex?: number;
  highlightedVertices?: Set<number>;
  mode?: VisualizationMode;
  onVertexClick?: (vertexId: number) => void;
}

const MAX_SVG_EDGES = 800;

export default function GraphVisualization({
  graphData,
  coloring,
  sampleLimit = 250,
  onSampleLimitChange,
  selectedVertex,
  highlightedVertices,
  mode = 'detailed',
  onVertexClick,
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

  const totalVertices =
    graphData?.totalVertices ?? graphData?.num_vertices ?? graphData?.nodes?.length ?? 0;
  const displayedVertices = graphData?.displayedVertices ?? graphData?.nodes?.length ?? 0;
  const totalGraphEdges = graphData?.totalEdges ?? graphData?.links?.length ?? 0;
  const isSampled = Boolean(
    graphData?.isSampled || (totalVertices > displayedVertices && displayedVertices > 0)
  );

  // Count colored vertices in the full graph
  const coloredCount = React.useMemo(() => Object.keys(coloring || {}).length, [coloring]);

  // Helper to fit graph into current container dimensions
  const fitGraphToContainer = useCallback((duration = 400) => {
    if (!svgRef.current || !zoomRef.current || !gRef.current || !containerRef.current) return;
    const width = containerRef.current.clientWidth || 700;
    const height = containerRef.current.clientHeight || 500;
    const bounds = gRef.current.node()?.getBBox();
    if (!bounds || bounds.width === 0 || bounds.height === 0) return;

    const padding = 48;
    const scale =
      Math.min((width - padding * 2) / bounds.width, (height - padding * 2) / bounds.height) *
      0.92;
    const clampedScale = Math.min(Math.max(scale, 0.15), 1.75);
    const tx = width / 2 - (bounds.x + bounds.width / 2) * clampedScale;
    const ty = height / 2 - (bounds.y + bounds.height / 2) * clampedScale;

    const svgSel = d3.select(svgRef.current);
    if (duration > 0) {
      svgSel
        .transition()
        .duration(duration)
        .call(zoomRef.current.transform, d3.zoomIdentity.translate(tx, ty).scale(clampedScale));
    } else {
      svgSel.call(zoomRef.current.transform, d3.zoomIdentity.translate(tx, ty).scale(clampedScale));
    }
  }, []);

  // Effect 1: Build graph structure and force simulation when graphData or mode changes
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

    // Subtle glow filter for colored vertices
    const defs = svg.append('defs');
    const glowFilter = defs.append('filter').attr('id', 'neonGlow');
    glowFilter.append('feGaussianBlur').attr('stdDeviation', '3').attr('result', 'blur');
    const glowMerge = glowFilter.append('feMerge');
    glowMerge.append('feMergeNode').attr('in', 'blur');
    glowMerge.append('feMergeNode').attr('in', 'SourceGraphic');

    const g = svg.append('g');
    gRef.current = g;

    // Zoom behavior
    const zoom = d3
      .zoom<SVGSVGElement, unknown>()
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
      rawNodes = graphData.nodes.map((n) => ({
        id: n.id,
        weight: n.weight,
        degree: n.degree,
        x: n.x,
        y: n.y,
      }));
      rawLinks = (graphData.links || []).map((l) => ({
        source: typeof l.source === 'object' ? l.source.id : l.source,
        target: typeof l.target === 'object' ? l.target.id : l.target,
      }));
    } else if (graphData.num_vertices !== undefined) {
      const weights = graphData.weights || [];
      for (let i = 0; i < graphData.num_vertices; i++) {
        rawNodes.push({ id: i, weight: weights[i] ?? 1 });
      }
      for (const [u, v] of graphData.edges || []) {
        rawLinks.push({ source: u, target: v });
      }
    }

    if (rawNodes.length === 0) return;

    // Cap visible SVG edges for smooth rendering if subgraph is very dense
    setTotalEdgesCount(rawLinks.length);
    let renderLinks = rawLinks;
    if (rawLinks.length > MAX_SVG_EDGES) {
      const step = Math.ceil(rawLinks.length / MAX_SVG_EDGES);
      renderLinks = rawLinks.filter((_, idx) => idx % step === 0);
    }
    setRenderedEdgesCount(renderLinks.length);

    // Node radius scale
    const maxW = d3.max(rawNodes, (d) => d.weight) || 1;
    const minW = d3.min(rawNodes, (d) => d.weight) || 1;
    const isLarge = rawNodes.length > 50;
    const minRadius = isLarge ? 6 : 13;
    const maxRadius = isLarge ? 14 : 25;
    const radiusScale = d3
      .scaleLinear()
      .domain([minW, Math.max(minW + 1, maxW)])
      .range([minRadius, maxRadius]);

    // Force simulation parameters tuned for both small and sampled-large graphs
    const linkDistance = isLarge ? 38 : 72;
    const chargeStrength = isLarge ? -65 : -175;

    const sim = d3
      .forceSimulation<VisNode>(rawNodes)
      .force(
        'link',
        d3
          .forceLink<VisNode, VisLink>(renderLinks)
          .id((d: any) => d.id)
          .distance(linkDistance)
      )
      .force('charge', d3.forceManyBody().strength(chargeStrength))
      .force('center', d3.forceCenter(width / 2, height / 2))
      .force(
        'collision',
        d3.forceCollide().radius((d: any) => radiusScale(d.weight) + (isLarge ? 2 : 4))
      );

    simulationRef.current = sim;

    // Links
    const linkGroup = g.append('g').attr('class', 'links');
    const linkSelection = linkGroup
      .selectAll<SVGLineElement, VisLink>('line')
      .data(renderLinks)
      .join('line')
      .attr('stroke', 'rgba(148, 163, 184, 0.14)')
      .attr('stroke-width', isLarge ? 0.8 : 1.25);
    linkSelectionRef.current = linkSelection;

    // Nodes
    const nodeGroup = g.append('g').attr('class', 'nodes');
    const nodeSelection = nodeGroup
      .selectAll<SVGGElement, VisNode>('g')
      .data(rawNodes)
      .join('g')
      .attr('class', 'graph-node')
      .style('cursor', 'pointer')
      .call(
        d3
          .drag<SVGGElement, VisNode>()
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

    // Tooltip for inspecting any vertex
    nodeSelection
      .append('title')
      .text(
        (d) =>
          `Vertex v${d.id}\nWeight: ${d.weight}${
            d.degree !== undefined ? `\nDegree: ${d.degree}` : ''
          }`
      );

    // Circle
    nodeSelection
      .append('circle')
      .attr('r', (d) => radiusScale(d.weight))
      .attr('fill', '#171730')
      .attr('stroke', '#334155')
      .attr('stroke-width', 1.5);

    // Node label (weight)
    nodeSelection
      .append('text')
      .attr('class', 'node-weight')
      .attr('text-anchor', 'middle')
      .attr('dy', '0.35em')
      .attr('fill', '#f8fafc')
      .attr('font-size', isLarge ? '7.5px' : '10.5px')
      .attr('font-family', 'monospace')
      .attr('font-weight', 'bold')
      .style('pointer-events', 'none')
      .text((d) => d.weight);

    // Node ID label (outside, for small graphs)
    if (!isLarge) {
      nodeSelection
        .append('text')
        .attr('class', 'node-id')
        .attr('text-anchor', 'middle')
        .attr('dy', (d) => radiusScale(d.weight) + 11)
        .attr('fill', '#94a3b8')
        .attr('font-size', '9px')
        .attr('font-family', 'monospace')
        .style('pointer-events', 'none')
        .text((d) => `v${d.id}`);
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

    // Settle faster on larger sampled graphs
    sim.alphaDecay(isLarge ? 0.055 : 0.028);

    // Initial zoom fit
    const fitTimer = setTimeout(() => {
      fitGraphToContainer(450);
    }, 420);

    return () => {
      clearTimeout(fitTimer);
      sim.stop();
    };
  }, [graphData, mode, fitGraphToContainer]);

  // Effect 1b: ResizeObserver so the graph canvas adapts cleanly when viewport or grid column resizes
  useEffect(() => {
    const el = containerRef.current;
    if (!el || typeof ResizeObserver === 'undefined') return;

    let resizeTimer: ReturnType<typeof setTimeout> | null = null;
    const observer = new ResizeObserver(() => {
      if (resizeTimer) clearTimeout(resizeTimer);
      resizeTimer = setTimeout(() => {
        fitGraphToContainer(250);
      }, 120);
    });

    observer.observe(el);
    return () => {
      if (resizeTimer) clearTimeout(resizeTimer);
      observer.disconnect();
    };
  }, [fitGraphToContainer]);

  // Effect 2: In-place update of node colors, selections, and edge conflicts WITHOUT rebuilding DOM
  useEffect(() => {
    if (!nodeSelectionRef.current) return;

    nodeSelectionRef.current
      .select('circle')
      .attr('fill', (d: VisNode) => {
        const c = coloring[String(d.id)];
        return c !== undefined ? GRAPH_COLORS[c % GRAPH_COLORS.length] || '#00D4FF' : '#171730';
      })
      .attr('stroke', (d: VisNode) => {
        if (selectedVertex === d.id) return '#ffffff';
        if (highlightedVertices?.has(d.id)) return '#00D4FF';
        const c = coloring[String(d.id)];
        return c !== undefined ? 'rgba(255,255,255,0.45)' : '#334155';
      })
      .attr('stroke-width', (d: VisNode) => {
        if (selectedVertex === d.id) return 3.2;
        if (highlightedVertices?.has(d.id)) return 2.4;
        return 1.5;
      })
      .attr('filter', (d: VisNode) => {
        return coloring[String(d.id)] !== undefined ? 'url(#neonGlow)' : null;
      });

    // Update conflicting edges (adjacent vertices with same color)
    if (linkSelectionRef.current) {
      linkSelectionRef.current
        .attr('stroke', (d: any) => {
          const u = typeof d.source === 'object' ? d.source.id : d.source;
          const v = typeof d.target === 'object' ? d.target.id : d.target;
          const cu = coloring[String(u)];
          const cv = coloring[String(v)];
          if (cu !== undefined && cv !== undefined && cu === cv) {
            return '#FF6B6B';
          }
          return 'rgba(148, 163, 184, 0.14)';
        })
        .attr('stroke-width', (d: any) => {
          const u = typeof d.source === 'object' ? d.source.id : d.source;
          const v = typeof d.target === 'object' ? d.target.id : d.target;
          const cu = coloring[String(u)];
          const cv = coloring[String(v)];
          return cu !== undefined && cv !== undefined && cu === cv ? 2.5 : 0.85;
        });
    }
  }, [coloring, selectedVertex, highlightedVertices, graphData]);

  const handleZoomIn = () => {
    if (svgRef.current && zoomRef.current) {
      d3.select(svgRef.current).transition().call(zoomRef.current.scaleBy, 1.35);
    }
  };

  const handleZoomOut = () => {
    if (svgRef.current && zoomRef.current) {
      d3.select(svgRef.current).transition().call(zoomRef.current.scaleBy, 0.72);
    }
  };

  const handleResetZoom = () => {
    fitGraphToContainer(400);
  };

  if (!graphData) {
    return (
      <div className="w-full h-full min-h-[460px] flex flex-col items-center justify-center p-8 text-center bg-[#070716] rounded-2xl border border-white/10">
        <div className="w-12 h-12 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400 mb-3 text-xl font-mono">
          G(V,E)
        </div>
        <h3 className="text-white font-semibold text-sm mb-1">No Graph Instance Loaded</h3>
        <p className="text-slate-400 text-xs max-w-xs leading-relaxed">
          Select a demo preset, generate a synthetic instance, or import a research dataset from the left panel.
        </p>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className="relative w-full h-full min-h-[460px] overflow-hidden bg-[#070716] rounded-2xl border border-white/10"
    >
      <svg ref={svgRef} className="w-full h-full select-none" />

      {/* Top-Left Telemetry & Representative Sample Indicator */}
      <div className="absolute top-3.5 left-3.5 z-10 flex flex-col gap-1.5 max-w-[76%] pointer-events-none">
        {isSampled ? (
          <div className="bg-[#0b0b1e]/92 backdrop-blur-md border border-amber-500/35 rounded-xl px-3.5 py-2.5 shadow-lg pointer-events-auto">
            <div className="flex flex-wrap items-center gap-2 text-xs font-mono">
              <span className="w-2 h-2 rounded-full bg-amber-400 flex-shrink-0" />
              <span className="text-white font-semibold">
                {totalVertices.toLocaleString()} vertices loaded
              </span>
              <span className="text-slate-500">•</span>
              <span className="text-white font-semibold">
                {totalGraphEdges.toLocaleString()} edges loaded
              </span>
              <span className="text-slate-500">•</span>
              <span className="text-amber-300 font-semibold">
                Displaying representative sample: {displayedVertices.toLocaleString()} vertices
              </span>
            </div>
            <div className="text-xs text-slate-400 mt-1 flex flex-wrap items-center gap-x-3 gap-y-1">
              <span>
                Full Instance:{' '}
                <strong className="text-slate-200 font-mono">
                  {totalVertices.toLocaleString()}V / {totalGraphEdges.toLocaleString()}E
                </strong>{' '}
                (evaluated by MCTS &amp; Exact)
              </span>
              {onSampleLimitChange && (
                <span className="inline-flex items-center gap-1 text-[11px] font-mono bg-white/5 px-2 py-0.5 rounded-lg border border-white/10">
                  <span className="text-slate-400">Sample size:</span>
                  {[100, 250, 400].map((lim) => (
                    <button
                      key={lim}
                      type="button"
                      onClick={() => onSampleLimitChange(lim)}
                      className={`px-1.5 py-0.5 rounded transition-colors ${
                        sampleLimit === lim
                          ? 'bg-cyan-500/25 text-cyan-300 font-bold'
                          : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      {lim}V
                    </button>
                  ))}
                </span>
              )}
            </div>
          </div>
        ) : (
          <div className="bg-[#0b0b1e]/90 backdrop-blur-md border border-white/10 rounded-xl px-3.5 py-2 shadow-md">
            <div className="flex flex-wrap items-center gap-2 text-xs font-mono text-slate-300">
              <span className="w-2 h-2 rounded-full bg-emerald-400 flex-shrink-0" />
              <span>
                <strong className="text-white">{totalVertices.toLocaleString()}</strong> vertices loaded •{' '}
                <strong className="text-white">{totalGraphEdges.toLocaleString()}</strong> edges loaded
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Top-Right Zoom Controls */}
      <div className="absolute top-3.5 right-3.5 z-10 flex items-center gap-1 bg-[#0b0b1e]/92 backdrop-blur-md p-1.5 rounded-xl border border-white/10 shadow-lg">
        <button
          onClick={handleZoomIn}
          className="w-7 h-7 flex items-center justify-center text-slate-300 hover:text-white hover:bg-white/10 rounded-lg text-sm font-mono transition-colors"
          title="Zoom In"
        >
          +
        </button>
        <button
          onClick={handleZoomOut}
          className="w-7 h-7 flex items-center justify-center text-slate-300 hover:text-white hover:bg-white/10 rounded-lg text-sm font-mono transition-colors"
          title="Zoom Out"
        >
          −
        </button>
        <button
          onClick={handleResetZoom}
          className="px-2.5 h-7 flex items-center justify-center text-slate-300 hover:text-white hover:bg-white/10 rounded-lg text-xs font-mono transition-colors"
          title="Fit Subgraph to Viewport"
        >
          Fit
        </button>
      </div>

      {/* Bottom Status Bar: Coloring coverage & edge sampling note */}
      <div className="absolute bottom-3.5 left-3.5 right-3.5 z-10 flex flex-wrap items-center justify-between gap-2 pointer-events-none">
        {totalEdgesCount > MAX_SVG_EDGES ? (
          <div className="text-xs font-mono bg-[#0b0b1e]/90 backdrop-blur-md text-cyan-300 px-3 py-1.5 rounded-lg border border-cyan-500/25">
            Displaying {renderedEdgesCount.toLocaleString()} of {totalEdgesCount.toLocaleString()} induced subgraph edges
          </div>
        ) : (
          <div />
        )}

        {coloredCount > 0 && (
          <div className="text-xs font-mono bg-[#0b0b1e]/90 backdrop-blur-md text-emerald-300 px-3 py-1.5 rounded-lg border border-emerald-500/25">
            Active Solution Applied: {coloredCount.toLocaleString()} / {totalVertices.toLocaleString()} vertices colored
          </div>
        )}
      </div>
    </div>
  );
}

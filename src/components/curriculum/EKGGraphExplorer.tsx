"use client";

import React, { useState, useEffect } from "react";
import { Share2, RefreshCw, ZoomIn, Info } from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

interface EKGGraphExplorerProps {
  courseId?: string;
}

export const EKGGraphExplorer: React.FC<EKGGraphExplorerProps> = ({ courseId }) => {
  const [graphData, setGraphData] = useState<{ nodes: any[]; links: any[] }>({ nodes: [], links: [] });
  const [selectedNode, setSelectedNode] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);

  const fetchGraph = async () => {
    setIsLoading(true);
    try {
      const res = await fetch(`http://localhost:8000/api/ekg/${courseId || "default"}/full-graph`);
      if (res.ok) {
        const data = await res.json();
        setGraphData(data);
      }
    } catch (err) {
      console.warn("Using fallback client graph", err);
      const fallbackNodes = [
        { id: "c1", label: "CS8591: Computer Networks", type: "Course", val: 25 },
        { id: "u1", label: "Unit I: Application Layer", type: "Unit", val: 18 },
        { id: "u2", label: "Unit II: Transport Layer", type: "Unit", val: 18 },
        { id: "t1", label: "HTTP & Socket Programming", type: "Topic", val: 14, bloom: "Apply" },
        { id: "t2", label: "TCP Congestion Control", type: "Topic", val: 14, bloom: "Analyze" },
        { id: "p1", label: "Active Learning", type: "Pedagogy", val: 10 },
        { id: "p2", label: "Problem-Based Learning", type: "Pedagogy", val: 10 },
        { id: "exp1", label: "Lab Exp 1: Socket Client", type: "Experiment", val: 12 },
        { id: "co1", label: "CO1: Network Architecture", type: "CO", val: 12 }
      ];
      setGraphData({ nodes: fallbackNodes, links: [] });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchGraph();
  }, [courseId]);

  return (
    <div className="space-y-6">
      <Card className="border border-[var(--border-subtle)] bg-[var(--bg-card)]">
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-xl font-bold flex items-center gap-2 text-[var(--text-primary)]">
              <Share2 className="w-5 h-5 text-indigo-400" />
              Educational Knowledge Graph Explorer
            </CardTitle>
            <p className="text-xs text-[var(--text-secondary)] mt-1">
              Visualizes cross-connected relationships across Course, Units, Topics, Bloom levels, Pedagogies, Experiments, and COs.
            </p>
          </div>
          <Button onClick={fetchGraph} disabled={isLoading} className="bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold">
            {isLoading ? <RefreshCw className="w-4 h-4 animate-spin mr-1" /> : <RefreshCw className="w-4 h-4 mr-1" />}
            Refresh Graph
          </Button>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* Node Filter Legend */}
          <div className="flex items-center gap-3 text-xs flex-wrap p-3 rounded-xl bg-[var(--bg-hover)] border border-[var(--border-subtle)]">
            <span className="font-semibold text-[var(--text-muted)]">Node Types:</span>
            <span className="px-2 py-0.5 rounded bg-indigo-600 text-white font-bold">Course</span>
            <span className="px-2 py-0.5 rounded bg-blue-600 text-white font-bold">Unit</span>
            <span className="px-2 py-0.5 rounded bg-emerald-600 text-white font-bold">Topic</span>
            <span className="px-2 py-0.5 rounded bg-purple-600 text-white font-bold">Bloom</span>
            <span className="px-2 py-0.5 rounded bg-amber-600 text-white font-bold">Pedagogy</span>
            <span className="px-2 py-0.5 rounded bg-rose-600 text-white font-bold">Experiment</span>
          </div>

          {/* Interactive Graph Node Grid Canvas */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 min-h-[350px] p-6 rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-hover)]">
            {graphData.nodes.map((node) => {
              const bgColors: Record<string, string> = {
                Course: "bg-indigo-950/60 border-indigo-500 text-indigo-300",
                Unit: "bg-blue-950/60 border-blue-500 text-blue-300",
                Topic: "bg-emerald-950/60 border-emerald-500 text-emerald-300",
                Bloom: "bg-purple-950/60 border-purple-500 text-purple-300",
                Pedagogy: "bg-amber-950/60 border-amber-500 text-amber-300",
                Experiment: "bg-rose-950/60 border-rose-500 text-rose-300",
              };

              return (
                <div
                  key={node.id}
                  onClick={() => setSelectedNode(node)}
                  className={`cursor-pointer p-4 rounded-xl border transition-all transform hover:scale-105 shadow-md flex flex-col justify-between ${
                    bgColors[node.type] || "bg-slate-900 border-slate-700 text-slate-300"
                  }`}
                >
                  <div className="flex justify-between items-start">
                    <span className="text-[10px] font-mono font-bold uppercase tracking-wider opacity-80">{node.type}</span>
                    {node.bloom && <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-black/40">{node.bloom}</span>}
                  </div>
                  <h4 className="text-sm font-bold mt-2">{node.label}</h4>
                  <div className="text-[10px] opacity-60 mt-3 text-right">Click to inspect connections →</div>
                </div>
              );
            })}
          </div>

          {/* Selected Node Details Drawer */}
          {selectedNode && (
            <div className="p-4 rounded-xl border border-indigo-500/40 bg-indigo-950/30 text-xs space-y-2">
              <div className="flex justify-between items-center border-b border-indigo-500/20 pb-2">
                <span className="font-bold text-indigo-300 flex items-center gap-1.5"><Info className="w-4 h-4" /> Node Inspector</span>
                <button onClick={() => setSelectedNode(null)} className="text-[var(--text-muted)] hover:text-white">✕</button>
              </div>
              <div className="text-sm font-bold text-[var(--text-primary)]">{selectedNode.label}</div>
              <p className="text-[var(--text-secondary)]">Type: <strong className="text-indigo-400">{selectedNode.type}</strong></p>
              {selectedNode.bloom && <p className="text-[var(--text-secondary)]">Bloom Level: <strong className="text-purple-400">{selectedNode.bloom}</strong></p>}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

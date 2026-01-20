"use client";

import { useEffect, useState } from "react";

interface Stats {
  scannedHeight: number;
  chainTip: number;
  syncProgress: number;
}

interface ScannedBlock {
  height: number;
  hash: string;
  processedAt: string;
}

interface ArkRound {
  txid: string;
  aspId: string;
  blockHeight: number;
  timestamp: string;
  inputAmount: number;
  outputAmount: number;
  vtxoCount: number;
}

export default function Home() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [blocks, setBlocks] = useState<ScannedBlock[]>([]);
  const [rounds, setRounds] = useState<ArkRound[]>([]);

  const fetchData = async () => {
    try {
      const statsRes = await fetch("http://localhost:3002/watch/stats");
      const blocksRes = await fetch("http://localhost:3002/watch/blocks");
      const roundsRes = await fetch("http://localhost:3002/watch/rounds");

      if (statsRes.ok) setStats(await statsRes.json());
      if (blocksRes.ok) setBlocks(await blocksRes.json());
      if (roundsRes.ok) setRounds(await roundsRes.json());
    } catch (e) {
      console.error("Failed to fetch data:", e);
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 2000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen bg-gray-950 text-white overflow-x-hidden">
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-4xl font-bold mb-4 text-emerald-400">ArkWatch</h1>
        <p className="text-gray-400 mb-8">Protocol Auditor & Indexer</p>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          <div className="bg-gray-900 p-6 rounded-lg border border-gray-800">
            <h3 className="text-gray-500 text-sm uppercase tracking-wider mb-2">Sync Progress</h3>
            <div className="text-3xl font-mono text-white">
              {stats ? `${stats.syncProgress.toFixed(1)}%` : "0.0%"}
            </div>
            <div className="w-full bg-gray-800 h-2 mt-4 rounded-full overflow-hidden">
              <div
                className="bg-emerald-500 h-full transition-all duration-500"
                style={{ width: `${stats?.syncProgress || 0}%` }}
              />
            </div>
          </div>

          <div className="bg-gray-900 p-6 rounded-lg border border-gray-800">
            <h3 className="text-gray-500 text-sm uppercase tracking-wider mb-2">Chain Tip</h3>
            <div className="text-3xl font-mono text-white">
              {stats ? stats.chainTip.toLocaleString() : "-"}
            </div>
            <p className="text-xs text-gray-500 mt-2">Latest Bitcoin Block</p>
          </div>

          <div className="bg-gray-900 p-6 rounded-lg border border-gray-800">
            <h3 className="text-gray-500 text-sm uppercase tracking-wider mb-2">Scanned Height</h3>
            <div className="text-3xl font-mono text-white">
              {stats ? stats.scannedHeight.toLocaleString() : "-"}
            </div>
            <p className="text-xs text-gray-500 mt-2">ArkWatch Indexer Head</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Recent rounds */}
          <div>
            <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-purple-500"></span>
              Recent Ark Rounds
            </h2>
            <div className="bg-gray-900 rounded-lg border border-gray-800 overflow-hidden">
              <table className="w-full text-sm text-left opacity-90">
                <thead className="bg-gray-800 text-gray-400">
                  <tr>
                    <div className="px-4 py-3">Block</div>
                    <div className="px-4 py-3">TxID</div>
                    <div className="px-4 py-3 text-right">VTXOs</div>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-800">
                  {rounds.length === 0 ? (
                    <tr>
                      <div className="px-4 py-8 text-center text-gray-500">No Ark Rounds detected yet</div>
                    </tr>
                  ) : (
                    rounds.map((round) => (
                      <tr key={round.txid} className="hover:bg-gray-800/50 transition duration-150">
                        <div className="px-4 py-3 font-mono text-emerald-400">{round.blockHeight}</div>
                        <div className="px-4 py-3 font-mono text-xs text-gray-500 truncate max-w-[150px]" title={round.txid}>
                          {round.txid.substring(0, 16)}...
                        </div>
                        <div className="px-4 py-3 text-right font-mono">{round.vtxoCount}</div>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Recent Blocks */}
          <div>
            <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-blue-500"></span>
              Recent Scanned Blocks
            </h2>
            <div className="bg-gray-900 rounded-lg border border-gray-800 overflow-hidden">
              <table className="w-full text-sm text-left opacity-90">
                <thead className="bg-gray-800 text-gray-400">
                  <tr>
                    <div className="px-4 py-3">Height</div>
                    <div className="px-4 py-3">Hash</div>
                    <div className="px-4 py-3 text-right">Time</div>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-800">
                  {blocks.length === 0 ? (
                    <tr>
                      <div className="px-4 py-8 text-center text-gray-500">Waiting for blocks...</div>
                    </tr>
                  ) : (
                    blocks.map((block) => (
                      <tr key={block.height} className="hover:bg-gray-800/50 transition duration-150">
                        <div className="px-4 py-3 font-mono text-blue-400">{block.height}</div>
                        <div className="px-4 py-3 font-mono text-xs text-gray-500 truncate max-w-[150px]">
                          {block.hash.substring(0, 12)}...
                        </div>
                        <div className="px-4 py-3 text-right text-gray-500 text-xs">
                          {new Date(block.processedAt).toLocaleTimeString()}
                        </div>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

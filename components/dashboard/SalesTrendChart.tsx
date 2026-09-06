'use client';

import React, { useState } from 'react';
import { SalesTrendPoint } from '@/types/database';
import { formatINR } from '@/lib/utils/formatters';

interface SalesTrendChartProps {
  data: SalesTrendPoint[];
  totalSalesInPeriod: number;
  totalCollectedInPeriod: number;
}

export function SalesTrendChart({
  data,
  totalSalesInPeriod,
  totalCollectedInPeriod,
}: SalesTrendChartProps) {
  const [hoveredPoint, setHoveredPoint] = useState<SalesTrendPoint | null>(null);
  const [activeMetric, setActiveMetric] = useState<'both' | 'sales' | 'collected'>('both');

  if (!data || data.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-slate-200 p-5 min-h-[300px] flex items-center justify-center text-slate-400 text-xs">
        No sales records in selected period.
      </div>
    );
  }

  const maxSales = Math.max(...data.map((d) => d.sales), 10000);
  const maxCollected = Math.max(...data.map((d) => d.collected), 10000);
  const maxVal = Math.max(maxSales, maxCollected);

  const chartHeight = 200;
  const chartWidth = 600;
  const paddingX = 30;
  const paddingY = 20;

  const innerWidth = chartWidth - paddingX * 2;
  const innerHeight = chartHeight - paddingY * 2;

  const getX = (index: number) => {
    if (data.length <= 1) return paddingX + innerWidth / 2;
    return paddingX + (index / (data.length - 1)) * innerWidth;
  };

  const getY = (val: number) => {
    return chartHeight - paddingY - (val / maxVal) * innerHeight;
  };

  const salesPoints = data.map((d, i) => `${getX(i)},${getY(d.sales)}`).join(' ');
  const salesAreaPath = `M ${getX(0)},${chartHeight - paddingY} L ${salesPoints} L ${getX(
    data.length - 1
  )},${chartHeight - paddingY} Z`;

  const collectedPoints = data.map((d, i) => `${getX(i)},${getY(d.collected)}`).join(' ');
  const collectedAreaPath = `M ${getX(0)},${chartHeight - paddingY} L ${collectedPoints} L ${getX(
    data.length - 1
  )},${chartHeight - paddingY} Z`;

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-4 sm:p-5 shadow-2xs" id="sales-trend-card">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-sm sm:text-base font-bold text-slate-900">
              Sales & Collection Velocity
            </h2>
            <span className="text-[10px] font-semibold bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded border border-emerald-200">
              Dynamic Aggregation
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Real-time daily invoicing vs payment settlements in selected period
          </p>
        </div>

        <div className="flex items-center gap-1.5 p-1 bg-slate-100 rounded-lg border border-slate-200 text-xs self-start sm:self-auto">
          <button
            onClick={() => setActiveMetric('both')}
            className={`px-2.5 py-1 rounded font-semibold transition ${
              activeMetric === 'both' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            All
          </button>
          <button
            onClick={() => setActiveMetric('sales')}
            className={`px-2.5 py-1 rounded font-semibold transition flex items-center gap-1.5 ${
              activeMetric === 'sales' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-slate-800"></span>
            Sales
          </button>
          <button
            onClick={() => setActiveMetric('collected')}
            className={`px-2.5 py-1 rounded font-semibold transition flex items-center gap-1.5 ${
              activeMetric === 'collected' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
            Collected
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-4 p-3 bg-slate-50/80 rounded-lg border border-slate-100">
        <div>
          <span className="text-[10px] uppercase font-bold text-slate-400 block">Period Invoiced</span>
          <span className="text-sm sm:text-base font-bold text-slate-900 font-mono">
            {formatINR(totalSalesInPeriod)}
          </span>
        </div>
        <div>
          <span className="text-[10px] uppercase font-bold text-slate-400 block">Period Settled</span>
          <span className="text-sm sm:text-base font-bold text-emerald-700 font-mono">
            {formatINR(totalCollectedInPeriod)}
          </span>
        </div>
        <div className="hidden sm:block">
          <span className="text-[10px] uppercase font-bold text-slate-400 block">Reconciliation Ratio</span>
          <span className="text-sm sm:text-base font-bold text-slate-700 font-mono">
            {totalSalesInPeriod > 0 ? `${Math.round((totalCollectedInPeriod / totalSalesInPeriod) * 100)}%` : '100%'}
          </span>
        </div>
      </div>

      <div className="relative w-full overflow-hidden">
        <svg
          viewBox={`0 0 ${chartWidth} ${chartHeight}`}
          className="w-full h-48 sm:h-56 overflow-visible"
          preserveAspectRatio="none"
        >
          <defs>
            <linearGradient id="salesGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#334155" stopOpacity="0.18" />
              <stop offset="100%" stopColor="#334155" stopOpacity="0.0" />
            </linearGradient>
            <linearGradient id="collectedGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#10b981" stopOpacity="0.25" />
              <stop offset="100%" stopColor="#10b981" stopOpacity="0.0" />
            </linearGradient>
          </defs>

          <line
            x1={paddingX}
            y1={paddingY}
            x2={chartWidth - paddingX}
            y2={paddingY}
            stroke="#e2e8f0"
            strokeDasharray="4 4"
          />
          <line
            x1={paddingX}
            y1={paddingY + innerHeight / 2}
            x2={chartWidth - paddingX}
            y2={paddingY + innerHeight / 2}
            stroke="#e2e8f0"
            strokeDasharray="4 4"
          />
          <line
            x1={paddingX}
            y1={chartHeight - paddingY}
            x2={chartWidth - paddingX}
            y2={chartHeight - paddingY}
            stroke="#cbd5e1"
            strokeWidth="1.5"
          />

          {(activeMetric === 'both' || activeMetric === 'sales') && (
            <>
              <path d={salesAreaPath} fill="url(#salesGrad)" />
              <polyline
                fill="none"
                stroke="#1e293b"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                points={salesPoints}
              />
            </>
          )}

          {(activeMetric === 'both' || activeMetric === 'collected') && (
            <>
              <path d={collectedAreaPath} fill="url(#collectedGrad)" />
              <polyline
                fill="none"
                stroke="#10b981"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                points={collectedPoints}
              />
            </>
          )}

          {data.map((d, i) => {
            const cx = getX(i);
            const cySales = getY(d.sales);
            const cyCollected = getY(d.collected);
            const isHovered = hoveredPoint?.date === d.date;

            return (
              <g
                key={d.date}
                className="cursor-pointer"
                onMouseEnter={() => setHoveredPoint(d)}
                onMouseLeave={() => setHoveredPoint(null)}
              >
                {isHovered && (
                  <line
                    x1={cx}
                    y1={paddingY}
                    x2={cx}
                    y2={chartHeight - paddingY}
                    stroke="#94a3b8"
                    strokeWidth="1.5"
                    strokeDasharray="3 3"
                  />
                )}

                {(activeMetric === 'both' || activeMetric === 'sales') && (
                  <circle
                    cx={cx}
                    cy={cySales}
                    r={isHovered ? 5 : 3.5}
                    fill="#1e293b"
                    stroke="#ffffff"
                    strokeWidth="2"
                    className="transition-all"
                  />
                )}

                {(activeMetric === 'both' || activeMetric === 'collected') && (
                  <circle
                    cx={cx}
                    cy={cyCollected}
                    r={isHovered ? 5 : 3.5}
                    fill="#10b981"
                    stroke="#ffffff"
                    strokeWidth="2"
                    className="transition-all"
                  />
                )}

                <rect
                  x={cx - 15}
                  y={0}
                  width={30}
                  height={chartHeight}
                  fill="transparent"
                />
              </g>
            );
          })}
        </svg>

        {hoveredPoint && (
          <div
            className="absolute top-2 left-1/2 -translate-x-1/2 bg-slate-900 text-white rounded-lg px-3 py-2 text-xs shadow-xl z-20 pointer-events-none animate-in fade-in duration-100 border border-slate-700"
            id="chart-hover-tooltip"
          >
            <div className="font-bold border-b border-slate-700 pb-1 mb-1 text-slate-300 flex items-center justify-between gap-4">
              <span>{hoveredPoint.label}</span>
              <span className="text-[10px] text-slate-400 font-mono">
                {hoveredPoint.invoiceCount} invoices
              </span>
            </div>
            <div className="space-y-1 font-mono">
              <div className="flex items-center justify-between gap-3 text-slate-300">
                <span className="flex items-center gap-1.5 text-slate-400">
                  <span className="w-2 h-2 rounded-full bg-slate-400"></span>
                  Sales:
                </span>
                <span className="font-bold">{formatINR(hoveredPoint.sales)}</span>
              </div>
              <div className="flex items-center justify-between gap-3 text-emerald-400">
                <span className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
                  Collected:
                </span>
                <span className="font-bold">{formatINR(hoveredPoint.collected)}</span>
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="flex items-center justify-between text-[11px] font-medium text-slate-400 pt-2 border-t border-slate-100">
        <span>{data[0]?.label || ''}</span>
        {data.length > 3 && <span>{data[Math.floor(data.length / 2)]?.label || ''}</span>}
        <span>{data[data.length - 1]?.label || ''}</span>
      </div>
    </div>
  );
}

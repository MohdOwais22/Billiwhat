'use client';

import React, { useState, useMemo } from 'react';
import {
  Package,
  Search,
  Plus,
  Filter,
  SlidersHorizontal,
  Edit3,
  Trash2,
  AlertTriangle,
  CheckCircle2,
  ArrowUpDown,
  Download,
  FileSpreadsheet,
  AlertCircle,
  Eye,
  Layers,
  ArrowUpRight,
  TrendingUp,
  Tag,
  Hash,
  Boxes,
} from 'lucide-react';
import { useDashboard } from '@/context/DashboardContext';
import { Product } from '@/types/database';
import { formatINR } from '@/lib/utils/formatters';
import { deleteProduct } from '@/lib/services/dashboardService';
import { AddProductModal } from '@/components/modals/AddProductModal';
import { EditProductModal } from '@/components/products/EditProductModal';
import { StockAdjustModal } from '@/components/products/StockAdjustModal';
import { ProductDetailModal } from '@/components/products/ProductDetailModal';

type FilterTab = 'all' | 'active' | 'inactive' | 'low_stock' | 'out_of_stock';
type SortOption = 'name_asc' | 'name_desc' | 'stock_asc' | 'stock_desc' | 'price_desc' | 'price_asc' | 'newest';

export function ProductsPage() {
  const {
    dashboardData,
    isLoading,
    loadData,
    isAddProductOpen,
    setIsAddProductOpen,
    setSelectedInvoice,
    setIsInvoiceDetailOpen,
  } = useDashboard();

  if (isLoading && !dashboardData) {
    return (
      <div className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto space-y-6 animate-pulse" id="products-loading-skeleton">
        <div className="h-8 bg-slate-200 rounded-lg w-1/4"></div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-28 bg-slate-200 rounded-xl"></div>
          ))}
        </div>
        <div className="h-64 bg-slate-200 rounded-xl"></div>
      </div>
    );
  }

  // Search & Filter State
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState<FilterTab>('all');
  const [sortBy, setSortBy] = useState<SortOption>('name_asc');

  // Modal State
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [adjustingProduct, setAdjustingProduct] = useState<Product | null>(null);
  const [isAdjustModalOpen, setIsAdjustModalOpen] = useState(false);

  // Deletion & Notice State
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [actionNotice, setActionNotice] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const rawProducts = dashboardData?.products || [];

  // Summary Metrics calculated directly from real Supabase data
  const summaryMetrics = useMemo(() => {
    let totalProducts = rawProducts.length;
    let activeProducts = 0;
    let lowStockCount = 0;
    let outOfStockCount = 0;
    let totalStockUnits = 0;
    let totalStockAtCost = 0;
    let itemsWithCostCount = 0;

    rawProducts.forEach((p) => {
      const stock = Number(p.stock_quantity) || 0;
      const threshold = Number(p.low_stock_threshold) || 10;
      const purchasePrice = Number(p.purchase_price) || 0;

      if (p.is_active) activeProducts += 1;
      totalStockUnits += stock;

      if (stock > 0 && purchasePrice > 0) {
        totalStockAtCost += stock * purchasePrice;
        itemsWithCostCount += 1;
      }

      if (stock <= 0) {
        outOfStockCount += 1;
      } else if (stock <= threshold) {
        lowStockCount += 1;
      }
    });

    return {
      totalProducts,
      activeProducts,
      lowStockCount,
      outOfStockCount,
      totalStockUnits,
      totalStockAtCost,
      itemsWithCostCount,
    };
  }, [rawProducts]);

  // Filter & Sort Logic
  const filteredProducts = useMemo(() => {
    return rawProducts.filter((product) => {
      const name = (product.name || '').toLowerCase();
      const sku = (product.sku || '').toLowerCase();
      const barcode = (product.barcode || '').toLowerCase();
      const hsn = (product.hsn_sac || '').toLowerCase();
      const unit = (product.unit || '').toLowerCase();
      const search = searchTerm.toLowerCase().trim();

      const matchesSearch =
        !search ||
        name.includes(search) ||
        sku.includes(search) ||
        barcode.includes(search) ||
        hsn.includes(search) ||
        unit.includes(search);

      if (!matchesSearch) return false;

      const stock = Number(product.stock_quantity) || 0;
      const threshold = Number(product.low_stock_threshold) || 10;

      if (activeTab === 'active') return product.is_active;
      if (activeTab === 'inactive') return !product.is_active;
      if (activeTab === 'low_stock') return stock <= threshold && stock > 0;
      if (activeTab === 'out_of_stock') return stock <= 0;

      return true;
    });
  }, [rawProducts, searchTerm, activeTab]);

  const sortedProducts = useMemo(() => {
    return [...filteredProducts].sort((a, b) => {
      const stockA = Number(a.stock_quantity) || 0;
      const stockB = Number(b.stock_quantity) || 0;
      const priceA = Number(a.selling_price) || 0;
      const priceB = Number(b.selling_price) || 0;
      const nameA = a.name.toLowerCase();
      const nameB = b.name.toLowerCase();

      switch (sortBy) {
        case 'name_asc':
          return nameA.localeCompare(nameB);
        case 'name_desc':
          return nameB.localeCompare(nameA);
        case 'stock_asc':
          return stockA - stockB;
        case 'stock_desc':
          return stockB - stockA;
        case 'price_desc':
          return priceB - priceA;
        case 'price_asc':
          return priceA - priceB;
        case 'newest':
          return new Date(b.created_at || '').getTime() - new Date(a.created_at || '').getTime();
        default:
          return 0;
      }
    });
  }, [filteredProducts, sortBy]);

  // Handle Safe Product Deletion
  const handleDelete = async (prod: Product) => {
    const confirmMsg = `Are you sure you want to remove "${prod.name}" from your product catalog?`;
    if (!window.confirm(confirmMsg)) return;

    try {
      setDeletingId(prod.id);
      const res = await deleteProduct(prod.id);
      setActionNotice({
        type: 'success',
        message: res.message || 'Product catalog updated.',
      });
      await loadData();
    } catch (err: any) {
      setActionNotice({
        type: 'error',
        message: err.message || 'Failed to delete product.',
      });
    } finally {
      setDeletingId(null);
    }
  };

  // Export CSV
  const handleExportCSV = () => {
    if (sortedProducts.length === 0) return;

    const headers = [
      'Product Name',
      'SKU',
      'Barcode',
      'HSN/SAC',
      'Unit',
      'Selling Price (INR)',
      'Purchase Price (INR)',
      'GST Rate (%)',
      'Stock Quantity',
      'Low Stock Threshold',
      'Status',
    ];

    const rows = sortedProducts.map((p) => [
      `"${p.name.replace(/"/g, '""')}"`,
      `"${(p.sku || '').replace(/"/g, '""')}"`,
      `"${(p.barcode || '').replace(/"/g, '""')}"`,
      `"${(p.hsn_sac || '').replace(/"/g, '""')}"`,
      `"${p.unit || 'PCS'}"`,
      p.selling_price || 0,
      p.purchase_price || 0,
      p.tax_rate ?? 18,
      p.stock_quantity || 0,
      p.low_stock_threshold || 10,
      p.is_active ? 'Active' : 'Inactive',
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `whatsBill_inventory_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto space-y-6" id="products-inventory-page">
      {/* Action Notice Alert */}
      {actionNotice && (
        <div
          className={`p-4 rounded-xl border flex items-center justify-between animate-in fade-in duration-200 ${
            actionNotice.type === 'success'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
              : 'bg-rose-50 border-rose-200 text-rose-900'
          }`}
        >
          <div className="flex items-center gap-2.5 text-xs font-semibold">
            {actionNotice.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            )}
            <span>{actionNotice.message}</span>
          </div>
          <button
            onClick={() => setActionNotice(null)}
            className="text-xs font-bold opacity-60 hover:opacity-100 transition cursor-pointer"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black tracking-tight text-slate-900 flex items-center gap-2.5">
            <Package className="w-6 h-6 text-amber-600" />
            <span>Products & Inventory</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Manage your item catalog, HSN codes, GST tax slabs, and real-time stock levels.
          </p>
        </div>

        <div className="flex items-center gap-2.5 shrink-0">
          <button
            onClick={handleExportCSV}
            disabled={sortedProducts.length === 0}
            className="inline-flex items-center gap-2 px-3.5 py-2.5 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold border border-slate-200 rounded-xl transition shadow-2xs hover:border-slate-300 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
            title="Export products to CSV spreadsheet"
          >
            <Download className="w-4 h-4 text-slate-500" />
            <span>Export CSV</span>
          </button>

          <button
            onClick={() => setIsAddProductOpen(true)}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold rounded-xl shadow-xs hover:shadow-md transition cursor-pointer"
            id="primary-add-product-cta"
          >
            <Plus className="w-4 h-4 stroke-[3]" />
            <span>+ Add Product</span>
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/90 shadow-2xs">
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Catalog Items</p>
            <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center text-slate-600">
              <Boxes className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-black font-mono text-slate-900 mt-2">
            {summaryMetrics.totalProducts}
          </p>
          <p className="text-xs text-slate-500 mt-1">Registered products & SKUs</p>
        </div>

        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/90 shadow-2xs">
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Active Items</p>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 flex items-center justify-center text-emerald-600">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-black font-mono text-emerald-700 mt-2">
            {summaryMetrics.activeProducts}
          </p>
          <p className="text-xs text-slate-500 mt-1">Available for B2B billing</p>
        </div>

        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/90 shadow-2xs">
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Low & Out of Stock</p>
            <div className="w-8 h-8 rounded-lg bg-amber-50 flex items-center justify-center text-amber-600">
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-black font-mono text-amber-700 mt-2">
            {summaryMetrics.lowStockCount}
          </p>
          <p className="text-xs text-slate-500 mt-1">
            {summaryMetrics.outOfStockCount > 0
              ? `${summaryMetrics.outOfStockCount} out of stock`
              : 'At or below threshold'}
          </p>
        </div>

        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/90 shadow-2xs">
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Stock Units</p>
            <div className="w-8 h-8 rounded-lg bg-amber-50 flex items-center justify-center text-amber-600">
              <Package className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-black font-mono text-slate-900 mt-2">
            {summaryMetrics.totalStockUnits.toLocaleString('en-IN')}
          </p>
          <p className="text-xs text-slate-500 mt-1">Units currently on-hand</p>
        </div>
      </div>

      {/* Control Bar: Search, Filters & Sorting */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs space-y-3">
        <div className="flex flex-col md:flex-row gap-3 items-center justify-between">
          {/* Search Box */}
          <div className="relative w-full md:w-80">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by name, SKU, barcode, HSN..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-xs border border-slate-200 rounded-xl bg-slate-50/70 text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 placeholder:text-slate-400"
              id="product-search-input"
            />
          </div>

          {/* Sort Selector */}
          <div className="flex items-center gap-2 w-full md:w-auto justify-end">
            <label className="text-xs text-slate-500 font-semibold shrink-0 flex items-center gap-1">
              <ArrowUpDown className="w-3.5 h-3.5" />
              <span>Sort:</span>
            </label>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as SortOption)}
              className="px-3 py-1.5 text-xs font-medium border border-slate-200 rounded-xl bg-slate-50 text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 cursor-pointer"
            >
              <option value="name_asc">Name (A &rarr; Z)</option>
              <option value="name_desc">Name (Z &rarr; A)</option>
              <option value="stock_asc">Stock (Low &rarr; High)</option>
              <option value="stock_desc">Stock (High &rarr; Low)</option>
              <option value="price_desc">Price (High &rarr; Low)</option>
              <option value="price_asc">Price (Low &rarr; High)</option>
              <option value="newest">Recently Added</option>
            </select>
          </div>
        </div>

        {/* Filter Tabs */}
        <div className="flex flex-wrap gap-1.5 pt-2 border-t border-slate-100">
          <button
            onClick={() => setActiveTab('all')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
              activeTab === 'all'
                ? 'bg-slate-900 text-white shadow-2xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200/70'
            }`}
          >
            All Products ({summaryMetrics.totalProducts})
          </button>
          <button
            onClick={() => setActiveTab('active')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
              activeTab === 'active'
                ? 'bg-emerald-600 text-white shadow-2xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200/70'
            }`}
          >
            Active ({summaryMetrics.activeProducts})
          </button>
          <button
            onClick={() => setActiveTab('low_stock')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
              activeTab === 'low_stock'
                ? 'bg-amber-600 text-white shadow-2xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200/70'
            }`}
          >
            Low Stock ({rawProducts.filter((p) => Number(p.stock_quantity) <= (p.low_stock_threshold || 10) && Number(p.stock_quantity) > 0).length})
          </button>
          <button
            onClick={() => setActiveTab('out_of_stock')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
              activeTab === 'out_of_stock'
                ? 'bg-rose-600 text-white shadow-2xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200/70'
            }`}
          >
            Out of Stock ({summaryMetrics.outOfStockCount})
          </button>
          <button
            onClick={() => setActiveTab('inactive')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
              activeTab === 'inactive'
                ? 'bg-slate-600 text-white shadow-2xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200/70'
            }`}
          >
            Inactive ({summaryMetrics.totalProducts - summaryMetrics.activeProducts})
          </button>
        </div>
      </div>

      {/* Product Catalog Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
        {sortedProducts.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider text-[11px]">
                  <th className="py-3.5 px-4">Product / Item</th>
                  <th className="py-3.5 px-3">HSN/SAC</th>
                  <th className="py-3.5 px-3">Unit</th>
                  <th className="py-3.5 px-3 text-right">Selling Price</th>
                  <th className="py-3.5 px-3 text-right">Cost Price</th>
                  <th className="py-3.5 px-3 text-center">GST Rate</th>
                  <th className="py-3.5 px-4 text-right">Stock Level</th>
                  <th className="py-3.5 px-3 text-center">Status</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-800">
                {sortedProducts.map((product) => {
                  const stock = Number(product.stock_quantity) || 0;
                  const threshold = Number(product.low_stock_threshold) || 10;
                  const isOutOfStock = stock <= 0;
                  const isLow = !isOutOfStock && stock <= threshold;
                  const sellingPrice = Number(product.selling_price) || 0;
                  const purchasePrice = Number(product.purchase_price) || 0;

                  return (
                    <tr
                      key={product.id}
                      className="hover:bg-amber-50/30 transition group"
                    >
                      {/* Product Name & SKU */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-xl bg-amber-500/10 text-amber-700 flex items-center justify-center font-bold shrink-0">
                            <Package className="w-4 h-4" />
                          </div>
                          <div className="min-w-0">
                            <button
                              onClick={() => {
                                setSelectedProduct(product);
                                setIsDetailModalOpen(true);
                              }}
                              className="font-bold text-slate-900 hover:text-amber-700 text-left line-clamp-1 cursor-pointer"
                            >
                              {product.name}
                            </button>
                            <div className="flex items-center gap-2 mt-0.5 text-[11px] text-slate-400">
                              {product.sku && (
                                <span className="font-mono text-slate-600 font-semibold bg-slate-100 px-1 rounded">
                                  {product.sku}
                                </span>
                              )}
                              {product.barcode && (
                                <span className="font-mono text-slate-500">
                                  {product.barcode}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* HSN / SAC */}
                      <td className="py-3.5 px-3 font-mono text-slate-600 font-medium">
                        {product.hsn_sac || '—'}
                      </td>

                      {/* Measurement Unit */}
                      <td className="py-3.5 px-3 font-medium text-slate-700">
                        {product.unit || 'PCS'}
                      </td>

                      {/* Selling Price */}
                      <td className="py-3.5 px-3 text-right font-mono font-bold text-slate-900">
                        {formatINR(sellingPrice)}
                      </td>

                      {/* Purchase Price */}
                      <td className="py-3.5 px-3 text-right font-mono text-slate-500">
                        {purchasePrice > 0 ? formatINR(purchasePrice) : '—'}
                      </td>

                      {/* GST Tax Rate */}
                      <td className="py-3.5 px-3 text-center">
                        <span className="inline-block font-semibold px-2 py-0.5 bg-slate-100 text-slate-700 rounded-md text-[11px]">
                          {product.tax_rate ?? 18}%
                        </span>
                      </td>

                      {/* Current Stock */}
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex flex-col items-end">
                          <span
                            className={`font-mono font-bold text-sm ${
                              isOutOfStock
                                ? 'text-rose-600'
                                : isLow
                                ? 'text-amber-600'
                                : 'text-slate-900'
                            }`}
                          >
                            {stock.toLocaleString('en-IN')} {product.unit || 'PCS'}
                          </span>
                          {isOutOfStock ? (
                            <span className="inline-flex items-center gap-1 text-[10px] font-bold text-rose-600 bg-rose-50 px-1.5 py-0.2 rounded mt-0.5 border border-rose-200">
                              Out of Stock
                            </span>
                          ) : isLow ? (
                            <span className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-700 bg-amber-50 px-1.5 py-0.2 rounded mt-0.5 border border-amber-200">
                              Low Stock (&le;{threshold})
                            </span>
                          ) : (
                            <span className="text-[10px] text-slate-400 font-medium mt-0.5">
                              Alert at &le;{threshold}
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Status */}
                      <td className="py-3.5 px-3 text-center">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            product.is_active
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : 'bg-slate-100 text-slate-500 border border-slate-200'
                          }`}
                        >
                          {product.is_active ? 'Active' : 'Inactive'}
                        </span>
                      </td>

                      {/* Action Buttons */}
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => {
                              setSelectedProduct(product);
                              setIsDetailModalOpen(true);
                            }}
                            className="p-1.5 text-slate-500 hover:text-amber-700 hover:bg-amber-50 rounded-lg transition cursor-pointer"
                            title="View Product Details & Sales Usage"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => {
                              setAdjustingProduct(product);
                              setIsAdjustModalOpen(true);
                            }}
                            className="p-1.5 text-slate-500 hover:text-amber-700 hover:bg-amber-50 rounded-lg transition cursor-pointer"
                            title="Adjust Stock Quantity"
                          >
                            <SlidersHorizontal className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => {
                              setEditingProduct(product);
                              setIsEditModalOpen(true);
                            }}
                            className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition cursor-pointer"
                            title="Edit Product Details"
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(product)}
                            disabled={deletingId === product.id}
                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition disabled:opacity-30 cursor-pointer"
                            title="Delete or Archive Product"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="py-16 px-6 text-center">
            <div className="w-14 h-14 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center mx-auto mb-3">
              <Package className="w-7 h-7" />
            </div>
            <h3 className="text-sm font-bold text-slate-900">No Products Found</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1 mb-4">
              {searchTerm || activeTab !== 'all'
                ? 'No items match your active search or filter criteria. Try resetting your search or filter.'
                : 'Your catalog is empty. Add your first product to generate GST invoices with automatic line item details.'}
            </p>
            {searchTerm || activeTab !== 'all' ? (
              <button
                onClick={() => {
                  setSearchTerm('');
                  setActiveTab('all');
                }}
                className="px-4 py-2 text-xs font-bold text-amber-700 bg-amber-50 hover:bg-amber-100 rounded-xl transition cursor-pointer"
              >
                Clear Search & Filters
              </button>
            ) : (
              <button
                onClick={() => setIsAddProductOpen(true)}
                className="inline-flex items-center gap-2 px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold rounded-xl shadow-xs transition cursor-pointer"
              >
                <Plus className="w-4 h-4 stroke-[3]" />
                <span>+ Add First Product</span>
              </button>
            )}
          </div>
        )}
      </div>

      {/* Modals */}
      <AddProductModal
        isOpen={isAddProductOpen}
        onClose={() => setIsAddProductOpen(false)}
        onSuccess={loadData}
      />

      <EditProductModal
        product={editingProduct}
        isOpen={isEditModalOpen}
        onClose={() => {
          setIsEditModalOpen(false);
          setEditingProduct(null);
        }}
        onSuccess={loadData}
      />

      <StockAdjustModal
        product={adjustingProduct}
        isOpen={isAdjustModalOpen}
        onClose={() => {
          setIsAdjustModalOpen(false);
          setAdjustingProduct(null);
        }}
        onSuccess={loadData}
      />

      <ProductDetailModal
        product={selectedProduct}
        isOpen={isDetailModalOpen}
        onClose={() => {
          setIsDetailModalOpen(false);
          setSelectedProduct(null);
        }}
        onEditProduct={(prod) => {
          setEditingProduct(prod);
          setIsEditModalOpen(true);
        }}
        onAdjustStock={(prod) => {
          setAdjustingProduct(prod);
          setIsAdjustModalOpen(true);
        }}
        onSelectInvoice={(invId) => {
          const inv = dashboardData?.recentInvoices.find((i) => i.id === invId);
          if (inv) {
            setSelectedInvoice(inv);
            setIsInvoiceDetailOpen(true);
          }
        }}
      />
    </div>
  );
}

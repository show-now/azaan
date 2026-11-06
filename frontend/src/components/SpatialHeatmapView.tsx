import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import {
  MapPin,
  Layers,
  AlertTriangle,
  TrendingUp,
  Clock,
  ShieldAlert,
  ChevronRight,
  Info,
  Filter,
  Maximize2,
  Compass,
} from 'lucide-react';
import { fetchSpatialHeatmap, fetchMetadata } from '../api';
import {
  SpatialHeatmapResponse,
  StateSpatialMetric,
  ProjectSpatialMarker,
  RegionalSpatialCluster,
} from '../types';

export const SpatialHeatmapView: React.FC = () => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const stateLayerGroupRef = useRef<L.LayerGroup | null>(null);
  const projectLayerGroupRef = useRef<L.LayerGroup | null>(null);

  const [loading, setLoading] = useState<boolean>(true);
  const [data, setData] = useState<SpatialHeatmapResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [selectedState, setSelectedState] = useState<string>('All');
  const [selectedSector, setSelectedSector] = useState<string>('All');
  const [selectedRiskTier, setSelectedRiskTier] = useState<string>('All');
  const [activeLayer, setActiveLayer] = useState<'both' | 'states' | 'projects'>('both');

  // Metadata
  const [availableSectors, setAvailableSectors] = useState<string[]>([]);
  const [availableStates, setAvailableStates] = useState<string[]>([]);

  // Selected details
  const [inspectedState, setInspectedState] = useState<StateSpatialMetric | null>(null);
  const [inspectedProject, setInspectedProject] = useState<ProjectSpatialMarker | null>(null);
  const [activeCluster, setActiveCluster] = useState<RegionalSpatialCluster | null>(null);

  // Load Metadata
  useEffect(() => {
    fetchMetadata()
      .then((meta) => {
        setAvailableSectors(meta.sectors || []);
        setAvailableStates(meta.states || []);
      })
      .catch((err) => console.error('Failed to load metadata:', err));
  }, []);

  // Fetch Spatial Data
  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetchSpatialHeatmap({
        state: selectedState,
        sector: selectedSector,
        min_risk_level: selectedRiskTier,
      });
      setData(res);
      if (res.state_metrics && res.state_metrics.length > 0) {
        if (!inspectedState) {
          setInspectedState(res.state_metrics[0]);
        }
      }
      if (res.regional_clusters && res.regional_clusters.length > 0 && !activeCluster) {
        setActiveCluster(res.regional_clusters[0]);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error fetching spatial data';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [selectedState, selectedSector, selectedRiskTier]);

  // Initialize Leaflet Map
  useEffect(() => {
    if (!mapContainerRef.current) return;

    if (!mapInstanceRef.current) {
      // Center of India: ~21.5° N, 80° E
      const map = L.map(mapContainerRef.current, {
        center: [22.3, 79.5],
        zoom: 4.8,
        minZoom: 4,
        maxZoom: 10,
        zoomControl: false,
      });

      L.control.zoom({ position: 'topright' }).addTo(map);

      // Clean, professional CartoDB Positron basemap tiles (accessible, neutral light theme)
      L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
        attribution: '&copy; OpenStreetMap contributors &copy; CARTO',
        subdomains: 'abcd',
        maxZoom: 19,
      }).addTo(map);

      stateLayerGroupRef.current = L.layerGroup().addTo(map);
      projectLayerGroupRef.current = L.layerGroup().addTo(map);

      mapInstanceRef.current = map;
    }

    return () => {
      // Clean up on component unmount
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  // Sync Data Layers on Map
  useEffect(() => {
    if (!mapInstanceRef.current || !data) return;

    const map = mapInstanceRef.current;
    const stateGroup = stateLayerGroupRef.current;
    const projGroup = projectLayerGroupRef.current;

    if (stateGroup) stateGroup.clearLayers();
    if (projGroup) projGroup.clearLayers();

    // 1. Render State Risk Hubs (Heatmap Circles)
    if (stateGroup && (activeLayer === 'both' || activeLayer === 'states')) {
      data.state_metrics.forEach((st) => {
        // Color based on risk tier
        const circleColor =
          st.risk_tier === 'Critical'
            ? '#ef4444' // red-500
            : st.risk_tier === 'Medium'
            ? '#f59e0b' // amber-500
            : '#10b981'; // emerald-500

        // Radius scales with project count & sanctioned outlay
        const radius = Math.min(Math.max(st.project_count * 550, 40000), 120000);

        const circle = L.circle([st.lat, st.lng], {
          radius: radius,
          color: circleColor,
          fillColor: circleColor,
          fillOpacity: 0.22,
          weight: 2,
        });

        // Hover tooltip
        circle.bindTooltip(
          `
          <div style="font-family: system-ui, sans-serif; font-size: 12px; line-height: 1.4; padding: 4px;">
            <div style="font-weight: 700; color: #1e293b; font-size: 13px;">${st.state}</div>
            <div style="color: #64748b; font-size: 11px;">Terrain: ${st.terrain}</div>
            <hr style="margin: 4px 0; border: none; border-top: 1px solid #e2e8f0;"/>
            <div><strong>Risk Score:</strong> <span style="color: ${circleColor}; font-weight: 700;">${st.risk_score} (${st.risk_tier})</span></div>
            <div><strong>Projects Monitored:</strong> ${st.project_count} (${st.flagged_pct}% flagged)</div>
            <div><strong>Avg Overrun:</strong> +${st.avg_overrun_pct}% | <strong>Avg Delay:</strong> ${st.avg_delay_months} Mo</div>
          </div>
          `,
          { direction: 'top', sticky: true, className: 'leaflet-custom-tooltip' }
        );

        circle.on('click', () => {
          setInspectedState(st);
          setInspectedProject(null);
          map.flyTo([st.lat, st.lng], 6.5, { duration: 1.2 });
        });

        circle.addTo(stateGroup);

        // Marker center label
        const labelIcon = L.divIcon({
          className: 'custom-state-label',
          html: `
            <div style="
              background: white;
              border: 1.5px solid ${circleColor};
              border-radius: 9999px;
              padding: 2px 7px;
              font-size: 10px;
              font-weight: 700;
              color: #1e293b;
              box-shadow: 0 1px 4px rgba(0,0,0,0.15);
              white-space: nowrap;
              transform: translate(-50%, -50%);
            ">
              ${st.state.split(' ')[0]} &bull; ${st.risk_score}
            </div>
          `,
          iconSize: [0, 0],
        });

        L.marker([st.lat, st.lng], { icon: labelIcon, interactive: false }).addTo(stateGroup);
      });
    }

    // 2. Render Individual Project Pins
    if (projGroup && (activeLayer === 'both' || activeLayer === 'projects')) {
      data.project_markers.forEach((proj) => {
        const pinColor =
          proj.risk_tier === 'Critical'
            ? '#dc2626'
            : proj.risk_tier === 'Medium'
            ? '#d97706'
            : '#059669';

        const markerIcon = L.divIcon({
          className: 'custom-project-pin',
          html: `
            <div style="
              width: 12px;
              height: 12px;
              border-radius: 50%;
              background-color: ${pinColor};
              border: 2px solid white;
              box-shadow: 0 0 6px ${pinColor}99;
              cursor: pointer;
              transition: transform 0.2s ease;
            "></div>
          `,
          iconSize: [12, 12],
          iconAnchor: [6, 6],
        });

        const marker = L.marker([proj.lat, proj.lng], { icon: markerIcon });

        marker.bindTooltip(
          `
          <div style="font-family: system-ui, sans-serif; font-size: 11px; line-height: 1.35; padding: 2px;">
            <div style="font-weight: 700; color: #0f172a;">${proj.project_name}</div>
            <div style="color: #64748b;">${proj.sector} &bull; ${proj.state}</div>
            <hr style="margin: 3px 0; border: none; border-top: 1px solid #e2e8f0;"/>
            <div><strong>Cost Outlay:</strong> ₹${proj.original_cost.toLocaleString()} Cr</div>
            <div><strong>Physical Progress:</strong> ${proj.physical_progress_pct}%</div>
            <div><strong>Predicted Overrun:</strong> <span style="color: ${pinColor}; font-weight: 700;">+${proj.cost_overrun_pct}%</span></div>
            <div><strong>Schedule Delay:</strong> ${proj.delay_months} Months</div>
            ${proj.warning_count > 0 ? `<div style="color: #b91c1c; font-weight: 600;">⚠️ ${proj.warning_count} Early Warnings Active</div>` : ''}
          </div>
          `,
          { direction: 'top', sticky: true }
        );

        marker.on('click', () => {
          setInspectedProject(proj);
          map.flyTo([proj.lat, proj.lng], 8.0, { duration: 1.0 });
        });

        marker.addTo(projGroup);
      });
    }
  }, [data, activeLayer]);

  // Reset Map View
  const handleResetMap = () => {
    if (mapInstanceRef.current) {
      mapInstanceRef.current.flyTo([22.3, 79.5], 4.8, { duration: 1.2 });
    }
    setInspectedProject(null);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner / Header */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center space-x-2 px-3 py-1 bg-indigo-50 text-indigo-700 rounded-full text-xs font-semibold mb-2">
              <Compass className="w-3.5 h-3.5" />
              <span>National Geospatial Command Center</span>
            </div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
              Interactive GIS & Spatial Risk Heatmap of India
            </h1>
            <p className="text-sm text-slate-500 mt-1">
              Geographic exposure mapping, regional delay multiplier clusters, and AI risk tiers across 2,000+ infrastructure projects.
            </p>
          </div>

          {/* Quick Metrics Ribbon */}
          <div className="flex items-center gap-3">
            <div className="bg-slate-50 border border-slate-200 px-4 py-2 rounded-lg text-center">
              <span className="block text-[11px] font-medium text-slate-500">Monitored States</span>
              <span className="text-lg font-bold text-slate-900">{data?.total_states || 15}</span>
            </div>
            <div className="bg-rose-50 border border-rose-200 px-4 py-2 rounded-lg text-center">
              <span className="block text-[11px] font-medium text-rose-600">Critical Clusters</span>
              <span className="text-lg font-bold text-rose-700">{data?.regional_clusters?.length || 4}</span>
            </div>
            <div className="bg-indigo-50 border border-indigo-200 px-4 py-2 rounded-lg text-center">
              <span className="block text-[11px] font-medium text-indigo-600">Geocoded Pins</span>
              <span className="text-lg font-bold text-indigo-700">{data?.total_markers || 400}</span>
            </div>
          </div>
        </div>

        {/* Filter Toolbar */}
        <div className="mt-5 pt-4 border-t border-slate-100 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          <div>
            <label className="block text-[11px] font-semibold text-slate-600 uppercase tracking-wider mb-1">
              State / Jurisdiction
            </label>
            <select
              value={selectedState}
              onChange={(e) => setSelectedState(e.target.value)}
              className="w-full text-xs bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-1.5 text-slate-700 font-medium focus:ring-2 focus:ring-indigo-500 focus:outline-none"
            >
              <option value="All">All States / UTs (15)</option>
              {availableStates.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-slate-600 uppercase tracking-wider mb-1">
              Infrastructure Sector
            </label>
            <select
              value={selectedSector}
              onChange={(e) => setSelectedSector(e.target.value)}
              className="w-full text-xs bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-1.5 text-slate-700 font-medium focus:ring-2 focus:ring-indigo-500 focus:outline-none"
            >
              <option value="All">All Sectors (8)</option>
              {availableSectors.map((sec) => (
                <option key={sec} value={sec}>
                  {sec}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-slate-600 uppercase tracking-wider mb-1">
              AI Risk Severity Filter
            </label>
            <select
              value={selectedRiskTier}
              onChange={(e) => setSelectedRiskTier(e.target.value)}
              className="w-full text-xs bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-1.5 text-slate-700 font-medium focus:ring-2 focus:ring-indigo-500 focus:outline-none"
            >
              <option value="All">All Severity Levels</option>
              <option value="Critical">🔴 Critical Only (Score &gt;= 60)</option>
              <option value="Medium">🟡 Medium &amp; Critical</option>
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-slate-600 uppercase tracking-wider mb-1">
              Map Layers Display
            </label>
            <div className="flex bg-slate-100 rounded-lg p-0.5 border border-slate-200">
              <button
                onClick={() => setActiveLayer('both')}
                className={`flex-1 text-[11px] font-semibold py-1 rounded-md transition ${
                  activeLayer === 'both' ? 'bg-white text-indigo-600 shadow-xs' : 'text-slate-600'
                }`}
              >
                All
              </button>
              <button
                onClick={() => setActiveLayer('states')}
                className={`flex-1 text-[11px] font-semibold py-1 rounded-md transition ${
                  activeLayer === 'states' ? 'bg-white text-indigo-600 shadow-xs' : 'text-slate-600'
                }`}
              >
                States
              </button>
              <button
                onClick={() => setActiveLayer('projects')}
                className={`flex-1 text-[11px] font-semibold py-1 rounded-md transition ${
                  activeLayer === 'projects' ? 'bg-white text-indigo-600 shadow-xs' : 'text-slate-600'
                }`}
              >
                Pins
              </button>
            </div>
          </div>

          <div className="flex items-end">
            <button
              onClick={handleResetMap}
              className="w-full flex items-center justify-center space-x-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold border border-slate-300 transition shadow-xs"
            >
              <Maximize2 className="w-3.5 h-3.5" />
              <span>Reset Map Zoom</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Grid: Interactive Map (Left) & Geospatial Intelligence Panel (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Interactive Leaflet Map (8 Cols) */}
        <div className="lg:col-span-8 space-y-4">
          <div className="bg-white rounded-xl border border-slate-200 p-3 shadow-sm relative">
            {/* Map Container */}
            <div
              ref={mapContainerRef}
              className="w-full h-[620px] rounded-lg z-0 relative overflow-hidden bg-slate-100"
            />

            {/* Map Legend Overlay */}
            <div className="absolute bottom-6 left-6 bg-white/95 backdrop-blur border border-slate-200 rounded-lg p-3 shadow-md z-[1000] text-xs">
              <span className="font-bold text-slate-800 block mb-1.5">AI Spatial Risk Legend</span>
              <div className="space-y-1 text-[11px]">
                <div className="flex items-center space-x-2">
                  <span className="w-3 h-3 rounded-full bg-rose-500 inline-block border border-white shadow-xs"></span>
                  <span className="text-slate-700 font-medium">Critical Risk Tier (Score &ge; 60)</span>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="w-3 h-3 rounded-full bg-amber-500 inline-block border border-white shadow-xs"></span>
                  <span className="text-slate-700 font-medium">Medium Risk Tier (Score 35–59)</span>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="w-3 h-3 rounded-full bg-emerald-500 inline-block border border-white shadow-xs"></span>
                  <span className="text-slate-700 font-medium">Low Operational Risk Tier (&lt; 35)</span>
                </div>
              </div>
            </div>

            {loading && (
              <div className="absolute inset-0 bg-white/70 backdrop-blur-xs flex items-center justify-center rounded-lg z-[1100]">
                <div className="flex items-center space-x-2 bg-white px-4 py-2 rounded-lg shadow-md border border-slate-200 text-xs font-semibold text-slate-700">
                  <div className="w-4 h-4 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
                  <span>Rendering Spatial Risk Layers...</span>
                </div>
              </div>
            )}
          </div>

          {/* Regional Spatial Multiplier Clusters */}
          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
            <div className="flex items-center space-x-2 mb-3">
              <Layers className="w-4 h-4 text-indigo-600" />
              <h3 className="text-sm font-bold text-slate-900">
                Regional Geographical Clusters &amp; Delay Multipliers
              </h3>
            </div>
            <p className="text-xs text-slate-500 mb-4">
              Geomorphological and institutional friction multipliers based on terrain, seismic zoning, and statutory clearance density.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {data?.regional_clusters?.map((c) => {
                const isSelected = activeCluster?.cluster_name === c.cluster_name;
                return (
                  <div
                    key={c.cluster_name}
                    onClick={() => setActiveCluster(c)}
                    className={`p-3.5 rounded-lg border cursor-pointer transition text-xs ${
                      isSelected
                        ? 'bg-indigo-50/60 border-indigo-400 ring-1 ring-indigo-300'
                        : 'bg-slate-50 hover:bg-slate-100 border-slate-200'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-bold text-slate-900">{c.cluster_name}</span>
                      <span className="px-2 py-0.5 bg-rose-100 text-rose-700 rounded text-[10px] font-bold">
                        {c.delay_multiplier}x Delay Factor
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-600 mb-1.5">
                      <strong className="text-slate-700">States:</strong> {c.states.join(', ')}
                    </div>
                    <div className="text-[11px] text-slate-500 mb-2">
                      <strong className="text-slate-700">Hazard Profile:</strong> {c.primary_hazard}
                    </div>
                    <div className="text-[11px] text-indigo-800 bg-indigo-100/60 p-2 rounded border border-indigo-200">
                      <strong>Intervention:</strong> {c.recommendation}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right Column: Deep-Dive Inspector (4 Cols) */}
        <div className="lg:col-span-4 space-y-4">
          {/* Project Specific Pin Inspector */}
          {inspectedProject ? (
            <div className="bg-white rounded-xl border border-indigo-300 p-5 shadow-sm space-y-4 ring-1 ring-indigo-200 animate-in fade-in duration-200">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center space-x-2">
                  <MapPin className="w-4 h-4 text-indigo-600" />
                  <span className="text-xs font-bold text-indigo-600 uppercase tracking-wider">
                    Project Pin Inspector
                  </span>
                </div>
                <span
                  className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                    inspectedProject.risk_tier === 'Critical'
                      ? 'bg-rose-100 text-rose-700'
                      : inspectedProject.risk_tier === 'Medium'
                      ? 'bg-amber-100 text-amber-700'
                      : 'bg-emerald-100 text-emerald-700'
                  }`}
                >
                  {inspectedProject.risk_tier} Risk
                </span>
              </div>

              <div>
                <h4 className="text-base font-bold text-slate-900 leading-snug">
                  {inspectedProject.project_name}
                </h4>
                <div className="text-xs text-slate-500 mt-0.5">
                  ID: <span className="font-mono text-slate-700">{inspectedProject.project_id}</span> &bull;{' '}
                  {inspectedProject.sector} &bull; {inspectedProject.state}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="bg-slate-50 p-2.5 rounded border border-slate-200">
                  <span className="text-slate-500 block text-[10px]">Sanctioned Cost</span>
                  <span className="font-bold text-slate-900 text-sm">
                    ₹{inspectedProject.original_cost.toLocaleString()} Cr
                  </span>
                </div>
                <div className="bg-slate-50 p-2.5 rounded border border-slate-200">
                  <span className="text-slate-500 block text-[10px]">Physical Progress</span>
                  <span className="font-bold text-slate-900 text-sm">
                    {inspectedProject.physical_progress_pct}%
                  </span>
                </div>
                <div className="bg-rose-50 p-2.5 rounded border border-rose-200">
                  <span className="text-rose-600 block text-[10px]">Predicted Overrun</span>
                  <span className="font-bold text-rose-700 text-sm">
                    +{inspectedProject.cost_overrun_pct}%
                  </span>
                </div>
                <div className="bg-amber-50 p-2.5 rounded border border-amber-200">
                  <span className="text-amber-600 block text-[10px]">Schedule Delay</span>
                  <span className="font-bold text-amber-700 text-sm">
                    {inspectedProject.delay_months} Months
                  </span>
                </div>
              </div>

              <div className="text-xs space-y-1.5 pt-2 border-t border-slate-100">
                <div className="flex justify-between text-slate-600">
                  <span>Land Acquisition:</span>
                  <span className="font-semibold text-slate-800">{inspectedProject.land_acquisition_pct}%</span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>Funding Risk Rating:</span>
                  <span className="font-semibold text-slate-800">{inspectedProject.funding_risk}</span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>Coordinates:</span>
                  <span className="font-mono text-[11px] text-slate-700">
                    {inspectedProject.lat.toFixed(4)}, {inspectedProject.lng.toFixed(4)}
                  </span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>Early Warning Flags:</span>
                  <span
                    className={`font-bold ${
                      inspectedProject.warning_count > 0 ? 'text-rose-600' : 'text-emerald-600'
                    }`}
                  >
                    {inspectedProject.warning_count} active
                  </span>
                </div>
              </div>

              <button
                onClick={() => setInspectedProject(null)}
                className="w-full text-xs text-indigo-600 hover:text-indigo-800 font-semibold py-1.5 text-center transition"
              >
                &larr; Return to State Level Aggregates
              </button>
            </div>
          ) : null}

          {/* State-Level Geospatial Profile */}
          {inspectedState && (
            <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                    State Jurisdiction Profile
                  </span>
                  <h3 className="text-lg font-bold text-slate-900">{inspectedState.state}</h3>
                </div>
                <div className="text-right">
                  <span
                    className={`px-2.5 py-1 rounded text-xs font-bold inline-block ${
                      inspectedState.risk_tier === 'Critical'
                        ? 'bg-rose-100 text-rose-700'
                        : inspectedState.risk_tier === 'Medium'
                        ? 'bg-amber-100 text-amber-700'
                        : 'bg-emerald-100 text-emerald-700'
                    }`}
                  >
                    Risk Score: {inspectedState.risk_score}
                  </span>
                </div>
              </div>

              {/* Geographic Risk Notes */}
              <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 text-xs space-y-1.5">
                <div>
                  <strong className="text-slate-700">Terrain Topology:</strong>{' '}
                  <span className="text-slate-600">{inspectedState.terrain}</span>
                </div>
                <div>
                  <strong className="text-slate-700">Primary Geo-Risk:</strong>{' '}
                  <span className="text-slate-600">{inspectedState.geo_risk}</span>
                </div>
                <div>
                  <strong className="text-slate-700">Corridor Cluster:</strong>{' '}
                  <span className="text-indigo-600 font-medium">{inspectedState.cluster}</span>
                </div>
              </div>

              {/* State Performance Metrics */}
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="p-2.5 bg-slate-50 rounded border border-slate-200">
                  <span className="text-[10px] text-slate-500 block">Monitored Schemes</span>
                  <span className="font-bold text-slate-900 text-sm">
                    {inspectedState.project_count} Projects
                  </span>
                </div>
                <div className="p-2.5 bg-slate-50 rounded border border-slate-200">
                  <span className="text-[10px] text-slate-500 block">Flagged Breaches</span>
                  <span className="font-bold text-rose-600 text-sm">
                    {inspectedState.flagged_count} ({inspectedState.flagged_pct}%)
                  </span>
                </div>
                <div className="p-2.5 bg-slate-50 rounded border border-slate-200">
                  <span className="text-[10px] text-slate-500 block">Total Sanctioned</span>
                  <span className="font-bold text-slate-900 text-sm">
                    ₹{inspectedState.total_sanctioned_cost_cr.toLocaleString()} Cr
                  </span>
                </div>
                <div className="p-2.5 bg-rose-50 rounded border border-rose-200">
                  <span className="text-[10px] text-rose-600 block">Cost Escalation</span>
                  <span className="font-bold text-rose-700 text-sm">
                    +₹{inspectedState.overrun_cost_cr.toLocaleString()} Cr
                  </span>
                </div>
              </div>

              {/* Operational Bottlenecks */}
              <div className="space-y-2 pt-2 border-t border-slate-100 text-xs">
                <span className="font-bold text-slate-800 block">State Bottleneck Indicators</span>
                <div className="flex justify-between text-slate-600">
                  <span>Average Cost Overrun:</span>
                  <span className="font-bold text-slate-900">+{inspectedState.avg_overrun_pct}%</span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>Average Schedule Delay:</span>
                  <span className="font-bold text-slate-900">{inspectedState.avg_delay_months} Months</span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>Land Acquisition Completion:</span>
                  <span className="font-bold text-slate-900">{inspectedState.avg_land_acquisition_pct}%</span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>Average Clearance Delay:</span>
                  <span className="font-bold text-slate-900">
                    {inspectedState.avg_approval_delay_months} Months
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Ranking Table of All States by Composite Risk */}
          <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
            <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-2.5">
              State Vulnerability Ranking
            </h4>
            <div className="space-y-1.5 max-h-[220px] overflow-y-auto pr-1">
              {data?.state_metrics.map((s, idx) => {
                const isSelected = inspectedState?.state === s.state;
                return (
                  <div
                    key={s.state}
                    onClick={() => {
                      setInspectedState(s);
                      setInspectedProject(null);
                      if (mapInstanceRef.current) {
                        mapInstanceRef.current.flyTo([s.lat, s.lng], 6.5, { duration: 1.0 });
                      }
                    }}
                    className={`flex items-center justify-between p-2 rounded text-xs cursor-pointer transition ${
                      isSelected
                        ? 'bg-indigo-50 border border-indigo-200 font-bold'
                        : 'hover:bg-slate-50 text-slate-700'
                    }`}
                  >
                    <div className="flex items-center space-x-2">
                      <span className="text-[10px] text-slate-400 w-4">{idx + 1}.</span>
                      <span className="font-medium text-slate-900">{s.state}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className="text-[11px] text-slate-500">+{s.avg_overrun_pct}%</span>
                      <span
                        className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                          s.risk_tier === 'Critical'
                            ? 'bg-rose-100 text-rose-700'
                            : s.risk_tier === 'Medium'
                            ? 'bg-amber-100 text-amber-700'
                            : 'bg-emerald-100 text-emerald-700'
                        }`}
                      >
                        {s.risk_score}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

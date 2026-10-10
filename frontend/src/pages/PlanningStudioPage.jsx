import React, { useState, useEffect, useMemo } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import {
  Building2,
  Plus,
  Trash2,
  Copy,
  Download,
  FileSpreadsheet,
  Zap,
  Sun,
  Car,
  DollarSign,
  TrendingUp,
  ShieldAlert,
  Sparkles,
  Layers,
  Wrench,
  Compass,
  AlertTriangle,
  Search,
  Clock,
  Home,
  Building,
  GraduationCap,
  HeartPulse,
  Briefcase,
  ShoppingBag,
  BedDouble,
  Factory,
  Server,
  Boxes,
  Store,
  Check,
  ArrowRight,
  ArrowLeft,
  Leaf,
  Activity,
  CheckCircle2,
  Sliders
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid
} from 'recharts';
import { energyApi } from '../services/api';
import { LoadingSpinner } from '../components/LoadingSpinner';
import { CONSTRUCTION_TYPES_DATA } from '../data/constructionTypesData';
import Construction3DCard from '../components/Construction3DCard';

const CHART_COLORS = ['#10b981', '#06b6d4', '#6366f1', '#f59e0b', '#ec4899', '#8b5cf6', '#14b8a6', '#f97316'];

export default function PlanningStudioPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [calculating, setCalculating] = useState(false);
  const [projects, setProjects] = useState([]);
  const [selectedProjectId, setSelectedProjectId] = useState(null);
  const [projectData, setProjectData] = useState(null);
  const [catalog, setCatalog] = useState({ categories: {}, facility_fields: {} });
  const [discoms, setDiscoms] = useState([]);

  // Active view tab
  const [activeTab, setActiveTab] = useState('overview'); // 'overview', 'equipment', 'construction', 'tariff', 'solar', 'ev', 'scenarios', 'recommendations', 'predictions'

  // Modals & Forms
  const [showNewProjectModal, setShowNewProjectModal] = useState(false);
  const [showAddEquipmentModal, setShowAddEquipmentModal] = useState(false);
  const [showAddConstructionModal, setShowAddConstructionModal] = useState(false);
  const [facilitySearch, setFacilitySearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('Residential');

  // Construction-Based Energy Planning Wizard State
  // 1 = Select Construction Type, 2 = Dynamic Form & Appliances, 3 = Prediction Results
  const [wizardStep, setWizardStep] = useState(1);
  const [selectedConstructionType, setSelectedConstructionType] = useState('Residential House');
  const [wizardSearch, setWizardSearch] = useState('');
  const [submittingWizard, setSubmittingWizard] = useState(false);
  const [wizardError, setWizardError] = useState(null);
  const [wizardResult, setWizardResult] = useState(null);
  const [selectedAppliances, setSelectedAppliances] = useState([]);

  // Building parameter adjustments for active project
  const [showEditBuildingModal, setShowEditBuildingModal] = useState(false);
  const [editBuildingForm, setEditBuildingForm] = useState({
    built_up_area: 2400,
    floors_count: 2,
    occupancy: 4,
    daily_operating_hours: 24,
    operating_days_per_month: 30,
    ac_type: 'Split / Window Inverter ACs'
  });
  const [updatingBuilding, setUpdatingBuilding] = useState(false);
  const [editBuildingError, setEditBuildingError] = useState(null);

  // New Project Form State
  const [newProjectForm, setNewProjectForm] = useState({
    name: '',
    facility_category: 'Residential',
    facility_subtype: 'Independent house',
    project_phase: 'Planning',
    location: 'Bengaluru, Karnataka',
    state: 'Karnataka',
    country: 'India',
    discom: 'BESCOM',
    tariff_category: 'Domestic LT-2',
    built_up_area: 2400,
    area_unit: 'sq_ft',
    floors_count: 2,
    occupancy: 4,
    operating_days_per_month: 30,
    daily_operating_hours: 24,
    connection_type: '3-Phase LT',
    budget_range: '₹15,000 - ₹25,000 / month',
    target_completion_date: '2026-12-31'
  });

  // Dynamic Subtype-specific Parameters
  const [facilityParams, setFacilityParams] = useState({});

  // Calculation Results
  const [calcResults, setCalcResults] = useState(null);

  // New Equipment Item Form
  const [newEquipment, setNewEquipment] = useState({
    category: 'HVAC',
    name: '',
    brand_model: '',
    quantity: 1,
    rated_power_w: 1500,
    operating_load_pct: 75,
    daily_hours: 8,
    monthly_days: 30,
    efficiency_pct: 88,
    unit_purchase_cost: 35000,
    is_energy_efficient: false,
    efficient_alternative_name: '',
    efficient_alternative_watts: 1000,
    efficient_alternative_cost: 42000
  });

  // New Construction Machine Form
  const [newConstMachine, setNewConstMachine] = useState({
    phase_name: 'Structural & Concrete',
    equipment_name: '',
    rated_power_kw: 7.5,
    quantity: 1,
    operating_load_pct: 70,
    hours_per_day: 6,
    days_per_month: 25,
    duration_months: 4,
    efficiency_pct: 85
  });

  // Solar & Battery Controls
  const [solarOverrides, setSolarOverrides] = useState({
    rooftop_area_sq_ft: 1200,
    solar_irradiance: 5.0,
    critical_load_kw: 2.5,
    desired_backup_hours: 4.0
  });

  // EV Charging Controls
  const [evChargerCount, setEvChargerCount] = useState(2);
  const [evChargerType, setEvChargerType] = useState('7.4');

  // Load Initial Data
  useEffect(() => {
    fetchInitialData();
  }, []);

  const fetchInitialData = async () => {
    setLoading(true);
    try {
      const [projRes, catRes, discomRes] = await Promise.all([
        energyApi.getProjects(),
        energyApi.getFacilityCatalog(),
        energyApi.getDiscoms()
      ]);

      setProjects(projRes.data || []);
      setCatalog(catRes.data || { categories: {}, facility_fields: {} });
      setDiscoms(discomRes.data || []);

      if (projRes.data && projRes.data.length > 0) {
        const firstId = projRes.data[0].id;
        setSelectedProjectId(firstId);
        await loadProjectDetails(firstId);
      } else {
        // If no projects exist, seed demo projects automatically for immediate exploration
        await handleSeedDemoProjects();
      }
    } catch (err) {
      console.error('Failed to load ElectroWise initial data:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadProjectDetails = async (projectId) => {
    try {
      const res = await energyApi.getProject(projectId);
      setProjectData(res.data);
      if (res.data) {
        setEditBuildingForm({
          built_up_area: res.data.built_up_area || 2400,
          floors_count: res.data.floors_count || 1,
          occupancy: res.data.occupancy || 4,
          daily_operating_hours: res.data.daily_operating_hours || 12,
          operating_days_per_month: res.data.operating_days_per_month || 30,
          ac_type: 'Split / Window Inverter ACs'
        });
      }
      // Initialize dynamic params
      const subType = res.data.facility_subtype;
      const fields = catalog.facility_fields?.[subType] || [];
      const initParams = {};
      fields.forEach(f => { initParams[f.id] = f.default; });
      setFacilityParams(initParams);

      // Execute initial calculations
      await runCalculations(projectId);
    } catch (err) {
      console.error('Failed to load project details:', err);
    }
  };

  const runCalculations = async (projectId, overrides = {}) => {
    setCalculating(true);
    try {
      const payload = {
        solar_override: overrides.solar || solarOverrides,
        ev_override: {
          chargers: [
            {
              charger_label: `${evChargerType} kW EV Station`,
              power_kw: parseFloat(evChargerType),
              chargers_count: evChargerCount,
              daily_charging_hours: 5.0,
              vehicles_per_day: evChargerCount * 2,
              simultaneous_pct: 80.0
            }
          ]
        },
        built_up_area: overrides.built_up_area !== undefined ? parseFloat(overrides.built_up_area) : undefined,
        floors_count: overrides.floors_count !== undefined ? parseInt(overrides.floors_count) : undefined,
        occupancy: overrides.occupancy !== undefined ? parseInt(overrides.occupancy) : undefined,
        daily_operating_hours: overrides.daily_operating_hours !== undefined ? parseFloat(overrides.daily_operating_hours) : undefined,
        operating_days_per_month: overrides.operating_days_per_month !== undefined ? parseInt(overrides.operating_days_per_month) : undefined,
        ac_type: overrides.ac_type
      };
      const res = await energyApi.calculateProject(projectId, payload);
      setCalcResults(res.data);
      if (res.data?.project) {
        setProjectData((prev) => ({ ...prev, ...res.data.project }));
      }
    } catch (err) {
      console.error('Project calculation failed:', err);
    } finally {
      setCalculating(false);
    }
  };

  const handleUpdateBuildingSpecs = async (e) => {
    e.preventDefault();
    setEditBuildingError(null);
    const area = parseFloat(editBuildingForm.built_up_area);
    const floors = parseInt(editBuildingForm.floors_count);
    const occ = parseInt(editBuildingForm.occupancy);
    const hours = parseFloat(editBuildingForm.daily_operating_hours);
    const days = parseInt(editBuildingForm.operating_days_per_month);

    if (!area || isNaN(area) || area <= 0) {
      setEditBuildingError('Building Area must be greater than 0 sq ft.');
      return;
    }
    if (!floors || isNaN(floors) || floors < 1) {
      setEditBuildingError('Number of Floors must be at least 1.');
      return;
    }
    if (!occ || isNaN(occ) || occ < 1) {
      setEditBuildingError('Occupancy must be at least 1 person.');
      return;
    }
    if (!hours || isNaN(hours) || hours <= 0 || hours > 24) {
      setEditBuildingError('Daily Operating Hours must be between 0.5 and 24 hours.');
      return;
    }

    setUpdatingBuilding(true);
    try {
      await runCalculations(selectedProjectId, {
        built_up_area: area,
        floors_count: floors,
        occupancy: occ,
        daily_operating_hours: hours,
        operating_days_per_month: days,
        ac_type: editBuildingForm.ac_type
      });
      setShowEditBuildingModal(false);
    } catch (err) {
      setEditBuildingError(err.response?.data?.detail || err.message || 'Failed to update specs');
    } finally {
      setUpdatingBuilding(false);
    }
  };

  // Listen for direct deep-linking from Dashboard
  useEffect(() => {
    const action = searchParams.get('action');
    const typeParam = searchParams.get('type');
    const projectIdParam = searchParams.get('projectId');

    if (action === 'new') {
      setShowNewProjectModal(true);
      if (typeParam && CONSTRUCTION_TYPES_DATA[typeParam]) {
        handleSelectConstructionType(typeParam);
      } else {
        setWizardStep(1);
      }
    } else if (projectIdParam) {
      const pid = Number(projectIdParam);
      if (pid) {
        setSelectedProjectId(pid);
        loadProjectDetails(pid);
      }
    }
  }, [searchParams]);

  const handleSelectConstructionType = (typeName) => {
    setSelectedConstructionType(typeName);
    setWizardError(null);
    setWizardResult(null); // Clear stale results when switching types
    const typeData = CONSTRUCTION_TYPES_DATA[typeName];
    if (typeData) {
      setNewProjectForm((prev) => ({
        ...prev,
        name: `${typeName} Energy Plan`,
        facility_category: typeData.category,
        facility_subtype: typeName,
        built_up_area: typeData.defaultArea,
        floors_count: typeData.defaultFloors,
        occupancy: typeData.defaultOccupants,
        daily_operating_hours: typeData.defaultDailyHours,
        operating_days_per_month: typeData.defaultOperatingDays,
        ac_type: 'Split / Window Inverter ACs'
      }));
      const initFields = {};
      typeData.fields.forEach((f) => {
        initFields[f.id] = f.default;
      });
      setFacilityParams(initFields);
      setSelectedAppliances(typeData.appliances.map((a) => ({ ...a })));
    }
    setWizardStep(2);
  };

  const handleToggleAppliance = (index) => {
    setSelectedAppliances((prev) =>
      prev.map((item, idx) => (idx === index ? { ...item, checked: !item.checked } : item))
    );
  };

  const handleUpdateAppliance = (index, field, value) => {
    setSelectedAppliances((prev) =>
      prev.map((item, idx) => (idx === index ? { ...item, [field]: value } : item))
    );
  };

  const handleAddCustomAppliance = () => {
    setSelectedAppliances((prev) => [
      ...prev,
      {
        name: 'Custom Electrical Load',
        category: 'Machinery',
        rated_power_w: 2000,
        quantity: 1,
        daily_hours: 8,
        operating_load_pct: 75,
        checked: true
      }
    ]);
  };

  const handleWizardSubmit = async (e) => {
    e.preventDefault();
    setWizardError(null);

    // Validate inputs
    const area = parseFloat(newProjectForm.built_up_area);
    const floors = parseInt(newProjectForm.floors_count);
    const occ = parseInt(newProjectForm.occupancy);
    const hours = parseFloat(newProjectForm.daily_operating_hours);
    const days = parseInt(newProjectForm.operating_days_per_month);

    if (!area || isNaN(area) || area <= 0) {
      setWizardError('Building Area must be greater than 0 square feet.');
      return;
    }
    if (!floors || isNaN(floors) || floors < 1) {
      setWizardError('Number of Floors must be at least 1.');
      return;
    }
    if (!occ || isNaN(occ) || occ < 1) {
      setWizardError('Expected Occupants must be at least 1 person.');
      return;
    }
    if (!hours || isNaN(hours) || hours <= 0 || hours > 24) {
      setWizardError('Daily Operating Hours must be between 0.5 and 24 hours.');
      return;
    }
    if (!days || isNaN(days) || days < 1 || days > 31) {
      setWizardError('Operating Days per Month must be between 1 and 31 days.');
      return;
    }

    // Clear stale result and indicate loading
    setWizardResult(null);
    setSubmittingWizard(true);

    try {
      const activeAppliances = selectedAppliances.filter((a) => a.checked);
      const initialEquipmentPayload = activeAppliances.map((a) => ({
        category: a.category || 'Appliances',
        name: a.name,
        quantity: parseInt(a.quantity) || 1,
        rated_power_w: parseFloat(a.rated_power_w) || 1000,
        operating_load_pct: parseFloat(a.operating_load_pct) || 75,
        daily_hours: parseFloat(a.daily_hours) || 8,
        monthly_days: days,
        efficiency_pct: 90,
        unit_purchase_cost: 0
      }));

      const payload = {
        ...newProjectForm,
        facility_category: CONSTRUCTION_TYPES_DATA[selectedConstructionType]?.category || newProjectForm.facility_category,
        facility_subtype: selectedConstructionType,
        built_up_area: area,
        floors_count: floors,
        occupancy: occ,
        operating_days_per_month: days,
        daily_operating_hours: hours,
        facility_params: {
          ...facilityParams,
          air_conditioning_type: newProjectForm.ac_type || 'Split / Window Inverter ACs'
        },
        initial_equipment: initialEquipmentPayload.length > 0 ? initialEquipmentPayload : undefined
      };

      const createdRes = await energyApi.createProject(payload);
      const newProjectId = createdRes.data.id;
      const calcRes = await energyApi.calculateProject(newProjectId);

      const updatedList = await energyApi.getProjects();
      setProjects(updatedList.data);
      setSelectedProjectId(newProjectId);
      setProjectData(createdRes.data);
      setCalcResults(calcRes.data);

      setWizardResult({
        project: createdRes.data,
        calculations: calcRes.data,
        facilityPrediction: calcRes.data?.facility_prediction,
        constructionType: selectedConstructionType
      });
      setWizardStep(3);
    } catch (err) {
      console.error('Failed to generate energy plan:', err);
      const detailMsg = err.response?.data?.detail || err.message || 'Server calculation error occurred.';
      setWizardError(`Calculation Failed: ${detailMsg}`);
      setWizardResult(null);
    } finally {
      setSubmittingWizard(false);
    }
  };

  const handleCloseWizard = () => {
    setShowNewProjectModal(false);
    setWizardStep(1);
    setWizardResult(null);
    setWizardError(null);
    setSearchParams({});
  };

  const handleSelectProject = async (id) => {
    setSelectedProjectId(id);
    await loadProjectDetails(id);
  };

  const handleSeedDemoProjects = async () => {
    setLoading(true);
    try {
      await energyApi.seedDemoProjects();
      const projRes = await energyApi.getProjects();
      setProjects(projRes.data || []);
      if (projRes.data && projRes.data.length > 0) {
        setSelectedProjectId(projRes.data[0].id);
        await loadProjectDetails(projRes.data[0].id);
      }
    } catch (err) {
      console.error('Error seeding demo projects:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateProject = async (e) => {
    await handleWizardSubmit(e);
  };

  const handleAddEquipment = async (e) => {
    e.preventDefault();
    if (!projectData?.scenarios?.[0]) return;
    const scenarioId = projectData.scenarios[0].id;
    try {
      await energyApi.addEquipment(scenarioId, {
        ...newEquipment,
        quantity: parseInt(newEquipment.quantity) || 1,
        rated_power_w: parseFloat(newEquipment.rated_power_w) || 1000,
        operating_load_pct: parseFloat(newEquipment.operating_load_pct) || 70,
        daily_hours: parseFloat(newEquipment.daily_hours) || 8,
        monthly_days: parseInt(newEquipment.monthly_days) || 30,
        efficiency_pct: parseFloat(newEquipment.efficiency_pct) || 90,
        unit_purchase_cost: parseFloat(newEquipment.unit_purchase_cost) || 0,
        efficient_alternative_watts: parseFloat(newEquipment.efficient_alternative_watts) || null,
        efficient_alternative_cost: parseFloat(newEquipment.efficient_alternative_cost) || null
      });
      setShowAddEquipmentModal(false);
      await loadProjectDetails(selectedProjectId);
    } catch (err) {
      alert('Error adding equipment: ' + (err.response?.data?.detail || err.message));
    }
  };

  const handleDeleteEquipment = async (itemId) => {
    if (!window.confirm('Remove this equipment from the active scenario?')) return;
    try {
      await energyApi.deleteEquipment(itemId);
      await loadProjectDetails(selectedProjectId);
    } catch (err) {
      console.error(err);
    }
  };

  const handleDuplicateEquipment = async (itemId) => {
    try {
      await energyApi.duplicateEquipment(itemId);
      await loadProjectDetails(selectedProjectId);
    } catch (err) {
      console.error(err);
    }
  };

  const handleAddConstructionMachine = async (e) => {
    e.preventDefault();
    try {
      await energyApi.addConstructionItem(selectedProjectId, {
        ...newConstMachine,
        rated_power_kw: parseFloat(newConstMachine.rated_power_kw) || 5,
        quantity: parseInt(newConstMachine.quantity) || 1,
        operating_load_pct: parseFloat(newConstMachine.operating_load_pct) || 70,
        hours_per_day: parseFloat(newConstMachine.hours_per_day) || 6,
        days_per_month: parseInt(newConstMachine.days_per_month) || 25,
        duration_months: parseFloat(newConstMachine.duration_months) || 3,
        efficiency_pct: parseFloat(newConstMachine.efficiency_pct) || 85
      });
      setShowAddConstructionModal(false);
      await loadProjectDetails(selectedProjectId);
    } catch (err) {
      alert('Error adding machine: ' + (err.response?.data?.detail || err.message));
    }
  };

  const handleDeleteConstructionMachine = async (itemId) => {
    try {
      await energyApi.deleteConstructionItem(itemId);
      await loadProjectDetails(selectedProjectId);
    } catch (err) {
      console.error(err);
    }
  };

  const handleExportPDF = async () => {
    if (!selectedProjectId) return;
    try {
      const res = await energyApi.downloadPdfReport(selectedProjectId);
      const url = window.URL.createObjectURL(new Blob([res.data], { type: 'application/pdf' }));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `ElectroWise_Audit_${projectData?.name?.replace(/\s+/g, '_') || 'Project'}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) {
      alert('Failed to generate PDF report: ' + err.message);
    }
  };

  const handleExportCSV = async () => {
    if (!selectedProjectId) return;
    try {
      const res = await energyApi.exportEquipmentCsv(selectedProjectId);
      const url = window.URL.createObjectURL(new Blob([res.data], { type: 'text/csv' }));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `ElectroWise_Equipment_${projectData?.name?.replace(/\s+/g, '_') || 'Inventory'}.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) {
      alert('Failed to export CSV: ' + err.message);
    }
  };

  const handleDuplicateProject = async () => {
    if (!selectedProjectId) return;
    try {
      const res = await energyApi.duplicateProject(selectedProjectId);
      const updatedList = await energyApi.getProjects();
      setProjects(updatedList.data);
      setSelectedProjectId(res.data.id);
      await loadProjectDetails(res.data.id);
    } catch (err) {
      alert('Failed to duplicate project: ' + err.message);
    }
  };

  // Filtered subtypes in New Project Modal
  const currentSubtypes = useMemo(() => {
    const list = catalog.categories?.[selectedCategory] || [];
    if (!facilitySearch) return list;
    return list.filter(s => s.toLowerCase().includes(facilitySearch.toLowerCase()));
  }, [catalog, selectedCategory, facilitySearch]);

  if (loading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <LoadingSpinner text="Initializing ElectroWise Energy Planning Studio..." />
      </div>
    );
  }

  const activeScenario = projectData?.scenarios?.[0];
  const eqSummary = calcResults?.equipment_analysis?.summary || {};
  const constSummary = calcResults?.construction_analysis?.summary || {};
  const tariffSummary = calcResults?.tariff_analysis || {};
  const solarSummary = calcResults?.solar_analysis || {};
  const evSummary = calcResults?.ev_analysis || {};

  return (
    <div className="space-y-6 pb-12">
      {/* Top Banner Header & Project Switcher */}
      <div className="rounded-2xl bg-gradient-to-r from-slate-900 via-slate-900 to-emerald-950/40 p-6 border border-slate-800 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 h-full w-96 bg-emerald-500/5 blur-3xl rounded-full pointer-events-none" />
        
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 relative z-10">
          <div>
            <div className="flex items-center gap-2.5 mb-1.5">
              <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                <Building2 className="h-4 w-4" />
              </span>
              <h1 className="text-2xl font-black text-white tracking-tight">
                ElectroWise Planning Studio
              </h1>
              <span className="rounded-full bg-emerald-500/10 border border-emerald-500/30 px-2.5 py-0.5 text-[10px] font-bold text-emerald-300 flex items-center gap-1.5">
                {calculating && <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-ping"></span>}
                {calculating ? 'Recalculating...' : 'Full-Stack Facility Intelligence'}
              </span>
            </div>
            <p className="text-xs text-slate-400 max-w-2xl leading-relaxed">
              Model temporary construction loads, configure operational appliances, simulate DISCOM tariff tiers,
              plan solar PV & battery storage, and forecast demand before physical construction.
            </p>
          </div>

          {/* Action Buttons & Project Switcher */}
          <div className="flex flex-wrap items-center gap-2.5">
            <div className="relative min-w-[220px]">
              <select
                value={selectedProjectId || ''}
                onChange={(e) => handleSelectProject(Number(e.target.value))}
                className="w-full rounded-xl bg-slate-800/90 border border-slate-700 py-2 pl-3 pr-8 text-xs font-semibold text-slate-200 focus:outline-none focus:border-emerald-500"
              >
                {projects.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} {p.is_demo ? '(Demo)' : ''}
                  </option>
                ))}
              </select>
            </div>

            <button
              onClick={() => {
                setShowNewProjectModal(true);
                setWizardStep(1);
              }}
              className="flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 px-3.5 py-2 text-xs font-bold text-slate-950 shadow-md shadow-emerald-500/10 hover:from-emerald-400 hover:to-teal-400 transition-all hover:scale-[1.02]"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>+ New Energy Plan</span>
            </button>

            <button
              onClick={() => {
                if (projectData) {
                  setEditBuildingForm({
                    built_up_area: projectData.built_up_area || 2400,
                    floors_count: projectData.floors_count || 1,
                    occupancy: projectData.occupancy || 4,
                    daily_operating_hours: projectData.daily_operating_hours || 12,
                    operating_days_per_month: projectData.operating_days_per_month || 30,
                    ac_type: 'Split / Window Inverter ACs'
                  });
                }
                setEditBuildingError(null);
                setShowEditBuildingModal(true);
              }}
              title="Adjust floor count, area, occupancy, and operating hours to recalculate"
              className="flex items-center gap-1.5 rounded-xl border border-indigo-500/40 bg-indigo-500/10 px-3 py-2 text-xs font-bold text-indigo-300 hover:bg-indigo-500/20 transition-colors"
            >
              <Sliders className="h-3.5 w-3.5" />
              <span>Adjust Specs & Recalculate</span>
            </button>

            <button
              onClick={handleDuplicateProject}
              title="Duplicate current project"
              className="rounded-xl border border-slate-700 bg-slate-800/80 p-2 text-slate-300 hover:bg-slate-700 hover:text-white transition-colors"
            >
              <Copy className="h-4 w-4" />
            </button>

            <button
              onClick={handleExportPDF}
              title="Download official PDF audit report"
              className="flex items-center gap-1.5 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-xs font-bold text-emerald-400 hover:bg-emerald-500/20 transition-colors"
            >
              <Download className="h-3.5 w-3.5" />
              <span>PDF Report</span>
            </button>

            <button
              onClick={handleExportCSV}
              title="Export equipment list to CSV"
              className="flex items-center gap-1.5 rounded-xl border border-slate-700 bg-slate-800/80 px-3 py-2 text-xs font-bold text-slate-300 hover:bg-slate-700 transition-colors"
            >
              <FileSpreadsheet className="h-3.5 w-3.5" />
              <span>CSV</span>
            </button>
          </div>
        </div>

        {/* Project Meta Pill Bar */}
        {projectData && (
          <div className="mt-4 pt-3 border-t border-slate-800/80 flex flex-wrap items-center gap-4 text-xs text-slate-400">
            <div>
              <span className="text-slate-500">Category: </span>
              <span className="font-semibold text-slate-200">{projectData.facility_category}</span>
            </div>
            <div>
              <span className="text-slate-500">Subtype: </span>
              <span className="font-semibold text-emerald-400">{projectData.facility_subtype}</span>
            </div>
            <div>
              <span className="text-slate-500">Area: </span>
              <span className="font-semibold text-slate-200">{projectData.built_up_area?.toLocaleString()} {projectData.area_unit}</span>
            </div>
            <div>
              <span className="text-slate-500">Floors: </span>
              <span className="font-semibold text-teal-300 font-mono">{projectData.floors_count || 1}F</span>
            </div>
            <div>
              <span className="text-slate-500">Occupancy: </span>
              <span className="font-semibold text-teal-300 font-mono">{projectData.occupancy || 1} pax</span>
            </div>
            <div>
              <span className="text-slate-500">Hours: </span>
              <span className="font-semibold text-teal-300 font-mono">{projectData.daily_operating_hours || 12}h/day</span>
            </div>
            <div>
              <span className="text-slate-500">Location: </span>
              <span className="font-semibold text-slate-200">{projectData.location}</span>
            </div>
            <div>
              <span className="text-slate-500">Phase: </span>
              <span className="rounded-md bg-slate-800 px-2 py-0.5 text-[10px] font-semibold text-teal-300 border border-slate-700">
                {projectData.project_phase}
              </span>
            </div>
            <div>
              <span className="text-slate-500">DISCOM: </span>
              <span className="font-semibold text-slate-200">{projectData.discom} ({projectData.tariff_category})</span>
            </div>
          </div>
        )}
      </div>

      {/* 8 Primary Intelligence Stat Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-3">
        <div className="rounded-xl border border-slate-800 bg-slate-900/80 p-3">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Monthly Energy</p>
          <p className="mt-1 text-lg font-black text-emerald-400 font-mono">
            {eqSummary.total_monthly_kwh ? `${eqSummary.total_monthly_kwh.toLocaleString()} kWh` : '--'}
          </p>
          <span className="text-[10px] text-slate-500">Operational load</span>
        </div>

        <div className="rounded-xl border border-slate-800 bg-slate-900/80 p-3">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Monthly Bill</p>
          <p className="mt-1 text-lg font-black text-emerald-400 font-mono">
            {tariffSummary.total_estimated_monthly_bill ? `₹${tariffSummary.total_estimated_monthly_bill.toLocaleString()}` : '--'}
          </p>
          <span className="text-[10px] text-slate-500">DISCOM slab tariff</span>
        </div>

        <div className="rounded-xl border border-slate-800 bg-slate-900/80 p-3">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Peak Demand</p>
          <p className="mt-1 text-lg font-black text-amber-400 font-mono">
            {eqSummary.total_operational_peak_kw ? `${eqSummary.total_operational_peak_kw} kW` : '--'}
          </p>
          <span className="text-[10px] text-slate-500">Instantaneous</span>
        </div>

        <div className="rounded-xl border border-slate-800 bg-slate-900/80 p-3">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Avg Demand</p>
          <p className="mt-1 text-lg font-black text-amber-300 font-mono">
            {eqSummary.avg_demand_kw ? `${eqSummary.avg_demand_kw} kW` : (calcResults?.facility_prediction?.summary?.avg_demand_kw ? `${calcResults.facility_prediction.summary.avg_demand_kw} kW` : '--')}
          </p>
          <span className="text-[10px] text-slate-500">Continuous power</span>
        </div>

        <div className="rounded-xl border border-slate-800 bg-slate-900/80 p-3">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Sanctioned kVA</p>
          <p className="mt-1 text-lg font-black text-teal-400 font-mono">
            {eqSummary.connection_capacity_kva ? `${eqSummary.connection_capacity_kva} kVA` : (calcResults?.facility_prediction?.summary?.connection_capacity_kva ? `${calcResults.facility_prediction.summary.connection_capacity_kva} kVA` : (constSummary.suggested_connection_capacity_kva ? `${constSummary.suggested_connection_capacity_kva} kVA` : '--'))}
          </p>
          <span className="text-[10px] text-slate-500">Recommended sizing</span>
        </div>

        <div className="rounded-xl border border-slate-800 bg-slate-900/80 p-3">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Solar Potential</p>
          <p className="mt-1 text-lg font-black text-amber-300">
            {solarSummary.solar_sizing?.suggested_solar_capacity_kw ? `${solarSummary.solar_sizing.suggested_solar_capacity_kw} kW` : '--'}
          </p>
          <span className="text-[10px] text-slate-500">Rooftop array</span>
        </div>

        <div className="rounded-xl border border-slate-800 bg-slate-900/80 p-3">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">5-Year TCO</p>
          <p className="mt-1 text-lg font-black text-indigo-400">
            {eqSummary.tco_5_years ? `₹${(eqSummary.tco_5_years / 100000).toFixed(1)}L` : '--'}
          </p>
          <span className="text-[10px] text-slate-500">Capex + 5yr bills</span>
        </div>

        <div className="rounded-xl border border-slate-800 bg-slate-900/80 p-3">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Annual Carbon</p>
          <p className="mt-1 text-lg font-black text-rose-400">
            {eqSummary.total_annual_kwh ? `${((eqSummary.total_annual_kwh * 0.716) / 1000).toFixed(1)} t` : '--'}
          </p>
          <span className="text-[10px] text-slate-500">CO2e emissions</span>
        </div>
      </div>

      {/* Navigation Tabs Bar */}
      <div className="border-b border-slate-800 flex overflow-x-auto space-x-2 pb-1 scrollbar-none">
        {[
          { id: 'overview', label: 'Overview & Charts', icon: Layers },
          { id: 'equipment', label: `Equipment Library (${activeScenario?.equipment_items?.length || 0})`, icon: Zap },
          { id: 'construction', label: `Construction Phase (${projectData?.construction_items?.length || 0})`, icon: Wrench },
          { id: 'tariff', label: 'Tariff & Bill Engine', icon: DollarSign },
          { id: 'solar', label: 'Solar & Battery Sizing', icon: Sun },
          { id: 'ev', label: 'EV Load Planner', icon: Car },
          { id: 'scenarios', label: 'Scenario Comparison', icon: Compass },
          { id: 'recommendations', label: `Recommendations (${calcResults?.recommendations?.length || 0})`, icon: Sparkles },
          { id: 'predictions', label: 'Demand Forecasting', icon: TrendingUp },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 whitespace-nowrap px-4 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                isActive
                  ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 shadow-sm'
                  : 'text-slate-400 hover:bg-slate-800/80 hover:text-slate-200'
              }`}
            >
              <Icon className="h-3.5 w-3.5 shrink-0" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Tab 1: Overview & Interactive Charts */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Equipment Energy Distribution Pie */}
            <div className="rounded-2xl border border-slate-800 bg-slate-900/90 p-5 shadow-lg">
              <h2 className="text-sm font-bold text-white mb-1 flex items-center gap-2">
                <Zap className="h-4 w-4 text-emerald-400" />
                Equipment Category Energy Distribution
              </h2>
              <p className="text-xs text-slate-400 mb-4">Proportion of monthly kWh consumed by electrical systems</p>
              <div className="h-64">
                {calcResults?.equipment_analysis?.category_distribution?.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={calcResults.equipment_analysis.category_distribution}
                        dataKey="monthly_kwh"
                        nameKey="category"
                        cx="50%"
                        cy="50%"
                        outerRadius={80}
                        label={({ category, share_pct }) => `${category} (${share_pct}%)`}
                        labelLine={false}
                      >
                        {calcResults.equipment_analysis.category_distribution.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value) => [`${Number(value).toLocaleString()} kWh`, 'Energy']} />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex h-full items-center justify-center text-xs text-slate-500">No equipment items configured</div>
                )}
              </div>
            </div>

            {/* Diurnal 24-Hour Demand Curve */}
            <div className="rounded-2xl border border-slate-800 bg-slate-900/90 p-5 shadow-lg">
              <h2 className="text-sm font-bold text-white mb-1 flex items-center gap-2">
                <Clock className="h-4 w-4 text-amber-400" />
                Diurnal 24-Hour Electrical Demand Profile (kW)
              </h2>
              <p className="text-xs text-slate-400 mb-4">Coincident power demand throughout the day</p>
              <div className="h-64">
                {calcResults?.prediction_integration?.next_24_hours?.hourly_curve ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={calcResults.prediction_integration.next_24_hours.hourly_curve}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                      <XAxis dataKey="hour" stroke="#64748b" tick={{ fontSize: 10 }} />
                      <YAxis stroke="#64748b" tick={{ fontSize: 10 }} unit=" kW" />
                      <Tooltip formatter={(val) => [`${val} kW`, 'Instantaneous Power']} />
                      <Line type="monotone" dataKey="predicted_kw" stroke="#10b981" strokeWidth={2.5} dot={false} />
                    </LineChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex h-full items-center justify-center text-xs text-slate-500">Load profile calculating...</div>
                )}
              </div>
            </div>
          </div>

          {/* Construction Phase vs Operational Comparison Bar */}
          <div className="rounded-2xl border border-slate-800 bg-slate-900/90 p-5 shadow-lg">
            <h2 className="text-sm font-bold text-white mb-1 flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-cyan-400" />
              Construction Phase Energy vs Operational Load Comparison
            </h2>
            <p className="text-xs text-slate-400 mb-4">Monthly energy profile across building lifecycle</p>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={[
                  { name: 'Active Construction', kwh: constSummary.average_monthly_kwh || 0, cost: constSummary.average_monthly_cost_inr || 0 },
                  { name: 'Operational Facility', kwh: eqSummary.total_monthly_kwh || 0, cost: tariffSummary.total_estimated_monthly_bill || 0 },
                  { name: 'Solar Offset Net Grid', kwh: solarSummary.solar_sizing?.remaining_grid_monthly_kwh || eqSummary.total_monthly_kwh || 0, cost: (solarSummary.solar_sizing?.remaining_grid_monthly_kwh || 0) * (tariffSummary.effective_rate_per_kwh || 7.5) },
                ]}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                  <XAxis dataKey="name" stroke="#64748b" tick={{ fontSize: 11 }} />
                  <YAxis stroke="#64748b" tick={{ fontSize: 10 }} unit=" kWh" />
                  <Tooltip formatter={(value) => [`${Number(value).toLocaleString()} kWh`, 'Energy Demand']} />
                  <Bar dataKey="kwh" fill="#06b6d4" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Equipment Intelligence */}
      {activeTab === 'equipment' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-white">Equipment Library & Duty Cycle Planner</h2>
              <p className="text-xs text-slate-400">
                Configure appliances, machinery ratings, operating hours, and compare with 5-star / BLDC energy efficient alternatives.
              </p>
            </div>
            <button
              onClick={() => setShowAddEquipmentModal(true)}
              className="flex items-center gap-1.5 rounded-xl bg-emerald-500 px-3 py-2 text-xs font-bold text-slate-950 hover:bg-emerald-400 transition-colors"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>Add Equipment Row</span>
            </button>
          </div>

          <div className="rounded-2xl border border-slate-800 bg-slate-900/90 overflow-hidden shadow-lg">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-950/80 text-[11px] font-bold uppercase tracking-wider text-slate-400 border-b border-slate-800">
                  <tr>
                    <th className="py-3 px-4">Equipment / Brand</th>
                    <th className="py-3 px-3">Category</th>
                    <th className="py-3 px-3">Qty</th>
                    <th className="py-3 px-3">Rated Power</th>
                    <th className="py-3 px-3">Duty Load</th>
                    <th className="py-3 px-3">Hours/Day</th>
                    <th className="py-3 px-3">Monthly kWh</th>
                    <th className="py-3 px-3">Monthly Cost</th>
                    <th className="py-3 px-3">Efficient Alt</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/80">
                  {calcResults?.equipment_analysis?.equipment_ranking?.length > 0 ? (
                    calcResults.equipment_analysis.equipment_ranking.map((item, idx) => (
                      <tr key={idx} className="hover:bg-slate-800/40 transition-colors">
                        <td className="py-3 px-4 font-semibold text-slate-200">
                          <div>{item.name}</div>
                          {item.brand_model && <div className="text-[10px] text-slate-500">{item.brand_model}</div>}
                        </td>
                        <td className="py-3 px-3">
                          <span className="rounded bg-slate-800 px-2 py-0.5 text-[10px] font-medium text-slate-300 border border-slate-700">
                            {item.category}
                          </span>
                        </td>
                        <td className="py-3 px-3 font-mono font-bold text-slate-300">{item.quantity}</td>
                        <td className="py-3 px-3 font-mono text-slate-300">{item.rated_power_w} W</td>
                        <td className="py-3 px-3 font-mono text-slate-400">{item.operating_load_pct}%</td>
                        <td className="py-3 px-3 font-mono text-slate-400">{item.daily_hours} hrs</td>
                        <td className="py-3 px-3 font-mono font-bold text-emerald-400">
                          {item.monthly_kwh?.toLocaleString()} kWh
                        </td>
                        <td className="py-3 px-3 font-mono font-bold text-slate-200">
                          ₹{item.monthly_cost?.toLocaleString()}
                        </td>
                        <td className="py-3 px-3">
                          {item.comparison ? (
                            <span className="text-[10px] text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-1.5 py-0.5 rounded font-medium">
                              Saves {item.comparison.kwh_saved_annual} kWh/yr
                            </span>
                          ) : (
                            <span className="text-[10px] text-slate-500">Optimal</span>
                          )}
                        </td>
                        <td className="py-3 px-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => handleDuplicateEquipment(item.id || idx)}
                              title="Duplicate row"
                              className="p-1 text-slate-400 hover:text-white"
                            >
                              <Copy className="h-3.5 w-3.5" />
                            </button>
                            <button
                              onClick={() => handleDeleteEquipment(item.id || idx)}
                              title="Remove item"
                              className="p-1 text-slate-400 hover:text-rose-400"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={10} className="py-8 text-center text-slate-500">
                        No equipment items yet. Click "Add Equipment Row" to start.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Tab 3: Construction Phase Electricity Calculator */}
      {activeTab === 'construction' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-white">Temporary Construction-Phase Power Calculator</h2>
              <p className="text-xs text-slate-400">
                Separate temporary construction power from operational energy. Calculate maximum simultaneous kVA connection sizing.
              </p>
            </div>
            <button
              onClick={() => setShowAddConstructionModal(true)}
              className="flex items-center gap-1.5 rounded-xl bg-cyan-500 px-3 py-2 text-xs font-bold text-slate-950 hover:bg-cyan-400 transition-colors"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>Add Construction Machine</span>
            </button>
          </div>

          {/* Sizing Callout Banner */}
          <div className="rounded-2xl border border-cyan-500/30 bg-cyan-950/20 p-4 text-xs text-cyan-200">
            <div className="flex items-start gap-3">
              <ShieldAlert className="h-5 w-5 text-cyan-400 shrink-0 mt-0.5" />
              <div>
                <p className="font-bold text-white text-sm">
                  Recommended Temporary Connection: {constSummary.suggested_connection_capacity_kva || 0} kVA
                </p>
                <p className="mt-1 text-cyan-300/80 leading-relaxed">
                  Based on a connected machine load of {constSummary.total_connected_load_kw || 0} kW with 65% coincidence diversity factor and 0.85 power factor.
                  Total estimated construction electricity budget: <b>₹{constSummary.total_construction_budget_inr?.toLocaleString() || 0}</b> across {constSummary.duration_months || 0} months.
                </p>
                <p className="mt-2 text-[10px] text-cyan-400/60 uppercase tracking-wide">
                  {calcResults?.construction_analysis?.engineering_disclaimer}
                </p>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-800 bg-slate-900/90 overflow-hidden shadow-lg">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-950/80 text-[11px] font-bold uppercase tracking-wider text-slate-400 border-b border-slate-800">
                  <tr>
                    <th className="py-3 px-4">Phase & Machine</th>
                    <th className="py-3 px-3">Power Rating</th>
                    <th className="py-3 px-3">Qty</th>
                    <th className="py-3 px-3">Hours/Day</th>
                    <th className="py-3 px-3">Days/Month</th>
                    <th className="py-3 px-3">Duration</th>
                    <th className="py-3 px-3">Monthly kWh</th>
                    <th className="py-3 px-3">Total Phase kWh</th>
                    <th className="py-3 px-3">Total Cost</th>
                    <th className="py-3 px-4 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/80">
                  {calcResults?.construction_analysis?.itemized_equipment?.map((item, idx) => (
                    <tr key={idx} className="hover:bg-slate-800/40">
                      <td className="py-3 px-4 font-semibold text-slate-200">
                        <div>{item.equipment_name}</div>
                        <div className="text-[10px] text-cyan-400">{item.phase_name}</div>
                      </td>
                      <td className="py-3 px-3 font-mono text-slate-300">{item.rated_power_kw} kW</td>
                      <td className="py-3 px-3 font-mono text-slate-300">{item.quantity}</td>
                      <td className="py-3 px-3 font-mono text-slate-400">{item.hours_per_day} hrs</td>
                      <td className="py-3 px-3 font-mono text-slate-400">{item.days_per_month} days</td>
                      <td className="py-3 px-3 font-mono text-slate-300">{item.duration_months} mo</td>
                      <td className="py-3 px-3 font-mono font-bold text-cyan-400">{item.monthly_kwh?.toLocaleString()} kWh</td>
                      <td className="py-3 px-3 font-mono font-bold text-slate-200">{item.total_kwh?.toLocaleString()} kWh</td>
                      <td className="py-3 px-3 font-mono font-bold text-emerald-400">₹{item.estimated_cost?.toLocaleString()}</td>
                      <td className="py-3 px-4 text-right">
                        <button
                          onClick={() => handleDeleteConstructionMachine(item.id || idx)}
                          className="p-1 text-slate-400 hover:text-rose-400"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Tab 4: Tariff & Bill Engine */}
      {activeTab === 'tariff' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Tariff Config Details Card */}
            <div className="rounded-2xl border border-slate-800 bg-slate-900/90 p-5 shadow-lg">
              <h2 className="text-sm font-bold text-white mb-2 flex items-center gap-2">
                <DollarSign className="h-4 w-4 text-emerald-400" />
                Active DISCOM Tariff Schedule
              </h2>
              <div className="space-y-3 text-xs mt-4">
                <div className="flex justify-between border-b border-slate-800 pb-2">
                  <span className="text-slate-400">DISCOM:</span>
                  <span className="font-bold text-slate-200">{tariffSummary.discom_code}</span>
                </div>
                <div className="flex justify-between border-b border-slate-800 pb-2">
                  <span className="text-slate-400">Category:</span>
                  <span className="font-bold text-emerald-400">{tariffSummary.category_name}</span>
                </div>
                <div className="flex justify-between border-b border-slate-800 pb-2">
                  <span className="text-slate-400">Verification:</span>
                  <span className="text-teal-300 font-medium">{tariffSummary.source_info}</span>
                </div>
                <div className="flex justify-between border-b border-slate-800 pb-2">
                  <span className="text-slate-400">Sanctioned Load:</span>
                  <span className="font-mono text-slate-200">{tariffSummary.sanctioned_load_kw} kW</span>
                </div>
                <div className="flex justify-between border-b border-slate-800 pb-2">
                  <span className="text-slate-400">Effective Rate:</span>
                  <span className="font-mono font-bold text-emerald-400">₹{tariffSummary.effective_rate_per_kwh} / kWh</span>
                </div>
                <div className="flex justify-between pt-1">
                  <span className="text-slate-400">Fixed Charges:</span>
                  <span className="font-mono text-slate-200">₹{tariffSummary.fixed_charges}</span>
                </div>
              </div>
            </div>

            {/* Slab Calculation Breakdown */}
            <div className="lg:col-span-2 rounded-2xl border border-slate-800 bg-slate-900/90 p-5 shadow-lg">
              <h2 className="text-sm font-bold text-white mb-2 flex items-center gap-2">
                <Layers className="h-4 w-4 text-emerald-400" />
                Telescopic Slab Calculation Breakdown
              </h2>
              <p className="text-xs text-slate-400 mb-4">Itemized calculation of units billed across tariff slabs</p>

              <div className="rounded-xl border border-slate-800 overflow-hidden">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-950 text-[11px] font-bold text-slate-400 uppercase">
                    <tr>
                      <th className="py-2.5 px-3">Slab Range</th>
                      <th className="py-2.5 px-3">Units in Slab</th>
                      <th className="py-2.5 px-3">Tariff Rate</th>
                      <th className="py-2.5 px-3 text-right">Energy Charge</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800">
                    {tariffSummary.slab_breakdown?.map((slab, i) => (
                      <tr key={i}>
                        <td className="py-2.5 px-3 font-semibold text-slate-300">{slab.slab_range}</td>
                        <td className="py-2.5 px-3 font-mono text-slate-200">{slab.units} kWh</td>
                        <td className="py-2.5 px-3 font-mono text-slate-300">₹{slab.rate_per_kwh.toFixed(2)}</td>
                        <td className="py-2.5 px-3 font-mono font-bold text-emerald-400 text-right">
                          ₹{slab.charge_amount.toFixed(2)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot className="bg-slate-950 font-bold border-t border-slate-700">
                    <tr>
                      <td colSpan={3} className="py-2.5 px-3 text-slate-300">Subtotal Energy Charges</td>
                      <td className="py-2.5 px-3 text-right text-emerald-400 font-mono">₹{tariffSummary.energy_charges}</td>
                    </tr>
                    <tr>
                      <td colSpan={3} className="py-2.5 px-3 text-slate-400 font-normal">Fixed & Demand Charges</td>
                      <td className="py-2.5 px-3 text-right text-slate-300 font-mono font-normal">₹{((tariffSummary.fixed_charges || 0) + (tariffSummary.demand_charges || 0)).toFixed(2)}</td>
                    </tr>
                    <tr>
                      <td colSpan={3} className="py-2.5 px-3 text-slate-400 font-normal">Electricity Duty / Tax ({tariffSummary.tax_percentage}%)</td>
                      <td className="py-2.5 px-3 text-right text-slate-300 font-mono font-normal">₹{tariffSummary.tax_amount}</td>
                    </tr>
                    <tr className="text-sm bg-emerald-950/30 text-white">
                      <td colSpan={3} className="py-3 px-3 font-black text-emerald-300">TOTAL ESTIMATED MONTHLY BILL</td>
                      <td className="py-3 px-3 text-right font-mono font-black text-emerald-400">
                        ₹{tariffSummary.total_estimated_monthly_bill?.toLocaleString()}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab 5: Solar & Battery Storage Planner */}
      {activeTab === 'solar' && (
        <div className="space-y-6">
          <div className="rounded-2xl border border-slate-800 bg-slate-900/90 p-5 shadow-lg">
            <h2 className="text-base font-bold text-white mb-2 flex items-center gap-2">
              <Sun className="h-5 w-5 text-amber-400" />
              Solar Photovoltaic (PV) & Battery Storage (BESS) Planner
            </h2>
            <p className="text-xs text-slate-400 mb-6">
              Estimate clean energy generation, battery backup capacity, and compare 3 investment scenarios.
            </p>

            {/* Interactive Inputs */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 p-4 rounded-xl bg-slate-950 border border-slate-800 mb-6">
              <div>
                <label className="text-[11px] font-semibold text-slate-400">Rooftop Area (sq ft)</label>
                <input
                  type="number"
                  value={solarOverrides.rooftop_area_sq_ft}
                  onChange={(e) => setSolarOverrides({ ...solarOverrides, rooftop_area_sq_ft: parseFloat(e.target.value) || 0 })}
                  className="mt-1 w-full rounded-lg bg-slate-900 border border-slate-700 px-3 py-1.5 text-xs text-slate-200"
                />
              </div>

              <div>
                <label className="text-[11px] font-semibold text-slate-400">Solar Irradiance (kWh/m²/day)</label>
                <input
                  type="number"
                  step="0.1"
                  value={solarOverrides.solar_irradiance}
                  onChange={(e) => setSolarOverrides({ ...solarOverrides, solar_irradiance: parseFloat(e.target.value) || 5.0 })}
                  className="mt-1 w-full rounded-lg bg-slate-900 border border-slate-700 px-3 py-1.5 text-xs text-slate-200"
                />
              </div>

              <div>
                <label className="text-[11px] font-semibold text-slate-400">Critical Backup Load (kW)</label>
                <input
                  type="number"
                  step="0.5"
                  value={solarOverrides.critical_load_kw}
                  onChange={(e) => setSolarOverrides({ ...solarOverrides, critical_load_kw: parseFloat(e.target.value) || 1.0 })}
                  className="mt-1 w-full rounded-lg bg-slate-900 border border-slate-700 px-3 py-1.5 text-xs text-slate-200"
                />
              </div>

              <div>
                <label className="text-[11px] font-semibold text-slate-400">Desired Backup Duration (Hours)</label>
                <div className="flex gap-2 mt-1">
                  <input
                    type="number"
                    step="0.5"
                    value={solarOverrides.desired_backup_hours}
                    onChange={(e) => setSolarOverrides({ ...solarOverrides, desired_backup_hours: parseFloat(e.target.value) || 2.0 })}
                    className="w-full rounded-lg bg-slate-900 border border-slate-700 px-3 py-1.5 text-xs text-slate-200"
                  />
                  <button
                    onClick={() => runCalculations(selectedProjectId, { solar: solarOverrides })}
                    className="rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold px-3 py-1.5 text-xs"
                  >
                    Recalculate
                  </button>
                </div>
              </div>
            </div>

            {/* Sizing Results Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
              {/* Scenario 1: Grid Only */}
              <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-4">
                <span className="text-[10px] font-bold text-slate-500 uppercase">Scenario 1</span>
                <h3 className="font-bold text-slate-200 text-sm mt-0.5">Grid Electricity Only</h3>
                <div className="mt-4 space-y-2 text-xs">
                  <div className="flex justify-between text-slate-400">
                    <span>Initial Capex:</span>
                    <span className="font-mono text-slate-200">₹0</span>
                  </div>
                  <div className="flex justify-between text-slate-400">
                    <span>Annual Electricity Bill:</span>
                    <span className="font-mono text-rose-400">₹{solarSummary.scenarios_comparison?.scenario_1_grid_only?.annual_electricity_bill_inr?.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-slate-400 font-bold border-t border-slate-800 pt-2">
                    <span>5-Year Total Cost:</span>
                    <span className="font-mono text-slate-200">₹{solarSummary.scenarios_comparison?.scenario_1_grid_only?.five_year_tco_inr?.toLocaleString()}</span>
                  </div>
                </div>
              </div>

              {/* Scenario 2: Solar Net Metered */}
              <div className="rounded-xl border border-amber-500/30 bg-amber-950/10 p-4">
                <span className="text-[10px] font-bold text-amber-400 uppercase">Scenario 2 (Recommended)</span>
                <h3 className="font-bold text-white text-sm mt-0.5">Solar PV (Grid-Tied)</h3>
                <div className="mt-4 space-y-2 text-xs">
                  <div className="flex justify-between text-slate-400">
                    <span>System Capacity:</span>
                    <span className="font-mono font-bold text-amber-300">{solarSummary.solar_sizing?.suggested_solar_capacity_kw} kW</span>
                  </div>
                  <div className="flex justify-between text-slate-400">
                    <span>Initial Investment:</span>
                    <span className="font-mono text-slate-200">₹{solarSummary.scenarios_comparison?.scenario_2_solar_grid_tied?.initial_capex_inr?.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-slate-400">
                    <span>Annual Savings:</span>
                    <span className="font-mono text-emerald-400 font-bold">₹{solarSummary.scenarios_comparison?.scenario_2_solar_grid_tied?.annual_savings_inr?.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-slate-400 border-t border-slate-800 pt-2">
                    <span>Payback Period:</span>
                    <span className="font-mono font-bold text-amber-400">{solarSummary.scenarios_comparison?.scenario_2_solar_grid_tied?.payback_years} Years</span>
                  </div>
                </div>
              </div>

              {/* Scenario 3: Solar + BESS */}
              <div className="rounded-xl border border-indigo-500/30 bg-indigo-950/10 p-4">
                <span className="text-[10px] font-bold text-indigo-400 uppercase">Scenario 3</span>
                <h3 className="font-bold text-white text-sm mt-0.5">Solar + Battery Storage</h3>
                <div className="mt-4 space-y-2 text-xs">
                  <div className="flex justify-between text-slate-400">
                    <span>Battery Capacity:</span>
                    <span className="font-mono font-bold text-indigo-300">
                      {solarSummary.battery_storage_sizing?.suggested_battery_capacity_kwh} kWh ({solarSummary.battery_storage_sizing?.battery_amp_hours_48v} Ah @ 48V)
                    </span>
                  </div>
                  <div className="flex justify-between text-slate-400">
                    <span>Initial Capex:</span>
                    <span className="font-mono text-slate-200">₹{solarSummary.scenarios_comparison?.scenario_3_solar_hybrid_battery?.initial_capex_inr?.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-slate-400">
                    <span>Grid Reliance:</span>
                    <span className="font-mono text-emerald-400 font-bold">Only {solarSummary.scenarios_comparison?.scenario_3_solar_hybrid_battery?.grid_reliance_pct}%</span>
                  </div>
                  <div className="flex justify-between text-slate-400 border-t border-slate-800 pt-2">
                    <span>Payback Period:</span>
                    <span className="font-mono text-indigo-300">{solarSummary.scenarios_comparison?.scenario_3_solar_hybrid_battery?.payback_years} Years</span>
                  </div>
                </div>
              </div>
            </div>

            <p className="text-[11px] text-slate-500 leading-relaxed">
              {solarSummary.disclaimer}
            </p>
          </div>
        </div>
      )}

      {/* Tab 6: EV Charging Planner */}
      {activeTab === 'ev' && (
        <div className="space-y-6">
          <div className="rounded-2xl border border-slate-800 bg-slate-900/90 p-5 shadow-lg">
            <h2 className="text-base font-bold text-white mb-2 flex items-center gap-2">
              <Car className="h-5 w-5 text-teal-400" />
              EV Charging Infrastructure & Peak Load Planner
            </h2>
            <p className="text-xs text-slate-400 mb-6">
              Plan commercial, residential or fleet charging stations without overloading facility transformers.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 rounded-xl bg-slate-950 border border-slate-800 mb-6">
              <div>
                <label className="text-[11px] font-semibold text-slate-400">Charger Rating</label>
                <select
                  value={evChargerType}
                  onChange={(e) => setEvChargerType(e.target.value)}
                  className="mt-1 w-full rounded-lg bg-slate-900 border border-slate-700 px-3 py-1.5 text-xs text-slate-200"
                >
                  <option value="3.3">3.3 kW Slow AC (16A Single Phase)</option>
                  <option value="7.4">7.4 kW Level-2 AC Wallbox (32A Single Phase)</option>
                  <option value="22.0">22 kW Fast AC (3-Phase Commercial)</option>
                  <option value="60.0">60 kW Dual-Gun DC Fast Charger</option>
                </select>
              </div>

              <div>
                <label className="text-[11px] font-semibold text-slate-400">Number of Chargers</label>
                <input
                  type="number"
                  min="1"
                  max="50"
                  value={evChargerCount}
                  onChange={(e) => setEvChargerCount(parseInt(e.target.value) || 1)}
                  className="mt-1 w-full rounded-lg bg-slate-900 border border-slate-700 px-3 py-1.5 text-xs text-slate-200"
                />
              </div>

              <div className="flex items-end">
                <button
                  onClick={() => runCalculations(selectedProjectId)}
                  className="w-full rounded-lg bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold px-3 py-1.5 text-xs"
                >
                  Update EV Load Simulation
                </button>
              </div>
            </div>

            {/* EV Results Metrics */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
                <p className="text-[10px] font-bold text-slate-400 uppercase">Monthly EV Energy</p>
                <p className="text-lg font-black text-teal-400 mt-1">{evSummary.summary?.monthly_charging_kwh?.toLocaleString()} kWh</p>
              </div>
              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
                <p className="text-[10px] font-bold text-slate-400 uppercase">Monthly EV Cost</p>
                <p className="text-lg font-black text-emerald-400 mt-1">₹{evSummary.summary?.monthly_charging_cost_inr?.toLocaleString()}</p>
              </div>
              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
                <p className="text-[10px] font-bold text-slate-400 uppercase">Coincident Peak Draw</p>
                <p className="text-lg font-black text-amber-400 mt-1">{evSummary.summary?.ev_coincident_peak_demand_kw} kW</p>
              </div>
              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
                <p className="text-[10px] font-bold text-slate-400 uppercase">Peak Increase</p>
                <p className="text-lg font-black text-rose-400 mt-1">+{evSummary.summary?.peak_demand_increase_pct}%</p>
              </div>
            </div>

            {/* Load Management Strategies */}
            <div className="space-y-3">
              <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider">Smart Load Management Opportunities</h3>
              {evSummary.load_management_strategies?.map((strat, i) => (
                <div key={i} className="p-3 rounded-xl bg-slate-950 border border-slate-800 flex items-start justify-between gap-4">
                  <div>
                    <p className="text-xs font-bold text-white">{strat.strategy}</p>
                    <p className="text-[11px] text-slate-400 mt-0.5">{strat.impact}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <span className="text-xs font-mono font-bold text-emerald-400">Saves ₹{strat.benefit_inr?.toLocaleString()}/mo</span>
                    <div className="text-[10px] text-teal-400">Shaves {strat.peak_shaving_kw} kW peak</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Tab 7: Multi-Scenario Comparison */}
      {activeTab === 'scenarios' && (
        <div className="space-y-6">
          <div className="rounded-2xl border border-slate-800 bg-slate-900/90 p-5 shadow-lg">
            <h2 className="text-base font-bold text-white mb-2 flex items-center gap-2">
              <Compass className="h-5 w-5 text-indigo-400" />
              Comparative Scenario Analysis (Up to 3 Scenarios)
            </h2>
            <p className="text-xs text-slate-400 mb-6">
              Compare equipment capital costs, construction power, operational bills, and 5-year Total Cost of Ownership (TCO).
            </p>

            <div className="overflow-x-auto mb-6">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-950 text-[11px] font-bold uppercase tracking-wider text-slate-400 border-b border-slate-800">
                  <tr>
                    <th className="py-3 px-4">Metric / Dimension</th>
                    {calcResults?.scenario_comparisons?.comparisons?.map((sc, i) => (
                      <th key={i} className="py-3 px-4 font-bold text-white">
                        {sc.name}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  <tr>
                    <td className="py-3 px-4 text-slate-400">Equipment Purchase Cost</td>
                    {calcResults?.scenario_comparisons?.comparisons?.map((sc, i) => (
                      <td key={i} className="py-3 px-4 font-mono font-semibold text-slate-200">
                        ₹{sc.appliance_purchase_cost_inr?.toLocaleString()}
                      </td>
                    ))}
                  </tr>
                  <tr>
                    <td className="py-3 px-4 text-slate-400">Construction Electricity Budget</td>
                    {calcResults?.scenario_comparisons?.comparisons?.map((sc, i) => (
                      <td key={i} className="py-3 px-4 font-mono text-slate-300">
                        ₹{sc.construction_electricity_cost_inr?.toLocaleString()}
                      </td>
                    ))}
                  </tr>
                  <tr>
                    <td className="py-3 px-4 text-slate-400">Monthly Operational Energy</td>
                    {calcResults?.scenario_comparisons?.comparisons?.map((sc, i) => (
                      <td key={i} className="py-3 px-4 font-mono font-bold text-cyan-400">
                        {sc.net_grid_monthly_kwh?.toLocaleString()} kWh
                      </td>
                    ))}
                  </tr>
                  <tr>
                    <td className="py-3 px-4 text-slate-400">Monthly Electricity Bill</td>
                    {calcResults?.scenario_comparisons?.comparisons?.map((sc, i) => (
                      <td key={i} className="py-3 px-4 font-mono font-bold text-emerald-400">
                        ₹{sc.monthly_electricity_bill_inr?.toLocaleString()}
                      </td>
                    ))}
                  </tr>
                  <tr>
                    <td className="py-3 px-4 text-slate-400">Peak Demand Draw</td>
                    {calcResults?.scenario_comparisons?.comparisons?.map((sc, i) => (
                      <td key={i} className="py-3 px-4 font-mono text-amber-300">
                        {sc.peak_demand_kw} kW
                      </td>
                    ))}
                  </tr>
                  <tr className="bg-slate-950/60 font-bold">
                    <td className="py-3 px-4 text-white">5-Year Total Cost of Ownership (TCO)</td>
                    {calcResults?.scenario_comparisons?.comparisons?.map((sc, i) => (
                      <td key={i} className="py-3 px-4 font-mono font-black text-indigo-400 text-sm">
                        ₹{sc.five_year_tco_inr?.toLocaleString()}
                      </td>
                    ))}
                  </tr>
                  <tr>
                    <td className="py-3 px-4 text-slate-400">5-Year Net Savings vs Baseline</td>
                    {calcResults?.scenario_comparisons?.comparisons?.map((sc, i) => (
                      <td key={i} className="py-3 px-4 font-mono font-bold text-emerald-400">
                        {sc.money_saved_5yr_vs_baseline > 0 ? `+₹${sc.money_saved_5yr_vs_baseline?.toLocaleString()}` : '--'}
                      </td>
                    ))}
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Visual TCO Comparison Bar Chart */}
            <div className="h-64 mt-6">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={calcResults?.scenario_comparisons?.chart_data || []}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                  <XAxis dataKey="name" stroke="#64748b" tick={{ fontSize: 11 }} />
                  <YAxis stroke="#64748b" tick={{ fontSize: 10 }} unit=" ₹" />
                  <Tooltip formatter={(value) => [`₹${Number(value).toLocaleString()}`, 'Cost']} />
                  <Legend />
                  <Bar dataKey="purchase_cost" name="Equipment Capex" fill="#6366f1" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="annual_bill" name="Annual Electric Bill" fill="#10b981" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="five_year_tco" name="5-Year TCO" fill="#f59e0b" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}

      {/* Tab 8: Actionable Recommendations */}
      {activeTab === 'recommendations' && (
        <div className="space-y-4">
          <div>
            <h2 className="text-base font-bold text-white">Actionable Energy Optimization Recommendations</h2>
            <p className="text-xs text-slate-400">
              Calculated savings based on actual equipment inventory, BEE ratings, and DISCOM tariff slots.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {calcResults?.recommendations?.map((r, i) => (
              <div key={i} className="rounded-2xl border border-slate-800 bg-slate-900/90 p-5 shadow-lg flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="rounded bg-emerald-500/10 border border-emerald-500/30 px-2 py-0.5 text-[10px] font-bold text-emerald-400">
                      {r.category}
                    </span>
                    <span className="text-[10px] font-semibold text-slate-400">
                      Priority: <span className="text-amber-400">{r.priority}</span>
                    </span>
                  </div>
                  <h3 className="text-sm font-bold text-white mb-1.5">{r.title}</h3>
                  <p className="text-xs text-slate-400 leading-relaxed mb-4">{r.reason}</p>

                  <div className="grid grid-cols-2 gap-2 p-3 rounded-xl bg-slate-950 border border-slate-800 mb-4 text-xs">
                    <div>
                      <span className="text-slate-500 block">Monthly Savings:</span>
                      <span className="font-mono font-bold text-emerald-400">
                        ₹{r.money_saved_monthly_inr?.toLocaleString()} ({r.units_saved_monthly_kwh} kWh)
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-500 block">Payback Period:</span>
                      <span className="font-mono font-bold text-slate-200">
                        {r.payback_period_months === 0 ? 'Immediate (Zero Capex)' : `${r.payback_period_months} Months`}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="space-y-1">
                  <p className="text-[10px] font-bold text-slate-500 uppercase">Implementation Steps:</p>
                  <ul className="text-[11px] text-slate-300 space-y-1 list-disc pl-4">
                    {r.action_steps?.map((step, si) => (
                      <li key={si}>{step}</li>
                    ))}
                  </ul>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab 9: Demand Prediction Integration */}
      {activeTab === 'predictions' && (
        <div className="space-y-6">
          <div className="rounded-2xl border border-slate-800 bg-slate-900/90 p-5 shadow-lg">
            <h2 className="text-base font-bold text-white mb-2 flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-emerald-400" />
              Multi-Horizon Demand Forecasting Engine
            </h2>
            <p className="text-xs text-slate-400 mb-6">
              Synthesized from equipment duty factors, diurnal load profiles, and seasonal temperatures.
            </p>

            {/* Horizon Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800">
                <span className="text-[10px] font-bold text-emerald-400 uppercase">Next 24 Hours</span>
                <p className="text-xl font-black text-white mt-1">
                  {calcResults?.prediction_integration?.next_24_hours?.total_kwh} kWh
                </p>
                <p className="text-[10px] text-slate-500 mt-1">
                  Peak: {calcResults?.prediction_integration?.next_24_hours?.peak_demand_kw} kW ({calcResults?.prediction_integration?.next_24_hours?.peak_window})
                </p>
              </div>

              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800">
                <span className="text-[10px] font-bold text-cyan-400 uppercase">Next 7 Days</span>
                <p className="text-xl font-black text-white mt-1">
                  {calcResults?.prediction_integration?.next_7_days?.total_kwh} kWh
                </p>
                <p className="text-[10px] text-slate-500 mt-1">
                  Est. Cost: ₹{calcResults?.prediction_integration?.next_7_days?.estimated_cost_inr?.toLocaleString()}
                </p>
              </div>

              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800">
                <span className="text-[10px] font-bold text-indigo-400 uppercase">Next 30 Days (Cycle)</span>
                <p className="text-xl font-black text-white mt-1">
                  {calcResults?.prediction_integration?.next_30_days?.total_kwh} kWh
                </p>
                <p className="text-[10px] text-slate-500 mt-1">
                  Est. Bill: ₹{calcResults?.prediction_integration?.next_30_days?.estimated_cost_inr?.toLocaleString()}
                </p>
              </div>

              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800">
                <span className="text-[10px] font-bold text-amber-400 uppercase">Annual Projection</span>
                <p className="text-xl font-black text-white mt-1">
                  {calcResults?.prediction_integration?.annual_projection?.total_kwh?.toLocaleString()} kWh
                </p>
                <p className="text-[10px] text-slate-500 mt-1">
                  Est. Annual: ₹{calcResults?.prediction_integration?.annual_projection?.estimated_cost_inr?.toLocaleString()}
                </p>
              </div>
            </div>

            {/* High Demand Warning Banner */}
            {calcResults?.prediction_integration?.high_demand_warning && (
              <div className="p-4 rounded-xl bg-amber-950/20 border border-amber-500/30 flex items-center gap-3 text-xs text-amber-200">
                <AlertTriangle className="h-5 w-5 text-amber-400 shrink-0" />
                <span>{calcResults.prediction_integration.warning_message}</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* Modal: 3-Step Construction-Based Energy Planning Wizard */}
      {/* ------------------------------------------------------------- */}
      {showNewProjectModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="w-full max-w-4xl rounded-3xl border border-slate-800 bg-slate-900 p-6 md:p-8 shadow-2xl space-y-6 my-8 max-h-[92vh] overflow-y-auto">
            {/* Header & Step Tracker */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="rounded-full bg-emerald-500/20 text-emerald-300 text-[10px] font-black px-2.5 py-0.5 border border-emerald-500/40 tracking-wider">
                    ELECTROWISE STUDIO
                  </span>
                  <span className="text-xs text-slate-400 font-medium">Construction-Based Electricity Demand Prediction</span>
                </div>
                <h3 className="text-xl font-black text-white">
                  {wizardStep === 1 && 'Step 1: Select Type of Construction'}
                  {wizardStep === 2 && `Step 2: ${selectedConstructionType} Specifications & Appliances`}
                  {wizardStep === 3 && `Step 3: Electricity Demand & Cost Prediction Results`}
                </h3>
              </div>
              <div className="flex items-center gap-3">
                {/* Step Badges */}
                <div className="flex items-center gap-1.5 text-xs">
                  <span className={`px-2.5 py-1 rounded-lg font-bold transition-all ${wizardStep === 1 ? 'bg-emerald-500 text-slate-950' : 'bg-slate-800 text-slate-400'}`}>1. Type</span>
                  <span className="text-slate-600">→</span>
                  <span className={`px-2.5 py-1 rounded-lg font-bold transition-all ${wizardStep === 2 ? 'bg-emerald-500 text-slate-950' : 'bg-slate-800 text-slate-400'}`}>2. Form & Loads</span>
                  <span className="text-slate-600">→</span>
                  <span className={`px-2.5 py-1 rounded-lg font-bold transition-all ${wizardStep === 3 ? 'bg-emerald-500 text-slate-950' : 'bg-slate-800 text-slate-400'}`}>3. Prediction</span>
                </div>
                <button
                  onClick={handleCloseWizard}
                  className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-white transition-colors"
                >
                  ✕
                </button>
              </div>
            </div>

            {/* STEP 1: SELECT CONSTRUCTION TYPE */}
            {wizardStep === 1 && (
              <div className="space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <p className="text-xs text-slate-300">
                    Choose your building facility category to calibrate appliance power ratings, operating diversity, and temporary power sizing:
                  </p>
                  <div className="relative w-full sm:w-64">
                    <Search className="h-3.5 w-3.5 absolute left-3 top-2.5 text-slate-400" />
                    <input
                      type="text"
                      placeholder="Search construction types..."
                      value={wizardSearch}
                      onChange={(e) => setWizardSearch(e.target.value)}
                      className="w-full rounded-xl bg-slate-950 border border-slate-700 pl-9 pr-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4 pt-1">
                  {Object.values(CONSTRUCTION_TYPES_DATA)
                    .filter((ct) => !wizardSearch || ct.name.toLowerCase().includes(wizardSearch.toLowerCase()) || ct.tagline.toLowerCase().includes(wizardSearch.toLowerCase()))
                    .map((ct) => (
                      <Construction3DCard
                        key={ct.name}
                        constructionType={{
                          ...ct,
                          desc: ct.tagline,
                          powerDensity: ct.fields?.length ? `${ct.fields.length} Custom Specs` : 'Calibrated Load',
                          peakHours: ct.peakHours || 'Peak ToD Sizing'
                        }}
                        isSelected={selectedConstructionType === ct.name}
                        onSelect={(name) => handleSelectConstructionType(name)}
                      />
                    ))}
                </div>
              </div>
            )}

            {/* STEP 2: DYNAMIC FORM & APPLIANCES */}
            {wizardStep === 2 && (
              <form onSubmit={handleWizardSubmit} className="space-y-6 text-xs">
                {/* Selected Type Header Banner */}
                <div className="flex items-center justify-between rounded-2xl bg-emerald-500/10 border border-emerald-500/30 p-3.5">
                  <div className="flex items-center gap-3">
                    <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/40">
                      {React.createElement(CONSTRUCTION_TYPES_DATA[selectedConstructionType]?.icon || Building2, { className: 'h-5 w-5' })}
                    </span>
                    <div>
                      <span className="font-bold text-white text-sm">{selectedConstructionType}</span>
                      <p className="text-[11px] text-emerald-300/80">
                        {CONSTRUCTION_TYPES_DATA[selectedConstructionType]?.tagline}
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setWizardStep(1)}
                    className="text-xs font-semibold text-emerald-400 hover:underline px-2.5 py-1 rounded bg-slate-900/80 border border-slate-700"
                  >
                    Change Type
                  </button>
                </div>

                {wizardError && (
                  <div className="rounded-2xl bg-rose-500/15 border border-rose-500/40 p-4 flex items-start gap-3 text-xs text-rose-200 shadow-lg">
                    <AlertTriangle className="h-5 w-5 text-rose-400 shrink-0 mt-0.5" />
                    <div className="space-y-0.5">
                      <p className="font-bold text-rose-100">Validation Notice</p>
                      <p className="text-rose-200/90 leading-relaxed">{wizardError}</p>
                    </div>
                  </div>
                )}

                {/* Section A: Building Core Parameters */}
                <div className="space-y-3">
                  <h4 className="font-bold text-white text-xs uppercase tracking-wider flex items-center gap-2 border-b border-slate-800 pb-1.5">
                    <Building2 className="h-4 w-4 text-emerald-400" />
                    1. Building Parameters & Dimensions
                  </h4>

                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3.5">
                    <div>
                      <label className="text-slate-300 block mb-1 font-semibold">Project / Building Name *</label>
                      <input
                        type="text"
                        required
                        value={newProjectForm.name}
                        onChange={(e) => setNewProjectForm({ ...newProjectForm, name: e.target.value })}
                        className="w-full rounded-xl bg-slate-950 border border-slate-700 px-3 py-2 text-slate-200 focus:outline-none focus:border-emerald-500"
                      />
                    </div>

                    <div>
                      <label className="text-slate-300 block mb-1 font-semibold">Location (City, State) *</label>
                      <input
                        type="text"
                        required
                        value={newProjectForm.location}
                        onChange={(e) => setNewProjectForm({ ...newProjectForm, location: e.target.value })}
                        className="w-full rounded-xl bg-slate-950 border border-slate-700 px-3 py-2 text-slate-200 focus:outline-none focus:border-emerald-500"
                      />
                    </div>

                    <div>
                      <label className="text-slate-300 block mb-1 font-semibold">Building Area (square feet) *</label>
                      <input
                        type="number"
                        required
                        min="100"
                        value={newProjectForm.built_up_area}
                        onChange={(e) => setNewProjectForm({ ...newProjectForm, built_up_area: e.target.value })}
                        className="w-full rounded-xl bg-slate-950 border border-slate-700 px-3 py-2 text-slate-200 focus:outline-none focus:border-emerald-500"
                      />
                    </div>

                    <div>
                      <label className="text-slate-300 block mb-1 font-semibold">Number of Floors *</label>
                      <input
                        type="number"
                        required
                        min="1"
                        value={newProjectForm.floors_count}
                        onChange={(e) => setNewProjectForm({ ...newProjectForm, floors_count: e.target.value })}
                        className="w-full rounded-xl bg-slate-950 border border-slate-700 px-3 py-2 text-slate-200 focus:outline-none focus:border-emerald-500"
                      />
                    </div>

                    <div>
                      <label className="text-slate-300 block mb-1 font-semibold">Expected Occupants / Staff *</label>
                      <input
                        type="number"
                        required
                        min="1"
                        value={newProjectForm.occupancy}
                        onChange={(e) => setNewProjectForm({ ...newProjectForm, occupancy: e.target.value })}
                        className="w-full rounded-xl bg-slate-950 border border-slate-700 px-3 py-2 text-slate-200 focus:outline-none focus:border-emerald-500"
                      />
                    </div>

                    <div>
                      <label className="text-slate-300 block mb-1 font-semibold">Daily Operating Hours *</label>
                      <input
                        type="number"
                        required
                        min="1"
                        max="24"
                        value={newProjectForm.daily_operating_hours}
                        onChange={(e) => setNewProjectForm({ ...newProjectForm, daily_operating_hours: e.target.value })}
                        className="w-full rounded-xl bg-slate-950 border border-slate-700 px-3 py-2 text-slate-200 focus:outline-none focus:border-emerald-500"
                      />
                    </div>

                    <div>
                      <label className="text-slate-300 block mb-1 font-semibold">Air Conditioning Availability *</label>
                      <select
                        value={newProjectForm.ac_type || 'Split / Window Inverter ACs'}
                        onChange={(e) => setNewProjectForm({ ...newProjectForm, ac_type: e.target.value })}
                        className="w-full rounded-xl bg-slate-950 border border-slate-700 px-3 py-2 text-slate-200 focus:outline-none focus:border-emerald-500"
                      >
                        <option value="Central Chiller HVAC Plant">Central Chiller HVAC Plant (Water/Air Cooled)</option>
                        <option value="Split / Window Inverter ACs">Split / Window Inverter Units</option>
                        <option value="VRV / VRF Multi-Split System">VRV / VRF Variable Refrigerant Flow System</option>
                        <option value="Natural Ventilation / Fans Only">Natural Ventilation / High-Volume Fans Only</option>
                      </select>
                    </div>

                    <div>
                      <label className="text-slate-300 block mb-1 font-semibold">Estimated Monthly Operating Days *</label>
                      <select
                        value={newProjectForm.operating_days_per_month}
                        onChange={(e) => setNewProjectForm({ ...newProjectForm, operating_days_per_month: e.target.value })}
                        className="w-full rounded-xl bg-slate-950 border border-slate-700 px-3 py-2 text-slate-200 focus:outline-none focus:border-emerald-500"
                      >
                        <option value="20">20 Days (Weekday Standard)</option>
                        <option value="24">24 Days (6-Day Working)</option>
                        <option value="26">26 Days (High Industrial)</option>
                        <option value="30">30 Days (Continuous 24/7)</option>
                      </select>
                    </div>

                    <div>
                      <label className="text-slate-300 block mb-1 font-semibold">State DISCOM Tariff Schedule *</label>
                      <select
                        value={newProjectForm.discom}
                        onChange={(e) => setNewProjectForm({ ...newProjectForm, discom: e.target.value })}
                        className="w-full rounded-xl bg-slate-950 border border-slate-700 px-3 py-2 text-slate-200 focus:outline-none focus:border-emerald-500"
                      >
                        {discoms.map((d) => (
                          <option key={d.code} value={d.code}>
                            {d.code} ({d.state})
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>

                {/* Section B: Tailored Subtype Dynamic Parameters */}
                {CONSTRUCTION_TYPES_DATA[selectedConstructionType]?.fields?.length > 0 && (
                  <div className="space-y-3">
                    <h4 className="font-bold text-white text-xs uppercase tracking-wider flex items-center gap-2 border-b border-slate-800 pb-1.5">
                      <Sliders className="h-4 w-4 text-indigo-400" />
                      2. {selectedConstructionType}-Specific Parameters
                    </h4>

                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3.5">
                      {CONSTRUCTION_TYPES_DATA[selectedConstructionType].fields.map((fld) => (
                        <div key={fld.id}>
                          <label className="text-slate-300 block mb-1 font-semibold">{fld.label}</label>
                          {fld.type === 'boolean' ? (
                            <select
                              value={facilityParams[fld.id] !== undefined ? String(facilityParams[fld.id]) : String(fld.default)}
                              onChange={(e) => setFacilityParams({ ...facilityParams, [fld.id]: e.target.value === 'true' })}
                              className="w-full rounded-xl bg-slate-950 border border-slate-700 px-3 py-2 text-slate-200 focus:outline-none focus:border-emerald-500"
                            >
                              <option value="true">Yes / Included</option>
                              <option value="false">No / Excluded</option>
                            </select>
                          ) : fld.type === 'select' ? (
                            <select
                              value={facilityParams[fld.id] || fld.default}
                              onChange={(e) => setFacilityParams({ ...facilityParams, [fld.id]: e.target.value })}
                              className="w-full rounded-xl bg-slate-950 border border-slate-700 px-3 py-2 text-slate-200 focus:outline-none focus:border-emerald-500"
                            >
                              {fld.options.map((opt) => (
                                <option key={opt} value={opt}>{opt}</option>
                              ))}
                            </select>
                          ) : (
                            <input
                              type={fld.type}
                              value={facilityParams[fld.id] !== undefined ? facilityParams[fld.id] : fld.default}
                              onChange={(e) => setFacilityParams({ ...facilityParams, [fld.id]: fld.type === 'number' ? Number(e.target.value) : e.target.value })}
                              className="w-full rounded-xl bg-slate-950 border border-slate-700 px-3 py-2 text-slate-200 focus:outline-none focus:border-emerald-500"
                            />
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Section C: Electrical Appliances & Machinery Equipment Checklist */}
                <div className="space-y-3">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-1.5">
                    <div>
                      <h4 className="font-bold text-white text-xs uppercase tracking-wider flex items-center gap-2">
                        <Zap className="h-4 w-4 text-amber-400" />
                        3. Electrical Appliances & Major Machinery Equipment
                      </h4>
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        Calibrated appliance package pre-configured for {selectedConstructionType}. Toggle inclusion, tweak ratings, or add custom loads.
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={handleAddCustomAppliance}
                      className="inline-flex items-center gap-1 rounded-lg bg-slate-800 hover:bg-slate-700 px-2.5 py-1 text-[11px] font-semibold text-emerald-400 border border-slate-700 transition-colors shrink-0"
                    >
                      <Plus className="h-3 w-3" />
                      <span>+ Add Appliance Row</span>
                    </button>
                  </div>

                  <div className="border border-slate-800 rounded-2xl bg-slate-950/70 overflow-hidden">
                    <div className="max-h-60 overflow-y-auto divide-y divide-slate-800/80">
                      {selectedAppliances.map((app, idx) => (
                        <div key={idx} className={`p-3 flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs transition-colors ${app.checked ? 'bg-slate-900/40' : 'opacity-50 bg-slate-950'}`}>
                          <div className="flex items-center gap-3">
                            <input
                              type="checkbox"
                              checked={app.checked}
                              onChange={() => handleToggleAppliance(idx)}
                              className="h-4 w-4 rounded border-slate-700 text-emerald-500 focus:ring-emerald-500 shrink-0"
                            />
                            <div>
                              <div className="flex items-center gap-2">
                                <span className={`font-semibold ${app.checked ? 'text-slate-100' : 'text-slate-400 line-through'}`}>{app.name}</span>
                                <span className="rounded bg-slate-800 px-1.5 py-0.5 text-[9px] text-slate-400 font-bold">{app.category}</span>
                              </div>
                            </div>
                          </div>

                          <div className="flex flex-wrap items-center gap-3 pl-7 md:pl-0">
                            <div className="flex items-center gap-1">
                              <span className="text-[10px] text-slate-500">Power:</span>
                              <input
                                type="number"
                                min="1"
                                value={app.rated_power_w}
                                onChange={(e) => handleUpdateAppliance(idx, 'rated_power_w', Number(e.target.value))}
                                className="w-20 rounded bg-slate-950 border border-slate-700 px-2 py-0.5 text-[11px] text-slate-200 font-mono"
                              />
                              <span className="text-[10px] text-slate-400">W</span>
                            </div>

                            <div className="flex items-center gap-1">
                              <span className="text-[10px] text-slate-500">Qty:</span>
                              <input
                                type="number"
                                min="1"
                                value={app.quantity}
                                onChange={(e) => handleUpdateAppliance(idx, 'quantity', Number(e.target.value))}
                                className="w-14 rounded bg-slate-950 border border-slate-700 px-2 py-0.5 text-[11px] text-slate-200 font-mono"
                              />
                            </div>

                            <div className="flex items-center gap-1">
                              <span className="text-[10px] text-slate-500">Hrs/day:</span>
                              <input
                                type="number"
                                min="0.5"
                                max="24"
                                step="0.5"
                                value={app.daily_hours}
                                onChange={(e) => handleUpdateAppliance(idx, 'daily_hours', Number(e.target.value))}
                                className="w-14 rounded bg-slate-950 border border-slate-700 px-2 py-0.5 text-[11px] text-slate-200 font-mono"
                              />
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Form Footer */}
                <div className="flex items-center justify-between gap-3 pt-4 border-t border-slate-800">
                  <button
                    type="button"
                    onClick={() => setWizardStep(1)}
                    className="inline-flex items-center gap-1.5 rounded-xl border border-slate-700 px-4 py-2.5 text-slate-300 hover:text-white hover:bg-slate-800 transition-colors font-semibold"
                  >
                    <ArrowLeft className="h-3.5 w-3.5" />
                    <span>Back to Types</span>
                  </button>

                  <button
                    type="submit"
                    disabled={submittingWizard}
                    className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-emerald-500 via-teal-400 to-emerald-400 px-6 py-2.5 text-xs font-bold text-slate-950 shadow-lg shadow-emerald-500/20 hover:from-emerald-400 hover:to-teal-300 transition-all hover:scale-[1.02] disabled:opacity-50"
                  >
                    {submittingWizard && <span className="h-3.5 w-3.5 rounded-full border-2 border-slate-950 border-t-transparent animate-spin"></span>}
                    <span>{submittingWizard ? 'Simulating Loads & Tariffs...' : 'Calculate & Generate Energy Plan →'}</span>
                  </button>
                </div>
              </form>
            )}

            {/* STEP 3: PREDICTION RESULTS DISPLAY */}
            {wizardStep === 3 && wizardResult && (() => {
              const pred = wizardResult.facilityPrediction || wizardResult.calculations?.facility_prediction;
              const summary = pred?.summary || wizardResult.calculations?.equipment_analysis?.summary || {};
              const tariff = pred?.tariff_details || wizardResult.calculations?.tariff_analysis || {};
              const peakWindow = pred?.peak_demand?.peak_window || CONSTRUCTION_TYPES_DATA[wizardResult.constructionType]?.peakHours || '10:00 – 18:00 (Business Peak)';
              const categoryBreakdown = pred?.category_breakdown || summary.category_breakdown || [];
              const sensitivityDrivers = pred?.sensitivity_drivers || [];
              const assumptions = pred?.assumptions || [];
              const recommendations = pred?.recommendations || wizardResult.calculations?.recommendations || [];

              const dailyKwh = summary.daily_kwh ?? summary.total_daily_kwh ?? 0;
              const monthlyKwh = summary.monthly_kwh ?? summary.total_monthly_kwh ?? 0;
              const avgDemandKw = summary.avg_demand_kw ?? (dailyKwh > 0 ? (dailyKwh / (wizardResult.project?.daily_operating_hours || 12)) : 0);
              const peakKw = summary.peak_load_kw ?? summary.total_operational_peak_kw ?? 0;
              const connCapacityKva = summary.connection_capacity_kva ?? (peakKw > 0 ? Math.round((peakKw / 0.88) * 1.15 * 10) / 10 : 0);
              const monthlyBill = summary.estimated_monthly_bill_inr ?? tariff.total_estimated_monthly_bill ?? 0;
              const effectiveRate = summary.effective_tariff_rate_inr ?? tariff.effective_rate_per_kwh ?? 7.50;

              return (
                <div className="space-y-6 text-xs">
                  {/* Result Hero Banner */}
                  <div className="rounded-2xl bg-gradient-to-r from-emerald-950/70 via-slate-900 to-slate-900 p-5 border border-emerald-500/40 shadow-xl space-y-2">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="h-5 w-5 text-emerald-400 shrink-0" />
                        <span className="text-base font-black text-white">
                          {wizardResult.project?.name} — Facility Electricity Assessment
                        </span>
                      </div>
                      <span className="rounded-full bg-emerald-500/10 border border-emerald-500/30 px-2.5 py-0.5 text-[10px] font-bold text-emerald-300">
                        Input-Dependent Dynamic Sizing
                      </span>
                    </div>
                    <div className="flex flex-wrap items-center gap-3 text-xs text-slate-300 pl-7">
                      <span className="font-semibold text-emerald-400">{wizardResult.constructionType}</span>
                      <span>•</span>
                      <span>{wizardResult.project?.built_up_area?.toLocaleString()} sq ft</span>
                      <span>•</span>
                      <span>{wizardResult.project?.floors_count || 1} Floor{(wizardResult.project?.floors_count || 1) > 1 ? 's' : ''}</span>
                      <span>•</span>
                      <span>{wizardResult.project?.occupancy || 1} Occupants</span>
                      <span>•</span>
                      <span>{wizardResult.project?.daily_operating_hours || 12} hrs/day</span>
                      <span>•</span>
                      <span>{wizardResult.project?.location}</span>
                      <span>•</span>
                      <span className="font-mono text-cyan-300">{wizardResult.project?.discom} ({wizardResult.project?.tariff_category || 'Tariff'})</span>
                    </div>
                  </div>

                  {/* 6 Required Prediction Result Metrics */}
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3.5">
                    {/* 1. Daily Electricity Demand */}
                    <div className="rounded-2xl border border-slate-800 bg-slate-950/80 p-4 shadow-lg hover:border-emerald-500/30 transition-colors">
                      <div className="flex items-center justify-between text-slate-400 mb-1">
                        <span className="text-[11px] font-semibold">Estimated Daily Demand</span>
                        <Zap className="h-4 w-4 text-emerald-400" />
                      </div>
                      <p className="text-2xl font-black text-emerald-400 font-mono">
                        {dailyKwh.toFixed(1)}
                        <span className="text-xs font-normal text-slate-400 ml-1">kWh / day</span>
                      </p>
                      <span className="text-[10px] text-slate-400 mt-1 block">
                        Duty-cycle & occupancy calibrated
                      </span>
                    </div>

                    {/* 2. Monthly Electricity Consumption */}
                    <div className="rounded-2xl border border-slate-800 bg-slate-950/80 p-4 shadow-lg hover:border-cyan-500/30 transition-colors">
                      <div className="flex items-center justify-between text-slate-400 mb-1">
                        <span className="text-[11px] font-semibold">Estimated Monthly Consumption</span>
                        <Activity className="h-4 w-4 text-cyan-400" />
                      </div>
                      <p className="text-2xl font-black text-cyan-400 font-mono">
                        {monthlyKwh.toLocaleString(undefined, { maximumFractionDigits: 1 })}
                        <span className="text-xs font-normal text-slate-400 ml-1">kWh / month</span>
                      </p>
                      <span className="text-[10px] text-slate-400 mt-1 block">
                        Load diversity: {summary.diversity_factor ? (summary.diversity_factor * 100).toFixed(0) : 75}%
                      </span>
                    </div>

                    {/* 3. Average Demand in kW */}
                    <div className="rounded-2xl border border-slate-800 bg-slate-950/80 p-4 shadow-lg hover:border-amber-500/30 transition-colors">
                      <div className="flex items-center justify-between text-slate-400 mb-1">
                        <span className="text-[11px] font-semibold">Average Demand</span>
                        <Sliders className="h-4 w-4 text-amber-300" />
                      </div>
                      <p className="text-2xl font-black text-amber-300 font-mono">
                        {avgDemandKw.toFixed(2)}
                        <span className="text-xs font-normal text-slate-400 ml-1">kW</span>
                      </p>
                      <span className="text-[10px] text-slate-400 mt-1 block">
                        Operating load factor: {summary.load_factor_pct || 65}%
                      </span>
                    </div>

                    {/* 4. Estimated Peak Load */}
                    <div className="rounded-2xl border border-slate-800 bg-slate-950/80 p-4 shadow-lg hover:border-amber-500/30 transition-colors">
                      <div className="flex items-center justify-between text-slate-400 mb-1">
                        <span className="text-[11px] font-semibold">Estimated Peak Load</span>
                        <TrendingUp className="h-4 w-4 text-amber-400" />
                      </div>
                      <p className="text-2xl font-black text-amber-400 font-mono">
                        {peakKw.toFixed(2)}
                        <span className="text-xs font-normal text-slate-400 ml-1">kW</span>
                      </p>
                      <span className="text-[10px] text-slate-400 mt-1 block">
                        Coincident maximum draw
                      </span>
                    </div>

                    {/* 5. Recommended Connection Capacity in kVA */}
                    <div className="rounded-2xl border border-slate-800 bg-slate-950/80 p-4 shadow-lg hover:border-teal-500/30 transition-colors">
                      <div className="flex items-center justify-between text-slate-400 mb-1">
                        <span className="text-[11px] font-semibold">Recommended Connection Capacity</span>
                        <Building2 className="h-4 w-4 text-teal-400" />
                      </div>
                      <p className="text-2xl font-black text-teal-400 font-mono">
                        {typeof connCapacityKva === 'number' ? connCapacityKva.toFixed(1) : connCapacityKva}
                        <span className="text-xs font-normal text-slate-400 ml-1">kVA</span>
                      </p>
                      <span className="text-[10px] text-slate-400 mt-1 block">
                        Power factor: {summary.power_factor || 0.88} • 15% margin
                      </span>
                    </div>

                    {/* 6. Estimated Monthly Bill */}
                    <div className="rounded-2xl border border-slate-800 bg-slate-950/80 p-4 shadow-lg hover:border-emerald-500/30 transition-colors">
                      <div className="flex items-center justify-between text-slate-400 mb-1">
                        <span className="text-[11px] font-semibold">Estimated Monthly Bill</span>
                        <DollarSign className="h-4 w-4 text-emerald-400" />
                      </div>
                      <p className="text-2xl font-black text-emerald-300 font-mono">
                        ₹{Math.round(monthlyBill).toLocaleString('en-IN')}
                      </p>
                      <span className="text-[10px] text-slate-400 mt-1 block">
                        Effective rate: ₹{effectiveRate.toFixed(2)}/kWh ({tariff.tariff_category || 'Slab tariff'})
                      </span>
                    </div>
                  </div>

                  {/* Secondary Insights Row: Peak Window & Carbon Footprint */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                    <div className="rounded-2xl border border-slate-800 bg-slate-950/80 p-4 flex items-center gap-3">
                      <div className="p-2.5 rounded-xl bg-indigo-500/10 border border-indigo-500/30 text-indigo-400 shrink-0">
                        <Clock className="h-5 w-5" />
                      </div>
                      <div>
                        <span className="text-[11px] font-semibold text-slate-400 block">Expected Peak-Demand Time Window</span>
                        <p className="text-sm font-bold text-white mt-0.5">{peakWindow}</p>
                        <span className="text-[10px] text-slate-500">Coincident operating schedule with highest simultaneous load</span>
                      </div>
                    </div>

                    <div className="rounded-2xl border border-slate-800 bg-slate-950/80 p-4 flex items-center gap-3">
                      <div className="p-2.5 rounded-xl bg-teal-500/10 border border-teal-500/30 text-teal-400 shrink-0">
                        <Leaf className="h-5 w-5" />
                      </div>
                      <div>
                        <span className="text-[11px] font-semibold text-slate-400 block">Estimated Monthly Carbon Footprint</span>
                        <p className="text-sm font-bold text-white mt-0.5">
                          {(summary.carbon_kg_monthly || Math.round(monthlyKwh * 0.716)).toLocaleString()} kg CO2e / mo
                        </p>
                        <span className="text-[10px] text-slate-500">
                          Requires ~{summary.carbon_trees_offset || Math.round((monthlyKwh * 0.716) / 1.83)} mature tree offsets per month
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Consumption Breakdown by Major Usage Category */}
                  {categoryBreakdown.length > 0 && (
                    <div className="rounded-2xl border border-slate-800 bg-slate-950/70 p-4 space-y-3">
                      <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                        <h4 className="font-bold text-white text-xs uppercase tracking-wider flex items-center gap-2">
                          <Layers className="h-4 w-4 text-cyan-400" />
                          Estimated Consumption Breakdown by Major Usage Category
                        </h4>
                        <span className="text-[10px] text-slate-400">Total: {monthlyKwh.toLocaleString(undefined, { maximumFractionDigits: 1 })} kWh/mo</span>
                      </div>

                      <div className="space-y-2.5">
                        {categoryBreakdown.map((cat, idx) => (
                          <div key={idx} className="space-y-1">
                            <div className="flex items-center justify-between text-xs">
                              <span className="font-medium text-slate-200">{cat.category}</span>
                              <div className="flex items-center gap-3 font-mono">
                                <span className="text-slate-400 text-[11px]">{cat.daily_kwh ? `${cat.daily_kwh} kWh/d` : ''}</span>
                                <span className="font-bold text-cyan-300">{cat.monthly_kwh?.toLocaleString()} kWh/mo</span>
                                <span className="text-[10px] font-bold text-slate-400 w-12 text-right">({cat.pct_share}%)</span>
                              </div>
                            </div>
                            <div className="h-2 w-full rounded-full bg-slate-800 overflow-hidden">
                              <div
                                className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-teal-400"
                                style={{ width: `${Math.max(3, Math.min(100, cat.pct_share))}%` }}
                              />
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Input Sensitivity Drivers & Explicit Assumptions */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Sensitivity Drivers */}
                    <div className="rounded-2xl border border-slate-800 bg-slate-950/70 p-4 space-y-2.5">
                      <h4 className="font-bold text-white text-xs uppercase tracking-wider flex items-center gap-2 border-b border-slate-800 pb-2">
                        <TrendingUp className="h-4 w-4 text-amber-400" />
                        Key Input Sensitivity Drivers
                      </h4>
                      <p className="text-[11px] text-slate-400">
                        Factors with the greatest influence on {wizardResult.project?.name}'s energy profile:
                      </p>
                      <div className="space-y-2 pt-1">
                        {(sensitivityDrivers.length > 0 ? sensitivityDrivers : [
                          { factor: 'Building Floor Area', share_pct: 35, explanation: `Total built-up space directly scales baseline lighting and ambient cooling.` },
                          { factor: 'HVAC & AC Configuration', share_pct: 30, explanation: `Cooling thermal load scales with floor count and daily operating hours.` },
                          { factor: 'Daily Operating Hours', share_pct: 20, explanation: `Duration of active operations per day determines monthly cumulative kWh.` },
                          { factor: 'Equipment & Plug Loads', share_pct: 15, explanation: `Connected machinery, appliances, and tenant equipment duty cycles.` }
                        ]).map((drv, dIdx) => (
                          <div key={dIdx} className="rounded-xl border border-slate-850 bg-slate-900/60 p-2.5">
                            <div className="flex items-center justify-between mb-1">
                              <span className="font-semibold text-slate-200">{drv.factor}</span>
                              <span className="text-[10px] font-bold text-amber-400">~{drv.share_pct}% impact</span>
                            </div>
                            <p className="text-[11px] text-slate-400 leading-relaxed">{drv.explanation}</p>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Applied Engineering Assumptions */}
                    <div className="rounded-2xl border border-slate-800 bg-slate-950/70 p-4 space-y-2.5">
                      <h4 className="font-bold text-white text-xs uppercase tracking-wider flex items-center gap-2 border-b border-slate-800 pb-2">
                        <Sliders className="h-4 w-4 text-indigo-400" />
                        Applied Engineering Assumptions
                      </h4>
                      <p className="text-[11px] text-slate-400">
                        Default parameters applied based on {wizardResult.constructionType} standards (all adjustable):
                      </p>
                      <div className="space-y-1.5 pt-1 max-h-60 overflow-y-auto pr-1">
                        {(assumptions.length > 0 ? assumptions : [
                          `Load Diversity Factor: ${summary.diversity_factor || 0.75} coincident simultaneous utilization`,
                          `Power Factor: ${summary.power_factor || 0.88} lagging for commercial/residential loads`,
                          `Base Power Density: calibrated for ${wizardResult.constructionType}`,
                          `DISCOM Tariff: ${tariff.discom || 'BESCOM'} (${tariff.tariff_category || 'Standard'}) telescopic slab schedule`,
                          `Sizing Margin: 15% safety factor applied to recommended connection kVA`
                        ]).map((asm, aIdx) => (
                          <div key={aIdx} className="flex items-start gap-2 text-[11px] text-slate-300 bg-slate-900/40 p-2 rounded-lg border border-slate-800/80">
                            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 mt-1.5 shrink-0" />
                            <span>{asm}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Energy-Saving Recommendations */}
                  <div className="space-y-2.5">
                    <h4 className="font-bold text-white text-xs uppercase tracking-wider flex items-center gap-2 border-b border-slate-800 pb-1.5">
                      <Sparkles className="h-4 w-4 text-emerald-400" />
                      Targeted Energy-Saving Recommendations for {selectedConstructionType}
                    </h4>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {(recommendations.slice(0, 4) || []).map((rec, rIdx) => (
                        <div key={rIdx} className="rounded-xl border border-slate-800 bg-slate-950/70 p-3.5 space-y-1.5">
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-white text-xs">{rec.title}</span>
                            <span className="rounded bg-emerald-500/10 border border-emerald-500/30 px-1.5 py-0.5 text-[10px] font-bold text-emerald-400">
                              {rec.category || 'Efficiency'}
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-400 leading-relaxed">
                            {rec.description}
                          </p>
                          <div className="flex items-center gap-3 pt-1 text-[10px] text-slate-300 font-medium border-t border-slate-900">
                            <span className="text-emerald-400 font-bold">Save: ~₹{Math.round(rec.estimated_monthly_inr_savings || 450).toLocaleString('en-IN')}/mo</span>
                            <span>•</span>
                            <span>Payback: {rec.payback_period_years ? `${rec.payback_period_years} yrs` : 'Immediate'}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Engineering Estimate Disclosure */}
                  <div className="rounded-xl bg-slate-950/80 border border-slate-800 p-3.5 text-[11px] text-slate-400 flex items-start gap-2.5">
                    <ShieldAlert className="h-5 w-5 text-cyan-400 shrink-0 mt-0.5" />
                    <span>
                      <strong>Engineering Estimation Disclosure:</strong> All figures above represent pre-construction engineering simulations calculated from user-specified building dimensions, equipment ratings, duty cycles, load diversity factors, and official state DISCOM slab tariffs. These values are engineering estimates, distinct from measured utility meter data.
                    </span>
                  </div>

                  {/* Footer Action Buttons */}
                  <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-4 border-t border-slate-800">
                    <div className="flex items-center gap-2 w-full sm:w-auto">
                      <button
                        type="button"
                        onClick={() => setWizardStep(2)}
                        className="inline-flex items-center gap-1.5 rounded-xl border border-emerald-500/40 bg-emerald-500/10 px-4 py-2 text-emerald-300 hover:bg-emerald-500/20 transition-colors font-bold text-xs"
                      >
                        <ArrowLeft className="h-3.5 w-3.5" />
                        <span>← Adjust Inputs & Recalculate</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          handleCloseWizard();
                          navigate('/dashboard');
                        }}
                        className="rounded-xl border border-slate-700 bg-slate-800/80 px-4 py-2 text-slate-300 hover:text-white hover:bg-slate-750 transition-colors font-semibold text-xs"
                      >
                        Back to Dashboard
                      </button>
                    </div>

                    <div className="flex flex-wrap items-center gap-2.5 w-full sm:w-auto justify-end">
                      <button
                        type="button"
                        onClick={async () => {
                          if (!wizardResult?.project?.id) return;
                          try {
                            const repRes = await energyApi.downloadPdfReport(wizardResult.project.id);
                            const blob = new Blob([repRes.data], { type: 'application/pdf' });
                            const url = window.URL.createObjectURL(blob);
                            const a = document.createElement('a');
                            a.href = url;
                            a.download = `ElectroWise_Audit_${wizardResult.project.name.replace(/\s+/g, '_')}.pdf`;
                            a.click();
                          } catch (err) {
                            alert('Failed to download PDF report: ' + err.message);
                          }
                        }}
                        className="inline-flex items-center gap-1.5 rounded-xl border border-slate-700 bg-slate-800 px-4 py-2 font-bold text-slate-200 hover:text-white hover:bg-slate-700 transition-colors text-xs"
                      >
                        <Download className="h-3.5 w-3.5 text-emerald-400" />
                        <span>Download PDF Audit Report</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          setShowNewProjectModal(false);
                          setWizardStep(1);
                          setSearchParams({});
                        }}
                        className="inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-emerald-500 via-teal-400 to-emerald-400 px-5 py-2 font-black text-slate-950 shadow-md shadow-emerald-500/20 hover:from-emerald-400 hover:to-teal-300 transition-all text-xs"
                      >
                        <span>Open Full Planning Studio</span>
                        <ArrowRight className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })()}
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* Modal: Add Equipment Item Form */}
      {/* ------------------------------------------------------------- */}
      {showAddEquipmentModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4">
          <div className="w-full max-w-xl rounded-2xl border border-slate-800 bg-slate-900 p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-bold text-white">Add Equipment / Appliance</h3>
              <button onClick={() => setShowAddEquipmentModal(false)} className="text-slate-400 hover:text-white">✕</button>
            </div>

            <form onSubmit={handleAddEquipment} className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-400 block mb-1">Equipment Name</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. 2.0 Ton Inverter AC"
                    value={newEquipment.name}
                    onChange={(e) => setNewEquipment({ ...newEquipment, name: e.target.value })}
                    className="w-full rounded-lg bg-slate-950 border border-slate-700 px-3 py-1.5 text-slate-200"
                  />
                </div>
                <div>
                  <label className="text-slate-400 block mb-1">Category</label>
                  <select
                    value={newEquipment.category}
                    onChange={(e) => setNewEquipment({ ...newEquipment, category: e.target.value })}
                    className="w-full rounded-lg bg-slate-950 border border-slate-700 px-3 py-1.5 text-slate-200"
                  >
                    <option value="HVAC">HVAC & Cooling</option>
                    <option value="Refrigeration">Refrigeration</option>
                    <option value="Lighting">Lighting</option>
                    <option value="Motors">Industrial Motors</option>
                    <option value="Pumping">Water Pumping</option>
                    <option value="IT">Computers & IT</option>
                    <option value="Medical">Medical Equipment</option>
                    <option value="Kitchen">Kitchen Appliances</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="text-slate-400 block mb-1">Quantity</label>
                  <input
                    type="number"
                    min="1"
                    value={newEquipment.quantity}
                    onChange={(e) => setNewEquipment({ ...newEquipment, quantity: e.target.value })}
                    className="w-full rounded-lg bg-slate-950 border border-slate-700 px-3 py-1.5 text-slate-200"
                  />
                </div>
                <div>
                  <label className="text-slate-400 block mb-1">Rated Power (Watts)</label>
                  <input
                    type="number"
                    min="1"
                    value={newEquipment.rated_power_w}
                    onChange={(e) => setNewEquipment({ ...newEquipment, rated_power_w: e.target.value })}
                    className="w-full rounded-lg bg-slate-950 border border-slate-700 px-3 py-1.5 text-slate-200"
                  />
                </div>
                <div>
                  <label className="text-slate-400 block mb-1">Duty Hours/Day</label>
                  <input
                    type="number"
                    step="0.5"
                    max="24"
                    value={newEquipment.daily_hours}
                    onChange={(e) => setNewEquipment({ ...newEquipment, daily_hours: e.target.value })}
                    className="w-full rounded-lg bg-slate-950 border border-slate-700 px-3 py-1.5 text-slate-200"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-400 block mb-1">Operating Load Factor (%)</label>
                  <input
                    type="number"
                    min="10"
                    max="100"
                    value={newEquipment.operating_load_pct}
                    onChange={(e) => setNewEquipment({ ...newEquipment, operating_load_pct: e.target.value })}
                    className="w-full rounded-lg bg-slate-950 border border-slate-700 px-3 py-1.5 text-slate-200"
                  />
                </div>
                <div>
                  <label className="text-slate-400 block mb-1">Unit Purchase Cost (₹)</label>
                  <input
                    type="number"
                    value={newEquipment.unit_purchase_cost}
                    onChange={(e) => setNewEquipment({ ...newEquipment, unit_purchase_cost: e.target.value })}
                    className="w-full rounded-lg bg-slate-950 border border-slate-700 px-3 py-1.5 text-slate-200"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowAddEquipmentModal(false)}
                  className="rounded-xl border border-slate-700 px-3 py-1.5 text-slate-400"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold px-4 py-1.5"
                >
                  Add Equipment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* Modal: Add Construction Machine Form */}
      {/* ------------------------------------------------------------- */}
      {showAddConstructionModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4">
          <div className="w-full max-w-lg rounded-2xl border border-slate-800 bg-slate-900 p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-bold text-white">Add Construction Machinery</h3>
              <button onClick={() => setShowAddConstructionModal(false)} className="text-slate-400 hover:text-white">✕</button>
            </div>

            <form onSubmit={handleAddConstructionMachine} className="space-y-3 text-xs">
              <div>
                <label className="text-slate-400 block mb-1">Machine Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Tower Crane 40m"
                  value={newConstMachine.equipment_name}
                  onChange={(e) => setNewConstMachine({ ...newConstMachine, equipment_name: e.target.value })}
                  className="w-full rounded-lg bg-slate-950 border border-slate-700 px-3 py-1.5 text-slate-200"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-400 block mb-1">Construction Phase</label>
                  <select
                    value={newConstMachine.phase_name}
                    onChange={(e) => setNewConstMachine({ ...newConstMachine, phase_name: e.target.value })}
                    className="w-full rounded-lg bg-slate-950 border border-slate-700 px-3 py-1.5 text-slate-200"
                  >
                    <option value="Excavation & Earthwork">Excavation & Earthwork</option>
                    <option value="Foundation & Piling">Foundation & Piling</option>
                    <option value="Structural & Concrete">Structural & Concrete</option>
                    <option value="Welding & Fabrication">Welding & Fabrication</option>
                    <option value="Material Handling">Material Handling & Hoists</option>
                    <option value="Finishing & Interior">Finishing & Interior</option>
                    <option value="Site Camp & Lighting">Site Camp & Floodlighting</option>
                  </select>
                </div>
                <div>
                  <label className="text-slate-400 block mb-1">Rated Power (kW)</label>
                  <input
                    type="number"
                    step="0.5"
                    value={newConstMachine.rated_power_kw}
                    onChange={(e) => setNewConstMachine({ ...newConstMachine, rated_power_kw: e.target.value })}
                    className="w-full rounded-lg bg-slate-950 border border-slate-700 px-3 py-1.5 text-slate-200"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="text-slate-400 block mb-1">Quantity</label>
                  <input
                    type="number"
                    min="1"
                    value={newConstMachine.quantity}
                    onChange={(e) => setNewConstMachine({ ...newConstMachine, quantity: e.target.value })}
                    className="w-full rounded-lg bg-slate-950 border border-slate-700 px-3 py-1.5 text-slate-200"
                  />
                </div>
                <div>
                  <label className="text-slate-400 block mb-1">Hours/Day</label>
                  <input
                    type="number"
                    step="0.5"
                    value={newConstMachine.hours_per_day}
                    onChange={(e) => setNewConstMachine({ ...newConstMachine, hours_per_day: e.target.value })}
                    className="w-full rounded-lg bg-slate-950 border border-slate-700 px-3 py-1.5 text-slate-200"
                  />
                </div>
                <div>
                  <label className="text-slate-400 block mb-1">Duration (Months)</label>
                  <input
                    type="number"
                    step="0.5"
                    value={newConstMachine.duration_months}
                    onChange={(e) => setNewConstMachine({ ...newConstMachine, duration_months: e.target.value })}
                    className="w-full rounded-lg bg-slate-950 border border-slate-700 px-3 py-1.5 text-slate-200"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowAddConstructionModal(false)}
                  className="rounded-xl border border-slate-700 px-3 py-1.5 text-slate-400"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold px-4 py-1.5"
                >
                  Add Machine
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* Modal: Adjust Building Specs & Recalculate */}
      {/* ------------------------------------------------------------- */}
      {showEditBuildingModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4">
          <div className="w-full max-w-lg rounded-2xl border border-slate-800 bg-slate-900 p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Sliders className="h-5 w-5 text-indigo-400" />
                <h3 className="text-base font-bold text-white">Adjust Building Specifications & Recalculate</h3>
              </div>
              <button onClick={() => setShowEditBuildingModal(false)} className="text-slate-400 hover:text-white">✕</button>
            </div>

            {editBuildingError && (
              <div className="rounded-xl bg-rose-500/10 border border-rose-500/30 p-3 text-xs text-rose-300">
                {editBuildingError}
              </div>
            )}

            <form onSubmit={handleUpdateBuildingSpecs} className="space-y-3.5 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-300 block mb-1 font-semibold">Built-up Area (sq ft) *</label>
                  <input
                    type="number"
                    min="100"
                    required
                    value={editBuildingForm.built_up_area}
                    onChange={(e) => setEditBuildingForm({ ...editBuildingForm, built_up_area: Number(e.target.value) })}
                    className="w-full rounded-xl bg-slate-950 border border-slate-700 px-3 py-2 text-slate-200 focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="text-slate-300 block mb-1 font-semibold">Number of Floors *</label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={editBuildingForm.floors_count}
                    onChange={(e) => setEditBuildingForm({ ...editBuildingForm, floors_count: Number(e.target.value) })}
                    className="w-full rounded-xl bg-slate-950 border border-slate-700 px-3 py-2 text-slate-200 focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-300 block mb-1 font-semibold">Occupancy / Staff (people) *</label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={editBuildingForm.occupancy}
                    onChange={(e) => setEditBuildingForm({ ...editBuildingForm, occupancy: Number(e.target.value) })}
                    className="w-full rounded-xl bg-slate-950 border border-slate-700 px-3 py-2 text-slate-200 focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="text-slate-300 block mb-1 font-semibold">Daily Operating Hours *</label>
                  <input
                    type="number"
                    min="1"
                    max="24"
                    step="0.5"
                    required
                    value={editBuildingForm.daily_operating_hours}
                    onChange={(e) => setEditBuildingForm({ ...editBuildingForm, daily_operating_hours: Number(e.target.value) })}
                    className="w-full rounded-xl bg-slate-950 border border-slate-700 px-3 py-2 text-slate-200 focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-300 block mb-1 font-semibold">Monthly Operating Days *</label>
                  <select
                    value={editBuildingForm.operating_days_per_month}
                    onChange={(e) => setEditBuildingForm({ ...editBuildingForm, operating_days_per_month: Number(e.target.value) })}
                    className="w-full rounded-xl bg-slate-950 border border-slate-700 px-3 py-2 text-slate-200 focus:outline-none focus:border-indigo-500"
                  >
                    <option value="20">20 Days (Weekday Standard)</option>
                    <option value="24">24 Days (6-Day Working)</option>
                    <option value="26">26 Days (High Industrial)</option>
                    <option value="30">30 Days (Continuous 24/7)</option>
                  </select>
                </div>

                <div>
                  <label className="text-slate-300 block mb-1 font-semibold">Air Conditioning System</label>
                  <select
                    value={editBuildingForm.ac_type}
                    onChange={(e) => setEditBuildingForm({ ...editBuildingForm, ac_type: e.target.value })}
                    className="w-full rounded-xl bg-slate-950 border border-slate-700 px-3 py-2 text-slate-200 focus:outline-none focus:border-indigo-500"
                  >
                    <option value="Central Chiller HVAC Plant">Central Chiller HVAC Plant</option>
                    <option value="Split / Window Inverter ACs">Split / Window Inverter ACs</option>
                    <option value="VRV / VRF Multi-Split System">VRV / VRF System</option>
                    <option value="Natural Ventilation / Fans Only">Fans / Natural Ventilation Only</option>
                  </select>
                </div>
              </div>

              <div className="flex justify-end gap-2.5 pt-4 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowEditBuildingModal(false)}
                  className="rounded-xl border border-slate-700 px-4 py-2 text-slate-400 hover:text-white transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={updatingBuilding}
                  className="rounded-xl bg-gradient-to-r from-indigo-500 to-teal-500 hover:from-indigo-400 hover:to-teal-400 text-slate-950 font-bold px-5 py-2 shadow-lg transition-all disabled:opacity-50"
                >
                  {updatingBuilding ? 'Recalculating...' : 'Recalculate Energy Plan'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

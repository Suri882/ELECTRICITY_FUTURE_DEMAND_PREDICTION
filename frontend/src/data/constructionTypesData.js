import {
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
  Store
} from 'lucide-react';

export const CONSTRUCTION_TYPES_DATA = {
  'Residential House': {
    name: 'Residential House',
    category: 'Residential',
    icon: Home,
    badge: 'Residential',
    tagline: 'Villa, bungalow, duplex or independent family residence',
    defaultArea: 2500,
    defaultFloors: 2,
    defaultOccupants: 4,
    defaultDailyHours: 24,
    defaultOperatingDays: 30,
    peakHours: '18:00 – 22:00 (Evening Surge)',
    fields: [
      { id: 'bedrooms', label: 'Number of Bedrooms (BHK)', type: 'number', default: 3 },
      { id: 'cooking_type', label: 'Kitchen Cooking System', type: 'select', options: ['Induction Electric', 'LPG Cylinder Gas', 'Hybrid (Induction + Gas)'], default: 'Induction Electric' },
      { id: 'has_ev', label: 'Dedicated Home EV Charging Point', type: 'boolean', default: true },
      { id: 'solar_planned', label: 'Rooftop Solar PV Installation Planned', type: 'boolean', default: true }
    ],
    appliances: [
      { name: '1.5 Ton 3-Star Inverter AC', category: 'HVAC', rated_power_w: 1450, quantity: 2, daily_hours: 8, operating_load_pct: 75, checked: true },
      { name: 'BLDC Energy-Smart Ceiling Fans', category: 'Cooling', rated_power_w: 32, quantity: 6, daily_hours: 14, operating_load_pct: 80, checked: true },
      { name: 'LED Ambient & Task Luminaires', category: 'Lighting', rated_power_w: 12, quantity: 22, daily_hours: 6, operating_load_pct: 100, checked: true },
      { name: '260L Frost-Free Double Door Refrigerator', category: 'Refrigeration', rated_power_w: 220, quantity: 1, daily_hours: 24, operating_load_pct: 60, checked: true },
      { name: '25L Storage Instant Water Geyser', category: 'Water Heating', rated_power_w: 2000, quantity: 2, daily_hours: 1.5, operating_load_pct: 90, checked: true },
      { name: '7 kg Front-Load Inverter Washing Machine', category: 'Appliances', rated_power_w: 1200, quantity: 1, daily_hours: 1, operating_load_pct: 70, checked: true },
      { name: '0.5 HP Domestic Booster Pump', category: 'Pumps', rated_power_w: 370, quantity: 1, daily_hours: 1.5, operating_load_pct: 80, checked: true },
      { name: 'Home Entertainment & Smart TV (55")', category: 'Consumer Electronics', rated_power_w: 110, quantity: 2, daily_hours: 5, operating_load_pct: 90, checked: true }
    ]
  },
  'Apartment / Residential Complex': {
    name: 'Apartment / Residential Complex',
    category: 'Residential',
    icon: Building,
    badge: 'Residential',
    tagline: 'Multi-story residential towers, flats & community amenities',
    defaultArea: 45000,
    defaultFloors: 8,
    defaultOccupants: 150,
    defaultDailyHours: 24,
    defaultOperatingDays: 30,
    peakHours: '06:00 – 09:00 & 18:30 – 22:00',
    fields: [
      { id: 'units_count', label: 'Total Residential Units / Flats', type: 'number', default: 36 },
      { id: 'elevators_count', label: 'Passenger Elevators / Lifts', type: 'number', default: 2 },
      { id: 'common_corridors_floors', label: 'Common Corridors (Floors)', type: 'number', default: 8 },
      { id: 'has_stp', label: 'Sewage Treatment Plant (STP) & Hydro-Pneumatics', type: 'boolean', default: true }
    ],
    appliances: [
      { name: 'Residential Flats Baseline Diversity Load', category: 'Residential', rated_power_w: 1800, quantity: 36, daily_hours: 12, operating_load_pct: 65, checked: true },
      { name: '8-Passenger Gearless Elevator Motors', category: 'Vertical Transport', rated_power_w: 5500, quantity: 2, daily_hours: 10, operating_load_pct: 70, checked: true },
      { name: 'Corridor, Perimeter & Stairwell LED Lighting', category: 'Lighting', rated_power_w: 18, quantity: 90, daily_hours: 11, operating_load_pct: 100, checked: true },
      { name: '7.5 HP Hydro-Pneumatic Water Supply Pumps', category: 'Pumps', rated_power_w: 5500, quantity: 2, daily_hours: 4, operating_load_pct: 85, checked: true },
      { name: 'STP Aeration Blowers & Filtration Pumps', category: 'Sanitation', rated_power_w: 3700, quantity: 1, daily_hours: 18, operating_load_pct: 80, checked: true },
      { name: 'Clubhouse & Fitness Center Inverter ACs', category: 'HVAC', rated_power_w: 3500, quantity: 3, daily_hours: 6, operating_load_pct: 70, checked: true }
    ]
  },
  'College / School': {
    name: 'College / School',
    category: 'Public and Institutional',
    icon: GraduationCap,
    badge: 'Institutional',
    tagline: 'Educational campus, classrooms, computer labs & auditorium',
    defaultArea: 35000,
    defaultFloors: 3,
    defaultOccupants: 600,
    defaultDailyHours: 9,
    defaultOperatingDays: 24,
    peakHours: '09:30 – 14:30 (Daytime Academic)',
    fields: [
      { id: 'classrooms_count', label: 'Total Number of Classrooms', type: 'number', default: 24 },
      { id: 'computer_labs', label: 'High-Density Computer Labs', type: 'number', default: 3 },
      { id: 'has_auditorium', label: 'Central Auditorium / Multipurpose Hall', type: 'boolean', default: true },
      { id: 'has_floodlights', label: 'Sports Grounds & Campus Floodlighting', type: 'boolean', default: true }
    ],
    appliances: [
      { name: 'Classroom High-Efficiency LED Batten Lights', category: 'Lighting', rated_power_w: 36, quantity: 120, daily_hours: 8, operating_load_pct: 100, checked: true },
      { name: 'Classroom Aerodynamic Ceiling Fans', category: 'Cooling', rated_power_w: 60, quantity: 96, daily_hours: 8, operating_load_pct: 85, checked: true },
      { name: 'Computer Lab Workstations & LED Displays', category: 'IT/Office', rated_power_w: 180, quantity: 75, daily_hours: 7, operating_load_pct: 75, checked: true },
      { name: 'Staff Rooms & Administrative Split ACs', category: 'HVAC', rated_power_w: 1800, quantity: 8, daily_hours: 7, operating_load_pct: 70, checked: true },
      { name: 'Campus PA System, Smart Boards & Projectors', category: 'AV/Office', rated_power_w: 350, quantity: 24, daily_hours: 5, operating_load_pct: 80, checked: true },
      { name: 'Campus Borewell & Overhead Storage Pumps', category: 'Pumps', rated_power_w: 3700, quantity: 2, daily_hours: 3, operating_load_pct: 85, checked: true }
    ]
  },
  'Hospital': {
    name: 'Hospital',
    category: 'Public and Institutional',
    icon: HeartPulse,
    badge: 'Healthcare',
    tagline: 'Healthcare facility with ICU, OT, diagnostic labs & wards',
    defaultArea: 50000,
    defaultFloors: 5,
    defaultOccupants: 250,
    defaultDailyHours: 24,
    defaultOperatingDays: 30,
    peakHours: '10:00 – 18:00 (Diagnostic & Clinical Peak)',
    fields: [
      { id: 'beds_count', label: 'Total Inpatient Beds', type: 'number', default: 100 },
      { id: 'icu_beds', label: 'Intensive Care Unit (ICU) Beds', type: 'number', default: 15 },
      { id: 'operating_theatres', label: 'Modular Operation Theatres (OT)', type: 'number', default: 4 },
      { id: 'has_mri_ct', label: 'MRI & CT Scan Imaging Center Included', type: 'boolean', default: true },
      { id: 'central_cleanroom_hvac', label: '24x7 Central Cleanroom Chiller HVAC', type: 'boolean', default: true }
    ],
    appliances: [
      { name: 'Central Chiller HVAC Plant (Medical Grade)', category: 'HVAC', rated_power_w: 65000, quantity: 2, daily_hours: 24, operating_load_pct: 75, checked: true },
      { name: 'Operation Theatre Laminar Airflow & Scrubbers', category: 'HVAC', rated_power_w: 7500, quantity: 4, daily_hours: 18, operating_load_pct: 80, checked: true },
      { name: 'ICU Ventilators, Monitors & Life Support', category: 'Medical', rated_power_w: 800, quantity: 15, daily_hours: 24, operating_load_pct: 90, checked: true },
      { name: 'General Inpatient Ward Bedside Panels & Lights', category: 'Medical', rated_power_w: 150, quantity: 85, daily_hours: 18, operating_load_pct: 70, checked: true },
      { name: 'Diagnostic Imaging Auxiliary Systems (CT/MRI)', category: 'Medical', rated_power_w: 12000, quantity: 1, daily_hours: 8, operating_load_pct: 75, checked: true },
      { name: 'Central Hospital Autoclave & Sterilization', category: 'Thermal', rated_power_w: 9000, quantity: 2, daily_hours: 6, operating_load_pct: 85, checked: true },
      { name: 'Hospital Stretcher & Bed Elevators', category: 'Vertical Transport', rated_power_w: 7500, quantity: 3, daily_hours: 14, operating_load_pct: 65, checked: true }
    ]
  },
  'Office Building': {
    name: 'Office Building',
    category: 'Commercial',
    icon: Briefcase,
    badge: 'Commercial',
    tagline: 'Corporate workplace, business suites & conference facilities',
    defaultArea: 28000,
    defaultFloors: 4,
    defaultOccupants: 180,
    defaultDailyHours: 11,
    defaultOperatingDays: 24,
    peakHours: '10:00 – 17:30 (Business Day Peak)',
    fields: [
      { id: 'workstations', label: 'Workstations / Desks', type: 'number', default: 160 },
      { id: 'meeting_rooms', label: 'Conference & Board Rooms', type: 'number', default: 6 },
      { id: 'server_room_kw', label: 'Server Room IT Power (kW)', type: 'number', default: 15 },
      { id: 'has_cafeteria', label: 'Central Cafeteria & Pantry Equipment', type: 'boolean', default: true }
    ],
    appliances: [
      { name: 'VRV / Multi-Split Ceiling Cassette ACs', category: 'HVAC', rated_power_w: 4200, quantity: 14, daily_hours: 10, operating_load_pct: 75, checked: true },
      { name: 'Employee Workstations (PC/Laptops & Displays)', category: 'IT/Office', rated_power_w: 120, quantity: 160, daily_hours: 9, operating_load_pct: 80, checked: true },
      { name: 'Enterprise IT Server Racks & Core Switches', category: 'IT/Office', rated_power_w: 7500, quantity: 2, daily_hours: 24, operating_load_pct: 90, checked: true },
      { name: 'Server Room Precision Air Conditioner (PAC)', category: 'HVAC', rated_power_w: 5000, quantity: 2, daily_hours: 24, operating_load_pct: 75, checked: true },
      { name: 'Low-Glare Office LED Troffer Panels', category: 'Lighting', rated_power_w: 36, quantity: 140, daily_hours: 10, operating_load_pct: 100, checked: true },
      { name: 'Pantry Coffee Machines, Refrigerators & Microwave', category: 'Appliances', rated_power_w: 2500, quantity: 4, daily_hours: 6, operating_load_pct: 70, checked: true },
      { name: 'High-Efficiency Passenger Elevators', category: 'Vertical Transport', rated_power_w: 5500, quantity: 2, daily_hours: 9, operating_load_pct: 65, checked: true }
    ]
  },
  'Shopping Mall': {
    name: 'Shopping Mall',
    category: 'Commercial',
    icon: ShoppingBag,
    badge: 'Retail',
    tagline: 'Retail galleria, anchor stores, food court & cinema multiplex',
    defaultArea: 95000,
    defaultFloors: 4,
    defaultOccupants: 800,
    defaultDailyHours: 13,
    defaultOperatingDays: 30,
    peakHours: '16:00 – 21:30 (Evening Footfall Peak)',
    fields: [
      { id: 'retail_shops', label: 'Retail Stores / Outlets', type: 'number', default: 45 },
      { id: 'anchor_supermarkets', label: 'Large Anchor Department Stores', type: 'number', default: 2 },
      { id: 'food_court_kitchens', label: 'Food Court Commercial Kitchens', type: 'number', default: 10 },
      { id: 'escalators_count', label: 'Continuously Running Escalators', type: 'number', default: 8 },
      { id: 'has_multiplex', label: 'Cinema Multiplex Attached', type: 'boolean', default: true }
    ],
    appliances: [
      { name: 'Central Water-Cooled Chiller HVAC Plant', category: 'HVAC', rated_power_w: 95000, quantity: 2, daily_hours: 13, operating_load_pct: 75, checked: true },
      { name: 'Continuously Moving Heavy-Duty Escalators', category: 'Vertical Transport', rated_power_w: 7500, quantity: 8, daily_hours: 13, operating_load_pct: 70, checked: true },
      { name: 'Architectural Atrium & Common Galleria LED', category: 'Lighting', rated_power_w: 45, quantity: 280, daily_hours: 14, operating_load_pct: 100, checked: true },
      { name: 'Retail Store Auxiliary Lighting & Booster HVAC', category: 'Retail', rated_power_w: 3000, quantity: 45, daily_hours: 12, operating_load_pct: 80, checked: true },
      { name: 'Food Court Commercial Fryers, Ovens & Chillers', category: 'Commercial Kitchen', rated_power_w: 8500, quantity: 10, daily_hours: 12, operating_load_pct: 75, checked: true },
      { name: 'High-Capacity Passenger & Service Elevators', category: 'Vertical Transport', rated_power_w: 9200, quantity: 4, daily_hours: 13, operating_load_pct: 65, checked: true }
    ]
  },
  'Hotel': {
    name: 'Hotel',
    category: 'Commercial',
    icon: BedDouble,
    badge: 'Hospitality',
    tagline: 'Hospitality venue, guest suites, restaurant & banqueting',
    defaultArea: 42000,
    defaultFloors: 6,
    defaultOccupants: 140,
    defaultDailyHours: 24,
    defaultOperatingDays: 30,
    peakHours: '07:00 – 10:00 & 19:00 – 23:00',
    fields: [
      { id: 'guest_rooms', label: 'Total Guest Rooms', type: 'number', default: 75 },
      { id: 'occupancy_avg_pct', label: 'Average Occupancy Rate (%)', type: 'number', default: 72 },
      { id: 'banquet_halls', label: 'Banquet & Event Halls', type: 'number', default: 2 },
      { id: 'has_laundry', label: 'In-House Commercial Laundry Plant', type: 'boolean', default: true },
      { id: 'has_kitchen', label: '24/7 Multi-Cuisine Commercial Kitchen', type: 'boolean', default: true }
    ],
    appliances: [
      { name: 'Guest Room Inverter Split/VRV ACs', category: 'HVAC', rated_power_w: 1450, quantity: 75, daily_hours: 12, operating_load_pct: 70, checked: true },
      { name: 'Commercial Kitchen Induction Ovens & Freezers', category: 'Commercial Kitchen', rated_power_w: 22000, quantity: 1, daily_hours: 14, operating_load_pct: 75, checked: true },
      { name: 'In-House Commercial Laundry Washers & Dryers', category: 'Appliances', rated_power_w: 11000, quantity: 2, daily_hours: 7, operating_load_pct: 80, checked: true },
      { name: 'Lobby, Restaurant & Facade Lighting System', category: 'Lighting', rated_power_w: 25, quantity: 240, daily_hours: 14, operating_load_pct: 100, checked: true },
      { name: 'Central Domestic Hot Water Heat Pump System', category: 'Water Heating', rated_power_w: 15000, quantity: 1, daily_hours: 8, operating_load_pct: 80, checked: true },
      { name: 'Guest Elevators with Regeneration Drives', category: 'Vertical Transport', rated_power_w: 5500, quantity: 3, daily_hours: 16, operating_load_pct: 65, checked: true }
    ]
  },
  'Factory / Industrial Building': {
    name: 'Factory / Industrial Building',
    category: 'Industrial and Infrastructure',
    icon: Factory,
    badge: 'Industrial',
    tagline: 'Manufacturing plant, fabrication shop & production machinery',
    defaultArea: 30000,
    defaultFloors: 1,
    defaultOccupants: 80,
    defaultDailyHours: 16,
    defaultOperatingDays: 26,
    peakHours: '08:00 – 16:00 (Production Shift 1)',
    fields: [
      { id: 'production_shifts', label: 'Daily 8-Hour Production Shifts', type: 'number', default: 2 },
      { id: 'connected_motor_load_kw', label: 'Total Connected Motor Load (kW)', type: 'number', default: 90 },
      { id: 'air_compressor_cfm', label: 'Industrial Compressed Air (CFM)', type: 'number', default: 120 },
      { id: 'motor_efficiency', label: 'Motor Efficiency Rating', type: 'select', options: ['IE2 High Efficiency', 'IE3 Premium Efficiency', 'IE4 Super Premium'], default: 'IE2 High Efficiency' }
    ],
    appliances: [
      { name: 'Primary Machine Production Motors', category: 'Machinery', rated_power_w: 15000, quantity: 4, daily_hours: 14, operating_load_pct: 75, checked: true },
      { name: 'Rotary Screw Industrial Air Compressor', category: 'Pneumatics', rated_power_w: 22000, quantity: 1, daily_hours: 12, operating_load_pct: 80, checked: true },
      { name: 'Shop Floor Exhaust & Air Circulation Blowers', category: 'HVAC', rated_power_w: 3700, quantity: 6, daily_hours: 16, operating_load_pct: 85, checked: true },
      { name: 'High-Bay Industrial LED Luminaires', category: 'Lighting', rated_power_w: 150, quantity: 45, daily_hours: 16, operating_load_pct: 100, checked: true },
      { name: 'Electric Overhead Traveling (EOT) Crane', category: 'Material Handling', rated_power_w: 7500, quantity: 1, daily_hours: 4, operating_load_pct: 65, checked: true },
      { name: 'Quality Control Lab & Admin Office ACs', category: 'HVAC', rated_power_w: 2500, quantity: 3, daily_hours: 10, operating_load_pct: 70, checked: true }
    ]
  },
  'IT Park': {
    name: 'IT Park',
    category: 'Commercial',
    icon: Server,
    badge: 'Technology',
    tagline: 'High-density tech campus, software towers & server hubs',
    defaultArea: 120000,
    defaultFloors: 6,
    defaultOccupants: 900,
    defaultDailyHours: 16,
    defaultOperatingDays: 26,
    peakHours: '09:00 – 18:30 (Daytime IT Peak)',
    fields: [
      { id: 'total_seats', label: 'Total IT Seating Capacity', type: 'number', default: 950 },
      { id: 'server_racks', label: 'Data Center Server Racks', type: 'number', default: 18 },
      { id: 'chiller_capacity_tr', label: 'Water-Cooled Chiller Plant (TR)', type: 'number', default: 350 },
      { id: 'target_uptime_pct', label: 'Target Power Uptime (%)', type: 'number', default: 99.98 }
    ],
    appliances: [
      { name: 'Central Chiller Plant with VFD Pumps', category: 'HVAC', rated_power_w: 110000, quantity: 2, daily_hours: 14, operating_load_pct: 75, checked: true },
      { name: 'High-Performance Workstations & Dual Displays', category: 'IT/Office', rated_power_w: 160, quantity: 950, daily_hours: 10, operating_load_pct: 80, checked: true },
      { name: 'High-Density Data Center Server Racks', category: 'IT/Office', rated_power_w: 6000, quantity: 18, daily_hours: 24, operating_load_pct: 90, checked: true },
      { name: 'Precision Air Conditioning (PAC) for Servers', category: 'HVAC', rated_power_w: 12000, quantity: 4, daily_hours: 24, operating_load_pct: 75, checked: true },
      { name: 'Ergonomic Office LED Lighting Grid', category: 'Lighting', rated_power_w: 28, quantity: 480, daily_hours: 11, operating_load_pct: 100, checked: true },
      { name: 'High-Speed Gearless Passenger Elevators', category: 'Vertical Transport', rated_power_w: 11000, quantity: 6, daily_hours: 12, operating_load_pct: 65, checked: true }
    ]
  },
  'Warehouse': {
    name: 'Warehouse',
    category: 'Commercial',
    icon: Boxes,
    badge: 'Logistics',
    tagline: 'Logistics fulfillment center, high-bay storage & distribution',
    defaultArea: 40000,
    defaultFloors: 1,
    defaultOccupants: 30,
    defaultDailyHours: 14,
    defaultOperatingDays: 26,
    peakHours: '08:00 – 17:00 (Dispatch & Staging)',
    fields: [
      { id: 'high_bay_fixtures', label: 'High-Bay Storage Racks LED Fixtures', type: 'number', default: 60 },
      { id: 'electric_forklifts', label: 'Electric Forklift Charging Stations', type: 'number', default: 4 },
      { id: 'has_cold_storage', label: 'Cold Storage / Climate Controlled Section', type: 'boolean', default: false },
      { id: 'loading_docks_motorized', label: 'Motorized Dock Levelers & Shutter Doors', type: 'number', default: 6 }
    ],
    appliances: [
      { name: 'High-Bay Warehouse LED Luminaires (Sensor-based)', category: 'Lighting', rated_power_w: 120, quantity: 60, daily_hours: 12, operating_load_pct: 85, checked: true },
      { name: 'Electric Forklift Fast Battery Charging Stations', category: 'Material Handling', rated_power_w: 7200, quantity: 4, daily_hours: 6, operating_load_pct: 85, checked: true },
      { name: 'Climate-Controlled Packaging & Staging HVAC', category: 'HVAC', rated_power_w: 9500, quantity: 2, daily_hours: 12, operating_load_pct: 70, checked: true },
      { name: 'Motorized Shutter Doors & Dock Leveler Motors', category: 'Machinery', rated_power_w: 2200, quantity: 6, daily_hours: 3, operating_load_pct: 70, checked: true },
      { name: 'Warehouse Admin Office Split ACs', category: 'HVAC', rated_power_w: 1800, quantity: 3, daily_hours: 10, operating_load_pct: 70, checked: true },
      { name: 'CCTV Security, Scanners & Warehouse ERP Servers', category: 'IT/Office', rated_power_w: 1500, quantity: 1, daily_hours: 24, operating_load_pct: 85, checked: true }
    ]
  },
  'Other Commercial Building': {
    name: 'Other Commercial Building',
    category: 'Commercial',
    icon: Store,
    badge: 'Commercial',
    tagline: 'Retail showroom, clinic, bank branch or custom space',
    defaultArea: 8500,
    defaultFloors: 2,
    defaultOccupants: 40,
    defaultDailyHours: 10,
    defaultOperatingDays: 26,
    peakHours: '11:00 – 19:00 (Customer Service Peak)',
    fields: [
      { id: 'commercial_function', label: 'Primary Commercial Function', type: 'select', options: ['Retail Showroom', 'Bank / Financial Branch', 'Outpatient Medical Clinic', 'Fitness Center / Gym', 'Specialized Commercial Space'], default: 'Retail Showroom' },
      { id: 'daily_customer_footfall', label: 'Expected Daily Customer Footfall', type: 'number', default: 150 },
      { id: 'peak_window_profile', label: 'Peak Footfall Window', type: 'select', options: ['Morning & Afternoon', 'Evening Surge', 'Consistent All Day'], default: 'Evening Surge' }
    ],
    appliances: [
      { name: 'Commercial Inverter Multi-Split Cassette ACs', category: 'HVAC', rated_power_w: 4500, quantity: 4, daily_hours: 10, operating_load_pct: 75, checked: true },
      { name: 'Showroom Track & Accent Display LED Lights', category: 'Lighting', rated_power_w: 30, quantity: 65, daily_hours: 11, operating_load_pct: 100, checked: true },
      { name: 'Billing POS Counters & Branch IT Servers', category: 'IT/Office', rated_power_w: 250, quantity: 8, daily_hours: 10, operating_load_pct: 80, checked: true },
      { name: 'Commercial Display Screens & Digital Signage', category: 'AV/Retail', rated_power_w: 180, quantity: 5, daily_hours: 11, operating_load_pct: 90, checked: true },
      { name: 'Pantry Fridge, Water Cooler & Microwave', category: 'Appliances', rated_power_w: 1200, quantity: 2, daily_hours: 8, operating_load_pct: 70, checked: true },
      { name: 'Security Alarms, Entrance Sensors & UPS Backup', category: 'Automation', rated_power_w: 600, quantity: 1, daily_hours: 24, operating_load_pct: 80, checked: true }
    ]
  }
};

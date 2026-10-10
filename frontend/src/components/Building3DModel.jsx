import React from 'react';

/**
 * Building3DModel Component
 * Renders individual, handcrafted 3D-style isometric architectural illustrations
 * for all 11 construction types, themed around electricity intelligence.
 *
 * Theme Colors:
 * - Background/Card Surface: #10243D / #071426
 * - Electric Blue: #1677FF
 * - Energy Cyan: #00D9FF
 * - Power Yellow: #FFD43B
 * - Main Text: #F5F8FF
 */

export const Building3DModel = ({ type, isHovered = false, compact = true }) => {
  // Common visual IDs for unique SVG scoping
  const idPrefix = type ? type.replace(/[^a-zA-Z0-9]/g, '') : 'default';

  const renderBuilding = () => {
    switch (type) {
      /* ========================================================================= */
      /* 1. RESIDENTIAL HOUSE (Villa with Rooftop Solar & EV Charger Wallbox)      */
      /* ========================================================================= */
      case 'Residential House':
        return (
          <g className="transition-transform duration-500 ease-out">
            {/* Ground Contact Shadow & Pad */}
            <ellipse cx="130" cy="142" rx="72" ry="20" fill="rgba(0, 217, 255, 0.08)" filter={`url(#${idPrefix}-shadow)`} />
            <polygon points="65,140 130,158 195,140 130,122" fill="#0C2038" stroke="#1677FF" strokeWidth="1" strokeOpacity="0.3" />
            {/* Ground Energy Circuit Conduit */}
            <path d="M75,137 L100,145 L110,142" fill="none" stroke="#00D9FF" strokeWidth="1.2" strokeDasharray="3,2" strokeOpacity={isHovered ? 1 : 0.6} />

            {/* Garage / Carport with EV Charger */}
            <polygon points="75,124 105,133 105,108 75,99" fill="#122B48" stroke="#1677FF" strokeWidth="0.8" />
            <polygon points="75,99 105,108 125,97 95,88" fill="#1B3D66" stroke="#00D9FF" strokeWidth="0.8" />
            {/* EV Charger Pillar */}
            <rect x="79" y="112" width="4" height="12" rx="1" fill="#10243D" stroke="#00D9FF" strokeWidth="0.8" />
            <circle cx="81" cy="115" r="1.5" fill="#00D9FF" className={isHovered ? 'animate-pulse' : ''} />
            <path d="M83,120 Q88,122 87,126" fill="none" stroke="#00D9FF" strokeWidth="1" />

            {/* Main Villa Block - Left Face */}
            <polygon points="105,133 155,147 155,80 105,66" fill="#153356" stroke="#1677FF" strokeWidth="1" />
            {/* Main Villa Block - Right Face */}
            <polygon points="155,147 185,133 185,66 155,80" fill="#0E243E" stroke="#1677FF" strokeWidth="1" />
            {/* Pitched Gable Roof - Top Left Slope (Covered with Solar PV array) */}
            <polygon points="105,66 145,42 165,56 125,80" fill="#1C426E" stroke="#00D9FF" strokeWidth="1.2" />
            {/* Roof Peak Ridge & Right Slope */}
            <polygon points="145,42 165,56 185,66 165,52" fill="#122E4E" stroke="#1677FF" strokeWidth="0.8" />

            {/* Solar PV Panels with Grid Lines */}
            <polygon points="112,67 142,47 152,54 122,74" fill="#08182B" stroke="#00D9FF" strokeWidth="0.9" />
            <line x1="122" y1="60" x2="132" y2="67" stroke="#00D9FF" strokeWidth="0.6" strokeOpacity="0.7" />
            <line x1="132" y1="53" x2="142" y2="60" stroke="#00D9FF" strokeWidth="0.6" strokeOpacity="0.7" />
            <line x1="117" y1="62" x2="147" y2="51" stroke="#00D9FF" strokeWidth="0.6" strokeOpacity="0.5" />

            {/* Picture Windows - Warm & Cyan Glow */}
            <polygon points="112,85 130,90 130,105 112,100" fill="#FFD43B" fillOpacity={isHovered ? 0.9 : 0.75} filter={`url(#${idPrefix}-glow)`} />
            <polygon points="112,112 130,117 130,128 112,123" fill="#00D9FF" fillOpacity={isHovered ? 0.85 : 0.65} />
            <polygon points="135,91 148,95 148,126 135,122" fill="#1677FF" fillOpacity="0.7" stroke="#00D9FF" strokeWidth="0.6" />
            <polygon points="162,88 178,82 178,110 162,116" fill="#FFD43B" fillOpacity="0.6" />

            {/* Home Energy Storage Battery on Side Wall */}
            <rect x="175" y="112" width="6" height="12" rx="1" fill="#0A1E35" stroke="#00D9FF" strokeWidth="0.8" />
            <line x1="176" y1="115" x2="180" y2="115" stroke="#00D9FF" strokeWidth="1" />
            <line x1="176" y1="118" x2="179" y2="118" stroke="#FFD43B" strokeWidth="1" />

            {/* Power Glow Nodes */}
            <circle cx="145" cy="42" r="2" fill="#00D9FF" filter={`url(#${idPrefix}-glow)`} />
          </g>
        );

      /* ========================================================================= */
      /* 2. APARTMENT / RESIDENTIAL COMPLEX (Twin Towers & Elevator Glass Core)   */
      /* ========================================================================= */
      case 'Apartment / Residential Complex':
        return (
          <g className="transition-transform duration-500 ease-out">
            {/* Ground Contact Shadow */}
            <ellipse cx="130" cy="148" rx="78" ry="18" fill="rgba(0, 217, 255, 0.08)" filter={`url(#${idPrefix}-shadow)`} />

            {/* Rear Tower (Tower B - 9 Floors) */}
            <polygon points="135,125 175,138 175,35 135,22" fill="#112946" stroke="#1677FF" strokeWidth="0.8" />
            <polygon points="175,138 198,126 198,23 175,35" fill="#0A1C32" stroke="#1677FF" strokeWidth="0.8" />
            <polygon points="135,22 158,10 198,23 175,35" fill="#1B3F68" stroke="#00D9FF" strokeWidth="1" />
            {/* Communications Mast & Warning Beacon */}
            <line x1="168" y1="16" x2="168" y2="3" stroke="#00D9FF" strokeWidth="1.2" />
            <circle cx="168" cy="3" r="1.8" fill="#FFD43B" filter={`url(#${idPrefix}-glow)`} />

            {/* Front Tower (Tower A - 7 Floors) */}
            <polygon points="70,140 120,154 120,52 70,38" fill="#16375D" stroke="#1677FF" strokeWidth="1" />
            <polygon points="120,154 148,141 148,39 120,52" fill="#0E233C" stroke="#1677FF" strokeWidth="1" />
            <polygon points="70,38 98,25 148,39 120,52" fill="#204975" stroke="#00D9FF" strokeWidth="1.2" />

            {/* Rooftop Solar Water Heaters & Panels on Tower A */}
            <polygon points="80,36 100,27 114,33 94,42" fill="#09182A" stroke="#00D9FF" strokeWidth="0.8" />

            {/* Vertical Illuminated Elevator Core Shaft (Electric Blue / Cyan) */}
            <polygon points="90,44 98,46 98,148 90,146" fill="#1677FF" fillOpacity={isHovered ? 0.9 : 0.75} stroke="#00D9FF" strokeWidth="0.9" filter={`url(#${idPrefix}-glow)`} />

            {/* Matrix of Balconies and Residential Unit Windows */}
            {[0, 1, 2, 3, 4, 5].map((floor) => {
              const yOffset = floor * 15;
              return (
                <g key={floor}>
                  {/* Left Balcony Bay */}
                  <polygon points={`74,${50 + yOffset} 86,${53 + yOffset} 86,${60 + yOffset} 74,${57 + yOffset}`} fill={floor % 2 === 0 ? '#FFD43B' : '#00D9FF'} fillOpacity={isHovered ? 0.85 : 0.65} />
                  {/* Right Balcony Bay */}
                  <polygon points={`102,${58 + yOffset} 116,${62 + yOffset} 116,${69 + yOffset} 102,${65 + yOffset}`} fill={floor % 3 === 0 ? '#FFD43B' : '#F5F8FF'} fillOpacity={isHovered ? 0.9 : 0.7} />
                  {/* Side Tower Windows */}
                  <polygon points={`124,${58 + yOffset} 142,${50 + yOffset} 142,${55 + yOffset} 124,${63 + yOffset}`} fill="#00D9FF" fillOpacity="0.4" />
                </g>
              );
            })}

            {/* Ground Entrance Canopy */}
            <polygon points="85,145 125,156 135,151 95,140" fill="#1B3D66" stroke="#00D9FF" strokeWidth="1" />
            <polygon points="95,146 115,152 115,154 95,148" fill="#FFD43B" filter={`url(#${idPrefix}-glow)`} />
          </g>
        );

      /* ========================================================================= */
      /* 3. COLLEGE / SCHOOL (Collegiate Campus, Rotunda & Lecture Wings)          */
      /* ========================================================================= */
      case 'College / School':
        return (
          <g className="transition-transform duration-500 ease-out">
            <ellipse cx="130" cy="144" rx="80" ry="18" fill="rgba(0, 217, 255, 0.08)" filter={`url(#${idPrefix}-shadow)`} />

            {/* Central Academic Rotunda / Clock Pavilion */}
            <polygon points="110,132 150,144 150,55 110,43" fill="#183A60" stroke="#1677FF" strokeWidth="1" />
            <polygon points="150,144 175,133 175,44 150,55" fill="#0F2640" stroke="#1677FF" strokeWidth="1" />
            {/* Pyramid Cupola Apex */}
            <polygon points="110,43 130,22 150,55" fill="#244F7D" stroke="#00D9FF" strokeWidth="1.1" />
            <polygon points="130,22 175,44 150,55" fill="#1A3B60" stroke="#1677FF" strokeWidth="0.9" />
            {/* Illuminated Collegiate Clock / Crest */}
            <circle cx="132" cy="62" r="5" fill="#10243D" stroke="#00D9FF" strokeWidth="1.2" />
            <line x1="132" y1="62" x2="132" y2="59" stroke="#FFD43B" strokeWidth="1" />
            <line x1="132" y1="62" x2="135" y2="62" stroke="#FFD43B" strokeWidth="1" />

            {/* West Lecture Hall Wing */}
            <polygon points="60,126 110,138 110,75 60,63" fill="#143152" stroke="#1677FF" strokeWidth="0.9" />
            <polygon points="60,63 85,50 135,62 110,75" fill="#1D436E" stroke="#00D9FF" strokeWidth="1" />
            {/* Solar Canopy Walkway */}
            <polygon points="70,128 105,137 105,123 70,114" fill="#0C1F33" stroke="#00D9FF" strokeWidth="0.8" />

            {/* East STEM Lab & Library Wing */}
            <polygon points="150,144 195,128 195,65 150,81" fill="#0D223B" stroke="#1677FF" strokeWidth="0.9" />
            <polygon points="150,81 175,68 220,84 195,97" fill="#193B62" stroke="#00D9FF" strokeWidth="0.8" />

            {/* Linear Lecture Window Ribbons */}
            {[0, 1, 2].map((i) => (
              <g key={i}>
                <polygon points={`68,${75 + i * 16} 102,${83 + i * 16} 102,${89 + i * 16} 68,${81 + i * 16}`} fill="#00D9FF" fillOpacity={isHovered ? 0.8 : 0.6} />
                <polygon points={`158,${92 + i * 16} 188,${81 + i * 16} 188,${87 + i * 16} 158,${98 + i * 16}`} fill="#FFD43B" fillOpacity={isHovered ? 0.85 : 0.65} />
              </g>
            ))}

            {/* Campus Courtyard Pathway & Solar Tree */}
            <polygon points="120,135 140,141 135,152 115,146" fill="#0C2038" stroke="#1677FF" strokeWidth="0.8" />
            <line x1="126" y1="140" x2="126" y2="132" stroke="#00D9FF" strokeWidth="1.2" />
            <circle cx="126" cy="132" r="3" fill="#00D9FF" filter={`url(#${idPrefix}-glow)`} />
          </g>
        );

      /* ========================================================================= */
      /* 4. HOSPITAL (Medical Center with Rooftop Helipad & Emergency Substation)   */
      /* ========================================================================= */
      case 'Hospital':
        return (
          <g className="transition-transform duration-500 ease-out">
            <ellipse cx="130" cy="146" rx="80" ry="19" fill="rgba(0, 217, 255, 0.08)" filter={`url(#${idPrefix}-shadow)`} />

            {/* Main Clinical Hospital Tower */}
            <polygon points="80,135 145,153 145,55 80,37" fill="#17395F" stroke="#1677FF" strokeWidth="1" />
            <polygon points="145,153 190,138 190,40 145,55" fill="#0E233C" stroke="#1677FF" strokeWidth="1" />
            <polygon points="80,37 125,22 190,40 145,55" fill="#204874" stroke="#00D9FF" strokeWidth="1.2" />

            {/* ROOFTOP HELIPAD: Circle + Cross */}
            <ellipse cx="138" cy="38" rx="28" ry="11" fill="#0C1D33" stroke="#00D9FF" strokeWidth="1.5" />
            <ellipse cx="138" cy="38" rx="20" ry="7.5" fill="none" stroke="#FFD43B" strokeWidth="1" strokeDasharray="3,2" />
            {/* White 'H' and Medical Red/Cyan Cross */}
            <text x="138" y="42" fill="#F5F8FF" fontSize="12" fontWeight="900" textAnchor="middle" fontFamily="sans-serif">H</text>
            <circle cx="112" cy="38" r="1.8" fill="#00D9FF" className={isHovered ? 'animate-pulse' : ''} />
            <circle cx="164" cy="38" r="1.8" fill="#00D9FF" className={isHovered ? 'animate-pulse' : ''} />

            {/* ICU & Surgical Suites Ribbon Glass Windows (Cyan cleanroom glow) */}
            {[0, 1, 2, 3].map((f) => (
              <g key={f}>
                <polygon points={`88,${52 + f * 18} 138,${66 + f * 18} 138,${73 + f * 18} 88,${59 + f * 18}`} fill="#00D9FF" fillOpacity={isHovered ? 0.85 : 0.65} filter={`url(#${idPrefix}-glow)`} />
                <polygon points={`152,${68 + f * 18} 182,${58 + f * 18} 182,${65 + f * 18} 152,${75 + f * 18}`} fill="#F5F8FF" fillOpacity="0.75" />
              </g>
            ))}

            {/* Emergency Bay Drive-Through Port */}
            <polygon points="65,142 98,151 98,128 65,119" fill="#122A47" stroke="#1677FF" strokeWidth="0.9" />
            <polygon points="65,119 98,128 120,121 87,112" fill="#1C406B" stroke="#00D9FF" strokeWidth="1" />
            {/* Illuminated Red Emergency Cross Signage */}
            <rect x="74" y="125" width="10" height="10" fill="#10243D" stroke="#00D9FF" strokeWidth="0.8" />
            <path d="M79,127 L79,133 M76,130 L82,130" stroke="#FF4D4F" strokeWidth="2" strokeLinecap="round" />

            {/* Backup Diesel/UPS Substation on Right */}
            <polygon points="175,138 200,130 200,110 175,118" fill="#0A1E35" stroke="#FFD43B" strokeWidth="0.9" />
            <line x1="180" y1="120" x2="195" y2="115" stroke="#FFD43B" strokeWidth="1" />
            <line x1="180" y1="124" x2="195" y2="119" stroke="#00D9FF" strokeWidth="1" />
          </g>
        );

      /* ========================================================================= */
      /* 5. OFFICE BUILDING (Corporate Glass Tower with Faceted Curtain Wall)     */
      /* ========================================================================= */
      case 'Office Building':
        return (
          <g className="transition-transform duration-500 ease-out">
            <ellipse cx="130" cy="148" rx="74" ry="17" fill="rgba(0, 217, 255, 0.08)" filter={`url(#${idPrefix}-shadow)`} />

            {/* Skyscraper Base & Tower Left Facet */}
            <polygon points="85,142 135,156 135,28 85,15" fill="#16385F" stroke="#1677FF" strokeWidth="1" />
            {/* Tower Right Facet */}
            <polygon points="135,156 175,142 175,15 135,28" fill="#0C2037" stroke="#1677FF" strokeWidth="1" />
            {/* Architectural Sloped Penthouse Crown */}
            <polygon points="85,15 135,2 175,15 135,28" fill="#234D7A" stroke="#00D9FF" strokeWidth="1.4" />
            {/* Crown Illuminated Fins */}
            <line x1="135" y1="2" x2="135" y2="28" stroke="#00D9FF" strokeWidth="1.2" filter={`url(#${idPrefix}-glow)`} />

            {/* Vertical Mullion Lines */}
            <line x1="102" y1="20" x2="102" y2="147" stroke="#1677FF" strokeWidth="1" strokeOpacity="0.7" />
            <line x1="118" y1="24" x2="118" y2="151" stroke="#00D9FF" strokeWidth="1.2" strokeOpacity={isHovered ? 1 : 0.75} />
            <line x1="155" y1="22" x2="155" y2="148" stroke="#1677FF" strokeWidth="1" strokeOpacity="0.7" />

            {/* Horizontal Glass Floor Slabs with Illuminated Office Windows */}
            {[0, 1, 2, 3, 4, 5, 6, 7].map((fl) => {
              const y = 34 + fl * 13;
              return (
                <g key={fl}>
                  <line x1="87" y1={y} x2="133" y2={y + 12} stroke="#00D9FF" strokeWidth="0.8" strokeOpacity="0.5" />
                  <polygon points={`92,${y + 2} 100,${y + 4} 100,${y + 8} 92,${y + 6}`} fill={fl % 3 === 0 ? '#FFD43B' : '#00D9FF'} fillOpacity={isHovered ? 0.9 : 0.65} />
                  <polygon points={`108,${y + 6} 128,${y + 11} 128,${y + 15} 108,${y + 10}`} fill="#F5F8FF" fillOpacity={isHovered ? 0.8 : 0.55} />
                  <line x1="137" y1={y + 12} x2="173" y2={y} stroke="#1677FF" strokeWidth="0.8" strokeOpacity="0.4" />
                </g>
              );
            })}

            {/* Double-Height Grand Entrance Lobby (Warm Amber & Cyan Glow) */}
            <polygon points="95,145 130,154 130,138 95,129" fill="#FFD43B" fillOpacity={isHovered ? 0.9 : 0.75} filter={`url(#${idPrefix}-glow)`} />
            <polygon points="130,154 165,144 165,129 130,138" fill="#00D9FF" fillOpacity="0.65" />
          </g>
        );

      /* ========================================================================= */
      /* 6. SHOPPING MALL (Retail Galleria with Geodesic Atrium Dome & LED Media)   */
      /* ========================================================================= */
      case 'Shopping Mall':
        return (
          <g className="transition-transform duration-500 ease-out">
            <ellipse cx="130" cy="146" rx="82" ry="18" fill="rgba(0, 217, 255, 0.08)" filter={`url(#${idPrefix}-shadow)`} />

            {/* Curved Retail Mall Podium - Front Left */}
            <polygon points="65,134 140,154 140,75 65,58" fill="#16375E" stroke="#1677FF" strokeWidth="1" />
            {/* Mall Podium - Front Right */}
            <polygon points="140,154 200,135 200,60 140,75" fill="#0D2139" stroke="#1677FF" strokeWidth="1" />
            {/* Flat Mall Roof Base */}
            <polygon points="65,58 125,40 200,60 140,75" fill="#1C426D" stroke="#00D9FF" strokeWidth="1.1" />

            {/* Central Geodesic Glass Atrium Dome (Warm Yellow / Cyan Light) */}
            <ellipse cx="135" cy="56" rx="30" ry="14" fill="#0A1B2E" stroke="#00D9FF" strokeWidth="1.2" />
            <path d="M105,56 Q135,32 165,56" fill="none" stroke="#00D9FF" strokeWidth="1.5" filter={`url(#${idPrefix}-glow)`} />
            <path d="M115,56 Q135,38 155,56" fill="none" stroke="#FFD43B" strokeWidth="1" />
            <line x1="135" y1="40" x2="135" y2="68" stroke="#00D9FF" strokeWidth="1" />
            <ellipse cx="135" cy="56" rx="14" ry="6" fill="#FFD43B" fillOpacity={isHovered ? 0.7 : 0.5} />

            {/* Large Facade Digital Curved LED Media Screen */}
            <polygon points="75,82 130,96 130,122 75,108" fill="#071426" stroke="#00D9FF" strokeWidth="1.2" />
            {/* Dynamic Energy Waveform Display on Screen */}
            <path d="M78,95 Q90,88 102,96 T126,98" fill="none" stroke="#00D9FF" strokeWidth="1.5" className={isHovered ? 'animate-pulse' : ''} />
            <path d="M78,103 Q92,109 105,102 T126,108" fill="none" stroke="#FFD43B" strokeWidth="1.2" />

            {/* Retail Anchor Store Entrance Portals */}
            <polygon points="148,142 190,130 190,105 148,116" fill="#112743" stroke="#1677FF" strokeWidth="0.8" />
            <polygon points="155,138 185,128 185,120 155,129" fill="#00D9FF" fillOpacity={isHovered ? 0.9 : 0.7} filter={`url(#${idPrefix}-glow)`} />

            {/* Plaza Light Pylons */}
            <line x1="70" y1="137" x2="70" y2="128" stroke="#00D9FF" strokeWidth="1.5" />
            <circle cx="70" cy="127" r="2" fill="#00D9FF" filter={`url(#${idPrefix}-glow)`} />
            <line x1="195" y1="138" x2="195" y2="129" stroke="#FFD43B" strokeWidth="1.5" />
            <circle cx="195" cy="128" r="2" fill="#FFD43B" filter={`url(#${idPrefix}-glow)`} />
          </g>
        );

      /* ========================================================================= */
      /* 7. HOTEL (Luxury Hospitality Tower with Infinity Pool & Porte-Cochere)    */
      /* ========================================================================= */
      case 'Hotel':
        return (
          <g className="transition-transform duration-500 ease-out">
            <ellipse cx="130" cy="148" rx="76" ry="18" fill="rgba(0, 217, 255, 0.08)" filter={`url(#${idPrefix}-shadow)`} />

            {/* Stepped Hotel Tower Structure */}
            <polygon points="80,140 135,154 135,42 80,28" fill="#15365C" stroke="#1677FF" strokeWidth="1" />
            <polygon points="135,154 180,140 180,45 135,42" fill="#0D223B" stroke="#1677FF" strokeWidth="1" />
            <polygon points="80,28 115,16 160,26 135,42" fill="#1E4572" stroke="#00D9FF" strokeWidth="1.2" />

            {/* Rooftop Penthouse Lounge */}
            <polygon points="95,23 120,14 145,21 125,32" fill="#091A2E" stroke="#FFD43B" strokeWidth="1" />
            <polygon points="102,25 118,19 138,24 122,31" fill="#FFD43B" fillOpacity={isHovered ? 0.9 : 0.7} filter={`url(#${idPrefix}-glow)`} />

            {/* Cascading Terrace Infinity Pool Deck (Cyan Shimmering Water) */}
            <polygon points="135,85 178,72 195,78 152,91" fill="#00D9FF" fillOpacity={isHovered ? 0.9 : 0.75} stroke="#00D9FF" strokeWidth="1.2" filter={`url(#${idPrefix}-glow)`} />
            <polygon points="135,85 152,91 152,98 135,92" fill="#0C2440" stroke="#1677FF" strokeWidth="0.8" />
            <polygon points="152,91 195,78 195,85 152,98" fill="#06182C" stroke="#1677FF" strokeWidth="0.8" />

            {/* Warm Guest Suite Balconies */}
            {[0, 1, 2, 3, 4].map((f) => (
              <g key={f}>
                <polygon points={`86,${42 + f * 17} 128,${53 + f * 17} 128,${59 + f * 17} 86,${48 + f * 17}`} fill="#FFD43B" fillOpacity={isHovered ? 0.85 : 0.65} />
                <line x1="86" y1={47 + f * 17} x2="128" y2={58 + f * 17} stroke="#10243D" strokeWidth="1" />
              </g>
            ))}

            {/* Grand Porte-Cochere Glass Canopy */}
            <polygon points="65,142 110,154 125,148 80,137" fill="#1B3F68" stroke="#00D9FF" strokeWidth="1.2" />
            <polygon points="75,145 105,153 105,155 75,147" fill="#FFD43B" filter={`url(#${idPrefix}-glow)`} />
          </g>
        );

      /* ========================================================================= */
      /* 8. FACTORY / INDUSTRIAL (Sawtooth Roofs, Smokestacks & Substation)        */
      /* ========================================================================= */
      case 'Factory / Industrial Building':
        return (
          <g className="transition-transform duration-500 ease-out">
            <ellipse cx="130" cy="146" rx="82" ry="18" fill="rgba(0, 217, 255, 0.08)" filter={`url(#${idPrefix}-shadow)`} />

            {/* Industrial Sawtooth Roof Sections (3 Bays) */}
            {/* Main Warehouse / Plant Left Face */}
            <polygon points="65,135 150,152 150,85 65,68" fill="#143458" stroke="#1677FF" strokeWidth="1" />
            {/* Plant Right Face */}
            <polygon points="150,152 195,138 195,78 150,85" fill="#0D2037" stroke="#1677FF" strokeWidth="1" />

            {/* Sawtooth Bay 1 */}
            <polygon points="65,68 85,42 98,58" fill="#1E4472" stroke="#00D9FF" strokeWidth="1" />
            <polygon points="85,42 125,50 138,66 98,58" fill="#0B1A2C" stroke="#00D9FF" strokeWidth="0.8" />
            {/* Sawtooth Bay 2 */}
            <polygon points="98,58 118,32 131,48" fill="#1E4472" stroke="#00D9FF" strokeWidth="1" />
            <polygon points="118,32 158,40 171,56 131,48" fill="#0B1A2C" stroke="#00D9FF" strokeWidth="0.8" />
            {/* Sawtooth Bay 3 */}
            <polygon points="131,48 150,26 160,40" fill="#1E4472" stroke="#00D9FF" strokeWidth="1" />
            <polygon points="150,26 185,34 195,48 160,40" fill="#0B1A2C" stroke="#00D9FF" strokeWidth="0.8" />

            {/* Twin Heavy Industrial Stacks with Warning Hazard Stripes */}
            <rect x="175" y="24" width="6" height="40" fill="#163456" stroke="#1677FF" strokeWidth="0.8" />
            <line x1="175" y1="30" x2="181" y2="30" stroke="#FFD43B" strokeWidth="1.5" />
            <line x1="175" y1="38" x2="181" y2="38" stroke="#FFD43B" strokeWidth="1.5" />
            <circle cx="178" cy="24" r="1.5" fill="#FF4D4F" className={isHovered ? 'animate-pulse' : ''} />

            <rect x="187" y="32" width="5" height="35" fill="#102844" stroke="#1677FF" strokeWidth="0.8" />
            <line x1="187" y1="38" x2="192" y2="38" stroke="#FFD43B" strokeWidth="1.5" />
            <circle cx="189.5" cy="32" r="1.5" fill="#FF4D4F" />

            {/* Outdoor High-Voltage Substation Module on Left */}
            <polygon points="50,132 75,138 75,115 50,110" fill="#0B1C30" stroke="#FFD43B" strokeWidth="1" />
            <line x1="56" y1="112" x2="56" y2="104" stroke="#FFD43B" strokeWidth="1.5" />
            <circle cx="56" cy="104" r="2" fill="#FFD43B" filter={`url(#${idPrefix}-glow)`} />
            <line x1="68" y1="115" x2="68" y2="107" stroke="#00D9FF" strokeWidth="1.5" />
            <circle cx="68" cy="107" r="2" fill="#00D9FF" filter={`url(#${idPrefix}-glow)`} />

            {/* Roll-up Crane Loading Bay Doors */}
            <polygon points="85,142 115,148 115,118 85,112" fill="#081628" stroke="#00D9FF" strokeWidth="1" />
            <line x1="85" y1="122" x2="115" y2="128" stroke="#FFD43B" strokeWidth="1" strokeDasharray="3,2" />
            <line x1="85" y1="132" x2="115" y2="138" stroke="#FFD43B" strokeWidth="1" strokeDasharray="3,2" />
          </g>
        );

      /* ========================================================================= */
      /* 9. IT PARK / DATA CENTER (Server Cube Halls & Cryogenic Chiller Ducting)  */
      /* ========================================================================= */
      case 'IT Park':
        return (
          <g className="transition-transform duration-500 ease-out">
            <ellipse cx="130" cy="148" rx="80" ry="18" fill="rgba(0, 217, 255, 0.08)" filter={`url(#${idPrefix}-shadow)`} />

            {/* Subterranean Glowing Fiber-Optic / Busduct Pathways */}
            <path d="M55,142 L95,154 L175,138 L205,145" fill="none" stroke="#00D9FF" strokeWidth="1.4" strokeDasharray="4,2" filter={`url(#${idPrefix}-glow)`} />

            {/* Server Hall Alpha (Left High-Density Block) */}
            <polygon points="65,134 115,147 115,55 65,42" fill="#14355B" stroke="#1677FF" strokeWidth="1" />
            <polygon points="115,147 140,135 140,44 115,55" fill="#0D223B" stroke="#1677FF" strokeWidth="1" />
            <polygon points="65,42 90,30 140,44 115,55" fill="#1F4775" stroke="#00D9FF" strokeWidth="1.2" />

            {/* Server Hall Beta (Right Redundant Block) */}
            <polygon points="140,135 185,123 185,48 140,60" fill="#0E243E" stroke="#1677FF" strokeWidth="1" />
            <polygon points="140,60 165,48 210,60 185,72" fill="#183D68" stroke="#00D9FF" strokeWidth="1" />

            {/* Inter-Building Overhead Busduct / High-Voltage Power Bridge */}
            <polygon points="110,75 145,67 145,77 110,85" fill="#102540" stroke="#00D9FF" strokeWidth="1.2" />
            <line x1="112" y1="80" x2="143" y2="72" stroke="#FFD43B" strokeWidth="1.5" className={isHovered ? 'animate-pulse' : ''} />

            {/* Visible Server Rack Arrays Through Tinted Glass Windows */}
            {[0, 1, 2, 3].map((r) => (
              <g key={r}>
                <polygon points={`72,${56 + r * 19} 108,${65 + r * 19} 108,${71 + r * 19} 72,${62 + r * 19}`} fill="#00D9FF" fillOpacity={isHovered ? 0.9 : 0.7} filter={`url(#${idPrefix}-glow)`} />
                {/* Server Status Blinking LEDs */}
                <circle cx="78" cy={59 + r * 19} r="1" fill="#FFD43B" />
                <circle cx="84" cy={60.5 + r * 19} r="1" fill="#00D9FF" />
                <circle cx="90" cy={62 + r * 19} r="1" fill="#00D9FF" />
                <circle cx="96" cy={63.5 + r * 19} r="1" fill="#FFD43B" />
              </g>
            ))}

            {/* Rooftop Precision Chiller & Cooling Fans on Alpha */}
            <ellipse cx="102" cy="38" rx="8" ry="4" fill="#091B2F" stroke="#00D9FF" strokeWidth="1" />
            <circle cx="102" cy="38" r="1.5" fill="#00D9FF" className={isHovered ? 'animate-spin' : ''} />
            <ellipse cx="120" cy="43" rx="8" ry="4" fill="#091B2F" stroke="#00D9FF" strokeWidth="1" />
            <circle cx="120" cy="43" r="1.5" fill="#00D9FF" />
          </g>
        );

      /* ========================================================================= */
      /* 10. WAREHOUSE (High-Bay Logistics Hub with Mega Rooftop Solar Farm)        */
      /* ========================================================================= */
      case 'Warehouse':
        return (
          <g className="transition-transform duration-500 ease-out">
            <ellipse cx="130" cy="146" rx="84" ry="18" fill="rgba(0, 217, 255, 0.08)" filter={`url(#${idPrefix}-shadow)`} />

            {/* Long-Span Warehouse Front Face */}
            <polygon points="55,134 165,152 165,85 55,67" fill="#143457" stroke="#1677FF" strokeWidth="1" />
            {/* Warehouse Loading Apron Side */}
            <polygon points="165,152 205,138 205,74 165,85" fill="#0C2036" stroke="#1677FF" strokeWidth="1" />
            {/* Low-Slope Roof */}
            <polygon points="55,67 115,48 205,74 165,85" fill="#1C436F" stroke="#00D9FF" strokeWidth="1.2" />

            {/* Mega 200kW+ Rooftop Solar PV Matrix */}
            <polygon points="68,67 118,51 185,73 145,86" fill="#09182A" stroke="#00D9FF" strokeWidth="1" />
            {/* Solar Array Grid Rows */}
            <line x1="82" y1="64" x2="152" y2="82" stroke="#00D9FF" strokeWidth="0.7" strokeOpacity="0.6" />
            <line x1="96" y1="60" x2="166" y2="78" stroke="#00D9FF" strokeWidth="0.7" strokeOpacity="0.6" />
            <line x1="110" y1="56" x2="180" y2="74" stroke="#00D9FF" strokeWidth="0.7" strokeOpacity="0.6" />

            {/* High-Bay Clerestory Continuous Daylight Strip */}
            <polygon points="62,77 158,92 158,97 62,82" fill="#00D9FF" fillOpacity={isHovered ? 0.8 : 0.6} />

            {/* Row of 4 Truck Loading Docks with Yellow Safety Bumpers */}
            {[0, 1, 2, 3].map((d) => {
              const xStart = 72 + d * 22;
              const yStart = 118 + d * 3.5;
              return (
                <g key={d}>
                  <polygon points={`${xStart},${yStart} ${xStart + 16},${yStart + 2.5} ${xStart + 16},${yStart + 23} ${xStart},${yStart + 20.5}`} fill="#081627" stroke="#1677FF" strokeWidth="0.9" />
                  {/* Dock Bumper & Green Light */}
                  <line x1={xStart} y1={yStart + 20.5} x2={xStart + 16} y2={yStart + 23} stroke="#FFD43B" strokeWidth="1.8" />
                  <circle cx={xStart + 2} cy={yStart + 2} r="1" fill="#00D9FF" />
                </g>
              );
            })}

            {/* High-Mast Yard Floodlight */}
            <line x1="195" y1="140" x2="195" y2="105" stroke="#1677FF" strokeWidth="1.5" />
            <polygon points="191,105 199,105 195,101" fill="#FFD43B" filter={`url(#${idPrefix}-glow)`} />
          </g>
        );

      /* ========================================================================= */
      /* 11. OTHER COMMERCIAL (Modern Showroom, Cantilever Canopy & Energy Totem)  */
      /* ========================================================================= */
      case 'Other Commercial Building':
      default:
        return (
          <g className="transition-transform duration-500 ease-out">
            <ellipse cx="130" cy="146" rx="80" ry="18" fill="rgba(0, 217, 255, 0.08)" filter={`url(#${idPrefix}-shadow)`} />

            {/* Asymmetric Cantilever Showroom Block */}
            <polygon points="75,135 150,152 150,68 75,52" fill="#15365C" stroke="#1677FF" strokeWidth="1" />
            <polygon points="150,152 195,138 195,58 150,68" fill="#0D2138" stroke="#1677FF" strokeWidth="1" />
            {/* Dramatic Angled Canopy Roof */}
            <polygon points="55,50 135,32 195,58 150,68" fill="#1F4775" stroke="#00D9FF" strokeWidth="1.3" />

            {/* Panoramic Floor-to-Ceiling Showroom Glass (Warm + Cyan Interior Spotlight) */}
            <polygon points="82,88 142,102 142,143 82,129" fill="#FFD43B" fillOpacity={isHovered ? 0.9 : 0.75} filter={`url(#${idPrefix}-glow)`} />
            <polygon points="142,102 188,90 188,131 142,143" fill="#00D9FF" fillOpacity={isHovered ? 0.8 : 0.6} />

            {/* Architectural Vertical Composite Fins */}
            <line x1="98" y1="92" x2="98" y2="133" stroke="#10243D" strokeWidth="1.5" />
            <line x1="116" y1="96" x2="116" y2="137" stroke="#10243D" strokeWidth="1.5" />
            <line x1="165" y1="96" x2="165" y2="137" stroke="#10243D" strokeWidth="1.5" />

            {/* Illuminated Commercial Entrance Pylon / Energy Totem */}
            <polygon points="58,142 66,145 66,108 58,105" fill="#0C2037" stroke="#00D9FF" strokeWidth="1" />
            <line x1="62" y1="108" x2="62" y2="140" stroke="#00D9FF" strokeWidth="1.2" filter={`url(#${idPrefix}-glow)`} />
            <circle cx="62" cy="106" r="2" fill="#FFD43B" filter={`url(#${idPrefix}-glow)`} />
          </g>
        );
    }
  };

  return (
    <div className="relative w-full h-full flex items-center justify-center overflow-visible select-none pointer-events-none">
      <svg
        viewBox="0 0 260 170"
        className={`w-full h-full ${compact ? 'max-h-[105px]' : 'max-h-[175px]'} object-contain transition-transform duration-500 ease-out`}
        style={{
          transform: isHovered
            ? 'translateZ(20px) rotateY(-4deg) scale(1.05)'
            : 'translateZ(0px) rotateY(0deg) scale(1)',
          transformStyle: 'preserve-3d',
          willChange: 'transform'
        }}
      >
        <defs>
          {/* Energy Cyan Glow */}
          <filter id={`${idPrefix}-glow`} x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="2.5" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>

          {/* Soft Ground Shadow Filter */}
          <filter id={`${idPrefix}-shadow`} x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="4" />
          </filter>

          {/* Background Ambient Radial Gradient */}
          <radialGradient id={`${idPrefix}-radial`} cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#00D9FF" stopOpacity={isHovered ? '0.22' : '0.12'} />
            <stop offset="60%" stopColor="#1677FF" stopOpacity={isHovered ? '0.12' : '0.05'} />
            <stop offset="100%" stopColor="#071426" stopOpacity="0" />
          </radialGradient>
        </defs>

        {/* Ambient Energy Glow Circle Behind Model */}
        <circle cx="130" cy="85" r="70" fill={`url(#${idPrefix}-radial)`} />

        {/* Subtle Background Isometric Grid Floor */}
        <g stroke="#1677FF" strokeWidth="0.5" strokeOpacity="0.15">
          <line x1="30" y1="140" x2="130" y2="185" />
          <line x1="80" y1="120" x2="180" y2="165" />
          <line x1="130" y1="100" x2="230" y2="145" />
          <line x1="130" y1="185" x2="230" y2="140" />
          <line x1="80" y1="165" x2="180" y2="120" />
          <line x1="30" y1="145" x2="130" y2="100" />
        </g>

        {/* The Individual Building Architectural Model */}
        {renderBuilding()}
      </svg>
    </div>
  );
};

export default Building3DModel;

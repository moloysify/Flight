import React, { useState, useEffect, useMemo } from 'react';
import { Search, Plane, DollarSign, Filter, ArrowRight, MapPin, Calendar, Users, TrendingDown } from 'lucide-react';

// Mock API - Replace with real flight API (Amadeus, Skyscanner, etc.)
const fetchFlightData = async (origin, destination) => {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 800));
  
  // Mock flight data - In production, replace with actual API call
  const airlines = ['Delta', 'United', 'American', 'Emirates', 'Lufthansa', 'Air France', 'British Airways', 'Qatar Airways'];
  const routes = [];
  
  // Generate sample routes between major cities
  const cities = [
    { name: 'New York', code: 'JFK', lat: 40.6413, lng: -73.7781 },
    { name: 'London', code: 'LHR', lat: 51.4700, lng: -0.4543 },
    { name: 'Tokyo', code: 'NRT', lat: 35.7720, lng: 140.3929 },
    { name: 'Paris', code: 'CDG', lat: 49.0097, lng: 2.5479 },
    { name: 'Dubai', code: 'DXB', lat: 25.2532, lng: 55.3657 },
    { name: 'Los Angeles', code: 'LAX', lat: 33.9416, lng: -118.4085 },
    { name: 'Singapore', code: 'SIN', lat: 1.3644, lng: 103.9915 },
    { name: 'Sydney', code: 'SYD', lat: -33.9399, lng: 151.1753 },
    { name: 'São Paulo', code: 'GRU', lat: -23.4356, lng: -46.4731 },
    { name: 'Mumbai', code: 'BOM', lat: 19.0896, lng: 72.8656 }
  ];
  
  cities.forEach((originCity, i) => {
    cities.forEach((destCity, j) => {
      if (i !== j) {
        const distance = Math.sqrt(
          Math.pow(originCity.lat - destCity.lat, 2) + 
          Math.pow(originCity.lng - destCity.lng, 2)
        ) * 111; // Rough km conversion
        
        // Generate 1-3 routes per city pair
        const numRoutes = Math.floor(Math.random() * 3) + 1;
        for (let k = 0; k < numRoutes; k++) {
          const airline = airlines[Math.floor(Math.random() * airlines.length)];
          const basePrice = 200 + (distance * (0.1 + Math.random() * 0.15));
          const stops = Math.random() > 0.6 ? (Math.random() > 0.5 ? 1 : 2) : 0;
          const priceMultiplier = 1 + (stops * 0.15) + (Math.random() * 0.4 - 0.2);
          
          routes.push({
            id: `${originCity.code}-${destCity.code}-${airline}-${k}`,
            origin: originCity,
            destination: destCity,
            airline,
            price: Math.round(basePrice * priceMultiplier),
            stops,
            duration: Math.round(distance / 800 * 60) + (stops * 90), // minutes
            departure: new Date(Date.now() + Math.random() * 7 * 24 * 60 * 60 * 1000),
            seats: Math.floor(Math.random() * 150) + 10,
            distance: Math.round(distance)
          });
        }
      }
    });
  });
  
  return routes;
};

const FlightExplorer = () => {
  const [flights, setFlights] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchOrigin, setSearchOrigin] = useState('');
  const [searchDestination, setSearchDestination] = useState('');
  const [selectedAirlines, setSelectedAirlines] = useState([]);
  const [priceRange, setPriceRange] = useState([0, 5000]);
  const [maxStops, setMaxStops] = useState(2);
  const [sortBy, setSortBy] = useState('price');
  const [viewMode, setViewMode] = useState('map');
  const [selectedRoute, setSelectedRoute] = useState(null);

  useEffect(() => {
    loadFlights();
  }, []);

  const loadFlights = async () => {
    setLoading(true);
    const data = await fetchFlightData();
    setFlights(data);
    setLoading(false);
  };

  const airlines = useMemo(() => {
    return [...new Set(flights.map(f => f.airline))].sort();
  }, [flights]);

  const cities = useMemo(() => {
    const citySet = new Set();
    flights.forEach(f => {
      citySet.add(JSON.stringify(f.origin));
      citySet.add(JSON.stringify(f.destination));
    });
    return Array.from(citySet).map(c => JSON.parse(c));
  }, [flights]);

  const filteredFlights = useMemo(() => {
    let filtered = flights;

    if (searchOrigin) {
      filtered = filtered.filter(f => 
        f.origin.name.toLowerCase().includes(searchOrigin.toLowerCase()) ||
        f.origin.code.toLowerCase().includes(searchOrigin.toLowerCase())
      );
    }

    if (searchDestination) {
      filtered = filtered.filter(f => 
        f.destination.name.toLowerCase().includes(searchDestination.toLowerCase()) ||
        f.destination.code.toLowerCase().includes(searchDestination.toLowerCase())
      );
    }

    if (selectedAirlines.length > 0) {
      filtered = filtered.filter(f => selectedAirlines.includes(f.airline));
    }

    filtered = filtered.filter(f => 
      f.price >= priceRange[0] && f.price <= priceRange[1] && f.stops <= maxStops
    );

    return filtered.sort((a, b) => {
      if (sortBy === 'price') return a.price - b.price;
      if (sortBy === 'duration') return a.duration - b.duration;
      if (sortBy === 'stops') return a.stops - b.stops;
      return 0;
    });
  }, [flights, searchOrigin, searchDestination, selectedAirlines, priceRange, maxStops, sortBy]);

  const cheapestRoutes = useMemo(() => {
    const routeMap = new Map();
    filteredFlights.forEach(flight => {
      const key = `${flight.origin.code}-${flight.destination.code}`;
      if (!routeMap.has(key) || routeMap.get(key).price > flight.price) {
        routeMap.set(key, flight);
      }
    });
    return Array.from(routeMap.values()).sort((a, b) => a.price - b.price).slice(0, 10);
  }, [filteredFlights]);

  const toggleAirline = (airline) => {
    setSelectedAirlines(prev => 
      prev.includes(airline) 
        ? prev.filter(a => a !== airline)
        : [...prev, airline]
    );
  };

  const formatDuration = (minutes) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h ${mins}m`;
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-blue-950 to-slate-900 text-white font-sans">
      {/* Header */}
      <header className="border-b border-white/10 bg-black/20 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-6 py-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="bg-gradient-to-br from-cyan-400 to-blue-500 p-3 rounded-xl shadow-lg shadow-cyan-500/20">
                <Plane className="w-7 h-7 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold bg-gradient-to-r from-cyan-300 via-blue-300 to-purple-300 bg-clip-text text-transparent tracking-tight">
                  Flight Explorer
                </h1>
                <p className="text-sm text-cyan-200/60 mt-0.5">Find the cheapest routes worldwide</p>
              </div>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setViewMode('map')}
                className={`px-4 py-2 rounded-lg font-medium transition-all ${
                  viewMode === 'map'
                    ? 'bg-cyan-500 text-white shadow-lg shadow-cyan-500/30'
                    : 'bg-white/5 text-white/60 hover:bg-white/10'
                }`}
              >
                Map View
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`px-4 py-2 rounded-lg font-medium transition-all ${
                  viewMode === 'list'
                    ? 'bg-cyan-500 text-white shadow-lg shadow-cyan-500/30'
                    : 'bg-white/5 text-white/60 hover:bg-white/10'
                }`}
              >
                List View
              </button>
            </div>
          </div>

          {/* Search Bar */}
          <div className="flex gap-3 flex-wrap">
            <div className="flex-1 min-w-[200px] relative">
              <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-cyan-400" />
              <input
                type="text"
                placeholder="From (city or airport code)"
                value={searchOrigin}
                onChange={(e) => setSearchOrigin(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-white/5 border border-white/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent placeholder-white/40 transition-all"
              />
            </div>
            <div className="flex-1 min-w-[200px] relative">
              <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-purple-400" />
              <input
                type="text"
                placeholder="To (city or airport code)"
                value={searchDestination}
                onChange={(e) => setSearchDestination(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-white/5 border border-white/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent placeholder-white/40 transition-all"
              />
            </div>
            <button
              onClick={loadFlights}
              className="px-6 py-3 bg-gradient-to-r from-cyan-500 to-blue-500 rounded-xl font-semibold hover:shadow-lg hover:shadow-cyan-500/30 transition-all flex items-center gap-2"
            >
              <Search className="w-4 h-4" />
              Search
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Filters Sidebar */}
          <div className="lg:col-span-1 space-y-6">
            <div className="bg-black/30 backdrop-blur-xl rounded-2xl p-6 border border-white/10">
              <div className="flex items-center gap-2 mb-6">
                <Filter className="w-5 h-5 text-cyan-400" />
                <h3 className="text-lg font-bold">Filters</h3>
              </div>

              {/* Sort By */}
              <div className="mb-6">
                <label className="text-sm font-medium text-cyan-200 mb-2 block">Sort By</label>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500 text-sm"
                >
                  <option value="price">Lowest Price</option>
                  <option value="duration">Shortest Duration</option>
                  <option value="stops">Fewest Stops</option>
                </select>
              </div>

              {/* Price Range */}
              <div className="mb-6">
                <label className="text-sm font-medium text-cyan-200 mb-2 block">
                  Price Range: ${priceRange[0]} - ${priceRange[1]}
                </label>
                <div className="space-y-2">
                  <input
                    type="range"
                    min="0"
                    max="5000"
                    value={priceRange[0]}
                    onChange={(e) => setPriceRange([parseInt(e.target.value), priceRange[1]])}
                    className="w-full accent-cyan-500"
                  />
                  <input
                    type="range"
                    min="0"
                    max="5000"
                    value={priceRange[1]}
                    onChange={(e) => setPriceRange([priceRange[0], parseInt(e.target.value)])}
                    className="w-full accent-purple-500"
                  />
                </div>
              </div>

              {/* Max Stops */}
              <div className="mb-6">
                <label className="text-sm font-medium text-cyan-200 mb-2 block">
                  Maximum Stops: {maxStops}
                </label>
                <input
                  type="range"
                  min="0"
                  max="2"
                  value={maxStops}
                  onChange={(e) => setMaxStops(parseInt(e.target.value))}
                  className="w-full accent-cyan-500"
                />
                <div className="flex justify-between text-xs text-white/40 mt-1">
                  <span>Direct</span>
                  <span>1 Stop</span>
                  <span>2 Stops</span>
                </div>
              </div>

              {/* Airlines */}
              <div>
                <label className="text-sm font-medium text-cyan-200 mb-3 block">Airlines</label>
                <div className="space-y-2 max-h-60 overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-white/20 scrollbar-track-transparent">
                  {airlines.map(airline => (
                    <label key={airline} className="flex items-center gap-2 cursor-pointer group">
                      <input
                        type="checkbox"
                        checked={selectedAirlines.includes(airline)}
                        onChange={() => toggleAirline(airline)}
                        className="w-4 h-4 rounded border-white/20 bg-white/5 text-cyan-500 focus:ring-2 focus:ring-cyan-500 cursor-pointer"
                      />
                      <span className="text-sm group-hover:text-cyan-300 transition-colors">{airline}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>

            {/* Stats Card */}
            <div className="bg-gradient-to-br from-cyan-500/10 to-blue-500/10 backdrop-blur-xl rounded-2xl p-6 border border-cyan-500/20">
              <div className="text-sm text-cyan-200 mb-1">Showing</div>
              <div className="text-3xl font-bold text-white">{filteredFlights.length}</div>
              <div className="text-sm text-white/60 mt-1">available routes</div>
            </div>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3 space-y-6">
            {/* Cheapest Routes Highlight */}
            <div className="bg-gradient-to-r from-green-500/10 to-emerald-500/10 backdrop-blur-xl rounded-2xl p-6 border border-green-500/20">
              <div className="flex items-center gap-2 mb-4">
                <TrendingDown className="w-5 h-5 text-green-400" />
                <h3 className="text-lg font-bold text-green-300">Best Deals</h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {cheapestRoutes.slice(0, 4).map(flight => (
                  <div
                    key={flight.id}
                    className="bg-black/30 rounded-xl p-4 border border-white/10 hover:border-green-500/30 transition-all cursor-pointer"
                    onClick={() => setSelectedRoute(flight)}
                  >
                    <div className="flex justify-between items-start mb-2">
                      <div className="text-sm font-medium">{flight.origin.code} → {flight.destination.code}</div>
                      <div className="text-lg font-bold text-green-400">${flight.price}</div>
                    </div>
                    <div className="text-xs text-white/60">{flight.airline} • {flight.stops === 0 ? 'Direct' : `${flight.stops} stop${flight.stops > 1 ? 's' : ''}`}</div>
                  </div>
                ))}
              </div>
            </div>

            {loading ? (
              <div className="bg-black/30 backdrop-blur-xl rounded-2xl p-20 border border-white/10 flex items-center justify-center">
                <div className="text-center">
                  <div className="w-16 h-16 border-4 border-cyan-500/30 border-t-cyan-500 rounded-full animate-spin mx-auto mb-4"></div>
                  <p className="text-white/60">Loading flight data...</p>
                </div>
              </div>
            ) : viewMode === 'map' ? (
              /* Map View */
              <div className="bg-black/30 backdrop-blur-xl rounded-2xl border border-white/10 overflow-hidden">
                <div className="relative h-[600px] bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900">
                  {/* Simplified world map visualization */}
                  <svg className="w-full h-full" viewBox="0 0 800 600">
                    {/* Background grid */}
                    <defs>
                      <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
                        <path d="M 40 0 L 0 0 0 40" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="0.5"/>
                      </pattern>
                      <radialGradient id="glow" cx="50%" cy="50%">
                        <stop offset="0%" stopColor="rgba(6, 182, 212, 0.4)" />
                        <stop offset="100%" stopColor="rgba(6, 182, 212, 0)" />
                      </radialGradient>
                    </defs>
                    <rect width="800" height="600" fill="url(#grid)" />
                    
                    {/* Draw routes */}
                    {filteredFlights.slice(0, 50).map((flight, idx) => {
                      const x1 = ((flight.origin.lng + 180) / 360) * 800;
                      const y1 = ((90 - flight.origin.lat) / 180) * 600;
                      const x2 = ((flight.destination.lng + 180) / 360) * 800;
                      const y2 = ((90 - flight.destination.lat) / 180) * 600;
                      
                      // Create curved path
                      const midX = (x1 + x2) / 2;
                      const midY = Math.min(y1, y2) - Math.abs(x2 - x1) * 0.15;
                      
                      const priceRatio = (flight.price - priceRange[0]) / (priceRange[1] - priceRange[0]);
                      const color = priceRatio < 0.33 ? 'rgba(34, 197, 94, 0.4)' : 
                                   priceRatio < 0.66 ? 'rgba(59, 130, 246, 0.4)' : 
                                   'rgba(168, 85, 247, 0.4)';
                      
                      return (
                        <g key={flight.id} className="cursor-pointer hover:opacity-100 transition-opacity" opacity="0.6">
                          <path
                            d={`M ${x1} ${y1} Q ${midX} ${midY} ${x2} ${y2}`}
                            stroke={color}
                            strokeWidth="1.5"
                            fill="none"
                            onClick={() => setSelectedRoute(flight)}
                          />
                        </g>
                      );
                    })}
                    
                    {/* Draw city points */}
                    {cities.slice(0, 30).map(city => {
                      const x = ((city.lng + 180) / 360) * 800;
                      const y = ((90 - city.lat) / 180) * 600;
                      
                      return (
                        <g key={city.code}>
                          <circle cx={x} cy={y} r="15" fill="url(#glow)" />
                          <circle cx={x} cy={y} r="4" fill="rgba(6, 182, 212, 0.9)" stroke="white" strokeWidth="1" />
                          <text x={x} y={y - 10} fill="white" fontSize="10" textAnchor="middle" className="font-medium">
                            {city.code}
                          </text>
                        </g>
                      );
                    })}
                  </svg>
                  
                  {/* Legend */}
                  <div className="absolute bottom-6 left-6 bg-black/60 backdrop-blur-xl rounded-xl p-4 border border-white/10">
                    <div className="text-xs font-medium mb-2 text-cyan-200">Price Range</div>
                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-1 bg-green-500"></div>
                        <span className="text-xs text-white/80">Low</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-1 bg-blue-500"></div>
                        <span className="text-xs text-white/80">Medium</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-1 bg-purple-500"></div>
                        <span className="text-xs text-white/80">High</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              /* List View */
              <div className="space-y-3">
                {filteredFlights.map(flight => (
                  <div
                    key={flight.id}
                    className="bg-black/30 backdrop-blur-xl rounded-xl p-5 border border-white/10 hover:border-cyan-500/30 transition-all cursor-pointer group"
                    onClick={() => setSelectedRoute(flight)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-4 mb-3">
                          <div className="text-center">
                            <div className="text-2xl font-bold">{flight.origin.code}</div>
                            <div className="text-xs text-white/60">{flight.origin.name}</div>
                          </div>
                          <div className="flex-1 flex items-center gap-2">
                            <div className="h-px flex-1 bg-gradient-to-r from-cyan-500 to-purple-500"></div>
                            <Plane className="w-4 h-4 text-cyan-400 rotate-90" />
                            <div className="h-px flex-1 bg-gradient-to-r from-purple-500 to-cyan-500"></div>
                          </div>
                          <div className="text-center">
                            <div className="text-2xl font-bold">{flight.destination.code}</div>
                            <div className="text-xs text-white/60">{flight.destination.name}</div>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-6 text-sm text-white/60">
                          <div className="flex items-center gap-2">
                            <Plane className="w-4 h-4 text-cyan-400" />
                            {flight.airline}
                          </div>
                          <div className="flex items-center gap-2">
                            <Calendar className="w-4 h-4 text-purple-400" />
                            {formatDate(flight.departure)}
                          </div>
                          <div>Duration: {formatDuration(flight.duration)}</div>
                          <div className={`${flight.stops === 0 ? 'text-green-400' : 'text-white/60'}`}>
                            {flight.stops === 0 ? 'Direct' : `${flight.stops} stop${flight.stops > 1 ? 's' : ''}`}
                          </div>
                          <div className="flex items-center gap-2">
                            <Users className="w-4 h-4 text-blue-400" />
                            {flight.seats} seats
                          </div>
                        </div>
                      </div>
                      
                      <div className="text-right ml-6">
                        <div className="text-3xl font-bold text-cyan-400 mb-1">${flight.price}</div>
                        <div className="text-xs text-white/40">per person</div>
                      </div>
                    </div>
                  </div>
                ))}
                
                {filteredFlights.length === 0 && (
                  <div className="bg-black/30 backdrop-blur-xl rounded-2xl p-20 border border-white/10 text-center">
                    <Search className="w-16 h-16 text-white/20 mx-auto mb-4" />
                    <p className="text-white/60 text-lg">No flights found matching your criteria</p>
                    <p className="text-white/40 text-sm mt-2">Try adjusting your filters or search terms</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Route Detail Modal */}
      {selectedRoute && (
        <div
          className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-6 z-50"
          onClick={() => setSelectedRoute(null)}
        >
          <div
            className="bg-gradient-to-br from-slate-900 to-blue-950 rounded-2xl p-8 border border-white/20 max-w-2xl w-full shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between mb-6">
              <div>
                <h3 className="text-2xl font-bold mb-2">Flight Details</h3>
                <div className="text-cyan-400 text-sm">{selectedRoute.airline}</div>
              </div>
              <button
                onClick={() => setSelectedRoute(null)}
                className="text-white/60 hover:text-white transition-colors text-2xl"
              >
                ×
              </button>
            </div>
            
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="text-center flex-1">
                  <div className="text-4xl font-bold mb-2">{selectedRoute.origin.code}</div>
                  <div className="text-white/60">{selectedRoute.origin.name}</div>
                </div>
                <div className="flex-1 flex flex-col items-center gap-2">
                  <Plane className="w-6 h-6 text-cyan-400 rotate-90" />
                  <div className="text-sm text-white/60">{formatDuration(selectedRoute.duration)}</div>
                  <div className="text-sm text-cyan-400">
                    {selectedRoute.stops === 0 ? 'Direct Flight' : `${selectedRoute.stops} Stop${selectedRoute.stops > 1 ? 's' : ''}`}
                  </div>
                </div>
                <div className="text-center flex-1">
                  <div className="text-4xl font-bold mb-2">{selectedRoute.destination.code}</div>
                  <div className="text-white/60">{selectedRoute.destination.name}</div>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4 pt-6 border-t border-white/10">
                <div>
                  <div className="text-sm text-white/60 mb-1">Departure</div>
                  <div className="text-lg font-medium">{formatDate(selectedRoute.departure)}</div>
                </div>
                <div>
                  <div className="text-sm text-white/60 mb-1">Distance</div>
                  <div className="text-lg font-medium">{selectedRoute.distance.toLocaleString()} km</div>
                </div>
                <div>
                  <div className="text-sm text-white/60 mb-1">Available Seats</div>
                  <div className="text-lg font-medium">{selectedRoute.seats} seats</div>
                </div>
                <div>
                  <div className="text-sm text-white/60 mb-1">Price</div>
                  <div className="text-3xl font-bold text-cyan-400">${selectedRoute.price}</div>
                </div>
              </div>
              
              <button className="w-full py-4 bg-gradient-to-r from-cyan-500 to-blue-500 rounded-xl font-semibold text-lg hover:shadow-lg hover:shadow-cyan-500/30 transition-all">
                Book This Flight
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FlightExplorer;

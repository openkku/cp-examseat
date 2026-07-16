// src/pages/RoomInfo.tsx
import { useState, useEffect, useRef, useMemo } from 'react';
import { useLocation, Link } from 'react-router-dom';
import { ImageViewer } from '../components/ImageViewer';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { ScrollToTopButton } from '../components/ScrollToTopButton';

// UI Primitives & Icons
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Input } from '../components/ui/Input';
import { Search, MapPin, Building, Info, ExternalLink, School } from '../components/icons';
import { EmptyState } from '../components/ui/EmptyState';

// Local coordinates & descriptions
const ROOM_CONTENT: Record<string, { title?: string; description?: string; note?: string; lat?: number; lng?: number }> = {
  "CP.9127": {
    title: "ห้องสอบ CP.9127",
    description: "ชั้น 1 อาคารวิทยวิภาส วิทยาลัยการคอมพิวเตอร์",
    lat: 16.475664272450587,
    lng: 102.82516966718458,
  },
  "CP.9525": {
    title: "ห้องสอบ CP.9525",
    description: "ชั้น 5 อาคารวิทยวิภาส วิทยาลัยการคอมพิวเตอร์",
    lat: 16.475664272450587,
    lng: 102.82516966718458,
  },
  "CP.9527": {
    title: "ห้องสอบ CP.9527",
    description: "ชั้น 5 อาคารวิทยวิภาส วิทยาลัยการคอมพิวเตอร์",
    lat: 16.475664272450587,
    lng: 102.82516966718458,
  },
  "SC.1101": {
    title: "ห้องสอบ SC.1101",
    description: "ตึกกลม คณะวิทยาศาสตร์",
    lat: 16.475242318746584,
    lng: 102.82310162638832,
  },
  "SC.1102": {
    title: "ห้องสอบ SC.1102",
    description: "ตึกกลม คณะวิทยาศาสตร์",
    lat: 16.475242318746584,
    lng: 102.82310162638832,
  },
  "SC.1103": {
    title: "ห้องสอบ SC.1103",
    description: "ตึกกลม คณะวิทยาศาสตร์",
    lat: 16.475242318746584,
    lng: 102.82310162638832,
  },
  "SC.3201": {
    title: "ห้องสอบ SC.3201",
    description: "ชั้น 2 ภาควิชาชีววิทยา คณะวิทยาศาสตร์",
    lat: 16.476367129613752,
    lng: 102.82519934748095,
  },
  "SC.5101": {
    title: "ห้องสอบ SC.5101",
    description: "อาคารเรียนรวมวิทยาศาสตร์ คณะวิทยาศาสตร์",
    lat: 16.474871688355226,
    lng: 102.82398728773137,
  },
  "SC.5102": {
    title: "ห้องสอบ SC.5102",
    description: "อาคารเรียนรวมวิทยาศาสตร์ คณะวิทยาศาสตร์",
    lat: 16.474871688355226,
    lng: 102.82398728773137,
  },
  "SC.5103": {
    title: "ห้องสอบ SC.5103",
    description: "อาคารเรียนรวมวิทยาศาสตร์ คณะวิทยาศาสตร์",
    lat: 16.474871688355226,
    lng: 102.82398728773137,
  },
  "SC.7401": {
    title: "ห้องสอบ SC.7401",
    description: "ภาควิชาคณิตศาสตร์ คณะวิทยาศาสตร์ ชั้น 4",
    lat: 16.476576792328274,
    lng: 102.82434768048124,
  },
  "SC.9107": {
    title: "ห้องสอบ SC.9107",
    description: "อาคารวิทยวิภาส วิทยาลัยการคอมพิวเตอร์",
    lat: 16.475664272450587,
    lng: 102.82516966718458,
  },
  "SC.9108": {
    title: "ห้องสอบ SC.9108",
    description: "อาคารวิทยวิภาส วิทยาลัยการคอมพิวเตอร์",
    lat: 16.475664272450587,
    lng: 102.82516966718458,
  },
};

interface ApiImages {
  i_images?: string[];
  i_layout?: string;
  i_map?: string;
  layout?: any[];
}

type RoomConfigMap = Record<string, ApiImages>;

const getRoomContent = (roomId: string) => {
  const normalizedId = roomId.trim().toUpperCase();
  const safeDictionary = Object.fromEntries(
    Object.entries(ROOM_CONTENT).map(([k, v]) => [k.trim().toUpperCase(), v])
  );

  return safeDictionary[normalizedId] || {
    title: `ห้องสอบ ${roomId}`,
    description: "College of Computing มหาวิทยาลัยขอนแก่น"
  };
};

// Auto fits bounds of the Map instance to match all active markers
const MapBoundsFitter = ({ positions }: { positions: [number, number][] }) => {
  const map = useMap();

  useEffect(() => {
    if (positions.length > 0) {
      const bounds = L.latLngBounds(positions);
      map.fitBounds(bounds, { padding: [50, 50], maxZoom: 18 });
    }
  }, [map, positions]);

  return null;
};

export const RoomInfo = () => {
  const [apiRooms, setApiRooms] = useState<RoomConfigMap | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [viewerData, setViewerData] = useState<{ src?: string; images?: string[]; index?: number } | null>(null);

  // Filter States
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'all' | 'cp' | 'sc'>('all');

  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const location = useLocation();

  const scrollToRoom = (targetId: string) => {
    const scrollContainer = scrollContainerRef.current;
    if (scrollContainer) {
      const element = document.getElementById(targetId);
      if (element) {
        const containerRect = scrollContainer.getBoundingClientRect();
        const elementRect = element.getBoundingClientRect();
        const relativeTop = elementRect.top - containerRect.top + scrollContainer.scrollTop;
        scrollContainer.scrollTo({
          top: relativeTop - 96,
          behavior: 'smooth'
        });
      }
    }
  };

  useEffect(() => {
    const fetchAllRooms = async () => {
      try {
        setLoading(true);
        setError('');

        const res = await fetch(`/api/room?no_layout=true`);
        if (!res.ok) throw new Error("Failed to fetch room data.");

        const data = await res.json();
        setApiRooms(data);
      } catch (err: any) {
        setError(err.message || "Error fetching data");
      } finally {
        setLoading(false);
      }
    };

    fetchAllRooms();
  }, []);

  useEffect(() => {
    if (!loading && apiRooms && location.hash) {
      const targetId = location.hash.replace('#', '');
      setTimeout(() => {
        scrollToRoom(targetId);
      }, 150);
    }
  }, [loading, apiRooms, location.hash]);

  // Filter entries
  const filteredRooms = useMemo(() => {
    if (!apiRooms) return [];
    return Object.entries(apiRooms).filter(([roomId]) => {
      const matchesSearch = roomId.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesTab = activeTab === 'all'
        || (activeTab === 'cp' && roomId.startsWith('CP'))
        || (activeTab === 'sc' && roomId.startsWith('SC'));
      return matchesSearch && matchesTab;
    });
  }, [apiRooms, searchQuery, activeTab]);

  if (loading) {
    return (
      <div className="h-full w-full flex items-center justify-center bg-slate-50/50 dark:bg-slate-950/50 transition-colors">
        <div className="flex flex-col items-center text-slate-500 dark:text-slate-400">
          <svg className="animate-spin h-10 w-10 mb-4 text-blue-600 dark:text-blue-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span className="text-sm font-bold uppercase tracking-wider">กำลังโหลดข้อมูลห้องสอบ...</span>
        </div>
      </div>
    );
  }

  if (error || !apiRooms) {
    return (
      <div className="h-full w-full flex items-center justify-center bg-slate-50 dark:bg-slate-950 p-4 transition-colors">
        <Card className="p-8 rounded-2xl shadow-xl border border-slate-200/50 dark:border-slate-800 text-center max-w-sm w-full">
          <div className="text-rose-500 text-sm font-bold mb-4">{error}</div>
          <Link to="/" className="text-blue-600 dark:text-blue-400 font-bold hover:underline">กลับหน้าหลัก</Link>
        </Card>
      </div>
    );
  }

  return (
    <div
      ref={scrollContainerRef}
      className="h-full w-full overflow-y-auto bg-slate-50/30 dark:bg-slate-950/20 relative transition-colors"
    >
      {/* Sticky Header Bar (Glassmorphic & Compact on Mobile) */}
      <div className="bg-white/70 dark:bg-slate-900/70 border-b border-slate-200/50 dark:border-slate-850 sticky top-0 z-20 backdrop-blur-xl px-4 sm:px-6 py-2.5 sm:py-4 transition-all duration-300 select-none">
        <div className="max-w-5xl mx-auto flex flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2 sm:gap-3 min-w-0">
            <div className="p-2 bg-gradient-to-tr from-indigo-500 via-blue-500 to-cyan-500 rounded-xl text-white shadow-md shadow-indigo-500/10 shrink-0 hidden sm:flex">
              <School className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <Link to="/" className="inline-flex items-center text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 font-bold text-nano sm:text-xxs uppercase tracking-wider mb-1 transition gap-1 leading-none">
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7"></path></svg>
                กลับหน้าค้นหา
              </Link>
              <h1 className="text-sm sm:text-base md:text-xl lg:text-2xl font-black text-slate-800 dark:text-slate-100 tracking-tight leading-none truncate">
                ข้อมูลห้องสอบทั้งหมด
              </h1>
              <p className="text-xxs font-extrabold uppercase tracking-wider text-slate-500 dark:text-slate-400 mt-1 hidden sm:block">
                วิทยาลัยการคอมพิวเตอร์ มหาวิทยาลัยขอนแก่น
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-6 py-6 pb-24 space-y-6">
        
        {/* Quick Filters (Flows with scroll so it doesn't block viewport on mobile) */}
        <div className="w-full flex flex-col md:flex-row gap-4 items-stretch md:items-center justify-between pb-4 border-b border-slate-200/40 dark:border-slate-800/80">
          <div>
            <h2 className="text-xs font-black text-slate-400 dark:text-slate-500 tracking-wider uppercase leading-none mb-1">
              ค้นหาและคัดกรองห้องสอบ
            </h2>
            <p className="text-xxs font-semibold text-slate-400 dark:text-slate-500">กรองห้องสอบตามตึกเรียนหรือค้นหาด้วยชื่อห้อง</p>
          </div>
          <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center w-full md:w-auto">
            <Input
              type="text"
              placeholder="ค้นหาชื่อห้องสอบ..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              leftIcon={<Search className="w-4 h-4" />}
              containerClassName="w-full sm:w-56"
              className="py-2.5 text-xs"
            />
            <div className="bg-white dark:bg-slate-900 border border-slate-200/50 dark:border-slate-800 p-1.5 rounded-xl flex items-center gap-1 shadow-sm shrink-0">
              <button
                onClick={() => setActiveTab('all')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${activeTab === 'all'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
                  }`}
              >
                ทั้งหมด
              </button>
              <button
                onClick={() => setActiveTab('cp')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${activeTab === 'cp'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
                  }`}
              >
                ตึก CP
              </button>
              <button
                onClick={() => setActiveTab('sc')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${activeTab === 'sc'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
                  }`}
              >
                ตึก SC
              </button>
            </div>
          </div>
        </div>

        {/* MAP CONTAINER */}
        <Card className="w-full overflow-hidden transition-all shadow-md">
          <div className="p-4 border-b border-slate-100 dark:border-slate-800/80 bg-slate-50/50 dark:bg-slate-950/50 flex items-center">
            <MapPin className="w-4.5 h-4.5 mr-2 text-rose-500 shrink-0" />
            <h2 className="text-xs font-black text-slate-400 dark:text-slate-550 tracking-wider uppercase leading-none mt-0.5">
              แผนที่จุดสอบทั้งหมด
            </h2>
          </div>

          <div className="w-full h-[320px] md:h-[380px] relative z-0">
            <MapContainer center={[16.4466, 102.8285]} zoom={16} scrollWheelZoom={false} dragging={true} tap={false as any} style={{ height: "100%", width: "100%", zIndex: 0 }}>
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />

              {(() => {
                const groupedLocations: Record<string, { lat: number; lng: number; rooms: string[] }> = {};
                const allPositions: [number, number][] = [];

                Object.keys(apiRooms).forEach((roomId) => {
                  const content = getRoomContent(roomId);
                  if (content.lat && content.lng) {
                    const key = `${content.lat},${content.lng}`;
                    if (!groupedLocations[key]) {
                      groupedLocations[key] = { lat: content.lat, lng: content.lng, rooms: [] };
                    }
                    groupedLocations[key].rooms.push(roomId);
                    allPositions.push([content.lat, content.lng]);
                  }
                });

                return (
                  <>
                    {allPositions.length > 0 && <MapBoundsFitter positions={allPositions} />}
                    {Object.values(groupedLocations).map((group, index) => {
                      const roomCount = group.rooms.length;
                      const clusterIcon = L.divIcon({
                        className: 'custom-cluster-marker',
                        html: `<div style="background-color: #f43f5e; color: white; width: 30px; height: 30px; border-radius: 50%; border: 3px solid white; box-shadow: 0 0 10px rgba(0,0,0,0.2); display: flex; align-items: center; justify-content: center; font-size: 13px; font-weight: 800;">
                                 ${roomCount > 1 ? roomCount : ''}
                               </div>`,
                        iconSize: [30, 30],
                        iconAnchor: [15, 15],
                      });

                      return (
                        <Marker key={index} position={[group.lat, group.lng]} icon={clusterIcon}>
                          <Popup>
                            <div className="text-center pb-1 min-w-[140px] font-sans">
                              <div className="flex flex-col gap-1.5">
                                {group.rooms.map((roomId) => (
                                  <button
                                    key={roomId}
                                    onClick={() => {
                                      scrollToRoom(`room-${roomId.toLowerCase()}`);
                                    }}
                                    className="bg-blue-50 dark:bg-blue-950 hover:bg-blue-600 dark:hover:bg-blue-800 hover:text-white text-blue-700 dark:text-blue-400 text-xs font-bold px-3 py-2 rounded-xl transition border border-blue-100 dark:border-blue-900 cursor-pointer outline-none"
                                  >
                                    {roomId}
                                  </button>
                                ))}
                              </div>
                            </div>
                          </Popup>
                        </Marker>
                      );
                    })}
                  </>
                );
              })()}
            </MapContainer>
          </div>
        </Card>

        {/* INDIVIDUAL ROOM METADATA GRID (2-column on desktop) */}
        {filteredRooms.length === 0 ? (
          <div className="py-12">
            <EmptyState title="ไม่พบห้องสอบที่ระบุ" description="โปรดตรวจสอบการค้นหาหรือแท็บที่เลือกอีกครั้ง" icon="🏫" />
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
            {filteredRooms.map(([roomId, apiData]) => {
              const content = getRoomContent(roomId);

              return (
                <Card
                  key={roomId}
                  id={`room-${roomId.toLowerCase()}`}
                  className="w-full scroll-mt-24 shadow-md hover:shadow-xl transition-all duration-300"
                >
                  {/* Card Header */}
                  <div className="p-6 border-b border-slate-100 dark:border-slate-800/80 bg-white dark:bg-slate-900 flex justify-between items-start gap-4">
                    <div className="min-w-0">
                      <Badge variant="blue" size="sm" className="mb-2 font-extrabold font-mono">
                        {roomId}
                      </Badge>
                      <h2 className="text-lg font-black text-slate-800 dark:text-slate-100 mb-1.5 leading-snug truncate">{content.title}</h2>
                      <p className="text-xs font-semibold text-slate-400 dark:text-slate-500 truncate">{content.description}</p>

                      {content.note && (
                        <div className="mt-3 p-3 bg-amber-50 dark:bg-amber-900/10 border-l-4 border-amber-500 text-amber-800 dark:text-amber-400 rounded-r-xl text-[10.5px] flex items-start max-w-md font-semibold leading-relaxed">
                          <Info className="w-4 h-4 mr-1.5 flex-shrink-0 mt-0.5" />
                          <span>{content.note}</span>
                        </div>
                      )}
                    </div>

                    {apiData.i_map && (
                      <a
                        href={apiData.i_map}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="shrink-0 bg-slate-100 hover:bg-indigo-50 border border-slate-200 hover:border-indigo-200 dark:bg-slate-800 dark:hover:bg-slate-750 dark:border-slate-700/50 hover:text-indigo-600 dark:hover:text-indigo-400 text-slate-600 dark:text-slate-300 p-2.5 rounded-xl transition-all shadow-sm flex items-center justify-center cursor-pointer"
                        title="Google Maps"
                      >
                        <ExternalLink className="w-4 h-4" />
                      </a>
                    )}
                  </div>

                  {/* Layout Map & Photo Gallery */}
                  <div className="p-6 space-y-6 bg-slate-50/50 dark:bg-slate-950/40">

                    {apiData.i_layout && (
                      <div>
                        <h3 className="text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-2.5 flex items-center gap-1.5 leading-none">
                          <Building className="w-3.5 h-3.5" />
                          แผนผังที่นั่งสอบ (Seating Layout)
                        </h3>
                        <div
                          className="bg-white dark:bg-slate-900 rounded-xl shadow-sm dark:shadow-none border border-slate-200/40 dark:border-slate-800 p-2 cursor-zoom-in hover:border-blue-300 dark:hover:border-blue-800 hover:shadow-md transition-all duration-300 flex justify-center items-center"
                          onClick={() => setViewerData({ src: apiData.i_layout! })}
                        >
                          <img
                            src={apiData.i_layout}
                            alt={`Layout of ${roomId}`}
                            className="max-w-full max-h-[220px] object-contain rounded-lg"
                          />
                        </div>
                      </div>
                    )}

                    {apiData.i_images && apiData.i_images.length > 0 && (
                      <div>
                        <h3 className="text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-2.5 flex items-center gap-1.5 leading-none">
                          <MapPin className="w-3.5 h-3.5" />
                          ภาพห้องสอบ (Reference Photos)
                        </h3>
                        <div className="grid grid-cols-3 gap-2">
                          {apiData.i_images.map((url, idx) => (
                            <div
                              key={idx}
                              className="aspect-[4/3] bg-slate-200 dark:bg-slate-950 rounded-xl overflow-hidden cursor-zoom-in group shadow-sm dark:shadow-none border border-slate-200/40 dark:border-slate-800"
                              onClick={() => setViewerData({ images: apiData.i_images!, index: idx })}
                            >
                              <img
                                src={url}
                                alt={`Room ${roomId} photo ${idx + 1}`}
                                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                              />
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      {viewerData && (
        <ImageViewer
          src={viewerData.src}
          images={viewerData.images}
          initialIndex={viewerData.index}
          onClose={() => setViewerData(null)}
        />
      )}

      <ScrollToTopButton scrollContainerRef={scrollContainerRef} />
    </div>
  );
};
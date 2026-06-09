import { useState, useEffect, useRef } from 'react';
import { useLocation, Link } from 'react-router-dom';
import { ImageViewer } from '../components/ImageViewer';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { ScrollToTopButton } from '../components/ScrollToTopButton';

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
        <div className="bg-white dark:bg-slate-900 p-8 rounded-2xl shadow-xl dark:shadow-none border border-slate-200/50 dark:border-slate-800 text-center max-w-sm w-full">
          <div className="text-rose-500 text-sm font-bold mb-4">{error}</div>
          <Link to="/" className="text-blue-600 dark:text-blue-400 font-bold hover:underline">กลับหน้าหลัก</Link>
        </div>
      </div>
    );
  }

  return (
    <div 
      ref={scrollContainerRef}
      className="h-full w-full overflow-y-auto bg-slate-50/30 dark:bg-slate-950/20 relative transition-colors"
    >      
      <div className="max-w-5xl mx-auto pt-8 px-6 pb-24 space-y-12">
        {/* Header Block */}
        <div className="w-full mb-8">
          <Link to="/" className="inline-flex items-center text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 font-bold text-xs uppercase tracking-wider mb-6 transition gap-1.5">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7"></path></svg>
            กลับหน้าค้นหา
          </Link>
          <h1 className="text-3xl md:text-5xl font-black text-slate-800 dark:text-slate-100 tracking-tight leading-none mb-3">ข้อมูลห้องสอบทั้งหมด</h1>
          <p className="text-base md:text-lg font-bold bg-gradient-to-r from-blue-600 to-sky-600 bg-clip-text text-transparent">วิทยาลัยการคอมพิวเตอร์ มหาวิทยาลัยขอนแก่น</p>
        </div>

        {/* 🗺️ LEAFLET BUILDING LOCATIONS MAP CONTAINER */}
        <div className="w-full bg-white dark:bg-slate-900 rounded-2xl shadow-xl dark:shadow-none border border-slate-200/40 dark:border-slate-800/80 overflow-hidden mb-12 transition-all">
          <div className="p-4 border-b border-slate-100 dark:border-slate-800/80 bg-slate-50/50 dark:bg-slate-950/50 flex items-center">
            <svg className="w-5 h-5 mr-2 text-rose-500 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            <h2 className="text-sm font-extrabold text-slate-800 dark:text-slate-200 tracking-tight">
              แผนที่จุดสอบทั้งหมด
            </h2>
          </div>
          
          <div className="w-full h-[400px] relative z-0">
            <MapContainer center={[16.4466, 102.8285]} zoom={16} scrollWheelZoom={false} style={{ height: "100%", width: "100%", zIndex: 0 }}>
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
                        html: `<div style="background-color: #ef4444; color: white; width: 30px; height: 30px; border-radius: 50%; border: 3px solid white; box-shadow: 0 0 10px rgba(0,0,0,0.3); display: flex; align-items: center; justify-content: center; font-size: 14px; font-weight: bold;">
                                 ${roomCount > 1 ? roomCount : ''}
                               </div>`,
                        iconSize: [30, 30],
                        iconAnchor: [15, 15],
                      });

                      return (
                        <Marker key={index} position={[group.lat, group.lng]} icon={clusterIcon}>
                          <Popup>
                            <div className="text-center pb-1 min-w-[140px]">
                              <div className="flex flex-col gap-1.5">
                                {group.rooms.map((roomId) => (
                                  <button 
                                    key={roomId}
                                    onClick={() => {
                                      scrollToRoom(`room-${roomId.toLowerCase()}`);
                                    }}
                                    className="bg-blue-50 dark:bg-blue-950 hover:bg-blue-600 dark:hover:bg-blue-800 hover:text-white text-blue-700 dark:text-blue-400 text-xs font-bold px-3 py-2 rounded-xl transition border border-blue-100 dark:border-blue-900 cursor-pointer"
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
        </div>

        {/* INDIVIDUAL ROOM METADATA CARDS */}
        {Object.entries(apiRooms).map(([roomId, apiData]) => {
          const content = getRoomContent(roomId);

          return (
            <div 
              key={roomId} 
              id={`room-${roomId.toLowerCase()}`}
              className="bg-white dark:bg-slate-900 rounded-2xl shadow-xl dark:shadow-none border border-slate-200/40 dark:border-slate-800/80 w-full overflow-hidden scroll-mt-24 transition-all duration-300"
            >
              {/* Card Header */}
              <div className="p-8 border-b border-slate-100 dark:border-slate-800 flex flex-col md:flex-row md:items-start justify-between gap-6 bg-white dark:bg-slate-900 transition-colors">
                <div>
                  <div className="inline-block px-3 py-1 bg-blue-50 dark:bg-blue-950 text-blue-700 dark:text-blue-400 rounded-full text-xs font-bold mb-3 shadow-inner dark:shadow-none">
                    {roomId}
                  </div>
                  <h2 className="text-2xl font-extrabold text-slate-800 dark:text-slate-200 mb-2 leading-tight">{content.title}</h2>
                  <p className="text-slate-500 dark:text-slate-400 font-medium">{content.description}</p>
                  
                  {content.note && (
                    <div className="mt-4 p-3 bg-amber-50 dark:bg-amber-900/20 border-l-4 border-amber-500 text-amber-800 dark:text-amber-400 rounded-r-xl text-xs flex items-start max-w-2xl font-semibold leading-relaxed">
                      <svg className="w-5 h-5 mr-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                      <span>{content.note}</span>
                    </div>
                  )}
                </div>

                {apiData.i_map && (
                  <a 
                    href={apiData.i_map}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="shrink-0 bg-slate-800 hover:bg-blue-600 hover:scale-[1.01] active:scale-[0.99] text-white px-5 py-2.5 rounded-xl transition-all shadow-md flex items-center justify-center font-bold text-xs gap-1.5 cursor-pointer"
                  >
                    <svg className="w-4.5 h-4.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"></path><path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"></path></svg>
                    Google Maps
                  </a>
                )}
              </div>

              {/* Layout Map & Photo Gallery */}
              <div className="p-8 space-y-8 bg-slate-50/50 dark:bg-slate-950/40 transition-colors">
                
                {apiData.i_layout && (
                  <section className="max-w-3xl mx-auto w-full">
                    <h3 className="text-xs font-black text-slate-400 dark:text-slate-400 uppercase tracking-widest mb-3 flex items-center">
                      <svg className="w-4 h-4 mr-2 text-blue-500 dark:text-blue-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7m0 10a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 00-2-2h-2a2 2 0 00-2 2"></path></svg>
                      แผนผังที่นั่งสอบ (Seating Layout)
                    </h3>
                    <div 
                      className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm dark:shadow-none border border-slate-200/40 dark:border-slate-800 p-2 cursor-zoom-in hover:border-blue-300 dark:hover:border-blue-800 hover:shadow-md transition-all duration-300 flex justify-center items-center"
                      onClick={() => setViewerData({ src: apiData.i_layout! })}
                    >
                      <img 
                        src={apiData.i_layout} 
                        alt={`Layout of ${roomId}`} 
                        className="max-w-full max-h-[450px] object-contain rounded-xl"
                      />
                    </div>
                  </section>
                )}

                {apiData.i_images && apiData.i_images.length > 0 && (
                  <section>
                    <h3 className="text-xs font-black text-slate-400 dark:text-slate-400 uppercase tracking-widest mb-3 flex items-center">
                      <svg className="w-4 h-4 mr-2 text-emerald-500 dark:text-emerald-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>
                      ภาพห้องสอบ (Reference Photos)
                    </h3>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
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
                  </section>
                )}

              </div>
            </div>
          );
        })}
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
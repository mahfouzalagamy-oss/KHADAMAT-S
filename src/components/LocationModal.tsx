import { Check, List, Map as MapIcon, MapPin, Plus, Search, X } from 'lucide-react';
import { useMemo, useState } from 'react';
import { DAKAHLIA_CENTERS } from '../data/dakahliaLocations';
import { LocationEntry, Technician } from '../types/khadamat';
import { DakahliaCoverageMap } from './DakahliaCoverageMap';

interface LocationModalProps {
  isOpen: boolean;
  currentDistrict: string;
  locations: LocationEntry[];
  technicians: Technician[];
  onSelectDistrict: (district: string) => void;
  onAddCustomLocation: (center: string, name: string) => LocationEntry | null;
  onClose: () => void;
  isDark?: boolean;
}

export function LocationModal({
  isOpen,
  currentDistrict,
  locations,
  technicians,
  onSelectDistrict,
  onAddCustomLocation,
  onClose,
  isDark = false,
}: LocationModalProps) {
  const [viewMode, setViewMode] = useState<'map' | 'list'>('map');
  const [search, setSearch] = useState('');
  const [dakahliaCenter, setDakahliaCenter] = useState<string>('الكل');
  const [showAddForm, setShowAddForm] = useState(false);
  const [customCenter, setCustomCenter] = useState<string>(DAKAHLIA_CENTERS[0]);
  const [customAreaName, setCustomAreaName] = useState('');
  const [addError, setAddError] = useState('');

  const filteredLocations = useMemo(() => {
    const q = search.trim();
    return locations.filter((loc) => {
      if (dakahliaCenter !== 'الكل' && loc.center !== dakahliaCenter) {
        return false;
      }
      if (!q) return true;
      return loc.name.includes(q) || loc.center.includes(q) || loc.displayLabel.includes(q);
    });
  }, [locations, search, dakahliaCenter]);

  if (!isOpen) return null;

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (customAreaName.trim().length < 2) {
      setAddError('يرجى إدخال اسم المنطقة أو القرية (حرفين على الأقل).');
      return;
    }
    setAddError('');
    const created = onAddCustomLocation(customCenter, customAreaName.trim());
    if (created) {
      onSelectDistrict(created.displayLabel);
      setCustomAreaName('');
      setShowAddForm(false);
      onClose();
    }
  };

  return (
    <div
      className="fixed inset-0 z-[60] flex items-end md:items-center justify-center bg-slate-950/65 backdrop-blur-sm p-0 md:p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="location-modal-title"
    >
      <div className="w-full md:max-w-4xl bg-white dark:bg-slate-900 rounded-t-3xl md:rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-2xl max-h-[92vh] flex flex-col">
        <div className="md:hidden w-10 h-1.5 bg-slate-300 dark:bg-slate-700 rounded-full mx-auto mt-3 shrink-0" />

        <div className="flex items-center justify-between gap-3 px-5 md:px-6 py-4 border-b border-slate-200 dark:border-slate-800 shrink-0">
          <div>
            <h2
              id="location-modal-title"
              className="text-lg font-bold text-slate-900 dark:text-slate-100"
            >
              اختر المنطقة في الدقهلية
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              المنصورة، المنصورة الجديدة، المراكز والقرى
            </p>
          </div>
          <div className="flex items-center gap-2">
            {/* Map / List Switcher */}
            <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
              <button
                type="button"
                onClick={() => setViewMode('map')}
                className={`inline-flex items-center gap-1.5 min-h-[36px] px-3 text-xs font-semibold rounded-lg cursor-pointer transition-colors ${
                  viewMode === 'map'
                    ? 'bg-white text-orange-700 shadow-sm dark:bg-slate-900 dark:text-orange-400'
                    : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100'
                }`}
              >
                <MapIcon className="w-3.5 h-3.5" />
                <span>الخريطة</span>
              </button>
              <button
                type="button"
                onClick={() => setViewMode('list')}
                className={`inline-flex items-center gap-1.5 min-h-[36px] px-3 text-xs font-semibold rounded-lg cursor-pointer transition-colors ${
                  viewMode === 'list'
                    ? 'bg-white text-orange-700 shadow-sm dark:bg-slate-900 dark:text-orange-400'
                    : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100'
                }`}
              >
                <List className="w-3.5 h-3.5" />
                <span>القائمة</span>
              </button>
            </div>

            <button
              type="button"
              onClick={onClose}
              aria-label="إغلاق"
              className="min-w-[44px] min-h-[44px] flex items-center justify-center rounded-xl text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-slate-100 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Search & Add Custom Area Bar */}
        <div className="p-4 border-b border-slate-100 dark:border-slate-800 space-y-3 shrink-0 bg-slate-50/70 dark:bg-slate-950/60">
          <div className="flex flex-col sm:flex-row gap-2">
            <div className="relative flex-1">
              <Search
                className="w-4 h-4 text-slate-400 dark:text-slate-500 absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none"
                aria-hidden="true"
              />
              <input
                type="search"
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  if (e.target.value.trim() && viewMode === 'map') {
                    setViewMode('list');
                  }
                }}
                placeholder="ابحث بالاسم (مثال: جنة 1، زاهية، المنصورة، طلخا...)"
                className="w-full h-11 pr-10 pl-4 text-sm bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 rounded-xl focus:border-[#FF5A00] dark:focus:border-orange-500 focus:outline-none"
              />
            </div>

            <button
              type="button"
              onClick={() => {
                if (!showAddForm && dakahliaCenter !== 'الكل') {
                  setCustomCenter(dakahliaCenter);
                }
                setShowAddForm((prev) => !prev);
                setAddError('');
              }}
              className="inline-flex items-center justify-center gap-1.5 min-h-[44px] px-4 py-2 bg-[#FF5A00] text-white text-xs font-semibold rounded-xl hover:bg-orange-700 dark:bg-orange-600 dark:hover:bg-orange-500 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>{showAddForm ? 'إخفاء الإضافة' : 'إضافة منطقة جديدة'}</span>
            </button>
          </div>

          {showAddForm && (
            <form
              onSubmit={handleAddSubmit}
              className="bg-white dark:bg-slate-900 border border-orange-200 dark:border-orange-800 rounded-xl p-4 space-y-3"
            >
              <div className="text-xs font-bold text-orange-800 dark:text-orange-300">
                إضافة منطقة أو مشروع غير مدرج
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <div>
                  <label className="block text-[11px] font-medium text-slate-600 dark:text-slate-400 mb-1">
                    المركز التابع له
                  </label>
                  <select
                    value={customCenter}
                    onChange={(e) => setCustomCenter(e.target.value)}
                    className="w-full h-10 px-3 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 rounded-lg focus:border-[#FF5A00] dark:focus:border-orange-500 focus:outline-none"
                  >
                    {DAKAHLIA_CENTERS.map((center) => (
                      <option key={center} value={center}>
                        مركز {center}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] font-medium text-slate-600 dark:text-slate-400 mb-1">
                    اسم المنطقة أو القرية أو الحي
                  </label>
                  <input
                    type="text"
                    value={customAreaName}
                    onChange={(e) => setCustomAreaName(e.target.value)}
                    placeholder="مثال: عزبة الشال، كفر الموجي..."
                    className="w-full h-10 px-3 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 rounded-lg focus:bg-white dark:focus:bg-slate-900 focus:border-[#FF5A00] dark:focus:border-orange-500 focus:outline-none"
                  />
                </div>
              </div>
              {addError && <p className="text-xs text-red-700 dark:text-red-400">{addError}</p>}
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddForm(false)}
                  className="min-h-[38px] px-3.5 text-xs font-medium text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg cursor-pointer"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="min-h-[38px] px-4 text-xs font-semibold text-white bg-[#FF5A00] hover:bg-orange-700 dark:bg-orange-600 dark:hover:bg-orange-500 rounded-lg cursor-pointer"
                >
                  حفظ واختيار المنطقة
                </button>
              </div>
            </form>
          )}

          {/* Dakahlia Center Chips when in list mode */}
          {viewMode === 'list' && (
            <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-0.5">
              <button
                type="button"
                onClick={() => setDakahliaCenter('الكل')}
                className={`min-h-[36px] px-3 py-1 text-xs font-semibold rounded-lg whitespace-nowrap shrink-0 cursor-pointer ${
                  dakahliaCenter === 'الكل'
                    ? 'bg-slate-900 text-white dark:bg-orange-600'
                    : 'bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300'
                }`}
              >
                كل مراكز الدقهلية
              </button>
              {DAKAHLIA_CENTERS.map((center) => (
                <button
                  key={center}
                  type="button"
                  onClick={() => setDakahliaCenter(center)}
                  className={`min-h-[36px] px-3 py-1 text-xs font-medium rounded-lg whitespace-nowrap shrink-0 cursor-pointer ${
                    dakahliaCenter === center
                      ? 'bg-slate-900 text-white dark:bg-orange-600'
                      : 'bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:border-slate-300 dark:hover:border-slate-600'
                  }`}
                >
                  {center}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Body: Interactive Map OR List */}
        {viewMode === 'map' ? (
          <div className="overflow-y-auto flex-1 p-4">
            <DakahliaCoverageMap
              compact
              isDark={isDark}
              locations={locations}
              technicians={technicians}
              selectedDistrict={currentDistrict}
              onCenterFocused={(center) => setCustomCenter(center)}
              onSelectDistrict={(picked) => {
                onSelectDistrict(picked);
                onClose();
              }}
            />
          </div>
        ) : (
          <div className="overflow-y-auto flex-1 p-3 divide-y divide-slate-100 dark:divide-slate-800">
            {filteredLocations.length === 0 ? (
              <div className="p-8 text-center space-y-3">
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  لم يتم العثور على «{search}» في القائمة الحالية.
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setCustomAreaName(search.trim());
                    setShowAddForm(true);
                  }}
                  className="inline-flex items-center gap-1.5 min-h-[42px] px-4 py-2 bg-[#FF5A00] text-white text-xs font-semibold rounded-xl hover:bg-orange-700 dark:bg-orange-600 dark:hover:bg-orange-500 cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>إضافة «{search.trim() || 'منطقة جديدة'}» للدقهلية</span>
                </button>
              </div>
            ) : (
              filteredLocations.map((loc) => {
                const selected = loc.displayLabel === currentDistrict;
                return (
                  <button
                    key={loc.id}
                    type="button"
                    onClick={() => {
                      onSelectDistrict(loc.displayLabel);
                      onClose();
                    }}
                    className={`w-full flex items-center justify-between px-4 min-h-[50px] py-2 rounded-xl text-right transition-colors cursor-pointer ${
                      selected
                        ? 'bg-orange-50/75 dark:bg-orange-950/60 text-orange-800 dark:text-orange-200 font-semibold'
                        : 'text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800'
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <MapPin
                        className={`w-4 h-4 shrink-0 ${
                          selected
                            ? 'text-[#FF5A00] dark:text-orange-400'
                            : 'text-slate-400 dark:text-slate-500'
                        }`}
                      />
                      <div className="min-w-0">
                        <div className="text-sm truncate">{loc.name}</div>
                        <div className="text-[11px] text-slate-500 dark:text-slate-400">
                          {loc.governorate} · مركز {loc.center}
                          {loc.isVillage ? ' · قرية' : ''}
                          {loc.isCustom ? ' · مضافة يدوياً' : ''}
                        </div>
                      </div>
                    </div>
                    {selected && (
                      <Check className="w-4 h-4 text-[#FF5A00] dark:text-orange-400 shrink-0" />
                    )}
                  </button>
                );
              })
            )}
          </div>
        )}
      </div>
    </div>
  );
}

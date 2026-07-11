import React, { useEffect, useRef, useState } from 'react';
import type { CandidateProfileData } from '@/pages/Candidate/types';
import makeCall from '@/API';
import { API_ROUTES } from '@/API/apiRoutes';
import { useToast } from '@/components/common/Toast';
import { useAppDispatch } from '@/hooks';
import { candidateProfileActions } from '../slice';
import { PROFILE_THEME } from './profileTheme';

// ─── Country / Address Data ───────────────────────────────────────────────────

interface Country {
  code: string;
  name: string;
  flag: string;
  cities: string[];
}

const formatAddressValue = (
  address?: { city?: string; region?: string } | null,
) => {
  if (!address) return '';
  return [address.city, address.region].filter(Boolean).join(', ');
};

const splitAddressValue = (value: string) => {
  const [city = '', ...rest] = value
    .split(',')
    .map((part) => part.trim())
    .filter(Boolean);
  return {
    city: city || undefined,
    region: rest.length > 0 ? rest.join(', ') : undefined,
  };
};

const COUNTRIES: Country[] = [
  { code: 'AF', name: 'Afghanistan', flag: '🇦🇫', cities: ['Kabul', 'Kandahar', 'Herat', 'Mazar-i-Sharif'] },
  { code: 'AL', name: 'Albania', flag: '🇦🇱', cities: ['Tirana', 'Durrës', 'Vlorë', 'Elbasan'] },
  { code: 'DZ', name: 'Algeria', flag: '🇩🇿', cities: ['Algiers', 'Oran', 'Constantine', 'Annaba'] },
  { code: 'AR', name: 'Argentina', flag: '🇦🇷', cities: ['Buenos Aires', 'Córdoba', 'Rosario', 'Mendoza'] },
  { code: 'AU', name: 'Australia', flag: '🇦🇺', cities: ['Sydney', 'Melbourne', 'Brisbane', 'Perth', 'Adelaide'] },
  { code: 'AT', name: 'Austria', flag: '🇦🇹', cities: ['Vienna', 'Graz', 'Linz', 'Salzburg'] },
  { code: 'BE', name: 'Belgium', flag: '🇧🇪', cities: ['Brussels', 'Antwerp', 'Ghent', 'Liège'] },
  { code: 'BO', name: 'Bolivia', flag: '🇧🇴', cities: ['Sucre', 'La Paz', 'Cochabamba', 'Santa Cruz'] },
  { code: 'BR', name: 'Brazil', flag: '🇧🇷', cities: ['São Paulo', 'Rio de Janeiro', 'Brasília', 'Salvador', 'Fortaleza'] },
  { code: 'BG', name: 'Bulgaria', flag: '🇧🇬', cities: ['Sofia', 'Plovdiv', 'Varna', 'Burgas'] },
  { code: 'CA', name: 'Canada', flag: '🇨🇦', cities: ['Toronto', 'Montreal', 'Vancouver', 'Calgary', 'Ottawa'] },
  { code: 'CL', name: 'Chile', flag: '🇨🇱', cities: ['Santiago', 'Valparaíso', 'Concepción', 'Antofagasta'] },
  { code: 'CN', name: 'China', flag: '🇨🇳', cities: ['Beijing', 'Shanghai', 'Guangzhou', 'Shenzhen', 'Chengdu'] },
  { code: 'CO', name: 'Colombia', flag: '🇨🇴', cities: ['Bogotá', 'Medellín', 'Cali', 'Barranquilla'] },
  { code: 'HR', name: 'Croatia', flag: '🇭🇷', cities: ['Zagreb', 'Split', 'Rijeka', 'Osijek'] },
  { code: 'CZ', name: 'Czech Republic', flag: '🇨🇿', cities: ['Prague', 'Brno', 'Ostrava', 'Plzeň'] },
  { code: 'DK', name: 'Denmark', flag: '🇩🇰', cities: ['Copenhagen', 'Aarhus', 'Odense', 'Aalborg'] },
  { code: 'EC', name: 'Ecuador', flag: '🇪🇨', cities: ['Quito', 'Guayaquil', 'Cuenca', 'Ambato'] },
  { code: 'EG', name: 'Egypt', flag: '🇪🇬', cities: ['Cairo', 'Alexandria', 'Giza', 'Luxor', 'Aswan'] },
  { code: 'ER', name: 'Eritrea', flag: '🇪🇷', cities: ['Asmara', 'Massawa', 'Keren', 'Assab'] },
  { code: 'ET', name: 'Ethiopia', flag: '🇪🇹', cities: ['Addis Ababa', 'Dire Dawa', 'Mekelle', 'Gondar', 'Hawassa', 'Bahir Dar', 'Adama', 'Jimma'] },
  { code: 'FI', name: 'Finland', flag: '🇫🇮', cities: ['Helsinki', 'Espoo', 'Tampere', 'Vantaa', 'Oulu'] },
  { code: 'FR', name: 'France', flag: '🇫🇷', cities: ['Paris', 'Marseille', 'Lyon', 'Toulouse', 'Nice'] },
  { code: 'DE', name: 'Germany', flag: '🇩🇪', cities: ['Berlin', 'Hamburg', 'Munich', 'Cologne', 'Frankfurt'] },
  { code: 'GH', name: 'Ghana', flag: '🇬🇭', cities: ['Accra', 'Kumasi', 'Tamale', 'Sekondi-Takoradi'] },
  { code: 'GR', name: 'Greece', flag: '🇬🇷', cities: ['Athens', 'Thessaloniki', 'Patras', 'Heraklion'] },
  { code: 'GT', name: 'Guatemala', flag: '🇬🇹', cities: ['Guatemala City', 'Mixco', 'Villa Nueva', 'Quetzaltenango'] },
  { code: 'HU', name: 'Hungary', flag: '🇭🇺', cities: ['Budapest', 'Debrecen', 'Miskolc', 'Szeged'] },
  { code: 'IN', name: 'India', flag: '🇮🇳', cities: ['Mumbai', 'Delhi', 'Bangalore', 'Hyderabad', 'Chennai', 'Kolkata', 'Pune'] },
  { code: 'ID', name: 'Indonesia', flag: '🇮🇩', cities: ['Jakarta', 'Surabaya', 'Bandung', 'Medan', 'Semarang'] },
  { code: 'IR', name: 'Iran', flag: '🇮🇷', cities: ['Tehran', 'Mashhad', 'Isfahan', 'Karaj', 'Tabriz'] },
  { code: 'IQ', name: 'Iraq', flag: '🇮🇶', cities: ['Baghdad', 'Basra', 'Mosul', 'Erbil'] },
  { code: 'IE', name: 'Ireland', flag: '🇮🇪', cities: ['Dublin', 'Cork', 'Limerick', 'Galway'] },
  { code: 'IL', name: 'Israel', flag: '🇮🇱', cities: ['Jerusalem', 'Tel Aviv', 'Haifa', 'Rishon LeZion'] },
  { code: 'IT', name: 'Italy', flag: '🇮🇹', cities: ['Rome', 'Milan', 'Naples', 'Turin', 'Palermo'] },
  { code: 'JP', name: 'Japan', flag: '🇯🇵', cities: ['Tokyo', 'Osaka', 'Nagoya', 'Sapporo', 'Fukuoka', 'Kyoto'] },
  { code: 'JO', name: 'Jordan', flag: '🇯🇴', cities: ['Amman', 'Zarqa', 'Irbid', 'Aqaba'] },
  { code: 'KE', name: 'Kenya', flag: '🇰🇪', cities: ['Nairobi', 'Mombasa', 'Kisumu', 'Nakuru'] },
  { code: 'KW', name: 'Kuwait', flag: '🇰🇼', cities: ['Kuwait City', 'Ahmadi', 'Hawalli', 'Salmiya'] },
  { code: 'LB', name: 'Lebanon', flag: '🇱🇧', cities: ['Beirut', 'Tripoli', 'Sidon', 'Tyre'] },
  { code: 'LY', name: 'Libya', flag: '🇱🇾', cities: ['Tripoli', 'Benghazi', 'Misrata', 'Tarhuna'] },
  { code: 'MY', name: 'Malaysia', flag: '🇲🇾', cities: ['Kuala Lumpur', 'George Town', 'Johor Bahru', 'Ipoh'] },
  { code: 'MX', name: 'Mexico', flag: '🇲🇽', cities: ['Mexico City', 'Guadalajara', 'Monterrey', 'Puebla', 'Tijuana'] },
  { code: 'MA', name: 'Morocco', flag: '🇲🇦', cities: ['Casablanca', 'Rabat', 'Fès', 'Marrakesh', 'Tangier'] },
  { code: 'MZ', name: 'Mozambique', flag: '🇲🇿', cities: ['Maputo', 'Matola', 'Nampula', 'Beira'] },
  { code: 'NP', name: 'Nepal', flag: '🇳🇵', cities: ['Kathmandu', 'Pokhara', 'Biratnagar', 'Lalitpur'] },
  { code: 'NL', name: 'Netherlands', flag: '🇳🇱', cities: ['Amsterdam', 'Rotterdam', 'The Hague', 'Utrecht'] },
  { code: 'NZ', name: 'New Zealand', flag: '🇳🇿', cities: ['Auckland', 'Wellington', 'Christchurch', 'Hamilton'] },
  { code: 'NG', name: 'Nigeria', flag: '🇳🇬', cities: ['Lagos', 'Kano', 'Ibadan', 'Abuja', 'Port Harcourt'] },
  { code: 'NO', name: 'Norway', flag: '🇳🇴', cities: ['Oslo', 'Bergen', 'Trondheim', 'Stavanger'] },
  { code: 'OM', name: 'Oman', flag: '🇴🇲', cities: ['Muscat', 'Salalah', 'Sohar', 'Nizwa'] },
  { code: 'PK', name: 'Pakistan', flag: '🇵🇰', cities: ['Karachi', 'Lahore', 'Islamabad', 'Faisalabad', 'Rawalpindi'] },
  { code: 'PA', name: 'Panama', flag: '🇵🇦', cities: ['Panama City', 'San Miguelito', 'Tocumen', 'David'] },
  { code: 'PE', name: 'Peru', flag: '🇵🇪', cities: ['Lima', 'Arequipa', 'Trujillo', 'Chiclayo'] },
  { code: 'PH', name: 'Philippines', flag: '🇵🇭', cities: ['Manila', 'Quezon City', 'Cebu', 'Davao', 'Zamboanga'] },
  { code: 'PL', name: 'Poland', flag: '🇵🇱', cities: ['Warsaw', 'Kraków', 'Łódź', 'Wrocław', 'Poznań'] },
  { code: 'PT', name: 'Portugal', flag: '🇵🇹', cities: ['Lisbon', 'Porto', 'Braga', 'Amadora'] },
  { code: 'QA', name: 'Qatar', flag: '🇶🇦', cities: ['Doha', 'Al Rayyan', 'Umm Salal', 'Al Wakrah'] },
  { code: 'RO', name: 'Romania', flag: '🇷🇴', cities: ['Bucharest', 'Cluj-Napoca', 'Timișoara', 'Iași'] },
  { code: 'RU', name: 'Russia', flag: '🇷🇺', cities: ['Moscow', 'Saint Petersburg', 'Novosibirsk', 'Yekaterinburg', 'Kazan'] },
  { code: 'RW', name: 'Rwanda', flag: '🇷🇼', cities: ['Kigali', 'Butare', 'Gitarama', 'Musanze'] },
  { code: 'SA', name: 'Saudi Arabia', flag: '🇸🇦', cities: ['Riyadh', 'Jeddah', 'Mecca', 'Medina', 'Dammam'] },
  { code: 'SN', name: 'Senegal', flag: '🇸🇳', cities: ['Dakar', 'Touba', 'Thiès', 'Saint-Louis'] },
  { code: 'ZA', name: 'South Africa', flag: '🇿🇦', cities: ['Johannesburg', 'Cape Town', 'Durban', 'Pretoria', 'Port Elizabeth'] },
  { code: 'SS', name: 'South Sudan', flag: '🇸🇸', cities: ['Juba', 'Wau', 'Malakal', 'Yambio'] },
  { code: 'ES', name: 'Spain', flag: '🇪🇸', cities: ['Madrid', 'Barcelona', 'Valencia', 'Seville', 'Bilbao'] },
  { code: 'SD', name: 'Sudan', flag: '🇸🇩', cities: ['Khartoum', 'Omdurman', 'Port Sudan', 'Kassala'] },
  { code: 'SE', name: 'Sweden', flag: '🇸🇪', cities: ['Stockholm', 'Gothenburg', 'Malmö', 'Uppsala'] },
  { code: 'CH', name: 'Switzerland', flag: '🇨🇭', cities: ['Zurich', 'Geneva', 'Basel', 'Lausanne', 'Bern'] },
  { code: 'SY', name: 'Syria', flag: '🇸🇾', cities: ['Damascus', 'Aleppo', 'Homs', 'Latakia'] },
  { code: 'TW', name: 'Taiwan', flag: '🇹🇼', cities: ['Taipei', 'Kaohsiung', 'Taichung', 'Tainan'] },
  { code: 'TZ', name: 'Tanzania', flag: '🇹🇿', cities: ['Dar es Salaam', 'Mwanza', 'Arusha', 'Dodoma'] },
  { code: 'TH', name: 'Thailand', flag: '🇹🇭', cities: ['Bangkok', 'Chiang Mai', 'Pattaya', 'Phuket', 'Khon Kaen'] },
  { code: 'TN', name: 'Tunisia', flag: '🇹🇳', cities: ['Tunis', 'Sfax', 'Sousse', 'Bizerte'] },
  { code: 'TR', name: 'Turkey', flag: '🇹🇷', cities: ['Istanbul', 'Ankara', 'İzmir', 'Bursa', 'Adana'] },
  { code: 'UG', name: 'Uganda', flag: '🇺🇬', cities: ['Kampala', 'Gulu', 'Mbarara', 'Jinja'] },
  { code: 'UA', name: 'Ukraine', flag: '🇺🇦', cities: ['Kyiv', 'Kharkiv', 'Odessa', 'Dnipro', 'Lviv'] },
  { code: 'AE', name: 'United Arab Emirates', flag: '🇦🇪', cities: ['Dubai', 'Abu Dhabi', 'Sharjah', 'Al Ain'] },
  { code: 'GB', name: 'United Kingdom', flag: '🇬🇧', cities: ['London', 'Birmingham', 'Manchester', 'Glasgow', 'Leeds', 'Liverpool'] },
  { code: 'US', name: 'United States', flag: '🇺🇸', cities: ['New York', 'Los Angeles', 'Chicago', 'Houston', 'Phoenix', 'Philadelphia', 'San Antonio', 'San Diego', 'Dallas', 'Seattle', 'Denver', 'Boston', 'Austin', 'Atlanta', 'Miami'] },
  { code: 'UY', name: 'Uruguay', flag: '🇺🇾', cities: ['Montevideo', 'Salto', 'Ciudad de la Costa', 'Paysandú'] },
  { code: 'UZ', name: 'Uzbekistan', flag: '🇺🇿', cities: ['Tashkent', 'Samarkand', 'Namangan', 'Andijan'] },
  { code: 'VE', name: 'Venezuela', flag: '🇻🇪', cities: ['Caracas', 'Maracaibo', 'Valencia', 'Barquisimeto'] },
  { code: 'VN', name: 'Vietnam', flag: '🇻🇳', cities: ['Ho Chi Minh City', 'Hanoi', 'Da Nang', 'Haiphong', 'Cần Thơ'] },
  { code: 'YE', name: 'Yemen', flag: '🇾🇪', cities: ['Sana\'a', 'Aden', 'Taiz', 'Al Hudaydah'] },
  { code: 'ZM', name: 'Zambia', flag: '🇿🇲', cities: ['Lusaka', 'Kitwe', 'Ndola', 'Kabwe'] },
  { code: 'ZW', name: 'Zimbabwe', flag: '🇿🇼', cities: ['Harare', 'Bulawayo', 'Chitungwiza', 'Mutare'] },
];

// ─── CountryDropdown ──────────────────────────────────────────────────────────

const CountryDropdown: React.FC<{
  value: string;
  onChange: (countryName: string) => void;
}> = ({ value, onChange }) => {
  const [search, setSearch] = useState('');
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const selected = COUNTRIES.find((c) => c.name === value) ?? null;

  const filtered = COUNTRIES.filter((c) =>
    c.name.toLowerCase().includes(search.toLowerCase())
  );

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
        setSearch('');
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleSelect = (country: Country) => {
    onChange(country.name);
    setOpen(false);
    setSearch('');
  };

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <button
        type="button"
        onClick={() => {
          setOpen((prev) => !prev);
          setTimeout(() => inputRef.current?.focus(), 50);
        }}
        className="w-full rounded-xl border border-slate-200 p-2.5 text-xs text-left flex items-center gap-2 bg-white focus:outline-none focus:border-primary text-slate-700 transition-colors hover:border-slate-300"
      >
        {selected ? (
          <>
            <span className="text-base leading-none">{selected.flag}</span>
            <span className="flex-1 truncate">{selected.name}</span>
          </>
        ) : (
          <span className="flex-1 text-slate-400">Select nationality…</span>
        )}
        <span className="material-symbols-outlined text-[14px] text-slate-400 shrink-0">
          {open ? 'expand_less' : 'expand_more'}
        </span>
      </button>

      {open && (
        <div
          style={{
            position: 'absolute',
            top: 'calc(100% + 4px)',
            left: 0,
            right: 0,
            zIndex: 9999,
            background: '#fff',
            border: '1px solid #e2e8f0',
            borderRadius: '12px',
            boxShadow: '0 8px 30px rgba(0,0,0,0.12)',
            overflow: 'hidden',
          }}
        >
          <div style={{ padding: '8px', borderBottom: '1px solid #f1f5f9' }}>
            <div style={{ position: 'relative' }}>
              <span
                className="material-symbols-outlined"
                style={{
                  position: 'absolute',
                  left: 8,
                  top: '50%',
                  transform: 'translateY(-50%)',
                  fontSize: 14,
                  color: '#94a3b8',
                  pointerEvents: 'none',
                }}
              >
                search
              </span>
              <input
                ref={inputRef}
                type="text"
                placeholder="Search country…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                style={{
                  width: '100%',
                  paddingLeft: 28,
                  paddingRight: 8,
                  paddingTop: 6,
                  paddingBottom: 6,
                  fontSize: 11,
                  border: '1px solid #e2e8f0',
                  borderRadius: 8,
                  outline: 'none',
                  color: '#334155',
                  boxSizing: 'border-box',
                }}
              />
            </div>
          </div>

          <div style={{ maxHeight: 220, overflowY: 'auto' }}>
            {filtered.length === 0 ? (
              <div style={{ padding: '12px 10px', fontSize: 11, color: '#94a3b8', textAlign: 'center' }}>
                No country found
              </div>
            ) : (
              filtered.map((country) => (
                <button
                  key={country.code}
                  type="button"
                  onClick={() => handleSelect(country)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    width: '100%',
                    padding: '7px 10px',
                    fontSize: 12,
                    color: selected?.code === country.code ? PROFILE_THEME.primary : '#334155',
                    background: selected?.code === country.code ? PROFILE_THEME.primaryLighter : 'transparent',
                    border: 'none',
                    cursor: 'pointer',
                    textAlign: 'left',
                    transition: 'background 0.1s',
                  }}
                  onMouseEnter={(e) => {
                    if (selected?.code !== country.code)
                      (e.currentTarget as HTMLButtonElement).style.background = PROFILE_THEME.primaryLighter;
                  }}
                  onMouseLeave={(e) => {
                    if (selected?.code !== country.code)
                      (e.currentTarget as HTMLButtonElement).style.background = 'transparent';
                  }}
                >
                  <span style={{ fontSize: 16, lineHeight: 1 }}>{country.flag}</span>
                  <span style={{ flex: 1 }}>{country.name}</span>
                  {selected?.code === country.code && (
                    <span className="material-symbols-outlined" style={{ fontSize: 14, color: PROFILE_THEME.primary }}>
                      check
                    </span>
                  )}
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};

// ─── AddressAutocomplete ──────────────────────────────────────────────────────

const AddressAutocomplete: React.FC<{
  value: string;
  onChange: (v: string) => void;
  nationality: string;
}> = ({ value, onChange, nationality }) => {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const country = COUNTRIES.find((c) => c.name === nationality);
  const cities = country?.cities ?? [];

  const suggestions = value.trim().length === 0
    ? cities.slice(0, 8)
    : cities.filter((city) =>
        city.toLowerCase().includes(value.toLowerCase())
      );

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange(e.target.value);
    setOpen(true);
  };

  const handleSelect = (city: string) => {
    onChange(country ? `${city}, ${country.name}` : city);
    setOpen(false);
  };

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <input
        type="text"
        value={value}
        onChange={handleInputChange}
        onFocus={() => setOpen(true)}
        placeholder={
          country
            ? `City, region in ${country.name}…`
            : 'Select nationality first, then type your address…'
        }
        className="w-full rounded-xl border border-slate-200 p-2.5 text-xs focus:outline-none focus:border-primary text-slate-700"
        autoComplete="off"
      />

      {open && suggestions.length > 0 && (
        <div
          style={{
            position: 'absolute',
            top: 'calc(100% + 4px)',
            left: 0,
            right: 0,
            zIndex: 9999,
            background: '#fff',
            border: '1px solid #e2e8f0',
            borderRadius: '12px',
            boxShadow: '0 8px 30px rgba(0,0,0,0.12)',
            overflow: 'hidden',
          }}
        >
          {country && (
            <div
              style={{
                padding: '6px 10px 4px',
                fontSize: 10,
                fontWeight: 700,
                letterSpacing: '0.08em',
                textTransform: 'uppercase',
                color: '#94a3b8',
                borderBottom: '1px solid #f1f5f9',
              }}
            >
              {country.flag}&nbsp;Cities in {country.name}
            </div>
          )}
          <div style={{ maxHeight: 200, overflowY: 'auto' }}>
            {suggestions.map((city) => (
              <button
                key={city}
                type="button"
                onClick={() => handleSelect(city)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  width: '100%',
                  padding: '7px 10px',
                  fontSize: 12,
                  color: '#334155',
                  background: 'transparent',
                  border: 'none',
                  cursor: 'pointer',
                  textAlign: 'left',
                  transition: 'background 0.1s',
                }}
                onMouseEnter={(e) => {
                      (e.currentTarget as HTMLButtonElement).style.background = PROFILE_THEME.primaryLighter;
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLButtonElement).style.background = 'transparent';
                }}
              >
                <span
                  className="material-symbols-outlined"
                  style={{ fontSize: 13, color: '#94a3b8', flexShrink: 0 }}
                >
                  location_on
                </span>
                <span>{city}</span>
                {country && (
                  <span style={{ color: '#cbd5e1', fontSize: 11 }}>
                    , {country.name}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

// ─── Main Component ───────────────────────────────────────────────────────────

interface CandidateProfilePersonalDetailsTabProps {
  profile: CandidateProfileData;
}

export const CandidateProfilePersonalDetailsTab: React.FC<
  CandidateProfilePersonalDetailsTabProps
> = ({ profile }) => {
  const { toast } = useToast();
  const dispatch = useAppDispatch();
  const [submitting, setSubmitting] = useState(false);

  const [firstName, setFirstName] = useState(profile.firstName || '');
  const [lastName, setLastName] = useState(profile.lastName || '');
  const [gender, setGender] = useState(profile.gender || '');
  const [dateOfBirth, setDateOfBirth] = useState(
    profile.date_of_birth ? new Date(profile.date_of_birth).toISOString().split('T')[0] : ''
  );
  const [nationality, setNationality] = useState(profile.nationality || '');
  const [currentAddress, setCurrentAddress] = useState(
    profile.current_address || formatAddressValue(profile.addresses?.[0]) || '',
  );
  const [currentEmployer, setCurrentEmployer] = useState(profile.current_employer || '');
  const [currentPosition, setCurrentPosition] = useState(profile.current_position || '');
  const [portfolioUrl, setPortfolioUrl] = useState(profile.portfolio_url || '');
  const [preferredJobCategory, setPreferredJobCategory] = useState(profile.preferred_job_category || '');
  const [preferredLocation, setPreferredLocation] = useState(profile.preferred_location || '');
  const [expectedSalary, setExpectedSalary] = useState(
    profile.expected_salary !== undefined ? String(profile.expected_salary) : ''
  );
  const [availabilityStatus, setAvailabilityStatus] = useState(profile.availability_status || 'IMMEDIATELY');
  const [remarks, setRemarks] = useState(profile.remarks || '');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      
      // Always update address if it has changed
      if (currentAddress.trim()) {
        const parsedAddress = splitAddressValue(currentAddress);
        const existingAddress = profile.addresses?.[0];
        await makeCall({
          method: existingAddress ? 'PATCH' : 'POST',
          route: existingAddress
            ? API_ROUTES.candidates.addressById(existingAddress.id)
            : API_ROUTES.candidates.address,
          isSecureRoute: true,
          body: {
            city: parsedAddress.city,
            region: parsedAddress.region,
          },
        });
      }

      await makeCall({
        method: 'PATCH',
        route: API_ROUTES.candidates.profile,
        isSecureRoute: true,
        body: {
          first_name: firstName,
          last_name: lastName,
          gender: gender || undefined,
          date_of_birth: dateOfBirth || undefined,
          nationality: nationality || undefined,
          current_employer: currentEmployer || undefined,
          current_position: currentPosition || undefined,
          portfolio_url: portfolioUrl || undefined,
          preferred_job_category: preferredJobCategory || undefined,
          preferred_location: preferredLocation || undefined,
          expected_salary: expectedSalary ? Number(expectedSalary) : undefined,
          availability_status: availabilityStatus,
          remarks: remarks || undefined,
        },
      });

      toast('Personal details updated successfully.', 'success');
      dispatch(candidateProfileActions.fetchProfileRequest());
    } catch (err: any) {
      toast(err?.message || 'Failed to update personal details.', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-8 animate-fadeIn">
      <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-sm space-y-6">
        <div>
          <h2 className="text-lg font-bold text-slate-900 tracking-tight">Personal Details</h2>
          <p className="text-xs text-slate-400 mt-0.5 leading-relaxed">
            Update your core profile information. Keep these details up-to-date for screening.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 font-mono block">
                First Name
              </label>
              <input
                type="text"
                required
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                className="w-full rounded-xl border border-slate-200 p-2.5 text-xs focus:outline-none focus:border-primary text-slate-700"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 font-mono block">
                Last Name
              </label>
              <input
                type="text"
                required
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                className="w-full rounded-xl border border-slate-200 p-2.5 text-xs focus:outline-none focus:border-primary text-slate-700"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 font-mono block">
                Gender
              </label>
              <select
                value={gender}
                onChange={(e) => setGender(e.target.value)}
                className="w-full rounded-xl border border-slate-200 p-2.5 text-xs focus:outline-none focus:border-primary text-slate-700 bg-white"
              >
                <option value="">Select Gender</option>
                <option value="MALE">Male</option>
                <option value="FEMALE">Female</option>
                <option value="OTHER">Other</option>
                <option value="PREFER_NOT_TO_SAY">Prefer not to say</option>
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 font-mono block">
                Date of Birth
              </label>
              <input
                type="date"
                value={dateOfBirth}
                onChange={(e) => setDateOfBirth(e.target.value)}
                className="w-full rounded-xl border border-slate-200 p-2.5 text-xs focus:outline-none focus:border-primary text-slate-700"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 font-mono block">
                Nationality
              </label>
              <CountryDropdown value={nationality} onChange={setNationality} />
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 font-mono block">
                Current Address
              </label>
              <AddressAutocomplete
                value={currentAddress}
                onChange={setCurrentAddress}
                nationality={nationality}
              />
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 font-mono block">
                Expected Salary (USD/yr)
              </label>
              <input
                type="number"
                min="0"
                value={expectedSalary}
                onChange={(e) => setExpectedSalary(e.target.value)}
                className="w-full rounded-xl border border-slate-200 p-2.5 text-xs focus:outline-none focus:border-primary text-slate-700"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 font-mono block">
                Current Employer
              </label>
              <input
                type="text"
                value={currentEmployer}
                onChange={(e) => setCurrentEmployer(e.target.value)}
                className="w-full rounded-xl border border-slate-200 p-2.5 text-xs focus:outline-none focus:border-primary text-slate-700"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 font-mono block">
                Current Position
              </label>
              <input
                type="text"
                value={currentPosition}
                onChange={(e) => setCurrentPosition(e.target.value)}
                className="w-full rounded-xl border border-slate-200 p-2.5 text-xs focus:outline-none focus:border-primary text-slate-700"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 font-mono block">
                Availability Status
              </label>
              <select
                value={availabilityStatus}
                onChange={(e) => setAvailabilityStatus(e.target.value)}
                className="w-full rounded-xl border border-slate-200 p-2.5 text-xs focus:outline-none focus:border-primary text-slate-700 bg-white"
              >
                <option value="IMMEDIATELY">Immediately</option>
                <option value="TWO_WEEKS">Two Weeks</option>
                <option value="ONE_MONTH">One Month</option>
                <option value="MORE_THAN_ONE_MONTH">More than one month</option>
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 font-mono block">
                Portfolio Website
              </label>
              <input
                type="url"
                value={portfolioUrl}
                onChange={(e) => setPortfolioUrl(e.target.value)}
                placeholder="https://..."
                className="w-full rounded-xl border border-slate-200 p-2.5 text-xs focus:outline-none focus:border-primary text-slate-700"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 font-mono block">
                Preferred Job Category
              </label>
              <input
                type="text"
                value={preferredJobCategory}
                onChange={(e) => setPreferredJobCategory(e.target.value)}
                placeholder="e.g. Software Engineering"
                className="w-full rounded-xl border border-slate-200 p-2.5 text-xs focus:outline-none focus:border-primary text-slate-700"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 font-mono block">
                Preferred Location
              </label>
              <input
                type="text"
                value={preferredLocation}
                onChange={(e) => setPreferredLocation(e.target.value)}
                placeholder="e.g. Addis Ababa"
                className="w-full rounded-xl border border-slate-200 p-2.5 text-xs focus:outline-none focus:border-primary text-slate-700"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 font-mono block">
              Professional Remarks / Summary
            </label>
            <textarea
              rows={3}
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
              placeholder="Introduce yourself briefly..."
              className="w-full rounded-xl border border-slate-200 p-2.5 text-xs focus:outline-none focus:border-primary text-slate-700 resize-none"
            />
          </div>

          <div className="flex justify-end border-t border-slate-100 pt-4">
            <button
              type="submit"
              disabled={submitting}
              className="w-full sm:w-auto px-4 py-2.5 !text-white rounded-xl text-xs font-bold transition-all cursor-pointer disabled:opacity-50"
              style={{ backgroundColor: PROFILE_THEME.primary }}
              onMouseEnter={(e) => {
                e.currentTarget.style.filter = 'brightness(0.9)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.filter = 'none';
              }}
            >
              {submitting ? 'Saving...' : 'Save Profile Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

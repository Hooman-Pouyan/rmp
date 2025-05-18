export interface SubmissionLite {
  id: number
  date_val: string
  date_dereg: string | null
  lat_sub: string
  lon_sub: string
  num_accidents: number | null
  latest_accident: string | null
}

export interface FacilityLite {
  EPAFacilityID: string;
  name: string;
  city: string;
  state: { name: string; abbr: string };
  zip: string;
  address?: string; // Optional because it may not always exist
  names_prev?: string[]; // Optional array of previous names
  sub_last?: {
    id: string;
    date_val: string;
    date_dereg?: string;
    lat_sub?: number;
    lon_sub?: number;
    num_accidents?: number;
    latest_accident?: string;
  }; // Optional object for submission info
}

export interface CountyGroup {
  fips: string
  name: string
  facilities: FacilityLite[]
}

export interface StateFacilities {
  abbr: string
  name: string
  counties: CountyGroup[]
}

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

  // our injected state object
  state: {
    abbr: string;
    name: string;
  };

  // only present on detail objects; keep optional
  zip?: string;
  address?: string;

  // optional summary fields
  company_1?: string;
  company_2?: string;
  county_fips?: string;
  names_prev?: string[];

  sub_last?: {
    // in the by-state summary you only get these two at a minimum
    id?: string;
    date_val?: string;
    date_dereg?: string;
    lat_sub?: number;
    lon_sub?: number;
    num_accidents?: number;
    latest_accident?: string;
  };
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

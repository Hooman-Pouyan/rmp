export interface SubmissionLite {
  id: number;
  date_val: string;
  date_dereg: string | null;
  lat_sub: string;
  lon_sub: string;
  num_accidents: number | null;
  latest_accident: string | null;
}
export interface FacilityLite {
  facilityId: string;
  facilityName: string;
  address: string;
  city: string;
  state: string;
  zipcode: string;
  facilityURL: string | null;
  facilityLat: string;
  facilityLong: string;
  parentCompanyName: string | null;
  facilityDUNS: number | null;
  operatorName: string;
  noAccidents: string;
  programLevel: number;

  accidents: Array<{
    accidentHistoryId: number;
    accidentDate: string;
    accidentTime: string;
    // Add more fields if needed later
  }> | null;

  submissions: Array<{
    submissionId: number;
    chemicals: Array<{
      chemicalId: number;
      quantity: number;
      chemicalName: string;
    }>;
    naicsCode: string[];
  }>;
}

export interface CountyGroup {
  fips: string;
  name: string;
  facilities: FacilityLite[];
}

export interface StateFacilities {
  abbr: string;
  name: string;
  counties: CountyGroup[];
}

export interface ProcessChemical {
  ProcessChemicalID: number;
  ProcessID: number;
  ChemicalID: number;
  Quantity: number;
  CBI_Flag: string;
  _flam_mix_chemicals: any[];
}

export interface PreventionProg3 {
  PreventionProgram3ID: number;
  Process_NAICS_ID: number;
  SafetyReviewDate: string;
  PHA_Date: string;
  PHA_WhatIf: string;
  PHA_Checklist: string;
  PHA_WhatIfChecklist: string;
  PHA_HAZOP: string;
  PHA_FMEA: string;
  PHA_FTA: string;
  PHA_OtherTechnique: string | null;
  PHACompletionDate: string;
  MH_ToxicRelease: string;
  MH_Fire: string;
  MH_Explosion: string;
  MH_RunawayReaction: string;
  MH_Polymerization: string;
  MH_Overpressurization: string;
  MH_Corrosion: string;
  MH_Overfilling: string;
  MH_Contamination: string;
  MH_EquipmentFailure: string;
  MH_CoolingLoss: string;
  MH_Earthquake: string;
  MH_Floods: string;
  MH_Tornado: string;
  MH_Hurricanes: string;
  MH_OtherType: string | null;
  PC_Vents: string;
  PC_ReliefValves: string;
  PC_CheckValves: string;
  PC_Scrubbers: string;
  PC_Flares: string;
  PC_ManualShutoffs: string;
  PC_AutomaticShutoffs: string;
  PC_Interlocks: string;
  PC_Alarms: string;
  PC_KeyedBypass: string;
  PC_EmergencyAirSupply: string;
  PC_EmergencyPower: string;
  PC_BackupPump: string;
  PC_GroundingEquipment: string;
  PC_InhibitorAddition: string;
  PC_RuptureDisks: string;
  PC_ExcessFlowDevice: string;
  PC_QuenchSystem: string;
  PC_PurgeSystem: string;
  PC_None: string;
  PC_OtherType: string | null;
  MS_SprinklerSystem: string;
  MS_Dikes: string;
  MS_FireWalls: string;
  MS_BlastWalls: string;
  MS_DelugeSystem: string;
  MS_WaterCurtain: string;
  MS_Enclosure: string;
  MS_Neutralization: string;
  MS_None: string;
  MS_OtherType: string | null;
  MD_ProcessAreaDetectors: string;
  MD_PerimeterMonitors: string;
  MD_None: string;
  MD_OtherType: string | null;
  CH_ChemicalReduction: string;
  CH_ChemicalIncrease: string;
  CH_ChangeProcessParameters: string;
  CH_InstallProcessControls: string;
  CH_InstallProcessDetection: string;
  CH_InstallPerimeterMonitoring: string;
  CH_InstallMitigationSystems: string;
  CH_NoneRequired: string;
  CH_None: string;
  CH_OtherChanges: string | null;
  OpProceduresReviewDate: string;
  TrainingReviewDate: string;
  TR_Classroom: string;
  TR_OnTheJob: string;
  TR_OtherType: string | null;
  CT_WrittenTest: string;
  CT_OralTest: string;
  CT_Demonstration: string;
  CT_Observation: string;
  CT_OtherType: string | null;
  MaintenanceReviewDate: string;
  EquipmentInspectionDate: string;
  EquipmentTested: string;
  ChangeMgmtDate: string;
  ChangeMgmtReviewDate: string;
  PreStartupReviewDate: string;
  ComplianceAuditDate: string;
  AuditCompletionDate: string;
  IncidentInvestigationnDate: string;
  InvestigationChangeDate: string;
  ParticipationPlansReviewDate: string;
  HotWorkPermitReviewDate: string;
  ContractorSafetyReviewDate: string;
  ContractorSafetyEvalDate: string;
  CBI_Flag: string;
  Description: string | null;
  _chemicals: Array<{
    PrimaryKey: number;
    PreventionProgram3ID: number;
    ProcessChemicalID: number;
  }>;
}

export interface NAICSBlock {
  Process_NAICS_ID: number;
  ProcessID: number;
  NAICSCode: string;
  _prev_prog_3: PreventionProg3[];
  _prev_prog_2: any[];
}

export interface ProcessDetail {
  ProcessID: number;
  AltID: string;
  FacilityID: number;
  ProgramLevel: number;
  CBI_Flag: string;
  _chemicals: ProcessChemical[];
  _naics: NAICSBlock[];
}

export interface EmergencyResponse {
  FacilityID: number;
  ER_CommunityPlan: string;
  ER_FacilityPlan: string;
  ER_ResponseActions: string;
  ER_PublicInfoProcedures: string;
  ER_EmergencyHealthCare: string;
  ER_ReviewDate: string;
  ERTrainingDate: string;
  CoordinatingAgencyName: string;
  CoordinatingAgencyPhone: string;
  FR_OSHA1910_38: string;
  FR_OSHA1910_120: string;
  FR_SPCC: string;
  FR_RCRA: string;
  FR_OPA90: string;
  FR_EPCRA: string;
  FR_OtherRegulation: string | null;
  ExercisePlan: string;
  ExercisePlanDate: string | null;
  NotificationDrill: string;
  NotificationDrillDate: string | null;
  TabletopExercise: string;
  TabletopExerciseDate: string | null;
  LEPCCoordination: string;
  LEPCCoordinationDate: string | null;
  LEPCCoordinationReason: string | null;
  LocalResponseAgencyCoordination: string;
  LocalResponseAgencyCoordinationDate: string | null;
  LocalResponseAgencyCoordinationReason: string | null;
  StationarySource: string;
}

export interface ExecSummaryBlock {
  ESSeqNum: number;
  FacilityID: number;
  SummaryText: string;
}

export interface SubmissionDetail {
  FacilityID: number;
  FacilityName: string;
  FacilityStr1: string;
  FacilityStr2: string | null;
  FacilityCity: string;
  FacilityState: string;
  FacilityZipCode: string;
  Facility4DigitZipExt: string | null;
  FacilityCountyFIPS: string;
  LEPC: string;
  FacilityLatDecDegs: string;
  FacilityLongDecDegs: string;
  ValidLatLongFlag: string;
  LatLongMethod: string;
  LatLongDescription: string;
  FacilityURL: string;
  FacilityEmailAddress: string;
  FacilityDUNS: number;
  ParentCompanyName: string;
  Company2Name: string;
  CompanyDUNS: number | null;
  Company2DUNS: number | null;
  OperatorName: string;
  OperatorStr1: string;
  OperatorStr2: string | null;
  OperatorCity: string;
  OperatorStateFIPS: string;
  OperatorZipCode: string;
  OperatorZipCodeExt: string | null;
  FTE: number;
  OtherEPAFacilityID: string | null;
  EPAFacilityID: string;
  OSHA_PSM: string;
  EPCRA_302: string;
  CAA_TitleV: string;
  ClearAirOpPermitID: string | null;
  SafetyInspectionDate: string | null;
  SafetyInspectionBy: string;
  OSHARanking: string;
  PredictiveFilingFlag: string;
  SubmissionType: string;
  RMPDescription: string | null;
  NoAccidents: string;
  ForeignStateProv: string | null;
  ForeignZipCode: string | null;
  ForeignCountry: string | null;
  CBI_Flag: string;
  CompletionCheckDate: string;
  ErrorReportDate: string | null;
  ReceiptDate: string;
  GraphicsIndicator: string;
  AttachmentsIndicator: string;
  CertificationReceivedFlag: string;
  SubmissionMethod: string;
  CBISubstantiationFlag: string;
  ElectronicWaiverReceivedFlag: string;
  PostmarkDate: string;
  RMPCompleteFlag: string;
  DeRegistrationDate: string;
  DeRegistrationEffectiveDate: string;
  AnniversaryDate: string;
  CBIFlag: string;
  CBIUnsanitizedVersionFlag: string;
  VersionNumber: string;
  FRS_Lat: number | null;
  FRS_Long: number | null;
  FRS_Description: string | null;
  FRS_Method: string;
  HorizontalAccMeasure: string | null;
  HorizontalRefDatumCode: string | null;
  SourceMapScaleNumber: string | null;
  RMPSubmissionReasonCode: string | null;
  DeregistrationReasonCode: string;
  DeregistrationReasonOtherText: string | null;
  _processes: ProcessDetail[];
  _accidents: any[];
  _emerg_resp: EmergencyResponse | null;
  _exec_summary: ExecSummaryBlock[];
}

interface FacilityLite {
  EPAFacilityID: string;
  name: string;
  city: string;
  address: string;
  names_prev: string[];
  sub_last: {
    id: number;
    date_val: string;
    date_dereg: string | null;
    lat_sub: string;
    lon_sub: string;
    num_accidents: number | null;
    latest_accident: string | null;
  };
  state: { name: string; abbr: string };
}

interface StateFacilities {
  abbr: string;
  name: string;
  counties: Array<{
    fips: string;
    name: string;
    facilities: Array<{
      EPAFacilityID: string;
      name: string;
      city: string;
      address: string;
      names_prev: string[];
      sub_last: {
        id: number;
        date_val: string;
        date_dereg: string | null;
        lat_sub: string;
        lon_sub: string;
        num_accidents: number | null;
        latest_accident: string | null;
      };
    }>;
  }>;
}

interface SubmissionSummary {
  id: number;
  date_rec: string;
  date_val: string;
  date_dereg: string | null;
  lat_sub: string;
  lon_sub: string;
  num_accidents: number | null;
  latest_accident: string | null;
  name: string;
  company_1: string | null;
  company_2: string | null;
  operator: string | null;
}

interface FacilityDetail {
  EPAFacilityID: string;
  name: string;
  state: string;
  city: string;
  ValidationDate: string;
  address: string;
  zip: string;
  county_fips?: string;
  company_1?: string;
  company_2?: string;
  operator?: string;
  submissions: SubmissionSummary[];
  accidents: any[];
  names_prev: string[];
}

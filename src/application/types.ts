export interface DatasetSummary {
  id: string;
  name: string;
  title: string;
  notes: string;
  numResources: number;
}

export interface DatasetResource {
  id: string;
  name: string;
  format: string;
  description: string;
  datastoreActive: boolean;
}

export interface DatasetMetadata {
  id: string;
  name: string;
  title: string;
  notes: string;
  organization: string | null;
  metadataModified: string;
  resources: DatasetResource[];
}

export interface PrescriptionRecord {
  bnfCode: string;
  bnfDescription: string;
  practiceCode: string;
  practiceName: string;
  items: number;
  quantity: number;
  netIngredientCost: number;
  actualCost: number;
  yearMonth: string;
}

export interface QueryResult<T> {
  records: T[];
  total: number;
  limit: number;
  offset: number;
}

export interface OrganisationSummary {
  orgId: string;
  name: string;
  status: string;
  postCode: string;
  lastChangeDate: string;
  primaryRoleId: string;
  primaryRoleDescription: string;
}

export interface OrganisationDetail {
  orgId: string;
  name: string;
  status: string;
  lastChangeDate: string;
  recordClass: string;
  address: {
    line1?: string;
    line2?: string;
    line3?: string;
    town?: string;
    county?: string;
    postCode?: string;
    country?: string;
  } | null;
  roles: Array<{
    id: string;
    primaryRole: boolean;
    status: string;
    startDate?: string;
    endDate?: string;
  }>;
  relationships: Array<{
    id: string;
    status: string;
    targetOrgId: string;
    targetPrimaryRoleId: string;
  }>;
  successors: Array<{
    type: string;
    targetOrgId: string;
  }>;
}

export interface CostAnalysisRecord {
  bnfCode: string;
  bnfDescription: string;
  items: number;
  quantity: number;
  netIngredientCost: number;
  actualCost: number;
  yearMonth: string;
}

export interface SpendingTrendPoint {
  date: string;
  actualCost: number;
  items: number;
  quantity: number;
}

export interface SpendingTrendResult {
  bnfCode: string;
  orgName: string | null;
  data: SpendingTrendPoint[];
}

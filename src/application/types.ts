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

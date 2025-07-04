
export enum AgreementType {
  Monetary = 'monetary',
  Info = 'info',
}

export enum InfoSubType {
  General = 'general',
  Insured = 'insured',
}

export enum MonetaryOperation {
  Increase = 'increase',
  Decrease = 'decrease',
}

export interface InsuredPerson {
  id: string;
  name: string;
  iin: string;
}

export interface FormState {
  contractNumber: string;
  contractDate: string;
  insuranceType: string;
  agreementType: AgreementType;
  // Monetary fields
  basisDocument: string;
  basisDocumentNumber: string;
  basisDocumentDate: string;
  sumOperation: MonetaryOperation;
  currentSum: string;
  deltaSum: string;
  isSumUnchanged: boolean;
  premiumOperation: MonetaryOperation;
  currentPremium: string;
  deltaPremium: string;
  isPremiumUnchanged: boolean;
  paymentDeadline: string;
  // Info fields
  infoSubType: InfoSubType;
  generalInfoText: string;
  insuredToAdd: InsuredPerson[];
  insuredToRemove: InsuredPerson[];
}
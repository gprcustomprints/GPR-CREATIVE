
export enum AcrylicType {
  WHITE = 'WHITE',
  COLORED_BLACK = 'COLORED_BLACK',
  CLEAR = 'CLEAR'
}

export interface AcrylicThickness {
  thickness: string;
  pricePerSqFt: number;
}

export enum SignageSize {
  SMALL = 'SMALL',
  MEDIUM = 'MEDIUM',
  LARGE = 'LARGE'
}

export interface CustomerInfo {
  name: string;
  company: string;
  address: string;
  contact: string;
  quoteNumber: string;
  date: string;
}

export interface LightingConfig {
  led: number;
  power: number;
  wiring: number;
  labor: number;
}

export interface PriceConfig {
  acrylicPrices: Record<AcrylicType, Record<string, number>>;
  cutOutPricePerSqFt: number;
  stickerPricePerSqIn: number;
  mountingBoltPackPrice: number;
  lighting: {
    SMALL: LightingConfig;
    LARGE: LightingConfig;
  };
  labor: {
    SMALL: number;
    MEDIUM: number;
    LARGE: number;
  };
  tools: {
    SMALL: number;
    MEDIUM: number;
    LARGE: number;
  };
  overhead: {
    DEFAULT: number;
    LARGE: number;
  };
  logistics: {
    delivery: {
      MOTORCYCLE: number;
      L300: number;
    };
    installation: {
      SMALL: number;
      LARGE: number;
      FAR_SURCHARGE: number;
    };
  };
}

export interface SignageParams {
  widthFt: number;
  heightFt: number;
  type: AcrylicType;
  thickness: string;
  isBuildUp: boolean;
  hasSticker: boolean;
  hasCutOuts: boolean;
  cutOutAreaSqFt?: number;
  hasLights: boolean;
  isInstallationFar: boolean;
  depthIn?: number;
}

export interface CalculationResult {
  params: SignageParams;
  materials: {
    acrylic: number;
    cutOuts: number;
    sticker: number;
    mounting: number;
    lighting?: {
      led: number;
      power: number;
      wiring: number;
    };
    total: number;
  };
  labor: {
    fabrication: number;
    electrical?: number;
    total: number;
  };
  operating: {
    tools: number;
    overhead: number;
    total: number;
  };
  logistics: {
    delivery: number;
    installation: number;
    total: number;
  };
  totalCost: number;
  finalPrice: number;
}

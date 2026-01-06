
import { AcrylicType, PriceConfig } from './types';

export const INITIAL_PRICE_CONFIG: PriceConfig = {
  acrylicPrices: {
    [AcrylicType.WHITE]: {
      '1.5mm': 70,
      '2mm': 92,
      '3mm': 105,
      '4mm': 120,
      '5mm': 152,
      '6mm': 180,
    },
    [AcrylicType.COLORED_BLACK]: {
      '3mm': 120,
      '6mm': 275,
    },
    [AcrylicType.CLEAR]: {
      '3mm': 105,
      '5mm': 152,
    },
  },
  cutOutPricePerSqFt: 275,
  stickerPricePerSqIn: 2,
  mountingBoltPackPrice: 52,
  lighting: {
    SMALL: {
      led: 800,
      power: 600,
      wiring: 200,
      labor: 400,
    },
    LARGE: {
      led: 2500,
      power: 1200,
      wiring: 400,
      labor: 1000,
    }
  },
  labor: {
    SMALL: 1500,
    MEDIUM: 3500,
    LARGE: 5000,
  },
  tools: {
    SMALL: 500,
    MEDIUM: 1000,
    LARGE: 1500,
  },
  overhead: {
    DEFAULT: 500,
    LARGE: 1500,
  },
  logistics: {
    delivery: {
      MOTORCYCLE: 300,
      L300: 1500,
    },
    installation: {
      SMALL: 1000,
      LARGE: 2500,
      FAR_SURCHARGE: 2000,
    }
  }
};

export const TERMS_AND_CONDITIONS = [
  "Validity: Quotation is valid for 15 days from the date of issue.",
  "Payment: 50% Downpayment upon confirmation, 50% Balance upon delivery/installation.",
  "Lead Time: 7-10 working days upon receipt of downpayment and approved final layout.",
  "Warranty: 6 months warranty on LED lighting and power supply.",
  "Exclusion: Electrical tapping point to be provided by the client within 2 meters of the signage area."
];

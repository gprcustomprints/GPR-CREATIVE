
import { 
  SignageParams, 
  CalculationResult, 
  SignageSize, 
  PriceConfig 
} from '../types';

export function calculateQuote(params: SignageParams, config: PriceConfig): CalculationResult {
  const areaSqFt = params.widthFt * params.heightFt;
  const areaSqIn = (params.widthFt * 12) * (params.heightFt * 12);
  
  // Categorize size
  let size = SignageSize.SMALL;
  if (areaSqFt > 12 || (params.isBuildUp && params.hasCutOuts)) {
    size = SignageSize.LARGE;
  } else if (areaSqFt > 4) {
    size = SignageSize.MEDIUM;
  }

  // Materials: Acrylic
  const selectedThickness = params.isBuildUp ? '6mm' : params.thickness;
  const acrylicTypePrices = config.acrylicPrices[params.type];
  const pricePerSqFt = acrylicTypePrices[selectedThickness] || acrylicTypePrices[Object.keys(acrylicTypePrices)[0]];
  const acrylicCost = areaSqFt * pricePerSqFt;

  // Materials: Cut-outs
  const cutOutCost = params.hasCutOuts ? (params.cutOutAreaSqFt || 6) * config.cutOutPricePerSqFt : 0;

  // Materials: Sticker
  const stickerCost = params.hasSticker ? areaSqIn * config.stickerPricePerSqIn : 0;

  // Materials: Mounting (estimate 1 pack per 4 sqft or min 1)
  const boltPacks = Math.max(1, Math.ceil(areaSqFt / 4));
  const mountingCost = boltPacks * config.mountingBoltPackPrice;

  // Lighting
  const lightConfig = size === SignageSize.LARGE ? config.lighting.LARGE : config.lighting.SMALL;
  const lightingMaterials = params.hasLights ? {
    led: lightConfig.led,
    power: lightConfig.power,
    wiring: lightConfig.wiring,
  } : undefined;

  // Labor
  const fabricationLabor = config.labor[size];
  const electricalLabor = params.hasLights ? lightConfig.labor : 0;

  // Operating
  const toolsCost = config.tools[size];
  const overheadCost = size === SignageSize.LARGE ? config.overhead.LARGE : config.overhead.DEFAULT;

  // Logistics
  const deliveryCost = areaSqFt > 4 ? config.logistics.delivery.L300 : config.logistics.delivery.MOTORCYCLE;
  const installationBase = size === SignageSize.LARGE ? config.logistics.installation.LARGE : config.logistics.installation.SMALL;
  const installationCost = installationBase + (params.isInstallationFar ? config.logistics.installation.FAR_SURCHARGE : 0);

  const materialsSubtotal = acrylicCost + cutOutCost + stickerCost + mountingCost + (lightingMaterials ? (lightingMaterials.led + lightingMaterials.power + lightingMaterials.wiring) : 0);
  const laborSubtotal = fabricationLabor + electricalLabor;
  const operatingSubtotal = toolsCost + overheadCost;
  const logisticsSubtotal = deliveryCost + installationCost;

  const totalCost = materialsSubtotal + laborSubtotal + operatingSubtotal + logisticsSubtotal;
  
  // 100% markup
  const finalPriceRaw = totalCost * 2;
  
  // Clean rounding logic (nearest hundred or thousand)
  const finalPrice = Math.ceil(finalPriceRaw / 100) * 100;

  return {
    params,
    materials: {
      acrylic: acrylicCost,
      cutOuts: cutOutCost,
      sticker: stickerCost,
      mounting: mountingCost,
      lighting: lightingMaterials,
      total: materialsSubtotal
    },
    labor: {
      fabrication: fabricationLabor,
      electrical: electricalLabor || undefined,
      total: laborSubtotal
    },
    operating: {
      tools: toolsCost,
      overhead: overheadCost,
      total: operatingSubtotal
    },
    logistics: {
      delivery: deliveryCost,
      installation: installationCost,
      total: logisticsSubtotal
    },
    totalCost,
    finalPrice
  };
}

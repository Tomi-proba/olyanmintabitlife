export interface ManufacturabilityInput {
  rimThicknessMm: number;
  rimDepthMm: number;
  lensWidthMm: number;
  lensHeightMm: number;
  bridgeWidthMm: number;
}

export interface ManufacturabilityWarning {
  id: string;
  level: 'warning' | 'error';
  message: string;
}

const MIN_RIM_THICKNESS_MM = 2;
const MIN_RIM_DEPTH_MM = 3;
const LENS_WIDTH_RANGE: [number, number] = [30, 62];
const LENS_HEIGHT_RANGE: [number, number] = [20, 52];
const BRIDGE_WIDTH_RANGE: [number, number] = [14, 24];

/** Pure checks against typical acetate-frame manufacturing limits. Called live as the design changes. */
export function checkManufacturability(input: ManufacturabilityInput): ManufacturabilityWarning[] {
  const warnings: ManufacturabilityWarning[] = [];

  if (input.rimThicknessMm < MIN_RIM_THICKNESS_MM) {
    warnings.push({
      id: 'rim_too_thin',
      level: 'error',
      message: `Rim is ${input.rimThicknessMm.toFixed(1)}mm thick — too thin to mill from acetate (minimum ~${MIN_RIM_THICKNESS_MM}mm).`,
    });
  }

  if (input.rimDepthMm < MIN_RIM_DEPTH_MM) {
    warnings.push({
      id: 'rim_too_shallow',
      level: 'warning',
      message: `Frame front-to-back depth is ${input.rimDepthMm.toFixed(1)}mm — likely too thin to hold a lens securely (minimum ~${MIN_RIM_DEPTH_MM}mm).`,
    });
  }

  if (input.lensWidthMm < LENS_WIDTH_RANGE[0]) {
    warnings.push({ id: 'lens_width_small', level: 'warning', message: `Lens width ${input.lensWidthMm.toFixed(1)}mm is unusually small (typical minimum ~${LENS_WIDTH_RANGE[0]}mm).` });
  } else if (input.lensWidthMm > LENS_WIDTH_RANGE[1]) {
    warnings.push({ id: 'lens_width_large', level: 'warning', message: `Lens width ${input.lensWidthMm.toFixed(1)}mm is unusually large (typical maximum ~${LENS_WIDTH_RANGE[1]}mm).` });
  }

  if (input.lensHeightMm < LENS_HEIGHT_RANGE[0]) {
    warnings.push({ id: 'lens_height_small', level: 'warning', message: `Lens height ${input.lensHeightMm.toFixed(1)}mm is unusually small (typical minimum ~${LENS_HEIGHT_RANGE[0]}mm).` });
  } else if (input.lensHeightMm > LENS_HEIGHT_RANGE[1]) {
    warnings.push({ id: 'lens_height_large', level: 'warning', message: `Lens height ${input.lensHeightMm.toFixed(1)}mm is unusually large (typical maximum ~${LENS_HEIGHT_RANGE[1]}mm).` });
  }

  if (input.bridgeWidthMm < BRIDGE_WIDTH_RANGE[0]) {
    warnings.push({ id: 'bridge_narrow', level: 'warning', message: `Bridge width ${input.bridgeWidthMm.toFixed(1)}mm is unrealistically narrow (typical minimum ~${BRIDGE_WIDTH_RANGE[0]}mm).` });
  } else if (input.bridgeWidthMm > BRIDGE_WIDTH_RANGE[1]) {
    warnings.push({ id: 'bridge_wide', level: 'warning', message: `Bridge width ${input.bridgeWidthMm.toFixed(1)}mm is unusually wide (typical maximum ~${BRIDGE_WIDTH_RANGE[1]}mm).` });
  }

  return warnings;
}

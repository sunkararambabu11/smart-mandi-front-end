/**
 * Product Category Enumeration
 *
 * Agricultural product categories available in the marketplace.
 */

export enum ProductCategory {
  VEGETABLES = 'VEGETABLES',
  FRUITS = 'FRUITS',
  GRAINS = 'GRAINS',
  PULSES = 'PULSES',
  SPICES = 'SPICES',
  DAIRY = 'DAIRY',
  OILSEEDS = 'OILSEEDS',
  FLOWERS = 'FLOWERS',
  ORGANIC = 'ORGANIC',
  OTHER = 'OTHER',
}

/** Category display configuration with Hindi translations */
export const ProductCategoryConfig: Record<
  ProductCategory,
  { label: string; labelHi: string; icon: string; color: string }
> = {
  [ProductCategory.VEGETABLES]: {
    label: 'Vegetables',
    labelHi: 'सब्जियां',
    icon: 'eco',
    color: 'green',
  },
  [ProductCategory.FRUITS]: {
    label: 'Fruits',
    labelHi: 'फल',
    icon: 'nutrition',
    color: 'orange',
  },
  [ProductCategory.GRAINS]: {
    label: 'Grains',
    labelHi: 'अनाज',
    icon: 'grain',
    color: 'amber',
  },
  [ProductCategory.PULSES]: {
    label: 'Pulses',
    labelHi: 'दालें',
    icon: 'scatter_plot',
    color: 'yellow',
  },
  [ProductCategory.SPICES]: {
    label: 'Spices',
    labelHi: 'मसाले',
    icon: 'local_fire_department',
    color: 'red',
  },
  [ProductCategory.DAIRY]: {
    label: 'Dairy',
    labelHi: 'डेयरी',
    icon: 'water_drop',
    color: 'blue',
  },
  [ProductCategory.OILSEEDS]: {
    label: 'Oilseeds',
    labelHi: 'तिलहन',
    icon: 'opacity',
    color: 'lime',
  },
  [ProductCategory.FLOWERS]: {
    label: 'Flowers',
    labelHi: 'फूल',
    icon: 'local_florist',
    color: 'pink',
  },
  [ProductCategory.ORGANIC]: {
    label: 'Organic',
    labelHi: 'जैविक',
    icon: 'spa',
    color: 'emerald',
  },
  [ProductCategory.OTHER]: {
    label: 'Other',
    labelHi: 'अन्य',
    icon: 'category',
    color: 'gray',
  },
};


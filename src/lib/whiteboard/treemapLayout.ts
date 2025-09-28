import { hierarchy, treemap, treemapSquarify } from 'd3-hierarchy'
import type { BudgetBlockShape } from './BudgetBlock'
import { AMOUNT_TO_AREA_SCALE, MIN_BUDGET_BLOCK_SIZE } from './BudgetBlock'

interface TreemapHierarchyDatum {
  id: BudgetBlockShape['id']
  area: number
  originalAmount: number
  children?: TreemapHierarchyDatum[]
}

export interface TreemapLayoutItem {
  id: BudgetBlockShape['id']
  amount: number
  x: number
  y: number
  w: number
  h: number
}

export interface TreemapLayoutOptions {
  padding?: number
  origin?: { x: number; y: number }
  aspectRatioBounds?: { min: number; max: number }
}

export interface TreemapLayoutResult {
  id: BudgetBlockShape['id']
  amount: number
  x: number
  y: number
  w: number
  h: number
}

const DEFAULT_PADDING = 0
const DEFAULT_ASPECT_BOUNDS = { min: 0.25, max: 4 }

const clamp = (value: number, min: number, max: number) => Math.min(Math.max(value, min), max)

export function computeBudgetTreemapLayout(
  items: TreemapLayoutItem[],
  options: TreemapLayoutOptions = {}
): TreemapLayoutResult[] {
  if (!Array.isArray(items) || items.length === 0) {
    return []
  }

  const nodes = items.map((item) => {
    const nonNegativeAmount = Math.max(item.amount, 0)
    const desiredArea = nonNegativeAmount * AMOUNT_TO_AREA_SCALE
    const minimumArea = MIN_BUDGET_BLOCK_SIZE * MIN_BUDGET_BLOCK_SIZE
    const area = Math.max(desiredArea, minimumArea)

    return {
      id: item.id,
      originalAmount: item.amount,
      area,
    }
  })

  const totalArea = nodes.reduce((sum, node) => sum + node.area, 0)

  if (!Number.isFinite(totalArea) || totalArea <= 0) {
    return []
  }

  const minX = Math.min(...items.map((item) => item.x))
  const minY = Math.min(...items.map((item) => item.y))
  const maxX = Math.max(...items.map((item) => item.x + item.w))
  const maxY = Math.max(...items.map((item) => item.y + item.h))

  const selectionWidth = Math.max(maxX - minX, MIN_BUDGET_BLOCK_SIZE)
  const selectionHeight = Math.max(maxY - minY, MIN_BUDGET_BLOCK_SIZE)
  const selectionAspect = selectionWidth / selectionHeight

  const { min: boundMin, max: boundMax } = options.aspectRatioBounds ?? DEFAULT_ASPECT_BOUNDS
  const targetAspect = clamp(selectionAspect, boundMin, boundMax)

  let containerWidth = Math.sqrt(totalArea * targetAspect)
  containerWidth = Math.max(containerWidth, MIN_BUDGET_BLOCK_SIZE)

  let containerHeight = totalArea / containerWidth
  if (containerHeight < MIN_BUDGET_BLOCK_SIZE) {
    containerHeight = MIN_BUDGET_BLOCK_SIZE
    containerWidth = Math.max(totalArea / containerHeight, MIN_BUDGET_BLOCK_SIZE)
  }

  const treemapRatio = Math.max(targetAspect, 1 / targetAspect)

  const originX = options.origin?.x ?? minX
  const originY = options.origin?.y ?? minY
  const padding = options.padding ?? DEFAULT_PADDING

  const root = hierarchy<TreemapHierarchyDatum>({
    id: 'root',
    area: 0,
    originalAmount: 0,
    children: nodes,
  })
    .sum((node) => node.area)
    .sort((a, b) => (b.value ?? 0) - (a.value ?? 0))

  const layout = treemap<TreemapHierarchyDatum>()
    .tile(treemapSquarify.ratio(treemapRatio))
    .size([containerWidth, containerHeight])
    .paddingInner(padding)
    .round(true)

  const laidOutRoot = layout(root)
  const leaves = laidOutRoot.leaves()

  return leaves.map((leaf) => {
    const width = leaf.x1 - leaf.x0
    const height = leaf.y1 - leaf.y0

    return {
      id: leaf.data.id,
      amount: leaf.data.originalAmount,
      x: originX + leaf.x0,
      y: originY + leaf.y0,
      w: width,
      h: height,
    }
  })
}

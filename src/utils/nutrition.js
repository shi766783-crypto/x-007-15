// 营养评分与营养缺口：基于菜品类别映射到食物组，按平衡度给出 0-100 分

import { FOOD_GROUPS } from '@/constants'

// 核心营养组的展示信息与目标占比
export const NUTRITION_GROUPS = [
  { key: '蛋白质', icon: '🥩', color: '#2196f3', target: 0.25 },
  { key: '蔬菜', icon: '🥬', color: '#4caf50', target: 0.5 },
  { key: '主食', icon: '🍚', color: '#ff9800', target: 0.25 },
]

export const OTHER_GROUP = { key: '其他', icon: '📦', color: '#90a4ae', target: 0 }

// 判定“该补 / 该减”的容差：±5 个百分点
const GAP_TOLERANCE = 0.05

// 将菜品类别映射到食物组
export function categoryToGroup(category) {
  for (const [group, cats] of Object.entries(FOOD_GROUPS)) {
    if (cats.includes(category)) return group
  }
  return '其他'
}

// 理想占比：蔬菜 50%、蛋白质 25%、主食 25%
const IDEAL = { 蛋白质: 0.25, 蔬菜: 0.5, 主食: 0.25 }

export function countFoodGroups(dishes = []) {
  const count = { 蛋白质: 0, 蔬菜: 0, 主食: 0, 其他: 0 }
  dishes.forEach((d) => {
    const g = categoryToGroup(d.category)
    count[g] = (count[g] || 0) + 1
  })
  return count
}

// 对一组菜品（每项含 category）计算营养平衡分
export function nutritionScore(dishes) {
  if (!dishes.length) return 0
  const count = countFoodGroups(dishes)
  const total = dishes.length
  let score = 100
  for (const [group, ideal] of Object.entries(IDEAL)) {
    const actual = (count[group] || 0) / total
    score -= Math.abs(actual - ideal) * 100
  }
  // 多样性加分：覆盖核心组越多分越高（每多一组 +3，最多 +9）
  const coreGroups = ['蛋白质', '蔬菜', '主食'].filter((g) => (count[g] || 0) > 0)
  score += (coreGroups.length - 1) * 3
  return Math.max(0, Math.min(100, Math.round(score)))
}

// 评分等级文案
export function scoreLabel(score) {
  if (score >= 85) return { label: '优秀', color: '#4caf50' }
  if (score >= 70) return { label: '良好', color: '#8bc34a' }
  if (score >= 50) return { label: '一般', color: '#ff9800' }
  return { label: '失衡', color: '#ef5350' }
}

// 营养缺口：拆分实际占比，对比目标占比，并给出该补 / 该减结论
export function nutritionGap(dishes = []) {
  const total = dishes.length
  const count = countFoodGroups(dishes)
  const groupDefs = [...NUTRITION_GROUPS, OTHER_GROUP]

  const rows = groupDefs.map((group) => {
    const actual = total ? count[group.key] / total : 0
    const diff = actual - group.target
    let status = 'ok'
    if (diff < -GAP_TOLERANCE) status = 'low'
    if (diff > GAP_TOLERANCE) status = 'high'

    return {
      ...group,
      count: count[group.key],
      actual,
      diff,
      actualPercent: Math.round(actual * 100),
      targetPercent: Math.round(group.target * 100),
      diffPercent: Math.round(diff * 100),
      status,
    }
  })

  const coreRows = rows.filter((r) => r.key !== '其他')
  const add = coreRows.filter((r) => r.status === 'low')
  const reduce = rows.filter((r) => r.status === 'high')
  const balanced = total > 0 && !add.length && !reduce.length

  return {
    total,
    count,
    rows,
    add,
    reduce,
    balanced,
    hasRecords: total > 0,
  }
}

// 由菜品类别推断菜品的主导食物组（用于看板统计）
export function dishGroupRatio(dishes) {
  const groups = countFoodGroups(dishes)
  const total = dishes.length || 1
  return {
    protein: groups['蛋白质'] / total,
    vegetable: groups['蔬菜'] / total,
    staple: groups['主食'] / total,
    other: groups['其他'] / total,
  }
}

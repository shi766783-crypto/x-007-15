// 营养评分：基于菜品类别映射到食物组，按平衡度给出 0-100 分

import { FOOD_GROUPS } from '@/constants'

// 将菜品类别映射到食物组
export function categoryToGroup(category) {
  for (const [group, cats] of Object.entries(FOOD_GROUPS)) {
    if (cats.includes(category)) return group
  }
  return '其他'
}

// 核心食物组的目标占比（"健康餐盘"）：蔬菜 50%、蛋白质 25%、主食 25%
export const IDEAL_GROUPS = [
  { key: '蛋白质', ratioKey: 'protein', icon: '🥩', color: '#ef5350', ideal: 0.25 },
  { key: '蔬菜', ratioKey: 'vegetable', icon: '🥬', color: '#4caf50', ideal: 0.5 },
  { key: '主食', ratioKey: 'staple', icon: '🍚', color: '#8d6e63', ideal: 0.25 },
]

const IDEAL = Object.fromEntries(IDEAL_GROUPS.map((g) => [g.key, g.ideal]))

// 占比偏离目标达到该幅度（10 个百分点）才提示"该补/该减"，避免一菜之差频繁报警
export const GAP_THRESHOLD = 0.1

// 对一组菜品（每项含 category）计算营养平衡分
export function nutritionScore(dishes) {
  if (!dishes.length) return 0
  const count = { 蛋白质: 0, 蔬菜: 0, 主食: 0, 其他: 0 }
  dishes.forEach((d) => {
    const g = categoryToGroup(d.category)
    count[g] = (count[g] || 0) + 1
  })
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

// 由菜品类别推断菜品的主导食物组（用于看板统计）
export function dishGroupRatio(dishes) {
  const groups = { 蛋白质: 0, 蔬菜: 0, 主食: 0, 其他: 0 }
  dishes.forEach((d) => {
    const g = categoryToGroup(d.category)
    groups[g] = (groups[g] || 0) + 1
  })
  const total = dishes.length || 1
  return {
    protein: groups['蛋白质'] / total,
    vegetable: groups['蔬菜'] / total,
    staple: groups['主食'] / total,
    other: groups['其他'] / total,
  }
}

// 营养缺口分析：拆开蛋白质/蔬菜/主食的实际占比，与目标占比对比
// 返回每组的实际/目标占比、偏离百分点、状态（lack 该补 / excess 该减 / ok 均衡）与调整建议
export function nutritionGap(dishes = []) {
  const total = dishes.length
  const counts = { 蛋白质: 0, 蔬菜: 0, 主食: 0, 其他: 0 }
  dishes.forEach((d) => {
    const g = categoryToGroup(d.category)
    counts[g] = (counts[g] || 0) + 1
  })
  const ratio = dishGroupRatio(dishes)

  const groups = IDEAL_GROUPS.map((meta) => {
    const count = counts[meta.key] || 0
    const actual = ratio[meta.ratioKey]
    const diff = total ? actual - meta.ideal : 0 // 正=偏多，负=偏少
    let status = 'ok'
    if (total && Math.abs(diff) >= GAP_THRESHOLD) status = diff > 0 ? 'excess' : 'lack'
    // 达到目标占比大约需要的道数与当前的差值（正=建议加几道菜，负=建议减几道）
    const suggestCount = Math.round(meta.ideal * total) - count
    let advice = '占比均衡'
    if (status === 'lack') advice = suggestCount > 0 ? `建议增加约 ${suggestCount} 道` : '建议适当增加'
    else if (status === 'excess') advice = suggestCount < 0 ? `建议减少约 ${Math.abs(suggestCount)} 道` : '建议适当减少'
    return {
      ...meta,
      count,
      actual,
      actualPct: Math.round(actual * 100),
      idealPct: Math.round(meta.ideal * 100),
      diffPct: Math.round(diff * 100),
      status,
      suggestCount,
      advice,
    }
  })

  const lack = groups.filter((g) => g.status === 'lack')
  const excess = groups.filter((g) => g.status === 'excess')
  return {
    total,
    groups,
    lack,
    excess,
    otherCount: counts['其他'] || 0,
    otherPct: Math.round(ratio.other * 100),
    balanced: total > 0 && !lack.length && !excess.length,
    empty: !total,
  }
}

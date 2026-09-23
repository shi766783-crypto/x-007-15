<script setup>
import { computed } from 'vue'
import { nutritionGap } from '@/utils/nutrition'
import BaseEmpty from '@/components/common/BaseEmpty.vue'

const props = defineProps({
  dishes: { type: Array, default: () => [] },
  emptyText: { type: String, default: '还没有菜品记录，暂无法分析营养缺口' },
})

const gap = computed(() => nutritionGap(props.dishes))

const STATUS_META = {
  lack: { label: '该补', bg: 'var(--info-light)', color: 'var(--info)', icon: '⬇️' },
  excess: { label: '该减', bg: 'var(--danger-light)', color: 'var(--danger)', icon: '⬆️' },
  ok: { label: '均衡', bg: 'var(--primary-light)', color: 'var(--primary-dark)', icon: '✓' },
}

// 顶部结论：优先提示缺口，其次提示过量
const summary = computed(() => {
  if (gap.value.empty) return ''
  if (gap.value.balanced) return '三类食物占比均衡，继续保持'
  const parts = []
  if (gap.value.lack.length) parts.push(`该补：${gap.value.lack.map((g) => g.key).join('、')}`)
  if (gap.value.excess.length) parts.push(`该减：${gap.value.excess.map((g) => g.key).join('、')}`)
  return parts.join('　·　')
})
</script>

<template>
  <div class="nutrition-gap">
    <BaseEmpty v-if="gap.empty" emoji="🥗" :text="emptyText" />
    <template v-else>
      <div class="gap-summary" :class="{ balanced: gap.balanced }">
        <span class="gap-summary-icon">{{ gap.balanced ? '✅' : '💡' }}</span>
        <span>{{ summary }}</span>
      </div>

      <div class="gap-rows">
        <div v-for="g in gap.groups" :key="g.key" class="gap-row">
          <div class="gap-head">
            <span class="gap-name">
              <span class="gap-icon">{{ g.icon }}</span>{{ g.key }}
              <span class="gap-count muted">{{ g.count }} 道</span>
            </span>
            <span class="gap-pct">
              实际 {{ g.actualPct }}%<span class="muted"> / 目标 {{ g.idealPct }}%</span>
              <span class="status-chip" :style="{ background: STATUS_META[g.status].bg, color: STATUS_META[g.status].color }">
                {{ STATUS_META[g.status].icon }} {{ STATUS_META[g.status].label }}
                <template v-if="g.status !== 'ok'"> {{ Math.abs(g.diffPct) }}%</template>
              </span>
            </span>
          </div>
          <div class="gap-bar">
            <div class="gap-fill" :style="{ width: g.actualPct + '%', background: g.color }"></div>
            <div class="gap-target" :style="{ left: g.idealPct + '%' }">
              <span class="gap-target-tick"></span>
            </div>
          </div>
          <div class="gap-advice" :style="{ color: g.status === 'ok' ? 'var(--text-2)' : STATUS_META[g.status].color }">
            {{ g.advice }}
          </div>
        </div>
      </div>

      <div v-if="gap.otherCount" class="gap-other muted">
        另有「其他/调料」类 {{ gap.otherCount }} 道，占 {{ gap.otherPct }}%，不计入三类目标占比
      </div>
      <div class="gap-legend muted">
        <span><i class="marker"></i> 竖线为目标占比</span>
        <span>参考比例 蛋白质 25% / 蔬菜 50% / 主食 25%</span>
      </div>
    </template>
  </div>
</template>

<style scoped>
.gap-summary {
  display: flex;
  align-items: center;
  gap: 8px;
  background: var(--warn-light);
  color: var(--text);
  border-radius: 8px;
  padding: 8px 12px;
  margin-bottom: 14px;
  font-size: 13px;
}
.gap-summary.balanced {
  background: var(--primary-light);
}
.gap-summary-icon {
  font-size: 15px;
}
.gap-rows {
  display: flex;
  flex-direction: column;
  gap: 14px;
}
.gap-row {
  display: flex;
  flex-direction: column;
  gap: 5px;
}
.gap-head {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}
.gap-name {
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: 6px;
}
.gap-icon {
  font-size: 15px;
}
.gap-count {
  font-size: 12px;
  font-weight: 400;
}
.gap-pct {
  font-size: 13px;
  display: flex;
  align-items: center;
  gap: 8px;
}
.status-chip {
  display: inline-flex;
  align-items: center;
  gap: 3px;
  font-size: 12px;
  font-weight: 600;
  padding: 1px 8px;
  border-radius: 10px;
  white-space: nowrap;
}
.gap-bar {
  position: relative;
  height: 14px;
  background: var(--surface-2);
  border-radius: 7px;
  overflow: hidden;
}
.gap-fill {
  height: 100%;
  border-radius: 7px;
  transition: width 0.3s ease;
}
.gap-target {
  position: absolute;
  top: -2px;
  bottom: -2px;
  width: 0;
}
.gap-target-tick {
  position: absolute;
  top: 0;
  bottom: 0;
  left: 0;
  width: 2px;
  background: var(--text);
  opacity: 0.55;
}
.gap-advice {
  font-size: 12px;
}
.gap-other {
  margin-top: 12px;
  font-size: 12px;
}
.gap-legend {
  margin-top: 10px;
  padding-top: 10px;
  border-top: 1px dashed var(--border);
  display: flex;
  justify-content: space-between;
  gap: 8px;
  flex-wrap: wrap;
  font-size: 11px;
}
.gap-legend .marker {
  display: inline-block;
  width: 2px;
  height: 10px;
  background: var(--text);
  opacity: 0.55;
  margin-right: 4px;
  vertical-align: -1px;
}
</style>

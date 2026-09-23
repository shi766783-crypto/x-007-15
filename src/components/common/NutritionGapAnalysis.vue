<script setup>
import { computed } from 'vue'
import { nutritionGap } from '@/utils/nutrition'
import BaseEmpty from '@/components/common/BaseEmpty.vue'

const props = defineProps({
  dishes: { type: Array, default: () => [] },
  emptyText: { type: String, default: '记录菜品后，这里会显示营养缺口' },
})

const gap = computed(() => nutritionGap(props.dishes))

function suggestedCount(row) {
  return Math.max(1, Math.ceil(Math.abs(row.diff) * gap.value.total))
}
</script>

<template>
  <div class="nutrition-gap">
    <BaseEmpty v-if="!gap.hasRecords" emoji="🥗" :text="emptyText" />

    <template v-else>
      <div class="advice">
        <div v-if="gap.balanced" class="advice-item balanced">
          <span class="badge keep">✓</span>
          <span>蛋白质、蔬菜、主食占比基本均衡，继续保持。</span>
        </div>
        <div v-for="row in gap.add" :key="`add-${row.key}`" class="advice-item">
          <span class="badge add">补</span>
          <span>
            建议增加 <b>{{ row.icon }} {{ row.key }}</b>：当前 {{ row.actualPercent }}%，目标
            {{ row.targetPercent }}%，少 {{ Math.abs(row.diffPercent) }} 个百分点，约
            {{ suggestedCount(row) }} 道。
          </span>
        </div>
        <div v-for="row in gap.reduce" :key="`reduce-${row.key}`" class="advice-item">
          <span class="badge reduce">减</span>
          <span v-if="row.key === '其他'">
            建议减少 <b>{{ row.icon }} 未归类菜品</b>：当前 {{ row.actualPercent }}%，约
            {{ suggestedCount(row) }} 道，可替换成缺口中的核心食物。
          </span>
          <span v-else>
            建议减少 <b>{{ row.icon }} {{ row.key }}</b>：当前 {{ row.actualPercent }}%，目标
            {{ row.targetPercent }}%，多 {{ row.diffPercent }} 个百分点，约
            {{ suggestedCount(row) }} 道。
          </span>
        </div>
      </div>

      <div class="ratio-list">
        <div v-for="row in gap.rows" :key="row.key" class="ratio-row" :class="row.status">
          <div class="ratio-head">
            <span class="name">
              <i :style="{ background: row.color + '22', color: row.color }">{{ row.icon }}</i>
              {{ row.key }}
            </span>
            <span class="nums">
              <b>{{ row.actualPercent }}%</b>
              <em>/ 目标 {{ row.targetPercent }}%</em>
              <small v-if="row.status === 'low'" class="low-text">少 {{ Math.abs(row.diffPercent) }}pp</small>
              <small v-else-if="row.status === 'high'" class="high-text">多 {{ row.diffPercent }}pp</small>
              <small v-else class="ok-text">达标</small>
            </span>
          </div>
          <div class="bar-track">
            <div class="actual-bar" :style="{ width: row.actualPercent + '%', background: row.color }"></div>
            <span class="target-mark" :style="{ left: row.targetPercent + '%' }"></span>
          </div>
          <div class="count-text">{{ row.count }} / {{ gap.total }} 道</div>
        </div>
      </div>
    </template>
  </div>
</template>

<style scoped>
.advice {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-bottom: 14px;
}
.advice-item {
  display: flex;
  align-items: flex-start;
  gap: 8px;
  padding: 8px 10px;
  border-radius: 8px;
  background: var(--surface-2);
  font-size: 13px;
}
.advice-item.balanced {
  background: var(--primary-light);
  color: var(--primary-dark);
}
.badge {
  flex: 0 0 auto;
  width: 22px;
  height: 22px;
  border-radius: 50%;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  font-weight: 700;
}
.badge.add {
  background: #2196f3;
  color: #fff;
}
.badge.reduce {
  background: #ef5350;
  color: #fff;
}
.badge.keep {
  background: var(--primary);
  color: #fff;
}
.ratio-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}
.ratio-head {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 8px;
  margin-bottom: 5px;
}
.name {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-weight: 600;
}
.name i {
  width: 24px;
  height: 24px;
  border-radius: 50%;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-style: normal;
  font-size: 13px;
}
.nums {
  display: inline-flex;
  align-items: baseline;
  gap: 5px;
  white-space: nowrap;
}
.nums b {
  font-size: 14px;
}
.nums em {
  color: var(--text-2);
  font-style: normal;
  font-size: 12px;
}
.nums small {
  font-size: 12px;
  font-weight: 600;
}
.low-text {
  color: #2196f3;
}
.high-text {
  color: #ef5350;
}
.ok-text {
  color: var(--primary);
}
.bar-track {
  position: relative;
  height: 9px;
  border-radius: 999px;
  background: var(--surface-2);
  overflow: visible;
}
.actual-bar {
  height: 100%;
  border-radius: 999px;
  transition: width 0.2s ease;
}
.target-mark {
  position: absolute;
  top: -3px;
  width: 2px;
  height: 15px;
  background: var(--text);
  border-radius: 1px;
  opacity: 0.72;
}
.count-text {
  margin-top: 4px;
  color: var(--text-2);
  font-size: 12px;
}
</style>

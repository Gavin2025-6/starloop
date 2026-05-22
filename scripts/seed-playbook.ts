/**
 * seed-playbook.ts
 * Pre-fills RecoveryPlaybook with 50+ standard response plans across all industries × problem types.
 * Run: npx ts-node scripts/seed-playbook.ts
 */
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env' });
dotenv.config({ path: '.env.local' });

import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '@prisma/client';

const connectionString = process.env.DATABASE_URL ?? '';
if (!connectionString) { console.error('DATABASE_URL not set'); process.exit(1); }
const adapter = new PrismaPg({ connectionString });
const prisma = new PrismaClient({ adapter } as any);

const playbooks = [
  // ── Dentistry ──
  { industry: 'dentist', problemCategory: 'WAITING_TIME', recommendedAction: '经理致电道歉 + 下次就诊提供优先预约', successRate: 0.65, avgRevenueRecovered: 800, notes: '等待>30min时最有效' },
  { industry: 'dentist', problemCategory: 'PRICE', recommendedAction: '发送详细账单说明 + 提供部分减免（10-15%）', successRate: 0.45, avgRevenueRecovered: 600, notes: '先解释再减免，顺序很重要' },
  { industry: 'dentist', problemCategory: 'ATTITUDE', recommendedAction: '院长亲自致电道歉 + 提供免费检查', successRate: 0.70, avgRevenueRecovered: 800, notes: '必须是高层出面才有效' },
  { industry: 'dentist', problemCategory: 'APPOINTMENT', recommendedAction: '立即重新预约 + 送等待补偿优惠券', successRate: 0.72, avgRevenueRecovered: 750, notes: '24小时内联系是关键' },
  { industry: 'dentist', problemCategory: 'QUALITY', recommendedAction: '免费重做 + 延长保修期至2年', successRate: 0.68, avgRevenueRecovered: 1200, notes: '质量投诉必须免费重做' },
  { industry: 'dentist', problemCategory: 'COMMUNICATION', recommendedAction: '指定专属前台联系人 + 短信跟进', successRate: 0.60, avgRevenueRecovered: 700, notes: '患者需要感受到被重视' },
  { industry: 'dentist', problemCategory: 'BILLING', recommendedAction: '提供分期付款方案 + 账单细化说明', successRate: 0.55, avgRevenueRecovered: 900, notes: '账单透明度是核心痛点' },

  // ── HVAC ──
  { industry: 'HVAC contractor', problemCategory: 'WAITING_TIME', recommendedAction: '折扣券（$50 off） + 经理道歉电话', successRate: 0.70, avgRevenueRecovered: 1500, notes: '夏季紧急单迟到要主动补偿' },
  { industry: 'HVAC contractor', problemCategory: 'PRICE', recommendedAction: '提供详细工时材料清单 + 部分退款（10%）', successRate: 0.50, avgRevenueRecovered: 1200, notes: '透明报价是最好的预防' },
  { industry: 'HVAC contractor', problemCategory: 'QUALITY', recommendedAction: '免费返工 + 一年保修延长', successRate: 0.75, avgRevenueRecovered: 2000, notes: '返工必须安排同一技术员' },
  { industry: 'HVAC contractor', problemCategory: 'COMMUNICATION', recommendedAction: '实时到达短信通知 + 完工照片报告', successRate: 0.65, avgRevenueRecovered: 1400, notes: '客户要知道技术员在哪里' },
  { industry: 'HVAC contractor', problemCategory: 'ATTITUDE', recommendedAction: '经理道歉 + 换技术员 + 服务券', successRate: 0.60, avgRevenueRecovered: 1200, notes: '必须保证不会是同一位技术员' },
  { industry: 'HVAC contractor', problemCategory: 'BILLING', recommendedAction: '逐项费用解释 + 超预算部分退款', successRate: 0.55, avgRevenueRecovered: 1100, notes: '签合同前报价必须详细' },

  // ── Plumber ──
  { industry: 'plumber', problemCategory: 'WAITING_TIME', recommendedAction: '道歉 + 下次免出诊费', successRate: 0.60, avgRevenueRecovered: 800, notes: '紧急维修迟到是最大投诉来源' },
  { industry: 'plumber', problemCategory: 'PRICE', recommendedAction: '逐项费用说明 + 5%折扣', successRate: 0.48, avgRevenueRecovered: 600, notes: '工时费解释清楚很重要' },
  { industry: 'plumber', problemCategory: 'QUALITY', recommendedAction: '免费返修 + 90天质保', successRate: 0.72, avgRevenueRecovered: 900, notes: '漏水问题必须当天处理' },

  // ── Roofing ──
  { industry: 'roofing contractor', problemCategory: 'QUALITY', recommendedAction: '免费检查 + 重铺保修区域 + 延保3年', successRate: 0.70, avgRevenueRecovered: 8000, notes: '屋顶质量问题客单价高，挽留值大' },
  { industry: 'roofing contractor', problemCategory: 'PRICE', recommendedAction: '材料成本明细 + 保险理赔协助', successRate: 0.52, avgRevenueRecovered: 5000, notes: '屋顶客户很多用保险，帮助理赔能化解' },
  { industry: 'roofing contractor', problemCategory: 'COMMUNICATION', recommendedAction: '每日施工进度照片 + 专属项目经理', successRate: 0.68, avgRevenueRecovered: 6000, notes: '大项目沟通透明度至关重要' },

  // ── Law Firm ──
  { industry: 'law firm', problemCategory: 'COMMUNICATION', recommendedAction: '合伙人亲自电话 + 每周案件进度报告', successRate: 0.75, avgRevenueRecovered: 5000, notes: '法律客户最怕感觉被忽视' },
  { industry: 'law firm', problemCategory: 'PRICE', recommendedAction: '详细账单说明 + 提供固定费率方案', successRate: 0.55, avgRevenueRecovered: 4000, notes: '按小时计费时账单必须透明' },
  { industry: 'law firm', problemCategory: 'ATTITUDE', recommendedAction: '合伙人介入 + 更换负责律师', successRate: 0.70, avgRevenueRecovered: 5000, notes: '更换律师要主动提出，不要等客户要求' },
  { industry: 'law firm', problemCategory: 'QUALITY', recommendedAction: '案件复审 + 部分退款', successRate: 0.45, avgRevenueRecovered: 3000, notes: '律师质量投诉最难处理' },

  // ── Car Dealership ──
  { industry: 'car dealership', problemCategory: 'ATTITUDE', recommendedAction: '经理介入 + 免费保养服务券', successRate: 0.55, avgRevenueRecovered: 35000, notes: '汽车客单价最高，挽留ROI极大' },
  { industry: 'car dealership', problemCategory: 'PRICE', recommendedAction: '价格匹配承诺 + 附加服务包', successRate: 0.50, avgRevenueRecovered: 30000, notes: '比竞争对手价格高时必须有额外价值' },
  { industry: 'car dealership', problemCategory: 'QUALITY', recommendedAction: '免费检修 + 延长保修 + 代步车', successRate: 0.65, avgRevenueRecovered: 28000, notes: '提供代步车可大幅提升满意度' },
  { industry: 'car dealership', problemCategory: 'WAITING_TIME', recommendedAction: '优先服务通道 + 免费洗车补偿', successRate: 0.62, avgRevenueRecovered: 25000, notes: '快速通道是最低成本的补偿方式' },
  { industry: 'car dealership', problemCategory: 'COMMUNICATION', recommendedAction: '专属服务顾问 + 维修进度实时短信', successRate: 0.68, avgRevenueRecovered: 27000, notes: '服务部门沟通差是最大投诉类别' },

  // ── Auto Repair ──
  { industry: 'auto repair shop', problemCategory: 'PRICE', recommendedAction: '工时材料费用说明 + 下次5%折扣', successRate: 0.50, avgRevenueRecovered: 600, notes: '透明报价是最好的防范' },
  { industry: 'auto repair shop', problemCategory: 'QUALITY', recommendedAction: '免费重修 + 延长零件保修', successRate: 0.70, avgRevenueRecovered: 800, notes: '同一技术员返修可提升信任' },
  { industry: 'auto repair shop', problemCategory: 'WAITING_TIME', recommendedAction: '免费换机油或$25服务券', successRate: 0.58, avgRevenueRecovered: 500, notes: '预约制可有效减少等待投诉' },

  // ── Property Management ──
  { industry: 'property management company', problemCategory: 'WAITING_TIME', recommendedAction: '维修优先安排 + 48小时响应承诺 + 进度更新', successRate: 0.60, avgRevenueRecovered: 15000, notes: '租户合同价值高，一个租户=多年收入' },
  { industry: 'property management company', problemCategory: 'COMMUNICATION', recommendedAction: '专属物业联系人 + 每月状态更新', successRate: 0.65, avgRevenueRecovered: 12000, notes: '透明沟通是物业投诉第一解法' },
  { industry: 'property management company', problemCategory: 'QUALITY', recommendedAction: '免费重修 + 第三方验收', successRate: 0.58, avgRevenueRecovered: 10000, notes: '引入第三方验收增加公信力' },
  { industry: 'property management company', problemCategory: 'ATTITUDE', recommendedAction: '更换物业经理 + 书面道歉', successRate: 0.55, avgRevenueRecovered: 9000, notes: '人员问题必须有人事行动' },

  // ── Spa ──
  { industry: 'day spa', problemCategory: 'QUALITY', recommendedAction: '免费重做服务 + 全额退款选一', successRate: 0.80, avgRevenueRecovered: 500, notes: '美容服务质量投诉最容易解决' },
  { industry: 'day spa', problemCategory: 'ATTITUDE', recommendedAction: '经理道歉 + 免费护理项目', successRate: 0.72, avgRevenueRecovered: 450, notes: '美容客户对体验要求高' },
  { industry: 'day spa', problemCategory: 'WAITING_TIME', recommendedAction: '致歉 + 下次免费升级服务', successRate: 0.68, avgRevenueRecovered: 400, notes: '预约延误要主动升级补偿' },
  { industry: 'day spa', problemCategory: 'PRICE', recommendedAction: '套餐优惠 + 会员折扣', successRate: 0.55, avgRevenueRecovered: 350, notes: '转化为会员是最佳结果' },

  // ── Hair Salon ──
  { industry: 'hair salon', problemCategory: 'QUALITY', recommendedAction: '免费重做 + 资深发型师补救', successRate: 0.78, avgRevenueRecovered: 300, notes: '必须立刻预约重做，不能让客户自己等' },
  { industry: 'hair salon', problemCategory: 'ATTITUDE', recommendedAction: '老板道歉 + 免费护发护理', successRate: 0.70, avgRevenueRecovered: 280, notes: '小店老板亲自道歉效果最好' },
  { industry: 'hair salon', problemCategory: 'WAITING_TIME', recommendedAction: '道歉 + 本次优惠10%', successRate: 0.65, avgRevenueRecovered: 250, notes: '等待超20分钟必须主动补偿' },

  // ── Gym / Fitness ──
  { industry: 'gym fitness center', problemCategory: 'ATTITUDE', recommendedAction: '经理道歉 + 一个月会费减免', successRate: 0.70, avgRevenueRecovered: 600, notes: '健身房态度投诉主要针对前台和教练' },
  { industry: 'gym fitness center', problemCategory: 'QUALITY', recommendedAction: '免费私教课 + 设备修复承诺', successRate: 0.65, avgRevenueRecovered: 550, notes: '设备损坏要立刻修复并通报全体会员' },
  { industry: 'gym fitness center', problemCategory: 'PRICE', recommendedAction: '会员升级优惠 + 推荐返利', successRate: 0.52, avgRevenueRecovered: 480, notes: '年卡转月卡是常见解决方案' },

  // ── Chiropractor ──
  { industry: 'chiropractor', problemCategory: 'APPOINTMENT', recommendedAction: '优先预约时段 + 10%就诊折扣', successRate: 0.65, avgRevenueRecovered: 300, notes: '脊椎治疗需要频繁复诊，留住就是长期收入' },
  { industry: 'chiropractor', problemCategory: 'QUALITY', recommendedAction: '免费复诊评估 + 更换医生', successRate: 0.60, avgRevenueRecovered: 350, notes: '治疗效果投诉需要医生亲自跟进' },
  { industry: 'chiropractor', problemCategory: 'WAITING_TIME', recommendedAction: '道歉 + 优先预约权', successRate: 0.62, avgRevenueRecovered: 280, notes: '等待超15分钟要主动通知' },
  { industry: 'chiropractor', problemCategory: 'ATTITUDE', recommendedAction: '医生道歉电话 + 免费评估', successRate: 0.68, avgRevenueRecovered: 300, notes: '医疗行业的态度投诉要医生亲自处理' },

  // ── Optometrist ──
  { industry: 'optometrist', problemCategory: 'WAITING_TIME', recommendedAction: '道歉 + 优先预约 + 购镜优惠$20', successRate: 0.60, avgRevenueRecovered: 400, notes: '验光等待投诉多为新客户' },
  { industry: 'optometrist', problemCategory: 'QUALITY', recommendedAction: '免费重新验光 + 更换眼镜片', successRate: 0.72, avgRevenueRecovered: 500, notes: '眼镜质量问题必须免费更换' },
  { industry: 'optometrist', problemCategory: 'PRICE', recommendedAction: '价格匹配 + 眼镜框折扣', successRate: 0.50, avgRevenueRecovered: 380, notes: '隐形眼镜价格透明化可防止投诉' },

  // ── Veterinary ──
  { industry: 'veterinary clinic', problemCategory: 'PRICE', recommendedAction: '费用明细说明 + 提供分期付款', successRate: 0.60, avgRevenueRecovered: 400, notes: '宠物主人愿意付费但需要费用透明' },
  { industry: 'veterinary clinic', problemCategory: 'ATTITUDE', recommendedAction: '兽医道歉 + 免费复诊', successRate: 0.65, avgRevenueRecovered: 350, notes: '宠物主人情感投入高，态度问题要快速响应' },
  { industry: 'veterinary clinic', problemCategory: 'WAITING_TIME', recommendedAction: '道歉 + 优先预约 + 小礼品', successRate: 0.58, avgRevenueRecovered: 300, notes: '宠物医院等待投诉送小礼物效果好' },
  { industry: 'veterinary clinic', problemCategory: 'COMMUNICATION', recommendedAction: '术后进度短信更新 + 医生直线电话', successRate: 0.68, avgRevenueRecovered: 380, notes: '手术期间宠物主人急需沟通' },

  // ── Insurance ──
  { industry: 'insurance agent', problemCategory: 'COMMUNICATION', recommendedAction: '专属客户代理人 + 每季度主动联系', successRate: 0.65, avgRevenueRecovered: 1200, notes: '保险客户续约依赖关系维护' },
  { industry: 'insurance agent', problemCategory: 'BILLING', recommendedAction: '保单费用详细解释 + 降级方案', successRate: 0.52, avgRevenueRecovered: 900, notes: '续费时主动联系可防止投诉' },

  // ── Mortgage Broker ──
  { industry: 'mortgage broker', problemCategory: 'COMMUNICATION', recommendedAction: '每周贷款进度更新 + 经纪人直线', successRate: 0.72, avgRevenueRecovered: 3000, notes: '房贷客户最焦虑，沟通是核心' },
  { industry: 'mortgage broker', problemCategory: 'WAITING_TIME', recommendedAction: '加急处理 + 每日进度更新', successRate: 0.68, avgRevenueRecovered: 2800, notes: '贷款审批时间是最大焦虑源' },
];

async function main() {
  console.log('开始预填充 RecoveryPlaybook...');

  let inserted = 0;
  let skipped = 0;

  for (const entry of playbooks) {
    try {
      await (prisma as any).recoveryPlaybook.upsert({
        where: {
          // Use a compound unique if available, otherwise create
          id: `${entry.industry}-${entry.problemCategory}`.replace(/\s+/g, '-').toLowerCase(),
        },
        update: {
          recommendedAction: entry.recommendedAction,
          successRate: entry.successRate,
          avgRevenueRecovered: entry.avgRevenueRecovered,
          notes: entry.notes,
        },
        create: {
          id: `${entry.industry}-${entry.problemCategory}`.replace(/\s+/g, '-').toLowerCase(),
          industry: entry.industry,
          problemCategory: entry.problemCategory as any,
          recommendedAction: entry.recommendedAction,
          successRate: entry.successRate,
          avgRevenueRecovered: entry.avgRevenueRecovered,
          notes: entry.notes,
          totalAttempts: 0,
          updatedAt: new Date(),
        },
      });
      inserted++;
      console.log(`  ✓ ${entry.industry} × ${entry.problemCategory}`);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      // If id-based upsert fails, try createMany-style insert
      try {
        await (prisma as any).recoveryPlaybook.create({
          data: {
            industry: entry.industry,
            problemCategory: entry.problemCategory as any,
            recommendedAction: entry.recommendedAction,
            successRate: entry.successRate,
            avgRevenueRecovered: entry.avgRevenueRecovered,
            notes: entry.notes,
            totalAttempts: 0,
            updatedAt: new Date(),
          },
        });
        inserted++;
        console.log(`  ✓ ${entry.industry} × ${entry.problemCategory} (created)`);
      } catch {
        console.log(`  ⏭ ${entry.industry} × ${entry.problemCategory} — skipped (${msg.slice(0, 60)})`);
        skipped++;
      }
    }
  }

  console.log(`\nRecoveryPlaybook预填充完成，共 ${inserted} 条，跳过 ${skipped} 条`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());

export interface LifecycleTemplate {
  day: number;
  title: string;
  en: string;
  zh: string;
}

export interface IndustryTemplates {
  industry: string;
  templates: LifecycleTemplate[];
}

export const LIFECYCLE_TEMPLATES: IndustryTemplates[] = [
  {
    industry: "Cleaning",
    templates: [
      {
        day: 7,
        title: "Post-Service Check-in",
        en: "Hi {name}, we hope you're enjoying your freshly cleaned space! How did everything look? We'd love to hear your feedback.",
        zh: "您好 {name}，希望您喜欢整洁的空间！一切都满意吗？我们很乐意听取您的意见。",
      },
      {
        day: 30,
        title: "Monthly Rebooking",
        en: "Hi {name}, it's been a month since your last clean! Ready to schedule your next appointment? Reply YES and we'll get you booked.",
        zh: "您好 {name}，距上次保洁已有一个月了！准备好预约下次服务了吗？回复YES即可预订。",
      },
      {
        day: 90,
        title: "Seasonal Deep Clean Offer",
        en: "Hi {name}, spring/fall is the perfect time for a deep clean! Book this month and get 10% off your deep clean service.",
        zh: "您好 {name}，这个季节非常适合深度清洁！本月预约可享9折优惠。",
      },
    ],
  },
  {
    industry: "HVAC",
    templates: [
      {
        day: 14,
        title: "System Check Follow-up",
        en: "Hi {name}, how has your system been running since our visit? Any concerns or questions? We're here to help!",
        zh: "您好 {name}，自我们上次维修以来，您的系统运行情况如何？有任何问题请随时告知！",
      },
      {
        day: 90,
        title: "Seasonal Maintenance Reminder",
        en: "Hi {name}, with the season changing, it's time for your HVAC tune-up. Book now to avoid peak season delays!",
        zh: "您好 {name}，季节变换，该做暖通设备保养了。立即预约，避免旺季等待！",
      },
      {
        day: 180,
        title: "Annual Service Reminder",
        en: "Hi {name}, your annual HVAC service is due. Regular maintenance extends system life and improves efficiency. Book today!",
        zh: "您好 {name}，您的年度暖通维护即将到期。定期保养可延长设备寿命并提升效率，立即预约！",
      },
    ],
  },
  {
    industry: "Nails & Beauty",
    templates: [
      {
        day: 3,
        title: "Same-Week Check-in",
        en: "Hi {name}, hope you're loving your new look! Share a photo and tag us — we'd love to see it!",
        zh: "您好 {name}，希望您喜欢新造型！分享照片并标记我们——我们很想看看！",
      },
      {
        day: 21,
        title: "Rebooking Reminder",
        en: "Hi {name}, nails typically last 2-3 weeks! Ready for a fresh set? Book now and mention this message for a free nail art accent.",
        zh: "您好 {name}，美甲通常持续2-3周！准备好换新款了吗？预约时提及此信息，可获免费美甲装饰。",
      },
      {
        day: 60,
        title: "Loyalty Reward",
        en: "Hi {name}, you're one of our valued regulars! Enjoy 15% off your next full-service appointment as our thank you.",
        zh: "您好 {name}，您是我们的忠实顾客！下次全套服务享85折优惠，感谢您的支持。",
      },
    ],
  },
  {
    industry: "Auto Detailing",
    templates: [
      {
        day: 7,
        title: "Post-Detail Satisfaction Check",
        en: "Hi {name}, how's your vehicle looking after the detail? We'd love to know — and if anything wasn't perfect, we'll make it right.",
        zh: "您好 {name}，爱车洗美容后效果如何？请告诉我们——如有不满意的地方，我们会负责到底。",
      },
      {
        day: 45,
        title: "Next Detail Reminder",
        en: "Hi {name}, it's been about 6 weeks since your last detail. Keep your vehicle looking showroom fresh — book your next appointment!",
        zh: "您好 {name}，距上次美容已约6周。让您的爱车保持展厅级光泽——立即预约下次服务！",
      },
      {
        day: 120,
        title: "Seasonal Package Offer",
        en: "Hi {name}, protect your vehicle this season with our premium package. Book this month for priority scheduling and a complimentary interior wipe-down.",
        zh: "您好 {name}，用我们的高级套餐保护您的爱车度过这个季节。本月预约可优先排期并附赠内饰擦拭服务。",
      },
    ],
  },
  {
    industry: "Restaurant",
    templates: [
      {
        day: 1,
        title: "Thank You for Dining",
        en: "Hi {name}, thank you for dining with us yesterday! We hope you enjoyed every bite. We'd love to see you again soon!",
        zh: "您好 {name}，感谢您昨天光临！希望您享受了每一口美食，期待您再次光顾！",
      },
      {
        day: 14,
        title: "Special Event Invitation",
        en: "Hi {name}, we're hosting a special tasting event this weekend! As a valued guest, you're invited. Reply to reserve your spot.",
        zh: "您好 {name}，我们本周末将举办特别品鉴活动！作为尊贵客人，诚邀您参加。回复即可预订席位。",
      },
      {
        day: 30,
        title: "Monthly Special Offer",
        en: "Hi {name}, we miss you! Come back this week and enjoy 20% off your next meal. Show this message to your server.",
        zh: "您好 {name}，我们想念您！本周光临可享8折优惠，向服务员出示此信息即可。",
      },
    ],
  },
  {
    industry: "Auto Repair",
    templates: [
      {
        day: 3,
        title: "Repair Follow-up",
        en: "Hi {name}, how's your vehicle running after the repair? Please let us know if anything feels off — we stand behind our work.",
        zh: "您好 {name}，维修后您的爱车运行如何？如有任何异常请告知——我们对维修质量负责。",
      },
      {
        day: 90,
        title: "Oil Change Reminder",
        en: "Hi {name}, it's time for your next oil change! Regular maintenance keeps your engine running smoothly. Book now for a quick appointment.",
        zh: "您好 {name}，该换机油了！定期保养让发动机保持最佳状态，立即预约快速服务。",
      },
      {
        day: 180,
        title: "Safety Inspection Reminder",
        en: "Hi {name}, have you had your vehicle safety inspection done this year? We're offering priority booking for returning customers.",
        zh: "您好 {name}，今年的车辆安全检查做了吗？我们为老客户提供优先预约服务。",
      },
    ],
  },
  {
    industry: "Beauty Salon",
    templates: [
      {
        day: 5,
        title: "Style Check-in",
        en: "Hi {name}, hope you're loving your new style! Don't forget to take care of it — ask us anytime for maintenance tips.",
        zh: "您好 {name}，希望您喜欢新发型！记得好好护理——随时询问我们维护建议。",
      },
      {
        day: 30,
        title: "Appointment Reminder",
        en: "Hi {name}, it's been about a month — time to refresh your look! Book your next appointment and mention this message for 10% off.",
        zh: "您好 {name}，大约一个月了——该焕新形象了！预约时提及此信息可享9折。",
      },
      {
        day: 60,
        title: "Loyalty Offer",
        en: "Hi {name}, as a loyal customer, you've earned a complimentary deep conditioning treatment on your next visit. Book now!",
        zh: "您好 {name}，作为忠实顾客，您下次到访可享免费深层护发待遇。立即预约！",
      },
    ],
  },
  {
    industry: "Pharmacy",
    templates: [
      {
        day: 7,
        title: "Prescription Refill Reminder",
        en: "Hi {name}, it's been a week since your last pickup. Need a refill? We can have it ready in under an hour — just let us know.",
        zh: "您好 {name}，距上次取药已一周。需要续药吗？我们可在一小时内备好——请告知。",
      },
      {
        day: 30,
        title: "Monthly Check-in",
        en: "Hi {name}, checking in to see if you need any prescriptions filled this month. We're here for all your medication needs!",
        zh: "您好 {name}，想了解您本月是否需要配药。我们随时为您的用药需求服务！",
      },
      {
        day: 90,
        title: "Health Review Invitation",
        en: "Hi {name}, our pharmacist offers free medication reviews for regular customers. Would you like to schedule a quick consultation?",
        zh: "您好 {name}，我们的药剂师为老客户提供免费用药评估。是否需要预约快速咨询？",
      },
    ],
  },
  {
    industry: "Landscaping",
    templates: [
      {
        day: 7,
        title: "Post-Service Satisfaction",
        en: "Hi {name}, hope you're enjoying your freshly landscaped yard! How does everything look? We'd love your feedback.",
        zh: "您好 {name}，希望您喜欢新整理的庭院！一切看起来如何？我们期待您的反馈。",
      },
      {
        day: 30,
        title: "Monthly Maintenance Reminder",
        en: "Hi {name}, your lawn and garden are likely ready for their monthly attention! Book this week for our best scheduling availability.",
        zh: "您好 {name}，您的草坪和花园大概需要每月维护了！本周预约可获最佳排期。",
      },
      {
        day: 90,
        title: "Seasonal Service Package",
        en: "Hi {name}, prepare your property for the new season with our comprehensive care package. Book now for early bird pricing!",
        zh: "您好 {name}，用我们的综合养护套餐迎接新季节。立即预约享早鸟优惠！",
      },
    ],
  },
  {
    industry: "Plumbing",
    templates: [
      {
        day: 3,
        title: "Repair Follow-up",
        en: "Hi {name}, checking in after your recent plumbing service. Is everything working as expected? Let us know if you have any concerns.",
        zh: "您好 {name}，跟进您最近的管道服务情况。一切运转正常吗？如有疑虑请告知。",
      },
      {
        day: 60,
        title: "Preventative Maintenance Offer",
        en: "Hi {name}, regular plumbing checks prevent costly emergencies. Book a preventative inspection this month at no extra charge for returning customers.",
        zh: "您好 {name}，定期管道检查可防止昂贵的紧急情况。本月预约预防性检查，老客户免额外费用。",
      },
      {
        day: 180,
        title: "Annual System Check",
        en: "Hi {name}, time for your annual plumbing system check! We'll inspect all fixtures, pipes, and water heater. Book before the cold season hits.",
        zh: "您好 {name}，该做年度管道系统检查了！我们将检查所有设备、管道和热水器。在寒冷季节前预约。",
      },
    ],
  },
];

export function getTemplatesByIndustry(industry: string): LifecycleTemplate[] {
  const match = LIFECYCLE_TEMPLATES.find(
    (t) => t.industry.toLowerCase() === industry.toLowerCase()
  );
  return match?.templates ?? [];
}

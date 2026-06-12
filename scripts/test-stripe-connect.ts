import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2026-04-22.dahlia' as any,
});

async function testStripeConnect() {
  console.log('=== Stripe Connect 端到端测试 ===\n');

  // 1. 测试创建 Express 账户
  console.log('1. 创建测试 Express 账户...');
  try {
    const account = await stripe.accounts.create({
      type: 'express',
      country: 'CA',
      capabilities: {
        card_payments: { requested: true },
        transfers: { requested: true },
      },
    });
    console.log('✅ Express 账户创建成功:', account.id);

    // 2. 测试生成 onboarding link
    console.log('\n2. 生成 onboarding link...');
    const accountLink = await stripe.accountLinks.create({
      account: account.id,
      refresh_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/settings?tab=payments&refresh=true`,
      return_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/settings?tab=payments&success=true`,
      type: 'account_onboarding',
    });
    console.log('✅ Onboarding link 生成成功');
    console.log('   URL:', accountLink.url);
    console.log('   过期时间:', new Date(accountLink.expires_at * 1000).toISOString());

    // 3. 测试创建 Payment Link（模拟 Mark Complete）
    console.log('\n3. 测试创建 Payment Link...');

    const product = await stripe.products.create({
      name: 'Test Job - Furnace Repair',
    });

    const price = await stripe.prices.create({
      product: product.id,
      unit_amount: 20000, // $200.00
      currency: 'cad',
    });

    // 用 destination charge 创建 payment link
    const paymentLink = await stripe.paymentLinks.create({
      line_items: [{ price: price.id, quantity: 1 }],
      payment_intent_data: {
        application_fee_amount: 200, // $2.00 = 1%
        transfer_data: {
          destination: account.id,
        },
      },
    });
    console.log('✅ Payment Link 创建成功');
    console.log('   URL:', paymentLink.url);
    console.log('   Active:', paymentLink.active);

    // 4. 清理测试数据
    console.log('\n4. 清理测试数据...');
    await stripe.accounts.del(account.id);
    console.log('✅ 测试账户已删除');

    console.log('\n=== 测试通过 ✅ ===');
    console.log('Stripe Connect 配置正确，可以进行收款。');

  } catch (error: any) {
    console.error('❌ 测试失败:', error.message);
    console.error('错误码:', error.code);
    console.error('错误类型:', error.type);

    if (error.code === 'account_invalid') {
      console.error('\n诊断：Stripe Connect 平台功能未开启');
      console.error('解决：去 dashboard.stripe.com/settings/connect 开启 Connect');
    }
    if (error.type === 'StripeAuthenticationError') {
      console.error('\n诊断：STRIPE_SECRET_KEY 无效或权限不足');
    }

    process.exit(1);
  }
}

testStripeConnect();

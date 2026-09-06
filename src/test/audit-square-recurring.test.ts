import { describe,it,expect } from 'vitest';
import { squareConfig,validCatalog,recurringCheckout,paidSubscription } from '../../supabase/functions/_shared/square';
const c={token:'mock',base:'https://example.test',merchant:'merchant',location:'location',variation:'variation'};
describe('Square recurring contract',()=>{
 it('fails closed without explicit environment and configuration',()=>expect(()=>squareConfig(()=>undefined)).toThrow());
 it('uses plan variation rather than one-time quick pay',()=>{const p=recurringCheckout(c,'stable');expect(p.checkout_options.subscription_plan_id).toBe('variation');expect(p.idempotency_key).toBe('stable');expect(p.quick_pay.price_money.amount).toBe(29999);});
 it('validates merchant, exact monthly static price and indefinite cadence',()=>{
 const location={id:'location',merchant_id:'merchant',status:'ACTIVE',currency:'USD'};
 const o={id:'variation',type:'SUBSCRIPTION_PLAN_VARIATION',present_at_all_locations:true,subscription_plan_variation_data:{phases:[{cadence:'MONTHLY',pricing:{type:'STATIC',price_money:{amount:29999,currency:'USD'}}}]}};
 expect(validCatalog(c,o,location)).toBe(true);
 expect(validCatalog(c,o,{...location,merchant_id:'foreign'})).toBe(false);
 o.subscription_plan_variation_data.phases[0].cadence='ANNUAL';expect(validCatalog(c,o,location)).toBe(false);
 });
 it('does not equate active/invoiced with paid and rejects refund or wrong amount',()=>{
 const sub={id:'s',plan_variation_id:'variation',location_id:'location',status:'ACTIVE',invoice_ids:['i'],customer_id:'customer'};
 const invoice={id:'i',subscription_id:'s',status:'PAID',order_id:'o'};
 const order={id:'o',location_id:'location',total_money:{amount:29999,currency:'USD'}};
 const payment={order_id:'o',location_id:'location',status:'COMPLETED',amount_money:order.total_money,customer_id:'customer'};
 expect(paidSubscription(c,sub,invoice,order,payment)).toBe(true);
 expect(paidSubscription(c,sub,{...invoice,status:'UNPAID'},order,payment)).toBe(false);
 expect(paidSubscription(c,sub,invoice,order,{...payment,refunded_money:{amount:1}})).toBe(false);
 expect(paidSubscription(c,sub,invoice,order,{...payment,customer_id:'other'})).toBe(false);
 });
});

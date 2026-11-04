import test from 'node:test';
import assert from 'node:assert';
import { formatListingPrice, listingTypeOf, isRental } from '../src/utils/listingPrice.js';

test('sale listings show the sale price', () => {
  assert.strictEqual(formatListingPrice({ price: 5500000 }), '₹55 lakh');
  assert.strictEqual(formatListingPrice({ listing_type: 'sale', price: 27000000 }), '₹2.7 crore');
  assert.strictEqual(formatListingPrice({ price: null }), null);
});

test('rent / lease listings show the monthly rent (+ deposit)', () => {
  assert.strictEqual(formatListingPrice({ listing_type: 'rent', monthly_rent: '18000.00', security_deposit: '36000.00' }), '₹18,000/month + ₹36,000 deposit');
  assert.strictEqual(formatListingPrice({ listing_type: 'rent', monthly_rent: 18000, security_deposit: 36000 }, { withDeposit: false }), '₹18,000/month');
  assert.strictEqual(formatListingPrice({ listing_type: 'lease', monthly_rent: 250000 }), '₹2.5 lakh/month');
  assert.strictEqual(formatListingPrice({ listing_type: 'rent', price: 5000000 }), null, 'never a sale price on a rental');
});

test('the API\'s ready-made price_display wins', () => {
  assert.strictEqual(formatListingPrice({ listing_type: 'rent', monthly_rent: 1, price_display: '₹9/month' }), '₹9/month');
});

test('listing type defaults to sale for old listings', () => {
  assert.strictEqual(listingTypeOf({}), 'sale');
  assert.strictEqual(listingTypeOf({ listing_type: 'lease' }), 'lease');
  assert.ok(isRental({ listing_type: 'rent' }));
  assert.ok(!isRental({ listing_type: 'bogus' }));
});

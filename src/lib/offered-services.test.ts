import assert from 'node:assert/strict';
import { test } from 'node:test';
import { isServiceOffered } from './offered-services';

test('services require an assigned provider, while missing assignments default to all services', () => {
  const assignments = [
    { memberKey: 'owner', serviceIds: '["hair"]' },
    { memberKey: 'member', serviceIds: '["nails"]' },
    { memberKey: 'deleted', serviceIds: '["massage"]' },
  ];
  assert.equal(isServiceOffered('hair', ['owner', 'member'], assignments), true);
  assert.equal(isServiceOffered('nails', ['owner', 'member'], assignments), true);
  assert.equal(isServiceOffered('massage', ['owner', 'member'], assignments), false);
  assert.equal(isServiceOffered('massage', ['owner', 'member', 'new'], assignments), true);
  assert.equal(isServiceOffered('hair', ['owner'], [{ memberKey: 'owner', serviceIds: 'invalid' }]), false);
  assert.equal(isServiceOffered('hair', ['owner'], [{ memberKey: 'owner', serviceIds: '[]' }]), false);
});
